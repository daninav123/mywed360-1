package com.maloveapp.billing

import android.app.Activity
import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.android.billingclient.api.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * BillingManager - Gestor completo de Google Play Billing
 * 
 * Funcionalidades:
 * - Conexión con Google Play
 * - Carga de productos
 * - Compra de productos one-time y suscripciones
 * - Verificación con backend
 * - Manejo de estados de compra
 */
class BillingManager(private val context: Context) {

    // BillingClient instance
    private lateinit var billingClient: BillingClient

    // LiveData para productos
    private val _products = MutableLiveData<List<ProductDetails>>()
    val products: LiveData<List<ProductDetails>> = _products

    // LiveData para compras activas
    private val _purchases = MutableLiveData<List<Purchase>>()
    val purchases: LiveData<List<Purchase>> = _purchases

    // LiveData para estado de conexión
    private val _connectionState = MutableLiveData<BillingConnectionState>()
    val connectionState: LiveData<BillingConnectionState> = _connectionState

    // LiveData para errores
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage

    // Product IDs
    companion object {
        // Parejas (one-time)
        const val WEDDING_PASS = "wedding_pass"
        const val WEDDING_PASS_PLUS = "wedding_pass_plus"

        // Planners (subscriptions)
        const val PLANNER_PACK5 = "planner_pack5"
        const val PLANNER_PACK15 = "planner_pack15"
        const val TEAMS40 = "teams40"
        const val TEAMS_UNLIMITED = "teams_unlimited"

        // Base Plan IDs
        const val BASE_PLAN_MONTHLY = "monthly"
        const val BASE_PLAN_ANNUAL = "annual"

        // Backend URL
        private const val BACKEND_URL = "https://api.maloveapp.com"
    }

    enum class BillingConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        FAILED
    }

    /**
     * Inicializa el BillingClient
     */
    fun initialize() {
        _connectionState.value = BillingConnectionState.CONNECTING

        billingClient = BillingClient.newBuilder(context)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases()
            .build()

        connectToGooglePlay()
    }

    /**
     * Conecta con Google Play
     */
    private fun connectToGooglePlay() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    println("✅ Conectado a Google Play Billing")
                    _connectionState.value = BillingConnectionState.CONNECTED

                    // Cargar productos y compras
                    queryProducts()
                    queryPurchases()
                } else {
                    println("❌ Error conectando: ${billingResult.debugMessage}")
                    _connectionState.value = BillingConnectionState.FAILED
                    _errorMessage.value = billingResult.debugMessage
                }
            }

            override fun onBillingServiceDisconnected() {
                println("⚠️ Desconectado de Google Play")
                _connectionState.value = BillingConnectionState.DISCONNECTED
                // Reintentar conexión
                connectToGooglePlay()
            }
        })
    }

    /**
     * Carga productos desde Google Play
     */
    fun queryProducts() {
        // Productos one-time
        val inAppProductList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(WEDDING_PASS)
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(WEDDING_PASS_PLUS)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        )

        // Productos de suscripción
        val subscriptionProductList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PLANNER_PACK5)
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PLANNER_PACK15)
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(TEAMS40)
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(TEAMS_UNLIMITED)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )

        // Query one-time products
        val inAppParams = QueryProductDetailsParams.newBuilder()
            .setProductList(inAppProductList)
            .build()

        billingClient.queryProductDetailsAsync(inAppParams) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                println("✅ Productos one-time cargados: ${productDetailsList.size}")
                _products.value = productDetailsList

                // Ahora cargar suscripciones
                querySubscriptions(subscriptionProductList)
            } else {
                println("❌ Error cargando productos: ${billingResult.debugMessage}")
                _errorMessage.value = billingResult.debugMessage
            }
        }
    }

    /**
     * Carga productos de suscripción
     */
    private fun querySubscriptions(subscriptionList: List<QueryProductDetailsParams.Product>) {
        val subsParams = QueryProductDetailsParams.newBuilder()
            .setProductList(subscriptionList)
            .build()

        billingClient.queryProductDetailsAsync(subsParams) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                println("✅ Suscripciones cargadas: ${productDetailsList.size}")
                
                // Combinar con productos existentes
                val currentProducts = _products.value.orEmpty()
                _products.value = currentProducts + productDetailsList
            } else {
                println("❌ Error cargando suscripciones: ${billingResult.debugMessage}")
            }
        }
    }

    /**
     * Query compras existentes
     */
    fun queryPurchases() {
        // Query one-time purchases
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        ) { billingResult, purchasesList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                println("📦 Compras one-time: ${purchasesList.size}")
                _purchases.value = purchasesList

                // Query subscriptions
                querySubscriptionPurchases()
            }
        }
    }

    /**
     * Query suscripciones activas
     */
    private fun querySubscriptionPurchases() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        ) { billingResult, purchasesList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                println("📦 Suscripciones activas: ${purchasesList.size}")
                
                // Combinar con compras existentes
                val currentPurchases = _purchases.value.orEmpty()
                _purchases.value = currentPurchases + purchasesList
            }
        }
    }

    /**
     * Compra un producto one-time
     */
    fun purchaseInAppProduct(activity: Activity, productDetails: ProductDetails) {
        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .build()
        )

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        val billingResult = billingClient.launchBillingFlow(activity, billingFlowParams)

        if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            println("❌ Error iniciando compra: ${billingResult.debugMessage}")
            _errorMessage.value = billingResult.debugMessage
        } else {
            println("🛒 Iniciando compra: ${productDetails.name}")
        }
    }

    /**
     * Compra una suscripción
     */
    fun purchaseSubscription(
        activity: Activity,
        productDetails: ProductDetails,
        basePlanId: String = BASE_PLAN_MONTHLY
    ) {
        // Buscar el offer para el base plan específico
        val offerToken = productDetails.subscriptionOfferDetails
            ?.firstOrNull { it.basePlanId == basePlanId }
            ?.offerToken

        if (offerToken == null) {
            println("❌ No se encontró offer para base plan: $basePlanId")
            _errorMessage.value = "Oferta no disponible"
            return
        }

        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()
        )

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        val billingResult = billingClient.launchBillingFlow(activity, billingFlowParams)

        if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            println("❌ Error iniciando suscripción: ${billingResult.debugMessage}")
            _errorMessage.value = billingResult.debugMessage
        } else {
            println("🛒 Iniciando suscripción: ${productDetails.name} ($basePlanId)")
        }
    }

    /**
     * Listener de actualizaciones de compras
     */
    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            println("✅ Compra exitosa: ${purchases.size} producto(s)")
            
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            println("⏸️ Compra cancelada por usuario")
        } else {
            println("❌ Error en compra: ${billingResult.debugMessage}")
            _errorMessage.value = billingResult.debugMessage
        }
    }

    /**
     * Procesa una compra
     */
    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            // Verificar con backend
            verifyPurchaseWithBackend(purchase)

            // Acknowledge si no está acknowledged
            if (!purchase.isAcknowledged) {
                acknowledgePurchase(purchase)
            }

            // Actualizar lista de compras
            queryPurchases()
        } else if (purchase.purchaseState == Purchase.PurchaseState.PENDING) {
            println("⏳ Compra pendiente: ${purchase.products}")
        }
    }

    /**
     * Acknowledge una compra
     */
    private fun acknowledgePurchase(purchase: Purchase) {
        val acknowledgeParams = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()

        billingClient.acknowledgePurchase(acknowledgeParams) { billingResult ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                println("✅ Compra acknowledged: ${purchase.products}")
            } else {
                println("❌ Error acknowledging: ${billingResult.debugMessage}")
            }
        }
    }

    /**
     * Verifica compra con el backend
     */
    private fun verifyPurchaseWithBackend(purchase: Purchase) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId() // TODO: Obtener del AuthManager
                val productId = purchase.products.firstOrNull() ?: return@launch
                val type = if (purchase.products.first().contains("planner") || 
                                purchase.products.first().contains("teams")) {
                    "subscription"
                } else {
                    "product"
                }

                val json = JSONObject().apply {
                    put("purchaseToken", purchase.purchaseToken)
                    put("productId", productId)
                    put("userId", userId)
                    put("type", type)
                }

                val url = URL("$BACKEND_URL/api/google/verify")
                val connection = url.openConnection() as HttpURLConnection
                
                connection.apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    // TODO: Añadir Authorization header
                    // setRequestProperty("Authorization", "Bearer $authToken")
                    doOutput = true
                }

                connection.outputStream.use { os ->
                    os.write(json.toString().toByteArray())
                }

                val responseCode = connection.responseCode
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = BufferedReader(InputStreamReader(connection.inputStream))
                        .use { it.readText() }
                    
                    println("✅ Backend verificó compra: $response")
                } else {
                    println("⚠️ Backend respondió con código: $responseCode")
                }

            } catch (e: Exception) {
                println("❌ Error verificando con backend: ${e.message}")
                e.printStackTrace()
            }
        }
    }

    /**
     * Obtiene el user ID del usuario actual
     * TODO: Implementar integración con sistema de autenticación
     */
    private fun getUserId(): String {
        // Por ahora retorna un placeholder
        // En producción, obtener del AuthManager/SharedPreferences
        return "placeholder_user_id"
    }

    /**
     * Verifica si un producto está comprado
     */
    fun isPurchased(productId: String): Boolean {
        return purchases.value?.any { purchase ->
            purchase.products.contains(productId) &&
            purchase.purchaseState == Purchase.PurchaseState.PURCHASED
        } ?: false
    }

    /**
     * Obtiene detalles de un producto por ID
     */
    fun getProductDetails(productId: String): ProductDetails? {
        return products.value?.firstOrNull { it.productId == productId }
    }

    /**
     * Limpia recursos
     */
    fun destroy() {
        if (::billingClient.isInitialized) {
            billingClient.endConnection()
        }
    }
}

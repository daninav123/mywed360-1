package com.maloveapp.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.android.billingclient.api.ProductDetails
import com.maloveapp.billing.BillingManager
import com.maloveapp.ui.theme.MaLoveAppTheme

/**
 * PricingActivity - Pantalla de planes y precios
 * 
 * Muestra productos one-time y suscripciones
 * Permite comprar con un click
 */
class PricingActivity : ComponentActivity() {

    private lateinit var billingManager: BillingManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Inicializar BillingManager
        billingManager = BillingManager(applicationContext)
        billingManager.initialize()

        setContent {
            MaLoveAppTheme {
                PricingScreen(billingManager = billingManager, activity = this)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        billingManager.destroy()
    }
}

@Composable
fun PricingScreen(
    billingManager: BillingManager,
    activity: PricingActivity
) {
    val products by billingManager.products.observeAsState(emptyList())
    val purchases by billingManager.purchases.observeAsState(emptyList())
    val connectionState by billingManager.connectionState.observeAsState(
        BillingManager.BillingConnectionState.DISCONNECTED
    )
    val errorMessage by billingManager.errorMessage.observeAsState()

    var showErrorDialog by remember { mutableStateOf(false) }

    // Mostrar error si existe
    LaunchedEffect(errorMessage) {
        if (errorMessage != null) {
            showErrorDialog = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Planes") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (connectionState) {
                BillingManager.BillingConnectionState.CONNECTING -> {
                    LoadingView()
                }
                BillingManager.BillingConnectionState.CONNECTED -> {
                    if (products.isEmpty()) {
                        LoadingView()
                    } else {
                        PricingContent(
                            products = products,
                            purchases = purchases,
                            billingManager = billingManager,
                            activity = activity
                        )
                    }
                }
                else -> {
                    ErrorView(
                        message = "No se pudo conectar a Google Play",
                        onRetry = { billingManager.initialize() }
                    )
                }
            }
        }
    }

    // Error Dialog
    if (showErrorDialog && errorMessage != null) {
        AlertDialog(
            onDismissRequest = { showErrorDialog = false },
            title = { Text("Error") },
            text = { Text(errorMessage ?: "Ocurrió un error") },
            confirmButton = {
                TextButton(onClick = { showErrorDialog = false }) {
                    Text("OK")
                }
            }
        )
    }
}

@Composable
fun PricingContent(
    products: List<ProductDetails>,
    purchases: List<com.android.billingclient.api.Purchase>,
    billingManager: BillingManager,
    activity: PricingActivity
) {
    // Separar productos
    val coupleProducts = products.filter { 
        it.productId == BillingManager.WEDDING_PASS ||
        it.productId == BillingManager.WEDDING_PASS_PLUS
    }
    
    val plannerProducts = products.filter {
        it.productType == com.android.billingclient.api.BillingClient.ProductType.SUBS
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            HeaderSection()
        }

        // Parejas
        if (coupleProducts.isNotEmpty()) {
            item {
                SectionTitle("Para Parejas")
            }

            items(coupleProducts) { product ->
                ProductCard(
                    product = product,
                    isPurchased = billingManager.isPurchased(product.productId),
                    onPurchase = {
                        billingManager.purchaseInAppProduct(activity, product)
                    }
                )
            }
        }

        // Planners
        if (plannerProducts.isNotEmpty()) {
            item {
                SectionTitle("Para Wedding Planners")
            }

            items(plannerProducts) { product ->
                SubscriptionCard(
                    product = product,
                    isPurchased = billingManager.isPurchased(product.productId),
                    onPurchaseMonthly = {
                        billingManager.purchaseSubscription(
                            activity,
                            product,
                            BillingManager.BASE_PLAN_MONTHLY
                        )
                    },
                    onPurchaseAnnual = {
                        billingManager.purchaseSubscription(
                            activity,
                            product,
                            BillingManager.BASE_PLAN_ANNUAL
                        )
                    }
                )
            }
        }

        // Restore button
        item {
            RestoreButton(billingManager)
        }
    }
}

@Composable
fun HeaderSection() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "✨",
            style = MaterialTheme.typography.displayMedium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Elige tu plan perfecto",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Activa funcionalidades premium con un toque",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(top = 8.dp)
    )
}

@Composable
fun ProductCard(
    product: ProductDetails,
    isPurchased: Boolean,
    onPurchase: () -> Unit
) {
    val price = product.oneTimePurchaseOfferDetails?.formattedPrice ?: "N/A"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = product.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2
                    )
                }

                if (isPurchased) {
                    Text(
                        text = "✓",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color.Green
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = price,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )

                Button(
                    onClick = onPurchase,
                    enabled = !isPurchased,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isPurchased) Color.Gray else MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(if (isPurchased) "Activado" else "Comprar")
                }
            }
        }
    }
}

@Composable
fun SubscriptionCard(
    product: ProductDetails,
    isPurchased: Boolean,
    onPurchaseMonthly: () -> Unit,
    onPurchaseAnnual: () -> Unit
) {
    val monthlyOffer = product.subscriptionOfferDetails?.firstOrNull { 
        it.basePlanId == BillingManager.BASE_PLAN_MONTHLY 
    }
    val annualOffer = product.subscriptionOfferDetails?.firstOrNull { 
        it.basePlanId == BillingManager.BASE_PLAN_ANNUAL 
    }

    val monthlyPrice = monthlyOffer?.pricingPhases?.pricingPhaseList?.firstOrNull()?.formattedPrice ?: "N/A"
    val annualPrice = annualOffer?.pricingPhases?.pricingPhaseList?.firstOrNull()?.formattedPrice ?: "N/A"

    val hasTrial = monthlyOffer?.pricingPhases?.pricingPhaseList?.any { 
        it.priceAmountMicros == 0L 
    } ?: false

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color(0xFF6A1B9A).copy(alpha = 0.1f),
                            Color(0xFF1976D2).copy(alpha = 0.1f)
                        )
                    )
                )
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    if (hasTrial) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "🎉 Prueba GRATIS por 30 días",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Green,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = product.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 3
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Opciones de precio
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Mensual
                PriceOption(
                    label = "Mensual",
                    price = monthlyPrice,
                    description = if (hasTrial) "Después de 30 días gratis" else "Por mes",
                    isPurchased = isPurchased,
                    onPurchase = onPurchaseMonthly
                )

                // Anual
                PriceOption(
                    label = "Anual (Ahorra 15%)",
                    price = annualPrice,
                    description = "Pago único por año",
                    isPurchased = isPurchased,
                    onPurchase = onPurchaseAnnual,
                    highlighted = true
                )
            }
        }
    }
}

@Composable
fun PriceOption(
    label: String,
    price: String,
    description: String,
    isPurchased: Boolean,
    onPurchase: () -> Unit,
    highlighted: Boolean = false
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (highlighted) 
                MaterialTheme.colorScheme.primaryContainer 
            else 
                MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = price,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = onPurchase,
                enabled = !isPurchased,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isPurchased) Color.Gray else MaterialTheme.colorScheme.primary
                )
            ) {
                Text(if (isPurchased) "Activo" else "Elegir")
            }
        }
    }
}

@Composable
fun RestoreButton(billingManager: BillingManager) {
    TextButton(
        onClick = { billingManager.queryPurchases() },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Restaurar Compras")
    }
}

@Composable
fun LoadingView() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

@Composable
fun ErrorView(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "⚠️",
            style = MaterialTheme.typography.displayLarge
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Reintentar")
        }
    }
}

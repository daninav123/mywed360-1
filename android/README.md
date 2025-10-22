# MaLoveApp Android - Google Play Billing Integration

Proyecto Android con integración completa de Google Play Billing Library 6.0.

---

## 📱 Requisitos

- **Android Studio:** Hedgehog (2023.1.1) o superior
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 34 (Android 14)
- **Kotlin:** 1.9.0
- **Google Play Developer Account:** $25 (pago único)

---

## 🚀 Setup del Proyecto

### **1. Crear Proyecto en Android Studio**

```bash
# Abrir Android Studio
# File > New > New Project
# Phone and Tablet > Empty Activity
#
# Name: MaLoveApp
# Package name: com.maloveapp
# Save location: android/
# Language: Kotlin
# Minimum SDK: API 24
```

### **2. Configurar build.gradle (Module: app)**

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
}

android {
    namespace 'com.maloveapp'
    compileSdk 34

    defaultConfig {
        applicationId "com.maloveapp"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildFeatures {
        compose true
    }

    composeOptions {
        kotlinCompilerExtensionVersion '1.5.1'
    }
}

dependencies {
    // Jetpack Compose
    implementation platform('androidx.compose:compose-bom:2023.10.01')
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.material3:material3'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.activity:activity-compose:1.8.0'
    implementation 'androidx.compose.runtime:runtime-livedata'
    
    // Google Play Billing Library
    implementation 'com.android.billingclient:billing:6.0.1'
    implementation 'com.android.billingclient:billing-ktx:6.0.1'
    
    // Lifecycle
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.2'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    
    // Core
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
```

### **3. Añadir Archivos al Proyecto**

Estructura del proyecto:

```
app/src/main/
├── java/com/maloveapp/
│   ├── billing/
│   │   └── BillingManager.kt           # 🆕 Gestor de Google Play Billing
│   ├── ui/
│   │   ├── PricingActivity.kt          # 🆕 Vista de planes
│   │   └── theme/
│   │       └── Theme.kt
│   └── MainActivity.kt
├── AndroidManifest.xml
└── res/
```

Copia los archivos:
- `BillingManager.kt` → `app/src/main/java/com/maloveapp/billing/`
- `PricingActivity.kt` → `app/src/main/java/com/maloveapp/ui/`

### **4. Configurar AndroidManifest.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.maloveapp">

    <!-- Permisos -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="com.android.vending.BILLING" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.MaLoveApp">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <activity
            android:name=".ui.PricingActivity"
            android:exported="false" />
    </application>
</manifest>
```

---

## 📝 Implementación

### **Paso 1: MainActivity.kt**

```kotlin
package com.maloveapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.maloveapp.ui.PricingActivity
import com.maloveapp.ui.theme.MaLoveAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaLoveAppTheme {
                HomeScreen(
                    onNavigateToPricing = {
                        startActivity(Intent(this, PricingActivity::class.java))
                    }
                )
            }
        }
    }
}

@Composable
fun HomeScreen(onNavigateToPricing: () -> Unit) {
    Scaffold { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "MaLoveApp",
                style = MaterialTheme.typography.displayMedium
            )
            Spacer(modifier = Modifier.height(32.dp))
            Button(onClick = onNavigateToPricing) {
                Text("Ver Planes")
            }
        }
    }
}
```

### **Paso 2: Theme.kt (Opcional)**

```kotlin
package com.maloveapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = androidx.compose.ui.graphics.Color(0xFF6200EE),
    secondary = androidx.compose.ui.graphics.Color(0xFF03DAC6)
)

@Composable
fun MaLoveAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
```

---

## 🧪 Testing

### **1. Testing en Emulador**

```bash
# En Android Studio
# Tools > Device Manager
# Create Virtual Device
# Pixel 5 con Google APIs (incluye Play Store)
# Android 13 (API 33) o superior
```

### **2. Configurar License Tester**

Ver `docs/GOOGLE-PLAY-SETUP.md` para configurar license testers en Google Play Console.

### **3. Ejecutar App**

```bash
# En Android Studio
# Run > Run 'app' (Shift+F10)
# Seleccionar emulador o dispositivo físico
# Esperar que compile e instale
```

### **4. Probar Compras**

1. Abre la app en el emulador
2. Click en "Ver Planes"
3. Deberías ver los productos cargados
4. Click en "Comprar"
5. **Nota:** En testing track, las compras son simuladas sin cargo real

---

## 🔍 Debugging

### **Logs Útiles**

`BillingManager.kt` ya incluye logs extensivos:

```kotlin
println("✅ Conectado a Google Play Billing")
println("🛒 Iniciando compra: ${product.name}")
println("📦 Compras one-time: ${purchasesList.size}")
println("✅ Backend verificó compra: $response")
```

Ver en **Logcat** (Alt+6):

```
Filter: "Billing"
```

### **Verificar Conexión con Play Billing**

```kotlin
// En PricingActivity
billingManager.connectionState.observe(this) { state ->
    when (state) {
        BillingManager.BillingConnectionState.CONNECTED -> {
            println("✅ Play Billing conectado")
        }
        BillingManager.BillingConnectionState.FAILED -> {
            println("❌ Play Billing falló")
        }
        else -> {
            println("⏳ Play Billing conectando...")
        }
    }
}
```

### **Errores Comunes**

| Error | Solución |
|-------|----------|
| "Item unavailable" | Productos no publicados en Play Console |
| "Billing unavailable" | Emulador sin Google Play Services |
| "Developer error" | Package name no coincide |
| "Network error" | Backend no accesible |

---

## 📊 Estructura del Código

### **BillingManager.kt**

```
📦 BillingManager
├── companion object
│   ├── WEDDING_PASS                    # Product IDs
│   ├── PLANNER_PACK5
│   └── BASE_PLAN_MONTHLY
│
├── LiveData
│   ├── products: List<ProductDetails>
│   ├── purchases: List<Purchase>
│   └── connectionState
│
├── fun initialize()                    # Conectar a Play Billing
├── fun queryProducts()                 # Cargar productos
├── fun purchaseInAppProduct()          # Comprar one-time
├── fun purchaseSubscription()          # Comprar suscripción
├── fun handlePurchase()                # Procesar compra
├── fun verifyPurchaseWithBackend()     # Verificar con backend
└── fun isPurchased()                   # Verificar si comprado
```

### **PricingActivity.kt**

```
📱 PricingActivity (Compose)
├── PricingScreen                       # Pantalla principal
│   ├── HeaderSection
│   ├── SectionTitle
│   ├── ProductCard                     # One-time purchases
│   ├── SubscriptionCard                # Suscripciones
│   │   └── PriceOption                 # Monthly/Annual
│   └── RestoreButton
├── LoadingView
└── ErrorView
```

---

## 🔐 Seguridad

### **Verificación en Backend**

`BillingManager.kt` automáticamente:

1. ✅ Procesa compra en `purchasesUpdatedListener`
2. ✅ Envía `purchaseToken` a `/api/google/verify`
3. ✅ Backend verifica con Google Play API
4. ✅ Backend guarda en Firestore
5. ✅ Acknowledge purchase localmente

### **No Almacenar Datos Sensibles**

❌ **NO guardes:**
- Purchase tokens en SharedPreferences sin cifrar
- Service Account keys en el código
- User IDs en plain text

✅ **SÍ usa:**
- EncryptedSharedPreferences para datos sensibles
- ProGuard para ofuscar código
- SSL Pinning para comunicación con backend

---

## 🚢 Publicación

### **1. Generar Signed AAB**

```bash
# En Android Studio
# Build > Generate Signed Bundle / APK
# Seleccionar: Android App Bundle
# Create new keystore:
#   - Location: android/keystore/maloveapp.jks
#   - Password: [seguro]
#   - Alias: maloveapp
# Release build variant
# Build
```

Resultado: `app/release/app-release.aab`

### **2. Upload to Internal Testing**

1. Google Play Console > **Testing** > **Internal testing**
2. **Create new release**
3. Upload `app-release.aab`
4. **Release notes:** Versión inicial con Google Play Billing
5. **Save** > **Review release**
6. **Start rollout to Internal testing**

### **3. Promocionar a Production**

1. Testing exitoso en Internal track
2. **Promote release** > **Production**
3. Complete store listing (si aún no)
4. **Submit for review**
5. **Esperar aprobación** (1-7 días)

---

## 📱 Configuración Adicional

### **ProGuard (Ofuscación)**

`app/proguard-rules.pro`:

```proguard
# Keep Billing Library
-keep class com.android.billingclient.** { *; }
-keep interface com.android.billingclient.** { *; }

# Keep models
-keep class com.maloveapp.billing.** { *; }
```

`build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### **Version Management**

`build.gradle`:

```gradle
defaultConfig {
    versionCode 1  // Incrementar con cada release
    versionName "1.0.0"
}
```

---

## 🐛 Solución de Problemas

### **"Products not loading"**

```kotlin
// Verificar que package name coincide:
println("Package: ${context.packageName}")
// Debe ser: com.maloveapp
```

### **"Purchase not acknowledging"**

```kotlin
// Verificar estado de compra:
purchase.purchaseState == Purchase.PurchaseState.PURCHASED
purchase.isAcknowledged // false = necesita acknowledge
```

### **"Backend not receiving"**

```kotlin
// Verificar URL del backend:
private const val BACKEND_URL = "https://api.maloveapp.com"
// Debe ser accesible públicamente
```

### **Limpiar Cache**

```bash
# En Android Studio
# Build > Clean Project
# Build > Rebuild Project
# Invalidate Caches / Restart
```

---

## 📚 Recursos

- **Google Play Billing Docs:** https://developer.android.com/google/play/billing
- **Play Billing Samples:** https://github.com/android/play-billing-samples
- **Jetpack Compose:** https://developer.android.com/jetpack/compose
- **Kotlin Coroutines:** https://kotlinlang.org/docs/coroutines-overview.html

---

**Última actualización:** 23 de octubre de 2025  
**Versión:** 1.0  
**Autor:** MaLoveApp Development Team

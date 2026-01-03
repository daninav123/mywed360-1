# 🧪 Test E2E: Sistema de Crowdsourcing

Test completo que valida el flujo end-to-end del sistema de crowdsourcing de opciones de proveedores.

## 📋 Qué Valida el Test

### **Fase 1: Usuario A Añade Opciones**
1. Usuario A se registra y crea su boda
2. Navega a Info Boda > Fotografía
3. Añade 3 opciones personalizadas:
   - "Video 4K Ultra HD" (esperado: aprobado automático)
   - "Sesión con mascotas" (esperado: revisión manual)
   - "Fotos en blanco y negro vintage" (esperado: aprobado automático)
4. ✅ Verifica que se guardaron en Firestore con status `pending`

### **Fase 2: IA Procesa Sugerencias**
1. Ejecuta el job de procesamiento manualmente
2. ✅ Verifica que todas las sugerencias tienen `aiValidation.score`
3. ✅ Verifica que al menos una fue aprobada (score > 80)
4. ✅ Verifica que las aprobadas se añadieron a `supplier_dynamic_specs`

### **Fase 3: Usuario B Ve Opciones Aprobadas**
1. Usuario B se registra y crea una boda diferente
2. Navega a Info Boda > Fotografía
3. ✅ Ve el badge "opciones sugeridas por la comunidad"
4. ✅ Ve las opciones aprobadas como checkboxes seleccionables
5. ✅ Puede marcar/desmarcar las opciones de la comunidad

### **Validaciones Finales**
- ✅ Estadísticas del sistema (total, aprobadas, rechazadas, score promedio)
- ✅ Usuario A recibió notificación de aprobación

## 🚀 Cómo Ejecutar

### **Método 1: Script Automático (Recomendado)**

```bash
./scripts/test-crowdsourcing.sh
```

Este script:
- Verifica que backend y frontend están corriendo
- Ejecuta el test completo
- Muestra resultados detallados

### **Método 2: Cypress Interactive (para debugging)**

```bash
npx cypress open
```

1. Selecciona "E2E Testing"
2. Elige navegador (Chrome recomendado)
3. Click en `supplier-options-crowdsourcing.cy.js`
4. Observa el test ejecutándose en tiempo real

### **Método 3: Headless CLI**

```bash
npx cypress run --spec "cypress/e2e/supplier-options-crowdsourcing.cy.js"
```

## 📊 Ejemplo de Output Exitoso

```
🧪 Test E2E: Sistema de Crowdsourcing de Opciones
================================================

📋 Verificando servicios...
✅ Backend: OK
✅ Frontend: OK

🚀 Ejecutando test E2E...

  Sistema de Crowdsourcing - Opciones de Proveedores
    Fase 1: Usuario A añade opciones personalizadas
      ✓ Usuario A se registra y crea su boda (2543ms)
      ✓ Usuario A navega a Info Boda > Fotografía (891ms)
      ✓ Usuario A añade opciones personalizadas (3241ms)
      ✓ Verificar que las sugerencias se guardaron en Firestore (456ms)
    
    Fase 2: Job de IA procesa las sugerencias
      ✓ Ejecutar job de procesamiento de sugerencias (8234ms)
      ✓ Verificar que las sugerencias fueron validadas por la IA (712ms)
      ✓ Verificar que las opciones aprobadas se añadieron al catálogo (523ms)
    
    Fase 3: Usuario B ve las opciones aprobadas
      ✓ Usuario B se registra y crea su boda (2187ms)
      ✓ Usuario B navega a Info Boda > Fotografía (834ms)
      ✓ Usuario B ve las opciones aprobadas del Usuario A (1456ms)
      ✓ Usuario B puede marcar las opciones de la comunidad (623ms)
    
    Validaciones finales
      ✓ Verificar estadísticas del sistema de crowdsourcing (289ms)
      ✓ Verificar que el usuario A recibió notificación (312ms)

  13 passing (22s)

✅ Test completado exitosamente

📊 Resultados:
   - Opciones añadidas por usuarios
   - IA validó y aprobó opciones relevantes
   - Opciones aprobadas disponibles para todos
```

## 🔧 Requisitos Previos

1. **Backend corriendo** en `http://localhost:4004`
   ```bash
   cd backend && npm run dev
   ```

2. **Frontend corriendo** en `http://localhost:5173`
   ```bash
   cd apps/main-app && npm run dev
   ```

3. **Firebase configurado** ⚠️ IMPORTANTE
   
   **Necesitas `serviceAccount.json` en la raíz del proyecto:**
   
   ```bash
   # Obtener desde Firebase Console
   # 1. Ve a: https://console.firebase.google.com/
   # 2. Selecciona tu proyecto
   # 3. Project Settings (⚙️) > Service Accounts
   # 4. Click "Generate new private key"
   # 5. Guarda como: /ruta/proyecto/serviceAccount.json
   ```
   
   El test **no funcionará** sin este archivo porque necesita:
   - Crear/eliminar usuarios de prueba
   - Acceso directo a Firestore
   - Autenticación Admin para tareas

4. **OpenAI API Key**
   - Variable `OPENAI_API_KEY` configurada en `.env`
   - Necesaria para la validación IA

## 🐛 Troubleshooting

### Test falla en Fase 1

**Problema:** No se pueden crear usuarios
**Solución:** Verifica que Firebase Auth está configurado correctamente

### Test falla en Fase 2

**Problema:** Job de IA no procesa sugerencias
**Soluciones:**
- Verifica `OPENAI_API_KEY` en `.env`
- Ejecuta manualmente: `node backend/scripts/run-option-suggestions-job.js`
- Revisa logs del backend

### Test falla en Fase 3

**Problema:** Usuario B no ve opciones aprobadas
**Soluciones:**
- Verifica que `supplier_dynamic_specs` tiene datos
- Comprueba que el hook `useSupplierOptions` carga correctamente
- Revisa la consola del navegador en Cypress

### Timeout en ejecución del job

**Problema:** El job tarda más de 30 segundos
**Solución:** Aumenta el timeout en `crowdsourcing-tasks.js`:
```javascript
timeout: 60000 // 60 segundos
```

## 📝 Personalización del Test

### Cambiar opciones de prueba

Edita `cypress/e2e/supplier-options-crowdsourcing.cy.js`:

```javascript
const testOptions = [
  { text: 'Tu opción 1', expectedScore: 'high' },
  { text: 'Tu opción 2', expectedScore: 'medium' },
  { text: 'Tu opción 3', expectedScore: 'low' },
];
```

### Probar otra categoría

Cambia la categoría en el test:

```javascript
cy.get('[data-category="video"]').click(); // En vez de "fotografia"
```

## 🎯 Qué Demuestra Este Test

1. **Flujo completo funcional:** Desde que el usuario añade hasta que aparece para todos
2. **IA valida correctamente:** Scores coherentes, detecta duplicados
3. **Persistencia correcta:** Datos se guardan en Firestore
4. **UI actualizada:** Opciones aparecen dinámicamente
5. **Notificaciones funcionan:** Usuarios son informados
6. **Multi-usuario:** Cambios de un usuario afectan a todos

## 📊 Métricas Validadas

- **Total de sugerencias procesadas**
- **Tasa de aprobación automática** (score > 80)
- **Opciones en revisión manual** (score 60-80)
- **Opciones rechazadas** (score < 60)
- **Score promedio** de todas las sugerencias
- **Conteo de opciones dinámicas** en el catálogo

Este test valida que el sistema de crowdsourcing funciona de principio a fin, garantizando que las contribuciones de usuarios se integran correctamente al catálogo global.

# Benchmarks de Presupuesto de Boda

## Objetivo

Capturar los presupuestos reales de cada boda una vez que quedan “cerrados” y usarlos para sugerir precios aproximados por partida a nuevas parejas. El flujo completo combina captura periódica, agregación de datos y exposición de recomendaciones en la UI.

## Flujo de datos

1. **Snapshot de presupuesto**  
   - Cada vez que `useFinance` detecta un presupuesto “confirmado” (p.ej. el planner marca `budget.status === 'confirmed'` o se ejecuta el comando _Guardar presupuesto definitivo_), se crea un documento `weddings/{weddingId}/budgetSnapshots/{timestamp}` con:
     ```json
     {
       "status": "confirmed",
       "capturedAt": "2024-07-02T12:23:44.120Z",
       "currency": "EUR",
       "wedding": {
         "id": "abc123",
         "country": "ES",
         "region": "Madrid",
         "guestCount": 180,
         "style": "elegante"
       },
       "totals": {
         "budget": 40235.5,
         "spent": 38120.0
       },
       "categories": [
         { "key": "catering", "name": "Catering", "amount": 18000 },
         { "key": "photo", "name": "Fotografía", "amount": 2500 },
         ...
       ]
     }
     ```
   - Las claves de categoría se normalizan a través de `CATEGORY_ALIASES` para que “foto”, “Fotografía” o “photos” apunten a `photo`.
   - Los snapshots se sobrescriben si ya existe uno confirmado para la misma boda (solo guardamos el más reciente por boda).

2. **Agregación de benchmarks**  
   - Una Cloud Function (trigger `onWrite` en `budgetSnapshots`) recalcula documentos agregados en `budgetBenchmarks/{region}_{guestBucket}` con estadísticas por categoría (`avg`, `p50`, `p75`, `count`).  
   - El bucket de invitados se calcula cada 50 personas (`0-50`, `51-100`, etc.). Si no hay región definida, se usa `global`.
   - Ejemplo de documento agregado:
     ```json
     {
       "region": "ES",
       "guestBucket": "150-200",
       "count": 37,
       "categories": {
         "catering": { "avg": 18500, "p50": 18000, "p75": 21000 },
         "photo": { "avg": 2400, "p50": 2300, "p75": 2700 }
       },
       "lastUpdated": "2024-07-02T12:23:44.120Z"
     }
     ```
   - Esta función limpia outliers (`amount <= 0` o `amount > 500000`) y descarta categorías con menos de 3 registros.

3. **Consumo en la aplicación**  
   - `useBudgetBenchmarks` consulta el benchmark más cercano: primero por `region + bucket invitados`, luego solo `region`, y por último `global`.
   - El hook devuelve:
     ```ts
     {
       categories: Record<string, { avg: number; p50: number; p75: number; count: number }>;
       total: { avg: number; p50: number; p75: number; count: number };
       sampleSize: number;
       confidence: 'low' | 'medium' | 'high';
       applySuggestion: (type: 'avg' | 'p50' | 'p75') => BudgetCategory[];
     }
     ```
   - `applySuggestion` genera una lista de categorías normalizadas para precargar en el presupuesto del planner. El caller decide si reemplaza las existentes o solo muestra recomendaciones.

4. **Integración en la UI**  
   - En Finanzas → Presupuesto se muestra un banner con el resumen: “Basado en 37 bodas similares en Madrid (150-200 invitados)”.  
   - Al abrir el modal de recomendaciones, se listan las categorías con porcentajes y rangos sugeridos, permitiendo al planner:
     1. Ver la comparación con su presupuesto actual.
     2. Aplicar automáticamente `p50` o `p75` sobre las partidas sin valor definido.
   - Cuando el usuario aplica una sugerencia, se registra un evento en analytics (`budget_benchmark_applied`) con la estrategia elegida.

## Señales adicionales

- Guardamos en cada snapshot el hash `normalizedCategoriesHash` para evitar duplicados triviales.
- Para preservar la privacidad, los snapshots no guardan nombres de proveedores ni datos personales; sólo metadatos generales (país, invitaciones).  
- Los scripts de migración (`scripts/migrateBudgetSnapshots.js`) permiten volcar presupuestos antiguos confirmados para generar benchmarks históricos.

## Próximos pasos

- Añadir un panel administrativo que muestre los benchmarks por región y permita depurar outliers manualmente.
- Generar alertas cuando un presupuesto queda muy por debajo del rango p25- p75 (posible error de carga).
- Investigar cómo utilizar los mismos datos para sugerir incrementos cuando se eleva el número de invitados.

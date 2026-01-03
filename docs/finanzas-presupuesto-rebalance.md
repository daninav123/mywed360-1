# Autoajuste de presupuesto por categorías

Este documento resume el comportamiento del módulo **Finanzas → Presupuesto** cuando se modifican las barras deslizantes de cada categoría.

## Objetivo

Mantener el presupuesto global coherente cuando una categoría cambia de valor:

- Si aumentamos una categoría, las restantes se contraen proporcionalmente (solo cuando no queda presupuesto libre).
- Si reducimos una categoría, el excedente se reparte entre las demás para que los importes sigan sumando el total esperado.
- Siempre se respeta el presupuesto total definido (o, si no existe, la suma de las categorías).

## Flujo del algoritmo

1. **Conversiones a céntimos**  
   Los importes se convierten a enteros (céntimos) para evitar errores de redondeo.

2. **Cálculo de `delta`**  
   `delta = nuevoValorCategoría - valorActualCategoría`  
   - `delta > 0`: la categoría necesita fondos adicionales.  
   - `delta < 0`: la categoría libera presupuesto.

3. **Uso del presupuesto libre**  
   Si el presupuesto global es mayor que la suma actual de categorías, la diferencia actúa como “pool” libre. Cuando `delta > 0`, primero usamos este pool antes de tocar a otras categorías.

4. **Redistribución proporcional**  
   - **Aumentos** (`delta > 0`): se reduce el resto de categorías proporcionalmente con `distributeDecrease`.  
   - **Reducciones** (`delta < 0`): se aumenta el resto de categorías con `distributeIncrease`.

5. **Control de sobrantes**  
   Si, tras distribuir, sobra cantidad sin asignar o no se puede cubrir el aumento, ajustamos la categoría modificada para que el total no supere el límite.

6. **Normalización final**  
   Todas las cantidades se normalizan a euros con dos decimales y se persisten mediante `onReallocateCategories`.

## Helpers clave

- `distributeDecrease(amounts, indices, delta)`  
  Reduce los importes de `indices` hasta recortar `delta`. Devuelve el remanente que no pudo recortarse.

- `distributeIncrease(amounts, indices, delta)`  
  Incrementa los importes de `indices` con `delta` y devuelve el remanente no asignado.

Ambos trabajan sobre arrays en céntimos, mutándolos directamente.

## Consideraciones

- Si no queda presupuesto libre y todas las demás categorías están en cero, intentar aumentar una categoría no tendrá efecto.
- Si solo existe una categoría, reducirla simplemente genera presupuesto libre (no hay a quién redistribuir).
- Cuando el presupuesto total es 0, los deslizadores siguen funcionando pero sólo actualizan la categoría editada (sin redistribución). Para activar el reequilibrio proporcional, define un total en **“Presupuesto total (€)”**.
- Las suites de pruebas automáticas aún no cubren este comportamiento; se recomienda validar manualmente cualquier cambio significativo.
- Ninguna categoría puede quedar por debajo del gasto real registrado (`Gastado`); el algoritmo usa ese valor como mínimo y, si el recorte no puede respetarlo, detiene la redistribución.

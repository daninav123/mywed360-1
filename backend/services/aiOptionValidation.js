import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function validateSupplierOption(suggestion, existingOptions) {
  try {
    const { category, categoryName, optionLabel, description } = suggestion;

    const existingOptionsText = Object.entries(existingOptions)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');

    const prompt = `Analiza esta sugerencia de opción especial para proveedores de bodas.

CATEGORÍA: ${categoryName} (${category})

OPCIÓN SUGERIDA:
- Label: "${optionLabel}"
- Descripción: "${description || 'Sin descripción'}"

OPCIONES EXISTENTES EN ESTA CATEGORÍA:
${existingOptionsText || 'Ninguna opción existente'}

Tu tarea es evaluar esta sugerencia y responder ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones adicionales) con esta estructura:

{
  "score": 85,
  "relevance": "high",
  "clarity": "high",
  "duplicate": false,
  "duplicateOf": null,
  "suggestedType": "boolean",
  "suggestedKey": "camelCaseKey",
  "suggestedLabel": "Label mejorada si es necesario",
  "reasoning": "Explicación breve de tu evaluación"
}

CRITERIOS DE EVALUACIÓN:

1. Score (0-100):
   - Combina relevancia + claridad + utilidad
   - > 80: Excelente, aprobar automáticamente
   - 60-80: Buena, revisar manualmente
   - < 60: Rechazar

2. Relevance (high/medium/low):
   - high: Muy relevante para la categoría, común en la industria
   - medium: Útil pero no esencial
   - low: Poco relevante o muy específica

3. Clarity (high/medium/low):
   - high: Clara, fácil de entender, bien redactada
   - medium: Aceptable pero podría mejorar
   - low: Confusa o mal redactada

4. Duplicate (true/false):
   - true si ya existe una opción similar o idéntica
   - Indica en duplicateOf el key de la opción existente

5. SuggestedType:
   - boolean: Para opciones sí/no (más común)
   - number: Para cantidades
   - select: Para opciones múltiples predefinidas
   - text: Para texto libre

6. SuggestedKey:
   - camelCase técnico válido en JavaScript
   - Descriptivo pero conciso
   - Ejemplo: "slowMotionVideo", "droneFootage"

7. SuggestedLabel:
   - Versión mejorada del label si es necesario
   - Clara, profesional, sin jerga
   - En español

IMPORTANTE:
- Responde SOLO con el JSON, sin texto adicional
- No uses bloques de código markdown
- El JSON debe ser válido y parseable`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en la industria de bodas y análisis de características de productos. Respondes únicamente con JSON válido, sin markdown ni explicaciones adicionales.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    let responseText = completion.choices[0].message.content.trim();
    
    // Limpiar markdown si la IA lo añade
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^json\s*/i, '');
    
    const validation = JSON.parse(responseText);

    return {
      success: true,
      validation: {
        score: validation.score || 0,
        relevance: validation.relevance || 'low',
        clarity: validation.clarity || 'low',
        duplicate: validation.duplicate || false,
        duplicateOf: validation.duplicateOf || null,
        suggestedType: validation.suggestedType || 'boolean',
        suggestedKey: validation.suggestedKey || generateKey(optionLabel),
        suggestedLabel: validation.suggestedLabel || optionLabel,
        reasoning: validation.reasoning || 'Sin razonamiento proporcionado',
        validatedAt: new Date()
      }
    };

  } catch (error) {
    console.error('Error en validación IA:', error);
    return {
      success: false,
      error: error.message,
      validation: {
        score: 0,
        relevance: 'low',
        clarity: 'low',
        duplicate: false,
        duplicateOf: null,
        suggestedType: 'boolean',
        suggestedKey: generateKey(suggestion.optionLabel),
        suggestedLabel: suggestion.optionLabel,
        reasoning: `Error en validación automática: ${error.message}`,
        validatedAt: new Date()
      }
    };
  }
}

function generateKey(label) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

async function batchValidateOptions(suggestions, existingOptions) {
  const results = [];
  
  for (const suggestion of suggestions) {
    const result = await validateSupplierOption(suggestion, existingOptions);
    results.push({
      suggestionId: suggestion.id,
      ...result
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

export {
  validateSupplierOption,
  batchValidateOptions,
  generateKey
};

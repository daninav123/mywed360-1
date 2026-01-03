/**
 * Motor IA para personalización de plantillas de tareas
 * 
 * Adapta la plantilla maestra según características de la boda:
 * - Tipo de ceremonia (civil, religiosa, simbólica, destino)
 * - Presupuesto estimado
 * - Lead time (meses hasta la boda)
 * - Estilo/preferencias
 * - Tamaño (número de invitados)
 * 
 * @module taskPersonalizationAI
 */

import OpenAI from 'openai';
import logger from '../utils/logger.js';

// Inicialización lazy para asegurar que las variables de entorno estén disponibles
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID;
    
    if (!apiKey) {
      throw new Error('[taskPersonalizationAI] OPENAI_API_KEY no está configurada');
    }
    
    logger.info('[taskPersonalizationAI] Inicializando cliente OpenAI', {
      apiKeyPrefix: apiKey.substring(0, 10),
      projectId: projectId || 'no configurado',
    });
    
    openai = new OpenAI({
      apiKey,
      project: projectId,
      timeout: 30000,
    });
  }
  
  return openai;
}

/**
 * Analiza el contexto de la boda y genera recomendaciones de personalización
 * @param {Object} weddingContext - Contexto de la boda
 * @param {Object} masterTemplate - Plantilla maestra de tareas
 * @returns {Promise<Object>} Análisis y recomendaciones
 */
export async function analyzeWeddingContext(weddingContext, masterTemplate) {
  try {
    const {
      ceremonyType = 'civil',
      budget = 'medium',
      leadTimeMonths = 12,
      guestCount = 100,
      style = 'classic',
      location = 'local',
      city = '',
      weddingDate = '',
      venueType = 'mixto',
      manyChildren = false,
      guestsFromOutside = false,
      samePlaceCeremonyReception = false,
      hasPlanner = false,
    } = weddingContext;

    const prompt = `Eres un experto wedding planner con 20 años de experiencia en España. Analiza el siguiente contexto de boda y proporciona recomendaciones específicas y personalizadas para crear el plan de tareas perfecto.

CONTEXTO DETALLADO DE LA BODA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMACIÓN BÁSICA:
- Tipo de ceremonia: ${ceremonyType}
- Presupuesto: ${budget}
- Tiempo hasta la boda: ${leadTimeMonths} meses
- Número de invitados: ${guestCount}
- Estilo: ${style}

📍 UBICACIÓN Y ESPACIO:
- Tipo ubicación: ${location}${city ? ` (${city})` : ''}
- Tipo de espacio: ${venueType}
- Ceremonia y banquete en mismo lugar: ${samePlaceCeremonyReception ? 'Sí' : 'No'}

👥 CONTEXTO ADICIONAL:
- Muchos niños asistirán: ${manyChildren ? 'Sí' : 'No'}
- Invitados de fuera de la ciudad: ${guestsFromOutside ? 'Sí' : 'No'}
- Wedding planner profesional: ${hasPlanner ? 'Sí' : 'No'}

PLANTILLA BASE:
${masterTemplate.blocks.length} bloques de tareas principales

INSTRUCCIONES ESPECÍFICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANTE: Tu objetivo NO es solo ajustar prioridades de bloques existentes, sino CREAR UN PLAN COMPLETO Y PERSONALIZADO de tareas específicas para esta boda.

1. GENERA TAREAS NUEVAS Y ESPECÍFICAS (15-25 tareas):
   - NO uses títulos genéricos como "Contratar fotógrafo"
   - Sé ESPECÍFICO: "Buscar fotógrafo especializado en bodas ${ceremonyType}s en ${city}"
   - Cada tarea debe tener:
     * Título descriptivo y accionable
     * Categoría (VENUE, CATERING, FOTO_VIDEO, DECORACION, FLORISTA, MUSICA, INVITACIONES, VESTUARIO, BELLEZA, TRANSPORTE, ALOJAMIENTO, LEGAL, OTROS)
     * Prioridad (high/medium/low)
     * Deadline relativo en días antes de la boda (ej: -180 = 6 meses antes)
     * Razón específica del por qué es necesaria

2. TAREAS SEGÚN TIPO DE CEREMONIA:
   - Religiosa: tramitación parroquia, cursillos prematrimoniales, música sacra
   - Civil: reservar juzgado/registro, testigos, textos ceremonia
   - Destino: permisos locales, coordinador local, transporte grupo

3. TAREAS SEGÚN PRESUPUESTO (${budget}):
   - Low: proveedores esenciales, decoración DIY, negociaciones precios
   - Medium/High: todos los proveedores, detalles personalizados
   - Luxury: wedding planner, servicios premium, experiencias únicas

4. TAREAS SEGÚN CONTEXTO ESPECIAL:
   - Niños (${manyChildren}): animador infantil, menú niños, zona juegos
   - Invitados de fuera (${guestsFromOutside}): lista hoteles, transporte, welcome bags
   - Mismo lugar ceremonia/banquete (${samePlaceCeremonyReception}): decoración dual, timing preciso
   - Con planner (${hasPlanner}): menos tareas logísticas, más decisiones creativas

5. TIMELINE ESPECÍFICO (${leadTimeMonths} meses):
   - 12+ meses: todas las tareas con margen de negociación
   - 9-12 meses: ritmo normal, evitar demoras
   - 6-9 meses: priorizar proveedores críticos, acelerar trámites
   - <6 meses: URGENTE - solo esencial, contactos directos, proveedores con disponibilidad

6. ELIMINA TAREAS INNECESARIAS:
   - Si tiene planner: eliminar gestión logística detallada
   - Si presupuesto bajo: eliminar servicios premium
   - Si mismo lugar: eliminar coordinación de transporte entre venues

FORMATO DE RESPUESTA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responde en JSON con esta estructura:
{
  "summary": "Análisis personalizado de esta boda específica (3-4 frases). Menciona aspectos únicos y lo que hace especial este plan.",
  "criticalBlocks": ["id_bloque1", "id_bloque2"],
  "optionalBlocks": ["id_bloque3"],
  "priorityAdjustments": [
    {
      "blockId": "id_bloque",
      "newPriority": "high|medium|low",
      "reason": "Razón específica para ESTA boda (no genérica)"
    }
  ],
  "tasks": [
    {
      "title": "Título específico y accionable",
      "category": "VENUE|CATERING|FOTO_VIDEO|DECORACION|FLORISTA|MUSICA|INVITACIONES|VESTUARIO|BELLEZA|TRANSPORTE|ALOJAMIENTO|LEGAL|OTROS",
      "priority": "high|medium|low",
      "relativeDeadlineDays": -180,
      "isCritical": false,
      "reason": "Por qué es necesaria para ESTA boda"
    }
  ],
  "omittedTasks": [
    {
      "blockId": "id_bloque",
      "reason": "Por qué se puede omitir"
    }
  ],
  "timelineAdjustments": {
    "recommendation": "Descripción del ritmo recomendado",
    "urgentPhases": ["fase1", "fase2"]
  }
}`;

    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Eres un wedding planner experto que personaliza planes de tareas según el contexto único de cada boda. Siempre respondes en JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    logger.info('[taskPersonalizationAI] Análisis completado', {
      ceremonyType,
      leadTimeMonths,
      criticalBlocks: analysis.criticalBlocks?.length || 0,
      additionalTasks: analysis.additionalTasks?.length || 0,
    });

    return {
      success: true,
      analysis,
      usage: response.usage,
    };
  } catch (error) {
    logger.error('[taskPersonalizationAI] Error en análisis', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
      analysis: null,
    };
  }
}

/**
 * Aplica las recomendaciones de IA a la plantilla maestra
 * @param {Object} masterTemplate - Plantilla maestra original
 * @param {Object} analysis - Análisis de IA
 * @param {Object} weddingContext - Contexto de la boda
 * @returns {Object} Plantilla personalizada
 */
export function applyPersonalization(masterTemplate, analysis, weddingContext) {
  if (!analysis || !analysis.success) {
    logger.warn('[taskPersonalizationAI] Análisis inválido, devolviendo plantilla vacía');
    return { blocks: [] };
  }

  const aiAnalysis = analysis.analysis;
  
  // Crear plantilla completamente nueva con tareas generadas por IA
  const personalizedTemplate = {
    id: 'ai-generated-' + Date.now(),
    name: `Plan personalizado ${weddingContext.ceremonyType || 'boda'}`,
    version: 1,
    blocks: [],
    metadata: {
      source: 'ai-personalization',
      generatedAt: new Date().toISOString(),
      weddingContext: {
        ceremonyType: weddingContext.ceremonyType,
        budget: weddingContext.budget,
        leadTimeMonths: weddingContext.leadTimeMonths,
        guestCount: weddingContext.guestCount,
      },
    },
  };

  // Convertir tareas IA en bloques con fechas calculadas
  if (aiAnalysis.tasks && Array.isArray(aiAnalysis.tasks)) {
    const weddingDate = weddingContext.weddingDate ? new Date(weddingContext.weddingDate) : null;
    
    aiAnalysis.tasks.forEach((task, index) => {
      // Calcular fecha de vencimiento
      let dueDate = null;
      if (weddingDate && task.relativeDeadlineDays) {
        dueDate = new Date(weddingDate);
        dueDate.setDate(dueDate.getDate() + task.relativeDeadlineDays);
      }
      
      const newBlock = {
        id: `ai-task-${Date.now()}-${index}`,
        name: task.title,
        title: task.title,
        category: task.category || 'OTROS',
        priority: task.priority || 'medium',
        isCritical: task.isCritical || false,
        dueDate: dueDate ? dueDate.toISOString() : null,
        status: 'pending',
        completed: false,
        metadata: {
          source: 'ai-generated',
          reason: task.reason,
          aiSuggestion: task.reason,
          relativeDeadlineDays: task.relativeDeadlineDays,
        },
      };
      
      personalizedTemplate.blocks.push(newBlock);
    });
  }

  logger.info('[taskPersonalizationAI] Plantilla personalizada creada', {
    tasksGenerated: personalizedTemplate.blocks.length,
  });

  return personalizedTemplate;
}

/**
 * Flujo completo: analizar + personalizar plantilla
 * @param {Object} masterTemplate - Plantilla maestra
 * @param {Object} weddingContext - Contexto de la boda
 * @returns {Promise<Object>} Plantilla personalizada con metadatos
 */
export async function personalizeTaskTemplate(masterTemplate, weddingContext) {
  try {
    // 1. Analizar contexto con IA
    const analysisResult = await analyzeWeddingContext(weddingContext, masterTemplate);
    
    if (!analysisResult.success) {
      logger.warn('[taskPersonalizationAI] Análisis falló, usando plantilla sin personalizar');
      return {
        success: false,
        template: masterTemplate,
        error: analysisResult.error,
        usedAI: false,
      };
    }

    // 2. Aplicar personalización
    const personalizedTemplate = applyPersonalization(
      masterTemplate,
      analysisResult,
      weddingContext
    );

    return {
      success: true,
      template: personalizedTemplate,
      analysis: analysisResult.analysis,
      usedAI: true,
      aiUsage: analysisResult.usage,
    };
  } catch (error) {
    logger.error('[taskPersonalizationAI] Error en personalización completa', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      template: masterTemplate,
      error: error.message,
      usedAI: false,
    };
  }
}

export default {
  analyzeWeddingContext,
  applyPersonalization,
  personalizeTaskTemplate,
};

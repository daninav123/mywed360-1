import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Genera tareas automáticamente basándose en los requisitos legales seleccionados
 * @param {string} weddingId - ID de la boda
 * @param {Object} countryData - Datos del país desde el catálogo
 * @param {string} legalType - Tipo de matrimonio (civil, same_sex, etc.)
 * @param {string} countryCode - Código del país
 * @param {Date} weddingDate - Fecha de la boda
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Array de IDs de tareas creadas
 */
export async function generateLegalTasks(
  weddingId,
  countryData,
  legalType,
  countryCode,
  weddingDate,
  userId
) {
  if (!weddingId || !countryData || !legalType) {
    throw new Error('Faltan parámetros requeridos');
  }

  const typeData = countryData.ceremonyTypes?.[legalType];
  if (!typeData || !typeData.requirements || typeData.requirements.length === 0) {
    return [];
  }

  const tasksCreated = [];
  const requirement = typeData.requirements[0]; // Primer conjunto de requisitos
  const steps = requirement.steps || [];
  const leadTimeDays = requirement.leadTimeDays || 90;

  // Calcular fechas de vencimiento basadas en la fecha de la boda
  const calculateDueDate = (offsetDays) => {
    if (!weddingDate) return null;
    const wedding = new Date(weddingDate);
    const dueDate = new Date(wedding);
    dueDate.setDate(dueDate.getDate() - offsetDays);
    return dueDate;
  };

  try {
    const tasksCol = collection(db, 'weddings', weddingId, 'tasks');

    // Tarea 1: Inicio del proceso legal
    const startDueDate = calculateDueDate(leadTimeDays);
    const startTask = {
      title: `Iniciar trámites legales en ${countryData.name}`,
      description: `Iniciar el proceso de matrimonio ${getLegalTypeLabel(legalType)} en ${countryData.name}. Plazo estimado: ${leadTimeDays} días.`,
      category: 'legal',
      status: 'pending',
      priority: 'high',
      dueDate: startDueDate ? startDueDate.toISOString() : null,
      metadata: {
        countryCode,
        legalType,
        generatedFrom: 'legal-requirements',
        requirement: 'initial-setup',
      },
      createdAt: serverTimestamp(),
      createdBy: userId,
    };

    const startTaskRef = await addDoc(tasksCol, startTask);
    tasksCreated.push(startTaskRef.id);

    // Crear tareas para cada paso del proceso
    steps.forEach(async (step, index) => {
      // Distribuir las tareas a lo largo del período de lead time
      const stepOffset = Math.floor(leadTimeDays * (1 - (index + 1) / (steps.length + 1)));
      const stepDueDate = calculateDueDate(stepOffset);

      const stepTask = {
        title: step.title,
        description: step.description || '',
        category: 'legal',
        status: 'pending',
        priority: index === 0 ? 'high' : 'medium',
        dueDate: stepDueDate ? stepDueDate.toISOString() : null,
        metadata: {
          countryCode,
          legalType,
          generatedFrom: 'legal-requirements',
          requirement: step.id,
          stepNumber: index + 1,
          totalSteps: steps.length,
        },
        createdAt: serverTimestamp(),
        createdBy: userId,
      };

      const stepTaskRef = await addDoc(tasksCol, stepTask);
      tasksCreated.push(stepTaskRef.id);
    });

    // Crear tareas para documentos específicos
    const documentation = requirement.documentation || [];
    if (documentation.length > 0) {
      const docOffset = Math.floor(leadTimeDays * 0.7); // 70% del tiempo antes
      const docDueDate = calculateDueDate(docOffset);

      const docTask = {
        title: `Reunir documentación para ${countryData.name}`,
        description: `Documentos necesarios:\n${documentation.slice(0, 10).map((doc) => `• ${doc}`).join('\n')}${documentation.length > 10 ? `\n...y ${documentation.length - 10} más` : ''}`,
        category: 'legal',
        status: 'pending',
        priority: 'high',
        dueDate: docDueDate ? docDueDate.toISOString() : null,
        metadata: {
          countryCode,
          legalType,
          generatedFrom: 'legal-requirements',
          requirement: 'documentation',
          documentCount: documentation.length,
        },
        createdAt: serverTimestamp(),
        createdBy: userId,
      };

      const docTaskRef = await addDoc(tasksCol, docTask);
      tasksCreated.push(docTaskRef.id);
    }

    // Tarea para traducciones si es necesario
    if (requirement.translationsNeeded) {
      const translationOffset = Math.floor(leadTimeDays * 0.6);
      const translationDueDate = calculateDueDate(translationOffset);

      const translationTask = {
        title: `Traducir documentos (${countryData.name})`,
        description: `Obtener traducciones juradas de documentos extranjeros. Consultar con traductor certificado oficial.`,
        category: 'legal',
        status: 'pending',
        priority: 'high',
        dueDate: translationDueDate ? translationDueDate.toISOString() : null,
        metadata: {
          countryCode,
          legalType,
          generatedFrom: 'legal-requirements',
          requirement: 'translations',
        },
        createdAt: serverTimestamp(),
        createdBy: userId,
      };

      const translationTaskRef = await addDoc(tasksCol, translationTask);
      tasksCreated.push(translationTaskRef.id);
    }

    // Tarea para cita previa si es necesario
    if (requirement.requiresAppointment) {
      const appointmentOffset = Math.floor(leadTimeDays * 0.8);
      const appointmentDueDate = calculateDueDate(appointmentOffset);

      const appointmentTask = {
        title: `Reservar cita en ${requirement.authority || 'oficina correspondiente'}`,
        description: `Solicitar cita previa para iniciar el proceso. Autoridad: ${requirement.authority || 'Consultar localmente'}`,
        category: 'legal',
        status: 'pending',
        priority: 'high',
        dueDate: appointmentDueDate ? appointmentDueDate.toISOString() : null,
        metadata: {
          countryCode,
          legalType,
          generatedFrom: 'legal-requirements',
          requirement: 'appointment',
          authority: requirement.authority,
        },
        createdAt: serverTimestamp(),
        createdBy: userId,
      };

      const appointmentTaskRef = await addDoc(tasksCol, appointmentTask);
      tasksCreated.push(appointmentTaskRef.id);
    }

    // Tarea de seguimiento final
    const followUpOffset = Math.floor(leadTimeDays * 0.2); // 20% antes de la boda
    const followUpDueDate = calculateDueDate(followUpOffset);

    const followUpTask = {
      title: `Verificar estado de trámites legales (${countryData.name})`,
      description: `Confirmar que todos los documentos están en orden y el proceso está completo antes de la ceremonia.`,
      category: 'legal',
      status: 'pending',
      priority: 'critical',
      dueDate: followUpDueDate ? followUpDueDate.toISOString() : null,
      metadata: {
        countryCode,
        legalType,
        generatedFrom: 'legal-requirements',
        requirement: 'final-verification',
      },
      createdAt: serverTimestamp(),
      createdBy: userId,
    };

    const followUpTaskRef = await addDoc(tasksCol, followUpTask);
    tasksCreated.push(followUpTaskRef.id);

    return tasksCreated;
  } catch (error) {
    console.error('Error generando tareas legales:', error);
    throw error;
  }
}

/**
 * Obtiene el label legible del tipo de matrimonio
 */
function getLegalTypeLabel(legalType) {
  const labels = {
    civil: 'civil',
    same_sex: 'igualitario',
    religious_catholic: 'católico',
    religious_other: 'religioso',
    civil_partnership: 'unión civil',
  };
  return labels[legalType] || legalType;
}

/**
 * Crea recordatorios para fechas límite importantes
 * @param {string} weddingId - ID de la boda
 * @param {Array} taskIds - IDs de las tareas creadas
 * @param {string} userId - ID del usuario
 */
export async function createLegalReminders(weddingId, taskIds, userId) {
  try {
    const remindersCol = collection(db, 'weddings', weddingId, 'reminders');

    for (const taskId of taskIds) {
      // Crear recordatorio 7 días antes de cada tarea
      const reminder = {
        taskId,
        type: 'task_due_soon',
        daysBeforeDue: 7,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: userId,
      };

      await addDoc(remindersCol, reminder);
    }

    return true;
  } catch (error) {
    console.error('Error creando recordatorios:', error);
    return false;
  }
}

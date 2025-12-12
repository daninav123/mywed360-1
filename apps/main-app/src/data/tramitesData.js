/**
 * Trámites Data - Datos de trámites legales por país/región
 * FASE 4 del WORKFLOW-USUARIO.md
 */

export const TRAMITES_ESPANA = {
  civil: [
    {
      id: 'certificado-nacimiento',
      nombre: 'Certificado de nacimiento',
      descripcion: 'Original y actualizado (menos de 6 meses)',
      obligatorio: true,
      plazo: 180,
      responsable: 'ambos',
      donde: 'Registro Civil',
      notas: 'Debe ser literal y estar actualizado'
    },
    {
      id: 'dni-vigente',
      nombre: 'DNI/NIE vigente',
      descripcion: 'Documento de identidad en vigor',
      obligatorio: true,
      plazo: 30,
      responsable: 'ambos',
      donde: 'Comisaría de Policía',
      notas: 'Verificar fecha de caducidad'
    },
    {
      id: 'empadronamiento',
      nombre: 'Certificado de empadronamiento',
      descripcion: 'Certificado del ayuntamiento donde resides',
      obligatorio: true,
      plazo: 90,
      responsable: 'ambos',
      donde: 'Ayuntamiento',
      notas: 'Máximo 3 meses de antigüedad'
    },
    {
      id: 'expediente-matrimonial',
      nombre: 'Expediente matrimonial',
      descripcion: 'Tramitación en el Registro Civil',
      obligatorio: true,
      plazo: 60,
      responsable: 'ambos',
      donde: 'Registro Civil',
      notas: 'Iniciar mínimo 2 meses antes'
    },
    {
      id: 'testigos',
      nombre: 'Testigos (2)',
      descripcion: 'DNI de dos testigos mayores de edad',
      obligatorio: true,
      plazo: 30,
      responsable: 'pareja',
      donde: 'N/A',
      notas: 'Deben estar presentes el día de la boda'
    },
    {
      id: 'divorcio-previo',
      nombre: 'Certificado de divorcio',
      descripcion: 'Si hubo matrimonio anterior',
      obligatorio: false,
      plazo: 180,
      responsable: 'individual',
      donde: 'Registro Civil',
      notas: 'Solo si aplica'
    },
    {
      id: 'defuncion-conyuge',
      nombre: 'Certificado de defunción',
      descripcion: 'Si el cónyuge anterior falleció',
      obligatorio: false,
      plazo: 180,
      responsable: 'individual',
      donde: 'Registro Civil',
      notas: 'Solo si aplica'
    }
  ],
  religiosa: [
    {
      id: 'certificado-bautismo',
      nombre: 'Certificado de bautismo',
      descripcion: 'Original y reciente',
      obligatorio: true,
      plazo: 180,
      responsable: 'ambos',
      donde: 'Parroquia de bautismo',
      notas: 'Menos de 6 meses'
    },
    {
      id: 'certificado-confirmacion',
      nombre: 'Certificado de confirmación',
      descripcion: 'Para matrimonio católico',
      obligatorio: true,
      plazo: 180,
      responsable: 'ambos',
      donde: 'Parroquia de confirmación',
      notas: 'Verificar con parroquia'
    },
    {
      id: 'curso-prematrimonial',
      nombre: 'Curso prematrimonial',
      descripcion: 'Obligatorio para matrimonio católico',
      obligatorio: true,
      plazo: 90,
      responsable: 'ambos',
      donde: 'Parroquia',
      notas: 'Suele durar 2-3 sesiones'
    },
    {
      id: 'expediente-matrimonial-canonico',
      nombre: 'Expediente matrimonial canónico',
      descripcion: 'Tramitación en la parroquia',
      obligatorio: true,
      plazo: 90,
      responsable: 'ambos',
      donde: 'Parroquia donde se celebra',
      notas: 'Iniciar con antelación'
    },
    {
      id: 'permisos-parroquia',
      nombre: 'Permisos especiales',
      descripcion: 'Si no es tu parroquia habitual',
      obligatorio: false,
      plazo: 60,
      responsable: 'ambos',
      donde: 'Ambas parroquias',
      notas: 'Consultar con párroco'
    }
  ],
  extranjeros: [
    {
      id: 'certificado-capacidad',
      nombre: 'Certificado de capacidad matrimonial',
      descripcion: 'Para ciudadanos extranjeros',
      obligatorio: true,
      plazo: 180,
      responsable: 'individual',
      donde: 'Consulado del país de origen',
      notas: 'Legalizado y traducido'
    },
    {
      id: 'pasaporte-vigente',
      nombre: 'Pasaporte vigente',
      descripcion: 'En vigor durante todo el proceso',
      obligatorio: true,
      plazo: 90,
      responsable: 'individual',
      donde: 'Consulado',
      notas: 'Verificar caducidad'
    },
    {
      id: 'apostilla-haya',
      nombre: 'Apostilla de La Haya',
      descripcion: 'Para documentos extranjeros',
      obligatorio: true,
      plazo: 120,
      responsable: 'individual',
      donde: 'País de origen',
      notas: 'Para países del convenio'
    },
    {
      id: 'traduccion-jurada',
      nombre: 'Traducción jurada',
      descripcion: 'De todos los documentos extranjeros',
      obligatorio: true,
      plazo: 60,
      responsable: 'individual',
      donde: 'Traductor oficial',
      notas: 'Por traductor jurado en España'
    }
  ],
  postboda: [
    {
      id: 'inscripcion-matrimonio',
      nombre: 'Inscripción del matrimonio',
      descripcion: 'En el Registro Civil',
      obligatorio: true,
      plazo: 5,
      responsable: 'ambos',
      donde: 'Registro Civil',
      notas: 'Lo hace el juez/párroco automáticamente'
    },
    {
      id: 'libro-familia',
      nombre: 'Libro de Familia',
      descripcion: 'Recoger en el Registro Civil',
      obligatorio: true,
      plazo: 30,
      responsable: 'ambos',
      donde: 'Registro Civil',
      notas: 'Suele tardar 2-4 semanas'
    },
    {
      id: 'cambio-nombre-documentos',
      nombre: 'Cambio de apellido en documentos',
      descripcion: 'Si se cambia el apellido',
      obligatorio: false,
      plazo: 90,
      responsable: 'individual',
      donde: 'Varios',
      notas: 'DNI, SS, banco, etc.'
    },
    {
      id: 'declaracion-conjunta',
      nombre: 'Declaración de la renta conjunta',
      descripcion: 'Opción para el siguiente año fiscal',
      obligatorio: false,
      plazo: 365,
      responsable: 'ambos',
      donde: 'Agencia Tributaria',
      notas: 'Puede ser beneficioso'
    }
  ]
};

export const CATEGORIAS_TRAMITES = [
  {
    id: 'civil',
    nombre: 'Matrimonio Civil',
    icono: '📋',
    descripcion: 'Trámites para boda civil en España'
  },
  {
    id: 'religiosa',
    nombre: 'Matrimonio Religioso',
    icono: '⛪',
    descripcion: 'Trámites para boda religiosa (católica)'
  },
  {
    id: 'extranjeros',
    nombre: 'Extranjeros',
    icono: '🌍',
    descripcion: 'Documentación adicional para no residentes'
  },
  {
    id: 'postboda',
    nombre: 'Post-Boda',
    icono: '📝',
    descripcion: 'Trámites después de la ceremonia'
  }
];

export const getTramitesByCategoria = (categoria) => {
  return TRAMITES_ESPANA[categoria] || [];
};

export const getAllTramites = () => {
  return Object.values(TRAMITES_ESPANA).flat();
};

export const getTramitesObligatorios = (categoria) => {
  const tramites = getTramitesByCategoria(categoria);
  return tramites.filter(t => t.obligatorio);
};

export const calcularFechaLimite = (fechaBoda, diasAntes) => {
  const fecha = new Date(fechaBoda);
  fecha.setDate(fecha.getDate() - diasAntes);
  return fecha;
};

export const getTramitesUrgentes = (tramites, fechaBoda, diasAlerta = 30) => {
  const hoy = new Date();
  const fechaBodaDate = new Date(fechaBoda);
  
  return tramites.filter(t => {
    if (t.completado) return false;
    const fechaLimite = calcularFechaLimite(fechaBodaDate, t.tramite?.plazo || 30);
    const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
    return diasRestantes <= diasAlerta;
  });
};

export default {
  TRAMITES_ESPANA,
  CATEGORIAS_TRAMITES,
  getTramitesByCategoria,
  getAllTramites,
  getTramitesObligatorios,
  calcularFechaLimite,
  getTramitesUrgentes
};

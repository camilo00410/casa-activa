/**
 * Datos del informe. Lo marcado con [[ ]] solo lo conoce el equipo: el generador lo
 * resalta en amarillo en el PDF y lo advierte en consola para que no se entregue sin completar.
 */
export const CONFIG = {
  institucion: 'Corporación Unificada Nacional de Educación Superior – CUN',
  programa: 'Ingeniería de Sistemas',
  asignatura: 'Ingeniería Web',
  grupo: '54483/26V04',
  actividad: 'Actividad de Construcción Aplicada: wireframe, mockup y prototipo de una página de recomendaciones saludables',
  docente: 'Sergio Alexander Mora',
  fechaEntrega: '8 de noviembre de 2026',
  integrantes: ['Camilo Andres Loaiza Bustamante', 'Edwin Alexis Paez Cetina'],
  urlPrototipo: 'https://camilo00410.github.io/casa-activa/',
  urlRepositorio: 'https://github.com/camilo00410/casa-activa',
  /** Aportes de cada integrante para el Anexo A. */
  aportes: [
    {
      integrante: 'Camilo Andres Loaiza Bustamante',
      aporte: [
        'Coordinación del proyecto y contraste con la guía y la rúbrica.',
        'Diagnóstico del MVP, plan de trabajo y replanteamiento del alcance a las cuatro categorías.',
        'Análisis argumentado de los requerimientos funcionales y no funcionales.',
        'Wireframes completos y mapa de pantallas.',
        'Sistema visual y mockups de alta fidelidad.',
        'Prototipo funcional: registro, perfil de salud, búsqueda, personalización, favoritos, hábitos y administración.',
        'Pruebas automáticas y auditorías de accesibilidad y rendimiento.',
        'Redacción y edición del informe final.',
        'Publicación del prototipo y del repositorio.',
      ],
    },
    {
      integrante: 'Edwin Alexis Paez Cetina',
      aporte: [
        'Propuesta inicial del proyecto y marca Casa Activa.',
        'MVP en HTML y CSS: identidad visual, portada y tarjetas, que se conservaron en la versión final.',
        'Primera versión del informe, con los primeros requisitos, wireframes y mockups.',
      ],
    },
  ],
};

/** Mediciones reales del proyecto. Se actualizan al volver a ejecutar las pruebas. */
export const MEDIDAS = {
  pruebasUnitarias: 127,
  pruebasE2E: 300,
  pruebasOmitidas: 3,
  rutasAuditadas: 21,
  busquedaMs: '3',
  filtrosMs: '1,3',
  personalizacionMs: '4,9',
};

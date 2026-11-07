/**
 * Vocabulario del dominio. Agregar una categoría u objetivo nuevo solo exige
 * tocar este archivo: la interfaz, los filtros y el motor de recomendaciones
 * se construyen a partir de estas listas (RNF2).
 */

export const CATEGORIAS = [
  { id: 'alimentacion', nombre: 'Alimentación', icono: 'apple', descripcion: 'Decisiones simples para comer mejor cada día.' },
  { id: 'actividad', nombre: 'Actividad física', icono: 'dumbbell', descripcion: 'Rutinas cortas para moverte en casa, sin equipos.' },
  { id: 'descanso', nombre: 'Descanso', icono: 'moon', descripcion: 'Hábitos que preparan al cuerpo para dormir bien.' },
  { id: 'bienestar', nombre: 'Bienestar', icono: 'leaf', descripcion: 'Pausas y prácticas para manejar el estrés.' },
];

export const NIVELES = [
  { id: 'principiante', nombre: 'Principiante' },
  { id: 'intermedio', nombre: 'Intermedio' },
  { id: 'avanzado', nombre: 'Avanzado' },
];

export const OBJETIVOS = [
  { id: 'comer-mejor', nombre: 'Comer mejor', descripcion: 'Mejorar lo que como en el día a día.', icono: 'apple' },
  { id: 'moverme-mas', nombre: 'Moverme más', descripcion: 'Dejar el sedentarismo y ganar condición.', icono: 'dumbbell' },
  { id: 'dormir-mejor', nombre: 'Dormir mejor', descripcion: 'Descansar más y despertar con energía.', icono: 'moon' },
  { id: 'reducir-estres', nombre: 'Reducir el estrés', descripcion: 'Encontrar calma en días exigentes.', icono: 'leaf' },
  { id: 'peso-saludable', nombre: 'Peso saludable', descripcion: 'Combinar alimentación y movimiento.', icono: 'scale' },
];

export const NIVELES_ACTIVIDAD = [
  { id: 'sedentario', nombre: 'Poco activo', descripcion: 'Paso casi todo el día sentado.', nivel: 'principiante' },
  { id: 'moderado', nombre: 'Algo activo', descripcion: 'Me muevo algunos días a la semana.', nivel: 'intermedio' },
  { id: 'activo', nombre: 'Muy activo', descripcion: 'Hago ejercicio casi todos los días.', nivel: 'avanzado' },
];

export const DIETAS = [
  { id: 'omnivora', nombre: 'Omnívora' },
  { id: 'vegetariana', nombre: 'Vegetariana' },
  { id: 'vegana', nombre: 'Vegana' },
];

export const RESTRICCIONES = [
  { id: 'sin-lactosa', nombre: 'Intolerancia a la lactosa' },
  { id: 'sin-gluten', nombre: 'Sin gluten' },
  { id: 'alergia-frutos-secos', nombre: 'Alergia a frutos secos o maní' },
];

export const CONDICIONES = [
  { id: 'hipertension', nombre: 'Hipertensión' },
  { id: 'diabetes', nombre: 'Diabetes' },
  { id: 'dolor-rodilla', nombre: 'Dolor de rodilla' },
  { id: 'dolor-espalda', nombre: 'Dolor de espalda' },
  { id: 'embarazo', nombre: 'Embarazo' },
];

/** Marcadores que una recomendación puede declarar como exclusión de seguridad. */
export const MARCADORES_EXCLUSION = [
  ...DIETAS.filter((d) => d.id !== 'omnivora'),
  ...RESTRICCIONES,
  ...CONDICIONES,
];

export const DURACIONES = [10, 20, 30];

/** Versión vigente de la política de tratamiento de datos. */
export const VERSION_POLITICA = '1.0';

export const nombreDe = (lista, id) => lista.find((x) => x.id === id)?.nombre ?? id;
export const categoriaPorId = (id) => CATEGORIAS.find((c) => c.id === id);

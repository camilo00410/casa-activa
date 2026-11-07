/**
 * Motor de personalización (RF4).
 *
 * Es un sistema de reglas explicable en cuatro etapas:
 *   1. Seguridad: descarta lo incompatible con el perfil. Es una regla dura.
 *   2. Puntuación: suma puntos por criterios con peso conocido (máximo 100).
 *   3. Diversidad: limita cuántas recomendaciones entran por categoría.
 *   4. Explicación: cada punto ganado deja una razón legible para el usuario.
 *
 * El IMC no se usa a propósito: es orientativo, existen otras medidas (OMS, 2026) y
 * decidir contenido de salud con un solo número sería poco prudente.
 */
import { NIVELES, NIVELES_ACTIVIDAD, OBJETIVOS, MARCADORES_EXCLUSION, nombreDe } from './catalogo.js';

export const PESOS = Object.freeze({ objetivo: 40, nivel: 20, tiempo: 15, necesidad: 15, afinidad: 10 });
export const HORAS_SUENO_MINIMAS = 7;
export const ESTRES_ALTO = 4;

const indiceNivel = (id) => NIVELES.findIndex((n) => n.id === id);

export function marcadoresDelPerfil(perfil) {
  if (!perfil) return new Set();
  const dieta = perfil.dieta && perfil.dieta !== 'omnivora' ? [perfil.dieta] : [];
  return new Set([...dieta, ...(perfil.restricciones ?? []), ...(perfil.condiciones ?? [])]);
}

/** Motivos por los que una recomendación no es adecuada para el perfil. Vacío si es segura. */
export function motivosDeExclusion(rec, perfil) {
  const marcadores = marcadoresDelPerfil(perfil);
  return (rec.excluye ?? []).filter((m) => marcadores.has(m)).map((m) => nombreDe(MARCADORES_EXCLUSION, m));
}

export const esSegura = (rec, perfil) => motivosDeExclusion(rec, perfil).length === 0;

/** Traduce señales del perfil a necesidades por categoría. */
export function detectarNecesidades(perfil) {
  const necesidades = [];
  if (!perfil) return necesidades;
  if (Number(perfil.horasSueno) < HORAS_SUENO_MINIMAS) {
    necesidades.push({ categoria: 'descanso', motivo: `Duermes ${perfil.horasSueno} horas; lo recomendado son ${HORAS_SUENO_MINIMAS} o más` });
  }
  if (Number(perfil.estres) >= ESTRES_ALTO) necesidades.push({ categoria: 'bienestar', motivo: 'Reportaste un nivel de estrés alto' });
  if (perfil.nivelActividad === 'sedentario') necesidades.push({ categoria: 'actividad', motivo: 'Te ayuda a moverte más durante el día' });
  return necesidades;
}

function puntosNivel(rec, perfil) {
  const objetivo = NIVELES_ACTIVIDAD.find((n) => n.id === perfil.nivelActividad)?.nivel ?? 'principiante';
  const diferencia = indiceNivel(rec.nivel) - indiceNivel(objetivo);
  if (diferencia === 0) return PESOS.nivel;
  if (diferencia < 0) return Math.round(PESOS.nivel * (diferencia === -1 ? 0.6 : 0.3)); // más fácil de lo necesario
  return diferencia === 1 ? Math.round(PESOS.nivel * 0.2) : 0; // más exigente que tu nivel
}

function puntosTiempo(rec, perfil) {
  const disponible = Number(perfil.minutosDisponibles) || 0;
  if (!disponible) return 0;
  if (rec.minutos <= disponible) return PESOS.tiempo;
  return Math.max(0, Math.round(PESOS.tiempo * (1 - (rec.minutos - disponible) / disponible)));
}

function puntosAfinidad(rec, favoritas) {
  const similares = favoritas.filter((f) => f.id !== rec.id && (f.categoria === rec.categoria
    || (f.etiquetas ?? []).some((e) => (rec.etiquetas ?? []).includes(e))));
  return Math.min(PESOS.afinidad, similares.length * 4);
}

/** Calcula el puntaje (0 a 100) y las razones visibles de una recomendación. */
export function puntuar(rec, perfil, favoritas = []) {
  const razones = [];
  let puntaje = 0;
  if (rec.objetivos.includes(perfil.objetivo)) {
    puntaje += PESOS.objetivo;
    razones.push(`Apoya tu objetivo: ${nombreDe(OBJETIVOS, perfil.objetivo).toLowerCase()}`);
  }
  const nivel = puntosNivel(rec, perfil);
  puntaje += nivel;
  if (nivel === PESOS.nivel) razones.push('Se ajusta a tu nivel');
  const tiempo = puntosTiempo(rec, perfil);
  puntaje += tiempo;
  if (tiempo === PESOS.tiempo) razones.push(`Cabe en tus ${perfil.minutosDisponibles} minutos disponibles`);
  const necesidad = detectarNecesidades(perfil).find((n) => n.categoria === rec.categoria);
  if (necesidad) {
    puntaje += PESOS.necesidad;
    razones.unshift(necesidad.motivo);
  }
  const afinidad = puntosAfinidad(rec, favoritas);
  puntaje += afinidad;
  if (afinidad > 0) razones.push('Se parece a lo que guardaste');
  return { puntaje, razones };
}

/**
 * Lista personalizada. Sin perfil devuelve una selección general, sin razones inventadas.
 * @param {object|null} perfil
 * @param {object[]} catalogo Recomendaciones publicadas.
 * @param {{favoritas?: object[], descartes?: string[]}} contexto
 * @param {{limite?: number, maxPorCategoria?: number}} opciones
 */
export function recomendar(perfil, catalogo, contexto = {}, opciones = {}) {
  const { favoritas = [], descartes = [] } = contexto;
  const { limite = 9, maxPorCategoria = 4 } = opciones;
  const descartadas = new Set(descartes);
  const candidatas = catalogo.filter((r) => !descartadas.has(r.id) && esSegura(r, perfil));

  const puntuadas = candidatas
    .map((rec) => ({ rec, ...(perfil ? puntuar(rec, perfil, favoritas) : { puntaje: 0, razones: [] }) }))
    .sort((a, b) => b.puntaje - a.puntaje || a.rec.id.localeCompare(b.rec.id));

  const conteo = {};
  const seleccion = [];
  for (const item of puntuadas) {
    if (seleccion.length >= limite) break;
    const usados = conteo[item.rec.categoria] ?? 0;
    if (usados < maxPorCategoria) {
      seleccion.push(item);
      conteo[item.rec.categoria] = usados + 1;
    }
  }
  return seleccion;
}

/** Plan de hoy: la mejor opción segura de cada categoría, sin repetir la lista completa. */
export function planDelDia(perfil, catalogo, contexto = {}, categorias = []) {
  return categorias
    .map((c) => recomendar(perfil, catalogo.filter((r) => r.categoria === c.id), contexto, { limite: 1 })[0])
    .filter(Boolean);
}

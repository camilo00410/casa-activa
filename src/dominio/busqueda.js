/**
 * Búsqueda y filtrado del catálogo (RF3).
 * El texto se normaliza una sola vez en un índice para que cada consulta
 * sea rápida incluso con catálogos grandes (RNF1, RNF2).
 */
export const TAMANO_PAGINA = 12;

/** Minúsculas y sin diacríticos: «Sueño» y «sueno» son la misma búsqueda. */
export const normalizar = (texto = '') => String(texto).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const tokenizar = (consulta) => normalizar(consulta).split(/\s+/).filter(Boolean);

export function prepararIndice(recomendaciones) {
  return recomendaciones.map((rec) => {
    const titulo = normalizar(rec.titulo);
    return {
      rec,
      titulo,
      palabrasTitulo: titulo.split(/\s+/),
      etiquetas: normalizar((rec.etiquetas ?? []).join(' ')),
      resto: normalizar(`${rec.resumen} ${(rec.beneficios ?? []).join(' ')} ${(rec.pasos ?? []).join(' ')}`),
    };
  });
}

/** Devuelve la relevancia, o 0 si falta alguna palabra: la consulta se trata como un Y lógico. */
function puntuarEntrada(entrada, tokens) {
  let total = 0;
  for (const token of tokens) {
    let puntos = 0;
    if (entrada.palabrasTitulo.some((p) => p.startsWith(token))) puntos += 8;
    else if (entrada.titulo.includes(token)) puntos += 5;
    if (entrada.etiquetas.includes(token)) puntos += 3;
    if (entrada.resto.includes(token)) puntos += 1;
    if (puntos === 0) return 0;
    total += puntos;
  }
  return total;
}

const pasaFiltros = (rec, c, { ignorarCategoria = false } = {}) => (
  (ignorarCategoria || !c.categorias?.length || c.categorias.includes(rec.categoria))
  && (!c.duracionMax || rec.minutos <= c.duracionMax)
  && (!c.niveles?.length || c.niveles.includes(rec.nivel))
  && (!c.objetivo || rec.objetivos.includes(c.objetivo))
);

const COMPARADORES = {
  titulo: (a, b) => a.rec.titulo.localeCompare(b.rec.titulo, 'es'),
  duracion: (a, b) => a.rec.minutos - b.rec.minutos || a.rec.titulo.localeCompare(b.rec.titulo, 'es'),
  recientes: (a, b) => String(b.rec.actualizado).localeCompare(String(a.rec.actualizado)) || a.rec.id.localeCompare(b.rec.id),
  relevancia: (a, b) => b.puntaje - a.puntaje || a.rec.titulo.localeCompare(b.rec.titulo, 'es'),
};

/**
 * @param {ReturnType<typeof prepararIndice>} indice
 * @param {{texto?: string, categorias?: string[], duracionMax?: number, niveles?: string[], objetivo?: string, orden?: string}} criterios
 * @returns {{resultados: object[], total: number, facetas: Record<string, number>}}
 */
export function buscar(indice, criterios = {}) {
  const tokens = tokenizar(criterios.texto ?? '');
  const puntuados = [];
  const facetas = {};
  for (const entrada of indice) {
    const puntaje = tokens.length ? puntuarEntrada(entrada, tokens) : 1;
    if (puntaje === 0) continue;
    // La faceta ignora el propio filtro de categoría: así el número indica lo que se obtendría al marcarla.
    if (pasaFiltros(entrada.rec, criterios, { ignorarCategoria: true })) {
      facetas[entrada.rec.categoria] = (facetas[entrada.rec.categoria] ?? 0) + 1;
    }
    if (pasaFiltros(entrada.rec, criterios)) puntuados.push({ rec: entrada.rec, puntaje });
  }
  const orden = Object.hasOwn(COMPARADORES, criterios.orden ?? '') ? criterios.orden : (tokens.length ? 'relevancia' : 'titulo');
  puntuados.sort(COMPARADORES[orden]);
  return { resultados: puntuados.map((p) => p.rec), total: puntuados.length, facetas };
}

/** Crea el identificador de URL a partir del título; agrega un sufijo si ya existe. */
export function crearSlug(titulo, existentes = []) {
  const base = normalizar(titulo).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'recomendacion';
  const usados = new Set(existentes);
  if (!usados.has(base)) return base;
  let i = 2;
  while (usados.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

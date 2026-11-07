/**
 * Enrutador por hash. Permite publicar en cualquier hosting estático, porque el
 * servidor solo entrega index.html, y da URL compartibles a cada pantalla.
 * Solo atiende hashes que empiezan por «#/»; el enlace para saltar al contenido sigue siendo nativo.
 */

/** '#/explorar?q=sueño&cat=a,b' → { ruta: '/explorar', consulta: { q: 'sueño', cat: 'a,b' } } */
export function interpretarHash(hash) {
  // Un fragmento ajeno, como #contenido al recargar, no debe mostrarse como página inexistente.
  const limpio = hash.startsWith('#/') ? hash.slice(1) : '/';
  const [ruta, cadena = ''] = limpio.split('?');
  return { ruta: ruta || '/', consulta: Object.fromEntries(new URLSearchParams(cadena)) };
}

export function construirHash(ruta, consulta = {}) {
  const parametros = new URLSearchParams(Object.entries(consulta).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  const cadena = parametros.toString();
  return `#${ruta}${cadena ? `?${cadena}` : ''}`;
}

/** Compara '/recomendacion/:id' con la ruta y devuelve sus parámetros, o null. */
export function coincidir(patron, ruta) {
  const a = patron.split('/').filter(Boolean);
  const b = ruta.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const parametros = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith(':')) {
      try {
        parametros[a[i].slice(1)] = decodeURIComponent(b[i]);
      } catch {
        return null; // Un «%» suelto en la URL es una ruta inexistente, no un error.
      }
    } else if (a[i] !== b[i]) return null;
  }
  return parametros;
}

/** Solo admite destinos internos: evita redirecciones abiertas con ?volver=. */
export const destinoSeguro = (ruta, porDefecto = '/para-ti') => (typeof ruta === 'string' && /^\/(?!\/)[\w\-/%?=&,.+]*$/.test(ruta) ? ruta : porDefecto);

export function encontrarRuta(rutas, ruta) {
  for (const definicion of rutas) {
    const parametros = coincidir(definicion.patron, ruta);
    if (parametros) return { definicion, parametros };
  }
  return null;
}

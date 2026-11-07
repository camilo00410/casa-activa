/** Piezas de interfaz compartidas entre pantallas. */
import { h, icono } from '../nucleo/dom.js';
import { NIVELES, categoriaPorId, nombreDe } from '../dominio/catalogo.js';

export const rutaImagen = (nombre) => `assets/img/${nombre}.webp`;

export function etiquetaCategoria(categoriaId) {
  const c = categoriaPorId(categoriaId);
  return h('span', { class: `chip-cat cat-${categoriaId}` }, icono(c.icono), c.nombre);
}

export const metaRecomendacion = (rec) => h('p', { class: 'meta' },
  h('span', {}, icono('clock'), `${rec.minutos} min`),
  h('span', {}, icono('gauge'), nombreDe(NIVELES, rec.nivel)));

export function botonFavorito(app, rec, marcado, { conTexto = false } = {}) {
  const etiqueta = (activo) => `${activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}: ${rec.titulo}`;
  const pintar = (el, activo) => {
    el.setAttribute('aria-pressed', String(activo));
    el.setAttribute('aria-label', etiqueta(activo));
    el.replaceChildren(icono('heart'), ...(conTexto ? [activo ? 'Guardada' : 'Guardar'] : []));
  };
  const el = h('button', {
    type: 'button',
    class: conTexto ? 'btn btn-favorito' : 'btn-corazon',
    onClick: async () => {
      if (!app.usuario) {
        app.toast('Ingresa para guardar tus favoritos.');
        app.ir('/ingreso', { volver: location.hash.slice(1) });
        return;
      }
      const activo = await app.personal.alternarFavorito(app.usuario.id, rec.id);
      pintar(el, activo);
      app.toast(activo ? 'Guardada en favoritos.' : 'Quitada de favoritos.', { tipo: activo ? 'exito' : 'info' });
      el.dispatchEvent(new CustomEvent('favorito', { bubbles: true, detail: { id: rec.id, activo } }));
    },
  });
  pintar(el, marcado);
  return el;
}

/**
 * Tarjeta de recomendación. Toda la tarjeta enlaza al detalle mediante el título;
 * el botón de favorito queda por encima, así no hay enlaces anidados.
 */
export function tarjeta(app, rec, { favoritas = new Set(), razones = [], alDescartar = null, carga = 'lazy' } = {}) {
  return h('article', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-imagen' },
      h('img', { src: rutaImagen(rec.imagen), alt: '', width: 560, height: 420, loading: carga, decoding: 'async' })),
    h('div', { class: 'tarjeta-cuerpo' },
      h('div', { class: 'tarjeta-fila' }, etiquetaCategoria(rec.categoria), botonFavorito(app, rec, favoritas.has(rec.id))),
      h('h3', {}, h('a', { href: `#/recomendacion/${rec.id}`, class: 'enlace-tarjeta' }, rec.titulo)),
      h('p', { class: 'tarjeta-resumen' }, rec.resumen),
      metaRecomendacion(rec),
      razones.length > 0 && h('div', { class: 'razones' },
        h('p', { class: 'razones-titulo' }, icono('lightbulb'), 'Por qué te lo sugerimos'),
        h('ul', {}, razones.slice(0, 2).map((r) => h('li', {}, r)))),
      alDescartar && h('button', { type: 'button', class: 'btn-texto', 'aria-label': `No me interesa: ${rec.titulo}`, onClick: () => alDescartar(rec) }, icono('ban'), 'No me interesa')));
}

export const rejilla = (hijos, { clase = '' } = {}) => h('div', { class: `rejilla ${clase}`.trim() }, hijos);

export function estadoVacio({ ico = 'search', titulo, texto, accion = null, nivel = 'h2' }) {
  return h('div', { class: 'vacio' },
    h('span', { class: 'vacio-icono' }, icono(ico)),
    h(nivel, {}, titulo),
    h('p', {}, texto),
    accion);
}

export function aviso({ tipo = 'info', titulo, texto, accion = null }) {
  const ICONOS = { info: 'info', exito: 'circle-check', error: 'triangle-alert', advertencia: 'triangle-alert' };
  return h('div', { class: `aviso aviso-${tipo}`, role: tipo === 'error' ? 'alert' : undefined },
    icono(ICONOS[tipo]),
    h('div', {}, titulo && h('strong', {}, titulo), texto && h('p', {}, texto), accion));
}

export const encabezado = ({ titulo, texto, acciones = null }) => h('header', { class: 'encabezado-pagina' },
  h('div', {}, h('h1', {}, titulo), texto && h('p', {}, texto)),
  acciones && h('div', { class: 'encabezado-acciones' }, acciones));

export const pagina = (...hijos) => h('div', { class: 'pagina' }, hijos);

export const indicador = ({ ico, valor, etiqueta, progreso = null }) => h('div', { class: 'indicador' },
  h('span', { class: 'indicador-icono' }, icono(ico)),
  h('div', { class: 'indicador-datos' },
    h('strong', {}, valor),
    h('span', {}, etiqueta),
    progreso !== null && barraProgreso(progreso, etiqueta)));

export function barraProgreso(porcentaje, etiqueta) {
  const relleno = h('span');
  relleno.style.width = `${Math.min(100, Math.max(0, porcentaje))}%`;
  return h('span', { class: 'barra', role: 'progressbar', 'aria-valuenow': Math.round(porcentaje), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': etiqueta }, relleno);
}

/** Vuelve a dibujar una zona sin perder el foco del teclado. */
export function conservarFoco(fn) {
  const clave = document.activeElement?.dataset?.foco;
  fn();
  if (clave) document.querySelector(`[data-foco="${CSS.escape(clave)}"]`)?.focus();
}

export function avisoSalud() {
  return h('p', { class: 'aviso-salud' }, icono('info'),
    'Contenido educativo y general. No reemplaza la valoración de un profesional de la salud.');
}

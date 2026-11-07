/**
 * Construcción segura de la interfaz.
 * Todo el contenido entra como nodo de texto y nunca como HTML, así que un título
 * con <script> se muestra como texto y no se ejecuta. Esta es la defensa principal
 * contra XSS (RNF3); una prueba automática verifica que nadie use innerHTML en src/.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function aplicarPropiedades(el, props) {
  for (const [clave, valor] of Object.entries(props)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave.startsWith('on') && typeof valor === 'function') el.addEventListener(clave.slice(2).toLowerCase(), valor);
    else if (clave === 'class') el.setAttribute('class', valor);
    else if (clave === 'ref') valor(el);
    else if (clave === 'value' || clave === 'checked' || clave === 'selected' || clave === 'disabled') el[clave] = valor;
    else el.setAttribute(clave, valor === true ? '' : String(valor));
  }
}

function agregarHijos(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
}

/** h('p', { class: 'x' }, 'texto', otroNodo) */
export function h(etiqueta, props, ...hijos) {
  const el = document.createElement(etiqueta);
  const sonProps = props && typeof props === 'object' && !(props instanceof Node) && !Array.isArray(props);
  if (sonProps) aplicarPropiedades(el, props);
  agregarHijos(el, sonProps ? hijos : [props, ...hijos]);
  return el;
}

/** Igual que h(), para nodos SVG. */
export function s(etiqueta, props = {}, ...hijos) {
  const el = document.createElementNS(SVG_NS, etiqueta);
  aplicarPropiedades(el, props);
  agregarHijos(el, hijos);
  return el;
}

/** Icono del sprite local. Es decorativo salvo que se indique un título. */
export function icono(nombre, { titulo, clase = '' } = {}) {
  const svg = s('svg', { class: `icono ${clase}`.trim(), width: 24, height: 24, ...(titulo ? { role: 'img', 'aria-label': titulo } : { 'aria-hidden': 'true', focusable: 'false' }) });
  const uso = s('use');
  uso.setAttribute('href', `assets/iconos.svg#i-${nombre}`);
  svg.append(uso);
  return svg;
}

export const vaciar = (el) => { el.replaceChildren(); return el; };

/**
 * Reemplaza el contenido de un elemento. A diferencia de append() nativo, ignora
 * false, null y undefined: así «condicion && nodo» nunca pinta la palabra «false».
 */
export function rellenar(el, ...hijos) {
  vaciar(el);
  agregarHijos(el, hijos);
  return el;
}

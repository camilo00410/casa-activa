/** Campos accesibles: cada uno enlaza su etiqueta, su ayuda y su mensaje de error. */
import { h, icono } from '../nucleo/dom.js';

const idDe = (nombre) => `campo-${nombre}`;

function envoltura(nombre, etiqueta, control, ayuda) {
  return h('div', { class: 'campo', 'data-campo': nombre },
    h('label', { for: idDe(nombre) }, etiqueta),
    ayuda && h('p', { class: 'ayuda', id: `${idDe(nombre)}-ayuda` }, ayuda),
    control,
    h('p', { class: 'error-campo', id: `${idDe(nombre)}-error`, hidden: true }));
}

const describedBy = (nombre, ayuda) => `${ayuda ? `${idDe(nombre)}-ayuda ` : ''}${idDe(nombre)}-error`;

export function campo({ nombre, etiqueta, tipo = 'text', valor = '', ayuda, requerido, autocompletar, min, max, paso, placeholder, alEscribir }) {
  return envoltura(nombre, etiqueta, h('input', {
    id: idDe(nombre), name: nombre, type: tipo, value: valor, placeholder, min, max, step: paso,
    autocomplete: autocompletar, required: requerido, 'aria-describedby': describedBy(nombre, ayuda), onInput: alEscribir,
  }), ayuda);
}

export function campoPassword({ nombre, etiqueta, ayuda, autocompletar, alEscribir }) {
  const input = h('input', { id: idDe(nombre), name: nombre, type: 'password', autocomplete: autocompletar, required: true, 'aria-describedby': describedBy(nombre, ayuda), onInput: alEscribir });
  const boton = h('button', {
    type: 'button', class: 'btn-ver', 'aria-label': 'Mostrar contraseña', 'aria-pressed': 'false',
    onClick: () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      boton.setAttribute('aria-pressed', String(visible));
      boton.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      boton.replaceChildren(icono(visible ? 'eye-off' : 'eye'));
    },
  }, icono('eye'));
  return envoltura(nombre, etiqueta, h('div', { class: 'con-accion' }, input, boton), ayuda);
}

export function areaTexto({ nombre, etiqueta, valor = '', ayuda, filas = 4 }) {
  return envoltura(nombre, etiqueta, h('textarea', { id: idDe(nombre), name: nombre, rows: filas, value: valor, 'aria-describedby': describedBy(nombre, ayuda) }), ayuda);
}

export function selector({ nombre, etiqueta, opciones, valor = '', ayuda, vacio, alCambiar }) {
  return envoltura(nombre, etiqueta, h('select', { id: idDe(nombre), name: nombre, 'aria-describedby': describedBy(nombre, ayuda), onChange: alCambiar },
    vacio && h('option', { value: '' }, vacio),
    opciones.map((o) => h('option', { value: o.id, selected: String(o.id) === String(valor) }, o.nombre))), ayuda);
}

export function casilla({ nombre, etiqueta, marcado = false, alCambiar }) {
  return h('div', { class: 'campo campo-casilla', 'data-campo': nombre },
    h('label', { class: 'casilla' },
      h('input', { id: idDe(nombre), name: nombre, type: 'checkbox', checked: marcado, 'aria-describedby': `${idDe(nombre)}-error`, onChange: alCambiar }),
      h('span', {}, etiqueta)),
    h('p', { class: 'error-campo', id: `${idDe(nombre)}-error`, hidden: true }));
}

/** Grupo de opciones con el mismo nombre. tipo: 'radio' (una) o 'checkbox' (varias). */
export function grupoOpciones({ nombre, leyenda, opciones, valor, tipo = 'radio', estilo = 'chip', ayuda, alCambiar }) {
  const seleccion = new Set([valor].flat());
  return h('fieldset', { class: 'campo grupo', 'data-campo': nombre, 'aria-describedby': `${idDe(nombre)}-error` },
    h('legend', {}, leyenda),
    ayuda && h('p', { class: 'ayuda' }, ayuda),
    h('div', { class: `opciones opciones-${estilo}` }, opciones.map((o) => h('label', { class: 'opcion' },
      h('input', { type: tipo, name: nombre, value: o.id, checked: seleccion.has(o.id), onChange: alCambiar }),
      h('span', { class: 'opcion-caja' },
        o.icono && icono(o.icono),
        h('span', { class: 'opcion-texto' }, h('strong', {}, o.nombre), o.descripcion && h('small', {}, o.descripcion)))))),
    h('p', { class: 'error-campo', id: `${idDe(nombre)}-error`, hidden: true }));
}

export function limpiarErrores(formulario) {
  formulario.querySelectorAll('.campo-invalido').forEach((c) => c.classList.remove('campo-invalido'));
  formulario.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
  formulario.querySelectorAll('.error-campo').forEach((e) => { e.hidden = true; e.textContent = ''; });
}

/** Pinta los errores y lleva el foco al primero, para que sea evidente qué corregir. */
export function mostrarErrores(formulario, errores) {
  limpiarErrores(formulario);
  let primero = null;
  for (const [nombre, mensaje] of Object.entries(errores)) {
    const contenedor = formulario.querySelector(`[data-campo="${nombre}"]`);
    if (!contenedor) continue;
    contenedor.classList.add('campo-invalido');
    const parrafo = contenedor.querySelector('.error-campo');
    parrafo.hidden = false;
    parrafo.replaceChildren(icono('triangle-alert'), document.createTextNode(mensaje));
    const control = contenedor.querySelector('input, select, textarea');
    control?.setAttribute('aria-invalid', 'true');
    primero ??= control;
  }
  primero?.focus();
}

/** Lee los valores por nombre. Las casillas múltiples devuelven un arreglo. */
export function leerFormulario(formulario) {
  const datos = {};
  for (const control of formulario.elements) {
    if (!control.name) continue;
    if (control.type === 'checkbox') {
      const grupo = formulario.querySelectorAll(`input[type="checkbox"][name="${control.name}"]`);
      if (grupo.length > 1 || control.closest('.grupo')) {
        (datos[control.name] ??= []);
        if (control.checked) datos[control.name].push(control.value);
      } else datos[control.name] = control.checked;
    } else if (control.type === 'radio') {
      if (control.checked) datos[control.name] = control.value;
    } else datos[control.name] = control.value;
  }
  return datos;
}

export function boton({ texto, tipo = 'button', variante = 'primario', ico, alHacer, ...resto }) {
  return h('button', { type: tipo, class: `btn btn-${variante}`, onClick: alHacer, ...resto }, ico && icono(ico), texto);
}

/** Enlace con apariencia de botón. */
export const botonEnlace = ({ texto, ruta, variante = 'primario', ico, ...resto }) => h('a', { href: `#${ruta}`, class: `btn btn-${variante}`, ...resto }, ico && icono(ico), texto);

/** Deshabilita el botón de envío mientras dura una operación, para evitar dobles envíos. */
export async function conEnvio(formulario, operacion) {
  const botonEnviar = formulario.querySelector('button[type="submit"]');
  const texto = botonEnviar?.textContent;
  if (botonEnviar) { botonEnviar.disabled = true; botonEnviar.textContent = 'Un momento…'; }
  try {
    return await operacion();
  } finally {
    if (botonEnviar && botonEnviar.isConnected) { botonEnviar.disabled = false; botonEnviar.textContent = texto; }
  }
}

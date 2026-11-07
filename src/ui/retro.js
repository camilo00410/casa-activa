/** Retroalimentación al usuario: avisos breves y confirmaciones. */
import { h, icono } from '../nucleo/dom.js';

const DURACION_MS = 5000;
const MAX_AVISOS = 3; // Más que esto tapa la pantalla en un teléfono.

export function toast(mensaje, { tipo = 'info', accion = null } = {}) {
  const zona = document.getElementById('avisos');
  const quitar = () => el.remove();
  const el = h('div', { class: `toast toast-${tipo}` },
    icono(tipo === 'error' ? 'triangle-alert' : tipo === 'exito' ? 'circle-check' : 'info'),
    h('span', {}, mensaje),
    accion && h('button', { type: 'button', class: 'toast-accion', onClick: () => { accion.alHacer(); quitar(); } }, accion.texto));
  while (zona.children.length >= MAX_AVISOS) zona.firstElementChild.remove();
  zona.append(el);
  setTimeout(quitar, accion ? DURACION_MS * 2 : DURACION_MS);
}

/** Diálogo modal nativo: atrapa el foco y se cierra con Escape sin código adicional. */
export function abrirDialogo({ titulo, contenido, etiqueta }) {
  const cerrar = () => { dialogo.close(); };
  const dialogo = h('dialog', { class: 'dialogo', 'aria-label': etiqueta ?? titulo, onClose: () => dialogo.remove() },
    h('div', { class: 'dialogo-cabecera' },
      h('h2', {}, titulo),
      h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Cerrar', onClick: cerrar }, icono('x'))),
    typeof contenido === 'function' ? contenido(cerrar) : contenido);
  document.body.append(dialogo);
  dialogo.showModal();
  return { dialogo, cerrar };
}

/** @returns {Promise<boolean>} */
export function confirmar({ titulo, texto, accion = 'Confirmar', peligro = false }) {
  return new Promise((resolver) => {
    let respuesta = false;
    const { dialogo } = abrirDialogo({
      titulo,
      contenido: (cerrar) => h('div', { class: 'pila' },
        h('p', {}, texto),
        h('div', { class: 'dialogo-acciones' },
          h('button', { type: 'button', class: 'btn btn-secundario', onClick: cerrar }, 'Cancelar'),
          h('button', { type: 'button', class: `btn ${peligro ? 'btn-peligro' : 'btn-primario'}`, onClick: () => { respuesta = true; cerrar(); } }, accion))),
    });
    dialogo.addEventListener('close', () => resolver(respuesta));
  });
}

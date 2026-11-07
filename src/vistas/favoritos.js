/** W8. Recomendaciones guardadas, con filtro rápido por categoría. */
import { h, icono, rellenar } from '../nucleo/dom.js';
import { CATEGORIAS } from '../dominio/catalogo.js';
import { encabezado, estadoVacio, pagina, rejilla, tarjeta } from '../ui/componentes.js';
import { botonEnlace } from '../ui/formularios.js';

export async function vistaFavoritos(app) {
  let filtro = '';
  const titulo = h('p', {});
  const zonaChips = h('div', { class: 'chips' });
  const zona = h('div', {});

  async function pintar() {
    const guardadas = await app.personal.recomendacionesFavoritas(app.usuario.id);
    const ids = new Set(guardadas.map((r) => r.id));
    const presentes = CATEGORIAS.filter((c) => guardadas.some((r) => r.categoria === c.id));
    if (filtro && !presentes.some((c) => c.id === filtro)) filtro = '';
    const visibles = filtro ? guardadas.filter((r) => r.categoria === filtro) : guardadas;
    titulo.textContent = guardadas.length === 1 ? '1 recomendación guardada' : `${guardadas.length} recomendaciones guardadas`;

    const chip = (id, texto) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(filtro === id), onClick: () => { filtro = id; pintar(); } }, texto);
    rellenar(zonaChips, ...(guardadas.length ? [chip('', 'Todas'), ...presentes.map((c) => chip(c.id, c.nombre))] : []));

    rellenar(zona, guardadas.length === 0
      ? estadoVacio({
        ico: 'heart', titulo: 'Aún no has guardado nada', texto: 'Toca el corazón en cualquier recomendación para encontrarla aquí.',
        accion: botonEnlace({ texto: 'Explorar recomendaciones', ruta: '/explorar', ico: 'search' }),
      })
      : rejilla(visibles.map((rec) => tarjeta(app, rec, { favoritas: ids }))));
  }

  zona.addEventListener('favorito', () => pintar());
  await pintar();
  return pagina(
    h('header', { class: 'encabezado-pagina' }, h('div', {}, h('h1', {}, 'Mis favoritos'), titulo)),
    zonaChips, h('h2', { class: 'oculto' }, 'Recomendaciones guardadas'), zona);
}

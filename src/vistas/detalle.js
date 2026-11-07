/** W7. Detalle de una recomendación, con su fuente y las acciones de guardar o crear hábito. */
import { h, icono } from '../nucleo/dom.js';
import { CATEGORIAS, OBJETIVOS, nombreDe } from '../dominio/catalogo.js';
import { esSegura, motivosDeExclusion, puntuar } from '../dominio/recomendador.js';
import { aviso, avisoSalud, botonFavorito, etiquetaCategoria, metaRecomendacion, pagina, rejilla, rutaImagen, tarjeta } from '../ui/componentes.js';
import { boton } from '../ui/formularios.js';
import { dialogoHabito } from './habitos.js';
import { vistaNoEncontrada } from './informativas.js';

export async function vistaDetalle(app) {
  const rec = await app.catalogo.obtener(app.ruta.parametros.id);
  const esAdmin = app.usuario?.rol === 'admin';
  if (!rec || (rec.estado !== 'publicado' && !esAdmin)) return vistaNoEncontrada(app);
  app.titulo(rec.titulo);

  const perfil = app.usuario ? await app.personal.perfil(app.usuario.id) : null;
  const favoritas = new Set(app.usuario ? await app.personal.favoritas(app.usuario.id) : []);
  const motivos = motivosDeExclusion(rec, perfil);
  const razones = perfil && motivos.length === 0 ? puntuar(rec, perfil).razones : [];
  const relacionadas = (await app.catalogo.publicadas())
    .filter((r) => r.categoria === rec.categoria && r.id !== rec.id && esSegura(r, perfil))
    .slice(0, 3);

  const crearHabito = () => {
    if (!app.usuario) {
      app.toast('Ingresa para seguir tus hábitos.');
      app.ir('/ingreso', { volver: location.hash.slice(1) });
      return;
    }
    dialogoHabito(app, { nombre: rec.titulo.slice(0, 60), categoria: rec.categoria, origen: rec.id }, () => app.ir('/habitos'));
  };

  return pagina(
    h('nav', { 'aria-label': 'Ruta de navegación', class: 'migas' },
      h('ol', {},
        h('li', {}, h('a', { href: '#/explorar' }, 'Explorar')),
        h('li', {}, h('a', { href: `#/explorar?cat=${rec.categoria}` }, nombreDe(CATEGORIAS, rec.categoria))),
        h('li', { 'aria-current': 'page' }, rec.titulo))),
    rec.estado !== 'publicado' && aviso({ tipo: 'advertencia', texto: 'Esta recomendación es un borrador: solo la ve el equipo de administración.' }),
    motivos.length > 0 && aviso({
      tipo: 'advertencia', titulo: 'Esta recomendación no es adecuada para ti',
      texto: `Tu perfil indica: ${motivos.join(', ')}. Por seguridad no la incluimos en tu plan. Consulta a un profesional de la salud antes de intentarlo.`,
    }),
    h('article', { class: 'detalle' },
      h('div', { class: 'detalle-cabecera' },
        h('img', { class: 'detalle-imagen', src: rutaImagen(rec.imagen), alt: '', width: 560, height: 420, fetchpriority: 'high' }),
        h('div', { class: 'detalle-info' },
          etiquetaCategoria(rec.categoria),
          h('h1', {}, rec.titulo),
          h('p', { class: 'detalle-resumen' }, rec.resumen),
          metaRecomendacion(rec),
          h('p', { class: 'detalle-objetivos' }, h('strong', {}, 'Sirve para: '), rec.objetivos.map((o) => nombreDe(OBJETIVOS, o)).join(', ')),
          h('div', { class: 'acciones' },
            botonFavorito(app, rec, favoritas.has(rec.id), { conTexto: true }),
            boton({ texto: 'Crear hábito', variante: 'secundario', ico: 'plus', alHacer: crearHabito })))),
      h('div', { class: 'detalle-cuerpo' },
        h('section', { 'aria-labelledby': 'titulo-pasos-detalle' },
          h('h2', { id: 'titulo-pasos-detalle' }, 'Cómo hacerlo'),
          h('ol', { class: 'pasos' }, rec.pasos.map((p) => h('li', {}, p))),
          rec.video && h('a', { href: rec.video, target: '_blank', rel: 'noopener noreferrer', class: 'btn btn-secundario video' }, icono('play'), 'Ver video en YouTube', icono('external-link'))),
        h('aside', { class: 'detalle-lateral' },
          razones.length > 0 && h('section', { class: 'bloque bloque-lima' },
            h('h2', {}, 'Por qué te lo sugerimos'),
            h('ul', { class: 'lista-marcas' }, razones.map((r) => h('li', {}, icono('check'), r)))),
          h('section', { class: 'bloque' },
            h('h2', {}, 'Beneficios'),
            h('ul', { class: 'lista-marcas' }, rec.beneficios.map((b) => h('li', {}, icono('check'), b)))),
          h('section', { class: 'bloque' },
            h('h2', {}, 'Fuente'),
            h('p', {}, h('a', { href: rec.fuente.url, target: '_blank', rel: 'noopener noreferrer' }, rec.fuente.nombre, ' ', icono('external-link', { titulo: '(abre en otra pestaña)' })))),
          avisoSalud()))),
    relacionadas.length > 0 && h('section', { class: 'relacionadas', 'aria-labelledby': 'titulo-relacionadas' },
      h('h2', { id: 'titulo-relacionadas' }, 'También te puede servir'),
      rejilla(relacionadas.map((r) => tarjeta(app, r, { favoritas })))));
}

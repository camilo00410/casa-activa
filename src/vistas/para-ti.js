/** W5. Panel personalizado: responde a «¿qué hago hoy?». */
import { h, rellenar } from '../nucleo/dom.js';
import { CATEGORIAS, OBJETIVOS, nombreDe } from '../dominio/catalogo.js';
import { detectarNecesidades } from '../dominio/recomendador.js';
import { aviso, encabezado, etiquetaCategoria, indicador, pagina, rejilla, rutaImagen, tarjeta } from '../ui/componentes.js';
import { botonEnlace } from '../ui/formularios.js';

function textoFoco(perfil) {
  if (!perfil) return 'Estas son ideas generales para empezar.';
  const foco = `Tu foco es ${nombreDe(OBJETIVOS, perfil.objetivo).toLowerCase()}`;
  const necesidades = detectarNecesidades(perfil).map((n) => CATEGORIAS.find((c) => c.id === n.categoria).nombre.toLowerCase());
  return necesidades.length ? `${foco}. También priorizamos: ${necesidades.join(', ')}.` : `${foco}.`;
}

const tarjetaPlan = ({ rec }) => h('article', { class: 'plan-item' },
  h('img', { src: rutaImagen(rec.imagen), alt: '', width: 560, height: 420, loading: 'eager', decoding: 'async' }),
  h('div', {},
    etiquetaCategoria(rec.categoria),
    h('h3', {}, h('a', { href: `#/recomendacion/${rec.id}`, class: 'enlace-tarjeta' }, rec.titulo)),
    h('p', { class: 'meta-simple' }, `${rec.minutos} min`)));

export async function vistaParaTi(app) {
  const { id, nombre } = app.usuario;
  const zona = h('div', { class: 'pila-grande' });
  const resumen = await app.personal.resumenHabitos(id);

  async function pintar() {
    const { perfil, plan, lista } = await app.personal.recomendaciones(id);
    const favoritas = new Set(await app.personal.favoritas(id));

    const descartar = async (rec) => {
      await app.personal.descartar(id, rec.id);
      await pintar();
      zona.querySelector('#titulo-lista')?.focus(); // La tarjeta ya no existe: el foco no debe perderse.
      app.toast('No volveremos a sugerirla.', {
        accion: { texto: 'Deshacer', alHacer: async () => { await app.personal.restaurar(id, rec.id); await pintar(); } },
      });
    };

    rellenar(zona, 
      !perfil && aviso({
        titulo: 'Completa tu perfil para personalizar tu plan',
        texto: 'Con tu objetivo y tu rutina podremos priorizar lo que más te sirve y ocultar lo que no te conviene.',
        accion: botonEnlace({ texto: 'Completar mi perfil', ruta: '/perfil-salud', ico: 'arrow-right' }),
      }),
      h('section', { 'aria-labelledby': 'titulo-plan' },
        h('h2', { id: 'titulo-plan' }, 'Tu plan de hoy'),
        h('div', { class: 'plan' }, plan.map(tarjetaPlan))),
      h('section', { 'aria-labelledby': 'titulo-lista' },
        h('h2', { id: 'titulo-lista', tabindex: -1 }, perfil ? 'Recomendado para ti' : 'Para empezar'),
        rejilla(lista.map(({ rec, razones }) => tarjeta(app, rec, { favoritas, razones, alDescartar: perfil ? descartar : null })))));
  }

  await pintar();
  const perfilActual = await app.personal.perfil(id);

  return pagina(
    encabezado({ titulo: `Hola, ${nombre.split(' ')[0]}`, texto: textoFoco(perfilActual) }),
    h('section', { class: 'indicadores', 'aria-label': 'Resumen de tus hábitos' },
      indicador({ ico: 'list-checks', valor: `${resumen.hoy.hechos} de ${resumen.hoy.total}`, etiqueta: 'Hábitos de hoy', progreso: resumen.hoy.total ? (resumen.hoy.hechos / resumen.hoy.total) * 100 : 0 }),
      indicador({ ico: 'flame', valor: `${resumen.rachaMayor} ${resumen.rachaMayor === 1 ? 'día' : 'días'}`, etiqueta: 'Tu mejor racha activa' }),
      indicador({ ico: 'target', valor: `${resumen.cumplimientoSemana} %`, etiqueta: 'Cumplimiento semanal', progreso: resumen.cumplimientoSemana })),
    zona);
}

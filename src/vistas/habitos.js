/** W9. Seguimiento de hábitos. El registro de hoy está a un solo toque. */
import { h, icono, rellenar } from '../nucleo/dom.js';
import { CATEGORIAS } from '../dominio/catalogo.js';
import { fechaLocal } from '../dominio/habitos.js';
import { encabezado, estadoVacio, etiquetaCategoria, indicador, pagina, conservarFoco } from '../ui/componentes.js';
import { boton, campo, conEnvio, leerFormulario, mostrarErrores, selector } from '../ui/formularios.js';
import { graficoSemanal, etiquetaSemana } from '../ui/grafico.js';
import { abrirDialogo } from '../ui/retro.js';

const METAS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: n, nombre: n === 1 ? '1 día por semana' : `${n} días por semana` }));

/** Diálogo compartido para crear un hábito desde esta pantalla o desde una recomendación. */
export function dialogoHabito(app, inicial = {}, alCrear = () => {}) {
  abrirDialogo({
    titulo: 'Nuevo hábito',
    contenido: (cerrar) => h('form', {
      class: 'pila', noValidate: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const r = await conEnvio(form, () => app.personal.crearHabito(app.usuario.id, { ...leerFormulario(form), origen: inicial.origen ?? null }));
        if (!r.ok) { mostrarErrores(form, r.errores); return; }
        cerrar();
        app.toast('Hábito creado.', { tipo: 'exito' });
        alCrear(r.habito);
      },
    },
    campo({ nombre: 'nombre', etiqueta: '¿Qué hábito quieres construir?', valor: inicial.nombre ?? '', placeholder: 'Por ejemplo: leer antes de dormir' }),
    selector({ nombre: 'categoria', etiqueta: 'Categoría', opciones: CATEGORIAS, valor: inicial.categoria ?? '', vacio: 'Elige una categoría' }),
    selector({ nombre: 'metaSemanal', etiqueta: 'Meta semanal', opciones: METAS, valor: inicial.metaSemanal ?? 5 }),
    h('div', { class: 'dialogo-acciones' }, boton({ texto: 'Crear hábito', tipo: 'submit' }))),
  });
}

function filaHabito(app, f, refrescar) {
  const marcar = async (fecha) => {
    await app.personal.alternarDia(app.usuario.id, f.id, fecha);
    await refrescar();
  };
  const eliminar = async () => {
    const seguro = await app.confirmar({ titulo: 'Eliminar hábito', texto: `Se borrará «${f.nombre}» y todo su historial.`, accion: 'Eliminar', peligro: true });
    if (!seguro) return;
    await app.personal.eliminarHabito(app.usuario.id, f.id);
    app.toast('Hábito eliminado.');
    await refrescar();
  };
  return h('li', { class: 'habito' },
    h('button', {
      type: 'button', class: 'habito-check', 'aria-pressed': String(f.hechoHoy), 'data-foco': `hoy-${f.id}`,
      'aria-label': `${f.hechoHoy ? 'Desmarcar' : 'Marcar'} «${f.nombre}» como hecho hoy`, onClick: () => marcar(fechaLocal()), // Se calcula al pulsar: la pantalla pudo quedar abierta desde ayer.
    }, icono('check')),
    h('div', { class: 'habito-info' },
      h('h3', {}, f.nombre),
      h('p', { class: 'habito-datos' }, etiquetaCategoria(f.categoria),
        h('span', {}, icono('flame'), f.racha === 1 ? '1 día' : `${f.racha} días`),
        h('span', { class: f.semana.cumplida ? 'meta-cumplida' : '' }, icono('target'), `${f.semana.hechos} de ${f.metaSemanal} esta semana`))),
    h('ul', { class: 'habito-dias', 'aria-label': `Últimos 7 días de ${f.nombre}` }, f.dias.map((d) => h('li', {},
      h('button', {
        type: 'button', class: `dia ${d.esHoy ? 'dia-hoy' : ''}`, 'aria-pressed': String(d.hecho), 'data-foco': `${f.id}-${d.fecha}`,
        'aria-label': `${d.dia} ${d.fecha.slice(8)}: ${d.hecho ? 'hecho' : 'sin hacer'}`, onClick: () => marcar(d.fecha),
      }, h('span', { 'aria-hidden': 'true' }, d.dia[0].toUpperCase()))))),
    h('button', { type: 'button', class: 'btn-icono habito-borrar', 'aria-label': `Eliminar hábito: ${f.nombre}`, onClick: eliminar }, icono('trash-2')));
}

export async function vistaHabitos(app) {
  const zona = h('div', {});

  async function refrescar() {
    const r = await app.personal.resumenHabitos(app.usuario.id);
    conservarFoco(() => {
      rellenar(zona, r.filas.length === 0
        ? estadoVacio({
          ico: 'list-checks', titulo: 'Aún no tienes hábitos', texto: 'Crea tu primer hábito o conviértelo desde cualquier recomendación.',
          accion: boton({ texto: 'Crear mi primer hábito', ico: 'plus', alHacer: () => dialogoHabito(app, {}, refrescar) }),
        })
        : h('div', { class: 'pila-grande' },
          h('section', { class: 'indicadores', 'aria-label': 'Resumen' },
            indicador({ ico: 'list-checks', valor: `${r.hoy.hechos} de ${r.hoy.total}`, etiqueta: 'Hechos hoy', progreso: (r.hoy.hechos / r.hoy.total) * 100 }),
            indicador({ ico: 'flame', valor: `${r.rachaMayor} ${r.rachaMayor === 1 ? 'día' : 'días'}`, etiqueta: 'Mejor racha activa' }),
            indicador({ ico: 'target', valor: `${r.cumplimientoSemana} %`, etiqueta: `Semana del ${etiquetaSemana(r.historial.at(-1).semana)}`, progreso: r.cumplimientoSemana })),
          h('div', { class: 'habitos-rejilla' },
            h('section', { 'aria-labelledby': 'titulo-hoy' },
              h('h2', { id: 'titulo-hoy' }, 'Tus hábitos'),
              h('ul', { class: 'habitos-lista' }, r.filas.map((f) => filaHabito(app, f, refrescar)))),
            h('section', { class: 'bloque', 'aria-labelledby': 'titulo-grafico' },
              h('h2', { id: 'titulo-grafico' }, 'Cumplimiento por semana'),
              h('p', { class: 'ayuda' }, 'Porcentaje de tus metas semanales cumplidas.'),
              graficoSemanal(r.historial)))));
    });
  }

  await refrescar();
  return pagina(
    encabezado({ titulo: 'Mis hábitos', texto: 'Marca lo que hiciste hoy. Lo importante es la constancia.', acciones: boton({ texto: 'Nuevo hábito', ico: 'plus', alHacer: () => dialogoHabito(app, {}, refrescar) }) }),
    zona);
}

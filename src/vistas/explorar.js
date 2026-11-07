/** W6. Búsqueda y filtrado. El estado vive en la URL: cualquier resultado se puede compartir. */
import { h, icono, rellenar } from '../nucleo/dom.js';
import { construirHash } from '../nucleo/enrutador.js';
import { CATEGORIAS, DURACIONES, NIVELES, OBJETIVOS, nombreDe } from '../dominio/catalogo.js';
import { TAMANO_PAGINA, buscar } from '../dominio/busqueda.js';
import { conservarFoco, encabezado, estadoVacio, pagina, rejilla, tarjeta } from '../ui/componentes.js';
import { boton } from '../ui/formularios.js';

const ORDENES = [['', 'Relevancia'], ['titulo', 'Título (A-Z)'], ['duracion', 'Menor duración'], ['recientes', 'Más recientes']];
const ESPERA_ESCRITURA_MS = 180;

const lista = (x) => (x ? x.split(',').filter(Boolean) : []);

function criteriosDesde(consulta) {
  return {
    texto: consulta.q ?? '', categorias: lista(consulta.cat), niveles: lista(consulta.niv),
    duracionMax: Number(consulta.dur) || 0, objetivo: consulta.obj ?? '', orden: consulta.orden ?? '',
  };
}

const aConsulta = (c) => ({
  q: c.texto, cat: c.categorias.join(','), niv: c.niveles.join(','), dur: c.duracionMax || '', obj: c.objetivo, orden: c.orden,
});

export async function vistaExplorar(app) {
  const indice = await app.catalogo.indiceBusqueda();
  const favoritas = new Set(app.usuario ? await app.personal.favoritas(app.usuario.id) : []);
  const criterios = criteriosDesde(app.ruta.consulta);
  let visibles = TAMANO_PAGINA;
  let temporizador;

  const zonaEstado = h('div', { class: 'chips' });
  // El contenedor del anuncio es permanente: uno recreado no siempre lo leen los lectores de pantalla.
  const totalResultados = h('p', { class: 'resultados-total', role: 'status' });
  const zonaResultados = h('div', {});
  zonaResultados.addEventListener('favorito', ({ detail }) => {
    if (detail.activo) favoritas.add(detail.id);
    else favoritas.delete(detail.id);
  });
  const zonaFiltros = h('div', { class: 'filtros-cuerpo' });
  const resumenFiltros = h('span', {});

  const alternar = (arreglo, valor) => { const i = arreglo.indexOf(valor); if (i >= 0) arreglo.splice(i, 1); else arreglo.push(valor); };

  function actualizar({ conservarPagina = false } = {}) {
    if (!conservarPagina) visibles = TAMANO_PAGINA;
    history.replaceState(null, '', construirHash('/explorar', aConsulta(criterios)));
    conservarFoco(pintar);
  }

  const limpiarTodo = () => {
    Object.assign(criterios, { texto: '', categorias: [], niveles: [], duracionMax: 0, objetivo: '', orden: '' });
    entrada.value = '';
    selectOrden.value = '';
    actualizar();
  };

  function pintarFiltros(facetas) {
    const fieldset = (leyenda, ...hijos) => h('fieldset', { class: 'filtro' }, h('legend', {}, leyenda), hijos);
    const marcado = (tipo, valor, activo, texto, alCambiar) => h('label', { class: 'filtro-opcion' },
      h('input', { type: tipo, value: valor, checked: activo, onChange: alCambiar, 'data-foco': `filtro-${valor}` }), h('span', {}, texto));
    rellenar(zonaFiltros, 
      fieldset('Categoría', CATEGORIAS.map((c) => marcado('checkbox', c.id, criterios.categorias.includes(c.id), `${c.nombre} (${facetas[c.id] ?? 0})`, () => { alternar(criterios.categorias, c.id); actualizar(); }))),
      fieldset('Duración', h('div', { class: 'chips' }, DURACIONES.map((d) => h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(criterios.duracionMax === d), 'data-foco': `duracion-${d}`,
        onClick: () => { criterios.duracionMax = criterios.duracionMax === d ? 0 : d; actualizar(); },
      }, `Hasta ${d} min`)))),
      fieldset('Nivel', NIVELES.map((n) => marcado('checkbox', n.id, criterios.niveles.includes(n.id), n.nombre, () => { alternar(criterios.niveles, n.id); actualizar(); }))),
      h('div', { class: 'filtro' },
        h('label', { for: 'filtro-objetivo', class: 'filtro-titulo' }, 'Objetivo'),
        h('select', { id: 'filtro-objetivo', 'data-foco': 'filtro-objetivo', onChange: (e) => { criterios.objetivo = e.target.value; actualizar(); } },
          h('option', { value: '' }, 'Todos'),
          OBJETIVOS.map((o) => h('option', { value: o.id, selected: criterios.objetivo === o.id }, o.nombre)))));
  }

  function etiquetasActivas() {
    const quitar = (texto, accion) => h('button', { type: 'button', class: 'chip chip-activo', 'aria-label': `Quitar filtro: ${texto}`, onClick: () => { accion(); actualizar(); } }, texto, icono('x'));
    return [
      ...criterios.categorias.map((c) => quitar(nombreDe(CATEGORIAS, c), () => alternar(criterios.categorias, c))),
      ...criterios.niveles.map((n) => quitar(nombreDe(NIVELES, n), () => alternar(criterios.niveles, n))),
      criterios.duracionMax ? quitar(`Hasta ${criterios.duracionMax} min`, () => { criterios.duracionMax = 0; }) : null,
      criterios.objetivo ? quitar(nombreDe(OBJETIVOS, criterios.objetivo), () => { criterios.objetivo = ''; }) : null,
    ].filter(Boolean);
  }

  function pintar() {
    const { resultados, total, facetas } = buscar(indice, criterios);
    const activas = etiquetasActivas();
    pintarFiltros(facetas);
    resumenFiltros.textContent = activas.length ? `Filtros (${activas.length})` : 'Filtros';
    rellenar(totalResultados, h('strong', {}, total), total === 1 ? ' resultado' : ' resultados');
    rellenar(zonaEstado, activas,
      (activas.length > 0 || criterios.texto) && h('button', { type: 'button', class: 'btn-texto', onClick: limpiarTodo }, 'Limpiar todo'));

    if (total === 0) {
      rellenar(zonaResultados, estadoVacio({
        titulo: 'No encontramos resultados',
        texto: 'Prueba con otra palabra, como «sueño» o «frutas», o quita algunos filtros.',
        accion: boton({ texto: 'Ver todas las recomendaciones', alHacer: limpiarTodo }),
      }));
      return;
    }
    rellenar(zonaResultados, 
      rejilla(resultados.slice(0, visibles).map((rec) => tarjeta(app, rec, { favoritas }))),
      visibles < total && h('div', { class: 'ver-mas' }, boton({
        texto: `Ver más (${total - visibles} restantes)`, variante: 'secundario',
        alHacer: () => { visibles += TAMANO_PAGINA; actualizar({ conservarPagina: true }); },
      })));
  }

  const entrada = h('input', {
    id: 'busqueda', type: 'search', value: criterios.texto, placeholder: 'Tema, alimento o hábito', autocomplete: 'off',
    onInput: (e) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        if (!entrada.isConnected) return; // La persona ya navegó a otra pantalla.
        criterios.texto = e.target.value;
        actualizar();
      }, ESPERA_ESCRITURA_MS);
    },
  });

  const selectOrden = h('select', { id: 'orden', onChange: (e) => { criterios.orden = e.target.value; actualizar(); } },
    ORDENES.map(([id, nombre]) => h('option', { value: id, selected: criterios.orden === id }, nombre)));

  const filtros = h('details', { class: 'filtros' }, h('summary', {}, icono('sliders-horizontal'), resumenFiltros), zonaFiltros);
  const escritorio = window.matchMedia('(min-width: 1024px)');
  filtros.open = escritorio.matches;

  pintar();

  return pagina(
    encabezado({ titulo: 'Explorar recomendaciones', texto: 'Busca por tema o combina filtros para encontrar lo que necesitas.' }),
    h('div', { class: 'explorar-barra' },
      h('form', { role: 'search', class: 'explorar-busqueda', onSubmit: (e) => { e.preventDefault(); clearTimeout(temporizador); criterios.texto = entrada.value; actualizar(); } },
        h('label', { class: 'oculto', for: 'busqueda' }, 'Buscar recomendaciones'),
        h('div', { class: 'buscador' }, icono('search'), entrada)),
      h('div', { class: 'explorar-orden' }, h('label', { for: 'orden' }, 'Ordenar por'), selectOrden)),
    h('div', { class: 'explorar' }, filtros, h('div', { class: 'explorar-resultados' }, h('h2', { class: 'oculto' }, 'Resultados'), h('div', { class: 'resultados-estado' }, totalResultados, zonaEstado), zonaResultados)));
}

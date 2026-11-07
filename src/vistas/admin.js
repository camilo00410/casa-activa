/** W11 y W12. Administración de contenidos, exclusiva del rol administrador. */
import { h, icono, rellenar } from '../nucleo/dom.js';
import { CATEGORIAS, MARCADORES_EXCLUSION, NIVELES, OBJETIVOS, nombreDe } from '../dominio/catalogo.js';
import { normalizar } from '../dominio/busqueda.js';
import { fechaLegible } from '../dominio/habitos.js';
import { conservarFoco, encabezado, indicador, pagina } from '../ui/componentes.js';
import { areaTexto, boton, botonEnlace, campo, grupoOpciones, leerFormulario, mostrarErrores, selector } from '../ui/formularios.js';
import { vistaNoEncontrada } from './informativas.js';

const lineas = (texto = '') => texto.split('\n');

export async function vistaAdmin(app) {
  let texto = '';
  const tablaZona = h('div', { class: 'tabla-contenedor', tabindex: 0, role: 'region', 'aria-label': 'Tabla de contenidos' });
  const indicadoresZona = h('section', { class: 'indicadores indicadores-4', 'aria-label': 'Resumen de contenidos' });

  async function pintar() {
    const todas = await app.catalogo.todas();
    const publicadas = todas.filter((c) => c.estado === 'publicado').length;
    rellenar(indicadoresZona, 
      indicador({ ico: 'file-text', valor: todas.length, etiqueta: 'Total' }),
      indicador({ ico: 'circle-check', valor: publicadas, etiqueta: 'Publicadas' }),
      indicador({ ico: 'pencil', valor: todas.length - publicadas, etiqueta: 'Borradores' }),
      indicador({ ico: 'sparkles', valor: CATEGORIAS.length, etiqueta: 'Categorías' }));

    const consulta = normalizar(texto);
    const visibles = todas.filter((c) => normalizar(c.titulo).includes(consulta)).sort((a, b) => (a.estado === b.estado ? a.titulo.localeCompare(b.titulo, 'es') : a.estado === 'borrador' ? -1 : 1)); // Los borradores van primero: requieren atención.
    const cambiarEstado = async (c) => {
      const estado = c.estado === 'publicado' ? 'borrador' : 'publicado';
      await app.catalogo.cambiarEstado(c.id, estado);
      app.toast(estado === 'publicado' ? 'Recomendación publicada.' : 'Recomendación retirada.', { tipo: 'exito' });
      await pintar();
    };
    const eliminar = async (c) => {
      const seguro = await app.confirmar({ titulo: 'Eliminar recomendación', texto: `«${c.titulo}» se borrará del catálogo.`, accion: 'Eliminar', peligro: true });
      if (!seguro) return;
      await app.catalogo.eliminar(c.id);
      app.toast('Recomendación eliminada.');
      await pintar();
      tablaZona.focus();
    };

    conservarFoco(() => rellenar(tablaZona, h('table', { class: 'tabla' },
      h('caption', { class: 'oculto' }, 'Recomendaciones del catálogo'),
      h('thead', {}, h('tr', {}, ['Título', 'Categoría', 'Estado', 'Actualizado', 'Acciones'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, visibles.map((c) => h('tr', {},
        h('th', { scope: 'row' }, h('a', { href: `#/recomendacion/${c.id}` }, c.titulo)),
        h('td', {}, nombreDe(CATEGORIAS, c.categoria)),
        h('td', {}, h('span', { class: `estado estado-${c.estado}` }, c.estado === 'publicado' ? 'Publicada' : 'Borrador')),
        h('td', {}, fechaLegible(c.actualizado)),
        h('td', {}, h('div', { class: 'tabla-acciones' },
          h('a', { href: `#/admin/editar/${c.id}`, class: 'btn-icono', 'aria-label': `Editar: ${c.titulo}` }, icono('pencil')),
          h('button', { type: 'button', class: 'btn-texto', 'data-foco': `estado-${c.id}`, 'aria-label': `${c.estado === 'publicado' ? 'Retirar' : 'Publicar'}: ${c.titulo}`, onClick: () => cambiarEstado(c) }, c.estado === 'publicado' ? 'Retirar' : 'Publicar'),
          h('button', { type: 'button', class: 'btn-icono btn-icono-peligro', 'aria-label': `Eliminar: ${c.titulo}`, onClick: () => eliminar(c) }, icono('trash-2'))))))))));
  }

  await pintar();
  return pagina(
    encabezado({ titulo: 'Administración de contenidos', texto: 'Crea, edita y publica recomendaciones sin tocar el código.', acciones: botonEnlace({ texto: 'Nueva recomendación', ruta: '/admin/nueva', ico: 'plus' }) }),
    indicadoresZona,
    h('div', { class: 'buscador buscador-admin' }, icono('search'),
      h('label', { class: 'oculto', for: 'buscar-admin' }, 'Buscar contenido'),
      h('input', { id: 'buscar-admin', type: 'search', placeholder: 'Buscar contenido', onInput: (e) => { texto = e.target.value; pintar(); } })),
    tablaZona);
}

export async function vistaAdminFormulario(app) {
  const { id } = app.ruta.parametros;
  const existente = id ? await app.catalogo.obtener(id) : null;
  if (id && !existente) return vistaNoEncontrada(app);
  const c = existente ?? { titulo: '', resumen: '', categoria: '', nivel: 'principiante', minutos: 10, objetivos: [], excluye: [], beneficios: [], pasos: [], etiquetas: [], fuente: { nombre: '', url: '' } };

  const guardar = async (form, estado) => {
    const v = leerFormulario(form);
    const datos = {
      ...(existente ?? {}), titulo: v.titulo, resumen: v.resumen, categoria: v.categoria, nivel: v.nivel, minutos: v.minutos,
      objetivos: v.objetivos ?? [], excluye: v.excluye ?? [], beneficios: lineas(v.beneficios), pasos: lineas(v.pasos),
      etiquetas: v.etiquetas.split(','), fuente: { nombre: v.fuenteNombre.trim(), url: v.fuenteUrl.trim() }, estado,
    };
    const r = await app.catalogo.guardar(datos, id ?? null);
    if (!r.ok) { mostrarErrores(form, r.errores); return; }
    app.toast(estado === 'publicado' ? 'Recomendación publicada.' : 'Borrador guardado.', { tipo: 'exito' });
    app.ir('/admin');
  };

  // Enter nunca debe publicar por accidente: conserva el estado actual, y lo nuevo queda como borrador.
  const estadoActual = existente?.estado ?? 'borrador';
  const form = h('form', { class: 'admin-formulario', noValidate: true, onSubmit: (e) => { e.preventDefault(); guardar(e.target, estadoActual); } },
    h('div', { class: 'pila' },
      campo({ nombre: 'titulo', etiqueta: 'Título', valor: c.titulo }),
      areaTexto({ nombre: 'resumen', etiqueta: 'Resumen', valor: c.resumen, filas: 3 }),
      areaTexto({ nombre: 'beneficios', etiqueta: 'Beneficios', ayuda: 'Uno por línea.', valor: c.beneficios.join('\n'), filas: 3 }),
      areaTexto({ nombre: 'pasos', etiqueta: 'Pasos', ayuda: 'Uno por línea.', valor: c.pasos.join('\n'), filas: 5 }),
      campo({ nombre: 'etiquetas', etiqueta: 'Palabras clave', ayuda: 'Separadas por comas. Ayudan en la búsqueda.', valor: c.etiquetas.join(', ') })),
    h('div', { class: 'pila' },
      h('section', { class: 'bloque pila' },
        h('h2', {}, 'Clasificación'),
        selector({ nombre: 'categoria', etiqueta: 'Categoría', opciones: CATEGORIAS, valor: c.categoria, vacio: 'Elige una categoría' }),
        h('div', { class: 'dos-columnas' },
          campo({ nombre: 'minutos', etiqueta: 'Minutos', tipo: 'number', valor: c.minutos, min: 1, max: 180 }),
          selector({ nombre: 'nivel', etiqueta: 'Nivel', opciones: NIVELES, valor: c.nivel })),
        grupoOpciones({ nombre: 'objetivos', leyenda: 'Objetivos que apoya', opciones: OBJETIVOS.map(({ id: i, nombre }) => ({ id: i, nombre })), valor: c.objetivos, tipo: 'checkbox' })),
      h('section', { class: 'bloque pila' },
        h('h2', {}, 'Reglas de seguridad'),
        grupoOpciones({ nombre: 'excluye', leyenda: 'No mostrar a personas con', ayuda: 'El motor nunca sugerirá esta recomendación a estos perfiles.', opciones: MARCADORES_EXCLUSION, valor: c.excluye, tipo: 'checkbox' })),
      h('section', { class: 'bloque pila' },
        h('h2', {}, 'Fuente'),
        campo({ nombre: 'fuenteNombre', etiqueta: 'Nombre de la fuente', valor: c.fuente.nombre }),
        campo({ nombre: 'fuenteUrl', etiqueta: 'Enlace de la fuente', tipo: 'url', valor: c.fuente.url, placeholder: 'https://' }))),
    h('div', { class: 'asistente-acciones admin-acciones' },
      botonEnlace({ texto: 'Cancelar', ruta: '/admin', variante: 'texto' }),
      h('span', { class: 'separador-flex' }),
      estadoActual === 'publicado'
        ? boton({ texto: 'Guardar cambios', tipo: 'submit' })
        : [boton({ texto: 'Guardar borrador', tipo: 'submit', variante: 'secundario' }), boton({ texto: 'Publicar', alHacer: (e) => guardar(e.target.form, 'publicado') })]));

  return pagina(encabezado({ titulo: existente ? 'Editar recomendación' : 'Nueva recomendación' }), form);
}

/**
 * Gráfico de cumplimiento semanal: columnas de una sola serie sobre un eje fijo de 0 a 100 %.
 * Incluye información al pasar el puntero o enfocar, y una tabla equivalente para quien no pueda ver el gráfico.
 */
import { h, s } from '../nucleo/dom.js';

const ALTO = 170;
const MARGEN = { arriba: 24, abajo: 24, izquierda: 36, derecha: 8 };
const GROSOR = 22;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const etiquetaSemana = (fecha) => {
  const [, m, d] = fecha.split('-').map(Number);
  return `${d} ${MESES[m - 1]}`;
};

/** Columna con solo los extremos superiores redondeados: la base queda recta sobre el eje. */
function trazoColumna(x, y, ancho, alto, radio = 4) {
  const r = Math.min(radio, alto);
  return `M${x} ${y + alto}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + ancho - r}Q${x + ancho} ${y} ${x + ancho} ${y + r}V${y + alto}Z`;
}

export function graficoSemanal(historial, { ancho = 400 } = {}) {
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha;
  const paso = anchoUtil / historial.length;
  const yDe = (p) => MARGEN.arriba + altoUtil * (1 - p / 100);
  const globo = h('div', { class: 'grafico-globo', hidden: true });
  const contenedor = h('div', { class: 'grafico' });

  const mostrar = (d, marca) => {
    const caja = contenedor.getBoundingClientRect();
    const barra = marca.getBoundingClientRect();
    globo.replaceChildren(h('strong', {}, `${d.porcentaje} %`), h('span', {}, `Semana del ${etiquetaSemana(d.semana)} · ${d.hechos} de ${d.meta}`));
    globo.hidden = false;
    const centro = barra.left - caja.left + barra.width / 2;
    globo.style.left = `${Math.min(Math.max(centro, 84), caja.width - 84)}px`;
    globo.style.top = `${Math.max(0, barra.top - caja.top - 8)}px`;
  };
  const ocultar = () => { globo.hidden = true; };

  const lineas = [0, 50, 100].flatMap((p) => [
    s('line', { class: 'grafico-rejilla', x1: MARGEN.izquierda, x2: ancho - MARGEN.derecha, y1: yDe(p), y2: yDe(p) }),
    s('text', { class: 'grafico-eje', x: MARGEN.izquierda - 6, y: yDe(p) + 4, 'text-anchor': 'end' }, `${p}`),
  ]);

  const columnas = historial.flatMap((d, i) => {
    const centro = MARGEN.izquierda + paso * i + paso / 2;
    const alto = Math.max(d.porcentaje ? 2 : 0, altoUtil * (d.porcentaje / 100));
    const y = yDe(0) - alto;
    const ultima = i === historial.length - 1;
    const marca = s('path', { class: 'grafico-barra', d: trazoColumna(centro - GROSOR / 2, y, GROSOR, alto) });
    const zona = s('rect', {
      class: 'grafico-zona', x: centro - paso / 2, y: MARGEN.arriba, width: paso, height: altoUtil + MARGEN.abajo,
      tabindex: 0, role: 'img', 'aria-label': `Semana del ${etiquetaSemana(d.semana)}: ${d.porcentaje} %`,
      onPointerenter: () => mostrar(d, marca), onPointerleave: ocultar, onFocus: () => mostrar(d, marca), onBlur: ocultar,
    });
    return [
      marca,
      s('text', { class: 'grafico-eje', x: centro, y: ALTO - 6, 'text-anchor': 'middle' }, etiquetaSemana(d.semana)),
      ultima && s('text', { class: 'grafico-valor', x: centro, y: y - 6, 'text-anchor': 'middle' }, `${d.porcentaje} %`),
      zona,
    ];
  });

  contenedor.append(
    s('svg', { viewBox: `0 0 ${ancho} ${ALTO}`, width: '100%', role: 'group', 'aria-label': 'Porcentaje de cumplimiento en las últimas semanas' }, lineas, columnas),
    globo,
    h('details', { class: 'grafico-tabla' },
      h('summary', {}, 'Ver como tabla'),
      h('table', {},
        h('caption', { class: 'oculto' }, 'Cumplimiento por semana'),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Semana del'), h('th', { scope: 'col' }, 'Cumplimiento'), h('th', { scope: 'col' }, 'Días hechos'))),
        h('tbody', {}, historial.map((d) => h('tr', {}, h('th', { scope: 'row' }, etiquetaSemana(d.semana)), h('td', {}, `${d.porcentaje} %`), h('td', {}, `${d.hechos} de ${d.meta}`)))))));
  return contenedor;
}

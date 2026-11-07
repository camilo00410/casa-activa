/**
 * RNF1 y RNF2: comportamiento con un catálogo 380 veces mayor que el actual.
 * Los tiempos se imprimen para usarlos como evidencia. Los umbrales son holgados a
 * propósito: deben fallar ante una degradación real, no por la carga del equipo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { buscar, prepararIndice, TAMANO_PAGINA } from '../../src/dominio/busqueda.js';
import { recomendar } from '../../src/dominio/recomendador.js';
import { CATEGORIAS, NIVELES, OBJETIVOS } from '../../src/dominio/catalogo.js';
import { CONTENIDOS_SEMILLA } from '../../src/datos/contenidos-semilla.js';

const REGISTROS = 10_000;
const UN_CUADRO_MS = 16.7; // Una respuesta dentro de un cuadro a 60 Hz se percibe como inmediata.

function catalogoGrande(cantidad) {
  const base = CONTENIDOS_SEMILLA.filter((c) => c.estado === 'publicado');
  return Array.from({ length: cantidad }, (_, i) => {
    const m = base[i % base.length];
    return {
      ...m, id: `${m.id}-${i}`, titulo: `${m.titulo} ${i}`,
      categoria: CATEGORIAS[i % 4].id, nivel: NIVELES[i % 3].id, objetivos: [OBJETIVOS[i % 5].id], minutos: 5 + (i % 40),
    };
  });
}

/** Mediana de varias corridas: una sola medición puede coincidir con la recolección de basura. */
function mediana(fn, corridas = 21) {
  const tiempos = [];
  for (let i = 0; i < corridas; i += 1) {
    const inicio = performance.now();
    fn();
    tiempos.push(performance.now() - inicio);
  }
  return tiempos.sort((a, b) => a - b)[Math.floor(corridas / 2)];
}

const catalogo = catalogoGrande(REGISTROS);
const inicioIndice = performance.now();
const indice = prepararIndice(catalogo);
const tiempoIndice = performance.now() - inicioIndice;

test(`rendimiento: construir el índice de ${REGISTROS} registros`, () => {
  console.log(`# medicion indice_ms=${tiempoIndice.toFixed(1)}`);
  assert.ok(tiempoIndice < 1000);
});

test('rendimiento: búsqueda por texto en 10 000 registros', () => {
  const t = mediana(() => buscar(indice, { texto: 'sueno dormir' }));
  console.log(`# medicion busqueda_texto_ms=${t.toFixed(2)}`);
  assert.ok(t < UN_CUADRO_MS * 3);
});

test('rendimiento: búsqueda con filtros combinados en 10 000 registros', () => {
  const t = mediana(() => buscar(indice, { texto: 'dormir', categorias: ['descanso'], niveles: ['principiante'], duracionMax: 20, objetivo: 'dormir-mejor' }));
  console.log(`# medicion busqueda_filtros_ms=${t.toFixed(2)}`);
  assert.ok(t < UN_CUADRO_MS * 3);
});

test('rendimiento: personalización sobre 10 000 registros', () => {
  const perfil = { objetivo: 'dormir-mejor', nivelActividad: 'moderado', dieta: 'vegana', restricciones: [], condiciones: ['dolor-rodilla'], horasSueno: 5, estres: 4, minutosDisponibles: 20 };
  const t = mediana(() => recomendar(perfil, catalogo), 11);
  console.log(`# medicion personalizacion_ms=${t.toFixed(2)}`);
  assert.ok(t < 100);
});

test('escalabilidad: los resultados se muestran por páginas, sin saturar el navegador', () => {
  const { total, resultados } = buscar(indice, {});
  assert.equal(total, REGISTROS);
  assert.equal(resultados.slice(0, TAMANO_PAGINA).length, 12);
});

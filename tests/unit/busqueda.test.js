import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscar, crearSlug, normalizar, prepararIndice } from '../../src/dominio/busqueda.js';
import { CONTENIDOS_SEMILLA } from '../../src/datos/contenidos-semilla.js';

const publicadas = CONTENIDOS_SEMILLA.filter((c) => c.estado === 'publicado');
const indice = prepararIndice(publicadas);
const ids = (r) => r.resultados.map((x) => x.id);

test('normalizar: elimina tildes, ñ y mayúsculas', () => {
  assert.equal(normalizar('  Sueño PROFUNDO  '), 'sueno profundo');
  assert.equal(normalizar('Alimentación'), 'alimentacion');
});

test('búsqueda: da lo mismo escribir con o sin tilde', () => {
  assert.deepEqual(ids(buscar(indice, { texto: 'sueño' })), ids(buscar(indice, { texto: 'sueno' })));
  assert.ok(buscar(indice, { texto: 'cafeína' }).total > 0);
  assert.deepEqual(ids(buscar(indice, { texto: 'cafeina' })), ids(buscar(indice, { texto: 'CAFEÍNA' })));
});

test('búsqueda: todas las palabras deben aparecer', () => {
  assert.ok(buscar(indice, { texto: 'leguminosas' }).total > 0);
  assert.equal(buscar(indice, { texto: 'leguminosas pantallas' }).total, 0);
});

test('búsqueda: el título pesa más que el cuerpo del texto', () => {
  assert.equal(ids(buscar(indice, { texto: 'pantallas' }))[0], 'sin-pantallas');
});

test('búsqueda: un texto sin coincidencias no devuelve nada', () => {
  assert.equal(buscar(indice, { texto: 'xyzzy' }).total, 0);
});

test('filtros: se combinan entre sí', () => {
  const r = buscar(indice, { categorias: ['actividad'], duracionMax: 20, niveles: ['principiante'] });
  assert.ok(r.total > 0);
  for (const x of r.resultados) {
    assert.equal(x.categoria, 'actividad');
    assert.ok(x.minutos <= 20);
    assert.equal(x.nivel, 'principiante');
  }
});

test('filtros: el objetivo restringe a lo que lo apoya', () => {
  for (const x of buscar(indice, { objetivo: 'dormir-mejor' }).resultados) assert.ok(x.objetivos.includes('dormir-mejor'));
});

test('facetas: ignoran su propio filtro para mostrar las demás opciones', () => {
  const sinFiltro = buscar(indice, {});
  const conFiltro = buscar(indice, { categorias: ['descanso'] });
  assert.deepEqual(conFiltro.facetas, sinFiltro.facetas);
  assert.equal(conFiltro.total, sinFiltro.facetas.descanso);
});

test('orden: por duración de menor a mayor', () => {
  const m = buscar(indice, { orden: 'duracion' }).resultados.map((x) => x.minutos);
  assert.deepEqual(m, [...m].sort((a, b) => a - b));
});

test('orden: sin texto se ordena alfabéticamente y un orden inválido no rompe', () => {
  const t = buscar(indice, { orden: 'inexistente' }).resultados.map((x) => x.titulo);
  assert.deepEqual(t, [...t].sort((a, b) => a.localeCompare(b, 'es')));
});

test('orden: un valor manipulado en la URL no rompe la búsqueda', () => {
  assert.ok(buscar(indice, { orden: '__proto__' }).total > 0);
  assert.ok(buscar(indice, { orden: 'constructor' }).total > 0);
});

test('slug: es apto para URL y evita colisiones', () => {
  assert.equal(crearSlug('¡Sueño y Café!'), 'sueno-y-cafe');
  assert.equal(crearSlug('Hola', ['hola']), 'hola-2');
  assert.equal(crearSlug('Hola', ['hola', 'hola-2']), 'hola-3');
  assert.equal(crearSlug('¿?'), 'recomendacion');
});

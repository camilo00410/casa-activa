import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PESOS, detectarNecesidades, esSegura, marcadoresDelPerfil, motivosDeExclusion, planDelDia, puntuar, recomendar } from '../../src/dominio/recomendador.js';
import { CATEGORIAS } from '../../src/dominio/catalogo.js';
import { CONTENIDOS_SEMILLA } from '../../src/datos/contenidos-semilla.js';

const catalogo = CONTENIDOS_SEMILLA.filter((c) => c.estado === 'publicado');
const porId = (id) => catalogo.find((c) => c.id === id);
const base = { objetivo: 'dormir-mejor', nivelActividad: 'moderado', dieta: 'omnivora', restricciones: [], condiciones: [], horasSueno: 8, estres: 2, minutosDisponibles: 30 };
const ids = (lista) => lista.map((x) => x.rec.id);
const todo = { limite: 100, maxPorCategoria: 100 };

test('pesos: suman exactamente 100', () => {
  assert.equal(Object.values(PESOS).reduce((a, b) => a + b, 0), 100);
});

test('seguridad: a una persona vegana nunca se le sugieren lácteos ni huevo', () => {
  assert.ok(!ids(recomendar({ ...base, dieta: 'vegana' }, catalogo, {}, todo)).includes('lacteo-y-huevo'));
});

test('seguridad: la intolerancia a la lactosa excluye los lácteos', () => {
  assert.ok(!ids(recomendar({ ...base, restricciones: ['sin-lactosa'] }, catalogo, {}, todo)).includes('lacteo-y-huevo'));
});

test('seguridad: la alergia excluye maní y nueces', () => {
  assert.ok(!ids(recomendar({ ...base, restricciones: ['alergia-frutos-secos'] }, catalogo, {}, todo)).includes('grasas-para-el-corazon'));
});

test('seguridad: dolor de rodilla, hipertensión o embarazo excluyen el cardio intenso', () => {
  for (const condicion of ['dolor-rodilla', 'hipertension', 'embarazo']) {
    assert.ok(!ids(recomendar({ ...base, condiciones: [condicion] }, catalogo, {}, todo)).includes('cardio-intenso'), condicion);
  }
});

test('seguridad: ningún puntaje alto supera una exclusión', () => {
  const perfil = { ...base, objetivo: 'moverme-mas', nivelActividad: 'activo', condiciones: ['hipertension'] };
  assert.ok(puntuar(porId('cardio-intenso'), perfil).puntaje >= 75, 'la recomendación puntuaría alto');
  assert.equal(esSegura(porId('cardio-intenso'), perfil), false);
  assert.ok(!ids(recomendar(perfil, catalogo, {}, todo)).includes('cardio-intenso'));
});

test('seguridad: explica en lenguaje claro por qué algo no es adecuado', () => {
  assert.deepEqual(motivosDeExclusion(porId('lacteo-y-huevo'), { ...base, dieta: 'vegana' }), ['Vegana']);
  assert.deepEqual(motivosDeExclusion(porId('plato-saludable'), { ...base, dieta: 'vegana' }), []);
});

test('marcadores: la dieta omnívora no genera exclusiones', () => {
  assert.equal(marcadoresDelPerfil(base).size, 0);
  assert.equal(marcadoresDelPerfil(null).size, 0);
});

test('personalización: dos perfiles distintos reciben listas distintas', () => {
  const a = ids(recomendar({ ...base, objetivo: 'dormir-mejor' }, catalogo));
  const b = ids(recomendar({ ...base, objetivo: 'comer-mejor' }, catalogo));
  assert.notDeepEqual(a, b);
  assert.equal(porId(a[0]).categoria, 'descanso');
  assert.equal(porId(b[0]).categoria, 'alimentacion');
});

test('necesidades: dormir poco, estrés alto y sedentarismo se detectan', () => {
  const n = detectarNecesidades({ ...base, horasSueno: 5, estres: 5, nivelActividad: 'sedentario' }).map((x) => x.categoria);
  assert.deepEqual(n, ['descanso', 'bienestar', 'actividad']);
  assert.deepEqual(detectarNecesidades(base), []);
  assert.deepEqual(detectarNecesidades(null), []);
});

test('necesidades: dormir poco sube el puntaje del descanso y lo explica', () => {
  const rec = porId('sin-pantallas');
  const conNecesidad = puntuar(rec, { ...base, objetivo: 'comer-mejor', horasSueno: 5 });
  const sinNecesidad = puntuar(rec, { ...base, objetivo: 'comer-mejor' });
  assert.equal(conNecesidad.puntaje - sinNecesidad.puntaje, PESOS.necesidad);
  assert.match(conNecesidad.razones[0], /Duermes 5 horas/);
});

test('nivel: lo que supera tu nivel pierde puntos frente a lo que se ajusta', () => {
  const perfil = { ...base, nivelActividad: 'sedentario', objetivo: 'moverme-mas' };
  assert.ok(puntuar(porId('cardio-suave'), perfil).puntaje > puntuar(porId('cardio-intenso'), perfil).puntaje);
});

test('tiempo: lo que no cabe en tu tiempo disponible baja de puntaje', () => {
  const corto = { ...base, minutosDisponibles: 10 };
  assert.ok(puntuar(porId('pausa-activa'), corto).puntaje > puntuar(porId('caminata-diaria'), corto).puntaje);
});

test('afinidad: guardar favoritos influye en las sugerencias, con tope', () => {
  const rec = porId('cena-ligera');
  const favoritas = catalogo.filter((c) => c.categoria === 'descanso');
  const con = puntuar(rec, { ...base, objetivo: 'comer-mejor' }, favoritas);
  const sin = puntuar(rec, { ...base, objetivo: 'comer-mejor' }, []);
  assert.equal(con.puntaje - sin.puntaje, PESOS.afinidad);
  assert.ok(con.razones.includes('Se parece a lo que guardaste'));
});

test('puntaje: nunca supera 100', () => {
  const perfil = { ...base, horasSueno: 5, estres: 5 };
  for (const rec of catalogo) assert.ok(puntuar(rec, perfil, catalogo).puntaje <= 100, rec.id);
});

test('descartes: «No me interesa» retira la recomendación', () => {
  const primera = ids(recomendar(base, catalogo))[0];
  assert.ok(!ids(recomendar(base, catalogo, { descartes: [primera] }, todo)).includes(primera));
});

test('diversidad: ninguna categoría acapara la lista', () => {
  const conteo = {};
  for (const { rec } of recomendar(base, catalogo, {}, { limite: 9, maxPorCategoria: 4 })) conteo[rec.categoria] = (conteo[rec.categoria] ?? 0) + 1;
  assert.ok(Math.max(...Object.values(conteo)) <= 4);
  assert.ok(Object.keys(conteo).length >= 3);
});

test('sin perfil: entrega contenido general, sin razones inventadas', () => {
  const r = recomendar(null, catalogo);
  assert.equal(r.length, 9);
  assert.ok(r.every((x) => x.razones.length === 0));
});

test('determinismo: la misma entrada produce la misma salida', () => {
  assert.deepEqual(ids(recomendar(base, catalogo)), ids(recomendar(base, [...catalogo].reverse())));
});

test('plan del día: una opción segura por cada categoría', () => {
  const plan = planDelDia({ ...base, dieta: 'vegana', condiciones: ['dolor-rodilla'] }, catalogo, {}, CATEGORIAS);
  assert.deepEqual(plan.map((p) => p.rec.categoria), CATEGORIAS.map((c) => c.id));
  assert.ok(plan.every((p) => esSegura(p.rec, { ...base, dieta: 'vegana', condiciones: ['dolor-rodilla'] })));
});

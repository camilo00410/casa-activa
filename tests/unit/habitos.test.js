// La zona horaria se fija antes de crear cualquier fecha: Colombia es el caso que rompe toISOString().
process.env.TZ = 'America/Bogota';

const { test } = await import('node:test');
const { default: assert } = await import('node:assert/strict');
const { cumplimientoSemanal, fechaLegible, fechaLocal, inicioSemana, mejorRacha, progresoSemana, rachaActual, sumarDias, ultimosDias } = await import('../../src/dominio/habitos.js');

test('fecha local: a las 11 p. m. en Colombia sigue siendo el mismo día', () => {
  const noche = new Date(2026, 10, 6, 23, 30);
  assert.equal(noche.toISOString().slice(0, 10), '2026-11-07', 'el camino ingenuo daría el día siguiente');
  assert.equal(fechaLocal(noche), '2026-11-06');
});

test('fecha legible: no retrocede un día por la zona horaria', () => {
  assert.equal(fechaLegible('2026-11-06'), '6 de noviembre de 2026');
  assert.equal(fechaLegible('2027-01-01'), '1 de enero de 2027');
});

test('sumarDias: cruza cambios de mes y de año', () => {
  assert.equal(sumarDias('2026-11-30', 1), '2026-12-01');
  assert.equal(sumarDias('2027-01-01', -1), '2026-12-31');
  assert.equal(sumarDias('2028-02-28', 1), '2028-02-29', 'año bisiesto');
});

test('inicio de semana: es lunes, también si la fecha es domingo', () => {
  assert.equal(inicioSemana('2026-11-02'), '2026-11-02');
  assert.equal(inicioSemana('2026-11-06'), '2026-11-02');
  assert.equal(inicioSemana('2026-11-08'), '2026-11-02');
});

test('racha: cuenta los días consecutivos hasta hoy', () => {
  assert.equal(rachaActual(['2026-11-04', '2026-11-05', '2026-11-06'], '2026-11-06'), 3);
});

test('racha: si hoy no se ha marcado, sigue viva desde ayer', () => {
  assert.equal(rachaActual(['2026-11-04', '2026-11-05'], '2026-11-06'), 2);
});

test('racha: se rompe si faltó ayer y hoy', () => {
  assert.equal(rachaActual(['2026-11-03', '2026-11-04'], '2026-11-06'), 0);
});

test('racha: una lista vacía o con duplicados no la altera', () => {
  assert.equal(rachaActual([], '2026-11-06'), 0);
  assert.equal(rachaActual(['2026-11-06', '2026-11-06'], '2026-11-06'), 1);
});

test('mejor racha: encuentra el tramo más largo', () => {
  assert.equal(mejorRacha(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11']), 3);
  assert.equal(mejorRacha([]), 0);
});

test('progreso semanal: solo cuenta la semana actual', () => {
  const p = progresoSemana(['2026-10-30', '2026-11-02', '2026-11-03', '2026-11-05'], 3, '2026-11-06');
  assert.deepEqual(p, { hechos: 3, meta: 3, cumplida: true });
});

test('últimos días: devuelve siete y marca hoy', () => {
  const d = ultimosDias(['2026-11-06', '2026-11-01'], '2026-11-06');
  assert.equal(d.length, 7);
  assert.equal(d.at(-1).esHoy, true);
  assert.equal(d.at(-1).hecho, true);
  assert.equal(d.at(-1).dia, 'vie');
  assert.equal(d[1].fecha, '2026-11-01');
});

test('cumplimiento: exceder la meta en un hábito no oculta lo que falta en otro', () => {
  const habitos = [{ id: 'a', metaSemanal: 2, creado: '2026-01-01' }, { id: 'b', metaSemanal: 2, creado: '2026-01-01' }];
  const registros = { a: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'], b: [] };
  assert.equal(cumplimientoSemanal(habitos, registros, '2026-11-06', 1)[0].porcentaje, 50);
});

test('cumplimiento: una semana anterior a la creación del hábito no cuenta', () => {
  const r = cumplimientoSemanal([{ id: 'a', metaSemanal: 3, creado: '2026-11-02' }], { a: [] }, '2026-11-06', 2);
  assert.equal(r[0].meta, 0);
  assert.equal(r[0].porcentaje, 0);
  assert.equal(r[1].meta, 3);
});

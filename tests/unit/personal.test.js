import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErrorSesion } from '../../src/servicios/personal.js';
import { PERFIL_VALIDO, REGISTRO_VALIDO, crearSistema } from './ayudas.js';

const HOY = '2026-11-06';
async function conUsuario() {
  const s = crearSistema({ hoy: () => HOY });
  const { usuario } = await s.auth.registrar(REGISTRO_VALIDO);
  return { ...s, id: usuario.id };
}

test('perfil: se guarda con autorización y queda registrada la fecha', async () => {
  const { personal, repos, id } = await conUsuario();
  assert.equal((await personal.guardarPerfil(id, PERFIL_VALIDO)).ok, true);
  assert.equal((await personal.perfil(id)).objetivo, 'dormir-mejor');
  assert.equal((await repos.usuarios.buscarPorId(id)).consentimientos.salud.fecha, HOY);
});

test('perfil: sin autorización no se guarda nada', async () => {
  const { personal, id } = await conUsuario();
  assert.equal((await personal.guardarPerfil(id, { ...PERFIL_VALIDO, autorizaSalud: false })).ok, false);
  assert.equal(await personal.perfil(id), null);
});

test('favoritos: alterna, persiste y refleja solo lo publicado', async () => {
  const { personal, catalogo, id } = await conUsuario();
  assert.equal(await personal.alternarFavorito(id, 'conecta'), true);
  assert.deepEqual((await personal.recomendacionesFavoritas(id)).map((r) => r.id), ['conecta']);
  await catalogo.cambiarEstado('conecta', 'borrador');
  assert.deepEqual(await personal.recomendacionesFavoritas(id), [], 'un contenido retirado deja de mostrarse');
  await catalogo.cambiarEstado('conecta', 'publicado');
  assert.equal(await personal.alternarFavorito(id, 'conecta'), false);
  assert.deepEqual(await personal.favoritas(id), []);
});

test('favoritos: son independientes entre usuarios', async () => {
  const { personal, auth, id } = await conUsuario();
  await personal.alternarFavorito(id, 'conecta');
  const { usuario: otro } = await auth.registrar({ ...REGISTRO_VALIDO, correo: 'otro@correo.com' });
  assert.deepEqual(await personal.favoritas(otro.id), []);
});

test('personalización: «No me interesa» se aplica y se puede deshacer', async () => {
  const { personal, id } = await conUsuario();
  await personal.guardarPerfil(id, PERFIL_VALIDO);
  const primera = (await personal.recomendaciones(id)).lista[0].rec.id;
  await personal.descartar(id, primera);
  assert.ok(!(await personal.recomendaciones(id)).lista.some((x) => x.rec.id === primera));
  await personal.restaurar(id, primera);
  assert.equal((await personal.recomendaciones(id)).lista[0].rec.id, primera);
});

test('personalización: lo que está en el plan de hoy no se repite en la lista', async () => {
  const { personal, id } = await conUsuario();
  await personal.guardarPerfil(id, PERFIL_VALIDO);
  const { plan, lista } = await personal.recomendaciones(id);
  const enPlan = new Set(plan.map((p) => p.rec.id));
  assert.equal(plan.length, 4);
  assert.ok(lista.length > 0 && lista.every((x) => !enPlan.has(x.rec.id)));
});

test('hábitos: valida, marca, desmarca y calcula el resumen', async () => {
  const { personal, id } = await conUsuario();
  assert.equal((await personal.crearHabito(id, { nombre: 'x', categoria: 'descanso', metaSemanal: 3 })).ok, false);
  const { habito } = await personal.crearHabito(id, { nombre: 'Dormir temprano', categoria: 'descanso', metaSemanal: 3 });
  assert.equal(await personal.alternarDia(id, habito.id, HOY), true);
  let r = await personal.resumenHabitos(id);
  assert.deepEqual(r.hoy, { hechos: 1, total: 1 });
  assert.equal(r.rachaMayor, 1);
  assert.equal(r.filas[0].semana.hechos, 1);
  assert.equal(await personal.alternarDia(id, habito.id, HOY), false);
  r = await personal.resumenHabitos(id);
  assert.equal(r.hoy.hechos, 0);
});

test('hábitos: no se pueden marcar días futuros ni muy antiguos', async () => {
  const { personal, id } = await conUsuario();
  const { habito } = await personal.crearHabito(id, { nombre: 'Leer', categoria: 'bienestar', metaSemanal: 3 });
  assert.equal(await personal.alternarDia(id, habito.id, '2026-11-07'), null);
  assert.equal(await personal.alternarDia(id, habito.id, '2026-10-30'), null);
  assert.equal(await personal.alternarDia(id, habito.id, '2026-10-31'), true);
});

test('hábitos: nadie puede marcar el hábito de otra persona', async () => {
  const { personal, auth, id } = await conUsuario();
  const { habito } = await personal.crearHabito(id, { nombre: 'Leer', categoria: 'bienestar', metaSemanal: 3 });
  const { usuario: otro } = await auth.registrar({ ...REGISTRO_VALIDO, correo: 'otro@correo.com' });
  assert.equal(await personal.alternarDia(otro.id, habito.id, HOY), null);
});

test('sesión: sin sesión vigente no se crean datos de salud', async () => {
  const { personal, auth, id } = await conUsuario();
  await auth.salir();
  await assert.rejects(personal.guardarPerfil(id, PERFIL_VALIDO), ErrorSesion);
  await assert.rejects(personal.alternarFavorito(id, 'conecta'), ErrorSesion);
  assert.equal(await personal.perfil(id), null);
});

test('sesión: una sesión vencida tampoco permite escribir', async () => {
  let t = 1_000_000;
  const s = crearSistema({ ahora: () => t, hoy: () => HOY });
  const { usuario } = await s.auth.registrar(REGISTRO_VALIDO);
  t += 9 * 60 * 60 * 1000;
  await assert.rejects(s.personal.crearHabito(usuario.id, { nombre: 'Leer', categoria: 'bienestar', metaSemanal: 3 }), ErrorSesion);
});

test('privacidad: eliminar la cuenta impide que reaparezcan sus datos', async () => {
  const { personal, auth, repos, id } = await conUsuario();
  await personal.eliminarCuenta(id);
  await auth.salir();
  await assert.rejects(personal.guardarPerfil(id, PERFIL_VALIDO), ErrorSesion);
  assert.equal(await repos.perfiles.obtener(id), null);
});

test('hábitos: nadie puede eliminar el hábito de otra persona', async () => {
  const { personal, auth, id } = await conUsuario();
  const { habito } = await personal.crearHabito(id, { nombre: 'Leer', categoria: 'bienestar', metaSemanal: 3 });
  const { usuario: otro } = await auth.registrar({ ...REGISTRO_VALIDO, correo: 'otro@correo.com' });
  await personal.eliminarHabito(otro.id, habito.id);
  assert.equal((await personal.resumenHabitos(id)).filas.length, 1);
});

test('descartes: se pueden restaurar todos a la vez', async () => {
  const { personal, id } = await conUsuario();
  await personal.descartar(id, 'conecta');
  await personal.descartar(id, 'cena-ligera');
  await personal.restaurarDescartadas(id);
  assert.deepEqual(await personal.descartadas(id), []);
});

test('privacidad: la exportación incluye los datos, nunca la credencial', async () => {
  const { personal, id } = await conUsuario();
  await personal.guardarPerfil(id, PERFIL_VALIDO);
  await personal.alternarFavorito(id, 'conecta');
  const datos = await personal.exportarDatos(id);
  assert.equal(datos.cuenta.correo, 'ana@correo.com');
  assert.equal(datos.perfilDeSalud.edad, 30);
  assert.deepEqual(datos.favoritos, ['conecta']);
  const texto = JSON.stringify(datos);
  assert.ok(!texto.includes('credencial') && !texto.includes('"hash"'));
});

test('privacidad: borrar el perfil de salud revoca la autorización', async () => {
  const { personal, repos, id } = await conUsuario();
  await personal.guardarPerfil(id, PERFIL_VALIDO);
  await personal.borrarPerfilSalud(id);
  assert.equal(await personal.perfil(id), null);
  const u = await repos.usuarios.buscarPorId(id);
  assert.equal(u.consentimientos.salud, undefined);
  assert.ok(u.consentimientos.datos);
});

test('privacidad: eliminar la cuenta borra todo lo asociado', async () => {
  const { personal, repos, almacen, id } = await conUsuario();
  await personal.guardarPerfil(id, PERFIL_VALIDO);
  await personal.alternarFavorito(id, 'conecta');
  await personal.descartar(id, 'cena-ligera');
  const { habito } = await personal.crearHabito(id, { nombre: 'Leer', categoria: 'bienestar', metaSemanal: 3 });
  await personal.alternarDia(id, habito.id, HOY);
  await personal.eliminarCuenta(id);
  assert.equal(await repos.usuarios.buscarPorId(id), null);
  assert.equal(await personal.perfil(id), null);
  assert.ok(!JSON.stringify(['favoritos', 'descartes', 'perfiles', 'habitos', 'usuarios'].map((k) => almacen.leer(k))).includes(id));
  assert.equal(almacen.leer('registros')[habito.id], undefined);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOQUEO_MS, DURACION_SESION_MS, ITERACIONES, MAX_FALLOS, crearCredencial, verificarCredencial } from '../../src/servicios/autenticacion.js';
import { CUENTAS_DEMO } from '../../src/datos/semilla.js';
import { ITERACIONES_PRUEBA, REGISTRO_VALIDO, crearSistema } from './ayudas.js';

const ING = { correo: REGISTRO_VALIDO.correo, password: REGISTRO_VALIDO.password };

test('configuración: usa las 600 000 iteraciones que recomienda OWASP', () => {
  assert.equal(ITERACIONES, 600_000);
});

test('credencial: no contiene la contraseña y usa una sal distinta cada vez', async () => {
  const a = await crearCredencial('Segura2026', ITERACIONES_PRUEBA);
  const b = await crearCredencial('Segura2026', ITERACIONES_PRUEBA);
  assert.ok(!JSON.stringify(a).includes('Segura2026'));
  assert.notEqual(a.sal, b.sal);
  assert.notEqual(a.hash, b.hash);
  assert.equal(a.algoritmo, 'PBKDF2-SHA256');
});

test('credencial: verifica la correcta y rechaza la incorrecta', async () => {
  const c = await crearCredencial('Segura2026', ITERACIONES_PRUEBA);
  assert.equal(await verificarCredencial('Segura2026', c), true);
  assert.equal(await verificarCredencial('segura2026', c), false);
});

test('demostración: las cuentas iniciales funcionan y están hasheadas', async () => {
  const { auth, almacen } = crearSistema();
  assert.equal((await auth.ingresar(CUENTAS_DEMO.usuario)).ok, true);
  assert.equal((await auth.ingresar(CUENTAS_DEMO.admin)).usuario.rol, 'admin');
  assert.ok(!JSON.stringify(almacen.leer('usuarios')).includes('Demo2026'));
});

test('registro: crea la cuenta, abre sesión y guarda la autorización', async () => {
  const { auth, repos } = crearSistema();
  const r = await auth.registrar(REGISTRO_VALIDO);
  assert.equal(r.ok, true);
  assert.equal(r.usuario.rol, 'usuario', 'nadie se registra como administrador');
  assert.equal((await auth.usuarioActual()).correo, 'ana@correo.com');
  const guardado = await repos.usuarios.buscarPorCorreo('ana@correo.com');
  assert.ok(guardado.consentimientos.datos.fecha);
  assert.equal(guardado.consentimientos.salud, undefined, 'la autorización de salud es aparte');
});

test('registro: nunca expone la credencial a la interfaz', async () => {
  const { auth } = crearSistema();
  assert.equal((await auth.registrar(REGISTRO_VALIDO)).usuario.credencial, undefined);
  assert.equal((await auth.usuarioActual()).credencial, undefined);
});

test('registro: el correo es único sin distinguir mayúsculas', async () => {
  const { auth } = crearSistema();
  await auth.registrar(REGISTRO_VALIDO);
  assert.ok((await auth.registrar({ ...REGISTRO_VALIDO, correo: 'ANA@correo.com' })).errores.correo);
});

test('ingreso: el error no revela si el correo existe', async () => {
  const { auth } = crearSistema();
  await auth.registrar(REGISTRO_VALIDO);
  await auth.salir();
  const clave = await auth.ingresar({ ...ING, password: 'Incorrecta123' });
  const correo = await auth.ingresar({ correo: 'nadie@correo.com', password: 'Incorrecta123' });
  assert.equal(clave.general, correo.general);
});

test('ingreso: bloquea tras varios fallos y libera al vencer el plazo', async () => {
  let t = 1_000_000;
  const { auth } = crearSistema({ ahora: () => t });
  await auth.registrar(REGISTRO_VALIDO);
  await auth.salir();
  for (let i = 0; i < MAX_FALLOS; i += 1) await auth.ingresar({ ...ING, password: 'Incorrecta123' });
  const bloqueado = await auth.ingresar(ING);
  assert.equal(bloqueado.ok, false, 'ni la contraseña correcta entra durante el bloqueo');
  assert.match(bloqueado.general, /bloqueada/);
  t += BLOQUEO_MS + 1;
  assert.equal((await auth.ingresar(ING)).ok, true);
});

test('ingreso: un acierto reinicia el contador de fallos', async () => {
  const { auth } = crearSistema();
  await auth.registrar(REGISTRO_VALIDO);
  await auth.salir();
  for (let i = 0; i < MAX_FALLOS - 1; i += 1) await auth.ingresar({ ...ING, password: 'Incorrecta123' });
  assert.equal((await auth.ingresar(ING)).ok, true);
  await auth.salir();
  for (let i = 0; i < MAX_FALLOS - 1; i += 1) await auth.ingresar({ ...ING, password: 'Incorrecta123' });
  assert.equal((await auth.ingresar(ING)).ok, true);
});

test('sesión: expira a las ocho horas', async () => {
  let t = 1_000_000;
  const { auth } = crearSistema({ ahora: () => t });
  await auth.registrar(REGISTRO_VALIDO);
  t += DURACION_SESION_MS - 1;
  assert.ok(await auth.usuarioActual());
  t += 2;
  assert.equal(await auth.usuarioActual(), null);
});

test('sesión: salir la cierra', async () => {
  const { auth } = crearSistema();
  await auth.registrar(REGISTRO_VALIDO);
  await auth.salir();
  assert.equal(await auth.usuarioActual(), null);
});

test('cuenta: cambiar la contraseña exige la actual', async () => {
  const { auth } = crearSistema();
  const { usuario } = await auth.registrar(REGISTRO_VALIDO);
  assert.ok((await auth.cambiarPassword(usuario.id, { actual: 'Mala123456', nueva: 'Nueva2026x', confirmacion: 'Nueva2026x' })).errores.actual);
  assert.equal((await auth.cambiarPassword(usuario.id, { actual: REGISTRO_VALIDO.password, nueva: 'Nueva2026x', confirmacion: 'Nueva2026x' })).ok, true);
  await auth.salir();
  assert.equal((await auth.ingresar(ING)).ok, false);
  assert.equal((await auth.ingresar({ correo: ING.correo, password: 'Nueva2026x' })).ok, true);
});

test('cuenta: no permite tomar el correo de otra persona', async () => {
  const { auth } = crearSistema();
  const { usuario } = await auth.registrar(REGISTRO_VALIDO);
  assert.ok((await auth.actualizarCuenta(usuario.id, { nombre: 'Ana', correo: CUENTAS_DEMO.admin.correo })).errores.correo);
  assert.equal((await auth.actualizarCuenta(usuario.id, { nombre: 'Ana María', correo: 'ana@correo.com' })).usuario.nombre, 'Ana María');
});

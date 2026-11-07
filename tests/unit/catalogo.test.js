import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CATEGORIAS, MARCADORES_EXCLUSION, OBJETIVOS } from '../../src/dominio/catalogo.js';
import { validarRecomendacion } from '../../src/dominio/validacion.js';
import { buscar } from '../../src/dominio/busqueda.js';
import { CONTENIDOS_SEMILLA } from '../../src/datos/contenidos-semilla.js';
import { VERSION_ESQUEMA, aplicarMigraciones, prepararDatos, reiniciarDatos } from '../../src/datos/semilla.js';
import { crearAlmacenMemoria, crearAlmacenNavegador, ErrorAlmacen } from '../../src/datos/almacen.js';
import { crearSistema } from './ayudas.js';

const NUEVA = { titulo: 'Nueva recomendación experimental', resumen: 'Un resumen con la longitud suficiente.', categoria: 'bienestar', nivel: 'principiante', minutos: 10, objetivos: ['reducir-estres'], pasos: ['Uno', ' ', 'Dos'], beneficios: ['Beneficio'], etiquetas: [], excluye: [], fuente: { nombre: 'OMS', url: 'https://www.who.int/x' }, estado: 'publicado' };

test('semilla: toda recomendación cumple las reglas de contenido', () => {
  for (const c of CONTENIDOS_SEMILLA) assert.equal(validarRecomendacion(c).valido, true, `${c.id}: ${JSON.stringify(validarRecomendacion(c).errores)}`);
});

test('semilla: los identificadores son únicos', () => {
  const ids = CONTENIDOS_SEMILLA.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('semilla: las cuatro categorías de la guía tienen al menos cinco recomendaciones', () => {
  assert.deepEqual(CATEGORIAS.map((c) => c.id), ['alimentacion', 'actividad', 'descanso', 'bienestar']);
  for (const c of CATEGORIAS) assert.ok(CONTENIDOS_SEMILLA.filter((x) => x.categoria === c.id && x.estado === 'publicado').length >= 5, c.id);
});

test('semilla: cada objetivo tiene contenido y cada exclusión es conocida', () => {
  for (const o of OBJETIVOS) assert.ok(CONTENIDOS_SEMILLA.some((c) => c.objetivos.includes(o.id)), o.id);
  const conocidos = new Set(MARCADORES_EXCLUSION.map((m) => m.id));
  for (const c of CONTENIDOS_SEMILLA) for (const e of c.excluye) assert.ok(conocidos.has(e), e);
});

test('semilla: toda imagen referenciada existe en el proyecto', () => {
  for (const c of CONTENIDOS_SEMILLA) assert.ok(existsSync(new URL(`../../assets/img/${c.imagen}.webp`, import.meta.url)), c.imagen);
});

test('semilla: el cardio de bajo impacto ya no apunta a un video de alta intensidad', () => {
  const suave = CONTENIDOS_SEMILLA.find((c) => c.id === 'cardio-suave');
  const intenso = CONTENIDOS_SEMILLA.find((c) => c.id === 'cardio-intenso');
  assert.equal(suave.video, null);
  assert.equal(intenso.nivel, 'avanzado');
  assert.ok(intenso.video);
});

test('administración: una recomendación creada aparece en la búsqueda pública', async () => {
  const { catalogo } = crearSistema();
  assert.equal(buscar(await catalogo.indiceBusqueda(), { texto: 'experimental' }).total, 0);
  const { ok, contenido } = await catalogo.guardar(NUEVA);
  assert.ok(ok);
  assert.equal(contenido.id, 'nueva-recomendacion-experimental');
  assert.deepEqual(contenido.pasos, ['Uno', 'Dos'], 'las líneas vacías se descartan');
  assert.equal(buscar(await catalogo.indiceBusqueda(), { texto: 'experimental' }).total, 1);
});

test('administración: un borrador no es público y aparece al publicarlo', async () => {
  const { catalogo } = crearSistema();
  const { contenido } = await catalogo.guardar({ ...NUEVA, estado: 'borrador' });
  assert.equal(buscar(await catalogo.indiceBusqueda(), { texto: 'experimental' }).total, 0);
  await catalogo.cambiarEstado(contenido.id, 'publicado');
  assert.equal(buscar(await catalogo.indiceBusqueda(), { texto: 'experimental' }).total, 1);
});

test('administración: editar y eliminar actualizan el índice', async () => {
  const { catalogo } = crearSistema();
  const { contenido } = await catalogo.guardar(NUEVA);
  await catalogo.guardar({ ...contenido, titulo: 'Título totalmente cambiado' }, contenido.id);
  assert.equal(buscar(await catalogo.indiceBusqueda(), { texto: 'totalmente' }).total, 1);
  await catalogo.eliminar(contenido.id);
  assert.equal(buscar(await catalogo.indiceBusqueda(), { texto: 'totalmente' }).total, 0);
});

test('administración: rechaza un contenido inválido sin guardarlo', async () => {
  const { catalogo } = crearSistema();
  const antes = (await catalogo.todas()).length;
  assert.equal((await catalogo.guardar({ ...NUEVA, fuente: { nombre: '', url: '' } })).ok, false);
  assert.equal((await catalogo.todas()).length, antes);
});

test('administración: editar algo eliminado en otra pestaña no finge éxito', async () => {
  const { catalogo } = crearSistema();
  const { contenido } = await catalogo.guardar(NUEVA);
  await catalogo.eliminar(contenido.id);
  const r = await catalogo.guardar({ ...contenido, titulo: 'Título cambiado sin destino' }, contenido.id);
  assert.equal(r.ok, false);
  assert.match(r.errores.titulo, /ya no existe/);
});

test('administración: rechaza un video con un enlace inseguro', async () => {
  const { catalogo } = crearSistema();
  assert.ok((await catalogo.guardar({ ...NUEVA, video: 'javascript:alert(1)' })).errores.video);
});

test('migraciones: se ejecutan en orden y solo las pendientes', () => {
  const almacen = crearAlmacenMemoria();
  const orden = [];
  const migraciones = [{ version: 1, aplicar: () => orden.push(1) }, { version: 2, aplicar: () => orden.push(2) }, { version: 3, aplicar: () => orden.push(3) }];
  assert.equal(aplicarMigraciones(almacen, migraciones, 2), 2);
  assert.deepEqual(orden, [1, 2]);
  assert.equal(aplicarMigraciones(almacen, migraciones, 3), 3);
  assert.deepEqual(orden, [1, 2, 3], 'no se repiten las ya aplicadas');
});

test('siembra: no sobrescribe datos si la versión ya está aplicada', () => {
  const almacen = crearAlmacenMemoria();
  prepararDatos(almacen);
  almacen.escribir('contenidos', []);
  assert.equal(prepararDatos(almacen), VERSION_ESQUEMA);
  assert.deepEqual(almacen.leer('contenidos'), []);
});

test('reinicio: restablece los datos de demostración', () => {
  const almacen = crearAlmacenMemoria();
  prepararDatos(almacen);
  almacen.escribir('contenidos', []);
  reiniciarDatos(almacen);
  assert.equal(almacen.leer('contenidos').length, CONTENIDOS_SEMILLA.length);
});

function storageFalso({ falla = false, lleno = false } = {}) {
  const m = {};
  const s = {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => {
      if (falla) throw new Error('bloqueado');
      if (lleno && !k.endsWith('prueba')) throw new Error('cuota');
      m[k] = String(v);
    },
    removeItem: (k) => { delete m[k]; },
  };
  return s;
}

test('almacén: si el navegador bloquea el almacenamiento, continúa en memoria', () => {
  const a = crearAlmacenNavegador(storageFalso({ falla: true }));
  assert.equal(a.temporal, true);
  a.escribir('x', 1);
  assert.equal(a.leer('x'), 1);
});

test('almacén: si leer localStorage lanza SecurityError, continúa en memoria', () => {
  const bloqueado = Object.defineProperty({}, 'localStorage', { get() { throw new Error('SecurityError'); } });
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => bloqueado.localStorage });
  try {
    assert.equal(crearAlmacenNavegador().temporal, true);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('almacén: con la cuota llena las cuentas existentes siguen siendo legibles', () => {
  const s = storageFalso();
  s.setItem('casaactiva.usuarios', '[{"id":"u1"}]');
  const lleno = { ...s, setItem() { const e = new Error('cuota'); e.name = 'QuotaExceededError'; throw e; } };
  const a = crearAlmacenNavegador(lleno);
  assert.equal(a.temporal, false);
  assert.equal(a.leer('usuarios')[0].id, 'u1');
  assert.throws(() => a.escribir('x', 1), ErrorAlmacen);
});

test('datos alterados: una lista con otro tipo no tumba la aplicación', async () => {
  const { almacen, repos } = crearSistema();
  almacen.escribir('usuarios', {});
  assert.equal(await repos.usuarios.buscarPorCorreo('a@b.co'), null);
});

test('almacén: un dato corrupto no tumba la aplicación', () => {
  const s = storageFalso();
  const a = crearAlmacenNavegador(s);
  s.setItem('casaactiva.x', '{no es json');
  assert.equal(a.leer('x'), undefined);
});

test('almacén: el espacio agotado se informa con un error claro', () => {
  const a = crearAlmacenNavegador(storageFalso({ lleno: true }));
  assert.throws(() => a.escribir('x', 1), ErrorAlmacen);
});

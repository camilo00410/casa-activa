import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { grafoDeModulos } from '../../scripts/actualizar-modulos.mjs';
import { coincidir, construirHash, destinoSeguro, encontrarRuta, interpretarHash } from '../../src/nucleo/enrutador.js';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');
function archivos(dir, extension) {
  return readdirSync(join(RAIZ, dir)).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(join(RAIZ, ruta)).isDirectory()) return archivos(ruta, extension);
    return n.endsWith(extension) ? [ruta] : [];
  });
}

test('enrutador: interpreta ruta y consulta, también con tildes', () => {
  assert.deepEqual(interpretarHash('#/explorar?q=sue%C3%B1o&cat=descanso'), { ruta: '/explorar', consulta: { q: 'sueño', cat: 'descanso' } });
  assert.deepEqual(interpretarHash(''), { ruta: '/', consulta: {} });
});

test('enrutador: construye la URL omitiendo lo vacío y es reversible', () => {
  const hash = construirHash('/explorar', { q: 'sueño y café', cat: '', orden: null });
  assert.ok(!hash.includes('cat='));
  assert.equal(interpretarHash(hash).consulta.q, 'sueño y café');
});

test('enrutador: extrae parámetros y distingue longitudes', () => {
  assert.deepEqual(coincidir('/recomendacion/:id', '/recomendacion/sin-pantallas'), { id: 'sin-pantallas' });
  assert.equal(coincidir('/recomendacion/:id', '/recomendacion'), null);
  assert.equal(coincidir('/explorar', '/favoritos'), null);
});

test('enrutador: la primera coincidencia gana', () => {
  const rutas = [{ patron: '/admin/nueva' }, { patron: '/admin/:id' }];
  assert.equal(encontrarRuta(rutas, '/admin/nueva').definicion.patron, '/admin/nueva');
  assert.equal(encontrarRuta(rutas, '/nada'), null);
});

test('enrutador: un fragmento ajeno no es una página inexistente', () => {
  assert.equal(interpretarHash('#contenido').ruta, '/');
});

test('enrutador: un «%» suelto no lanza error', () => {
  assert.equal(coincidir('/recomendacion/:id', '/recomendacion/%'), null);
});

test('enrutador: el destino de regreso conserva filtros', () => {
  assert.equal(destinoSeguro('/explorar?cat=descanso,bienestar&dur=20'), '/explorar?cat=descanso,bienestar&dur=20');
});

test('enrutador: solo permite destinos internos después de ingresar', () => {
  assert.equal(destinoSeguro('/habitos'), '/habitos');
  assert.equal(destinoSeguro('/recomendacion/sin-pantallas'), '/recomendacion/sin-pantallas');
  for (const malo of ['//evil.com', 'https://evil.com', 'javascript:alert(1)', undefined, '/a?b=<script>']) assert.equal(destinoSeguro(malo), '/para-ti', String(malo));
});

const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminancia = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const contraste = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const tokens = Object.fromEntries([...leer('src/estilos/tokens.css').matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));

test('contraste: los pares de texto cumplen WCAG AA (4,5:1)', () => {
  const pares = [['tinta', 'crema'], ['tinta', 'papel'], ['gris', 'crema'], ['gris', 'papel'], ['gris', 'campo'], ['oliva', 'crema'], ['oliva', 'papel'], ['tinta', 'lima'], ['papel', 'tinta'], ['lima', 'tinta'], ['error', 'papel'], ['error', 'error-fondo'], ['exito', 'papel'], ['exito', 'exito-fondo'], ['tinta', 'aviso-fondo'], ['alimentacion', 'alimentacion-fondo'], ['actividad', 'actividad-fondo'], ['descanso', 'descanso-fondo'], ['bienestar', 'bienestar-fondo']];
  for (const [a, b] of pares) assert.ok(contraste(tokens[a], tokens[b]) >= 4.5, `${a}/${b}: ${contraste(tokens[a], tokens[b]).toFixed(2)}`);
});

test('contraste: los bordes de controles cumplen 3:1', () => {
  assert.ok(contraste(tokens.borde, tokens.papel) >= 3);
  assert.ok(contraste(tokens.borde, tokens.crema) >= 3);
  assert.ok(contraste(tokens.borde, tokens.campo) >= 3);
});

test('seguridad: el código no usa APIs que inyecten HTML o ejecuten texto', () => {
  const prohibido = /\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/;
  const codigo = archivos('src', '.js');
  assert.ok(codigo.length > 10);
  for (const archivo of codigo) {
    const sinComentarios = leer(archivo).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
    assert.equal(prohibido.test(sinComentarios), false, archivo);
  }
});

test('seguridad: la política CSP impide scripts externos y en línea', () => {
  const html = leer('index.html');
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src 'self'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, 'no debe haber scripts en línea');
});

test('rendimiento: la lista de precarga de módulos coincide con el grafo real', () => {
  const declarados = [...leer('index.html').matchAll(/rel="modulepreload" href="([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(declarados, grafoDeModulos().sort(), 'ejecuta: node scripts/actualizar-modulos.mjs');
});

test('privacidad y rendimiento: no se cargan recursos de terceros', () => {
  const recursos = [...archivos('src', '.css'), 'index.html'].map(leer).join('\n');
  assert.doesNotMatch(recursos, /https?:\/\/(?!www\.w3\.org)/);
});

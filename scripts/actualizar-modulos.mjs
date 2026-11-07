#!/usr/bin/env node
/**
 * Mantiene la lista de <link rel="modulepreload"> de index.html.
 * Sin ella, el navegador descubre los módulos de a uno por nivel de importación y en
 * redes móviles eso retrasa el primer contenido. Con ella los pide todos desde el inicio,
 * sin necesidad de un empaquetador. Una prueba unitaria avisa si la lista se desactualiza.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ENTRADA = 'src/main.js';

export function grafoDeModulos() {
  const vistos = new Set();
  const visitar = (archivo) => {
    if (vistos.has(archivo)) return;
    vistos.add(archivo);
    const codigo = readFileSync(join(RAIZ, archivo), 'utf8');
    for (const [, ruta] of codigo.matchAll(/^import\s[^'"]*['"](\.[^'"]+)['"]/gm)) {
      visitar(relative(RAIZ, resolve(RAIZ, dirname(archivo), ruta)));
    }
  };
  visitar(ENTRADA);
  vistos.delete(ENTRADA);
  return [...vistos];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ruta = join(RAIZ, 'index.html');
  const lineas = grafoDeModulos().sort().map((m) => `    <link rel="modulepreload" href="${m}">`);
  const html = readFileSync(ruta, 'utf8').replace(/(<!-- modulos:inicio[^\n]*-->\n)[\s\S]*?( *<!-- modulos:fin -->)/, `$1${lineas.join('\n')}\n$2`);
  writeFileSync(ruta, html);
  console.log(`${lineas.length} módulos declarados en index.html`);
}

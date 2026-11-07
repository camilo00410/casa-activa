#!/usr/bin/env node
/**
 * Servidor estático mínimo y sin dependencias para ejecutar Casa Activa en local.
 * Uso: node scripts/servidor.mjs [puerto]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PUERTO = Number(process.argv[2] ?? process.env.PORT ?? 8080);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

createServer(async (peticion, respuesta) => {
  try {
    const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
    let archivo = normalize(join(RAIZ, ruta));
    if (archivo !== RAIZ && !archivo.startsWith(RAIZ + sep)) { respuesta.writeHead(403).end('Prohibido'); return; }
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
    const contenido = await readFile(archivo);
    const tipo = TIPOS[extname(archivo)] ?? 'application/octet-stream';
    // Igual que GitHub Pages: comprime el texto para que las mediciones locales sean comparables.
    if (/text|json|svg/.test(tipo) && /gzip/.test(peticion.headers['accept-encoding'] ?? '')) {
      respuesta.writeHead(200, { 'Content-Type': tipo, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }).end(gzipSync(contenido));
      return;
    }
    respuesta.writeHead(200, { 'Content-Type': tipo }).end(contenido);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}).listen(PUERTO, () => console.log(`Casa Activa disponible en http://localhost:${PUERTO}`));

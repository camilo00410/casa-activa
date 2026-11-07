#!/usr/bin/env node
/**
 * Genera el informe del ACA en PDF con el formato exigido por la guía:
 * Arial 12, interlineado 1,5, márgenes de 2,54 cm, secciones en orden y figuras numeradas.
 * Hace dos pasadas: la primera ubica cada sección para escribir las páginas del contenido.
 * Uso: node report/generar.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { CONFIG } from './config.mjs';
import { construirContenido } from './contenido.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(DIR, '..', 'entrega', 'Informe_ACA_Casa_Activa.pdf');
const SECCIONES = ['Introducción', 'Objetivos', 'Análisis de requerimientos funcionales', 'Análisis de requerimientos no funcionales', 'Wireframe', 'Mockup', 'Prototipo', 'Conclusiones', 'Referencias', 'Anexo A. Distribución del trabajo del equipo'];

const ESTILOS = `
  @page { size: Letter; margin: 2.54cm; }
  * { box-sizing: border-box; }
  html { font-size: 12pt; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; }
  p { margin: 0 0 8pt; text-indent: 1.27cm; orphans: 3; widows: 3; }
  a { color: #000; text-decoration: underline; overflow-wrap: anywhere; }
  h1, h2, h3 { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.5; break-after: avoid; margin: 12pt 0 6pt; }
  h1 { text-align: center; font-weight: bold; break-before: page; margin-top: 0; }
  h2 { font-weight: bold; }
  h3 { font-weight: bold; font-style: italic; }
  ul, ol { margin: 0 0 8pt; padding-left: 1.27cm; }
  li { margin-bottom: 4pt; }
  figure { margin: 10pt 0 12pt; break-inside: avoid; text-align: center; }
  figcaption { text-align: left; margin-bottom: 6pt; break-after: avoid; }
  figure img { display: block; margin: 0 auto; width: auto; height: auto; border: 1px solid #bbb; }
  .varias { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8pt; }
  .varias img { width: 100%; max-width: 100%; }
  .tabla-envoltura { margin: 8pt 0 12pt; break-inside: avoid; }
  .grupo { break-inside: avoid; }
  .nueva-pagina { break-before: page; }
  .tabla-titulo { text-indent: 0; margin-bottom: 4pt; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; font-size: 12pt; line-height: 1.5; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  td ul { margin: 0; padding-left: 14pt; }
  td li { margin-bottom: 2pt; }
  th { border-top: 1.5px solid #000; border-bottom: 1px solid #000; text-align: left; padding: 4pt 5pt; font-weight: bold; vertical-align: bottom; }
  td { border-bottom: .5px solid #888; padding: 4pt 5pt; vertical-align: top; overflow-wrap: break-word; }
  .portada { height: 21.5cm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; padding: 1cm 0; break-after: page; }
  .portada p { text-indent: 0; margin: 0 0 6pt; }
  .portada .titulo { font-weight: bold; }
  .contenido-indice { break-after: page; }
  .contenido-indice h1 { break-before: auto; }
  .contenido-indice div { display: flex; align-items: baseline; gap: 6pt; margin-bottom: 4pt; }
  .contenido-indice .puntos { flex: 1; border-bottom: 1px dotted #555; }
  .referencias p { text-indent: -1.27cm; padding-left: 1.27cm; text-align: left; }
  .pendiente { background: #ffe94d; font-weight: bold; }
`;

const marcarPendientes = (html) => html.replace(/\[\[(.+?)\]\]/g, '<span class="pendiente">[$1]</span>');

function portada() {
  return `<section class="portada">
    <div>
      <p class="titulo">${CONFIG.actividad}</p>
    </div>
    <div>${CONFIG.integrantes.map((i) => `<p>${i}</p>`).join('')}</div>
    <div>
      <p>${CONFIG.institucion}</p>
      <p>Programa de ${CONFIG.programa}</p>
      <p>${CONFIG.asignatura}, grupo ${CONFIG.grupo}</p>
      <p>Docente: ${CONFIG.docente}</p>
      <p>Fecha de entrega: ${CONFIG.fechaEntrega}</p>
    </div>
  </section>`;
}

const indice = (paginas) => `<section class="contenido-indice"><h1>Contenido</h1>${SECCIONES.map((s) => `<div><span>${s}</span><span class="puntos"></span><span>${paginas[s] ?? ''}</span></div>`).join('')}</section>`;

const documento = (paginas) => marcarPendientes(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe ACA Casa Activa</title><style>${ESTILOS}</style></head><body>${portada()}${indice(paginas)}${construirContenido()}</body></html>`);

/**
 * Reduce las capturas pesadas a JPEG para que el PDF se pueda subir a la plataforma.
 * Los wireframes, de pocos colores, se conservan en PNG: ahí el JPEG dañaría las líneas.
 */
async function comprimirImagenes(pagina) {
  await pagina.evaluate(async ({ anchoMaximo, calidad }) => {
    for (const img of document.images) {
      if (img.src.includes('/wireframes/')) continue;
      await img.decode();
      const escala = Math.min(1, anchoMaximo / img.naturalWidth);
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(img.naturalWidth * escala);
      lienzo.height = Math.round(img.naturalHeight * escala);
      const contexto = lienzo.getContext('2d');
      contexto.fillStyle = '#fff';
      contexto.fillRect(0, 0, lienzo.width, lienzo.height);
      contexto.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      img.src = lienzo.toDataURL('image/jpeg', calidad);
      await img.decode();
    }
  }, { anchoMaximo: 1500, calidad: 0.8 });
}

async function renderizar(pagina, html) {
  const temporal = join(DIR, '.informe.html');
  writeFileSync(temporal, html);
  await pagina.goto(pathToFileURL(temporal).href, { waitUntil: 'networkidle' });
  await comprimirImagenes(pagina);
  await pagina.pdf({
    path: SALIDA,
    format: 'Letter',
    margin: { top: '2.54cm', right: '2.54cm', bottom: '2.54cm', left: '2.54cm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;font-family:Arial,sans-serif;font-size:12pt;text-align:right;padding-right:2.54cm;"><span class="pageNumber"></span></div>',
    footerTemplate: '<span></span>',
    printBackground: true,
    tagged: true,
    outline: true,
  });
  return temporal;
}

/** Busca en qué página empieza cada sección, leyendo el PDF ya compuesto. */
function ubicarSecciones() {
  const texto = execFileSync('pdftotext', ['-layout', SALIDA, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\f');
  const paginas = {};
  texto.forEach((contenido, i) => {
    const lineas = contenido.split('\n').map((l) => l.trim()).filter(Boolean);
    if (i < 2) return; // Portada y contenido.
    for (const s of SECCIONES) if (!paginas[s] && lineas.slice(0, 3).includes(s)) paginas[s] = i + 1;
  });
  return paginas;
}

mkdirSync(dirname(SALIDA), { recursive: true });
const navegador = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const pagina = await navegador.newPage();
await renderizar(pagina, documento({}));
const temporal = await renderizar(pagina, documento(ubicarSecciones()));
await navegador.close();
if (existsSync(temporal)) execFileSync('rm', [temporal]);

const pendientes = [...new Set(JSON.stringify(CONFIG).match(/\[\[.+?\]\]/g) ?? [])];
console.log(`Informe generado: ${SALIDA}`);
if (pendientes.length) console.warn(`\nATENCIÓN: faltan datos antes de entregar (resaltados en amarillo):\n  ${pendientes.join('\n  ')}`);

#!/usr/bin/env node
/**
 * Regenera las imágenes del informe a partir de la fuente real: wireframes, sistema de
 * diseño, mockups de escritorio y móvil, y los pasos de cada flujo del prototipo.
 * Uso: node scripts/capturar-disenos.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PUERTO = 4190;
const BASE = `http://localhost:${PUERTO}`;
const APP = `${BASE}/index.html`;
const DEMO = { nombre: 'Usuario de ejemplo' };

const servidor = spawn('node', ['scripts/servidor.mjs', String(PUERTO)], { stdio: 'ignore' });
await new Promise((r) => { setTimeout(r, 700); });
const navegador = await chromium.launch();

async function preparada(pagina) {
  await pagina.waitForLoadState('networkidle');
  await pagina.evaluate(async () => {
    await document.fonts.ready;
    // Las imágenes diferidas de la parte baja también deben aparecer en la captura.
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))));
    document.getElementById('avisos')?.replaceChildren();
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await pagina.waitForTimeout(150);
}

async function sesion({ ancho, alto, escala, cuenta = null }) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: escala, locale: 'es-CO', timezoneId: 'America/Bogota' });
  const pagina = await contexto.newPage();
  if (cuenta) {
    await pagina.goto(`${APP}#/ingreso`);
    await pagina.getByRole('button', { name: cuenta }).click();
    await pagina.waitForURL(/para-ti|admin/);
  }
  return { contexto, pagina };
}

/** Captura desde «y». Limitar la altura mantiene el texto legible al imprimir la figura a todo el ancho. */
const capturar = async (pagina, archivo, { maxAlto = null, y = 0 } = {}) => {
  await preparada(pagina);
  const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
  const opciones = maxAlto && (alto > maxAlto || y > 0)
    ? { path: archivo, fullPage: true, clip: { x: 0, y, width: pagina.viewportSize().width, height: Math.min(maxAlto, alto - y) } }
    : { path: archivo, fullPage: true };
  await pagina.screenshot(opciones);
};

const ventana = async (pagina, archivo) => { await preparada(pagina); await pagina.screenshot({ path: archivo }); };

async function wireframes() {
  const { contexto, pagina } = await sesion({ ancho: 1240, alto: 900, escala: 2 });
  await pagina.goto(`${BASE}/design/wireframes/wireframes.html`);
  await pagina.waitForSelector('body[data-listo="1"]');
  for (const id of await pagina.$$eval('.wf-frame', (s) => s.map((x) => x.id))) {
    await pagina.locator(`#${id}`).screenshot({ path: `design/wireframes/png/${id}.png` });
  }
  await pagina.goto(`${BASE}/design/wireframes/mapa-pantallas.html`);
  await pagina.locator('#mapa').screenshot({ path: 'design/wireframes/png/w00-mapa-pantallas.png' });
  await pagina.goto(`${BASE}/design/arquitectura.html`);
  await pagina.locator('#arq').screenshot({ path: 'design/arquitectura.png' });
  await contexto.close();
}

async function sistemaDeDiseno() {
  const { contexto, pagina } = await sesion({ ancho: 1240, alto: 900, escala: 2 });
  await pagina.goto(`${BASE}/design/sistema-diseno.html`);
  await pagina.waitForSelector('body[data-listo="1"]');
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(300);
  for (const id of ['paleta', 'tipografia', 'iconografia', 'componentes']) await pagina.locator(`#${id}`).screenshot({ path: `design/mockups/sistema-${id}.png` });
  await contexto.close();
}

async function mockups() {
  const dir = 'design/mockups/escritorio';
  const publico = await sesion({ ancho: 1280, alto: 800, escala: 1.5 });
  for (const [ruta, nombre] of [['/', 'm01-inicio'], ['/ingreso', 'm02-ingreso'], ['/registro', 'm03-registro'], ['/explorar?cat=descanso,bienestar&dur=20', 'm06-explorar']]) {
    await publico.pagina.goto(`${APP}#${ruta}`);
    await capturar(publico.pagina, `${dir}/${nombre}.png`, { maxAlto: 1240 });
  }
  await publico.pagina.goto(APP);
  await capturar(publico.pagina, `${dir}/m01-inicio-2.png`, { maxAlto: 1240, y: 1240 });
  await publico.contexto.close();

  const demo = await sesion({ ancho: 1280, alto: 800, escala: 1.5, cuenta: DEMO.nombre });
  for (const [ruta, nombre] of [['/perfil-salud', 'm04-perfil-salud'], ['/para-ti', 'm05-para-ti'], ['/recomendacion/horario-de-sueno', 'm07-detalle'], ['/favoritos', 'm08-favoritos'], ['/habitos', 'm09-habitos'], ['/mi-perfil?tab=privacidad', 'm10-mi-perfil']]) {
    await demo.pagina.goto(`${APP}#${ruta}`);
    await capturar(demo.pagina, `${dir}/${nombre}.png`, { maxAlto: 1240 });
  }
  await demo.pagina.goto(`${APP}#/para-ti`);
  await capturar(demo.pagina, `${dir}/m05-para-ti-2.png`, { maxAlto: 1240, y: 760 });
  await demo.contexto.close();

  const admin = await sesion({ ancho: 1280, alto: 800, escala: 1.5, cuenta: 'Administrador' });
  await capturar(admin.pagina, `${dir}/m11-admin-listado.png`, { maxAlto: 1240 });
  await admin.pagina.goto(`${APP}#/admin/editar/caminata-diaria`);
  await capturar(admin.pagina, `${dir}/m12-admin-formulario.png`, { maxAlto: 1240 });
  await admin.contexto.close();

  const movilPublico = await sesion({ ancho: 390, alto: 844, escala: 2 });
  for (const [ruta, nombre] of [['/', 'inicio'], ['/ingreso', 'ingreso']]) {
    await movilPublico.pagina.goto(`${APP}#${ruta}`);
    await ventana(movilPublico.pagina, `design/mockups/movil/${nombre}.png`);
  }
  await movilPublico.contexto.close();

  const movil = await sesion({ ancho: 390, alto: 844, escala: 2, cuenta: DEMO.nombre });
  for (const [ruta, nombre] of [['/para-ti', 'para-ti'], ['/explorar', 'explorar'], ['/recomendacion/horario-de-sueno', 'detalle'], ['/habitos', 'habitos']]) {
    await movil.pagina.goto(`${APP}#${ruta}`);
    await ventana(movil.pagina, `design/mockups/movil/${nombre}.png`);
  }
  await movil.contexto.close();
}

/** Recorre cada flujo de verdad, con los mismos clics de una persona, y fotografía sus pasos. */
async function flujos() {
  const dir = 'design/prototipo';
  const escena = { ancho: 1280, alto: 760, escala: 1.5 };

  const f1 = await sesion(escena);
  await f1.pagina.goto(APP);
  await f1.pagina.getByRole('searchbox', { name: 'Buscar recomendaciones' }).fill('dormir');
  await ventana(f1.pagina, `${dir}/f1-1-buscar.png`);
  await f1.pagina.getByRole('searchbox', { name: 'Buscar recomendaciones' }).press('Enter');
  await f1.pagina.getByRole('heading', { name: 'Explorar recomendaciones' }).waitFor();
  await f1.pagina.getByLabel('Principiante').first().check();
  await ventana(f1.pagina, `${dir}/f1-2-resultados.png`);
  await f1.pagina.getByRole('link', { name: 'Duerme siete horas o más' }).click();
  await f1.pagina.getByRole('heading', { level: 1, name: 'Duerme siete horas o más' }).waitFor();
  await ventana(f1.pagina, `${dir}/f1-3-detalle.png`);
  await f1.contexto.close();

  const f2 = await sesion(escena);
  await f2.pagina.goto(`${APP}#/registro`);
  await f2.pagina.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await f2.pagina.getByText('Escribe tu nombre.').waitFor();
  await ventana(f2.pagina, `${dir}/f2-1-validacion.png`);
  await f2.pagina.getByLabel('Nombre completo').fill('Ana Pérez');
  await f2.pagina.getByLabel('Correo electrónico').fill('ana@correo.com');
  await f2.pagina.getByLabel('Contraseña', { exact: true }).fill('Segura2026');
  await f2.pagina.getByLabel('Confirma tu contraseña').fill('Segura2026');
  await f2.pagina.getByLabel('Confirmo que soy mayor de 18 años.').check();
  await f2.pagina.getByLabel(/Autorizo el tratamiento de mis datos personales/).check();
  await f2.pagina.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await f2.pagina.getByRole('heading', { level: 1, name: 'Sobre ti' }).waitFor();
  await f2.pagina.getByLabel(/Autorizo de forma explícita/).check();
  await f2.pagina.getByLabel('Edad').fill('30');
  await f2.pagina.getByRole('button', { name: 'Continuar' }).click();
  await f2.pagina.locator('label.opcion', { hasText: 'Reducir el estrés' }).locator('input').check();
  await ventana(f2.pagina, `${dir}/f2-2-objetivo.png`);
  await f2.pagina.getByRole('button', { name: 'Continuar' }).click();
  await f2.pagina.getByRole('button', { name: 'Continuar' }).click();
  await f2.pagina.locator('label.opcion', { hasText: 'Algo activo' }).locator('input').check();
  await f2.pagina.getByRole('button', { name: 'Guardar y ver mi plan' }).click();
  await f2.pagina.getByRole('heading', { name: 'Hola, Ana' }).waitFor();
  await ventana(f2.pagina, `${dir}/f2-3-plan.png`);
  await f2.contexto.close();

  const f3a = await sesion(escena);
  await f3a.pagina.goto(`${APP}#/recomendacion/conecta`);
  await f3a.pagina.getByRole('button', { name: /Guardar en favoritos/ }).first().click();
  await f3a.pagina.getByRole('heading', { name: 'INGRESA A TU CUENTA' }).waitFor();
  await f3a.pagina.waitForLoadState('networkidle');
  await f3a.pagina.screenshot({ path: `${dir}/f3-0-ingresar.png` }); // Sin limpiar: el aviso es parte del paso.
  await f3a.contexto.close();

  const f3 = await sesion({ ...escena, cuenta: DEMO.nombre });
  await f3.pagina.goto(`${APP}#/recomendacion/conecta`);
  await f3.pagina.getByRole('button', { name: /Guardar en favoritos/ }).first().click();
  await f3.pagina.getByRole('button', { name: /Quitar de favoritos/ }).first().waitFor();
  await ventana(f3.pagina, `${dir}/f3-1-guardar.png`);
  await f3.pagina.goto(`${APP}#/favoritos`);
  await ventana(f3.pagina, `${dir}/f3-2-favoritos.png`);
  await f3.pagina.goto(`${APP}#/recomendacion/rutina-diaria`);
  await f3.pagina.getByRole('button', { name: 'Crear hábito' }).click();
  await f3.pagina.getByRole('dialog').waitFor();
  await ventana(f3.pagina, `${dir}/f4-1-crear-habito.png`);
  await f3.pagina.getByRole('dialog').getByRole('button', { name: 'Crear hábito' }).click();
  await f3.pagina.getByRole('heading', { name: 'Mis hábitos' }).waitFor();
  await f3.pagina.getByRole('button', { name: /Marcar «Mantén una rutina diaria» como hecho hoy/ }).click();
  await f3.pagina.getByRole('button', { name: /Marcar «Acostarme antes de las 11» como hecho hoy/ }).click();
  await f3.pagina.getByRole('button', { name: /Desmarcar «Acostarme/ }).waitFor();
  await capturar(f3.pagina, `${dir}/f4-2-marcar.png`, { maxAlto: 1250 });
  await f3.contexto.close();

  const f5 = await sesion({ ...escena, cuenta: 'Administrador' });
  await f5.pagina.goto(`${APP}#/admin/nueva`);
  await f5.pagina.getByRole('heading', { name: 'Nueva recomendación' }).waitFor();
  await f5.pagina.getByLabel('Título').fill('Estira la espalda al despertar');
  await f5.pagina.getByLabel('Resumen').fill('Un estiramiento suave para empezar el día con menos rigidez.');
  await ventana(f5.pagina, `${dir}/f5-1-formulario.png`);
  await f5.pagina.getByLabel('Beneficios').fill('Empieza el día con movimiento');
  await f5.pagina.getByLabel('Pasos').fill('Siéntate en el borde de la cama\nEstira los brazos hacia arriba');
  await f5.pagina.getByLabel('Categoría').selectOption('actividad');
  await f5.pagina.locator('fieldset', { hasText: 'Objetivos que apoya' }).locator('label.opcion', { hasText: 'Moverme más' }).locator('input').check();
  await f5.pagina.getByLabel('Nombre de la fuente').fill('Organización Mundial de la Salud');
  await f5.pagina.getByLabel('Enlace de la fuente').fill('https://www.who.int/es');
  await f5.pagina.getByRole('button', { name: 'Publicar' }).click();
  await f5.pagina.getByRole('heading', { name: 'Administración de contenidos' }).waitFor();
  await f5.pagina.goto(`${APP}#/explorar?q=espalda%20despertar`);
  await f5.pagina.getByRole('link', { name: 'Estira la espalda al despertar' }).waitFor();
  await ventana(f5.pagina, `${dir}/f5-2-publicado.png`);
  await f5.contexto.close();
}

try {
  await wireframes();
  await sistemaDeDiseno();
  await mockups();
  await flujos();
  console.log('Capturas actualizadas.');
} finally {
  await navegador.close();
  servidor.kill();
}

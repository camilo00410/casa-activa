/** RNF5: sin desbordamiento horizontal en tres anchos y objetivos táctiles adecuados. */
import { test, expect, ir, ingresarComo, ADMIN } from './ayudas.js';

const ANCHOS = [360, 768, 1366];
const RUTAS = ['/', '/explorar', '/recomendacion/sin-pantallas', '/ingreso', '/registro', '/privacidad'];
const PRIVADAS = ['/para-ti', '/favoritos', '/habitos', '/mi-perfil', '/mi-perfil?tab=privacidad', '/perfil-salud'];

const sinDesborde = async (page, ruta, ancho) => {
  await page.setViewportSize({ width: ancho, height: 800 });
  await ir(page, ruta);
  await expect(page.locator('main > *').first()).toBeVisible();
  const { s, c } = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  expect(s, `${ruta} a ${ancho}px`).toBeLessThanOrEqual(c);
};

for (const ancho of ANCHOS) {
  for (const ruta of RUTAS) {
    test(`sin desborde en ${ruta} a ${ancho}px`, async ({ page }) => { await sinDesborde(page, ruta, ancho); });
  }
  for (const ruta of PRIVADAS) {
    test(`sin desborde en ${ruta} a ${ancho}px con sesión`, async ({ page }) => { await ingresarComo(page); await sinDesborde(page, ruta, ancho); });
  }
  test(`sin desborde en administración a ${ancho}px`, async ({ page }) => { await ingresarComo(page, ADMIN); await sinDesborde(page, '/admin', ancho); await sinDesborde(page, '/admin/nueva', ancho); });
}

test('en móvil, la navegación pasa a la barra inferior', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await ingresarComo(page);
  await expect(page.locator('.barra-movil')).toBeVisible();
  await expect(page.locator('.nav-principal')).toBeHidden();
  await page.locator('.barra-movil').getByRole('link', { name: 'Hábitos' }).click();
  await expect(page).toHaveURL(/habitos/);
});

test('en escritorio, la barra inferior no aparece', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 800 });
  await ir(page, '/');
  await expect(page.locator('.barra-movil')).toBeHidden();
});

test('en móvil, los controles principales miden al menos 44 px de alto', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await ingresarComo(page);
  const alturasDe = (selector) => page.locator(selector).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));

  await ir(page, '/habitos');
  await expect(page.locator('.habito').first()).toBeVisible();
  const habitos = await alturasDe('.habito-check, .dia, .barra-movil a, main .btn');
  expect(habitos.length).toBeGreaterThan(10);
  expect(Math.min(...habitos)).toBeGreaterThanOrEqual(44);

  await ir(page, '/explorar');
  await page.getByText('Filtros', { exact: true }).click();
  const explorar = await alturasDe('.filtros summary, .filtro-opcion, .chip, main .btn-corazon');
  expect(explorar.length).toBeGreaterThan(10);
  expect(Math.min(...explorar)).toBeGreaterThanOrEqual(44);
});

test('entre 768 y 960 px ningún enlace del menú se parte y se usa la barra inferior', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await ingresarComo(page);
  await expect(page.locator('.barra-movil')).toBeVisible();
  await page.setViewportSize({ width: 960, height: 800 });
  const alturas = await page.locator('.nav-principal a').evaluateAll((els) => els.map((e) => e.scrollHeight));
  expect(Math.max(...alturas)).toBeLessThan(80);
});

test('el foco del teclado no queda oculto bajo las barras fijas', async ({ page }) => {
  await ir(page, '/explorar');
  const margen = await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingBottom);
  expect(parseInt(margen, 10)).toBeGreaterThan(0);
});

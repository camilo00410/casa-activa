/** Accesibilidad, ausencia de texto basura y carga sin terceros, en todas las pantallas. */
import { test, expect, ir, ingresarComo, auditarAccesibilidad, ADMIN } from './ayudas.js';

const PUBLICAS = ['/', '/explorar', '/explorar?q=xyzzy', '/recomendacion/sin-pantallas', '/ingreso', '/registro', '/privacidad', '/no-existe'];
const PRIVADAS = ['/para-ti', '/favoritos', '/habitos', '/mi-perfil', '/mi-perfil?tab=salud', '/mi-perfil?tab=privacidad', '/perfil-salud', '/recomendacion/cardio-intenso'];
const ADMINISTRACION = ['/admin', '/admin/nueva', '/admin/editar/conecta'];

async function revisarPantalla(page, ruta) {
  await ir(page, ruta);
  await expect(page.locator('main > *').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  const texto = await page.locator('body').innerText();
  expect(texto, `texto basura en ${ruta}`).not.toMatch(/\bfalse\b|\bundefined\b|\[object |\bNaN\b/);
  expect(await page.locator('main h1').count(), `un solo h1 en ${ruta}`).toBe(1);
  await auditarAccesibilidad(page);
}

for (const ruta of PUBLICAS) {
  test(`pantalla pública ${ruta}`, async ({ page }) => { await revisarPantalla(page, ruta); });
}
for (const ruta of PRIVADAS) {
  test(`pantalla privada ${ruta}`, async ({ page }) => { await ingresarComo(page); await revisarPantalla(page, ruta); });
}
for (const ruta of ADMINISTRACION) {
  test(`pantalla de administración ${ruta}`, async ({ page }) => { await ingresarComo(page, ADMIN); await revisarPantalla(page, ruta); });
}

test('estados con errores de formulario también son accesibles', async ({ page }) => {
  await ir(page, '/registro');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.locator('.campo-invalido').first()).toBeVisible();
  await auditarAccesibilidad(page);
});

test('los diálogos son accesibles y devuelven el control con Escape', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/habitos');
  await page.getByRole('button', { name: 'Nuevo hábito' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await auditarAccesibilidad(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('solo con teclado: el enlace para saltar lleva al contenido', async ({ page }) => {
  await ir(page, '/explorar');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('solo con teclado: marcar un hábito conserva el foco', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/habitos');
  const boton = page.getByRole('button', { name: /Marcar «Caminar 30 minutos» como hecho hoy/ });
  await boton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Desmarcar «Caminar 30 minutos»/ })).toBeFocused();
});

test('el gráfico tiene una alternativa en tabla y muestra su detalle al enfocarlo', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/habitos');
  await page.locator('.grafico-zona').last().focus();
  await expect(page.locator('.grafico-globo')).toBeVisible();
  await page.getByText('Ver como tabla').click();
  await expect(page.locator('.grafico-tabla tbody tr')).toHaveCount(8);
});

test('cada pantalla tiene un título propio', async ({ page }) => {
  await ir(page, '/explorar');
  await expect(page).toHaveTitle('Explorar | Casa Activa');
  await ir(page, '/recomendacion/conecta');
  await expect(page).toHaveTitle('Conecta con otras personas | Casa Activa');
});

test('privacidad y rendimiento: ninguna petición sale a terceros', async ({ page }) => {
  const externas = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4173') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) externas.push(r.url()); });
  await ir(page, '/');
  await page.waitForLoadState('networkidle');
  await ingresarComo(page);
  await page.waitForLoadState('networkidle');
  expect(externas).toEqual([]);
});

test('la CSP está activa en el navegador y bloquea scripts inyectados', async ({ page }) => {
  await ir(page, '/');
  const ejecutado = await page.evaluate(() => new Promise((resolve) => {
    const s = document.createElement('script');
    s.textContent = 'window.inyectado = true';
    document.addEventListener('securitypolicyviolation', () => resolve(false), { once: true });
    document.head.append(s);
    setTimeout(() => resolve(Boolean(window.inyectado)), 300);
  }));
  expect(ejecutado).toBe(false);
});

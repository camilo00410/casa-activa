import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const DEMO = { correo: 'demo@casaactiva.co', password: 'Demo2026*' };
export const ADMIN = { correo: 'admin@casaactiva.co', password: 'Admin2026*' };

/** Falla si hay errores de consola o texto basura en pantalla, en todas las pruebas. */
export const test = base.extend({
  page: async ({ page }, use, info) => {
    const problemas = [];
    page.on('pageerror', (e) => problemas.push(`Excepción: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problemas.push(`Consola: ${m.text()}`); });
    await use(page);
    // En la prueba de CSP, el aviso de bloqueo es justamente el resultado esperado.
    const esperado = (p) => (info.title.includes('CSP') && p.includes('Content Security Policy'))
      // Firefox informa como error una descarga que la propia recarga de la prueba canceló (NS_BINDING_ABORTED).
      || p.includes('status=2152398850');
    expect(problemas.filter((p) => !esperado(p)), 'no debe haber errores en el navegador').toEqual([]);
  },
});
export { expect };

export const ir = (page, ruta) => page.goto(`/index.html#${ruta}`);

export async function ingresarComo(page, cuenta = DEMO) {
  await ir(page, '/ingreso');
  await page.getByLabel('Correo electrónico').fill(cuenta.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(cuenta.password);
  await page.getByRole('button', { name: 'Ingresar a mi cuenta' }).click();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).not.toHaveText('INGRESA A TU CUENTA');
}

export async function registrar(page, { nombre = 'Ana Pérez', correo = `ana${Date.now()}@correo.com`, password = 'Segura2026' } = {}) {
  await ir(page, '/registro');
  await page.getByLabel('Nombre completo').fill(nombre);
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirma tu contraseña').fill(password);
  await page.getByLabel('Confirmo que soy mayor de 18 años.').check();
  await page.getByLabel(/Autorizo el tratamiento de mis datos personales/).check();
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page).toHaveURL(/perfil-salud/);
  return { correo, password };
}

/** Marca una opción cuyo input está superpuesto a su caja visual. */
export const elegir = (page, nombre) => page.locator('label.opcion', { hasText: nombre }).locator('input').check();

export async function completarPerfil(page, { objetivo, dieta = 'Omnívora', condiciones = [], restricciones = [], sueno = 8, estres = 'Bajo', actividad = 'Algo activo' }) {
  await page.getByLabel(/Autorizo de forma explícita/).check();
  await page.getByLabel('Edad').fill('30');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await elegir(page, objetivo);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await elegir(page, dieta);
  for (const r of restricciones) await elegir(page, r);
  for (const c of condiciones) await elegir(page, c);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await elegir(page, actividad);
  await page.getByLabel('¿Cuántas horas duermes por noche?').fill(String(sueno));
  await page.locator('fieldset', { hasText: 'nivel de estrés' }).locator('label.opcion', { hasText: new RegExp(`^${estres}$`) }).locator('input').check();
  await page.getByRole('button', { name: 'Guardar y ver mi plan' }).click();
  await expect(page).toHaveURL(/para-ti/);
}

export async function auditarAccesibilidad(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
}

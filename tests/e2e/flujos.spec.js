/** Flujos principales que exige la guía: buscar, consultar, guardar, registrarse e iniciar sesión. */
import { test, expect, ir, ingresarComo, registrar, completarPerfil, ADMIN, DEMO } from './ayudas.js';

const esMovil = (testInfo) => testInfo.project.name === 'movil';

test('el visitante ve la temática completa: las cuatro categorías', async ({ page }) => {
  await ir(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CUÍDATE');
  for (const c of ['Alimentación', 'Actividad física', 'Descanso', 'Bienestar']) {
    await expect(page.locator('.categoria', { hasText: c })).toBeVisible();
  }
});

test('RF3: buscar desde el inicio, ignorando tildes, y abrir el detalle con su fuente', async ({ page }) => {
  await ir(page, '/');
  await page.getByRole('searchbox', { name: 'Buscar recomendaciones' }).fill('cafeina');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/explorar\?q=cafeina/);
  await page.getByRole('link', { name: 'Evita la cafeína en la tarde y la noche' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Evita la cafeína en la tarde y la noche');
  await expect(page.getByRole('link', { name: /Centros para el Control/ })).toHaveAttribute('href', /cdc\.gov/);
});

test('RF3: los filtros se combinan, se reflejan en la URL y sobreviven a una recarga', async ({ page }, info) => {
  await ir(page, '/explorar');
  if (esMovil(info)) await page.getByText('Filtros', { exact: true }).click();
  await page.getByLabel(/^Actividad física/).check();
  await page.getByRole('button', { name: 'Hasta 20 min' }).click();
  await page.getByRole('checkbox', { name: 'Principiante' }).check();
  await expect(page).toHaveURL(/cat=actividad/);
  await expect(page).toHaveURL(/dur=20/);
  const total = page.getByRole('status').filter({ hasText: 'resultado' });
  const texto = await total.innerText();
  await page.reload();
  await expect(total).toHaveText(texto);
  await expect(page.locator('.tarjeta .chip-cat', { hasText: 'Alimentación' })).toHaveCount(0);
});

test('RF3: una búsqueda sin resultados orienta al usuario', async ({ page }) => {
  await ir(page, '/explorar?q=xyzzy');
  await expect(page.getByRole('heading', { name: 'No encontramos resultados' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todas las recomendaciones' }).click();
  await expect(page.locator('.tarjeta').first()).toBeVisible();
});

test('RF1: registro con errores claros y luego exitoso', async ({ page }) => {
  await ir(page, '/registro');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByText('Escribe tu nombre.')).toBeVisible();
  await expect(page.getByLabel('Nombre completo')).toBeFocused();
  await expect(page.getByText('Casa Activa es solo para personas mayores de 18 años.')).toBeVisible();
  await registrar(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sobre ti');
});

test('RF1: el perfil de salud se puede omitir y no bloquea el acceso', async ({ page }) => {
  await registrar(page);
  await page.getByRole('button', { name: 'Omitir por ahora' }).click();
  await expect(page).toHaveURL(/para-ti/);
  await expect(page.getByText('Completa tu perfil para personalizar tu plan')).toBeVisible();
  await expect(page.locator('main')).toContainText('Para empezar');
});

test('RF1: sin autorización explícita el asistente no avanza', async ({ page }) => {
  await registrar(page);
  await page.getByLabel('Edad').fill('30');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('necesitamos tu autorización explícita')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sobre ti');
});

test('RF4: dos perfiles distintos reciben planes distintos y ven el motivo', async ({ page, browser }) => {
  await registrar(page);
  await completarPerfil(page, { objetivo: 'Dormir mejor', sueno: 5 });
  await expect(page.locator('.razones').first()).toContainText('Duermes 5 horas');
  const primeraA = await page.locator('.tarjeta h3').first().innerText();

  const otro = await (await browser.newContext({ baseURL: 'http://localhost:4173' })).newPage();
  await registrar(otro);
  await completarPerfil(otro, { objetivo: 'Comer mejor' });
  await expect(otro.locator('.razones').first()).toContainText('comer mejor');
  expect(await otro.locator('.tarjeta h3').first().innerText()).not.toBe(primeraA);
});

test('RF4: una persona vegana y con dolor de rodilla no recibe lo que no le conviene', async ({ page }) => {
  await registrar(page);
  await completarPerfil(page, { objetivo: 'Moverme más', dieta: 'Vegana', condiciones: ['Dolor de rodilla'], actividad: 'Muy activo' });
  const principal = page.getByRole('main');
  await expect(principal).toContainText('Tu plan de hoy');
  await expect(principal).not.toContainText('Un lácteo y un huevo en tu día');
  await expect(principal).not.toContainText('Cardio intenso sin equipos');
  await ir(page, '/recomendacion/cardio-intenso');
  await expect(page.getByText('Esta recomendación no es adecuada para ti')).toBeVisible();
});

test('RF4: «No me interesa» retira la tarjeta y se puede deshacer', async ({ page }) => {
  await ingresarComo(page);
  const tarjetas = page.locator('.tarjeta');
  const titulo = await tarjetas.first().locator('h3').innerText();
  await page.getByRole('button', { name: `No me interesa: ${titulo}` }).click();
  await expect(page.getByRole('main')).not.toContainText(titulo);
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(tarjetas.first().locator('h3')).toHaveText(titulo);
});

test('RF5: favorito desde el detalle, persiste y se puede quitar', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/recomendacion/conecta');
  await page.getByRole('button', { name: /Guardar en favoritos: Conecta/ }).click();
  await expect(page.getByRole('button', { name: /Quitar de favoritos: Conecta/ })).toHaveAttribute('aria-pressed', 'true');
  await ir(page, '/favoritos');
  await page.reload();
  const tarjeta = page.locator('.tarjeta', { hasText: 'Conecta con otras personas' });
  await expect(tarjeta).toBeVisible();
  await tarjeta.getByRole('button', { name: /Quitar de favoritos/ }).click();
  await expect(tarjeta).toHaveCount(0);
});

test('RF5: al guardar sin sesión lleva a ingresar y regresa a la recomendación', async ({ page }) => {
  await ir(page, '/recomendacion/conecta');
  await page.getByRole('button', { name: /Guardar en favoritos: Conecta/ }).click();
  await expect(page).toHaveURL(/ingreso\?volver=/);
  await page.getByLabel('Correo electrónico').fill(DEMO.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(DEMO.password);
  await page.getByRole('button', { name: 'Ingresar a mi cuenta' }).click();
  await expect(page).toHaveURL(/recomendacion\/conecta/);
});

test('RF5: crear un hábito desde una recomendación, marcarlo hoy y ver su racha', async ({ page }) => {
  await registrar(page);
  await page.getByRole('button', { name: 'Omitir por ahora' }).click();
  await ir(page, '/recomendacion/sin-pantallas');
  await page.getByRole('button', { name: 'Crear hábito' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Crear hábito' }).click();
  await expect(page).toHaveURL(/habitos/);
  const marcar = page.getByRole('button', { name: /Marcar «30 minutos sin pantallas antes de dormir» como hecho hoy/ });
  await marcar.click();
  await expect(page.getByRole('button', { name: /Desmarcar «30 minutos/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.habito')).toContainText('1 día');
  await expect(page.locator('.indicador').first()).toContainText('1 de 1');
  await page.reload();
  await expect(page.locator('.indicador').first()).toContainText('1 de 1');
});

test('RF5: eliminar un hábito pide confirmación', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/habitos');
  await page.getByRole('button', { name: 'Eliminar hábito: Caminar 30 minutos' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.locator('.habito', { hasText: 'Caminar 30 minutos' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar hábito: Caminar 30 minutos' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.locator('.habito', { hasText: 'Caminar 30 minutos' })).toHaveCount(0);
});

test('RF2: el administrador publica y el contenido aparece para cualquiera', async ({ page }) => {
  await ingresarComo(page, ADMIN);
  await expect(page).toHaveURL(/admin/);
  await ir(page, '/admin/nueva');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('El título debe tener entre 5 y 90 caracteres.')).toBeVisible();
  await page.getByLabel('Título').fill('Estira la espalda al despertar');
  await page.getByLabel('Resumen').fill('Un estiramiento suave para empezar el día con menos rigidez.');
  await page.getByLabel('Beneficios').fill('Empieza el día con movimiento');
  await page.getByLabel('Pasos').fill('Siéntate en el borde de la cama\nEstira los brazos hacia arriba');
  await page.getByLabel('Categoría').selectOption('actividad');
  await page.locator('fieldset', { hasText: 'Objetivos que apoya' }).locator('label.opcion', { hasText: 'Moverme más' }).locator('input').check();
  await page.getByLabel('Nombre de la fuente').fill('Organización Mundial de la Salud');
  await page.getByLabel('Enlace de la fuente').fill('https://www.who.int/es');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByRole('row', { name: /Estira la espalda al despertar/ })).toContainText('Publicada');
  await ir(page, '/explorar?q=espalda%20despertar');
  await expect(page.getByRole('link', { name: 'Estira la espalda al despertar' })).toBeVisible();
});

test('RF2: un borrador no es visible para el público hasta publicarlo', async ({ page }) => {
  await ir(page, '/recomendacion/hidratacion-diaria');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  await ingresarComo(page, ADMIN);
  await page.getByRole('button', { name: 'Publicar: Toma suficiente líquido durante el día' }).click();
  await expect(page.getByRole('row', { name: /Toma suficiente líquido/ })).toContainText('Publicada');
});

test('RF2: retirar y eliminar piden lo correcto', async ({ page }) => {
  await ingresarComo(page, ADMIN);
  await page.getByRole('button', { name: 'Eliminar: Conecta con otras personas' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByRole('row', { name: /Conecta con otras personas/ })).toHaveCount(0);
});

test('RNF3: un título con código se muestra como texto y no se ejecuta', async ({ page }) => {
  const ataque = '<img src=x onerror=window.pwned=1>';
  await ingresarComo(page, ADMIN);
  await ir(page, '/admin/nueva');
  await page.getByLabel('Título').fill(ataque);
  await page.getByLabel('Resumen').fill('Un resumen con la longitud suficiente para validar.');
  await page.getByLabel('Beneficios').fill(ataque);
  await page.getByLabel('Pasos').fill(ataque);
  await page.getByLabel('Categoría').selectOption('bienestar');
  await page.locator('fieldset', { hasText: 'Objetivos que apoya' }).locator('label.opcion', { hasText: 'Comer mejor' }).locator('input').check();
  await page.getByLabel('Nombre de la fuente').fill('Fuente de prueba');
  await page.getByLabel('Enlace de la fuente').fill('https://www.who.int/es');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await page.getByRole('link', { name: ataque, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ataque);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
});

test('RNF3: la contraseña nunca queda legible en el navegador', async ({ page }) => {
  const { password } = await registrar(page);
  const almacenado = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(almacenado).not.toContain(password);
  expect(almacenado).toContain('PBKDF2-SHA256');
});

test('RNF3: las rutas privadas exigen sesión y las de administración exigen el rol', async ({ page }) => {
  await ir(page, '/habitos');
  await expect(page).toHaveURL(/ingreso\?volver=%2Fhabitos/);
  await ingresarComo(page);
  await ir(page, '/admin');
  await expect(page.getByRole('heading', { name: 'Acceso restringido' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('RNF3: tras varios intentos fallidos la cuenta se bloquea', async ({ page }) => {
  await ir(page, '/ingreso');
  await page.getByLabel('Correo electrónico').fill(DEMO.correo);
  const clave = page.getByLabel('Contraseña', { exact: true });
  const enviar = page.getByRole('button', { name: 'Ingresar a mi cuenta' });
  for (let i = 0; i < 5; i += 1) {
    await clave.fill('Incorrecta123');
    await enviar.click();
    await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos');
  }
  await clave.fill(DEMO.password);
  await enviar.click();
  await expect(page.getByRole('alert')).toContainText('bloqueada');
});

test('RNF3: exportar datos descarga un archivo sin la credencial', async ({ page }, info) => {
  test.skip(info.project.name === 'webkit' || esMovil(info), 'La descarga se verifica en un motor de escritorio.');
  await ingresarComo(page);
  await ir(page, '/mi-perfil?tab=privacidad');
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar mis datos' }).click()]);
  expect(descarga.suggestedFilename()).toBe('mis-datos-casa-activa.json');
  const flujo = await descarga.createReadStream();
  const partes = [];
  for await (const p of flujo) partes.push(p);
  const texto = Buffer.concat(partes).toString();
  expect(JSON.parse(texto).perfilDeSalud.objetivo).toBe('dormir-mejor');
  expect(texto).not.toContain('credencial');
});

test('RNF3: eliminar la cuenta exige la contraseña y borra el acceso', async ({ page }) => {
  const { correo, password } = await registrar(page);
  await page.getByRole('button', { name: 'Omitir por ahora' }).click();
  await ir(page, '/mi-perfil?tab=privacidad');
  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
  const dialogo = page.getByRole('dialog');
  await dialogo.getByLabel('Escribe tu contraseña para confirmar').fill('Incorrecta123');
  await dialogo.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(dialogo.getByText('La contraseña no es correcta.')).toBeVisible();
  await dialogo.getByLabel('Escribe tu contraseña para confirmar').fill(password);
  await dialogo.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CUÍDATE');
  await ir(page, '/ingreso');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar a mi cuenta' }).click();
  await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos');
});

test('la sesión persiste al recargar y se puede cerrar', async ({ page }, info) => {
  await ingresarComo(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Laura' })).toBeVisible();
  await ir(page, '/mi-perfil');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CUÍDATE');
});

test('una ruta inexistente muestra una salida clara', async ({ page }) => {
  await ir(page, '/pagina-que-no-existe');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  await page.getByRole('link', { name: 'Explorar recomendaciones' }).click();
  await expect(page).toHaveURL(/explorar/);
});

test('RF4: «También te puede servir» nunca sugiere lo que no le conviene a la persona', async ({ page }) => {
  await ingresarComo(page); // La cuenta de ejemplo tiene dolor de rodilla.
  await ir(page, '/recomendacion/caminata-diaria');
  await expect(page.getByRole('heading', { name: 'También te puede servir' })).toBeVisible();
  await expect(page.locator('.relacionadas')).not.toContainText('Cardio intenso sin equipos');
});

test('RF5: el corazón no se invierte al cambiar los filtros', async ({ page }, info) => {
  await ingresarComo(page);
  await ir(page, '/explorar');
  await page.getByRole('button', { name: 'Guardar en favoritos: Arma tu plato saludable' }).click();
  if (esMovil(info)) await page.getByText('Filtros', { exact: true }).click();
  await page.getByLabel(/^Alimentación/).check();
  await expect(page.getByRole('button', { name: 'Quitar de favoritos: Arma tu plato saludable' })).toHaveAttribute('aria-pressed', 'true');
});

test('RF3: el foco permanece en el filtro tras aplicarlo', async ({ page }, info) => {
  await ir(page, '/explorar');
  if (esMovil(info)) await page.getByText('Filtros', { exact: true }).click();
  const filtro = page.getByLabel(/^Descanso/);
  await filtro.focus();
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/cat=descanso/);
  await expect(filtro).toBeFocused();
});

test('navegación: Atrás no queda atrapado después de ingresar', async ({ page }) => {
  await ir(page, '/explorar');
  await ir(page, '/ingreso');
  await page.getByLabel('Correo electrónico').fill(DEMO.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(DEMO.password);
  await page.getByRole('button', { name: 'Ingresar a mi cuenta' }).click();
  await expect(page).toHaveURL(/para-ti/);
  await page.goBack();
  await expect(page).toHaveURL(/explorar/);
});

test('navegación: una URL malformada lleva a la página de no encontrada', async ({ page }) => {
  await ir(page, '/recomendacion/%');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
});

test('navegación: tras ingresar se conservan los filtros de origen', async ({ page }, info) => {
  await ir(page, '/explorar?cat=descanso');
  await page.locator('.tarjeta').first().getByRole('button', { name: /Guardar en favoritos/ }).click();
  await page.getByLabel('Correo electrónico').fill(DEMO.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(DEMO.password);
  await page.getByRole('button', { name: 'Ingresar a mi cuenta' }).click();
  await expect(page).toHaveURL(/explorar\?cat=descanso/);
});

test('saltar al contenido no cambia la URL de la pantalla', async ({ page }, info) => {
  test.skip(info.project.name === 'webkit', 'WebKit no enfoca enlaces con Tab por defecto.');
  await ir(page, '/explorar');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Explorar recomendaciones' })).toBeVisible();
});

test('administración: Enter en un borrador no lo publica', async ({ page }) => {
  await ingresarComo(page, ADMIN);
  await ir(page, '/admin/editar/hidratacion-diaria');
  await page.getByLabel('Título').press('Enter');
  await expect(page.getByRole('heading', { name: 'Administración de contenidos' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Toma suficiente líquido/ })).toContainText('Borrador');
});

test('administración: los borradores aparecen primero', async ({ page }) => {
  await ingresarComo(page, ADMIN);
  await expect(page.locator('tbody tr').first()).toContainText('Borrador');
});

test('administración: la cuenta del administrador no se puede eliminar', async ({ page }) => {
  await ingresarComo(page, ADMIN);
  await ir(page, '/mi-perfil?tab=privacidad');
  await expect(page.getByRole('button', { name: 'Eliminar mi cuenta' })).toBeDisabled();
});

test('RNF3: cerrar sesión en otra pestaña deja de mostrar los datos en esta', async ({ page, context }) => {
  await ingresarComo(page);
  await ir(page, '/mi-perfil?tab=salud');
  await expect(page.getByText('Dormir mejor')).toBeVisible();
  const otra = await context.newPage();
  await otra.goto('/index.html#/mi-perfil');
  await otra.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/ingreso/);
  await expect(page.getByText('Dormir mejor')).toHaveCount(0);
});

test('RNF3: una cuenta eliminada en otra pestaña no recupera sus datos', async ({ page, context }) => {
  const { password } = await registrar(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sobre ti');
  await page.getByLabel(/Autorizo de forma explícita/).check();
  await page.getByLabel('Edad').fill('30');
  const otra = await context.newPage();
  await otra.goto('/index.html#/mi-perfil?tab=privacidad');
  await otra.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
  await otra.getByLabel('Escribe tu contraseña para confirmar').fill(password);
  await otra.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page).toHaveURL(/ingreso/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('casaactiva.perfiles')))).not.toHaveProperty('undefined');
});

test('robustez: con el almacenamiento bloqueado la aplicación funciona y lo avisa', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Acceso denegado', 'SecurityError'); } });
  });
  await ir(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CUÍDATE');
  await expect(page.getByText('No pudimos usar el almacenamiento')).toBeVisible();
  await ingresarComo(page);
  await expect(page.getByRole('heading', { name: 'Hola, Laura' })).toBeVisible();
});

test('robustez: sin espacio para los datos iniciales la aplicación no queda en blanco', async ({ page }) => {
  await page.addInitScript(() => {
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function escribir(clave, valor) {
      if (clave.endsWith('contenidos')) throw new DOMException('Sin espacio', 'QuotaExceededError');
      return real.call(this, clave, valor);
    };
  });
  await ir(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CUÍDATE');
  await expect(page.locator('.categoria').first()).toContainText('8 recomendaciones');
});

test('varias pestañas: lo retirado en una desaparece del catálogo de la otra', async ({ page, context }) => {
  await ingresarComo(page, ADMIN);
  const otra = await context.newPage();
  await otra.goto('/index.html#/explorar?q=conecta');
  await expect(otra.getByRole('link', { name: 'Conecta con otras personas' })).toBeVisible();
  await page.getByRole('button', { name: 'Retirar: Conecta con otras personas' }).click();
  await expect(otra.getByRole('link', { name: 'Conecta con otras personas' })).toHaveCount(0);
});

test('varias pestañas: un hábito marcado en una se refleja en la otra', async ({ page, context }) => {
  await ingresarComo(page);
  await ir(page, '/habitos');
  const otra = await context.newPage();
  await otra.goto('/index.html#/habitos');
  await otra.getByRole('button', { name: /Marcar «Caminar 30 minutos»/ }).click();
  await expect(page.getByRole('button', { name: /Desmarcar «Caminar 30 minutos»/ })).toBeVisible();
});

test('RF5: una pantalla abierta desde ayer registra el hábito en la fecha de hoy', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T23:50:00-05:00') });
  await ingresarComo(page);
  await ir(page, '/habitos');
  const marcar = page.getByRole('button', { name: /Marcar «Caminar 30 minutos»/ });
  await expect(marcar).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-11-07T00:10:00-05:00'));
  await marcar.click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('casaactiva.registros'))['habito-caminar'])).toContain('2026-11-07');
});

test('los avisos no se acumulan hasta tapar la pantalla', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/recomendacion/conecta');
  const boton = page.locator('.detalle .btn-favorito');
  for (let i = 0; i < 6; i += 1) await boton.click();
  await expect(page.locator('#avisos .toast')).toHaveCount(3);
});

test('Atrás cierra un diálogo abierto', async ({ page }) => {
  await ingresarComo(page);
  await ir(page, '/favoritos');
  await ir(page, '/habitos');
  await page.getByRole('button', { name: 'Nuevo hábito' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('RF1: el encabezado del perfil muestra el correo actualizado', async ({ page }) => {
  await registrar(page);
  await page.getByRole('button', { name: 'Omitir por ahora' }).click();
  await ir(page, '/mi-perfil');
  await page.getByLabel('Correo electrónico').fill('nuevo@correo.com');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.encabezado-pagina')).toContainText('nuevo@correo.com');
});

test('RF1: un nombre que empieza con emoji no rompe las iniciales', async ({ page }) => {
  await registrar(page, { nombre: '😀 Ana' });
  await expect(page.locator('.avatar')).toHaveText('😀A');
});

test('escribir y salir de Explorar de inmediato no devuelve la URL anterior', async ({ page }) => {
  await ir(page, '/explorar');
  await page.getByRole('searchbox', { name: 'Buscar recomendaciones' }).pressSequentially('su');
  await page.getByRole('link', { name: /CasaActiva/ }).first().click();
  await page.waitForTimeout(350);
  await expect(page).not.toHaveURL(/explorar/);
});

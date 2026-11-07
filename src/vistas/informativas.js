/** Política de datos y pantallas de estado: no encontrada, sin permiso y error. */
import { h } from '../nucleo/dom.js';
import { estadoVacio, pagina } from '../ui/componentes.js';
import { botonEnlace, boton } from '../ui/formularios.js';
import { VERSION_POLITICA } from '../dominio/catalogo.js';

export async function vistaPrivacidad() {
  const seccion = (titulo, ...parrafos) => h('section', {}, h('h2', {}, titulo), parrafos);
  return pagina(h('article', { class: 'lectura' },
    h('h1', {}, 'Política de tratamiento de datos'),
    h('p', { class: 'ayuda' }, `Versión ${VERSION_POLITICA}. Prototipo académico: esta política ilustra cómo funcionaría el tratamiento de datos en un servicio real.`),
    seccion('Qué datos usamos', h('p', {}, 'Datos de cuenta (nombre y correo) y, solo si lo autorizas, datos de salud: edad, peso, talla, objetivo, nivel de actividad, alimentación, restricciones, condiciones, horas de sueño y nivel de estrés.')),
    seccion('Para qué los usamos', h('p', {}, 'Para darte acceso a tu cuenta y personalizar tus recomendaciones. No los compartimos con terceros ni los usamos con fines publicitarios.')),
    seccion('Datos sensibles', h('p', {}, 'Los datos relativos a la salud son datos sensibles según el artículo 5 de la Ley 1581 de 2012. No estás obligado a autorizar su tratamiento y ninguna función básica depende de que los entregues.')),
    seccion('Dónde se guardan', h('p', {}, 'En este prototipo toda la información permanece en el almacenamiento de tu navegador. No se envía a ningún servidor. Tu contraseña no se guarda: se almacena solo una derivación criptográfica.')),
    seccion('Tus derechos', h('p', {}, 'Conforme al artículo 8 de la Ley 1581 de 2012 puedes conocer, actualizar y rectificar tus datos, consultar la autorización otorgada, revocarla y solicitar su supresión. Todo eso lo puedes hacer directamente desde Mi perfil, en la sección Privacidad y datos.')),
    seccion('Menores de edad', h('p', {}, 'Casa Activa está dirigida solo a personas mayores de 18 años.')),
    seccion('Aviso de salud', h('p', {}, 'El contenido es educativo y general. No reemplaza la valoración de un profesional de la salud.'))));
}

export async function vistaNoEncontrada(app) {
  app.titulo('Página no encontrada');
  return pagina(estadoVacio({ nivel: 'h1', titulo: 'No encontramos esta página', texto: 'Puede que el enlace haya cambiado o que el contenido ya no esté disponible.', accion: botonEnlace({ texto: 'Explorar recomendaciones', ruta: '/explorar' }) }));
}

export async function vistaSinPermiso(app) {
  app.titulo('Acceso restringido');
  return pagina(estadoVacio({ nivel: 'h1', ico: 'lock', titulo: 'Acceso restringido', texto: 'Esta sección es exclusiva para el equipo de administración.', accion: botonEnlace({ texto: 'Volver a mi plan', ruta: '/para-ti' }) }));
}

export function vistaError(reintentar) {
  return pagina(estadoVacio({ nivel: 'h1', ico: 'triangle-alert', titulo: 'Algo salió mal', texto: 'No pudimos mostrar esta pantalla. Tus datos están a salvo.', accion: boton({ texto: 'Intentar de nuevo', ico: 'rotate-ccw', alHacer: reintentar }) }));
}

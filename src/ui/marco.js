/** Partes fijas de la aplicación: cabecera, pie y barra inferior para móvil. */
import { h, icono } from '../nucleo/dom.js';

const enlaceNav = (app, ruta, texto, extra = {}) => h('a', { href: `#${ruta}`, 'aria-current': app.ruta?.ruta === ruta ? 'page' : undefined, ...extra }, texto);

export const logo = () => h('a', { href: '#/', class: 'logo', 'aria-label': 'CasaActiva, ir al inicio' },
  h('span', { class: 'logo-icono' }, icono('zap')),
  h('span', { class: 'logo-texto' }, 'CASA', h('span', {}, 'ACTIVA')));

const iniciales = (nombre) => nombre.trim().split(/\s+/).slice(0, 2).map((p) => [...p][0]?.toUpperCase() ?? '').join('');

export function cabecera(app) {
  const { usuario } = app;
  const salir = async () => {
    await app.auth.salir();
    app.usuario = null;
    app.toast('Cerraste sesión.');
    app.ir('/');
  };
  return h('header', { class: 'navbar' },
    logo(),
    h('nav', { class: 'nav-principal', 'aria-label': 'Principal' },
      usuario
        ? [enlaceNav(app, '/para-ti', 'Para ti'), enlaceNav(app, '/explorar', 'Explorar'), enlaceNav(app, '/favoritos', 'Favoritos'), enlaceNav(app, '/habitos', 'Hábitos'),
          usuario.rol === 'admin' && enlaceNav(app, '/admin', 'Administrar')]
        : [enlaceNav(app, '/', 'Inicio'), enlaceNav(app, '/explorar', 'Explorar')]),
    h('div', { class: 'nav-cuenta' },
      usuario
        ? [
          h('a', { href: '#/mi-perfil', class: 'avatar-enlace', 'aria-current': app.ruta?.ruta === '/mi-perfil' ? 'page' : undefined },
            h('span', { class: 'avatar', 'aria-hidden': 'true' }, iniciales(usuario.nombre)), h('span', { class: 'avatar-nombre' }, 'Mi perfil')),
          h('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Cerrar sesión', title: 'Cerrar sesión', onClick: salir }, icono('log-out')),
        ]
        : [
          h('a', { href: '#/ingreso', class: 'btn-ingresar' }, 'Ingresar'),
          h('a', { href: '#/registro', class: 'btn-registro' }, 'Registrarme'),
        ]));
}

export function barraMovil(app) {
  const destinos = app.usuario
    ? [['/para-ti', 'Para ti', 'sparkles'], ['/explorar', 'Explorar', 'search'], ['/favoritos', 'Favoritos', 'heart'], ['/habitos', 'Hábitos', 'list-checks'], ['/mi-perfil', 'Perfil', 'user']]
    : [['/', 'Inicio', 'house'], ['/explorar', 'Explorar', 'search'], ['/ingreso', 'Ingresar', 'log-in'], ['/registro', 'Registro', 'user-plus']];
  return h('nav', { class: 'barra-movil', 'aria-label': 'Navegación móvil' },
    destinos.map(([ruta, texto, ico]) => h('a', { href: `#${ruta}`, 'aria-current': app.ruta?.ruta === ruta ? 'page' : undefined }, icono(ico), h('span', {}, texto))));
}

export function pie(app) {
  return h('footer', { class: 'footer sobre-oscuro' },
    h('div', { class: 'footer-contenido' },
      h('div', {},
        h('p', { class: 'footer-marca' }, 'CASA', h('span', {}, 'ACTIVA')),
        h('p', {}, 'Cuídate. Siéntete bien. Recomendaciones saludables desde casa.')),
      h('nav', { 'aria-label': 'Pie de página', class: 'footer-enlaces' },
        h('a', { href: '#/explorar' }, 'Explorar'),
        h('a', { href: '#/privacidad' }, 'Tratamiento de datos'),
        h('button', { type: 'button', class: 'enlace-boton', onClick: () => app.reiniciarDemo() }, 'Restablecer datos de demostración'))),
    h('p', { class: 'footer-legal' }, 'Prototipo académico · Ingeniería Web · CUN, 2026. Fotografías: Unsplash. Iconos: Lucide.'));
}

/**
 * Raíz de composición: conecta las capas y arranca la aplicación.
 * Es el único archivo que conoce las implementaciones concretas; reemplazar localStorage
 * por una API significa cambiar aquí un adaptador, sin tocar las vistas.
 */
import { ErrorAlmacen, PREFIJO, crearAlmacenMemoria, crearAlmacenNavegador } from './datos/almacen.js';
import { crearRepositorios } from './datos/repositorios.js';
import { prepararDatos, reiniciarDatos } from './datos/semilla.js';
import { construirHash, encontrarRuta, interpretarHash } from './nucleo/enrutador.js';
import { rellenar } from './nucleo/dom.js';
import { crearServicioAutenticacion } from './servicios/autenticacion.js';
import { crearServicioCatalogo } from './servicios/catalogo.js';
import { ErrorSesion, crearServicioPersonal } from './servicios/personal.js';
import { barraMovil, cabecera, pie } from './ui/marco.js';
import { confirmar, toast } from './ui/retro.js';
import { vistaIngreso, vistaRegistro } from './vistas/acceso.js';
import { vistaAdmin, vistaAdminFormulario } from './vistas/admin.js';
import { vistaAsistente } from './vistas/asistente.js';
import { vistaDetalle } from './vistas/detalle.js';
import { vistaExplorar } from './vistas/explorar.js';
import { vistaFavoritos } from './vistas/favoritos.js';
import { vistaHabitos } from './vistas/habitos.js';
import { vistaError, vistaNoEncontrada, vistaPrivacidad, vistaSinPermiso } from './vistas/informativas.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaMiPerfil } from './vistas/mi-perfil.js';
import { vistaParaTi } from './vistas/para-ti.js';

const RUTAS = [
  { patron: '/', vista: vistaInicio, titulo: 'Recomendaciones saludables desde casa', redirigeConSesion: '/para-ti' },
  { patron: '/explorar', vista: vistaExplorar, titulo: 'Explorar' },
  { patron: '/recomendacion/:id', vista: vistaDetalle, titulo: 'Recomendación' },
  { patron: '/ingreso', vista: vistaIngreso, titulo: 'Ingresar', redirigeConSesion: '/para-ti' },
  { patron: '/registro', vista: vistaRegistro, titulo: 'Crear cuenta', redirigeConSesion: '/para-ti' },
  { patron: '/privacidad', vista: vistaPrivacidad, titulo: 'Tratamiento de datos' },
  { patron: '/perfil-salud', vista: vistaAsistente, titulo: 'Perfil de salud', requiere: 'sesion' },
  { patron: '/para-ti', vista: vistaParaTi, titulo: 'Para ti', requiere: 'sesion' },
  { patron: '/favoritos', vista: vistaFavoritos, titulo: 'Favoritos', requiere: 'sesion' },
  { patron: '/habitos', vista: vistaHabitos, titulo: 'Hábitos', requiere: 'sesion' },
  { patron: '/mi-perfil', vista: vistaMiPerfil, titulo: 'Mi perfil', requiere: 'sesion' },
  { patron: '/admin', vista: vistaAdmin, titulo: 'Administración', requiere: 'admin' },
  { patron: '/admin/nueva', vista: vistaAdminFormulario, titulo: 'Nueva recomendación', requiere: 'admin' },
  { patron: '/admin/editar/:id', vista: vistaAdminFormulario, titulo: 'Editar recomendación', requiere: 'admin' },
];

function iniciarAlmacen() {
  const navegador = crearAlmacenNavegador();
  try {
    prepararDatos(navegador);
    return navegador;
  } catch {
    // No caben los datos iniciales: la aplicación sigue funcionando en memoria.
    const temporal = crearAlmacenMemoria();
    prepararDatos(temporal);
    return temporal;
  }
}

const almacen = iniciarAlmacen();
const repositorios = crearRepositorios(almacen);
const catalogo = crearServicioCatalogo(repositorios);

const app = {
  auth: crearServicioAutenticacion(repositorios),
  catalogo,
  personal: crearServicioPersonal(repositorios, catalogo),
  usuario: null,
  ruta: { ruta: '/', consulta: {}, parametros: {} },
  toast,
  confirmar,
  /** Con reemplazar, la entrada actual sale del historial: así Atrás no queda atrapado en una redirección. */
  ir(ruta, consulta = {}, { reemplazar = false } = {}) {
    const hash = construirHash(ruta, consulta);
    if (location.hash === hash) render();
    else if (reemplazar) location.replace(hash);
    else location.hash = hash;
  },
  titulo(texto) { document.title = `${texto} | Casa Activa`; },
  recargar() { render({ mantenerPosicion: true }); },
  async reiniciarDemo() {
    const seguro = await confirmar({ titulo: 'Restablecer demostración', texto: 'Se borrarán las cuentas y los cambios hechos en este navegador, y se restaurarán los datos iniciales.', accion: 'Restablecer', peligro: true });
    if (!seguro) return;
    reiniciarDatos(almacen);
    app.usuario = null;
    location.hash = '#/';
    location.reload();
  },
};

const zonas = {
  cabecera: document.getElementById('app-cabecera'),
  principal: document.getElementById('contenido'),
  pie: document.getElementById('app-pie'),
  movil: document.getElementById('app-movil'),
  anuncios: document.getElementById('anuncios'),
};

function pintarMarco() {
  rellenar(zonas.cabecera, cabecera(app));
  rellenar(zonas.pie, pie(app));
  rellenar(zonas.movil, barraMovil(app));
}

let renderActual = 0;
let primeraCarga = true;

async function render({ mantenerPosicion = false } = {}) {
  const turno = ++renderActual;
  const { ruta, consulta } = interpretarHash(location.hash);
  let contenido;
  try {
    const coincidencia = encontrarRuta(RUTAS, ruta);
    const definicion = coincidencia?.definicion;
    app.usuario = await app.auth.usuarioActual();
    app.ruta = { ruta, consulta, parametros: coincidencia?.parametros ?? {} };

    if (definicion?.redirigeConSesion && app.usuario) { app.ir(definicion.redirigeConSesion, {}, { reemplazar: true }); return; }
    if (definicion?.requiere && !app.usuario) {
      toast('Ingresa para continuar.');
      app.ir('/ingreso', { volver: location.hash.slice(1) }, { reemplazar: true });
      return;
    }

    let vista = definicion?.vista ?? vistaNoEncontrada;
    if (definicion?.requiere === 'admin' && app.usuario.rol !== 'admin') vista = vistaSinPermiso;
    if (definicion) app.titulo(definicion.titulo);
    contenido = await vista(app);
  } catch (error) {
    console.error(error);
    contenido = vistaError(() => render());
  }
  if (turno !== renderActual) return; // Una navegación más reciente ya tomó el control.

  rellenar(zonas.principal, contenido);
  pintarMarco();
  // Al navegar se anuncia la pantalla nueva. En la primera carga el foco no se toca,
  // para que quien usa teclado llegue primero al enlace «Saltar al contenido».
  if (!mantenerPosicion && !primeraCarga) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!zonas.principal.contains(document.activeElement)) zonas.principal.focus({ preventScroll: true });
    zonas.anuncios.textContent = document.title;
  }
  primeraCarga = false;
}

window.addEventListener('hashchange', () => {
  if (location.hash !== '' && !location.hash.startsWith('#/')) return;
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  render();
});

// El enlace de salto solo mueve el foco: no debe cambiar la URL de la pantalla actual.
document.querySelector('.saltar').addEventListener('click', (e) => {
  e.preventDefault();
  zonas.principal.focus();
});

/**
 * Otra pestaña cambió los datos. Un cambio de sesión siempre se aplica: es lo que evita
 * que una pestaña siga mostrando datos de salud tras cerrar sesión en otra. Los demás
 * cambios esperan si la persona está escribiendo, para no borrar lo que lleva hecho.
 */
window.addEventListener('storage', ({ key }) => {
  if (key !== null && !key.startsWith(PREFIJO)) return;
  const clave = key?.slice(PREFIJO.length);
  if (clave === 'contenidos' || key === null) catalogo.invalidar();
  const editando = document.querySelector('main form[novalidate], dialog[open]');
  if (clave === 'sesion' || clave === 'usuarios' || key === null || !editando) render({ mantenerPosicion: true });
});

// Fallos no controlados, como quedarse sin espacio: se informan sin bloquear la interfaz.
window.addEventListener('unhandledrejection', (evento) => {
  if (evento.reason instanceof ErrorSesion) {
    evento.preventDefault();
    toast('Tu sesión terminó. Ingresa de nuevo para continuar.', { tipo: 'error' });
    app.ir('/ingreso', { volver: location.hash.slice(1) }, { reemplazar: true });
    return;
  }
  console.error(evento.reason);
  toast(evento.reason instanceof ErrorAlmacen ? evento.reason.message : 'No pudimos completar la acción.', { tipo: 'error' });
});

if (almacen.temporal) toast('No pudimos usar el almacenamiento de tu navegador: los cambios se perderán al cerrar la página.', { tipo: 'error' });
render();

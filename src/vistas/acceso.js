/** W2 y W3. Ingreso y registro: pestañas reales sobre la composición dividida del MVP. */
import { h, icono } from '../nucleo/dom.js';
import { destinoSeguro } from '../nucleo/enrutador.js';
import { fortalezaPassword } from '../dominio/validacion.js';
import { CUENTAS_DEMO } from '../datos/semilla.js';
import { aviso, rutaImagen } from '../ui/componentes.js';
import { boton, campo, campoPassword, casilla, conEnvio, leerFormulario, limpiarErrores, mostrarErrores } from '../ui/formularios.js';

const NIVEL_FORTALEZA = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

function marco(activa, mensaje, formulario, consulta) {
  const cadena = consulta.volver ? `?volver=${encodeURIComponent(consulta.volver)}` : '';
  return h('section', { class: 'contenedor acceso' },
    h('div', { class: 'presentacion' },
      h('p', { class: 'etiqueta' }, icono('sparkles'), mensaje.etiqueta),
      h('p', { class: 'titulo-acceso' }, mensaje.titulo),
      h('p', { class: 'descripcion' }, mensaje.texto)),
    h('div', { class: 'panel-imagen' },
      h('img', { class: 'panel-foto', src: rutaImagen('acceso'), alt: '', width: 760, height: 900, fetchpriority: 'high' }),
      h('div', { class: 'formulario' },
        h('nav', { class: 'pestanas', 'aria-label': 'Ingreso o registro' },
          h('a', { href: `#/ingreso${cadena}`, class: `pestana ${activa === 'ingreso' ? 'activa' : ''}`, 'aria-current': activa === 'ingreso' ? 'page' : undefined }, 'Ingreso'),
          h('a', { href: `#/registro${cadena}`, class: `pestana ${activa === 'registro' ? 'activa' : ''}`, 'aria-current': activa === 'registro' ? 'page' : undefined }, 'Registro')),
        formulario)));
}

export async function vistaIngreso(app) {
  const { consulta } = app.ruta;
  const destino = destinoSeguro(consulta.volver);
  const zonaError = h('div', { 'aria-live': 'assertive' });

  const entrar = async (credenciales, form) => {
    limpiarErrores(form);
    zonaError.replaceChildren();
    const r = await conEnvio(form, () => app.auth.ingresar(credenciales));
    if (r.ok) {
      app.usuario = r.usuario;
      app.toast(`Hola, ${r.usuario.nombre.split(' ')[0]}.`, { tipo: 'exito' });
      app.ir(r.usuario.rol === 'admin' && !consulta.volver ? '/admin' : destino, {}, { reemplazar: true });
    } else if (r.errores) mostrarErrores(form, r.errores);
    else zonaError.replaceChildren(aviso({ tipo: 'error', texto: r.general }));
  };

  const form = h('form', { noValidate: true, onSubmit: (e) => { e.preventDefault(); entrar(leerFormulario(e.target), e.target); } },
    zonaError,
    campo({ nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', autocompletar: 'username', placeholder: 'nombre@correo.com', requerido: true }),
    campoPassword({ nombre: 'password', etiqueta: 'Contraseña', autocompletar: 'current-password' }),
    boton({ texto: 'Ingresar a mi cuenta', tipo: 'submit' }));

  const usarDemo = (cuenta) => {
    form.elements.correo.value = cuenta.correo;
    form.elements.password.value = cuenta.password;
    entrar(cuenta, form);
  };

  return marco('ingreso', { etiqueta: 'BIENVENIDO DE NUEVO', titulo: 'SIGUE CON TU PLAN', texto: 'Retoma tus recomendaciones, tus favoritos y tus hábitos donde los dejaste.' },
    h('div', { class: 'contenido-formulario' },
      h('small', {}, 'BIENVENIDO DE NUEVO'),
      h('h1', {}, 'INGRESA A TU CUENTA'),
      form,
      h('p', { class: 'separador' }, '¿No tienes una cuenta? ', h('a', { href: '#/registro' }, 'Regístrate aquí')),
      h('div', { class: 'demo' },
        h('p', {}, h('strong', {}, 'Cuentas de demostración'), ' para evaluar el prototipo:'),
        h('div', { class: 'demo-botones' },
          boton({ texto: 'Usuario de ejemplo', variante: 'secundario', alHacer: () => usarDemo(CUENTAS_DEMO.usuario) }),
          boton({ texto: 'Administrador', variante: 'secundario', alHacer: () => usarDemo(CUENTAS_DEMO.admin) })))),
    consulta);
}

export async function vistaRegistro(app) {
  const { consulta } = app.ruta;
  const barraFuerza = h('span', { class: 'fuerza-relleno' });
  const textoFuerza = h('span', { class: 'fuerza-texto' });
  const medir = (e) => {
    const nivel = fortalezaPassword(e.target.value);
    barraFuerza.style.width = `${nivel * 25}%`;
    barraFuerza.dataset.nivel = nivel;
    textoFuerza.textContent = nivel ? `Seguridad: ${NIVEL_FORTALEZA[nivel]}` : '';
  };

  const enviar = async (e) => {
    e.preventDefault();
    const formulario = e.target;
    const r = await conEnvio(formulario, () => app.auth.registrar(leerFormulario(formulario)));
    if (!r.ok) { mostrarErrores(formulario, r.errores); return; }
    app.usuario = r.usuario;
    app.toast('Tu cuenta está lista.', { tipo: 'exito' });
    app.ir('/perfil-salud', consulta.volver ? { volver: consulta.volver } : {}, { reemplazar: true });
  };

  const politica = h('a', { href: '#/privacidad', target: '_blank', rel: 'noopener' }, 'política de tratamiento de datos');

  return marco('registro', { etiqueta: 'ÚNETE A CASA ACTIVA', titulo: 'EMPIEZA HOY', texto: 'Crea tu cuenta para recibir recomendaciones adaptadas a ti. Tus datos de salud se piden después y son opcionales.' },
    h('div', { class: 'contenido-formulario' },
      h('small', {}, 'ÚNETE A CASA ACTIVA'),
      h('h1', {}, 'CREA TU CUENTA'),
      h('form', { noValidate: true, onSubmit: enviar },
        campo({ nombre: 'nombre', etiqueta: 'Nombre completo', autocompletar: 'name', requerido: true }),
        campo({ nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', autocompletar: 'email', placeholder: 'nombre@correo.com', requerido: true }),
        campoPassword({ nombre: 'password', etiqueta: 'Contraseña', ayuda: 'Mínimo 8 caracteres, con al menos una letra y un número.', autocompletar: 'new-password', alEscribir: medir }),
        h('div', { class: 'fuerza', 'aria-live': 'polite' }, h('span', { class: 'fuerza-barra' }, barraFuerza), textoFuerza),
        campoPassword({ nombre: 'confirmacion', etiqueta: 'Confirma tu contraseña', autocompletar: 'new-password' }),
        casilla({ nombre: 'mayorDeEdad', etiqueta: 'Confirmo que soy mayor de 18 años.' }),
        casilla({ nombre: 'autorizaDatos', etiqueta: h('span', {}, 'Autorizo el tratamiento de mis datos personales según la ', politica, '.') }),
        boton({ texto: 'Crear mi cuenta', tipo: 'submit' })),
      h('p', { class: 'separador' }, '¿Ya tienes una cuenta? ', h('a', { href: '#/ingreso' }, 'Inicia sesión'))),
    consulta);
}

/** W10. Cuenta, perfil de salud y privacidad: hace ejecutables los derechos del titular. */
import { h, icono } from '../nucleo/dom.js';
import { CONDICIONES, DIETAS, NIVELES_ACTIVIDAD, OBJETIVOS, RESTRICCIONES, nombreDe } from '../dominio/catalogo.js';
import { fechaLegible } from '../dominio/habitos.js';
import { calcularIMC, clasificarIMC } from '../dominio/salud.js';
import { aviso, encabezado, estadoVacio, pagina } from '../ui/componentes.js';
import { boton, botonEnlace, campo, campoPassword, conEnvio, leerFormulario, mostrarErrores } from '../ui/formularios.js';
import { abrirDialogo } from '../ui/retro.js';

const PESTANAS = [['cuenta', 'Cuenta'], ['salud', 'Perfil de salud'], ['privacidad', 'Privacidad y datos']];

function pestanaCuenta(app) {
  const guardarDatos = async (e) => {
    e.preventDefault();
    const form = e.target;
    const r = await conEnvio(form, () => app.auth.actualizarCuenta(app.usuario.id, leerFormulario(form)));
    if (!r.ok) { mostrarErrores(form, r.errores); return; }
    app.usuario = r.usuario;
    app.toast('Datos actualizados.', { tipo: 'exito' });
    app.recargar();
  };
  const cambiar = async (e) => {
    e.preventDefault();
    const form = e.target;
    const r = await conEnvio(form, () => app.auth.cambiarPassword(app.usuario.id, leerFormulario(form)));
    if (!r.ok) { mostrarErrores(form, r.errores); return; }
    form.reset();
    app.toast('Contraseña actualizada.', { tipo: 'exito' });
  };
  return h('div', { class: 'dos-columnas' },
    h('form', { class: 'bloque pila', noValidate: true, onSubmit: guardarDatos },
      h('h2', {}, 'Datos de la cuenta'),
      campo({ nombre: 'nombre', etiqueta: 'Nombre completo', valor: app.usuario.nombre, autocompletar: 'name' }),
      campo({ nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', valor: app.usuario.correo, autocompletar: 'email' }),
      boton({ texto: 'Guardar cambios', tipo: 'submit' })),
    h('form', { class: 'bloque pila', noValidate: true, onSubmit: cambiar },
      h('h2', {}, 'Cambiar contraseña'),
      campoPassword({ nombre: 'actual', etiqueta: 'Contraseña actual', autocompletar: 'current-password' }),
      campoPassword({ nombre: 'nueva', etiqueta: 'Contraseña nueva', ayuda: 'Mínimo 8 caracteres, con al menos una letra y un número.', autocompletar: 'new-password' }),
      campoPassword({ nombre: 'confirmacion', etiqueta: 'Confirma la contraseña nueva', autocompletar: 'new-password' }),
      boton({ texto: 'Actualizar contraseña', tipo: 'submit' })));
}

async function pestanaSalud(app) {
  const perfil = await app.personal.perfil(app.usuario.id);
  if (!perfil) {
    return estadoVacio({
      ico: 'target', titulo: 'Aún no tienes perfil de salud', texto: 'Es opcional. Con él podemos priorizar lo que más te sirve y ocultar lo que no te conviene.',
      accion: botonEnlace({ texto: 'Completar mi perfil', ruta: '/perfil-salud', ico: 'arrow-right' }),
    });
  }
  const ocultas = await app.personal.descartadas(app.usuario.id);
  const restaurar = async () => {
    await app.personal.restaurarDescartadas(app.usuario.id);
    app.toast('Tus recomendaciones ocultas volverán a aparecer.', { tipo: 'exito' });
    app.recargar();
  };
  const imc = calcularIMC(perfil.pesoKg, perfil.tallaCm);
  const lista = (ids, catalogo) => (ids.length ? ids.map((i) => nombreDe(catalogo, i)).join(', ') : 'Ninguna');
  const filas = [
    ['Objetivo', nombreDe(OBJETIVOS, perfil.objetivo)],
    ['Edad', `${perfil.edad} años`],
    ['IMC', imc ? `${imc} (${clasificarIMC(imc)})` : 'Sin datos de peso y talla'],
    ['Nivel de actividad', nombreDe(NIVELES_ACTIVIDAD, perfil.nivelActividad)],
    ['Alimentación', nombreDe(DIETAS, perfil.dieta)],
    ['Restricciones', lista(perfil.restricciones, RESTRICCIONES)],
    ['Condiciones', lista(perfil.condiciones, CONDICIONES)],
    ['Sueño', `${perfil.horasSueno} horas por noche`],
    ['Estrés', `${perfil.estres} de 5`],
    ['Tiempo disponible', `${perfil.minutosDisponibles} minutos al día`],
  ];
  return h('section', { class: 'bloque pila' },
    h('div', { class: 'fila-titulo' }, h('h2', {}, 'Tu perfil de salud'), botonEnlace({ texto: 'Editar', ruta: '/perfil-salud', variante: 'secundario', ico: 'pencil' })),
    h('dl', { class: 'datos' }, filas.map(([t, v]) => h('div', {}, h('dt', {}, t), h('dd', {}, v)))),
    imc && h('p', { class: 'ayuda' }, 'El IMC es orientativo y no se usa para elegir tus recomendaciones.'),
    ocultas.length > 0 && boton({ texto: `Restaurar ${ocultas.length === 1 ? '1 recomendación oculta' : `${ocultas.length} recomendaciones ocultas`}`, variante: 'secundario', ico: 'rotate-ccw', alHacer: restaurar }));
}

function descargar(datos) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
  const enlace = h('a', { href: url, download: 'mis-datos-casa-activa.json' });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

async function pestanaPrivacidad(app) {
  const { consentimientos = {} } = app.usuario;
  const borrarSalud = async () => {
    const seguro = await app.confirmar({ titulo: 'Borrar perfil de salud', texto: 'Se eliminarán tus datos de salud y se revocará tu autorización. Tus recomendaciones dejarán de estar personalizadas.', accion: 'Borrar perfil', peligro: true });
    if (!seguro) return;
    await app.personal.borrarPerfilSalud(app.usuario.id);
    app.usuario = await app.auth.usuarioActual();
    app.toast('Perfil de salud eliminado.');
    app.recargar();
  };
  const eliminarCuenta = () => abrirDialogo({
    titulo: 'Eliminar mi cuenta',
    contenido: (cerrar) => h('form', {
      class: 'pila', noValidate: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const correcta = await conEnvio(form, () => app.auth.confirmarPassword(app.usuario.id, form.elements.confirmar.value));
        if (!correcta) { mostrarErrores(form, { confirmar: 'La contraseña no es correcta.' }); return; }
        await app.personal.eliminarCuenta(app.usuario.id);
        await app.auth.salir();
        app.usuario = null;
        cerrar();
        app.toast('Tu cuenta y tus datos fueron eliminados.');
        app.ir('/');
      },
    },
    h('p', {}, 'Esta acción no se puede deshacer. Se borrarán tu cuenta, tu perfil, tus favoritos y tus hábitos.'),
    campoPassword({ nombre: 'confirmar', etiqueta: 'Escribe tu contraseña para confirmar', autocompletar: 'current-password' }),
    h('div', { class: 'dialogo-acciones' }, boton({ texto: 'Eliminar definitivamente', tipo: 'submit', variante: 'peligro' }))),
  });

  return h('div', { class: 'pila' },
    h('div', { class: 'dos-columnas' },
      h('section', { class: 'bloque pila' },
        h('h2', {}, 'Autorizaciones'),
        h('ul', { class: 'lista-marcas' },
          h('li', {}, icono('check'), consentimientos.datos ? `Datos de la cuenta: autorizada el ${fechaLegible(consentimientos.datos.fecha)} (política ${consentimientos.datos.version}).` : 'Datos de la cuenta: sin registro.'),
          h('li', {}, icono(consentimientos.salud ? 'check' : 'x'), consentimientos.salud ? `Datos de salud: autorizada el ${fechaLegible(consentimientos.salud.fecha)}.` : 'Datos de salud: sin autorización.')),
        h('a', { href: '#/privacidad' }, 'Leer la política de tratamiento de datos')),
      h('section', { class: 'bloque pila' },
        h('h2', {}, 'Descargar mis datos'),
        h('p', {}, 'Obtén una copia de toda tu información en un archivo JSON.'),
        boton({ texto: 'Exportar mis datos', variante: 'secundario', ico: 'download', alHacer: async () => { descargar(await app.personal.exportarDatos(app.usuario.id)); app.toast('Descarga iniciada.', { tipo: 'exito' }); } }))),
    h('section', { class: 'bloque bloque-peligro pila' },
      h('h2', {}, 'Acciones irreversibles'),
      h('div', { class: 'acciones' },
        boton({ texto: 'Borrar perfil de salud', variante: 'secundario', ico: 'trash-2', disabled: !consentimientos.salud, alHacer: borrarSalud }),
        boton({ texto: 'Eliminar mi cuenta', variante: 'peligro', ico: 'trash-2', disabled: app.usuario.rol === 'admin', alHacer: eliminarCuenta })),
      app.usuario.rol === 'admin' && h('p', { class: 'ayuda' }, 'La cuenta de administración no se puede eliminar: sin ella, nadie podría gestionar los contenidos.')));
}

export async function vistaMiPerfil(app) {
  const activa = PESTANAS.some(([id]) => id === app.ruta.consulta.tab) ? app.ruta.consulta.tab : 'cuenta';
  const contenido = { cuenta: () => pestanaCuenta(app), salud: () => pestanaSalud(app), privacidad: () => pestanaPrivacidad(app) }[activa];
  return pagina(
    encabezado({
      titulo: 'Mi perfil', texto: app.usuario.correo,
      acciones: app.usuario.rol === 'admin' && botonEnlace({ texto: 'Administrar contenidos', ruta: '/admin', variante: 'secundario', ico: 'settings' }),
    }),
    h('nav', { class: 'pestanas pestanas-pagina', 'aria-label': 'Secciones del perfil' }, PESTANAS.map(([id, texto]) => h('a', {
      href: `#/mi-perfil?tab=${id}`, class: `pestana ${id === activa ? 'activa' : ''}`, 'aria-current': id === activa ? 'page' : undefined,
    }, texto))),
    await contenido());
}

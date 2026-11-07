/**
 * Cuentas y sesión (RF1, RNF3).
 * Las contraseñas nunca se guardan: se almacena una derivación PBKDF2-SHA256 con sal
 * aleatoria por usuario y 600 000 iteraciones, la configuración que OWASP recomienda.
 * El número de iteraciones queda con cada credencial para poder elevarlo en el futuro.
 */
import { validarIngreso, validarNombre, validarCorreo, validarRegistro, erroresPassword } from '../dominio/validacion.js';
import { VERSION_POLITICA } from '../dominio/catalogo.js';
import { fechaLocal } from '../dominio/habitos.js';

export const ITERACIONES = 600_000;
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
export const MAX_FALLOS = 5;
export const BLOQUEO_MS = 5 * 60 * 1000;

const aBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const deBase64 = (texto) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));

async function derivar(password, sal, iteraciones) {
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones }, clave, 256);
}

export async function crearCredencial(password, iteraciones = ITERACIONES) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return { algoritmo: 'PBKDF2-SHA256', iteraciones, sal: aBase64(sal), hash: aBase64(await derivar(password, sal, iteraciones)) };
}

export async function verificarCredencial(password, credencial) {
  const calculado = aBase64(await derivar(password, deBase64(credencial.sal), credencial.iteraciones));
  return calculado === credencial.hash;
}

/** Quita la credencial de lo que se entrega a la interfaz. */
const publico = ({ credencial, ...usuario }) => usuario;

const CREDENCIAL_SENUELO = { sal: 'AAAAAAAAAAAAAAAAAAAAAA==', hash: '' };

export function crearServicioAutenticacion(repos, { ahora = Date.now, iteraciones = ITERACIONES } = {}) {
  const { usuarios, sesiones, intentos } = repos;

  async function iniciarSesion(usuarioId) {
    await sesiones.guardar({ usuarioId, expira: ahora() + DURACION_SESION_MS });
  }

  return {
    async registrar(datos) {
      const { valido, errores } = validarRegistro(datos);
      if (!valido) return { ok: false, errores };
      if (await usuarios.buscarPorCorreo(datos.correo)) {
        return { ok: false, errores: { correo: 'Ya existe una cuenta con este correo. Intenta ingresar.' } };
      }
      const hoy = fechaLocal();
      const usuario = await usuarios.crear({
        id: crypto.randomUUID(),
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim().toLowerCase(),
        rol: 'usuario',
        credencial: await crearCredencial(datos.password, iteraciones),
        creado: hoy,
        consentimientos: { datos: { fecha: hoy, version: VERSION_POLITICA } },
      });
      await iniciarSesion(usuario.id);
      return { ok: true, usuario: publico(usuario) };
    },

    async ingresar(datos) {
      const { valido, errores } = validarIngreso(datos);
      if (!valido) return { ok: false, errores };
      const correo = datos.correo.trim().toLowerCase();
      const estado = await intentos.obtener(correo);
      if (estado.bloqueadoHasta > ahora()) {
        const minutos = Math.ceil((estado.bloqueadoHasta - ahora()) / 60000);
        return { ok: false, general: `Cuenta bloqueada por varios intentos fallidos. Intenta de nuevo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.` };
      }
      const usuario = await usuarios.buscarPorCorreo(correo);
      // Se deriva igual aunque el correo no exista, para no revelar cuentas por el tiempo de respuesta.
      const correcta = await verificarCredencial(datos.password, usuario?.credencial ?? { ...CREDENCIAL_SENUELO, iteraciones });
      if (!usuario || !correcta) {
        const fallos = estado.fallos + 1;
        await intentos.guardar(correo, fallos >= MAX_FALLOS ? { fallos: 0, bloqueadoHasta: ahora() + BLOQUEO_MS } : { fallos, bloqueadoHasta: 0 });
        return { ok: false, general: 'Correo o contraseña incorrectos.' };
      }
      await intentos.limpiar(correo);
      await iniciarSesion(usuario.id);
      return { ok: true, usuario: publico(usuario) };
    },

    async salir() { await sesiones.cerrar(); },

    async usuarioActual() {
      const sesion = await sesiones.obtener();
      if (!sesion) return null;
      if (sesion.expira <= ahora()) { await sesiones.cerrar(); return null; }
      const usuario = await usuarios.buscarPorId(sesion.usuarioId);
      return usuario ? publico(usuario) : null;
    },

    async actualizarCuenta(usuarioId, { nombre, correo }) {
      const errores = {};
      const errorNombre = validarNombre(nombre);
      if (errorNombre) errores.nombre = errorNombre;
      if (!validarCorreo(correo)) errores.correo = 'Escribe un correo válido.';
      const existente = validarCorreo(correo) ? await usuarios.buscarPorCorreo(correo) : null;
      if (existente && existente.id !== usuarioId) errores.correo = 'Ese correo ya está en uso.';
      if (Object.keys(errores).length) return { ok: false, errores };
      return { ok: true, usuario: publico(await usuarios.actualizar(usuarioId, { nombre: nombre.trim(), correo: correo.trim().toLowerCase() })) };
    },

    async cambiarPassword(usuarioId, { actual, nueva, confirmacion }) {
      const usuario = await usuarios.buscarPorId(usuarioId);
      if (!usuario || !(await verificarCredencial(actual ?? '', usuario.credencial))) {
        return { ok: false, errores: { actual: 'La contraseña actual no es correcta.' } };
      }
      const error = erroresPassword(nueva, usuario.correo);
      if (error) return { ok: false, errores: { nueva: error } };
      if (nueva !== confirmacion) return { ok: false, errores: { confirmacion: 'Las contraseñas no coinciden.' } };
      await usuarios.actualizar(usuarioId, { credencial: await crearCredencial(nueva, iteraciones) });
      return { ok: true };
    },

    async confirmarPassword(usuarioId, password) {
      const usuario = await usuarios.buscarPorId(usuarioId);
      return Boolean(usuario) && verificarCredencial(password ?? '', usuario.credencial);
    },
  };
}

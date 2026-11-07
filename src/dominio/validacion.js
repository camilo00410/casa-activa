/**
 * Reglas de validación. Devuelven siempre { valido, errores }, donde errores es
 * un mapa campo → mensaje en español listo para mostrar junto al campo.
 */
import { CATEGORIAS, NIVELES, OBJETIVOS, DIETAS, NIVELES_ACTIVIDAD, RESTRICCIONES, CONDICIONES, MARCADORES_EXCLUSION } from './catalogo.js';

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_URL_SEGURA = /^https:\/\/[^\s]+\.[^\s]+$/i;
const CONTRASENAS_COMUNES = new Set(['12345678', '123456789', 'password', 'password1', 'contraseña', 'qwerty123', 'abc12345', 'casaactiva1']);

const resultado = (errores) => ({ valido: Object.keys(errores).length === 0, errores });
const esEntero = (x) => Number.isInteger(Number(x)) && String(x).trim() !== '';
const ids = (lista) => new Set(lista.map((x) => x.id));

export const validarCorreo = (correo = '') => RE_CORREO.test(correo.trim());

export function erroresPassword(password = '', correo = '') {
  if (password.length < 8) return 'Usa al menos 8 caracteres.';
  if (password.length > 128) return 'Usa como máximo 128 caracteres.';
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Incluye al menos una letra y un número.';
  if (CONTRASENAS_COMUNES.has(password.toLowerCase())) return 'Esa contraseña es muy común. Elige otra.';
  if (correo && password.toLowerCase() === correo.trim().toLowerCase()) return 'La contraseña no puede ser igual a tu correo.';
  return null;
}

/** Fortaleza de 0 a 4 para el indicador visual. */
export function fortalezaPassword(password = '') {
  if (!password) return 0;
  if (erroresPassword(password)) return 1;
  let puntos = 2;
  if (password.length >= 12) puntos += 1;
  if (/\p{Lu}/u.test(password) && /[^\p{L}\d]/u.test(password)) puntos += 1;
  return puntos;
}

export function validarNombre(nombre = '') {
  const limpio = nombre.trim();
  if (limpio.length < 2) return 'Escribe tu nombre.';
  if (limpio.length > 80) return 'Usa como máximo 80 caracteres.';
  if (/[<>]/.test(limpio)) return 'El nombre no puede contener los signos < o >.';
  return null;
}

export function validarRegistro(d) {
  const e = {};
  const nombre = validarNombre(d.nombre);
  if (nombre) e.nombre = nombre;
  if (!validarCorreo(d.correo)) e.correo = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  const password = erroresPassword(d.password, d.correo);
  if (password) e.password = password;
  if (d.password !== d.confirmacion) e.confirmacion = 'Las contraseñas no coinciden.';
  if (!d.mayorDeEdad) e.mayorDeEdad = 'Casa Activa es solo para personas mayores de 18 años.';
  if (!d.autorizaDatos) e.autorizaDatos = 'Necesitamos tu autorización para crear la cuenta.';
  return resultado(e);
}

export function validarIngreso(d) {
  const e = {};
  if (!validarCorreo(d.correo)) e.correo = 'Escribe un correo válido.';
  if (!d.password) e.password = 'Escribe tu contraseña.';
  return resultado(e);
}

export function validarPerfilSalud(p) {
  const e = {};
  if (!p.autorizaSalud) e.autorizaSalud = 'Para guardar tu perfil de salud necesitamos tu autorización explícita.';
  if (!esEntero(p.edad) || p.edad < 18 || p.edad > 100) e.edad = 'La edad debe estar entre 18 y 100 años.';
  if (p.pesoKg !== '' && p.pesoKg !== null && p.pesoKg !== undefined && !(Number(p.pesoKg) >= 30 && Number(p.pesoKg) <= 300)) e.pesoKg = 'El peso debe estar entre 30 y 300 kg.';
  if (p.tallaCm !== '' && p.tallaCm !== null && p.tallaCm !== undefined && !(Number(p.tallaCm) >= 120 && Number(p.tallaCm) <= 230)) e.tallaCm = 'La talla debe estar entre 120 y 230 cm.';
  if (!ids(OBJETIVOS).has(p.objetivo)) e.objetivo = 'Elige tu objetivo principal.';
  if (!ids(NIVELES_ACTIVIDAD).has(p.nivelActividad)) e.nivelActividad = 'Elige tu nivel de actividad.';
  if (!ids(DIETAS).has(p.dieta)) e.dieta = 'Elige tu tipo de alimentación.';
  if ((p.restricciones ?? []).some((r) => !ids(RESTRICCIONES).has(r))) e.restricciones = 'Hay una restricción que no reconocemos.';
  if ((p.condiciones ?? []).some((c) => !ids(CONDICIONES).has(c))) e.condiciones = 'Hay una condición que no reconocemos.';
  if (!(Number(p.horasSueno) >= 3 && Number(p.horasSueno) <= 12)) e.horasSueno = 'Las horas de sueño deben estar entre 3 y 12.';
  if (!(Number(p.estres) >= 1 && Number(p.estres) <= 5)) e.estres = 'Indica tu nivel de estrés de 1 a 5.';
  if (!(Number(p.minutosDisponibles) >= 5 && Number(p.minutosDisponibles) <= 120)) e.minutosDisponibles = 'Indica entre 5 y 120 minutos.';
  return resultado(e);
}

export function validarRecomendacion(r) {
  const e = {};
  if (!r.titulo || r.titulo.trim().length < 5 || r.titulo.trim().length > 90) e.titulo = 'El título debe tener entre 5 y 90 caracteres.';
  if (!r.resumen || r.resumen.trim().length < 20 || r.resumen.trim().length > 240) e.resumen = 'El resumen debe tener entre 20 y 240 caracteres.';
  if (!ids(CATEGORIAS).has(r.categoria)) e.categoria = 'Elige una categoría.';
  if (!ids(NIVELES).has(r.nivel)) e.nivel = 'Elige un nivel.';
  if (!esEntero(r.minutos) || r.minutos < 1 || r.minutos > 180) e.minutos = 'La duración debe estar entre 1 y 180 minutos.';
  if (!Array.isArray(r.objetivos) || r.objetivos.length === 0 || r.objetivos.some((o) => !ids(OBJETIVOS).has(o))) e.objetivos = 'Elige al menos un objetivo.';
  if (!Array.isArray(r.pasos) || r.pasos.length === 0) e.pasos = 'Escribe al menos un paso.';
  if (!Array.isArray(r.beneficios) || r.beneficios.length === 0) e.beneficios = 'Escribe al menos un beneficio.';
  if ((r.excluye ?? []).some((x) => !ids(MARCADORES_EXCLUSION).has(x))) e.excluye = 'Hay una exclusión que no reconocemos.';
  if (!r.fuente?.nombre || r.fuente.nombre.trim().length < 3) e.fuenteNombre = 'Toda recomendación debe citar su fuente.';
  if (!RE_URL_SEGURA.test(r.fuente?.url ?? '')) e.fuenteUrl = 'Escribe un enlace seguro que empiece por https://.';
  if (r.video && !RE_URL_SEGURA.test(r.video)) e.video = 'El video debe ser un enlace que empiece por https://.';
  return resultado(e);
}

export function validarHabito(h) {
  const e = {};
  if (!h.nombre || h.nombre.trim().length < 3 || h.nombre.trim().length > 60) e.nombre = 'El nombre debe tener entre 3 y 60 caracteres.';
  if (!ids(CATEGORIAS).has(h.categoria)) e.categoria = 'Elige una categoría.';
  if (!esEntero(h.metaSemanal) || h.metaSemanal < 1 || h.metaSemanal > 7) e.metaSemanal = 'La meta debe estar entre 1 y 7 días por semana.';
  return resultado(e);
}

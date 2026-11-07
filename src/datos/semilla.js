/**
 * Datos iniciales de demostración y control de versiones del esquema.
 * Las contraseñas de demostración se guardan como hash PBKDF2, igual que cualquier otra.
 */
import { CONTENIDOS_SEMILLA } from './contenidos-semilla.js';
import { VERSION_POLITICA } from '../dominio/catalogo.js';
import { fechaLocal, sumarDias } from '../dominio/habitos.js';

const CREDENCIALES = {"demo":{"algoritmo":"PBKDF2-SHA256","iteraciones":600000,"sal":"TZrwlbaJ4oT1Kva/DtwBfA==","hash":"5m76KcCGztoeZGhFE3ET/TIUiMrnxACftfJmdIe0wgk="},"admin":{"algoritmo":"PBKDF2-SHA256","iteraciones":600000,"sal":"dxLJpzD805CMDu4wo/YFDw==","hash":"0q99JKxHi2R7IkbflZEQDLTjad7pikVcqjThTipe6MU="}};

export const VERSION_ESQUEMA = 1;

export const CUENTAS_DEMO = {
  usuario: { correo: 'demo@casaactiva.co', password: 'Demo2026*' },
  admin: { correo: 'admin@casaactiva.co', password: 'Admin2026*' },
};

const ID_DEMO = 'usuario-demo';
const ID_ADMIN = 'usuario-admin';

/** Patrón fijo, no aleatorio: la demostración y las pruebas siempre se ven igual. */
function historial(hoy, semanas, patron) {
  const fechas = [];
  for (let i = 0; i < semanas * 7; i += 1) {
    if (patron[i % patron.length]) fechas.push(sumarDias(hoy, -(i + 1)));
  }
  return fechas;
}

function habitosDemo(hoy) {
  const inicio = sumarDias(hoy, -56);
  const base = { usuarioId: ID_DEMO, creado: inicio };
  return {
    habitos: [
      { ...base, id: 'habito-horario', nombre: 'Acostarme antes de las 11', categoria: 'descanso', metaSemanal: 5, origen: 'horario-de-sueno' },
      { ...base, id: 'habito-caminar', nombre: 'Caminar 30 minutos', categoria: 'actividad', metaSemanal: 4, origen: 'caminata-diaria' },
      { ...base, id: 'habito-frutas', nombre: 'Frutas y verduras en cada comida', categoria: 'alimentacion', metaSemanal: 6, origen: 'frutas-y-verduras' },
      { ...base, id: 'habito-pausa', nombre: 'Practicar una pausa de calma', categoria: 'bienestar', metaSemanal: 3, origen: 'anclate' },
    ],
    registros: {
      'habito-horario': historial(hoy, 8, [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0]),
      'habito-caminar': historial(hoy, 8, [1, 0, 1, 1, 0, 1, 0]),
      'habito-frutas': historial(hoy, 8, [1, 1, 1, 1, 1, 0, 1, 1, 1, 0]),
      'habito-pausa': historial(hoy, 6, [1, 0, 0, 1, 0, 1, 0]),
    },
  };
}

function crearDatosIniciales(hoy) {
  const { habitos, registros } = habitosDemo(hoy);
  const consentimiento = { fecha: sumarDias(hoy, -56), version: VERSION_POLITICA };
  return {
    usuarios: [
      { id: ID_DEMO, nombre: 'Laura Gómez', correo: CUENTAS_DEMO.usuario.correo, rol: 'usuario', credencial: CREDENCIALES.demo, creado: consentimiento.fecha, consentimientos: { datos: consentimiento, salud: consentimiento } },
      { id: ID_ADMIN, nombre: 'Administración', correo: CUENTAS_DEMO.admin.correo, rol: 'admin', credencial: CREDENCIALES.admin, creado: consentimiento.fecha, consentimientos: { datos: consentimiento } },
    ],
    perfiles: {
      [ID_DEMO]: { edad: 29, pesoKg: 64, tallaCm: 165, objetivo: 'dormir-mejor', nivelActividad: 'sedentario', dieta: 'vegetariana', restricciones: ['sin-lactosa'], condiciones: ['dolor-rodilla'], horasSueno: 6, estres: 4, minutosDisponibles: 20, actualizado: consentimiento.fecha },
    },
    contenidos: CONTENIDOS_SEMILLA,
    favoritos: { [ID_DEMO]: ['horario-de-sueno', 'pausa-activa', 'anclate'] },
    descartes: {},
    habitos,
    registros,
    intentos: {},
  };
}

/** Ejecuta en orden las migraciones pendientes y deja registrada la versión final. */
export function aplicarMigraciones(almacen, migraciones, versionObjetivo) {
  let version = almacen.leer('esquema') ?? 0;
  for (const m of migraciones) {
    if (m.version > version && m.version <= versionObjetivo) {
      m.aplicar(almacen);
      version = m.version;
      almacen.escribir('esquema', version);
    }
  }
  return version;
}

export function sembrar(almacen, hoy = fechaLocal()) {
  for (const [clave, valor] of Object.entries(crearDatosIniciales(hoy))) almacen.escribir(clave, valor);
}

export const MIGRACIONES = [{ version: 1, aplicar: (almacen) => sembrar(almacen) }];

export const prepararDatos = (almacen) => aplicarMigraciones(almacen, MIGRACIONES, VERSION_ESQUEMA);

/** Restablece la demostración borrando todo y volviendo a sembrar. */
export function reiniciarDatos(almacen) {
  for (const clave of almacen.claves()) almacen.eliminar(clave);
  return prepararDatos(almacen);
}

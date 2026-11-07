/** Utilidades compartidas por las pruebas: un sistema completo sobre memoria. */
import { crearAlmacenMemoria } from '../../src/datos/almacen.js';
import { crearRepositorios } from '../../src/datos/repositorios.js';
import { prepararDatos } from '../../src/datos/semilla.js';
import { crearServicioAutenticacion } from '../../src/servicios/autenticacion.js';
import { crearServicioCatalogo } from '../../src/servicios/catalogo.js';
import { crearServicioPersonal } from '../../src/servicios/personal.js';

export const ITERACIONES_PRUEBA = 1000; // La seguridad real se verifica aparte; aquí importa la velocidad.

export const REGISTRO_VALIDO = { nombre: 'Ana Pérez', correo: 'ana@correo.com', password: 'Segura2026', confirmacion: 'Segura2026', mayorDeEdad: true, autorizaDatos: true };
export const PERFIL_VALIDO = { autorizaSalud: true, edad: 30, pesoKg: 70, tallaCm: 170, objetivo: 'dormir-mejor', nivelActividad: 'moderado', dieta: 'omnivora', restricciones: [], condiciones: [], horasSueno: 8, estres: 2, minutosDisponibles: 20 };

export function crearSistema({ ahora = Date.now, hoy } = {}) {
  const almacen = crearAlmacenMemoria();
  prepararDatos(almacen);
  const repos = crearRepositorios(almacen);
  const auth = crearServicioAutenticacion(repos, { ahora, iteraciones: ITERACIONES_PRUEBA });
  const catalogo = crearServicioCatalogo(repos);
  const personal = crearServicioPersonal(repos, catalogo, { ahora, ...(hoy ? { hoy } : {}) });
  return { almacen, repos, auth, catalogo, personal };
}

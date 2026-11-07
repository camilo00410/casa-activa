/** Datos personales del usuario: perfil de salud, favoritos, hábitos y privacidad (RF1, RF4, RF5, RNF3). */
import { validarHabito, validarPerfilSalud } from '../dominio/validacion.js';
import { planDelDia, recomendar } from '../dominio/recomendador.js';
import { CATEGORIAS } from '../dominio/catalogo.js';
import { cumplimientoSemanal, fechaLocal, mejorRacha, progresoSemana, rachaActual, sumarDias, ultimosDias } from '../dominio/habitos.js';
import { VERSION_POLITICA } from '../dominio/catalogo.js';

const opcional = (x) => (x === '' || x === null || x === undefined ? null : Number(x));

/** La sesión terminó, por ejemplo al cerrar la cuenta en otra pestaña. */
export class ErrorSesion extends Error {}

export function crearServicioPersonal(repos, catalogo, { hoy = fechaLocal, ahora = Date.now } = {}) {
  const { perfiles, favoritos, descartes, habitos, usuarios, sesiones } = repos;

  /**
   * Toda escritura exige una sesión vigente de esa persona. Sin esto, una pestaña abierta
   * podría volver a crear datos de salud de una cuenta ya eliminada en otra pestaña.
   */
  async function exigirSesion(usuarioId) {
    const sesion = await sesiones.obtener();
    if (!sesion || sesion.usuarioId !== usuarioId || sesion.expira <= ahora()) throw new ErrorSesion('Tu sesión terminó.');
  }

  return {
    perfil: (usuarioId) => perfiles.obtener(usuarioId),

    async guardarPerfil(usuarioId, datos) {
      const { valido, errores } = validarPerfilSalud(datos);
      if (!valido) return { ok: false, errores };
      await exigirSesion(usuarioId);
      const { autorizaSalud, ...resto } = datos;
      const perfil = {
        ...resto,
        edad: Number(datos.edad),
        pesoKg: opcional(datos.pesoKg),
        tallaCm: opcional(datos.tallaCm),
        horasSueno: Number(datos.horasSueno),
        estres: Number(datos.estres),
        minutosDisponibles: Number(datos.minutosDisponibles),
        restricciones: datos.restricciones ?? [],
        condiciones: datos.condiciones ?? [],
        actualizado: hoy(),
      };
      await perfiles.guardar(usuarioId, perfil);
      const usuario = await usuarios.buscarPorId(usuarioId);
      if (!usuario.consentimientos?.salud) {
        await usuarios.actualizar(usuarioId, { consentimientos: { ...usuario.consentimientos, salud: { fecha: hoy(), version: VERSION_POLITICA } } });
      }
      return { ok: true, perfil };
    },

    favoritas: (usuarioId) => favoritos.listar(usuarioId),

    async recomendacionesFavoritas(usuarioId) {
      const ids = new Set(await favoritos.listar(usuarioId));
      return (await catalogo.publicadas()).filter((r) => ids.has(r.id));
    },

    /** @returns {Promise<boolean>} true si quedó en favoritos. */
    async alternarFavorito(usuarioId, recomendacionId) {
      await exigirSesion(usuarioId);
      const actuales = await favoritos.listar(usuarioId);
      if (actuales.includes(recomendacionId)) {
        await favoritos.quitar(usuarioId, recomendacionId);
        return false;
      }
      await favoritos.agregar(usuarioId, recomendacionId);
      return true;
    },

    async descartar(usuarioId, id) {
      await exigirSesion(usuarioId);
      await descartes.agregar(usuarioId, id);
    },
    async restaurar(usuarioId, id) {
      await exigirSesion(usuarioId);
      await descartes.quitar(usuarioId, id);
    },
    async restaurarDescartadas(usuarioId) {
      await exigirSesion(usuarioId);
      await descartes.eliminarDe(usuarioId);
    },
    descartadas: (usuarioId) => descartes.listar(usuarioId),

    async recomendaciones(usuarioId, opciones) {
      const [perfil, publicadas, favoritas, descartadas] = await Promise.all([
        perfiles.obtener(usuarioId), catalogo.publicadas(), this.recomendacionesFavoritas(usuarioId), descartes.listar(usuarioId),
      ]);
      const contexto = { favoritas, descartes: descartadas };
      const plan = planDelDia(perfil, publicadas, contexto, CATEGORIAS);
      const enPlan = new Set(plan.map((p) => p.rec.id));
      return { perfil, plan, lista: recomendar(perfil, publicadas.filter((r) => !enPlan.has(r.id)), contexto, opciones) };
    },

    async crearHabito(usuarioId, datos) {
      const { valido, errores } = validarHabito(datos);
      if (!valido) return { ok: false, errores };
      await exigirSesion(usuarioId);
      const habito = await habitos.crear({
        id: crypto.randomUUID(), usuarioId, nombre: datos.nombre.trim(), categoria: datos.categoria,
        metaSemanal: Number(datos.metaSemanal), origen: datos.origen ?? null, creado: hoy(),
      });
      return { ok: true, habito };
    },

    /** Marca o desmarca un día. Solo admite la semana reciente: el seguimiento no debe poder falsearse hacia el futuro. */
    async alternarDia(usuarioId, habitoId, fecha) {
      await exigirSesion(usuarioId);
      const habito = await habitos.obtener(habitoId);
      if (!habito || habito.usuarioId !== usuarioId) return null;
      const actual = hoy();
      if (fecha > actual || fecha < sumarDias(actual, -6)) return null;
      return habitos.alternarRegistro(habitoId, fecha);
    },

    async eliminarHabito(usuarioId, habitoId) {
      await exigirSesion(usuarioId);
      const habito = await habitos.obtener(habitoId);
      if (habito?.usuarioId === usuarioId) await habitos.eliminar(habitoId);
    },

    async resumenHabitos(usuarioId, semanas = 8) {
      const actual = hoy();
      const lista = await habitos.listar(usuarioId);
      const registros = Object.fromEntries(await Promise.all(lista.map(async (h) => [h.id, await habitos.registros(h.id)])));
      const filas = lista.map((h) => ({
        ...h,
        hechoHoy: registros[h.id].includes(actual),
        racha: rachaActual(registros[h.id], actual),
        mejorRacha: mejorRacha(registros[h.id]),
        semana: progresoSemana(registros[h.id], h.metaSemanal, actual),
        dias: ultimosDias(registros[h.id], actual),
      }));
      const historial = cumplimientoSemanal(lista, registros, actual, semanas);
      return {
        filas,
        historial,
        hoy: { hechos: filas.filter((f) => f.hechoHoy).length, total: filas.length },
        rachaMayor: Math.max(0, ...filas.map((f) => f.racha)),
        cumplimientoSemana: historial.at(-1)?.porcentaje ?? 0,
      };
    },

    /** Derecho de acceso: todo lo que el sistema guarda de la persona, sin su credencial. */
    async exportarDatos(usuarioId) {
      const { credencial, ...cuenta } = await usuarios.buscarPorId(usuarioId);
      const lista = await habitos.listar(usuarioId);
      return {
        exportado: new Date().toISOString(),
        cuenta,
        perfilDeSalud: await perfiles.obtener(usuarioId),
        favoritos: await favoritos.listar(usuarioId),
        descartados: await descartes.listar(usuarioId),
        habitos: await Promise.all(lista.map(async (h) => ({ ...h, registros: await habitos.registros(h.id) }))),
      };
    },

    /** Revoca la autorización de datos de salud y suprime el perfil. */
    async borrarPerfilSalud(usuarioId) {
      await exigirSesion(usuarioId);
      await perfiles.eliminar(usuarioId);
      const usuario = await usuarios.buscarPorId(usuarioId);
      const { salud, ...resto } = usuario.consentimientos ?? {};
      await usuarios.actualizar(usuarioId, { consentimientos: resto });
    },

    /** Derecho de supresión: elimina a la persona y todo lo asociado a ella. */
    async eliminarCuenta(usuarioId) {
      await exigirSesion(usuarioId);
      await Promise.all([perfiles.eliminar(usuarioId), favoritos.eliminarDe(usuarioId), descartes.eliminarDe(usuarioId), habitos.eliminarDe(usuarioId)]);
      await usuarios.eliminar(usuarioId);
    },
  };
}

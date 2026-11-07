/** Catálogo de recomendaciones y su administración (RF2, RF3). */
import { crearSlug, prepararIndice } from '../dominio/busqueda.js';
import { validarRecomendacion } from '../dominio/validacion.js';
import { fechaLocal } from '../dominio/habitos.js';

const limpiarLista = (lista) => lista.map((x) => x.trim()).filter(Boolean);
const IMAGEN_POR_CATEGORIA = { alimentacion: 'variedad', actividad: 'movilidad', descanso: 'cama', bienestar: 'meditacion' };

export function crearServicioCatalogo(repos) {
  const { contenidos } = repos;
  let indice = null; // Se reconstruye solo cuando el catálogo cambia.

  const invalidar = () => { indice = null; };

  return {
    invalidar,
    publicadas: () => contenidos.listar({ soloPublicados: true }),
    todas: () => contenidos.listar(),
    obtener: (id) => contenidos.obtener(id),

    async indiceBusqueda() {
      if (!indice) indice = prepararIndice(await this.publicadas());
      return indice;
    },

    /** @param {string|null} id Identificador al editar; null al crear. */
    async guardar(datos, id = null) {
      const contenido = {
        ...datos,
        titulo: datos.titulo?.trim(),
        resumen: datos.resumen?.trim(),
        minutos: Number(datos.minutos),
        beneficios: limpiarLista(datos.beneficios ?? []),
        pasos: limpiarLista(datos.pasos ?? []),
        etiquetas: limpiarLista(datos.etiquetas ?? []),
        excluye: datos.excluye ?? [],
      };
      const { valido, errores } = validarRecomendacion(contenido);
      if (!valido) return { ok: false, errores };
      contenido.actualizado = fechaLocal();
      contenido.imagen = contenido.imagen || IMAGEN_POR_CATEGORIA[contenido.categoria];
      contenido.video = contenido.video || null;
      invalidar();
      if (id) {
        const actualizado = await contenidos.actualizar(id, contenido);
        return actualizado ? { ok: true, contenido: actualizado } : { ok: false, errores: { titulo: 'Esta recomendación ya no existe. Pudo eliminarse en otra pestaña.' } };
      }
      const existentes = (await contenidos.listar()).map((c) => c.id);
      return { ok: true, contenido: await contenidos.crear({ ...contenido, id: crearSlug(contenido.titulo, existentes) }) };
    },

    async cambiarEstado(id, estado) {
      invalidar();
      return contenidos.actualizar(id, { estado, actualizado: fechaLocal() });
    },

    async eliminar(id) {
      invalidar();
      await contenidos.eliminar(id);
    },
  };
}

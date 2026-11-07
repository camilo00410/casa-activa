/**
 * Adaptadores de almacenamiento. Toda la persistencia pasa por esta interfaz:
 * leer, escribir, eliminar y claves. Cambiar de tecnología solo exige un adaptador nuevo.
 */

export class ErrorAlmacen extends Error {}

export function crearAlmacenMemoria(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    temporal: true,
    leer: (clave) => (datos.has(clave) ? structuredClone(datos.get(clave)) : undefined),
    escribir: (clave, valor) => { datos.set(clave, structuredClone(valor)); },
    eliminar: (clave) => { datos.delete(clave); },
    claves: () => [...datos.keys()],
  };
}

export const PREFIJO = 'casaactiva.';

/** Usa localStorage. Si el navegador lo bloquea, continúa en memoria y lo informa. */
export function crearAlmacenNavegador(almacenamiento = null, prefijo = PREFIJO) {
  let storage;
  try {
    // Con los datos del sitio bloqueados, el solo hecho de leer localStorage lanza SecurityError.
    storage = almacenamiento ?? globalThis.localStorage;
    storage.setItem(`${prefijo}prueba`, '1');
    storage.removeItem(`${prefijo}prueba`);
  } catch (error) {
    // Sin espacio el almacén sigue siendo legible: las cuentas existentes no deben desaparecer.
    if (error?.name !== 'QuotaExceededError') return crearAlmacenMemoria();
  }
  return {
    temporal: false,
    leer(clave) {
      const crudo = storage.getItem(prefijo + clave);
      if (crudo === null) return undefined;
      try {
        return JSON.parse(crudo);
      } catch {
        return undefined; // Un dato manipulado o corrupto no debe tumbar la aplicación.
      }
    },
    escribir(clave, valor) {
      try {
        storage.setItem(prefijo + clave, JSON.stringify(valor));
      } catch (causa) {
        throw new ErrorAlmacen('No hay espacio disponible para guardar tus datos.', { cause: causa });
      }
    },
    eliminar: (clave) => storage.removeItem(prefijo + clave),
    claves: () => Object.keys(storage).filter((c) => c.startsWith(prefijo)).map((c) => c.slice(prefijo.length)),
  };
}

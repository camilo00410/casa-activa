/**
 * Patrón repositorio (RNF2). Las vistas y los servicios nunca tocan el almacenamiento.
 * Todos los métodos son asíncronos a propósito: hoy resuelven contra el navegador, pero
 * su firma ya es la de una API REST, así que migrar a un servidor solo cambia este archivo.
 */

const quitarDe = (mapa, clave) => { const copia = { ...mapa }; delete copia[clave]; return copia; };

/** Un dato alterado no debe tumbar la aplicación: si no es una lista, se trata como vacía. */
const leerLista = (almacen, clave) => {
  const valor = almacen.leer(clave);
  return Array.isArray(valor) ? valor : [];
};

function coleccionPorUsuario(almacen, clave) {
  const leer = () => almacen.leer(clave) ?? {};
  return {
    async listar(usuarioId) { return leer()[usuarioId] ?? []; },
    async agregar(usuarioId, valor) {
      const mapa = leer();
      const lista = mapa[usuarioId] ?? [];
      if (!lista.includes(valor)) almacen.escribir(clave, { ...mapa, [usuarioId]: [...lista, valor] });
    },
    async quitar(usuarioId, valor) {
      const mapa = leer();
      almacen.escribir(clave, { ...mapa, [usuarioId]: (mapa[usuarioId] ?? []).filter((v) => v !== valor) });
    },
    async eliminarDe(usuarioId) { almacen.escribir(clave, quitarDe(leer(), usuarioId)); },
  };
}

export function crearRepositorios(almacen) {
  const usuarios = {
    async listar() { return leerLista(almacen, 'usuarios'); },
    async buscarPorId(id) { return (await this.listar()).find((u) => u.id === id) ?? null; },
    async buscarPorCorreo(correo) {
      const normal = correo.trim().toLowerCase();
      return (await this.listar()).find((u) => u.correo === normal) ?? null;
    },
    async crear(usuario) {
      almacen.escribir('usuarios', [...await this.listar(), usuario]);
      return usuario;
    },
    async actualizar(id, cambios) {
      const lista = await this.listar();
      almacen.escribir('usuarios', lista.map((u) => (u.id === id ? { ...u, ...cambios } : u)));
      return this.buscarPorId(id);
    },
    async eliminar(id) { almacen.escribir('usuarios', (await this.listar()).filter((u) => u.id !== id)); },
  };

  const perfiles = {
    async obtener(usuarioId) { return (almacen.leer('perfiles') ?? {})[usuarioId] ?? null; },
    async guardar(usuarioId, perfil) { almacen.escribir('perfiles', { ...(almacen.leer('perfiles') ?? {}), [usuarioId]: perfil }); return perfil; },
    async eliminar(usuarioId) { almacen.escribir('perfiles', quitarDe(almacen.leer('perfiles') ?? {}, usuarioId)); },
  };

  const contenidos = {
    async listar({ soloPublicados = false } = {}) {
      const lista = leerLista(almacen, 'contenidos');
      return soloPublicados ? lista.filter((c) => c.estado === 'publicado') : lista;
    },
    async obtener(id) { return (await this.listar()).find((c) => c.id === id) ?? null; },
    async crear(contenido) { almacen.escribir('contenidos', [...await this.listar(), contenido]); return contenido; },
    async actualizar(id, cambios) {
      almacen.escribir('contenidos', (await this.listar()).map((c) => (c.id === id ? { ...c, ...cambios } : c)));
      return this.obtener(id);
    },
    async eliminar(id) { almacen.escribir('contenidos', (await this.listar()).filter((c) => c.id !== id)); },
  };

  const habitos = {
    async listar(usuarioId) { return leerLista(almacen, 'habitos').filter((h) => h.usuarioId === usuarioId); },
    async obtener(id) { return leerLista(almacen, 'habitos').find((h) => h.id === id) ?? null; },
    async crear(habito) { almacen.escribir('habitos', [...leerLista(almacen, 'habitos'), habito]); return habito; },
    async eliminar(id) {
      almacen.escribir('habitos', leerLista(almacen, 'habitos').filter((h) => h.id !== id));
      almacen.escribir('registros', quitarDe(almacen.leer('registros') ?? {}, id));
    },
    async eliminarDe(usuarioId) {
      for (const h of await this.listar(usuarioId)) await this.eliminar(h.id);
    },
    async registros(habitoId) { return (almacen.leer('registros') ?? {})[habitoId] ?? []; },
    async alternarRegistro(habitoId, fecha) {
      const mapa = almacen.leer('registros') ?? {};
      const fechas = mapa[habitoId] ?? [];
      const marcado = !fechas.includes(fecha);
      almacen.escribir('registros', { ...mapa, [habitoId]: marcado ? [...fechas, fecha] : fechas.filter((f) => f !== fecha) });
      return marcado;
    },
  };

  const sesiones = {
    async obtener() { return almacen.leer('sesion') ?? null; },
    async guardar(sesion) { almacen.escribir('sesion', sesion); },
    async cerrar() { almacen.eliminar('sesion'); },
  };

  const intentos = {
    async obtener(correo) { return (almacen.leer('intentos') ?? {})[correo] ?? { fallos: 0, bloqueadoHasta: 0 }; },
    async guardar(correo, estado) { almacen.escribir('intentos', { ...(almacen.leer('intentos') ?? {}), [correo]: estado }); },
    async limpiar(correo) { almacen.escribir('intentos', quitarDe(almacen.leer('intentos') ?? {}, correo)); },
  };

  return {
    usuarios, perfiles, contenidos, habitos, sesiones, intentos,
    favoritos: coleccionPorUsuario(almacen, 'favoritos'),
    descartes: coleccionPorUsuario(almacen, 'descartes'),
  };
}

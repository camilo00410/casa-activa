/** W4. Asistente de perfil de salud en cuatro pasos. Es opcional y requiere autorización explícita. */
import { h, rellenar } from '../nucleo/dom.js';
import { destinoSeguro } from '../nucleo/enrutador.js';
import { CONDICIONES, DIETAS, NIVELES_ACTIVIDAD, OBJETIVOS, RESTRICCIONES } from '../dominio/catalogo.js';
import { calcularIMC, clasificarIMC } from '../dominio/salud.js';
import { validarPerfilSalud } from '../dominio/validacion.js';
import { aviso, barraProgreso, pagina } from '../ui/componentes.js';
import { boton, campo, casilla, grupoOpciones, leerFormulario, limpiarErrores, mostrarErrores, selector } from '../ui/formularios.js';

const PASOS = [
  { titulo: 'Sobre ti', campos: ['autorizaSalud', 'edad', 'pesoKg', 'tallaCm'] },
  { titulo: 'Tu objetivo', campos: ['objetivo'] },
  { titulo: 'Alimentación y salud', campos: ['dieta', 'restricciones', 'condiciones'] },
  { titulo: 'Tu rutina', campos: ['nivelActividad', 'horasSueno', 'estres', 'minutosDisponibles'] },
];

const MINUTOS = [10, 20, 30, 45].map((m) => ({ id: m, nombre: `${m} minutos` }));
const ESCALA_ESTRES = [['1', 'Muy bajo'], ['2', 'Bajo'], ['3', 'Medio'], ['4', 'Alto'], ['5', 'Muy alto']].map(([id, nombre]) => ({ id, nombre }));

const VACIO = { autorizaSalud: false, edad: '', pesoKg: '', tallaCm: '', objetivo: '', dieta: 'omnivora', restricciones: [], condiciones: [], nivelActividad: '', horasSueno: 7, estres: '3', minutosDisponibles: 20 };

export async function vistaAsistente(app) {
  const existente = await app.personal.perfil(app.usuario.id);
  const destino = destinoSeguro(app.ruta.consulta.volver);
  const datos = { ...VACIO, ...(existente ?? {}), estres: String(existente?.estres ?? VACIO.estres), autorizaSalud: Boolean(existente) };
  let paso = 0;

  const raiz = h('div', {});
  const textoIMC = h('p', { class: 'imc', 'aria-live': 'polite' });
  const pintarIMC = (form) => {
    const imc = calcularIMC(form.elements.pesoKg?.value, form.elements.tallaCm?.value);
    textoIMC.textContent = imc ? `Tu IMC es ${imc} (${clasificarIMC(imc)}). Es un dato orientativo, no un diagnóstico.` : '';
  };

  const camposDelPaso = () => [
    [
      aviso({ tipo: 'info', titulo: 'Tus datos de salud son sensibles', texto: 'Solo los usamos para ordenar tus recomendaciones. No estás obligado a entregarlos: puedes omitir este paso y seguir usando Casa Activa. Puedes borrarlos cuando quieras.' }),
      casilla({ nombre: 'autorizaSalud', etiqueta: 'Autorizo de forma explícita el tratamiento de mis datos de salud para personalizar mis recomendaciones.', marcado: datos.autorizaSalud }),
      campo({ nombre: 'edad', etiqueta: 'Edad', tipo: 'number', valor: datos.edad, min: 18, max: 100 }),
      h('div', { class: 'dos-columnas' },
        campo({ nombre: 'pesoKg', etiqueta: 'Peso en kg (opcional)', tipo: 'number', valor: datos.pesoKg ?? '', min: 30, max: 300, alEscribir: (e) => pintarIMC(e.target.form) }),
        campo({ nombre: 'tallaCm', etiqueta: 'Talla en cm (opcional)', tipo: 'number', valor: datos.tallaCm ?? '', min: 120, max: 230, alEscribir: (e) => pintarIMC(e.target.form) })),
      textoIMC,
    ],
    [grupoOpciones({ nombre: 'objetivo', leyenda: '¿Cuál es tu objetivo principal?', ayuda: 'Es el criterio que más pesa en tus recomendaciones. Puedes cambiarlo cuando quieras.', opciones: OBJETIVOS, valor: datos.objetivo, estilo: 'tarjeta' })],
    [
      grupoOpciones({ nombre: 'dieta', leyenda: 'Tipo de alimentación', opciones: DIETAS, valor: datos.dieta }),
      grupoOpciones({ nombre: 'restricciones', leyenda: 'Restricciones alimentarias', ayuda: 'Marca las que apliquen. Nunca te sugeriremos algo incompatible.', opciones: RESTRICCIONES, valor: datos.restricciones, tipo: 'checkbox' }),
      grupoOpciones({ nombre: 'condiciones', leyenda: 'Condiciones de salud', ayuda: 'Solo las usamos para ocultar lo que podría no convenirte.', opciones: CONDICIONES, valor: datos.condiciones, tipo: 'checkbox' }),
    ],
    [
      grupoOpciones({ nombre: 'nivelActividad', leyenda: '¿Qué tan activo eres?', opciones: NIVELES_ACTIVIDAD, valor: datos.nivelActividad, estilo: 'tarjeta' }),
      campo({ nombre: 'horasSueno', etiqueta: '¿Cuántas horas duermes por noche?', tipo: 'number', valor: datos.horasSueno, min: 3, max: 12, paso: 0.5 }),
      grupoOpciones({ nombre: 'estres', leyenda: '¿Cómo es tu nivel de estrés?', opciones: ESCALA_ESTRES, valor: datos.estres }),
      selector({ nombre: 'minutosDisponibles', etiqueta: '¿Cuánto tiempo tienes al día para cuidarte?', opciones: MINUTOS, valor: datos.minutosDisponibles }),
    ],
  ][paso];

  const capturar = (form) => Object.assign(datos, leerFormulario(form));

  async function avanzar(e) {
    e.preventDefault();
    const form = e.target;
    capturar(form);
    const { errores } = validarPerfilSalud(datos);
    const delPaso = Object.fromEntries(Object.entries(errores).filter(([campoId]) => PASOS[paso].campos.includes(campoId)));
    if (Object.keys(delPaso).length > 0) { mostrarErrores(form, delPaso); return; }
    limpiarErrores(form);
    if (paso < PASOS.length - 1) { paso += 1; pintar(); return; }
    const r = await app.personal.guardarPerfil(app.usuario.id, datos);
    if (!r.ok) {
      const primero = PASOS.findIndex((p) => p.campos.some((c) => r.errores[c]));
      paso = Math.max(0, primero);
      pintar();
      mostrarErrores(raiz.querySelector('form'), r.errores);
      return;
    }
    app.toast('Tu plan personalizado está listo.', { tipo: 'exito' });
    app.ir(destino);
  }

  function pintar() {
    const atras = paso > 0 && boton({ texto: 'Atrás', variante: 'secundario', alHacer: (e) => { capturar(e.target.form); paso -= 1; pintar(); } });
    const form = h('form', { class: 'asistente pila', noValidate: true, onSubmit: avanzar },
      h('div', { class: 'pila' }, camposDelPaso()),
      h('div', { class: 'asistente-acciones' },
        atras,
        h('span', { class: 'separador-flex' }),
        !existente && boton({ texto: 'Omitir por ahora', variante: 'texto', alHacer: () => app.ir(destino) }),
        boton({ texto: paso === PASOS.length - 1 ? 'Guardar y ver mi plan' : 'Continuar', tipo: 'submit' })));
    rellenar(raiz, 
      h('div', { class: 'asistente-avance' },
        h('ol', { class: 'asistente-pasos' }, PASOS.map((p, i) => h('li', { 'aria-current': i === paso ? 'step' : undefined, class: i < paso ? 'hecho' : undefined }, h('span', {}, i + 1), p.titulo))),
        barraProgreso(((paso + 1) / PASOS.length) * 100, `Paso ${paso + 1} de ${PASOS.length}`)),
      h('h1', { tabindex: -1 }, PASOS[paso].titulo),
      form);
    if (paso === 0) pintarIMC(form);
    raiz.querySelector('h1').focus();
  }

  pintar();
  return pagina(raiz);
}

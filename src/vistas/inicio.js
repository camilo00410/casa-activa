/** W1. Pantalla de inicio: conserva la composición y la identidad del MVP original. */
import { h, icono } from '../nucleo/dom.js';
import { CATEGORIAS } from '../dominio/catalogo.js';
import { avisoSalud, rutaImagen } from '../ui/componentes.js';
import { botonEnlace } from '../ui/formularios.js';

const DESTACADAS = ['cardio-suave', 'frutas-y-verduras', 'sin-pantallas'];

const PASOS = [
  ['Cuéntanos de ti', 'Completa tu perfil de salud. Es opcional y tú decides qué compartir.'],
  ['Recibe tu plan', 'Cada día verás una recomendación por categoría y el motivo de cada sugerencia.'],
  ['Sigue tus hábitos', 'Convierte lo que te sirve en un hábito y observa tu avance semana a semana.'],
];

function tarjetaDestacada(rec, indice) {
  return h('article', { class: 'rutina-card' },
    h('img', { src: rutaImagen(rec.imagen), alt: '', width: 560, height: 420, loading: 'lazy', decoding: 'async' }),
    h('div', { class: 'rutina-overlay' }),
    h('span', { class: 'rutina-numero' }, String(indice + 1).padStart(2, '0')),
    h('span', { class: 'btn-play', 'aria-hidden': 'true' }, icono('arrow-right')),
    h('div', { class: 'rutina-info' },
      h('small', {}, `${rec.minutos} MIN · ${rec.nivel.toUpperCase()}`),
      h('h3', {}, h('a', { href: `#/recomendacion/${rec.id}`, class: 'enlace-tarjeta' }, rec.titulo))));
}

export async function vistaInicio(app) {
  const publicadas = await app.catalogo.publicadas();
  const cuenta = (id) => publicadas.filter((r) => r.categoria === id).length;
  const destacadas = DESTACADAS.map((id) => publicadas.find((r) => r.id === id)).filter(Boolean);

  const buscar = (e) => {
    e.preventDefault();
    app.ir('/explorar', { q: new FormData(e.target).get('q').trim() });
  };

  return h('div', {},
    h('section', { class: 'contenedor' },
      h('div', { class: 'presentacion' },
        h('p', { class: 'etiqueta' }, icono('sparkles'), 'RECOMENDACIONES SALUDABLES DESDE CASA'),
        h('h1', {}, 'CUÍDATE. ', h('span', {}, 'SIÉNTETE'), h('span', {}, 'BIEN.')),
        h('p', { class: 'descripcion' }, 'Recomendaciones confiables de alimentación, actividad física, descanso y bienestar, adaptadas a ti y fáciles de convertir en hábitos.'),
        h('ul', { class: 'beneficios' },
          ['Fuentes verificables', 'Adaptado a tu perfil', 'Seguimiento de hábitos'].map((b) => h('li', {}, icono('check'), b))),
        h('div', { class: 'acciones' },
          botonEnlace({ texto: 'Crear mi plan', ruta: '/registro', ico: 'arrow-right' }),
          botonEnlace({ texto: 'Explorar', ruta: '/explorar', variante: 'secundario' }))),
      h('div', { class: 'panel-imagen' },
        h('img', { class: 'panel-foto', src: rutaImagen('hero'), alt: '', width: 960, height: 880, fetchpriority: 'high', decoding: 'async' }),
        h('div', { class: 'tarjeta-busqueda' },
          h('h2', {}, '¿Qué quieres mejorar hoy?'),
          h('form', { role: 'search', onSubmit: buscar },
            h('label', { class: 'oculto', for: 'busqueda-inicio' }, 'Buscar recomendaciones'),
            h('div', { class: 'buscador' },
              icono('search'),
              h('input', { id: 'busqueda-inicio', name: 'q', type: 'search', placeholder: 'Sueño, frutas, estrés…', autocomplete: 'off' }),
              h('button', { type: 'submit', class: 'btn btn-primario' }, 'Buscar'))),
          h('div', { class: 'accesos' }, CATEGORIAS.map((c) => h('a', { href: `#/explorar?cat=${c.id}`, class: `chip-cat cat-${c.id}` }, icono(c.icono), c.nombre)))))),

    h('section', { class: 'seccion', 'aria-labelledby': 'titulo-categorias' },
      h('div', { class: 'seccion-encabezado' },
        h('h2', { id: 'titulo-categorias', class: 'titulo-grande' }, 'CUATRO FORMAS DE ', h('span', {}, 'CUIDARTE')),
        h('p', {}, 'Elige por dónde empezar. Todo el contenido cita su fuente.')),
      h('div', { class: 'categorias' }, CATEGORIAS.map((c) => h('a', { href: `#/explorar?cat=${c.id}`, class: `categoria cat-${c.id}` },
        h('span', { class: 'categoria-icono' }, icono(c.icono)),
        h('strong', {}, c.nombre),
        h('span', { class: 'categoria-texto' }, c.descripcion),
        h('span', { class: 'categoria-cuenta' }, `${cuenta(c.id)} recomendaciones`))))),

    h('section', { class: 'rutinas', 'aria-labelledby': 'titulo-simple' },
      h('div', { class: 'seccion-encabezado' },
        h('h2', { id: 'titulo-simple', class: 'titulo-grande' }, 'EMPIEZA CON ALGO ', h('span', {}, 'SIMPLE')),
        h('p', {}, 'Elige una acción corta. No necesitas experiencia ni equipos.')),
      h('div', { class: 'rutinas-grid' }, destacadas.map(tarjetaDestacada))),

    h('section', { class: 'seccion', 'aria-labelledby': 'titulo-pasos' },
      h('div', { class: 'seccion-encabezado' },
        h('h2', { id: 'titulo-pasos', class: 'titulo-grande' }, 'CÓMO ', h('span', {}, 'FUNCIONA'))),
      h('ol', { class: 'pasos-inicio' }, PASOS.map(([titulo, texto], i) => h('li', {},
        h('span', { class: 'paso-numero', 'aria-hidden': 'true' }, i + 1),
        h('div', {}, h('h3', {}, titulo), h('p', {}, texto))))),
      avisoSalud()));
}

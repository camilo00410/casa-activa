/**
 * Contenido del informe del ACA, en el orden exigido por la guía.
 * Los datos del motor de recomendaciones y de los wireframes provienen del código real.
 */
import { CONTENIDOS_SEMILLA } from '../src/datos/contenidos-semilla.js';
import { PESOS, recomendar } from '../src/dominio/recomendador.js';
import { PANTALLAS } from '../design/wireframes/pantallas.mjs';
import { CONFIG, MEDIDAS } from './config.mjs';

const publicadas = CONTENIDOS_SEMILLA.filter((c) => c.estado === 'publicado');
const cuenta = (cat) => publicadas.filter((c) => c.categoria === cat).length;

function crearAyudas() {
  let figura = 0;
  let tabla = 0;
  const numeros = {};
  const seccion = (titulo) => `<h1>${titulo}</h1>`;
  const sub = (titulo) => `<h2>${titulo}</h2>`;
  const subsub = (titulo) => `<h3>${titulo}</h3>`;
  const p = (...textos) => textos.map((t) => `<p>${t}</p>`).join('');
  const lista = (items, tipo = 'ul') => `<${tipo}>${items.map((i) => `<li>${i}</li>`).join('')}</${tipo}>`;
  const fig = (src, titulo, { maxAlto = '19.5cm', ancho = '100%', clave = null } = {}) => {
    figura += 1;
    if (clave) numeros[`fig:${clave}`] = figura;
    return `<figure><figcaption><strong>Figura ${figura}.</strong> <em>${titulo}</em></figcaption><img src="${src}" alt="${titulo}" style="max-height:${maxAlto};max-width:${ancho}"></figure>`;
  };
  const figVarias = (imagenes, titulo) => {
    figura += 1;
    return `<figure><figcaption><strong>Figura ${figura}.</strong> <em>${titulo}</em></figcaption><div class="varias">${imagenes.map((i) => `<img src="${i}" alt="">`).join('')}</div></figure>`;
  };
  const tab = (titulo, encabezados, filas, { anchos = null, clave = null } = {}) => {
    tabla += 1;
    if (clave) numeros[`tab:${clave}`] = tabla;
    const col = anchos ? `<colgroup>${anchos.map((a) => `<col style="width:${a}">`).join('')}</colgroup>` : '';
    return `<div class="tabla-envoltura"><p class="tabla-titulo"><strong>Tabla ${tabla}.</strong> <em>${titulo}</em></p><table>${col}<thead><tr>${encabezados.map((e) => `<th>${e}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  return { seccion, sub, subsub, p, lista, fig, figVarias, tab, numeros };
}

const TITULO_WIREFRAME = {
  W1: 'Wireframe de la pantalla de inicio (visitante)', W2: 'Wireframe de la pantalla de ingreso', W3: 'Wireframe de la pantalla de registro',
  W4: 'Wireframe del asistente de perfil de salud', W5: 'Wireframe del panel personalizado «Para ti»', W6: 'Wireframe de la pantalla de explorar: búsqueda y filtros',
  W7: 'Wireframe del detalle de una recomendación', W8: 'Wireframe de la pantalla de favoritos', W9: 'Wireframe del seguimiento de hábitos',
  W10: 'Wireframe de mi perfil y privacidad', W11: 'Wireframe de la administración de contenidos: listado', W12: 'Wireframe de la administración de contenidos: formulario',
  W13: 'Wireframe de la adaptación a teléfono móvil',
};

/** Un dato pendiente se muestra como texto: no puede ir dentro del atributo href. */
const enlace = (url) => (url.startsWith('http') ? `<a href="${url}">${url}</a>` : url);

const PERSONA_A = { objetivo: 'dormir-mejor', nivelActividad: 'sedentario', dieta: 'vegetariana', restricciones: ['sin-lactosa'], condiciones: ['dolor-rodilla'], horasSueno: 5, estres: 4, minutosDisponibles: 20 };
const PERSONA_B = { objetivo: 'moverme-mas', nivelActividad: 'activo', dieta: 'omnivora', restricciones: [], condiciones: [], horasSueno: 8, estres: 2, minutosDisponibles: 45 };

export function construirContenido() {
  const { seccion, sub, subsub, p, lista, fig, figVarias, tab, numeros } = crearAyudas();
  const partes = [];
  const agregar = (...x) => partes.push(...x);
  const topA = recomendar(PERSONA_A, publicadas, {}, { limite: 3 });
  const topB = recomendar(PERSONA_B, publicadas, {}, { limite: 3 });

  // ─────────────────────────── INTRODUCCIÓN ───────────────────────────
  agregar(seccion('Introducción'), p(
    `Este informe presenta el diseño de Casa Activa, una página web de recomendaciones saludables desarrollada para la Actividad de Construcción Aplicada del curso de Ingeniería Web. La guía de la actividad pide recorrer el proceso completo de diseño de una interfaz: analizar los requerimientos, traducirlos en una estructura, darles identidad visual y validarlos con un prototipo navegable centrado en la experiencia del usuario (Corporación Unificada Nacional de Educación Superior [CUN], 2026).`,
    `El trabajo partió de un producto mínimo viable centrado en ejercicios para hacer en casa. Al contrastarlo con la guía se encontró que cubría una sola de las cuatro categorías solicitadas (alimentación, actividad física, descanso y bienestar) y que sus formularios no tenían funcionamiento real. Por esa razón se replanteó el alcance: se conservó la identidad visual, que era sólida, y se rediseñó el producto completo alrededor de la temática de la actividad.`,
    `El alcance comprende el análisis de los cinco requerimientos funcionales y los cinco no funcionales, ${PANTALLAS.length} wireframes de baja fidelidad con su mapa de pantallas, los mockups de alta fidelidad y un prototipo funcional. Este último permite registrarse, completar un perfil de salud, buscar y filtrar ${publicadas.length} recomendaciones con fuente verificable, recibir sugerencias personalizadas, guardar favoritos, seguir hábitos y administrar los contenidos. Como es un prototipo académico, funciona sin servidor: los datos se guardan en el navegador de cada persona. Las consecuencias de esa decisión se explican en el análisis de seguridad y de escalabilidad.`,
    `Se usaron estas herramientas: HTML y CSS para los wireframes y los mockups, diseñados directamente en el navegador; JavaScript con módulos nativos para el prototipo; Playwright (Microsoft, 2026) para las pruebas de extremo a extremo; axe (Deque Systems, 2026) y Lighthouse (Google, 2026) para las auditorías de accesibilidad y rendimiento, y Git y GitHub para el control de versiones. La guía recomienda herramientas como Figma o Balsamiq, pero no obliga a usar una en particular, y señala que Adobe XD e InVision ya no están disponibles. También se usó el asistente de programación Claude Code (Anthropic, 2026) como apoyo en la construcción y la redacción; el equipo es responsable de revisar y sustentar el resultado.`,
    `La metodología combinó prácticas tradicionales y ágiles, como propone la actividad. De lo tradicional se tomó la secuencia de fases de la guía: análisis, wireframe, diseño visual, prototipo e informe. La fase de mockup y la de prototipo se trabajaron a la par, como se explica en la sección Mockup. De lo ágil se tomó la construcción por incrementos, la validación continua con pruebas automáticas y la disposición a responder al cambio (Beck et al., 2001): cada defecto encontrado se corrigió cuando apareció, sin acumularlo para el final. El registro del proceso está en la carpeta de evidencias del proyecto.`,
    `El propósito de este informe es documentar ese proceso y justificar cada decisión, de modo que se pueda comprobar cómo fue interpretado y resuelto cada requerimiento. Las referencias siguen las normas APA, séptima edición (American Psychological Association, 2020).`,
  ));

  // ─────────────────────────── OBJETIVOS ───────────────────────────
  agregar(seccion('Objetivos'), sub('Objetivo general'), p(
    'Diseñar y validar una página web de recomendaciones saludables mediante un wireframe, un mockup y un prototipo funcional, aplicando prácticas de metodologías tradicionales y ágiles desde el análisis de requerimientos hasta la entrega del prototipo final, con un enfoque centrado en la experiencia del usuario.',
  ), sub('Objetivos específicos'), lista([
    'Analizar de manera argumentada los cinco requerimientos funcionales y los cinco no funcionales de la página.',
    'Diseñar wireframes de baja fidelidad que definan la estructura, la distribución de los elementos y la jerarquía de la información de cada pantalla.',
    'Elaborar mockups de alta fidelidad con una paleta, una tipografía y una iconografía justificadas, que cumplan criterios de contraste y legibilidad.',
    'Construir y verificar un prototipo funcional y navegable que permita recorrer los flujos principales del usuario.',
  ]));

  // ─────────────────────────── ANÁLISIS RF ───────────────────────────
  agregar(seccion('Análisis de requerimientos funcionales'), p(
    'La guía enuncia cada requerimiento solo con su título, sin detallar su contenido. Por eso, antes de diseñar, fue necesario definir qué significa cada uno para esta página. Cada análisis se organiza de la misma forma: cómo se interpretó, por qué se decidió así, cómo quedó resuelto en los diseños y cómo se comprobó.',
  ), sub('Usuarios y tareas principales'), p(
    'Se identificaron tres tipos de usuario. La {{tab:usuarios}} resume qué necesita cada uno, y esa identificación orientó todas las decisiones siguientes.',
  ), tab('Usuarios de la página y sus tareas principales', ['Usuario', 'Quién es', 'Tareas principales'], [
    ['Visitante', 'Persona que llega buscando orientación concreta, sin intención inicial de registrarse.', 'Buscar una recomendación, explorar categorías, leer el detalle y su fuente.'],
    ['Usuario registrado', 'Persona adulta que quiere cambiar un hábito y darle continuidad.', 'Completar su perfil, recibir su plan, guardar favoritos y registrar hábitos.'],
    ['Administrador', 'Responsable editorial del contenido.', 'Crear, editar, publicar, retirar y eliminar recomendaciones.'],
  ], { anchos: ['22%', '40%', '38%'], clave: 'usuarios' }));

  agregar(sub('RF1. Gestión de usuarios y perfil de salud'), subsub('Interpretación'), p(
    '«Gestión de usuarios» se entendió como el ciclo de vida completo de una cuenta: crearla, acceder, mantenerla y eliminarla. «Perfil de salud» se entendió como la información mínima que hace útil una recomendación: objetivo, nivel de actividad, alimentación, restricciones, condiciones de salud, horas de sueño, estrés y tiempo disponible.',
  ), subsub('Justificación'), p(
    'La decisión central fue separar la cuenta del perfil de salud. Según el artículo 5 de la Ley 1581 de 2012, los datos relativos a la salud son datos sensibles, y su tratamiento exige autorización explícita (Congreso de la República de Colombia, 2012, art. 6). Además, el Decreto 1377 de 2013 dispone que ninguna actividad puede condicionarse a que el titular entregue datos sensibles (Presidencia de la República de Colombia, 2013, art. 6). Por eso el perfil se pide después del registro, es opcional, se puede omitir y tiene su propia casilla de autorización. Un único formulario largo habría sido más simple de construir, pero habría condicionado el acceso a entregar esos datos.',
    'El registro se limita a mayores de 18 años, porque la ley da una protección reforzada a los datos de niños, niñas y adolescentes (Congreso de la República de Colombia, 2012, art. 7) y porque las recomendaciones usadas están dirigidas a personas adultas.',
  ), subsub('Resolución en los diseños'), p(
    'Los wireframes W2, W3, W4 y W10 definen estas pantallas. El perfil se divide en un asistente de cuatro pasos para reducir la carga cognitiva, con avance visible y opción de omitir. El prototipo implementa el registro con validación junto a cada campo, el indicador de seguridad de la contraseña, el cierre de sesión, la edición de la cuenta, el cambio de contraseña y un cálculo informativo del índice de masa corporal.',
  ), subsub('Verificación'), p(
    'Las pruebas automáticas comprueban el registro con datos válidos e inválidos, la unicidad del correo, que sin autorización no se guarde ningún dato de salud y que el perfil se pueda omitir sin perder el acceso.',
  ));

  agregar(sub('RF2. Gestión de contenidos saludables'), subsub('Interpretación'), p(
    'Este requerimiento tiene dos caras. Para el público, significa encontrar contenido organizado y confiable. Para el administrador, significa poder mantener ese contenido sin modificar el código.',
  ), subsub('Justificación'), p(
    `En un sitio de salud la confianza es parte de la funcionalidad, así que cada recomendación cita una fuente verificable y el sistema no permite publicar una sin ella. El catálogo inicial tiene ${publicadas.length} recomendaciones: ${cuenta('alimentacion')} de alimentación, ${cuenta('actividad')} de actividad física, ${cuenta('descanso')} de descanso y ${cuenta('bienestar')} de bienestar. Sus fuentes son la Organización Mundial de la Salud (OMS, 2026a, 2026b, 2026d), la Organización Panamericana de la Salud (OPS, 2020), las guías alimentarias colombianas (Instituto Colombiano de Bienestar Familiar [ICBF] y Organización de las Naciones Unidas para la Alimentación y la Agricultura [FAO], 2020), los Centros para el Control y la Prevención de Enfermedades (CDC, 2024) y el consenso sobre sueño de Watson et al. (2015).`,
    'Revisar los contenidos con este criterio permitió detectar un error de fondo en el MVP: la tarjeta «Cardio suave, bajo impacto» enlazaba a un video de entrenamiento de alta intensidad. Para una persona que busca algo suave, eso podía ser perjudicial. La rutina de bajo impacto se reescribió y el video pasó a una recomendación de nivel avanzado, con exclusiones de seguridad.',
    'Se agregaron dos estados, borrador y publicada, para revisar un contenido antes de que sea público, y una regla de seguridad por recomendación: el campo «No mostrar a personas con».',
  ), subsub('Resolución en los diseños'), p(
    'W1 presenta las cuatro categorías con su cantidad de recomendaciones. W7 muestra el detalle, con pasos, beneficios y fuente. W11 y W12 definen la administración: una tabla, porque la tarea es comparar y gestionar registros, y un formulario que separa el contenido visible de los atributos que usan la búsqueda y la personalización.',
  ), subsub('Verificación'), p(
    'Se comprobó que lo publicado por el administrador aparece en el catálogo público, que un borrador no es visible para los visitantes y que el sistema rechaza un contenido sin fuente o con un enlace inseguro.',
  ));

  agregar(sub('RF3. Búsqueda y filtrado'), subsub('Interpretación'), p(
    'Quien llega a una página de recomendaciones suele tener una necesidad concreta y la expresa con sus propias palabras. La búsqueda debe tolerar esa variedad, y los filtros deben ayudar a acotar cuando la persona no sabe exactamente qué busca.',
  ), subsub('Justificación'), p(
    'Se tomaron cuatro decisiones. La búsqueda ignora tildes y mayúsculas, porque en un teléfono es común escribir «sueno» y no «sueño». Los filtros se combinan entre sí y cada categoría muestra cuántos resultados daría, lo que evita llegar a una pantalla vacía. El estado de la búsqueda queda en la dirección de la página, de modo que un resultado se puede compartir y sobrevive a una recarga. Finalmente, cuando no hay resultados, la página sugiere qué hacer para que la persona no quede sin salida.',
  ), subsub('Resolución en los diseños'), p(
    'W6 dedica una pantalla a esta función: el buscador ocupa todo el ancho porque es la acción principal, y los filtros están en una columna lateral para combinarlos sin perder de vista los resultados. W1 ubica un buscador en la portada, visible sin desplazarse. En móvil, W13 pliega los filtros para dar prioridad a los resultados.',
  ), subsub('Verificación'), p(
    `Las pruebas confirman que escribir con o sin tilde da el mismo resultado, que los filtros se combinan y que se conservan tras recargar. Con 10 000 registros sintéticos, una búsqueda por texto tardó cerca de ${MEDIDAS.busquedaMs} ms, medida como la mediana de varias corridas.`,
  ));

  agregar(sub('RF4. Personalización de recomendaciones'), subsub('Interpretación'), p(
    'Personalizar no es saludar por el nombre: es que el contenido cambie según la persona y que ella entienda por qué. También implica lo contrario: no mostrarle lo que no le conviene.',
  ), subsub('Justificación'), p(
    'Se eligió un motor de reglas explicable y no un modelo de aprendizaje automático. Este último requeriría datos de uso que un prototipo no tiene y no permitiría explicar cada resultado, algo importante cuando se trata de salud. El motor funciona en cuatro etapas: primero descarta lo incompatible con el perfil, luego asigna un puntaje con los pesos de la {{tab:criterios}}, después limita cuántas sugerencias llegan por categoría para que la lista sea variada y, por último, convierte cada criterio cumplido en una razón legible.',
  ), tab('Criterios del motor de personalización', ['Criterio', 'Peso', 'Qué mide'], [
    ['Objetivo', `${PESOS.objetivo}`, 'La recomendación apoya el objetivo principal de la persona.'],
    ['Nivel', `${PESOS.nivel}`, 'Se ajusta a su nivel de actividad; lo que lo supera pierde puntos.'],
    ['Tiempo', `${PESOS.tiempo}`, 'Cabe en los minutos que tiene disponibles.'],
    ['Necesidad', `${PESOS.necesidad}`, 'Atiende una señal del perfil: dormir menos de 7 horas, estrés alto o sedentarismo.'],
    ['Afinidad', `${PESOS.afinidad}`, 'Se parece a lo que la persona guardó en favoritos.'],
  ], { anchos: ['20%', '12%', '68%'], clave: 'criterios' }), p(
    'Las exclusiones son una regla de seguridad y no un criterio más: ningún puntaje alto puede superarlas. A una persona vegana nunca se le sugiere un lácteo, y a alguien con dolor de rodilla no se le propone un entrenamiento de alto impacto. El límite de 7 horas de sueño proviene del consenso de Watson et al. (2015).',
    'El índice de masa corporal se calcula con fines informativos, pero no se usa para recomendar, a propósito. La OMS (2026c) señala que existen otras medidas, como el perímetro de la cintura, y que las categorías varían con la edad y el sexo en menores, de modo que decidir contenido de salud con un solo número sería poco prudente.',
    `La {{tab:perfiles}} muestra el resultado real del motor para dos perfiles opuestos. La persona A duerme 5 horas, reporta estrés alto, es poco activa, vegetariana, intolerante a la lactosa y tiene dolor de rodilla. La persona B es muy activa, duerme 8 horas y quiere moverse más.`,
  ), tab('Primeras tres recomendaciones del motor para dos perfiles', ['#', 'Persona A: dormir mejor', 'Persona B: moverme más'], [0, 1, 2].map((i) => [
    `${i + 1}`, `${topA[i].rec.titulo} (${topA[i].puntaje} puntos)`, `${topB[i].rec.titulo} (${topB[i].puntaje} puntos)`,
  ]), { anchos: ['8%', '46%', '46%'], clave: 'perfiles' }), subsub('Resolución en los diseños'), p(
    'W5 convierte la personalización en una pantalla: un plan de hoy con una acción por categoría y una lista con el motivo de cada sugerencia. El control «No me interesa» devuelve el control a la persona, y se puede deshacer. Si alguien abre directamente una recomendación incompatible con su perfil, W7 muestra una advertencia que explica el motivo.',
  ), subsub('Verificación'), p(
    'Las pruebas comprueban los casos de seguridad uno por uno, que dos perfiles distintos reciben listas distintas y que, sin perfil, el sistema muestra contenido general sin inventar razones.',
  ));

  agregar(sub('RF5. Favoritos y seguimiento de hábitos'), subsub('Interpretación'), p(
    'Una recomendación solo sirve si se aplica. Los favoritos permiten conservar lo que interesó y el seguimiento de hábitos convierte esa intención en una acción repetida.',
  ), subsub('Justificación'), p(
    'Las decisiones buscan que continuar sea más fácil que abandonar. Marcar el día toma un toque. Cualquier recomendación se puede convertir en hábito desde su detalle. Si hoy aún no se ha marcado un hábito, la racha no se muestra como perdida, porque el día no ha terminado. La meta es semanal y no diaria, para que un día fallido no se perciba como un fracaso.',
    'También hubo una decisión técnica con efecto directo en la experiencia: las fechas se manejan en hora local. Si se usara la fecha en formato universal, en Colombia (UTC-5) un hábito marcado después de las 7 de la noche quedaría registrado en el día siguiente. Una prueba automática cubre este caso.',
  ), subsub('Resolución en los diseños'), p(
    'W8 reúne los favoritos con las mismas tarjetas del catálogo y define su estado vacío. W9 prioriza la tarea del día: cada fila permite marcar lo hecho y muestra la racha, la meta y los últimos siete días. El gráfico de cumplimiento va a un lado porque es información de consulta, e incluye una tabla equivalente para quien no pueda verlo.',
  ), subsub('Verificación'), p(
    'Se comprobó que favoritos y hábitos persisten al recargar, que el cálculo de rachas funciona en cambios de mes y de año, que no se pueden marcar días futuros y que nadie puede modificar el hábito de otra persona.',
  ));

  // ─────────────────────────── ANÁLISIS RNF ───────────────────────────
  agregar(seccion('Análisis de requerimientos no funcionales'), p(
    'Estos requerimientos se trataron con el mismo criterio: en lugar de afirmar que se cumplen, se definió cómo medirlos. Antes de cambiar el proyecto se midió el MVP, de modo que los resultados se pueden comparar, como muestra la {{tab:lighthouse}}. El MVP se midió en local, porque no estaba publicado, y el prototipo se midió tanto en local, para compararlos en iguales condiciones, como sobre el sitio publicado.',
  ), tab('Comparación medida entre el MVP y el prototipo final con Lighthouse', ['Medición', 'Rendimiento', 'Accesibilidad', 'Buenas prácticas', 'SEO', 'LCP'], [
    ['MVP, móvil (local)', '84', '95', '96', '91', '4,5 s'],
    ['MVP, escritorio (local)', '99', '95', '96', '91', '0,9 s'],
    ['Inicio, móvil (local)', '93', '100', '100', '100', '3,2 s'],
    ['Inicio, móvil (publicado)', '99', '100', '100', '100', '2,0 s'],
    ['Inicio, escritorio (publicado)', '100', '100', '100', '100', '0,5 s'],
    ['Explorar, móvil (publicado)', '100', '100', '100', '100', '1,8 s'],
    ['Ingreso, móvil (publicado)', '100', '100', '100', '100', '1,8 s'],
  ], { anchos: ['27%', '17%', '18%', '15%', '10%', '13%'], clave: 'lighthouse' }));

  agregar(sub('RNF1. Rendimiento'), p(
    'Se interpretó como la rapidez que percibe una persona con un teléfono y una conexión móvil, no como la velocidad en el computador de quien desarrolla. Por eso se tomó la medición móvil de Lighthouse como referencia, con una meta de 90 o más.',
    `Las decisiones fueron: no usar un framework, alojar las fuentes y las imágenes en el propio sitio, convertir las imágenes a WebP, declarar sus medidas para evitar saltos de diseño y cargar de forma diferida las que no están a la vista. El JavaScript se transfiere comprimido con unos 68 KiB. La página de inicio pasó de 522 KiB a 399 KiB, aunque con más contenido, y el cambio acumulado de diseño (CLS) quedó en 0.`,
    'La primera medición móvil dio 87, por debajo de la meta. No se ajustó la meta: se analizó la causa. El navegador descubría los módulos de JavaScript por niveles, a medida que los leía, y el servidor local no comprimía los archivos, a diferencia del hosting previsto. Se declaró la precarga de los módulos, sin añadir un empaquetador, se activó la compresión y el resultado subió a 93.',
    'La medición sobre el sitio publicado, que entrega los archivos con HTTP/2 y compresión, fue mejor: el inicio móvil alcanzó 99 y el tiempo de carga del elemento principal (LCP) bajó de 3,2 s a 2,0 s, por debajo de los 2,5 s que Lighthouse considera buenos. La diferencia muestra que el rendimiento depende también de cómo se sirve el sitio, y que conviene medir donde estará el usuario. Lighthouse simula una red móvil, de modo que estos valores son una referencia y no la experiencia exacta de cada persona.',
  ));

  agregar(sub('RNF2. Escalabilidad'), p(
    'Una página estática no recibe cargas de servidor, de modo que aquí la escalabilidad significa poder crecer en contenido, en funciones y en tecnología sin rehacer el proyecto.',
    'El código se organizó en capas: presentación, servicios, dominio y datos ({{fig:arquitectura}}, en la sección Prototipo). La lógica del dominio no depende del navegador, y todo acceso a datos pasa por repositorios con métodos asíncronos, cuya forma es la de una API. Pasar a un servidor real implicaría reemplazar ese adaptador sin tocar las pantallas. Las categorías y objetivos se definen en datos, de modo que agregar uno no exige rediseñar. El esquema de almacenamiento tiene versión y migraciones, para que un cambio futuro no rompa los datos guardados.',
    `Para comprobarlo se probó el motor con 10 000 registros, unas 380 veces el catálogo actual. La mediana fue de ${MEDIDAS.busquedaMs} ms para una búsqueda por texto, ${MEDIDAS.filtrosMs} ms con filtros combinados y ${MEDIDAS.personalizacionMs} ms para personalizar, por debajo de lo que una persona percibe como espera. Los resultados se muestran por páginas para no saturar la interfaz.`,
    'El límite actual es claro: el almacenamiento del navegador es de una sola persona y un solo dispositivo. Para que varias personas compartan datos o para sincronizar dispositivos se necesita un servidor, y por eso la arquitectura deja preparada esa transición.',
  ));

  agregar(sub('RNF3. Seguridad y privacidad'), p(
    'En una página que trata datos de salud este requerimiento tiene dos partes: proteger las cuentas frente a accesos indebidos y respetar los derechos de las personas sobre su información.',
    'Para las cuentas, las contraseñas nunca se guardan: se almacena una derivación PBKDF2-HMAC-SHA256 con sal aleatoria y 600 000 iteraciones, la configuración que recomienda la OWASP Foundation (s. f.), mediante la interfaz criptográfica del navegador (Mozilla Developer Network [MDN], s. f.-b). El error de ingreso no revela si un correo existe, aunque el registro sí avisa cuando un correo ya está en uso, porque la persona necesita saberlo para continuar. Tras cinco intentos fallidos el acceso se bloquea cinco minutos, y la sesión expira a las ocho horas. Toda escritura exige una sesión vigente, y las pestañas abiertas reaccionan al cierre de sesión: así una pestaña olvidada no puede seguir mostrando datos de salud ni volver a crearlos después de eliminar la cuenta.',
    'Para la aplicación, la interfaz se construye siempre como texto y nunca como HTML, lo que neutraliza la inyección de código: una prueba publica un título con código malicioso y comprueba que se muestra como texto y no se ejecuta. Otra prueba revisa que ningún archivo fuente use funciones peligrosas. Una política de seguridad de contenido impide ejecutar scripts ajenos (MDN, s. f.-a). El sitio tampoco hace peticiones a terceros: el MVP cargaba fuentes y fotos de servicios externos, lo que exponía la dirección IP de cada visitante.',
    'Para la privacidad se aplicó la Ley 1581 de 2012: autorización separada para datos personales y de salud, con fecha y versión registradas. Los derechos del artículo 8 son acciones reales en la pantalla Mi perfil: exportar la información, borrar el perfil de salud revocando la autorización y eliminar la cuenta con todos sus datos.',
    'Este análisis no estaría completo sin sus límites. Sin servidor, las reglas se ejecutan en el navegador de la persona, de modo que la separación de roles organiza la interfaz pero no sería una barrera real frente a alguien que manipule su propio navegador. El perfil de salud se guarda sin cifrar en ese dispositivo, y las cuentas de demostración son públicas a propósito. Además, en GitHub Pages el almacenamiento se comparte entre los proyectos publicados bajo una misma cuenta. Un producto real exigiría que la autenticación, los permisos y el almacenamiento cifrado estuvieran en un servidor. Por honestidad con el alcance, tampoco se incluyó la recuperación de contraseña por correo, ya que sin servidor solo podría simularse.',
  ));

  agregar(sub('RNF4. Experiencia de usuario'), p(
    'Se interpretó como la suma de tres cosas: que la página sea clara, que sea consistente y que pueda ser usada por todas las personas. Por eso se adoptó WCAG 2.2 nivel AA (World Wide Web Consortium [W3C], 2024) como referencia de accesibilidad y las diez heurísticas de Nielsen (1994/2024) como guía de usabilidad.',
    `En el MVP, axe encontró 20 elementos con contraste insuficiente: su color de acento alcanzaba 2,43:1, cuando el mínimo es 4,5:1. El color se oscureció hasta 5,24:1 sin perder la identidad, y una prueba automática lee los colores del proyecto y falla si alguno baja del mínimo. La herramienta axe, ejecutada en ${MEDIDAS.rutasAuditadas} pantallas y estados, no reporta violaciones. La navegación completa funciona con teclado, los diálogos atrapan el foco y el contenido respeta la preferencia de reducir el movimiento. La {{tab:nielsen}} resume cómo se aplicó cada heurística.`,
  ), tab('Aplicación de las heurísticas de Nielsen', ['Heurística', 'Cómo se aplicó'], [
    ['Visibilidad del estado del sistema', 'Avisos tras cada acción, avance del asistente y contador de resultados.'],
    ['Relación con el mundo real', 'Lenguaje cotidiano: «Para ti», «No me interesa», «Cómo hacerlo».'],
    ['Control y libertad del usuario', 'Deshacer al descartar, omitir el perfil y cancelar en los diálogos.'],
    ['Consistencia y estándares', 'Una sola biblioteca de componentes en todas las pantallas.'],
    ['Prevención de errores', 'Confirmación de acciones destructivas y validación antes de guardar.'],
    ['Reconocer antes que recordar', 'Filtros activos visibles y opciones como tarjetas.'],
    ['Flexibilidad y eficiencia', 'Accesos directos desde el inicio y URL compartibles.'],
    ['Diseño estético y minimalista', 'Una acción principal por pantalla y jerarquía tipográfica clara.'],
    ['Ayuda frente a los errores', 'Mensajes junto al campo, con la solución, y foco en el primer error.'],
    ['Ayuda y documentación', 'Textos de ayuda en los campos y estados vacíos que orientan.'],
  ], { anchos: ['38%', '62%'], clave: 'nielsen' }), p(
    'Una limitación debe quedar clara: no se hicieron pruebas de usabilidad con personas reales. Las verificaciones son automáticas y de revisión por criterios, de modo que comprueban que la interfaz cumple reglas conocidas, pero no reemplazan observar a un usuario real. Sería el siguiente paso natural.',
  ));

  agregar(sub('RNF5. Compatibilidad con dispositivos'), p(
    'El requerimiento se interpretó en dos dimensiones: el tamaño de pantalla y el navegador. Los wireframes parten del escritorio porque ahí se aprecia mejor la estructura completa, y W13 define su adaptación. En la construcción se hizo lo contrario: como buena parte del público consultaría la página desde el teléfono, los estilos se escribieron primero para móvil y luego se ampliaron.',
    'La versión móvil reorganiza la interfaz (W13): el menú pasa a una barra inferior al alcance del pulgar, las columnas se apilan y los filtros se pliegan. Los controles principales miden al menos 44 píxeles de alto en móvil, lo que se comprueba en Explorar y en Hábitos. El MVP tenía un defecto medido: a 360 píxeles el contenido medía 397 y obligaba a desplazarse de lado.',
    `Se automatizó la verificación en los tres motores de navegador más usados (Chromium, Firefox y WebKit) y en un teléfono emulado. No hay desbordamiento horizontal en ninguna pantalla a 360, 768 y 1366 píxeles. En total se ejecutaron ${MEDIDAS.pruebasE2E} pruebas de extremo a extremo y ${MEDIDAS.pruebasUnitarias} pruebas unitarias, todas exitosas en tres corridas consecutivas. Se omiten a propósito ${MEDIDAS.pruebasOmitidas} casos que no aplican: la descarga de archivos en WebKit y en el perfil móvil, que se verifica en los motores de escritorio, y la navegación con Tab en WebKit, que por defecto no enfoca los enlaces. Esta validación usa emulación: abrir el enlace publicado en un teléfono físico es un paso que el equipo debe completar.`,
  ));

  // ─────────────────────────── WIREFRAME ───────────────────────────
  agregar(seccion('Wireframe'), p(
    'Los wireframes se construyeron antes que el resto del proyecto, en escala de grises, sin tipografía definitiva y con marcadores en lugar de imágenes, tal como pide la guía. Trabajar en baja fidelidad obligó a resolver primero la estructura: al no haber colores ni fotos que distraigan, solo queda la pregunta de qué va dónde y qué es más importante. Los números en cada figura corresponden a las zonas explicadas debajo.',
  ), sub('Mapa de pantallas'), p(
    'El mapa organiza la página en tres zonas según el tipo de usuario. Las líneas continuas son navegación directa y las punteadas, transiciones condicionadas. Se decidió que la zona pública fuera amplia: buscar y leer no exigen cuenta, y el registro solo se pide cuando aporta valor, como al guardar un favorito.',
  ), fig('../design/wireframes/png/w00-mapa-pantallas.png', 'Mapa de pantallas y relación de navegación entre ellas'));

  for (const w of PANTALLAS) {
    agregar(`<div class="grupo nueva-pagina">${sub(`${w.id}. ${w.titulo[0].toUpperCase()}${w.titulo.slice(1)}`)}${p(w.explicacion)}${fig(`../design/wireframes/png/${w.archivo}.png`, TITULO_WIREFRAME[w.id], { maxAlto: w.zonas.length >= 6 ? '11cm' : w.zonas.length === 5 ? '12.4cm' : '14.8cm' })}${lista(w.zonas, 'ol')}</div>`);
  }

  agregar('<div class="grupo">', sub('Cobertura de los requerimientos funcionales'), p(
    'La guía pide verificar que todos los requerimientos funcionales tengan un espacio dentro de la estructura propuesta. La {{tab:cobertura}} lo confirma.',
  ), tab('Cobertura de los requerimientos funcionales en los wireframes', ['Requerimiento', 'Pantallas'], [
    ['RF1. Gestión de usuarios y perfil de salud', 'W2, W3, W4, W10'],
    ['RF2. Gestión de contenidos saludables', 'W1, W7, W11, W12'],
    ['RF3. Búsqueda y filtrado', 'W1, W6, W13'],
    ['RF4. Personalización de recomendaciones', 'W4, W5, W7'],
    ['RF5. Favoritos y seguimiento de hábitos', 'W7, W8, W9'],
  ], { anchos: ['65%', '35%'], clave: 'cobertura' }), '</div>');

  // ─────────────────────────── MOCKUP ───────────────────────────
  agregar(seccion('Mockup'), p(
    'El mockup aplica la identidad visual sobre la estructura del wireframe. Primero se definió el sistema visual: paleta, tipografía, iconografía y componentes. Con él se maquetó cada pantalla directamente en el navegador, con datos de demostración, al mismo tiempo que se construía la interfaz. Las imágenes de esta sección son capturas de esas pantallas, generadas con un script.',
    'Este orden difiere del flujo clásico, en el que el mockup es un archivo independiente que se termina antes de programar. Se eligió porque evita que lo diseñado y lo construido se separen: en el MVP, los mockups mostraban fotografías distintas a las del producto. A cambio, el mockup no existió como una etapa cerrada antes del prototipo, lo que se deja declarado.',
    'Se conservó la identidad del MVP: el nombre, la combinación de tinta, crema y lima, y la composición dividida de la portada. El problema del proyecto original no era su estética sino su alcance, de modo que rehacer la marca habría sido un esfuerzo sin retorno.',
  ), sub('Paleta de colores'), p(
    'La tinta y la crema dan una base cálida y sobria, alejada del blanco clínico de muchos sitios de salud. El lima aporta energía y se reserva para la acción principal, de modo que siempre es claro qué hacer. El lima tiene poco contraste sobre fondos claros, por lo que en ellos nunca se usa como color de texto: en ese papel lo reemplaza el oliva. Solo aparece como texto sobre la tinta, en el pie de página. Cada categoría tiene un color propio, siempre acompañado de su nombre y su icono, porque el color no debe ser el único medio para comunicar algo (W3C, 2024). La {{tab:contraste}} compara el contraste de los pares principales con el del MVP.',
  ), fig('../design/mockups/sistema-paleta.png', 'Paleta de colores y contraste calculado de cada combinación', { maxAlto: '10cm' }), tab('Verificación de contraste de los pares de texto principales', ['Texto / fondo', 'MVP', 'Prototipo', 'Mínimo AA'], [
    ['Acento sobre crema', '2,43:1', '5,24:1', '4,5:1'],
    ['Acento sobre papel', '2,72:1', '5,87:1', '4,5:1'],
    ['Texto secundario sobre crema', '3,76:1', '5,88:1', '4,5:1'],
    ['Texto secundario sobre papel', '4,21:1', '6,58:1', '4,5:1'],
    ['Texto de marcador sobre campo', '3,17:1', '5,71:1', '4,5:1'],
    ['Tinta sobre lima (botón)', '12,55:1', '12,55:1', '4,5:1'],
  ], { anchos: ['46%', '18%', '18%', '18%'], clave: 'contraste' }), sub('Tipografía'), p(
    'Se usan dos familias con funciones separadas. Barlow Condensed (Tribby, s. f.), de trazo condensado y fuerte, da carácter a los títulos y permite textos grandes en poco espacio, algo clave en móvil. Montserrat (Ulanovsky et al., s. f.) se usa en el texto por su buena legibilidad en pantalla. Las dos se alojan en el propio sitio. El tamaño base del texto y de los campos es de 16 píxeles.',
  ), fig('../design/mockups/sistema-tipografia.png', 'Tipografía y escala de tamaños', { maxAlto: '11cm' }), sub('Iconografía e imágenes'), p(
    'Se eligió la familia Lucide (s. f.) por su trazo uniforme de 2 píxeles, que combina con la tipografía y mantiene un tono simple. Los iconos siempre acompañan a un texto o tienen una etiqueta accesible. Las fotografías provienen de Unsplash, cuya licencia permite este uso (Unsplash, s. f.). Se seleccionaron por categoría y se optimizaron para la web. Mientras el MVP las cargaba desde un servicio externo, aquí se alojan en el propio sitio.',
  ), fig('../design/mockups/sistema-iconografia.png', 'Iconografía del sistema', { maxAlto: '8cm' }), sub('Composición y componentes'), p(
    'La composición sigue una retícula simple. El contenido se limita a 1280 píxeles de ancho, y las tarjetas se ordenan en una, dos o tres columnas según el espacio disponible, de modo que las líneas de lectura se mantienen cómodas en cualquier pantalla. El espaciado parte de una escala de 4 y 8 píxeles que da ritmo y relaciona los elementos: lo cercano pertenece al mismo grupo.',
    'La jerarquía se construye con tamaño y contraste. Cada pantalla tiene un solo título principal, en Barlow Condensed; le siguen los títulos de sección, y el texto secundario va en gris. El lima aparece en una sola acción por zona, de manera que el ojo llega a ella sin competencia. El equilibrio de la portada viene del MVP: una columna de texto a la izquierda compensa el peso visual de la fotografía de la derecha. En las pantallas de trabajo, como Hábitos, la columna ancha se dedica a la tarea y la angosta a la consulta.',
    'Todas las pantallas se construyen con una sola biblioteca de componentes, lo que garantiza que un botón se vea y se comporte igual en todo el sitio.',
  ), fig('../design/mockups/sistema-componentes.png', 'Biblioteca de componentes', { maxAlto: '12cm' }), sub('Pantallas de alta fidelidad'), p('Cada mockup corresponde al wireframe indicado en su título. Las pantallas más largas se dividen en dos figuras para conservar la legibilidad.'));

  const MOCKUPS = [
    ['m01-inicio', 'Mockup de la pantalla de inicio, parte superior (W1)', 'Conserva la composición del MVP y agrega el buscador sobre la fotografía. Las categorías toman sus colores, lo que anticipa la organización del sitio.'],
    ['m01-inicio-2', 'Mockup de la pantalla de inicio, parte inferior (W1)', 'Las tarjetas destacadas conservan el estilo del MVP, y ahora toda la tarjeta es un enlace.'],
    ['m02-ingreso', 'Mockup de la pantalla de ingreso (W2)', 'El formulario flota sobre la fotografía. La pestaña activa ahora se distingue con claridad, lo que corrige un defecto del MVP.'],
    ['m03-registro', 'Mockup de la pantalla de registro (W3)', 'Las casillas de autorización quedan sin marcar y visibles antes del botón principal.'],
    ['m04-perfil-salud', 'Mockup del asistente de perfil de salud (W4)', 'El aviso azul explica que los datos son sensibles antes de pedirlos.'],
    ['m05-para-ti', 'Mockup del panel «Para ti», parte superior (W5)', 'Los indicadores van primero y el plan de hoy reúne una acción por categoría.'],
    ['m05-para-ti-2', 'Mockup del panel «Para ti», parte inferior (W5)', 'El verde claro distingue las razones de la sugerencia del resto del contenido.'],
    ['m06-explorar', 'Mockup de explorar con filtros aplicados (W6)', 'Las etiquetas negras muestran los filtros activos y se pueden quitar con un toque.'],
    ['m07-detalle', 'Mockup del detalle de una recomendación (W7)', 'La fuente tiene su propio bloque, al mismo nivel que los beneficios.'],
    ['m08-favoritos', 'Mockup de favoritos (W8)', 'El corazón relleno comunica el estado sin depender solo del color.'],
    ['m09-habitos', 'Mockup del seguimiento de hábitos (W9)', 'El oliva marca los días cumplidos y el borde resalta el día actual.'],
    ['m10-mi-perfil', 'Mockup de privacidad y datos (W10)', 'Las acciones irreversibles quedan aisladas en un bloque con borde rojo.'],
    ['m11-admin-listado', 'Mockup de la administración de contenidos (W11)', 'La tabla usa etiquetas de estado, y los borradores van primero porque requieren atención.'],
    ['m12-admin-formulario', 'Mockup del formulario de contenidos (W12)', 'Los bloques de la derecha separan clasificación, reglas de seguridad y fuente.'],
  ];
  for (const [archivo, titulo, nota] of MOCKUPS) agregar(`<div class="grupo">${p(nota)}${fig(`../design/mockups/escritorio/${archivo}.png`, titulo, { maxAlto: '18cm' })}</div>`);
  agregar(sub('Adaptación a móvil'), p(
    'Se verificó la adaptación de cada pantalla a distintos tamaños. En el teléfono, los elementos se apilan, la navegación pasa a la barra inferior y la pantalla conserva una sola acción principal.',
  ), figVarias(['../design/mockups/movil/inicio.png', '../design/mockups/movil/explorar.png', '../design/mockups/movil/para-ti.png'], 'Mockups móviles de inicio, explorar y panel personalizado'),
  figVarias(['../design/mockups/movil/detalle.png', '../design/mockups/movil/habitos.png', '../design/mockups/movil/ingreso.png'], 'Mockups móviles de detalle, hábitos e ingreso'));

  // ─────────────────────────── PROTOTIPO ───────────────────────────
  agregar(seccion('Prototipo'), sub('Enlace y acceso'), p(
    `El prototipo está publicado y se puede abrir sin instalar nada: ${enlace(CONFIG.urlPrototipo)}. El código fuente está disponible en ${enlace(CONFIG.urlRepositorio)}. La primera versión del informe enlazaba a una dirección local que solo funcionaba en el computador del autor; publicar el prototipo resuelve ese problema.`,
    'Para evaluarlo no hace falta registrarse. La pantalla de ingreso tiene dos botones de demostración: uno para un usuario de ejemplo, con perfil y ocho semanas de historial, y otro para el administrador. Los datos se guardan en cada navegador, y el enlace «Restablecer datos de demostración» del pie de página los devuelve a su estado inicial.',
  ), sub('Verificación en el sitio publicado'), p(
    'Una vez publicado, se repitió el recorrido principal sobre la dirección real: portada, búsqueda, ingreso con la cuenta de demostración, persistencia de la sesión, registro de un hábito, administración y vista móvil. No hubo errores de consola, recursos rotos ni peticiones a terceros.',
  ), sub('Construcción'), p(
    'A diferencia de un prototipo en una herramienta de diseño, que simula la interacción con zonas enlazadas, este es una aplicación que funciona: los datos persisten, las búsquedas se calculan y las recomendaciones cambian según el perfil. Se construyó sobre el código del MVP con HTML, CSS y JavaScript sin framework, lo que mantiene el proyecto legible y sin paso de compilación. Se publica como sitio estático porque la guía pide un enlace con permisos de visualización que el docente pueda abrir, y un sitio estático no tiene tiempo de arranque ni costo de operación.',
  ), fig('../design/arquitectura.png', 'Arquitectura por capas del prototipo', { maxAlto: '12cm', clave: 'arquitectura' }), sub('Flujos de navegación implementados'), p(
    'Las capturas siguientes se generaron recorriendo cada flujo con clics reales, mediante un script que forma parte del proyecto.',
  ));

  const FLUJOS = [
    ['Flujo 1. Buscar y consultar una recomendación', 'Un visitante escribe qué busca desde el inicio, acota los resultados y abre el detalle, sin necesidad de registrarse.', [['f1-1-buscar', 'Búsqueda desde la pantalla de inicio'], ['f1-2-resultados', 'Resultados con un filtro aplicado'], ['f1-3-detalle', 'Detalle de la recomendación elegida']]],
    ['Flujo 2. Registrarse y recibir un plan', 'Si el formulario tiene errores, cada uno se explica junto a su campo. Luego la persona completa el asistente y recibe su plan.', [['f2-1-validacion', 'Validación del formulario de registro'], ['f2-2-objetivo', 'Elección del objetivo en el asistente'], ['f2-3-plan', 'Plan personalizado resultante']]],
    ['Flujo 3. Guardar en favoritos', 'Si alguien intenta guardar sin sesión, el sistema le pide ingresar y, al hacerlo, lo regresa a la misma recomendación para que guarde con un toque.', [['f3-0-ingresar', 'Solicitud de ingreso al guardar sin sesión'], ['f3-1-guardar', 'Recomendación guardada'], ['f3-2-favoritos', 'Pantalla de favoritos']]],
    ['Flujo 4. Crear y seguir un hábito', 'Desde una recomendación se crea un hábito con su meta semanal y se marca el día con un toque.', [['f4-1-crear-habito', 'Creación de un hábito'], ['f4-2-marcar', 'Seguimiento con el día marcado']]],
    ['Flujo 5. Administrar contenidos', 'El administrador crea una recomendación y esta aparece de inmediato en la búsqueda pública.', [['f5-1-formulario', 'Formulario de nueva recomendación'], ['f5-2-publicado', 'Contenido publicado en la búsqueda pública']]],
  ];
  for (const [titulo, texto, pasos] of FLUJOS) {
    const figuras = pasos.map(([a, t]) => fig(`../design/prototipo/${a}.png`, t, { maxAlto: a === 'f4-2-marcar' ? '17cm' : '10.5cm' }));
    agregar(`<div class="grupo">${subsub(titulo)}${p(texto)}${figuras[0]}</div>`, ...figuras.slice(1));
  }

  agregar(sub('Pruebas y errores corregidos'), p(
    `La guía pide probar el prototipo y corregir los errores encontrados. El proyecto incluye ${MEDIDAS.pruebasUnitarias} pruebas unitarias y ${MEDIDAS.pruebasE2E} de extremo a extremo, repartidas en Chromium, Firefox, WebKit y un teléfono emulado, que recorren los flujos anteriores y fallan si aparece un error inesperado en la consola del navegador. Además, se hizo una revisión independiente enfocada en romper la aplicación, con casos que las pruebas no cubrían: varias pestañas, almacenamiento bloqueado, datos alterados y direcciones manipuladas. La {{tab:errores}} resume los defectos más relevantes. Cada corrección quedó con su prueba, para que el error no regrese.`,
  ), tab('Errores de navegación o interacción identificados y corregidos', ['Error encontrado', 'Cómo se detectó', 'Corrección'], [
    ['«También te puede servir» sugería cardio intenso a una persona con dolor de rodilla', 'Revisión independiente', 'Las relacionadas pasan por la misma regla de seguridad del motor.'],
    ['Tras eliminar una cuenta, otra pestaña podía volver a crear sus datos de salud', 'Revisión independiente', 'Toda escritura exige sesión vigente y las pestañas reaccionan al cambio.'],
    ['Pantalla en blanco si el navegador bloquea el almacenamiento', 'Revisión independiente', 'La aplicación continúa en memoria y lo avisa.'],
    ['El botón Atrás quedaba atrapado después de ingresar', 'Revisión independiente', 'Las redirecciones ya no agregan entradas al historial.'],
    ['Enter en un borrador lo publicaba', 'Revisión independiente', 'Enter conserva el estado; publicar exige el botón.'],
    ['La palabra «false» aparecía en pantalla', 'Revisión visual', 'Se corrigió la causa y se agregó una prueba que busca texto indebido en todas las pantallas.'],
    ['El enlace «Saltar al contenido» no se alcanzaba con el teclado', 'Prueba de teclado', 'La aplicación dejó de mover el foco en la primera carga.'],
    ['La etiqueta accesible del logo no coincidía con su texto visible', 'axe', 'Se unificó el texto (criterio 2.5.3 de WCAG).'],
    ['El borde de los controles no alcanzaba 3:1 sobre crema', 'Prueba de contraste', 'Se oscureció el color del borde.'],
    ['Rendimiento móvil de 87, por debajo de la meta', 'Lighthouse', 'Se declaró la precarga de los módulos.'],
  ], { anchos: ['38%', '20%', '42%'], clave: 'errores' }));

  // ─────────────────────────── CONCLUSIONES ───────────────────────────
  agregar(seccion('Conclusiones'), lista([
    'La mejora más importante no fue técnica, sino de lectura. El MVP estaba bien presentado, pero resolvía otra temática: ejercicios en vez de recomendaciones saludables. Contrastar cada entregable con la guía antes de construir evitó invertir esfuerzo en la dirección equivocada.',
    'Diseñar de lo general a lo particular reduce el retrabajo. Los wireframes obligaron a decidir qué era importante antes de pensar en el aspecto, y detectaron carencias que el MVP ocultaba tras su buena apariencia, como la ausencia de un lugar para buscar o para seguir hábitos.',
    'El diseño centrado en el usuario va más allá de la estética. Decisiones como que el perfil de salud sea opcional, explicar cada sugerencia o no dar por perdida una racha antes de que termine el día salen de pensar en la persona y en sus derechos. La protección de los datos de salud dejó de ser un tema legal y se convirtió en una decisión de interfaz.',
    'La calidad debe medirse, no suponerse. El contraste del MVP parecía aceptable a simple vista y no lo era. Las pruebas encontraron defectos que una revisión visual no detectó, una revisión visual encontró otros que las pruebas no habrían visto, y una revisión independiente halló errores serios que ninguna de las dos había considerado, como sugerir un entrenamiento intenso a alguien con dolor de rodilla. Una suite que pasa solo demuestra lo que se pensó en probar. Medir también obligó a buscar la causa cuando el rendimiento móvil no alcanzó la meta.',
    'La principal dificultad fue equilibrar lo funcional con las limitaciones de un sitio sin servidor. Se decidió retirar lo que solo podría simularse, como la recuperación de contraseña por correo, y declarar los límites de seguridad. El siguiente paso natural es realizar pruebas de usabilidad con personas reales, que este proyecto no incluyó, y llevar la autenticación y los datos a un servidor.',
  ], 'ol'));

  // ─────────────────────────── REFERENCIAS ───────────────────────────
  agregar(seccion('Referencias'), `<div class="referencias">${[
    'American Psychological Association. (2020). <em>Publication manual of the American Psychological Association</em> (7.ª ed.). <a href="https://doi.org/10.1037/0000165-000">https://doi.org/10.1037/0000165-000</a>',
    'Anthropic. (2026). <em>Claude Code</em> [Asistente de programación con inteligencia artificial]. <a href="https://claude.com/claude-code">https://claude.com/claude-code</a>',
    'Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., Grenning, J., Highsmith, J., Hunt, A., Jeffries, R., Kern, J., Marick, B., Martin, R. C., Mellor, S., Schwaber, K., Sutherland, J. y Thomas, D. (2001). <em>Manifiesto por el desarrollo ágil de software</em>. <a href="https://agilemanifesto.org/iso/es/manifesto.html">https://agilemanifesto.org/iso/es/manifesto.html</a>',
    'Centers for Disease Control and Prevention. (2024, 15 de mayo). <em>About sleep</em>. <a href="https://www.cdc.gov/sleep/about/index.html">https://www.cdc.gov/sleep/about/index.html</a>',
    'Congreso de la República de Colombia. (2012, 17 de octubre). <em>Ley Estatutaria 1581 de 2012: Por la cual se dictan disposiciones generales para la protección de datos personales</em>. <a href="https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981">https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981</a>',
    'Corporación Unificada Nacional de Educación Superior. (2026). <em>Guía de Actividad de Construcción Aplicada (ACA): Ingeniería Web</em> [Documento de curso]. CUN Digital.',
    'Deque Systems. (2026). <em>axe-core</em> [Software]. GitHub. <a href="https://github.com/dequelabs/axe-core">https://github.com/dequelabs/axe-core</a>',
    'Google. (2026). <em>Lighthouse</em> (versión 13.6) [Software]. <a href="https://developer.chrome.com/docs/lighthouse/overview">https://developer.chrome.com/docs/lighthouse/overview</a>',
    'Instituto Colombiano de Bienestar Familiar y Organización de las Naciones Unidas para la Alimentación y la Agricultura. (2020). <em>Guías Alimentarias Basadas en Alimentos para la población colombiana mayor de 2 años: Documento técnico</em>. <a href="https://www.minambiente.gov.co/wp-content/uploads/2023/11/guias_alimentarias_basadas_en_alimentos_para_la_poblacion_colombiana_mayor_de_2_anos_0.pdf">https://www.minambiente.gov.co/wp-content/uploads/2023/11/guias_alimentarias_basadas_en_alimentos_para_la_poblacion_colombiana_mayor_de_2_anos_0.pdf</a>',
    'Lucide. (s. f.). <em>Lucide icons</em> [Iconografía]. <a href="https://lucide.dev">https://lucide.dev</a>',
    'Microsoft. (2026). <em>Playwright</em> (versión 1.65) [Software]. <a href="https://playwright.dev">https://playwright.dev</a>',
    'Mozilla Developer Network. (s. f.-a). <em>Content Security Policy (CSP)</em>. MDN Web Docs. <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP">https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP</a>',
    'Mozilla Developer Network. (s. f.-b). <em>Web Crypto API</em>. MDN Web Docs. <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API">https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API</a>',
    'Nielsen, J. (2024, 30 de enero). <em>10 usability heuristics for user interface design</em>. Nielsen Norman Group. <a href="https://www.nngroup.com/articles/ten-usability-heuristics/">https://www.nngroup.com/articles/ten-usability-heuristics/</a> (Trabajo original publicado en 1994)',
    'Organización Mundial de la Salud. (2026a, 26 de enero). <em>Alimentación sana</em>. <a href="https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet">https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet</a>',
    'Organización Mundial de la Salud. (2026b, 30 de marzo). <em>Stress</em>. <a href="https://www.who.int/news-room/questions-and-answers/item/stress">https://www.who.int/news-room/questions-and-answers/item/stress</a>',
    'Organización Mundial de la Salud. (2026c, 7 de octubre). <em>Obesidad y sobrepeso</em>. <a href="https://www.who.int/es/news-room/fact-sheets/detail/obesity-and-overweight">https://www.who.int/es/news-room/fact-sheets/detail/obesity-and-overweight</a>',
    'Organización Mundial de la Salud. (2026d, 4 de noviembre). <em>Actividad física</em>. <a href="https://www.who.int/es/news-room/fact-sheets/detail/physical-activity">https://www.who.int/es/news-room/fact-sheets/detail/physical-activity</a>',
    'Organización Panamericana de la Salud. (2020, 26 de noviembre). <em>Cada movimiento cuenta para mejorar la salud, dice la OMS</em>. <a href="https://www.paho.org/es/noticias/26-11-2020-cada-movimiento-cuenta-para-mejorar-salud-dice-oms">https://www.paho.org/es/noticias/26-11-2020-cada-movimiento-cuenta-para-mejorar-salud-dice-oms</a>',
    'OWASP Foundation. (s. f.). <em>Password storage cheat sheet</em>. OWASP Cheat Sheet Series. <a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html">https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html</a>',
    'Presidencia de la República de Colombia. (2013, 27 de junio). <em>Decreto 1377 de 2013: Por el cual se reglamenta parcialmente la Ley 1581 de 2012</em>. <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646">https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646</a>',
    'Tribby, J. (s. f.). <em>Barlow Condensed</em> [Tipografía]. Google Fonts. <a href="https://fonts.google.com/specimen/Barlow+Condensed">https://fonts.google.com/specimen/Barlow+Condensed</a>',
    'Ulanovsky, J., Matas, S., del Peral, J. P. y Le Bailly, J. (s. f.). <em>Montserrat</em> [Tipografía]. Google Fonts. <a href="https://fonts.google.com/specimen/Montserrat">https://fonts.google.com/specimen/Montserrat</a>',
    'Unsplash. (s. f.). <em>Unsplash license</em>. <a href="https://unsplash.com/license">https://unsplash.com/license</a>',
    'Watson, N. F., Badr, M. S., Belenky, G., Bliwise, D. L., Buxton, O. M., Buysse, D., Dinges, D. F., Gangwisch, J., Grandner, M. A., Kushida, C., Malhotra, R. K., Martin, J. L., Patel, S. R., Quan, S. F. y Tasali, E. (2015). Recommended amount of sleep for a healthy adult: A joint consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. <em>Sleep, 38</em>(6), 843-844. <a href="https://doi.org/10.5665/sleep.4716">https://doi.org/10.5665/sleep.4716</a>',
    'World Wide Web Consortium. (2024, 12 de diciembre). <em>Web Content Accessibility Guidelines (WCAG) 2.2</em>. <a href="https://www.w3.org/TR/WCAG22/">https://www.w3.org/TR/WCAG22/</a>',
  ].map((r) => `<p>${r}</p>`).join('')}</div>`);

  // ─────────────────────────── ANEXO ───────────────────────────
  agregar(seccion('Anexo A. Distribución del trabajo del equipo'), p(
    'El proyecto se desarrolló en dos etapas. En la primera se creó el MVP, que definió la marca y la identidad visual. En la segunda, el MVP se contrastó con la guía y se transformó en la solución final, conservando esa identidad. La {{tab:aportes}} registra las responsabilidades de cada integrante. Las actividades de construcción y redacción contaron con el apoyo del asistente de inteligencia artificial declarado en la Introducción.',
  ), tab('Responsabilidades de cada integrante', ['Integrante', 'Responsabilidades'], CONFIG.aportes.map((a) => [a.integrante, `<ul>${a.aporte.map((x) => `<li>${x}</li>`).join('')}</ul>`]), { anchos: ['30%', '70%'], clave: 'aportes' }));

  // Los números de figuras y tablas se calculan: una referencia cruzada no puede quedar desactualizada.
  return partes.join('\n').replace(/\{\{(fig|tab):(\w+)\}\}/g, (_, tipo, clave) => {
    const n = numeros[`${tipo}:${clave}`];
    if (!n) throw new Error(`Referencia cruzada sin destino: ${tipo}:${clave}`);
    return `${tipo === 'fig' ? 'Figura' : 'Tabla'} ${n}`;
  });
}

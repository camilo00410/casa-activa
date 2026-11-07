# 01 · Diagnóstico del MVP frente a la guía del ACA

**Fecha:** 6 de noviembre de 2026 · **Entrega del ACA:** 8 de noviembre de 2026

**Fuentes revisadas:** `ACA ingeniería web.pdf` (guía, 7 pp.), `ing_web -.pdf` (informe actual, 7 pp.) y repositorio
`github.com/edwinpaez/ingenieria_web` (commit `0af1afd`). El MVP se ejecutó en Chromium y se midió con axe-core. Cada
afirmación marcada **[medido]** tiene evidencia reproducible; las capturas están en `docs/evidencias/linea-base/`.

---

## 1. Hallazgo principal: qué evalúa realmente el ACA

El ACA **no es una actividad de programación**: es una actividad de **diseño de interfaz con informe en PDF**.

| Ítem de la rúbrica | Peso | Dónde se gana |
|---|---:|---|
| Wireframe | 20 % | Informe, sección 6 |
| Mockup | 20 % | Informe, sección 7 |
| Prototipo | 20 % | Enlace navegable + informe, sección 8 |
| Análisis de requerimientos funcionales | 15 % | Informe, sección 4 |
| Análisis de requerimientos no funcionales | 15 % | Informe, sección 5 + reflejo real en el proyecto |
| Trabajo en grupo | 10 % | Evidencia de participación equilibrada |

Consecuencias para este proyecto:

- **El 70 % de la nota se juega en el PDF.** Un software excelente con un informe débil no alcanza la máxima nota.
- El código aporta sobre todo al 20 % de Prototipo y al 15 % de RNF. Pruebas y arquitectura valen porque **sustentan
  esos criterios**, no como fin en sí mismos.
- Un prototipo funcional real supera lo que pide la guía, que acepta un enlace de Figma. Por eso hay que evitar que el
  esfuerzo en código desplace a wireframes, mockups y análisis.

## 2. Diagnóstico del MVP

### 2.1 Desviación crítica de la temática

La guía exige **«Página de recomendaciones saludables»** con listados de **alimentación, actividad física, descanso y
bienestar**. El MVP y el informe la redujeron a *«ejercicios saludables en casa»*: **solo 1 de las 4 categorías**.
Esto afecta a los seis criterios, porque ningún entregable representa la página solicitada.

### 2.2 Cobertura funcional [medido]

| Requerimiento | Estado | Evidencia |
|---|---|---|
| RF1 Gestión de usuarios y perfil de salud | **Pendiente** (solo maqueta) | Formularios con `action="#"`. Al enviar, solo cambia la URL a `/#`; `localStorage` queda con 0 claves. Hay 0 etiquetas `<script>`. No existe perfil de salud. |
| RF2 Gestión de contenidos saludables | **Parcial mínimo** | 3 tarjetas fijas en HTML, una sola categoría, sin detalle, sin fuentes y sin forma de administrarlas. |
| RF3 Búsqueda y filtrado | **Pendiente** | No hay buscador ni filtros. |
| RF4 Personalización | **Pendiente** | La portada anuncia «Rutinas personalizadas» pero nada se personaliza: es una promesa falsa frente al docente. |
| RF5 Favoritos y hábitos | **Pendiente** | No existen. |

### 2.3 Defectos técnicos [medido]

| # | Severidad | Defecto | Ubicación |
|---|---|---|---|
| D1 | Alta | Atributo mal cerrado: `href="…&t=2sz class="`. El tercer botón pierde la clase `btn-play` y su URL queda corrupta. En pantalla, la tarjeta 3 no tiene botón visible. | `index.html:340` |
| D2 | Alta | Inconsistencia de contenido: «Cardio suave · bajo impacto» enlaza a un video titulado *«HIIT… Cardio Intenso»*. Para un sitio de salud es un error de fondo. | `index.html:310` |
| D3 | Alta | **20 violaciones de contraste** detectadas por axe (WCAG 1.4.3). El acento `#83a900` sobre crema da **2,43:1**, y sobre blanco de formulario **2,72:1**. El mínimo AA es 4,5:1. | `estilos.css` |
| D4 | Alta | **Desbordamiento horizontal en móvil**: a 360 px el documento mide 397 px. | `.navbar` |
| D5 | Media | La pestaña activa no se distingue: `.activa` no tiene estilos en el CSS. | `estilos.css` |
| D6 | Media | Ingreso y Registro se muestran apilados; las «pestañas» solo desplazan la página. | `index.html` |
| D7 | Media | Enlace muerto: `#recuperar` no existe en el documento. | `index.html:140` |
| D8 | Media | Jerarquía semántica incorrecta: un `<h2>` (logo) precede al `<h1>`, y `CASAACTIVA` se repite como `<h2>` en el pie. | `index.html:32,367` |
| D9 | Media | Imágenes enlazadas a un servicio externo, sin `width/height` ni carga diferida; provocan saltos de diseño. | 3 de 3 `<img>` |
| D10 | Media | Tarjetas con `cursor: pointer` donde solo es clicable un botón pequeño. Los videos sacan al usuario del sitio. | `.rutina-card` |
| D11 | Baja | Sin `meta description` ni favicon; dependencia de Google Fonts, que expone la IP del visitante a un tercero. | `<head>` |
| D12 | Baja | `outline: none` en campos. La «MOVILIDAD» usa una foto al aire libre en una marca «desde casa». | `estilos.css:248` |

**Lo que vale la pena conservar:** la identidad visual (marca Casa Activa, Barlow Condensed + Montserrat, combinación
tinta/crema/lima), la composición dividida del héroe, el estilo de tarjetas con imagen y los textos de marca. Es una
identidad fuerte y coherente; el problema es de alcance y de ejecución, no de estilo.

## 3. Diagnóstico del informe actual

| # | Sección exigida | Estado | Observación |
|---|---|---|---|
| 1 | Portada | **Parcial** | Tiene casi todos los datos, pero **un solo integrante** (mínimo son dos) y fecha distinta a la de entrega. |
| 2 | Introducción | **Falta** | Hay un «Propósito», sin temática, alcance, herramientas ni propósito del informe. |
| 3 | Objetivos | **Falta** | Se exige 1 general y 3–4 específicos en infinitivo. |
| 4 | Análisis RF | **Falta** | Define **RF-01 a RF-03 propios**, no RF1–RF5. Son enunciados, no análisis argumentado. |
| 5 | Análisis RNF | **Falta** | Define usabilidad, seguridad, accesibilidad y disponibilidad. Faltan rendimiento, escalabilidad y compatibilidad. Repite la numeración `RNF-03`. |
| 6 | Wireframe | **Muy insuficiente** | 2 pantallas, sin buscador, listados, perfil ni favoritos. Sin explicación de jerarquía. |
| 7 | Mockup | **Insuficiente** | Sin justificar paleta, tipografía, iconografía ni composición. Sus fotos **no coinciden** con las del prototipo. |
| 8 | Prototipo | **Crítico** | El enlace es `http://127.0.0.1:5501/index.html`, **que solo funciona en el computador del autor**. El docente no puede abrirlo. Sin flujos ni capturas. |
| 9 | Conclusiones | **Falta** | Un párrafo sin título; se exigen mínimo 3. Afirma haber cumplido los requerimientos, y eso no es cierto. |
| 10 | Referencias | **Falta** | No hay ninguna fuente citada. |

**Formato [medido]:** mezcla Aptos, Times New Roman y Arial (`pdffonts`). Se exige una sola: Arial 12 o Times New Roman 12.
Las figuras no están numeradas ni tituladas. El texto ronda 507 palabras.

## 4. Calificación estimada del estado actual

*Estimación propia con la rúbrica publicada; la calificación real la asigna el docente.*

| Ítem | Peso | Nivel probable | Nota estimada | Aporte |
|---|---:|---|---:|---:|
| Wireframe | 20 % | Incompleto | 2,2 | 0,44 |
| Mockup | 20 % | Básico a incompleto | 2,9 | 0,58 |
| Prototipo | 20 % | Incompleto (enlace inaccesible) | 2,0 | 0,40 |
| Análisis RF | 15 % | Incompleto | 1,5 | 0,23 |
| Análisis RNF | 15 % | Incompleto | 1,8 | 0,27 |
| Trabajo en grupo | 10 % | Sin evidencia | 1,5 | 0,15 |
| **Total** | | | | **≈ 2,1 / 5,0** |

## 5. Vacíos e inconsistencias de la guía

No se asumen: se declaran y se decide de forma explícita.

| # | Hallazgo | Tratamiento |
|---|---|---|
| I1 | La guía promete «el detalle de cada requerimiento en las secciones 4 y 5», pero esas secciones **solo traen los títulos**. | El alcance de cada RF/RNF se define por interpretación, y esa interpretación es justamente lo que el informe debe argumentar. |
| I2 | El texto dice «suma ponderada de los **cinco** criterios», pero la rúbrica tiene **seis** ítems que suman 100 %. | Se trabaja sobre los seis. |
| I3 | «Creatividad» es temática a evaluar y **no aparece en la rúbrica**. | Se cubre con la propuesta de marca, sin asignarle peso. |
| I4 | El **manual de citación de CUNDigital no está en los archivos**. Se localizó una guía del Sistema Nacional de Bibliotecas CUN cuyo extracto indexado señala **APA 7.ª ed.**, pero el repositorio bloquea descargas automáticas y **no se pudo leer completa**. | Se usa APA 7, coherente con las referencias de la propia guía. **Debe confirmarse contra el manual.** |
| I5 | Adobe XD está discontinuado e InVision cerró en 2024 (lo dice la propia guía). | Se descartan. La guía cita Figma como *ejemplo*, no como obligación. |
| I6 | La guía es **grupal (2–3 personas)** y el informe actual tiene un solo autor. | **No se pueden inventar integrantes ni evidencias.** Requiere dato del equipo. |
| I7 | Los metadatos del PDF de la guía dicen «recetas saludables», y el contenido, «recomendaciones saludables». | Prevalece el contenido visible. |

## 6. Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Sin publicar en una URL pública, el docente no puede evaluar el prototipo (20 %) | Alta | Crítico | GitHub Pages. Requiere acción de una cuenta del equipo. |
| Autoría: «el informe debe ser de autoría propia» y el plagio se califica con 0,1 | Media | Crítico | El equipo debe revisar, apropiarse y poder defender cada sección. Las fuentes de terceros se citan. |
| Trabajo en grupo sin evidencias (10 %) | Alta | Medio | Plantilla de aportes reales para diligenciar. **Nunca actas o aportes ficticios.** |
| Datos de salud en el navegador | Media | Medio | Declarado como límite del prototipo; consentimiento, exportación y borrado reales. |
| Plazo de 2 días | Alta | Alto | Prioridad estricta: rúbrica primero, extras después. |

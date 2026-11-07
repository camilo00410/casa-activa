# 04 · Evidencias de cumplimiento

Todo lo marcado como **Cumplido** se puede reproducir con los comandos del [README](../README.md).
Lo que no se pudo verificar se declara en la sección final, en lugar de asumirlo.

## Entregables de la guía

| Requisito | Estado | Evidencia |
|---|---|---|
| Wireframe de baja fidelidad | Cumplido | 13 pantallas y mapa, en `design/wireframes/png/`. Sin color, tipografía definitiva ni imágenes reales |
| Mockup de alta fidelidad | Cumplido | 12 pantallas de escritorio y 6 móviles en `design/mockups/`, más láminas de paleta, tipografía, iconografía y componentes |
| Prototipo navegable | Cumplido | Publicado en <https://camilo00410.github.io/casa-activa/> y verificado sobre el sitio real |
| Análisis de requerimientos | Cumplido | Secciones 4 y 5 del informe |
| Informe en PDF | Cumplido | `entrega/Informe_ACA_Casa_Activa.pdf`. Sus enlaces funcionan cuando el proyecto se publique |

## Formato del informe

| Condición | Estado | Cómo se verificó |
|---|---|---|
| 10 secciones en orden | Cumplido | Índice del PDF |
| Arial 12 | Cumplido | `pdffonts`: solo la familia Arial; hojas de estilo en 12 pt |
| Interlineado 1,5 | Cumplido | `report/generar.mjs`, también en las tablas |
| Márgenes de 2,54 cm | Cumplido | `@page` y parámetros de impresión |
| Figuras numeradas y tituladas | Cumplido | Numeración automática |
| Mínimo 3 conclusiones | Cumplido | 5 conclusiones |
| Objetivos en infinitivo | Cumplido | 1 general y 4 específicos |
| Referencias APA | Cumplido con reserva | Ver «Lo que no se pudo verificar» |

## Requerimientos funcionales

| Req. | Estado | Pruebas |
|---|---|---|
| RF1 | Cumplido | `tests/unit/autenticacion.test.js`, `validacion.test.js`, `personal.test.js`; E2E «RF1» |
| RF2 | Cumplido | `tests/unit/catalogo.test.js`; E2E «RF2» |
| RF3 | Cumplido | `tests/unit/busqueda.test.js`; E2E «RF3» |
| RF4 | Cumplido | `tests/unit/recomendador.test.js`; E2E «RF4» |
| RF5 | Cumplido | `tests/unit/habitos.test.js`, `personal.test.js`; E2E «RF5» |

## Requerimientos no funcionales

| Req. | Métrica | MVP | Final | Estado |
|---|---|---|---|---|
| RNF1 | Lighthouse rendimiento, móvil, en local | 84 | 93–99 | Cumplido |
| RNF1 | Lighthouse rendimiento, móvil, sitio publicado | No publicado | 99–100 | Cumplido |
| RNF1 | LCP móvil del inicio | 4,5 s en local | 3,2 s en local; 2,0 s publicado | Cumplido en el sitio publicado |
| RNF1 | Cambio acumulado de diseño (CLS) | 0,018 | 0 | Cumplido |
| RNF2 | Búsqueda en 10 000 registros | No existía | ≈ 3 ms | Cumplido |
| RNF3 | Contraseñas | Sin tratamiento | PBKDF2, 600 000 iteraciones | Cumplido dentro del alcance |
| RNF3 | Peticiones a terceros | 9 | 0 | Cumplido |
| RNF4 | Violaciones WCAG (axe) | 20 elementos | 0 en 21 pantallas y estados | Cumplido |
| RNF4 | Lighthouse accesibilidad | 95 | 100 | Cumplido |
| RNF5 | Desbordamiento a 360 px | 397 px de ancho | Ninguno | Cumplido |
| RNF5 | Navegadores | No probado | Chromium, Firefox, WebKit | Cumplido |

## Revisión independiente

Después de terminar se hicieron dos revisiones sin acceso a las conclusiones del autor: una con la rúbrica y otra
de QA orientada a romper la aplicación. El QA confirmó 31 defectos que las pruebas no cubrían.

| Resultado | Defectos |
|---|---|
| Corregidos, con prueba de regresión | 1-19, 21-26, 30 y 31 |
| No corregidos, a propósito | 20, 27, 28 y 29 |

| # | Defecto no corregido | Motivo |
|---:|---|---|
| 20 | Un título reutilizado hereda favoritos de uno eliminado | Impacto mínimo: exige borrar y recrear con el mismo título |
| 27 | «Ver más» se pierde al volver a Explorar | Solo obliga a pulsar de nuevo |
| 28 | Recargar el asistente borra lo escrito | **Decisión de privacidad:** conservar el borrador guardaría datos de salud antes de la autorización |
| 29 | Registro simultáneo en dos pestañas duplica un correo | Requiere dos envíos en el mismo instante; un servidor lo resolvería con una restricción única |

## Comparación con el MVP

Capturas originales en [`evidencias/linea-base/`](evidencias/linea-base/) y mediciones en
[`evidencias/lighthouse-resumen.txt`](evidencias/lighthouse-resumen.txt).

| Defecto del diagnóstico | Resuelto |
|---|---|
| D1 Atributo mal cerrado en el botón de la tarjeta 3 | Sí: las tarjetas se generan con datos |
| D2 «Cardio suave» enlazaba a un video de alta intensidad | Sí: separado en dos recomendaciones |
| D3 Contraste insuficiente | Sí |
| D4 Desbordamiento en móvil | Sí |
| D5 Pestaña activa sin estilo | Sí |
| D6 Formularios apilados | Sí: rutas separadas |
| D7 Enlace muerto de recuperación | Sí: se retiró, porque sin servidor solo podría simularse |
| D8 Jerarquía de títulos | Sí |
| D9 Imágenes externas sin medidas | Sí |
| D10 Tarjetas que parecían clicables y no lo eran | Sí: toda la tarjeta es un enlace |
| D11 Sin descripción ni favicon; fuentes de terceros | Sí |
| D12 `outline: none` y foto incoherente | Sí |

## Lo que no se pudo verificar

| Tema | Situación | Quién lo resuelve |
|---|---|---|
| Manual de citación CUNDigital | No está en los archivos. Se encontró una guía del Sistema de Bibliotecas CUN cuyo extracto indica APA 7, pero su repositorio bloquea las descargas automáticas y no se leyó completa | El equipo debe confirmarlo en la biblioteca |
| Criterio del docente sobre Figma | La guía lo cita como ejemplo y no como obligación | Conviene confirmarlo con el docente |
| Uso de IA | La guía exige autoría propia y no menciona la IA. Se declaró en la Introducción | El equipo debe revisar la política de la CUN |
| Pruebas con usuarios reales | No se realizaron; el informe lo declara | Posible trabajo futuro |
| Teléfonos físicos | Solo emulación | El equipo, con el enlace publicado |
| Fecha de la nota de la OMS sobre actividad física | La página muestra 4 de noviembre de 2026; puede ser fecha de actualización | Se citó solo el año |

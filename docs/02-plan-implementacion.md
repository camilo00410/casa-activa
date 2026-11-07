# 02 · Plan de implementación

**Regla de decisión:** toda mejora debe responder *«¿qué ítem de la rúbrica o qué requerimiento sustenta?»*.
Si no hay respuesta, no se hace.

---

## 1. Decisiones de alcance

| ID | Decisión | Justificación | Alternativa descartada |
|---|---|---|---|
| A1 | **Ampliar a las 4 categorías** conservando la marca Casa Activa | Es requisito explícito de la guía | Mantener solo ejercicios: incumple el tema |
| A2 | **SPA estática sin backend** (HTML, CSS y JS con módulos ES) | La rúbrica exige un enlace que funcione siempre. El hosting estático no tiene arranque en frío ni costo. Continúa el MVP y no requiere compilar. | React + API: reescritura y riesgo de despliegue a 2 días de la entrega, sin puntos adicionales en la rúbrica |
| A3 | **Patrón repositorio asíncrono** sobre `localStorage` | Hace real la persistencia hoy y permite cambiar a una API sin tocar la interfaz (RNF2) | Acceder a `localStorage` desde las vistas |
| A4 | **Personalización por reglas explicables** | Es verificable, muestra el porqué de cada sugerencia y es prudente con temas de salud | Aprendizaje automático: sin datos ni justificación |
| A5 | **PBKDF2-SHA256 (600 000 iteraciones)** con Web Crypto | Es lo que recomienda OWASP para PBKDF2 y no necesita dependencias | Guardar contraseñas en texto plano o con SHA-256 simple |
| A6 | **Wireframes en HTML en escala de grises** antes de codificar la app; **mockups diseñados en navegador** | Reproducibles y versionados. La guía recomienda herramientas pero no obliga una. | Exportar capturas del producto final como wireframes: invierte el proceso de diseño |
| A7 | **Sin simulaciones engañosas** | Si algo no puede ser real sin servidor (recuperar contraseña por correo), se retira y se declara como límite | Mostrar un «correo enviado» falso |

## 2. Matriz de trazabilidad

| Req. ACA | Interpretación | Funcionalidad en Casa Activa | Pantallas | Cómo se valida |
|---|---|---|---|---|
| **RF1** | Registro, acceso, sesión, datos de cuenta y perfil de salud opcional | Registro con consentimiento, ingreso, cierre de sesión, bloqueo por intentos, asistente de perfil, IMC, editar cuenta, cambiar contraseña | Ingreso, Registro, Asistente, Mi perfil | Unitarias de validación y autenticación; E2E de registro → perfil |
| **RF2** | Contenido organizado, confiable y administrable | 24+ recomendaciones con fuente en 4 categorías; detalle; panel admin con crear, editar, publicar y eliminar | Inicio, Detalle, Administración | Unitarias de esquema; E2E de CRUD; prueba de rol |
| **RF3** | Encontrar por texto y atributos | Búsqueda que ignora tildes, filtros combinables, orden, facetas, URL compartible, estado vacío | Explorar | Unitarias de búsqueda; E2E de filtros |
| **RF4** | Adaptar el contenido a cada persona | Motor por reglas: exclusiones de seguridad, puntuación, diversidad por categoría y razones visibles; «No me interesa» | Para ti, Detalle | Unitarias del motor por caso; E2E con dos perfiles distintos |
| **RF5** | Guardar y dar continuidad | Favoritos; hábitos desde el catálogo o propios; registro diario, rachas, meta semanal y gráfico | Favoritos, Hábitos | Unitarias de rachas y zona horaria; E2E |
| **RNF1 Rendimiento** | Carga y respuesta rápidas | Sin framework, fuentes e imágenes locales, WebP, carga diferida, medidas fijas | Todas | Lighthouse; medición de búsqueda con 10 000 registros |
| **RNF2 Escalabilidad** | Crecer sin rehacer | Capas, repositorios asíncronos, catálogo por datos, paginación, migraciones de esquema | Arquitectura | Prueba de carga; prueba de migración |
| **RNF3 Seguridad y privacidad** | Proteger cuentas y datos de salud | PBKDF2, CSP, DOM sin `innerHTML`, guardas por rol, consentimiento (Ley 1581), exportar y eliminar datos | Registro, Privacidad | Unitarias; E2E de XSS y acceso; verificación de CSP |
| **RNF4 Experiencia de usuario** | Claro, consistente y accesible | Sistema de diseño, estados vacío/carga/error, confirmaciones, foco, teclado, WCAG 2.2 AA | Todas | axe en todas las rutas; tabla de contraste; revisión heurística de Nielsen |
| **RNF5 Compatibilidad** | Funcionar en cualquier pantalla y navegador | Diseño móvil primero, barra inferior, objetivos táctiles de 44 px | Todas | E2E en 360/768/1366 px, sin desbordamiento; Chromium, Firefox y WebKit si el entorno lo permite |
| **E1 Wireframe** | Todas las pantallas sin color | 13 pantallas con anotaciones + mapa de pantallas | — | Lista de chequeo de la guía |
| **E2 Mockup** | Alta fidelidad con justificación | Sistema de diseño + pantallas escritorio y móvil | — | Lista de chequeo; contraste calculado |
| **E3 Prototipo** | Navegable en URL pública | App publicada | — | Abrir el enlace desde otra red o sesión anónima |
| **E4 Análisis** | Argumentado por requerimiento | Secciones 4 y 5 del informe | — | Plantilla por requerimiento: interpretación, decisión, resolución en diseño |
| **Informe** | 10 secciones y formato | PDF generado con Arial 12, interlineado 1,5, márgenes 2,54 cm | — | `pdffonts`, verificación de márgenes y orden |

## 3. Mejoras clasificadas y priorizadas

Escala: impacto académico y esfuerzo de 1 (bajo) a 5 (alto).

### Obligatorias: sin ellas no se cumple la guía

| # | Mejora | Rúbrica | Impacto | Esfuerzo | Riesgo si no se hace |
|---|---|---|---:|---:|---|
| O1 | Rehacer el informe con 10 secciones y formato exigido | Todo | 5 | 4 | Pérdida de la mayoría de la nota |
| O2 | Análisis argumentado de RF1–RF5 y RNF1–RNF5 | 30 % | 5 | 3 | Nivel «incompleto» |
| O3 | Wireframes completos con mapa de pantallas | 20 % | 5 | 3 | Nivel «incompleto» |
| O4 | Mockups de alta fidelidad con decisiones justificadas | 20 % | 5 | 3 | Nivel «básico» |
| O5 | Prototipo con RF1–RF5 reales | 20 % | 5 | 5 | Faltan funcionalidades clave |
| O6 | Enlace público | 20 % | 5 | 1 | **El prototipo no se puede evaluar** |
| O7 | Corregir temática y defectos D1–D4 | Todo | 5 | 2 | Incumple el tema y los RNF |
| O8 | Evidencia de participación del grupo | 10 % | 4 | 1 | Ítem sin puntos |

### Recomendadas: consolidan la defensa

| # | Mejora | Sustenta | Impacto | Esfuerzo |
|---|---|---|---:|---:|
| R1 | Pruebas unitarias y E2E automatizadas | RF1–RF5, Fase 4 de la guía | 4 | 3 |
| R2 | Auditoría de accesibilidad y Lighthouse con antes/después | RNF1, RNF4 | 4 | 1 |
| R3 | Panel de administración de contenidos | RF2 | 4 | 3 |
| R4 | Consentimiento, exportación y eliminación de datos | RNF3 | 4 | 2 |
| R5 | Guion de sustentación y preguntas probables | Presentación | 3 | 2 |
| R6 | Documentación técnica y README | Entrega | 3 | 1 |

### Opcionales: solo si sobra tiempo

| # | Mejora | Decisión |
|---|---|---|
| P1 | Integración continua en GitHub Actions | Se incluye por su bajo costo, pero solo se valida al publicar |
| P2 | Modo oscuro | No se hace: no suma a ningún criterio |
| P3 | Funcionamiento sin conexión (PWA) | No se hace: añade caché que complica la demo |
| P4 | Recuperar contraseña por correo | Imposible sin servidor. Se declara como límite (A7). |
| P5 | Backend real | Se documenta como evolución; no se implementa |

## 4. Fases y criterios de aceptación

| Fase | Entregable | Criterios verificables |
|---|---|---|
| **F0** Diagnóstico | Este documento y `01-diagnostico.md` | Línea base medida; requisitos inventariados |
| **F1** Wireframe | 13 pantallas + mapa | Cubren RF1–RF5; hay menú, buscador, listados de las 4 categorías y formularios; **sin color, sin tipografía definitiva y sin fotos**; cada pantalla con explicación |
| **F2** Sistema visual | Tokens, tipografía, iconos, imágenes locales | **Todo par texto/fondo ≥ 4,5:1** calculado; fuentes locales; 0 peticiones a terceros |
| **F3** Núcleo y dominio | Capas de datos y dominio | Pruebas unitarias en verde; dominio sin dependencias del DOM |
| **F4** Prototipo | App con RF1–RF5 | Cada flujo de la guía funciona de extremo a extremo; 0 errores de consola; datos persisten al recargar |
| **F5** Calidad | Pruebas y auditorías | axe: 0 violaciones WCAG A/AA; sin desbordamiento a 360 px; Lighthouse ≥ 90 en las cuatro categorías; XSS neutralizado; rutas protegidas |
| **F6** Mockups | Capturas escritorio y móvil | Generadas de forma reproducible, con datos de demostración |
| **F7** Informe | PDF | 10 secciones en orden; Arial 12, 1,5, 2,54 cm; figuras numeradas; mínimo 3 conclusiones; referencias APA 7 |
| **F8** Sustentación | Guion, demo y preguntas | Demo cronometrable; preguntas críticas respondidas |
| **F9** Auditoría final | Revisión independiente con ojos de evaluador | Hallazgos críticos corregidos; matriz actualizada con evidencia real |

## 5. Estrategia de validación

| Requisito | Prueba automática | Prueba manual | Evidencia |
|---|---|---|---|
| RF1 | Unitarias + E2E de registro, error, bloqueo y sesión | Registro desde el enlace público | Salida de pruebas y capturas |
| RF2 | E2E de CRUD: lo creado aparece en el catálogo público | Revisión de fuentes de contenido | Capturas |
| RF3 | Unitarias de tildes y combinaciones; E2E | Buscar «descanso», «sueno», «sueño» | Capturas |
| RF4 | Casos: vegano, lesión de rodilla, poco sueño; dos perfiles dan resultados distintos | Revisar las razones mostradas | Tabla comparativa |
| RF5 | Unitarias de rachas; E2E de favoritos y hábitos | Recargar y confirmar persistencia | Capturas |
| RNF1 | Lighthouse | — | Reporte antes/después |
| RNF2 | Búsqueda sobre 10 000 registros; migración | — | Tiempo medido |
| RNF3 | E2E de XSS, acceso sin rol y hash en almacenamiento; revisión de ausencia de `innerHTML` | Inspeccionar `localStorage` | Capturas y salida |
| RNF4 | axe en todas las rutas; contraste calculado | Recorrido solo con teclado; heurísticas de Nielsen | Reporte |
| RNF5 | E2E en tres anchos y varios motores | Abrir en un celular real (**lo hace el equipo**) | Capturas |

## 6. Lo que no puede verificarse desde aquí

Se deja declarado para no presentarlo como hecho:

- **Pruebas de usabilidad con personas reales:** no se realizaron. El informe no debe afirmarlo.
- **Celulares físicos:** solo emulación por tamaño de pantalla.
- **Participación del grupo:** la registra el equipo, con aportes reales.
- **Manual de citación CUNDigital:** ver I4 en el diagnóstico.
- **Publicación:** requiere una cuenta de GitHub del equipo.

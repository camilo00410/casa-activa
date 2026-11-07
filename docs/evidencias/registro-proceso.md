# Registro del proceso

Secuencia real del trabajo, para sustentar lo que el informe describe. El historial de Git es la evidencia más
fuerte: este archivo la complementa mientras el código final no se suba al repositorio.

| Orden | Fase | Resultado | Evidencia |
|---|---:|---|---|
| 1 | Diagnóstico | MVP medido antes de cambiarlo: contraste, desbordamiento, enlaces y Lighthouse | `docs/01-diagnostico.md`, `evidencias/linea-base/` |
| 2 | Plan | Matriz de trazabilidad, prioridades y criterios de aceptación | `docs/02-plan-implementacion.md` |
| 3 | Wireframes | 13 pantallas y mapa, antes de escribir código de la aplicación | `design/wireframes/` |
| 4 | Sistema visual | Tokens, contraste, fuentes, iconos e imágenes locales | `src/estilos/tokens.css`, `assets/` |
| 5 | Dominio y datos | Lógica y pruebas unitarias antes de la interfaz | `src/dominio/`, `tests/unit/` |
| 6 | Interfaz | Pantallas construidas a partir de los wireframes | `src/vistas/` |
| 7 | Pruebas E2E | Defectos corregidos, listados en la sección Prototipo del informe | `tests/e2e/` |
| 8 | Rendimiento | Móvil de 87 a 93 con compresión y precarga de módulos | `evidencias/lighthouse-resumen.txt` |
| 9 | Mockups | Capturas reproducibles de las pantallas finales | `design/mockups/`, `scripts/capturar-disenos.mjs` |
| 10 | Informe | PDF generado con el formato de la guía | `report/`, `entrega/` |
| 11 | Revisión independiente | Dos revisiones críticas, una con la rúbrica y otra de QA; sus hallazgos se corrigieron | Este registro y el informe |

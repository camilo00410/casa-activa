# Casa Activa

Página web de **recomendaciones saludables** con alimentación, actividad física, descanso y bienestar.
Prototipo funcional de la Actividad de Construcción Aplicada del curso de Ingeniería Web (CUN, 2026).

- **Prototipo publicado:** <https://camilo00410.github.io/casa-activa/>
- **Informe de la entrega:** [`entrega/Informe_ACA_Casa_Activa.pdf`](entrega/Informe_ACA_Casa_Activa.pdf)

## Qué incluye

| Requerimiento | Funcionalidad |
|---|---|
| RF1 Usuarios y perfil de salud | Registro con autorización, ingreso, asistente de perfil opcional, edición de cuenta |
| RF2 Contenidos | 26 recomendaciones con fuente en 4 categorías; panel para crear, editar, publicar y eliminar |
| RF3 Búsqueda y filtrado | Búsqueda sin importar tildes, filtros combinables, orden y URL compartible |
| RF4 Personalización | Motor de reglas con exclusiones de seguridad y motivo visible de cada sugerencia |
| RF5 Favoritos y hábitos | Favoritos, registro diario, rachas, meta semanal y gráfico de cumplimiento |

## Requisitos

- [Node.js](https://nodejs.org) 22 o superior. Solo se usa para el servidor local y las pruebas.
- La aplicación no tiene dependencias en tiempo de ejecución: no hay que instalar nada para abrirla.

## Ejecución

```bash
npm start
```

Abre <http://localhost:8080>. La pantalla de ingreso tiene botones para entrar sin escribir credenciales:

| Rol | Correo | Contraseña |
|---|---|---|
| Usuario de ejemplo | `demo@casaactiva.co` | `Demo2026*` |
| Administrador | `admin@casaactiva.co` | `Admin2026*` |

Estas cuentas son públicas a propósito, porque es un prototipo académico. El enlace **Restablecer datos de demostración**
del pie de página devuelve todo a su estado inicial.

## Pruebas

```bash
npm install                 # Instala las herramientas de prueba
npx playwright install      # Solo la primera vez: descarga los navegadores
npm test                    # Pruebas unitarias
npm run test:e2e            # Extremo a extremo en Chromium, Firefox, WebKit y móvil
```

## Regenerar los entregables

```bash
node scripts/capturar-disenos.mjs   # Wireframes, mockups y capturas de los flujos
node report/generar.mjs             # Informe en PDF (requiere pdftotext, de poppler)
```

Los datos del informe que solo conoce el equipo están en [`report/config.mjs`](report/config.mjs).

## Publicación

El informe apunta a `https://camilo00410.github.io/casa-activa/`, por lo que el repositorio debe llamarse exactamente
**`casa-activa`** y estar en esa cuenta.

```bash
git add -A
git commit -m "Transforma el MVP en la solución completa de Casa Activa"
git remote rename origin mvp-edwin
git remote add origin git@github.com:camilo00410/casa-activa.git
git push -u origin main
```

Conservar el historial mantiene los commits originales de Edwin, que son evidencia del trabajo en grupo.

Después, en GitHub, ve a **Settings → Pages → Build and deployment**, elige **Deploy from a branch**, rama `main`,
carpeta `/ (root)`, y guarda. El sitio tarda un par de minutos. Compruébalo en una ventana de incógnito.

El flujo de GitHub Actions solo ejecuta las pruebas: si fallara, no impediría la publicación.

## Estructura

```text
index.html            Punto de entrada y política de seguridad de contenido
src/
  main.js             Conecta las capas y arranca la aplicación
  dominio/            Lógica pura: recomendador, búsqueda, hábitos, validación
  datos/              Almacenamiento, repositorios y datos iniciales
  servicios/          Casos de uso: autenticación, catálogo, datos personales
  nucleo/             Enrutador y construcción segura del DOM
  ui/                 Componentes compartidos
  vistas/             Una vista por pantalla
  estilos/            Tokens, base, componentes y vistas
assets/               Fuentes, iconos e imágenes locales
design/               Wireframes, sistema de diseño, mockups y flujos
tests/                Pruebas unitarias y de extremo a extremo
report/               Generador del informe en PDF
docs/                 Diagnóstico, plan, arquitectura, evidencias y sustentación
```

## Documentación

1. [Diagnóstico del MVP](docs/01-diagnostico.md)
2. [Plan de implementación](docs/02-plan-implementacion.md)
3. [Arquitectura y decisiones](docs/03-arquitectura.md)
4. [Evidencias de cumplimiento](docs/04-evidencias.md)
5. [Registro de aportes del equipo](docs/06-aportes-equipo.md)

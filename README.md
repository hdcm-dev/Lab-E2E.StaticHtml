# Lab-E2E.StaticHtml

Laboratorio para practicar **pruebas de extremo a extremo con Playwright** sobre un sitio HTML
estático, y para ver cómo se integran esas pruebas en la cadena de desarrollo con GitHub Actions.

El sitio de ejemplo es una demo de *movilidad urbana* con las dos pantallas que aparecen en casi
cualquier aplicación de gestión:

| Pantalla | Archivo | Qué ejercita |
| --- | --- | --- |
| ABM de localidades | [src/localidades.html](src/localidades.html) | Alta, modificación y baja sobre una tabla, validación de formulario, modal de confirmación y persistencia |
| Encuesta de transporte | [src/encuesta.html](src/encuesta.html) | Asistente de tres pasos: datos de la persona, medios que utiliza para viajar y distancia recorrida |

Todo es HTML + JavaScript de navegador con **Bootstrap 5.3.8** (vendorizado en
[src/vendor/bootstrap/](src/vendor/bootstrap/), sin CDN) y **sin framework**. El estado se guarda en
`localStorage`, así que no hace falta backend.

El sitio está construido según el **Template-HTML-SDD-Default**, la forma constructiva por defecto
del Framework SDD para maquetas HTML/CSS/JS sin proceso de build: tokens de diseño como variables
CSS, conmutador declarativo de estados en el marcado, iconografía SVG inline, `<dialog>` nativo y
WCAG 2.2 AA como piso. Qué se aplicó, qué no y por qué está en
[docs/Aplicacion-Template-HTML-SDD.md](docs/Aplicacion-Template-HTML-SDD.md).

## Estructura

```
src/                     El sitio estático que se prueba
  index.html             Portada
  localidades.html       ABM
  encuesta.html          Asistente de 3 pasos
  css/estilos.css        Tokens del catálogo y componentes propios, sobre el reboot de Bootstrap
  js/main.js             Armazón: fachada, iconos, estados, diálogos, almacenamiento; arranca solo
  js/inicio.js           Hook de la portada
  js/localidades.js      Hook del ABM
  js/encuesta.js         Hook del asistente
  vendor/bootstrap/      Bootstrap 5.3.8
scripts/
  servidor.mjs           Servidor estático sin dependencias (lo levanta Playwright)
  e2e.sh                 Ejecuta npm/Playwright dentro del contenedor oficial
tests/e2e/
  apoyo.js               Fixtures: siembra de localStorage, navegación por el menú
  navegacion.spec.js     Portada y menú
  localidades.spec.js    ABM completo
  encuesta.spec.js       Asistente completo
playwright.config.js     Navegadores, reportes, servidor de pruebas
.github/workflows/       CI, workflow reutilizable de E2E y verificación de entornos
docs/                    Registro de la aplicación del template, con sus capturas de evidencia
```

Cada superficie se puede abrir directamente en cualquiera de sus estados agregando `?estado=<id>` a
la dirección —por ejemplo `encuesta.html?estado=paso-3` o `localidades.html?estado=vacio`—, que es lo
que hace verificable un estado sin tener que recorrer todo el flujo para llegar a él.

## Cómo correrlo

### Con Node instalado

```bash
npm ci
npx playwright install --with-deps   # navegadores, solo la primera vez
npm test                             # las 4 configuraciones de navegador
npm run test:chromium                # solo chromium, más rápido
npm run reporte                      # abre el reporte HTML de la última corrida
npm run servir                       # sitio en http://127.0.0.1:4173, sin pruebas
```

### Sin Node instalado (con Docker)

`scripts/e2e.sh` ejecuta cualquier comando dentro de la imagen oficial de Playwright, que ya trae
Node y los navegadores con sus dependencias del sistema:

```bash
scripts/e2e.sh npm ci
scripts/e2e.sh npx playwright test
scripts/e2e.sh npx playwright test --project=chromium
```

No hace falta levantar el sitio a mano: `playwright.config.js` arranca `scripts/servidor.mjs` antes
de las pruebas y lo baja al terminar. Para probar contra un entorno ya desplegado, en cambio, se
define `URL_BASE` y no se levanta ningún servidor local:

```bash
URL_BASE=https://ejemplo.test scripts/e2e.sh npx playwright test --project=chromium
```

## Decisiones de las pruebas

- **Selectores por `data-testid`.** Los textos y las clases de Bootstrap cambian con el diseño; el
  `data-testid` es un contrato explícito entre la página y la prueba.
- **Estado sembrado antes de cargar la página.** La fixture de [tests/e2e/apoyo.js](tests/e2e/apoyo.js)
  usa `page.addInitScript` para dejar `localStorage` en un estado conocido, y solo siembra si está
  vacío, para que una recarga dentro de la prueba no pise lo que la prueba acaba de guardar.
- **Nada de esperas fijas.** Se usan las aserciones con reintento de Playwright (`expect(...)`), que
  ya reintentan hasta el timeout.
- **`reducedMotion: 'reduce'`.** Bootstrap desactiva sus transiciones ante esa preferencia, lo que
  quita una fuente de intermitencia.
- **Cuatro configuraciones de navegador**, una de ellas móvil (`Pixel 7`), porque la barra de
  navegación colapsada es un camino distinto que también hay que cubrir.

Dos defectos reales de la página aparecieron al escribir estas pruebas y se corrigieron en el código,
no en las pruebas: el modal de baja quedaba trabado si el click llegaba durante la animación de
apertura, y el manejador delegado de `data-bs-dismiss` de Bootstrap corría **antes** que el listener
del propio botón, con lo que la baja se aplicaba con la bandera equivocada. Los dos eran defectos del
modal de Bootstrap y dejaron de existir cuando el diálogo pasó a ser un `<dialog>` nativo; se dejan
anotados porque explican por qué la baja se sigue aplicando al cerrarse el diálogo y no en el click.

## Los workflows

### `e2e.yml` — la definición reutilizable

Es el único lugar donde está escrito *cómo* se corren las pruebas. Se dispara de tres maneras:

| Disparador | Para qué |
| --- | --- |
| `workflow_call` | Lo invocan `ci.yml` y `verificacion-entorno.yml`, y podría invocarlo otro repositorio |
| `workflow_dispatch` | Corrida a pedido desde la pestaña *Actions*, eligiendo navegadores, shards y entorno |
| `schedule` | Regresión completa todas las noches sobre la rama por defecto |

Entradas: `navegadores`, `cantidad-shards`, `url-base`, `referencia` y `retencion-dias`. Salida:
`resultado`.

Cómo trabaja:

1. `preparar` traduce las entradas en la matriz `navegadores × shards`.
2. `pruebas` corre cada combinación en paralelo dentro del contenedor
   `mcr.microsoft.com/playwright:v1.62.1-noble` y sube su reporte parcial (`blob`) y, si falla, las
   trazas y capturas.
3. `reporte` une los parciales con `playwright merge-reports` en un único reporte HTML, escribe el
   resumen de la corrida y refleja el resultado de las pruebas.

Desde otro repositorio se invoca así:

```yaml
jobs:
  e2e:
    uses: hdcm-dev/Lab-E2E.StaticHtml/.github/workflows/e2e.yml@main
    with:
      navegadores: chromium,firefox
      cantidad-shards: 2
```

### `ci.yml` — lo que se ata a la protección de rama

| Disparador | Alcance |
| --- | --- |
| `pull_request` hacia `main` o `develop` | Verificación rápida: solo `chromium`, en 2 shards |
| `push` a `main` | Verificación completa: los 4 navegadores, en 4 shards |
| `merge_group` | Igual que `push`, al entrar en la cola de merge |

Antes de gastar un runner con navegadores corre `verificacion-rapida`: `node --check` sobre todo el
JavaScript y `playwright test --list`, que detecta specs rotas y `test.only` olvidados. Al terminar,
`comentario-en-pr` deja (o actualiza, no duplica) un comentario con el resultado y el enlace a la
corrida, y `ci-ok` resume todos los jobs en un único check —que es el que conviene exigir en la regla
de protección de rama, para no tener que actualizarla cada vez que cambia la matriz—.

### `verificacion-entorno.yml` — el mismo motor, otro objetivo

Prueba de humo a pedido contra un entorno ya desplegado, reutilizando `e2e.yml` con `url-base`.

### Prácticas aplicadas

- **`concurrency`** por rama, cancelando la corrida anterior en los pull requests y conservándola en
  `main`.
- **`permissions` mínimos**: `contents: read` en general, y `pull-requests: write` únicamente en el
  job que comenta.
- El comentario en el PR se limita a ramas del propio repositorio: un fork no recibe permisos de
  escritura, y así el job no falla.
- **Ejecución en contenedor**, para que el runner autoalojado no tenga que mantener navegadores ni
  librerías del sistema, y para que la versión de los navegadores quede fijada junto al código.
- Un paso comprueba que la versión de `@playwright/test` del `package.json` **coincida con la de la
  imagen**: si divergen, la corrida falla con un mensaje claro en lugar de un error raro de protocolo.
- **`paths-ignore`** para no disparar la CI por cambios de documentación.
- **`timeout-minutes`** en todos los jobs y **`fail-fast: false`** en la matriz, para ver todas las
  combinaciones que fallan y no solo la primera.

### Runner

Los jobs corren en el runner autoalojado `runs-on: [self-hosted, i7infra-dev]`.

## Evidencia

Estado verificado en esta máquina el 2026-08-23, con la imagen
`mcr.microsoft.com/playwright:v1.62.1-noble`:

```
$ scripts/e2e.sh npx playwright test
  80 passed (55.0s)
```

Vuelto a verificar el 2026-09-04, con la misma imagen, después de reconstruir `src/` según el
Template-HTML-SDD-Default y **sin tocar un solo archivo de `tests/e2e/`**:

```
$ scripts/e2e.sh npx playwright test
  80 passed (40.7s)
```

Son 20 pruebas por cada una de las 4 configuraciones de navegador. Los workflows, en cambio, no se
ejecutaron: se validó su sintaxis YAML, pero su comportamiento real solo puede comprobarse en
GitHub Actions con el runner `i7infra-dev` disponible.

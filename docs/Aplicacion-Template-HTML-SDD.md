# Aplicación del Template-HTML-SDD-Default a `src/`

**Fecha:** 2026-09-04
**Base de conocimiento aplicada:** `IA/SDD/IA.SDD/Conocimiento/Knowledge-Template-HTML-SDD-Default.md` v1.0
**Catálogo del que salen los tokens y los patrones:** `IA/SDD/IA.SDD/SDD/Devs/References/Design/Design-Rules-Web-Generico.md` v1.4
**Alcance:** `src/` del proyecto de código `Lab-E2E.StaticHtml`. No se tocó el Framework SDD ni las
pruebas de `tests/e2e/`.

---

## 1. Qué se aplicó

| # | Forma del template | Dónde quedó |
| --- | --- | --- |
| 1 | Tokens del catálogo como variables de `:root`, con los nombres del catálogo | `src/css/estilos.css` §1 |
| 2 | Orden interno fijo de la hoja: tokens → reset → armazón → componentes → utilitarias → único `@media` | `src/css/estilos.css` |
| 3 | Cero `style=` en línea, en HTML y en JavaScript: cada valor visual es una clase con nombre | los tres `.html` y `src/js/` |
| 4 | Conmutador declarativo `data-mq-estado`, relevado del DOM, con `hidden` en una sola pasada | `src/js/main.js` |
| 5 | Estado inicial por `data-estado-inicial` y forzable por dirección con `?estado=<id>` | `src/js/main.js` |
| 6 | Inversión de control: el armazón llama a `renderSuperficie(App)` y a `alCambiarEstado(id)` | `src/js/main.js` + las tres superficies |
| 7 | Orden contractual de los `<script>`: la superficie **declara**, el armazón **arranca** | los tres `.html` |
| 8 | Fachada mínima (`$`, `$$`, `esc`, `icono`, `parametro`, …) recibida por parámetro | `src/js/main.js` |
| 9 | `esc()` obligatorio antes de todo `innerHTML` | `src/js/localidades.js` |
| 10 | Iconografía SVG inline desde un diccionario, con `currentColor`, grilla 24, trazo 1.75 | `src/js/main.js` |
| 11 | Prefijo `mq-` con BEM parcial, y utilitarias con nombre que materializan un token | todo `src/` |
| 12 | `<dialog>` nativo con `showModal()`, velo por `::backdrop`, foco al abrir y al cerrar | `src/localidades.html`, `src/js/main.js` |
| 13 | Pie del diálogo con orden fijo Cancelar → acción, e inversión a `column-reverse` en angosto | `src/css/estilos.css` §6 |
| 14 | Estado `vacio` separado, con su ícono, su título y su texto orientativo | `src/localidades.html` |
| 15 | Bloque de vacío «No aplica» declarado en la superficie sin colección | `src/index.html` |
| 16 | Los pasos del asistente son estados de la superficie, no una variable de recorrido | `src/encuesta.html`, `src/js/encuesta.js` |
| 17 | Indicador de pasos normado: círculo, conector, rótulo, tres estados de paso, `aria-current="step"` | `src/encuesta.html`, `src/js/encuesta.js` |
| 18 | Dos botones conmutados por estado en lugar de un `disabled` alternado por script | `src/encuesta.html` |
| 19 | Requisito **antes** del intento, asociado por `aria-describedby`; el placeholder es sólo ejemplo | los formularios de las dos superficies |
| 20 | Nombre accesible de cada operación de fila que desambigua la fila | `src/js/localidades.js` |
| 21 | `<caption class="mq-sr-only">`, `<th scope="col">` y primera celda `<th scope="row">` | `src/localidades.html`, `src/js/localidades.js` |
| 22 | Salto al contenido, `main` con `tabindex="-1"`, foco visible de 2px | los tres `.html`, `src/css/estilos.css` §2 |
| 23 | Región `role="status" aria-live="polite"` que anuncia el paso | `src/encuesta.html` |
| 24 | Sello de versión visible al pie | `src/js/main.js`, los tres `.html` |
| 25 | Ficha clave/valor `mq-kv` para el resumen de una sola entidad | `src/encuesta.html` |
| 26 | Verbo exacto en cada botón: «Guardar», «Dar de baja», «Registrar la encuesta» | los tres `.html` |
| 27 | Ítem de navegación activo resuelto por `data-destino` / `data-mq-destino` | `src/js/main.js` |

Un efecto secundario del punto 12 vale la pena registrarlo: las **dos trampas** que CLAUDE.md
documentaba —el manejador delegado de `data-bs-dismiss` que corre antes que el listener del botón, y
el modal que quedaba trabado si el click llegaba durante la animación de apertura— **dejan de
existir** con el `<dialog>` nativo, porque ninguna de las dos tiene que ver con el elemento sino con
la implementación de Bootstrap. Lo que sí se conservó es el motivo de fondo: la baja se sigue
aplicando al cerrarse el diálogo y no en el click, para que la tabla se redibuje cuando el diálogo
ya soltó el foco.

## 2. Qué NO se aplicó, y por qué

Cada apartamiento se declara con su motivo. Ninguno es una omisión: son decisiones tomadas contra la
naturaleza del proyecto de código, que es un **laboratorio de pruebas E2E** y no una maqueta de
validación.

| # | Ítem del template | Decisión | Motivo |
| --- | --- | --- | --- |
| A | Bootstrap 5.0 **por CDN** (§1) | Se conserva Bootstrap 5.3.8 **vendorizado** | El propio §1 declara el stack sustituible, y `Maqueta-Rules.md` §4.2 exige autonomía sin llamadas de red: vendorizar la cumple mejor que el CDN. Además es regla explícita del repo (CLAUDE.md) |
| B | Layout de archivos `assets/css/Estilos-Maqueta.css`, `assets/js/Datos-Maqueta.js`, `Maqueta.js` (§2.1) | Se conserva `css/estilos.css` y `js/{main,inicio,localidades,encuesta}.js` | `Datos-Maqueta.js` es la fuente única de datos **de ejemplo** de una maqueta; acá los datos viven en `localStorage` y son justamente el objeto bajo prueba. Renombrar el resto rompería las rutas de `tests/e2e/` sin ganancia |
| C | Nombres de superficie Título-Con-Guiones (§3.7) | Se conservan `index.html`, `localidades.html`, `encuesta.html` | §3.7 los deriva del «nombre canónico de su wireframe»; este proyecto de código no tiene wireframes. Y las rutas son contrato de las pruebas y del README |
| D | Hook de superficie en un `<script>` **inline** (§2.2) | Un archivo `.js` por superficie, cargado antes del armazón | `ci.yml` corre `node --check` sobre todo el JavaScript de `src/`: un `<script>` inline queda fuera de esa verificación. El orden contractual —la superficie declara, el armazón arranca— sí se respeta |
| E | Shells de acceso y de trabajo con barra lateral (§2.3) | Barra de navegación superior colapsable | No hay sesión ni roles que poblar una barra lateral. El catálogo §8 admite la navegación superior, y la barra colapsada es el camino que cubre la configuración `mobile-chrome` de las pruebas |
| F | Atributos `data-shell` y `data-papel` en el `<body>` (§3.1) | No se declaran | `data-papel` no tiene valor verdadero que poner: el producto no tiene roles. Declararlo sería inventar información. `data-shell` es documental y sin shells no dice nada. Sí se declaran `data-superficie`, `data-destino` y `data-estado-inicial` |
| G | Tabla **y** tarjetas apiladas, ambas siempre en el DOM (§4) | Sólo la tabla, con desplazamiento horizontal en angosto | Lo que §4 protege es que la tabla no deje de ser tabla al reflowear; el envoltorio con `overflow-x` conserva la semántica sin una segunda presentación. Introducirla obligaría a reescribir cómo las pruebas operan sobre las filas, que está fuera de «aplicar estilos y formas» |
| H | Una banda de resultado por estado de acción (§5.2) | Una sola banda `#aviso` que cambia de tono | El texto lo produce la operación real (qué localidad se agregó, cuál se eliminó), no un catálogo de mensajes de maqueta. El tono sí sale del catálogo |
| I | Barra de validación de maqueta (§5.7) | No se agrega | El propio §5.7 la declara instrumento de la maqueta y no parte del producto. Además, una barra fija al pie interceptaría el puntero en el viewport móvil. Lo verificable de ella —abrir cualquier superficie en cualquiera de sus estados— sí quedó, por `?estado=<id>` |
| J | Paso final de revisión en el asistente (§5.5) | El resumen es el acuse del envío, no un cuarto paso | Convertirlo en paso 4 cambia el comportamiento especificado del producto y su contrato de pruebas («Paso X de 3»). Es un cambio funcional, no de forma constructiva |
| K | Esqueletos de carga y `filtrado-sin-resultados` | No se declaran | `cargando` no aplica: `localStorage` se lee de forma síncrona. `filtrado-sin-resultados` tampoco: la superficie no ofrece filtro. Los dos motivos están escritos en el marcado, junto a los bloques que sí hay |

## 3. Lagunas del template que hubo que resolver

| Laguna | Cómo se resolvió |
| --- | --- |
| El catálogo nombra `--color-backdrop` pero no fija su valor | Derivado de `--color-text-primary` (`#1a1a18`) al 45 %. Queda anotado en el propio `:root` |
| El catálogo pide «una familia sans humanista» sin decir cuál | Pila del sistema (`system-ui, …`). Cualquier familia por descarga rompería la autonomía sin red |
| §2.4 pide «el único `@media (max-width: 768px)`», pero Bootstrap colapsa la barra en `767.98px` | El punto de quiebre se expresa como `767.98px`, para que la navegación y las grillas conmuten en el mismo píxel y no exista un ancho con la barra expandida y el contenido ya apilado |
| El conmutador apaga bloques con `hidden`, pero las utilitarias de display de Bootstrap le ganan por orden de fuente | `[hidden] { display: none !important }` se vuelve a declarar en `estilos.css`, que es la última hoja que carga |
| §5.4 pide que el foco vuelva al disparador al cerrar el diálogo, pero tras una baja el disparador ya no existe | El armazón devuelve el foco sólo si el disparador sigue en el documento; si no, no lo fuerza a ningún lado |
| §3.6 lista `--shell-sidebar-width` y cuatro acentos por módulo | Se omiten los que no tienen consumidor, para no dejar tokens muertos. La omisión está escrita en el `:root` |

## 4. Evidencia

Corrida completa de las pruebas de extremo a extremo con la imagen
`mcr.microsoft.com/playwright:v1.62.1-noble`, **después** de aplicar todo lo anterior y **sin tocar
un solo archivo de `tests/e2e/`**:

```
$ scripts/e2e.sh npx playwright test
  80 passed (40.7s)
```

Son las mismas 20 pruebas por cada una de las 4 configuraciones de navegador que pasaban antes del
cambio (`80 passed (1.0m)` en la corrida de base). Que el contrato `data-testid` haya quedado intacto
es lo que permite afirmar que se cambió la forma constructiva y no el comportamiento.

Capturas de la superficie resultante, en `docs/evidencia/`:

| Captura | Qué muestra |
| --- | --- |
| [inicio.png](evidencia/inicio.png) | Portada con las tarjetas de acceso y sus íconos del diccionario |
| [localidades-escritorio.png](evidencia/localidades-escritorio.png) | ABM: formulario con requisitos declarados, tabla con iniciales, insignia de conteo y sello de versión |
| [localidades-movil.png](evidencia/localidades-movil.png) | La misma superficie a 412px, con la barra colapsada y la tabla desplazable |
| [dialogo-de-baja.png](evidencia/dialogo-de-baja.png) | `<dialog>` nativo con velo por `::backdrop` y pie Cancelar → acción |
| [encuesta-paso-2.png](evidencia/encuesta-paso-2.png) | Asistente abierto por dirección con `?estado=paso-2`: paso 1 completado con tilde, conector pintado |
| [localidades-estado-vacio-forzado.png](evidencia/localidades-estado-vacio-forzado.png) | `localidades.html?estado=vacio`: el bloque de vacío exhibido sobre datos cargados, que es lo que hace verificable el estado sin tener que vaciar el almacén |

Lo que **no** está verificado: los workflows de GitHub Actions siguen sin haberse ejecutado nunca, y
este cambio no altera esa situación.

## 5. Criterios de aceptación del template, uno por uno

Los de §6 del documento de conocimiento, contra el árbol resultante:

- [x] `[enumerable]` Cada superficie declara sus atributos de `<body>` — con la excepción declarada en 2.F.
- [x] `[enumerable]` El orden de los `<script>` es el declarado en las tres páginas.
- [x] `[enumerable]` Ningún archivo HTML ni JavaScript lleva un atributo `style=` en línea.
- [x] `[enumerable]` No hay literales de color, tipografía ni espaciado fuera del bloque `:root`.
- [x] `[enumerable]` Ningún HTML hardcodea datos de la colección: las filas salen del almacén.
- [x] `[enumerable]` Cada superficie declara sus estados, o declara «No aplica» con su motivo.
- [x] `[enumerable]` Todo `<th>` lleva `scope`, y la `<table>` lleva `<caption class="mq-sr-only">`.
- [x] `[enumerable]` Todo control de formulario tiene `<label for>` visible.
- [x] `[enumerable]` El `<dialog>` lleva `aria-labelledby` y su pie ordena Cancelar antes de la acción.
- [ ] `[enumerable]` Barra de validación — **no aplica**, ver 2.I.
- [x] `[interpretativo]` `filtrado-sin-resultados` separado de `vacio` — no aplica, y el motivo está en el marcado.
- [x] `[interpretativo]` Ninguna acción no disponible se dibuja inhabilitada.
- [x] `[interpretativo]` El nombre accesible de cada acción de fila desambigua la fila.
- [x] `[interpretativo]` El foco vuelve al disparador al cerrar el diálogo, cuando el disparador sigue existiendo.

# Contexto para agentes

Laboratorio de pruebas E2E. Sitio HTML estático + Playwright + GitHub Actions. La documentación
para personas está en [README.md](README.md); acá va solo lo que hace falta para trabajar en el repo
sin romper cosas.

## Cómo ejecutar

**En esta máquina no hay Node ni npm instalados.** Todo pasa por Docker con
[scripts/e2e.sh](scripts/e2e.sh), que monta el repo en la imagen oficial de Playwright:

```bash
scripts/e2e.sh npm ci
scripts/e2e.sh npx playwright test                      # 4 navegadores, ~55 s
scripts/e2e.sh npx playwright test --project=chromium   # ~10 s, para iterar
```

La primera corrida baja la imagen (~2 GB) y puede pasar los 120 s de timeout de Bash: conviene
lanzarla en background. No hay `gh` ni `hub`.

No hace falta levantar el sitio: `playwright.config.js` arranca `scripts/servidor.mjs` en el 4173 y
lo baja al terminar. Con `URL_BASE` definida no levanta nada y prueba contra esa URL.

## Reglas del código

- **Sin frameworks ni dependencias de runtime.** Bootstrap 5.3.8 está vendorizado en
  `src/vendor/bootstrap/`; no reemplazarlo por un CDN. La única dependencia de desarrollo es
  `@playwright/test`.
- **JavaScript de navegador, ES5-ish, IIFE**, como en `src/js/`. Nada de bundlers ni módulos ESM en
  `src/` (sí en `scripts/servidor.mjs`, que corre en Node).
- **Todo elemento que una prueba toque lleva `data-testid`.** No escribir selectores por texto,
  clase de Bootstrap ni estructura del DOM.
- **Todo en castellano**: nombres de variables y funciones, comentarios, textos de la interfaz,
  títulos de las pruebas y mensajes de commit.
- El estado vive en `localStorage` bajo las claves `lab-e2e.localidades` y `lab-e2e.encuestas`,
  definidas en `src/js/main.js` y reexportadas por `tests/e2e/apoyo.js`.

## Reglas de las pruebas

- Usar aserciones con reintento (`await expect(locator)...`). **Nunca `waitForTimeout`.**
- Importar `test`/`expect` de `./apoyo`, no de `@playwright/test`: la fixture siembra
  `localStorage` antes de que corra el script de la página, y solo si está vacío (así una recarga
  dentro de una prueba no pisa lo que la prueba acaba de guardar).
- Para navegar por la barra superior usar `irPorMenu()`: en `mobile-chrome` el menú está colapsado y
  un click directo al enlace se cuelga.
- Antes de dar por buena una prueba, correrla **en los cuatro proyectos**, no solo en chromium.
  Varias fallas aparecieron únicamente bajo carga o en el viewport móvil.

## Trampas ya pisadas (no volver a caer)

- **El manejador de `data-bs-dismiss` de Bootstrap corre *antes* que el listener `click` del propio
  botón.** Verificado con traza de eventos. Por eso el botón de confirmar baja no lleva
  `data-bs-dismiss`: llama a `modal.hide()` desde su handler, y la baja se aplica en
  `hidden.bs.modal`, con el diálogo y su fondo ya fuera del DOM.
- **El modal de baja no lleva la clase `fade`.** Con la animación, un click que llegue mientras el
  diálogo se abre es descartado por Bootstrap y el modal queda trabado tapando la pantalla.
- `reducedMotion: 'reduce'` en la config desactiva las transiciones de Bootstrap. No quitarlo.
- Las provincias del `<select>` de `src/localidades.html` tienen que cubrir las de las localidades
  sembradas en `main.js` y en `tests/e2e/apoyo.js`; si falta una, la edición de esa fila falla.

## Workflows

`e2e.yml` es la única definición de cómo se corren las pruebas; `ci.yml` y
`verificacion-entorno.yml` la invocan con distintas entradas. Al tocarlos:

- Todos los jobs van con `runs-on: [self-hosted, i7infra-dev]`.
- Los jobs que ejecutan Playwright corren en el contenedor
  `mcr.microsoft.com/playwright:v1.62.1-noble`. **Esa versión tiene que coincidir con la de
  `package.json`** (un paso de `e2e.yml` lo verifica y falla si divergen): al actualizar Playwright,
  actualizar los tres lugares —`package.json`, la imagen en los workflows y `VERSION_PLAYWRIGHT` en
  `scripts/e2e.sh`—.
- El check que conviene exigir en la protección de rama es `ci-ok`, que resume a los demás.
- **Los workflows nunca se ejecutaron.** Solo se validó su YAML con
  `scripts/e2e.sh npx --yes js-yaml <archivo>`. No afirmar que funcionan en Actions sin una corrida
  real que lo respalde.

## Entrega

Rama, commit y push los hace el agente; **el merge y el borrado de la rama los hace el usuario**.
Como no hay `gh`, el PR se entrega como enlace `.../pull/new/<rama>`, clickeable y arriba de todo.

/**
 * Fixtures propias del laboratorio.
 *
 * `prepararAlmacen` deja `localStorage` en un estado conocido *antes* de que corra el script de la
 * página: es la manera de que cada prueba sea independiente sin tener que recargar dos veces.
 */
const base = require('@playwright/test');

const CLAVE_LOCALIDADES = 'lab-e2e.localidades';
const CLAVE_ENCUESTAS = 'lab-e2e.encuestas';

const LOCALIDADES_DE_PRUEBA = [
  { id: 'loc-1', nombre: 'Corrientes', provincia: 'Corrientes', codigoPostal: '3400', habitantes: 346334 },
  { id: 'loc-2', nombre: 'Resistencia', provincia: 'Chaco', codigoPostal: '3500', habitantes: 291720 }
];

const test = base.test.extend({
  /** Siembra el almacenamiento en cada `page` nueva y lo deja limpio de encuestas previas. */
  page: async ({ page }, use) => {
    await page.addInitScript(
      ([claveLocalidades, claveEncuestas, localidades]) => {
        // El script corre en *cada* navegación, incluida una recarga: solo siembra si el
        // almacenamiento está vacío, para no pisar lo que la propia prueba acaba de guardar.
        if (window.localStorage.getItem(claveLocalidades) === null) {
          window.localStorage.setItem(claveLocalidades, JSON.stringify(localidades));
        }
        if (window.localStorage.getItem(claveEncuestas) === null) {
          window.localStorage.setItem(claveEncuestas, JSON.stringify([]));
        }
      },
      [CLAVE_LOCALIDADES, CLAVE_ENCUESTAS, LOCALIDADES_DE_PRUEBA]
    );
    await use(page);
  }
});

/**
 * Navega usando la barra superior. En viewport chico el menú viene colapsado, así que primero hay
 * que desplegarlo: sin esto la misma prueba pasa en escritorio y falla en `mobile-chrome`.
 */
async function irPorMenu(page, testid) {
  const alternador = page.locator('.navbar-toggler');
  if (await alternador.isVisible()) {
    await alternador.click();
    await base.expect(page.locator('#menu')).toHaveClass(/show/);
  }
  await page.getByTestId(testid).click();
}

/** Lee una clave del almacenamiento de la página bajo prueba. */
async function leerAlmacen(page, clave) {
  return page.evaluate((c) => JSON.parse(window.localStorage.getItem(c) || 'null'), clave);
}

module.exports = {
  test,
  expect: base.expect,
  CLAVE_LOCALIDADES,
  CLAVE_ENCUESTAS,
  LOCALIDADES_DE_PRUEBA,
  irPorMenu,
  leerAlmacen
};

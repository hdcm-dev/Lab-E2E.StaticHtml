/**
 * Portada.
 *
 * Sólo declara el hook: el armazón (`main.js`) lo llama cuando el documento está listo. Lo único
 * que hidrata es la iconografía, que sale del diccionario de `main.js` para que ningún trazo SVG
 * quede duplicado en el marcado.
 */
(function (global) {
  'use strict';

  global.renderSuperficie = function (M) {
    M.$('[data-mq-ico-listado]').innerHTML = M.icono('listado', 20);
    M.$('[data-mq-ico-formulario]').innerHTML = M.icono('formulario', 20);
    M.$$('[data-mq-ico-avanzar]').forEach(function (hueco) {
      hueco.innerHTML = M.icono('flechaDerecha', 16);
    });
  };
})(window);

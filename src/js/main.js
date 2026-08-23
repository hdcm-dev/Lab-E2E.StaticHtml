/**
 * Utilidades compartidas por las páginas del laboratorio.
 *
 * Todo el estado vive en `localStorage`: alcanza para una demostración estática y hace que las
 * pruebas E2E puedan preparar o limpiar datos sin depender de un backend.
 */
(function (global) {
  'use strict';

  var CLAVE_LOCALIDADES = 'lab-e2e.localidades';
  var CLAVE_ENCUESTAS = 'lab-e2e.encuestas';

  var LOCALIDADES_INICIALES = [
    { id: 'loc-1', nombre: 'Corrientes', provincia: 'Corrientes', codigoPostal: '3400', habitantes: 346334 },
    { id: 'loc-2', nombre: 'Resistencia', provincia: 'Chaco', codigoPostal: '3500', habitantes: 291720 }
  ];

  function leer(clave, porDefecto) {
    try {
      var crudo = global.localStorage.getItem(clave);
      if (!crudo) return porDefecto;
      var valor = JSON.parse(crudo);
      return Array.isArray(valor) ? valor : porDefecto;
    } catch (error) {
      return porDefecto;
    }
  }

  function escribir(clave, valor) {
    global.localStorage.setItem(clave, JSON.stringify(valor));
  }

  /** Devuelve las localidades guardadas, sembrando el juego inicial la primera vez. */
  function obtenerLocalidades() {
    if (global.localStorage.getItem(CLAVE_LOCALIDADES) === null) {
      escribir(CLAVE_LOCALIDADES, LOCALIDADES_INICIALES);
      return LOCALIDADES_INICIALES.slice();
    }
    return leer(CLAVE_LOCALIDADES, []);
  }

  function guardarLocalidades(localidades) {
    escribir(CLAVE_LOCALIDADES, localidades);
  }

  function obtenerEncuestas() {
    return leer(CLAVE_ENCUESTAS, []);
  }

  function agregarEncuesta(encuesta) {
    var encuestas = obtenerEncuestas();
    encuestas.push(encuesta);
    escribir(CLAVE_ENCUESTAS, encuestas);
    return encuestas.length;
  }

  /** Identificador estable sin dependencias: marca de tiempo + contador. */
  var secuencia = 0;
  function nuevoId(prefijo) {
    secuencia += 1;
    return prefijo + '-' + Date.now().toString(36) + '-' + secuencia;
  }

  function formatearNumero(valor) {
    return new Intl.NumberFormat('es-AR').format(valor);
  }

  /** Marca como activo el ítem de menú que corresponde a la página abierta. */
  function marcarNavegacionActiva() {
    var archivo = global.location.pathname.split('/').pop() || 'index.html';
    var enlaces = document.querySelectorAll('.navbar-nav .nav-link');
    Array.prototype.forEach.call(enlaces, function (enlace) {
      var destino = enlace.getAttribute('href');
      var activo = destino === archivo;
      enlace.classList.toggle('active', activo);
      if (activo) {
        enlace.setAttribute('aria-current', 'page');
      } else {
        enlace.removeAttribute('aria-current');
      }
    });
  }

  /** Muestra un aviso Bootstrap en el contenedor `#aviso` de la página. */
  function mostrarAviso(mensaje, tipo) {
    var aviso = document.getElementById('aviso');
    if (!aviso) return;
    aviso.className = 'alert alert-' + (tipo || 'info');
    aviso.textContent = mensaje;
  }

  function ocultarAviso() {
    var aviso = document.getElementById('aviso');
    if (!aviso) return;
    aviso.className = 'alert d-none';
    aviso.textContent = '';
  }

  /** Aplica o limpia el estado de validación de Bootstrap sobre un control. */
  function marcarError(control, mensaje) {
    control.classList.add('is-invalid');
    control.setAttribute('aria-invalid', 'true');
    var contenedor = control.closest('.mb-3, .col-md-3, .col-md-4, .col-md-6, div');
    var retorno = contenedor ? contenedor.querySelector('.invalid-feedback') : null;
    if (retorno) retorno.textContent = mensaje;
  }

  function limpiarError(control) {
    control.classList.remove('is-invalid');
    control.removeAttribute('aria-invalid');
  }

  document.addEventListener('DOMContentLoaded', marcarNavegacionActiva);

  global.App = {
    CLAVE_LOCALIDADES: CLAVE_LOCALIDADES,
    CLAVE_ENCUESTAS: CLAVE_ENCUESTAS,
    obtenerLocalidades: obtenerLocalidades,
    guardarLocalidades: guardarLocalidades,
    obtenerEncuestas: obtenerEncuestas,
    agregarEncuesta: agregarEncuesta,
    nuevoId: nuevoId,
    formatearNumero: formatearNumero,
    mostrarAviso: mostrarAviso,
    ocultarAviso: ocultarAviso,
    marcarError: marcarError,
    limpiarError: limpiarError
  };
})(window);

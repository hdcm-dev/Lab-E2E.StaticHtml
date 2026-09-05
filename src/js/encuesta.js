/**
 * Superficie «Encuesta»: asistente de tres pasos, con validación por paso y acuse final.
 *
 * Los pasos NO son una variable de recorrido: son estados de la superficie —`paso-1`, `paso-2`,
 * `paso-3`, `exito`— declarados en el marcado con `data-mq-estado`. El armazón los releva del DOM
 * y los conmuta; acá sólo se resuelve lo que no se arregla mostrando y ocultando: el indicador de
 * pasos, los rótulos, la barra de avance y el foco.
 *
 * El acto es divisible y reanudable dentro de la sesión —se puede volver atrás sin perder lo
 * cargado—, que es la condición que habilita un asistente en vez de una superficie única.
 */
(function (global) {
  'use strict';

  var TOTAL_PASOS = 3;
  var TITULOS = {
    1: 'Datos de la persona',
    2: 'Medios que utiliza para viajar',
    3: 'Distancia recorrida'
  };
  var ANCHOS_DE_BARRA = {
    1: 'mq-progreso__barra--1de3',
    2: 'mq-progreso__barra--2de3',
    3: 'mq-progreso__barra--3de3'
  };
  var ETIQUETAS_FRECUENCIA = {
    diaria: 'Todos los días',
    semanal: 'Algunos días por semana',
    ocasional: 'Ocasionalmente'
  };
  var ETIQUETAS_MEDIOS = {
    colectivo: 'Colectivo',
    auto: 'Auto particular',
    bicicleta: 'Bicicleta',
    moto: 'Moto',
    caminata: 'A pie',
    tren: 'Tren'
  };

  var M = null;
  var etiquetaPaso;
  var indicadorPaso;
  var anuncioPaso;
  var barra;
  var contenedorProgreso;
  var botonAnterior;

  var pasoActual = 1;
  var arranque = true;

  function mediosSeleccionados() {
    return M.$$('input[name="medios"]:checked').map(function (entrada) {
      return entrada.value;
    });
  }

  /* ----------------------------------------------------------------------------------------- *
   * Validación por paso
   *
   * La maqueta de un producto no valida; este laboratorio sí, porque la validación es justamente
   * lo que las pruebas de extremo a extremo ejercitan. Cada mensaje queda asociado a su campo por
   * `aria-describedby`, que es lo que el catálogo pide.
   * ----------------------------------------------------------------------------------------- */
  function validarPaso(numero) {
    var errores = 0;

    if (numero === 1) {
      var nombre = M.$('#nombre');
      var edad = M.$('#edad');
      var localidad = M.$('#localidad');
      [nombre, edad, localidad].forEach(M.limpiarError);

      if (nombre.value.trim().length < 3) {
        M.marcarError(nombre, 'Ingrese nombre y apellido (mínimo 3 caracteres).');
        errores += 1;
      }
      var valorEdad = Number(edad.value);
      if (!edad.value || !Number.isInteger(valorEdad) || valorEdad < 16 || valorEdad > 110) {
        M.marcarError(edad, 'La edad debe estar entre 16 y 110 años.');
        errores += 1;
      }
      if (!localidad.value) {
        M.marcarError(localidad, 'Seleccione una localidad.');
        errores += 1;
      }
    }

    if (numero === 2) {
      var frecuencia = M.$('#frecuencia');
      var errorMedios = M.$('[data-testid="error-medios"]');
      M.limpiarError(frecuencia);
      errorMedios.textContent = '';
      errorMedios.hidden = true;

      if (mediosSeleccionados().length === 0) {
        errorMedios.textContent = 'Seleccione al menos un medio de transporte.';
        errorMedios.hidden = false;
        errores += 1;
      }
      if (!frecuencia.value) {
        M.marcarError(frecuencia, 'Seleccione la frecuencia de uso.');
        errores += 1;
      }
    }

    if (numero === 3) {
      var distancia = M.$('#distancia');
      var minutos = M.$('#minutos');
      var motivo = M.$('#motivo');
      [distancia, minutos, motivo].forEach(M.limpiarError);

      var valorDistancia = Number(distancia.value);
      if (distancia.value === '' || Number.isNaN(valorDistancia) ||
          valorDistancia < 0 || valorDistancia > 500) {
        M.marcarError(distancia, 'Ingrese una distancia entre 0 y 500 km.');
        errores += 1;
      }
      var valorMinutos = Number(minutos.value);
      if (!minutos.value || !Number.isInteger(valorMinutos) ||
          valorMinutos < 1 || valorMinutos > 600) {
        M.marcarError(minutos, 'Ingrese un tiempo entre 1 y 600 minutos.');
        errores += 1;
      }
      if (!motivo.value) {
        M.marcarError(motivo, 'Seleccione el motivo principal del viaje.');
        errores += 1;
      }
    }

    return errores === 0;
  }

  /* ----------------------------------------------------------------------------------------- *
   * Indicador de pasos y avance
   * ----------------------------------------------------------------------------------------- */
  function pintarIndicadorDePasos(numero) {
    M.$$('[data-mq-paso]').forEach(function (item) {
      var propio = Number(item.getAttribute('data-mq-paso'));
      item.className = 'mq-paso ' + (propio < numero ? 'mq-paso--completado'
        : propio === numero ? 'mq-paso--actual' : 'mq-paso--pendiente');
      if (propio === numero) {
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
      }
      // El paso completado se marca con tilde; el resto conserva su número.
      M.$('.mq-paso__marca', item).textContent = propio < numero ? '✓' : String(propio);
    });
  }

  function pintarAvance(numero) {
    var porcentaje = Math.round((numero / TOTAL_PASOS) * 100);
    Object.keys(ANCHOS_DE_BARRA).forEach(function (clave) {
      barra.classList.remove(ANCHOS_DE_BARRA[clave]);
    });
    barra.classList.add(ANCHOS_DE_BARRA[numero]);
    contenedorProgreso.setAttribute('aria-valuenow', String(porcentaje));
  }

  function pintarPaso(numero) {
    pasoActual = numero;
    pintarIndicadorDePasos(numero);
    pintarAvance(numero);

    etiquetaPaso.textContent = 'Paso ' + numero + ' de ' + TOTAL_PASOS + ' — ' + TITULOS[numero];
    indicadorPaso.textContent = numero + '/' + TOTAL_PASOS;
    anuncioPaso.textContent = 'Paso ' + numero + ' de ' + TOTAL_PASOS + ': ' + TITULOS[numero];
    botonAnterior.disabled = numero === 1;

    // El foco va al encabezado del paso nuevo, no al arrancar la página.
    if (!arranque) M.$('#mq-main').focus();
  }

  function pintarCierre() {
    pintarIndicadorDePasos(TOTAL_PASOS + 1);
    pintarAvance(TOTAL_PASOS);
    etiquetaPaso.textContent = 'Encuesta completada';
    indicadorPaso.textContent = TOTAL_PASOS + '/' + TOTAL_PASOS;
    anuncioPaso.textContent = 'Encuesta registrada.';
  }

  /* ----------------------------------------------------------------------------------------- *
   * Recolección y acuse
   * ----------------------------------------------------------------------------------------- */
  function recolectar() {
    return {
      id: M.nuevoId('enc'),
      nombre: M.$('#nombre').value.trim(),
      edad: Number(M.$('#edad').value),
      localidad: M.$('#localidad').value,
      medios: mediosSeleccionados(),
      frecuencia: M.$('#frecuencia').value,
      distancia: Number(M.$('#distancia').value),
      minutos: Number(M.$('#minutos').value),
      motivo: M.$('#motivo').value
    };
  }

  function texto(testid, valor) {
    M.$('[data-testid="' + testid + '"]').textContent = valor;
  }

  function renderResumen(respuesta) {
    texto('resumen-persona', respuesta.nombre + ' (' + respuesta.edad + ' años)');
    texto('resumen-localidad', respuesta.localidad);
    texto('resumen-medios', respuesta.medios.map(function (medio) {
      return ETIQUETAS_MEDIOS[medio];
    }).join(', '));
    texto('resumen-frecuencia', ETIQUETAS_FRECUENCIA[respuesta.frecuencia]);
    texto('resumen-distancia', M.formatearNumero(respuesta.distancia) + ' km');
    texto('resumen-minutos', respuesta.minutos + ' min');
    texto('resumen-motivo', M.$('#motivo option[value="' + respuesta.motivo + '"]').textContent);
  }

  /** El desplegable se alimenta del ABM: es la única fuente de localidades del producto. */
  function cargarLocalidades() {
    var select = M.$('#localidad');
    M.obtenerLocalidades().forEach(function (localidad) {
      var opcion = document.createElement('option');
      opcion.value = localidad.nombre;
      opcion.textContent = localidad.nombre + ' (' + localidad.provincia + ')';
      select.appendChild(opcion);
    });
  }

  /* ----------------------------------------------------------------------------------------- *
   * Hooks de la superficie
   * ----------------------------------------------------------------------------------------- */
  global.renderSuperficie = function (fachada) {
    M = fachada;

    etiquetaPaso = M.$('[data-testid="etiqueta-paso"]');
    indicadorPaso = M.$('[data-testid="indicador-paso"]');
    anuncioPaso = M.$('[data-mq-anuncio-paso]');
    barra = M.$('#barraProgreso');
    contenedorProgreso = M.$('[data-testid="progreso-contenedor"]');
    botonAnterior = M.$('#anterior');

    cargarLocalidades();

    M.$('#siguiente').addEventListener('click', function () {
      M.ocultarAviso();
      if (!validarPaso(pasoActual)) {
        M.mostrarAviso('Complete los datos del paso antes de continuar.', 'peligro');
        return;
      }
      if (pasoActual < TOTAL_PASOS) M.aplicarEstado('paso-' + (pasoActual + 1));
    });

    botonAnterior.addEventListener('click', function () {
      M.ocultarAviso();
      if (pasoActual > 1) M.aplicarEstado('paso-' + (pasoActual - 1));
    });

    M.$('#finalizar').addEventListener('click', function () {
      M.ocultarAviso();
      if (!validarPaso(TOTAL_PASOS)) {
        M.mostrarAviso('Complete los datos del paso antes de continuar.', 'peligro');
        return;
      }
      var respuesta = recolectar();
      M.agregarEncuesta(respuesta);
      renderResumen(respuesta);
      M.aplicarEstado('exito');
    });

    M.$('#reiniciar').addEventListener('click', function () {
      global.location.reload();
    });
  };

  /** Corre antes de cada pasada de visibilidad, con el identificador del estado que entra. */
  global.alCambiarEstado = function (id) {
    if (!M) return;
    var numero = Number((id.match(/^paso-([1-3])$/) || [])[1]);
    if (numero) {
      pintarPaso(numero);
    } else if (id === 'exito') {
      pintarCierre();
    }
    arranque = false;
  };
})(window);

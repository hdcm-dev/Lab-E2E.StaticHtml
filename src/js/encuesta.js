/** Asistente de encuesta en tres pasos, con validación por paso y resumen final. */
(function () {
  'use strict';

  var TOTAL_PASOS = 3;
  var TITULOS = {
    1: 'Datos de la persona',
    2: 'Medios que utiliza para viajar',
    3: 'Distancia recorrida'
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

  var formulario = document.getElementById('formulario');
  var resumen = document.getElementById('resumen');
  var etiquetaPaso = document.querySelector('[data-testid="etiqueta-paso"]');
  var indicadorPaso = document.querySelector('[data-testid="indicador-paso"]');
  var barra = document.getElementById('barraProgreso');
  var contenedorProgreso = document.querySelector('[data-testid="progreso-contenedor"]');
  var botonAnterior = document.getElementById('anterior');
  var botonSiguiente = document.getElementById('siguiente');
  var botonFinalizar = document.getElementById('finalizar');
  var botonReiniciar = document.getElementById('reiniciar');
  var errorMedios = document.querySelector('[data-testid="error-medios"]');

  var pasoActual = 1;

  function seccion(numero) {
    return document.querySelector('[data-paso="' + numero + '"]');
  }

  function mediosSeleccionados() {
    return Array.prototype.map.call(
      document.querySelectorAll('input[name="medios"]:checked'),
      function (entrada) { return entrada.value; }
    );
  }

  function validarPaso(numero) {
    var errores = 0;

    if (numero === 1) {
      var nombre = document.getElementById('nombre');
      var edad = document.getElementById('edad');
      var localidad = document.getElementById('localidad');
      [nombre, edad, localidad].forEach(App.limpiarError);

      if (nombre.value.trim().length < 3) {
        App.marcarError(nombre, 'Ingrese nombre y apellido (mínimo 3 caracteres).');
        errores += 1;
      }
      var valorEdad = Number(edad.value);
      if (!edad.value || !Number.isInteger(valorEdad) || valorEdad < 16 || valorEdad > 110) {
        App.marcarError(edad, 'La edad debe estar entre 16 y 110 años.');
        errores += 1;
      }
      if (!localidad.value) {
        App.marcarError(localidad, 'Seleccione una localidad.');
        errores += 1;
      }
    }

    if (numero === 2) {
      var frecuencia = document.getElementById('frecuencia');
      App.limpiarError(frecuencia);
      errorMedios.classList.add('d-none');
      errorMedios.textContent = '';

      if (mediosSeleccionados().length === 0) {
        errorMedios.textContent = 'Seleccione al menos un medio de transporte.';
        errorMedios.classList.remove('d-none');
        errores += 1;
      }
      if (!frecuencia.value) {
        App.marcarError(frecuencia, 'Seleccione la frecuencia de uso.');
        errores += 1;
      }
    }

    if (numero === 3) {
      var distancia = document.getElementById('distancia');
      var minutos = document.getElementById('minutos');
      var motivo = document.getElementById('motivo');
      [distancia, minutos, motivo].forEach(App.limpiarError);

      var valorDistancia = Number(distancia.value);
      if (distancia.value === '' || Number.isNaN(valorDistancia) || valorDistancia < 0 || valorDistancia > 500) {
        App.marcarError(distancia, 'Ingrese una distancia entre 0 y 500 km.');
        errores += 1;
      }
      var valorMinutos = Number(minutos.value);
      if (!minutos.value || !Number.isInteger(valorMinutos) || valorMinutos < 1 || valorMinutos > 600) {
        App.marcarError(minutos, 'Ingrese un tiempo entre 1 y 600 minutos.');
        errores += 1;
      }
      if (!motivo.value) {
        App.marcarError(motivo, 'Seleccione el motivo principal del viaje.');
        errores += 1;
      }
    }

    return errores === 0;
  }

  function pintarPaso() {
    for (var numero = 1; numero <= TOTAL_PASOS; numero += 1) {
      seccion(numero).hidden = numero !== pasoActual;
    }

    var porcentaje = Math.round((pasoActual / TOTAL_PASOS) * 100);
    barra.style.width = porcentaje + '%';
    contenedorProgreso.setAttribute('aria-valuenow', String(porcentaje));
    etiquetaPaso.textContent = 'Paso ' + pasoActual + ' de ' + TOTAL_PASOS + ' — ' + TITULOS[pasoActual];
    indicadorPaso.textContent = pasoActual + '/' + TOTAL_PASOS;

    botonAnterior.disabled = pasoActual === 1;
    botonSiguiente.classList.toggle('d-none', pasoActual === TOTAL_PASOS);
    botonFinalizar.classList.toggle('d-none', pasoActual !== TOTAL_PASOS);
  }

  function recolectar() {
    return {
      id: App.nuevoId('enc'),
      nombre: document.getElementById('nombre').value.trim(),
      edad: Number(document.getElementById('edad').value),
      localidad: document.getElementById('localidad').value,
      medios: mediosSeleccionados(),
      frecuencia: document.getElementById('frecuencia').value,
      distancia: Number(document.getElementById('distancia').value),
      minutos: Number(document.getElementById('minutos').value),
      motivo: document.getElementById('motivo').value
    };
  }

  function texto(testid, valor) {
    document.querySelector('[data-testid="' + testid + '"]').textContent = valor;
  }

  function mostrarResumen(respuesta) {
    texto('resumen-persona', respuesta.nombre + ' (' + respuesta.edad + ' años)');
    texto('resumen-localidad', respuesta.localidad);
    texto('resumen-medios', respuesta.medios.map(function (medio) {
      return ETIQUETAS_MEDIOS[medio];
    }).join(', '));
    texto('resumen-frecuencia', ETIQUETAS_FRECUENCIA[respuesta.frecuencia]);
    texto('resumen-distancia', App.formatearNumero(respuesta.distancia) + ' km');
    texto('resumen-minutos', respuesta.minutos + ' min');
    texto('resumen-motivo', document.querySelector('#motivo option[value="' + respuesta.motivo + '"]').textContent);

    formulario.hidden = true;
    resumen.hidden = false;
    botonAnterior.classList.add('d-none');
    botonFinalizar.classList.add('d-none');
    botonSiguiente.classList.add('d-none');
    botonReiniciar.classList.remove('d-none');
    etiquetaPaso.textContent = 'Encuesta completada';
    indicadorPaso.textContent = '3/3';
    barra.style.width = '100%';
    barra.classList.add('bg-success');
  }

  function cargarLocalidades() {
    var select = document.getElementById('localidad');
    App.obtenerLocalidades().forEach(function (localidad) {
      var opcion = document.createElement('option');
      opcion.value = localidad.nombre;
      opcion.textContent = localidad.nombre + ' (' + localidad.provincia + ')';
      select.appendChild(opcion);
    });
  }

  botonSiguiente.addEventListener('click', function () {
    App.ocultarAviso();
    if (!validarPaso(pasoActual)) {
      App.mostrarAviso('Complete los datos del paso antes de continuar.', 'danger');
      return;
    }
    if (pasoActual < TOTAL_PASOS) {
      pasoActual += 1;
      pintarPaso();
    }
  });

  botonAnterior.addEventListener('click', function () {
    App.ocultarAviso();
    if (pasoActual > 1) {
      pasoActual -= 1;
      pintarPaso();
    }
  });

  botonFinalizar.addEventListener('click', function () {
    App.ocultarAviso();
    if (!validarPaso(TOTAL_PASOS)) {
      App.mostrarAviso('Complete los datos del paso antes de continuar.', 'danger');
      return;
    }
    var respuesta = recolectar();
    App.agregarEncuesta(respuesta);
    mostrarResumen(respuesta);
  });

  botonReiniciar.addEventListener('click', function () {
    window.location.reload();
  });

  cargarLocalidades();
  pintarPaso();
})();

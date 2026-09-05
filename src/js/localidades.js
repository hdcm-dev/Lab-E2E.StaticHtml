/**
 * Superficie «Localidades»: ABM sobre `localStorage`.
 *
 * Sólo declara los dos hooks. El armazón (`js/main.js`) los llama: `renderSuperficie` una vez,
 * cuando el documento está listo, y `alCambiarEstado` antes de cada pasada de visibilidad.
 *
 * Estados declarados en el marcado: `vacio` y `con-datos`. El motivo por el que `cargando` y
 * `filtrado-sin-resultados` no aplican está escrito en `localidades.html`, junto a los bloques.
 */
(function (global) {
  'use strict';

  // La transición que la fila ofrece es una sola, y el rótulo de la operación nombra el verbo
  // exacto: nunca «Aceptar» ni «Enviar».
  var ROTULO_EDITAR = 'Editar';
  var ROTULO_BAJA = 'Dar de baja';

  var M = null;
  var formulario;
  var cuerpoTabla;
  var contador;
  var tituloFormulario;
  var rotuloGuardar;
  var campoId;
  var dialogoBaja;
  var nombreEnDialogo;

  var idPendienteDeBaja = null;
  var bajaConfirmada = false;

  function campos() {
    return {
      nombre: document.getElementById('nombre'),
      provincia: document.getElementById('provincia'),
      codigoPostal: document.getElementById('codigoPostal'),
      habitantes: document.getElementById('habitantes')
    };
  }

  /* ----------------------------------------------------------------------------------------- *
   * Validación
   * ----------------------------------------------------------------------------------------- */
  function validar() {
    var c = campos();
    var errores = 0;

    Object.keys(c).forEach(function (clave) { M.limpiarError(c[clave]); });

    if (c.nombre.value.trim().length < 3) {
      M.marcarError(c.nombre, 'El nombre debe tener al menos 3 caracteres.');
      errores += 1;
    }
    if (!c.provincia.value) {
      M.marcarError(c.provincia, 'Seleccione una provincia.');
      errores += 1;
    }
    if (!/^\d{4}$/.test(c.codigoPostal.value.trim())) {
      M.marcarError(c.codigoPostal, 'El código postal debe tener 4 dígitos.');
      errores += 1;
    }
    var habitantes = Number(c.habitantes.value);
    if (!c.habitantes.value || !Number.isInteger(habitantes) || habitantes < 1) {
      M.marcarError(c.habitantes, 'Ingrese una cantidad de habitantes mayor a cero.');
      errores += 1;
    }

    return errores === 0;
  }

  /** El nombre es único dentro de la provincia; `idActual` excluye el registro en edición. */
  function estaDuplicada(nombre, provincia, idActual) {
    return M.obtenerLocalidades().some(function (localidad) {
      return localidad.id !== idActual &&
        localidad.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
        localidad.provincia === provincia;
    });
  }

  /* ----------------------------------------------------------------------------------------- *
   * Render de la colección
   * ----------------------------------------------------------------------------------------- */
  function iniciales(nombre) {
    return nombre.trim().split(/\s+/).slice(0, 2).map(function (palabra) {
      return palabra.charAt(0).toUpperCase();
    }).join('');
  }

  /**
   * Las dos operaciones llevan nombre accesible completo: el texto visible dice el verbo, y el
   * nombre accesible dice el verbo y la fila. Sin eso el lector de pantalla anuncia una hilera de
   * botones «Editar» indistinguibles.
   */
  function operaciones(localidad) {
    return '<span class="mq-acciones-fila">' +
      '<button type="button" class="mq-btn mq-btn--secundario mq-btn--chico"' +
      ' data-testid="boton-editar" data-mq-editar="' + M.esc(localidad.id) + '"' +
      ' aria-label="' + M.esc(ROTULO_EDITAR + ' ' + localidad.nombre) + '">' +
      M.icono('editar', 15) + ROTULO_EDITAR + '</button>' +
      '<button type="button" class="mq-btn mq-btn--destructivo mq-btn--chico"' +
      ' data-testid="boton-eliminar" data-mq-baja="' + M.esc(localidad.id) + '"' +
      ' aria-label="' + M.esc(ROTULO_BAJA + ' ' + localidad.nombre) + '">' +
      M.icono('eliminar', 15) + ROTULO_BAJA + '</button>' +
      '</span>';
  }

  function fila(localidad) {
    return '<tr data-testid="fila" data-id="' + M.esc(localidad.id) + '">' +
      '<th scope="row" class="mq-th-plano" data-testid="celda-nombre">' +
        '<span class="mq-iniciales" aria-hidden="true">' + M.esc(iniciales(localidad.nombre)) + '</span>' +
        M.esc(localidad.nombre) +
      '</th>' +
      '<td data-testid="celda-provincia">' + M.esc(localidad.provincia) + '</td>' +
      '<td data-testid="celda-codigo-postal">' + M.esc(localidad.codigoPostal) + '</td>' +
      '<td class="mq-num" data-testid="celda-habitantes">' +
        M.esc(M.formatearNumero(localidad.habitantes)) + '</td>' +
      '<td class="mq-td-acciones">' + operaciones(localidad) + '</td>' +
    '</tr>';
  }

  function renderListadoDeLocalidades() {
    var localidades = M.obtenerLocalidades();
    cuerpoTabla.innerHTML = localidades.map(fila).join('');
    contador.textContent = String(localidades.length);
    // El estado sale de los datos: no hay una rama en JavaScript que muestre y oculte bloques.
    M.aplicarEstado(localidades.length > 0 ? 'con-datos' : 'vacio');
  }

  /* ----------------------------------------------------------------------------------------- *
   * Modos del formulario
   * ----------------------------------------------------------------------------------------- */
  function modoAlta() {
    campoId.value = '';
    formulario.reset();
    Object.keys(campos()).forEach(function (clave) { M.limpiarError(campos()[clave]); });
    tituloFormulario.textContent = 'Alta de localidad';
    rotuloGuardar.textContent = 'Guardar';
  }

  function editar(id) {
    var localidad = M.obtenerLocalidades().find(function (item) { return item.id === id; });
    if (!localidad) return;

    var c = campos();
    campoId.value = localidad.id;
    c.nombre.value = localidad.nombre;
    c.provincia.value = localidad.provincia;
    c.codigoPostal.value = localidad.codigoPostal;
    c.habitantes.value = String(localidad.habitantes);

    Object.keys(c).forEach(function (clave) { M.limpiarError(c[clave]); });
    tituloFormulario.textContent = 'Editar localidad';
    rotuloGuardar.textContent = 'Actualizar';
    M.ocultarAviso();
    c.nombre.focus();
  }

  /* ----------------------------------------------------------------------------------------- *
   * Baja
   * ----------------------------------------------------------------------------------------- */
  function pedirBaja(id, disparador) {
    var localidad = M.obtenerLocalidades().find(function (item) { return item.id === id; });
    if (!localidad) return;
    idPendienteDeBaja = localidad.id;
    nombreEnDialogo.textContent = localidad.nombre;
    M.abrirDialogo(dialogoBaja, disparador);
  }

  /**
   * La baja se aplica al cerrarse el diálogo, no en el click: así el `<dialog>` ya soltó el foco
   * y su velo cuando se redibuja la tabla, y el foco no queda dentro de un nodo que dejó de existir.
   */
  function aplicarBaja() {
    if (!bajaConfirmada || !idPendienteDeBaja) {
      bajaConfirmada = false;
      idPendienteDeBaja = null;
      return;
    }

    var localidades = M.obtenerLocalidades();
    var eliminada = localidades.find(function (item) { return item.id === idPendienteDeBaja; });
    M.guardarLocalidades(localidades.filter(function (item) { return item.id !== idPendienteDeBaja; }));

    bajaConfirmada = false;
    idPendienteDeBaja = null;

    renderListadoDeLocalidades();
    if (campoId.value === '') modoAlta();
    M.mostrarAviso('Se eliminó la localidad ' + (eliminada ? eliminada.nombre : '') + '.', 'atencion');
  }

  /* ----------------------------------------------------------------------------------------- *
   * Hooks de la superficie
   * ----------------------------------------------------------------------------------------- */
  global.renderSuperficie = function (fachada) {
    M = fachada;

    formulario = M.$('#formulario');
    cuerpoTabla = M.$('#cuerpoTabla');
    contador = M.$('[data-testid="contador"]');
    tituloFormulario = M.$('[data-testid="titulo-formulario"]');
    rotuloGuardar = M.$('[data-mq-rotulo-guardar]');
    campoId = M.$('#id');
    dialogoBaja = M.$('#dialogoBaja');
    nombreEnDialogo = M.$('[data-testid="modal-nombre"]');

    M.$('[data-mq-ico-guardar]').insertAdjacentHTML('afterbegin', M.icono('guardar', 16));
    M.$('[data-mq-ico-vacio]').innerHTML = M.icono('vacio', 24);

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      M.ocultarAviso();

      if (!validar()) {
        M.mostrarAviso('Revise los campos marcados en rojo.', 'peligro');
        return;
      }

      var c = campos();
      var id = campoId.value;

      if (estaDuplicada(c.nombre.value, c.provincia.value, id)) {
        M.marcarError(c.nombre, 'Ya existe una localidad con ese nombre en la provincia.');
        M.mostrarAviso('Revise los campos marcados en rojo.', 'peligro');
        return;
      }

      var localidades = M.obtenerLocalidades();
      var datos = {
        nombre: c.nombre.value.trim(),
        provincia: c.provincia.value,
        codigoPostal: c.codigoPostal.value.trim(),
        habitantes: Number(c.habitantes.value)
      };

      if (id) {
        M.guardarLocalidades(localidades.map(function (item) {
          return item.id === id ? Object.assign({}, item, datos) : item;
        }));
        M.mostrarAviso('Se actualizó la localidad ' + datos.nombre + '.', 'exito');
      } else {
        datos.id = M.nuevoId('loc');
        localidades.push(datos);
        M.guardarLocalidades(localidades);
        M.mostrarAviso('Se agregó la localidad ' + datos.nombre + '.', 'exito');
      }

      modoAlta();
      renderListadoDeLocalidades();
    });

    M.$('#cancelar').addEventListener('click', function () {
      modoAlta();
      M.ocultarAviso();
    });

    // Delegación: las filas se rearman enteras en cada render, y un listener por botón habría que
    // volver a colgarlo cada vez.
    cuerpoTabla.addEventListener('click', function (evento) {
      var botonEditar = evento.target.closest('[data-mq-editar]');
      if (botonEditar) {
        editar(botonEditar.getAttribute('data-mq-editar'));
        return;
      }
      var botonBaja = evento.target.closest('[data-mq-baja]');
      if (botonBaja) {
        pedirBaja(botonBaja.getAttribute('data-mq-baja'), botonBaja);
      }
    });

    // El cierre se pide desde acá y la baja se aplica en `close`: la bandera se fija antes de
    // pedir el cierre, así llega a tiempo al manejador.
    M.$('#confirmarBorrado').addEventListener('click', function () {
      bajaConfirmada = true;
      dialogoBaja.close();
    });
    dialogoBaja.addEventListener('close', aplicarBaja);

    renderListadoDeLocalidades();
  };
})(window);

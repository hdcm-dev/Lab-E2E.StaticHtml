/** ABM de localidades: alta, modificación y baja sobre `localStorage`. */
(function () {
  'use strict';

  var formulario = document.getElementById('formulario');
  var cuerpoTabla = document.getElementById('cuerpoTabla');
  var sinDatos = document.getElementById('sinDatos');
  var contador = document.querySelector('[data-testid="contador"]');
  var tituloFormulario = document.querySelector('[data-testid="titulo-formulario"]');
  var botonCancelar = document.getElementById('cancelar');
  var botonGuardar = document.querySelector('[data-testid="boton-guardar"]');
  var campoId = document.getElementById('id');
  var modalElemento = document.getElementById('modalBorrar');
  var modalNombre = document.querySelector('[data-testid="modal-nombre"]');
  var botonConfirmarBaja = document.getElementById('confirmarBorrado');
  var modal = new bootstrap.Modal(modalElemento);

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

  function validar() {
    var c = campos();
    var errores = 0;

    Object.keys(c).forEach(function (clave) { App.limpiarError(c[clave]); });

    if (c.nombre.value.trim().length < 3) {
      App.marcarError(c.nombre, 'El nombre debe tener al menos 3 caracteres.');
      errores += 1;
    }
    if (!c.provincia.value) {
      App.marcarError(c.provincia, 'Seleccione una provincia.');
      errores += 1;
    }
    if (!/^\d{4}$/.test(c.codigoPostal.value.trim())) {
      App.marcarError(c.codigoPostal, 'El código postal debe tener 4 dígitos.');
      errores += 1;
    }
    var habitantes = Number(c.habitantes.value);
    if (!c.habitantes.value || !Number.isInteger(habitantes) || habitantes < 1) {
      App.marcarError(c.habitantes, 'Ingrese una cantidad de habitantes mayor a cero.');
      errores += 1;
    }

    return errores === 0;
  }

  /** El nombre es único dentro de la provincia; `idActual` excluye el registro en edición. */
  function estaDuplicada(nombre, provincia, idActual) {
    return App.obtenerLocalidades().some(function (localidad) {
      return localidad.id !== idActual &&
        localidad.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
        localidad.provincia === provincia;
    });
  }

  function dibujarTabla() {
    var localidades = App.obtenerLocalidades();
    cuerpoTabla.innerHTML = '';

    localidades.forEach(function (localidad) {
      var fila = document.createElement('tr');
      fila.setAttribute('data-testid', 'fila');
      fila.setAttribute('data-id', localidad.id);

      var celdaNombre = document.createElement('td');
      celdaNombre.setAttribute('data-testid', 'celda-nombre');
      celdaNombre.textContent = localidad.nombre;

      var celdaProvincia = document.createElement('td');
      celdaProvincia.setAttribute('data-testid', 'celda-provincia');
      celdaProvincia.textContent = localidad.provincia;

      var celdaCodigo = document.createElement('td');
      celdaCodigo.setAttribute('data-testid', 'celda-codigo-postal');
      celdaCodigo.textContent = localidad.codigoPostal;

      var celdaHabitantes = document.createElement('td');
      celdaHabitantes.className = 'text-end';
      celdaHabitantes.setAttribute('data-testid', 'celda-habitantes');
      celdaHabitantes.textContent = App.formatearNumero(localidad.habitantes);

      var celdaAcciones = document.createElement('td');
      celdaAcciones.className = 'text-end';

      var botonEditar = document.createElement('button');
      botonEditar.type = 'button';
      botonEditar.className = 'btn btn-sm btn-outline-primary me-2';
      botonEditar.setAttribute('data-testid', 'boton-editar');
      botonEditar.setAttribute('aria-label', 'Editar ' + localidad.nombre);
      botonEditar.textContent = 'Editar';
      botonEditar.addEventListener('click', function () { editar(localidad.id); });

      var botonEliminar = document.createElement('button');
      botonEliminar.type = 'button';
      botonEliminar.className = 'btn btn-sm btn-outline-danger';
      botonEliminar.setAttribute('data-testid', 'boton-eliminar');
      botonEliminar.setAttribute('aria-label', 'Eliminar ' + localidad.nombre);
      botonEliminar.textContent = 'Eliminar';
      botonEliminar.addEventListener('click', function () { pedirBaja(localidad); });

      celdaAcciones.appendChild(botonEditar);
      celdaAcciones.appendChild(botonEliminar);

      fila.appendChild(celdaNombre);
      fila.appendChild(celdaProvincia);
      fila.appendChild(celdaCodigo);
      fila.appendChild(celdaHabitantes);
      fila.appendChild(celdaAcciones);
      cuerpoTabla.appendChild(fila);
    });

    contador.textContent = String(localidades.length);
    sinDatos.classList.toggle('d-none', localidades.length > 0);
  }

  function modoAlta() {
    campoId.value = '';
    formulario.reset();
    Object.keys(campos()).forEach(function (clave) { App.limpiarError(campos()[clave]); });
    tituloFormulario.textContent = 'Alta de localidad';
    botonGuardar.textContent = 'Guardar';
  }

  function editar(id) {
    var localidad = App.obtenerLocalidades().find(function (item) { return item.id === id; });
    if (!localidad) return;

    var c = campos();
    campoId.value = localidad.id;
    c.nombre.value = localidad.nombre;
    c.provincia.value = localidad.provincia;
    c.codigoPostal.value = localidad.codigoPostal;
    c.habitantes.value = String(localidad.habitantes);

    Object.keys(c).forEach(function (clave) { App.limpiarError(c[clave]); });
    tituloFormulario.textContent = 'Editar localidad';
    botonGuardar.textContent = 'Actualizar';
    App.ocultarAviso();
    c.nombre.focus();
  }

  function pedirBaja(localidad) {
    idPendienteDeBaja = localidad.id;
    modalNombre.textContent = localidad.nombre;
    modal.show();
  }

  /**
   * La baja se aplica en `hidden.bs.modal`, no en el click: así el diálogo y su fondo ya se
   * retiraron del DOM cuando se redibuja la tabla, y no queda un backdrop tapando la pantalla.
   */
  function aplicarBaja() {
    if (!bajaConfirmada || !idPendienteDeBaja) {
      bajaConfirmada = false;
      idPendienteDeBaja = null;
      return;
    }

    var localidades = App.obtenerLocalidades();
    var eliminada = localidades.find(function (item) { return item.id === idPendienteDeBaja; });
    App.guardarLocalidades(localidades.filter(function (item) { return item.id !== idPendienteDeBaja; }));

    bajaConfirmada = false;
    idPendienteDeBaja = null;

    dibujarTabla();
    if (campoId.value === '') modoAlta();
    App.mostrarAviso('Se eliminó la localidad ' + (eliminada ? eliminada.nombre : '') + '.', 'warning');
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    App.ocultarAviso();

    if (!validar()) {
      App.mostrarAviso('Revise los campos marcados en rojo.', 'danger');
      return;
    }

    var c = campos();
    var id = campoId.value;

    if (estaDuplicada(c.nombre.value, c.provincia.value, id)) {
      App.marcarError(c.nombre, 'Ya existe una localidad con ese nombre en la provincia.');
      App.mostrarAviso('Revise los campos marcados en rojo.', 'danger');
      return;
    }

    var localidades = App.obtenerLocalidades();
    var datos = {
      nombre: c.nombre.value.trim(),
      provincia: c.provincia.value,
      codigoPostal: c.codigoPostal.value.trim(),
      habitantes: Number(c.habitantes.value)
    };

    if (id) {
      localidades = localidades.map(function (item) {
        return item.id === id ? Object.assign({}, item, datos) : item;
      });
      App.guardarLocalidades(localidades);
      App.mostrarAviso('Se actualizó la localidad ' + datos.nombre + '.', 'success');
    } else {
      datos.id = App.nuevoId('loc');
      localidades.push(datos);
      App.guardarLocalidades(localidades);
      App.mostrarAviso('Se agregó la localidad ' + datos.nombre + '.', 'success');
    }

    modoAlta();
    dibujarTabla();
  });

  botonCancelar.addEventListener('click', function () {
    modoAlta();
    App.ocultarAviso();
  });

  // El cierre se pide desde acá y no con `data-bs-dismiss`: el manejador delegado de Bootstrap
  // corre antes que este listener, y la bandera llegaría tarde a `hidden.bs.modal`.
  botonConfirmarBaja.addEventListener('click', function () {
    bajaConfirmada = true;
    modal.hide();
  });
  modalElemento.addEventListener('hidden.bs.modal', aplicarBaja);

  dibujarTabla();
})();

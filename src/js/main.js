/**
 * Armazón compartido por las páginas del laboratorio, en la forma constructiva del
 * Template-HTML-SDD-Default (`Knowledge-Template-HTML-SDD-Default.md`).
 *
 * IIFE única sobre `window`, dividida en bloques comentados, sin objetos-namespace y sin módulos
 * ES. Publica `window.App`, que es la fachada que cada superficie recibe por parámetro, y arranca
 * sola: releva del DOM los estados declarados, llama al hook de la superficie y aplica el estado
 * inicial. Es inversión de control —la página no llama al armazón, el armazón llama a la página—.
 *
 * Bloques: sello de versión · iconografía · utilidades · navegación · almacenamiento ·
 * avisos · validación · conmutación de estados · diálogos · arranque.
 */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------------------------------- *
   * Sello de versión
   *
   * Una instancia desplegada sin versión visible no es diagnosticable. El valor acompaña al de
   * `package.json`: al subir uno hay que subir el otro (queda anotado en CLAUDE.md). El sitio es
   * estático y sin proceso de build, así que no hay de dónde derivarlo en tiempo de carga.
   * --------------------------------------------------------------------------------------- */
  var VERSION = '1.0.0';

  /* --------------------------------------------------------------------------------------- *
   * Iconografía
   *
   * Diccionario de trazos SVG inline, grilla de 24 y trazo 1.75, que heredan el color por
   * `currentColor`. Sin pack por CDN ni raster: no dependen de la red y escalan con el texto.
   * --------------------------------------------------------------------------------------- */
  var ICONOS = {
    marca: '<path d="M4 12 12 4l8 8"/><path d="M6.5 10.5V19h11v-8.5"/>',
    listado: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.01"/>' +
      '<path d="M4.5 12h.01"/><path d="M4.5 18h.01"/>',
    formulario: '<path d="M5 4h14v16H5z"/><path d="M8.5 9h7"/><path d="M8.5 13h7"/><path d="M8.5 17h3"/>',
    editar: '<path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l4 4"/>',
    eliminar: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/>' +
      '<path d="M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4.5h6V7"/>',
    guardar: '<path d="M5 12l5 5L20 7"/>',
    alerta: '<path d="M12 9v4"/><path d="M12 17h.01"/>' +
      '<path d="M10.24 3.96 1.98 18a2 2 0 0 0 1.71 3h16.62a2 2 0 0 0 1.71-3L13.76 3.96a2 2 0 0 0-3.52 0z"/>',
    vacio: '<path d="M4 13h4l1.5 3h5L16 13h4"/>' +
      '<path d="M6.5 5h11l2.5 8v5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-5z"/>',
    flechaDerecha: '<path d="M5 12h13"/><path d="M13 7l5 5-5 5"/>'
  };

  /**
   * Devuelve el SVG inline del ícono.
   * Sin `titulo` es decorativo (`aria-hidden`); con `titulo`, significativo (`role="img"`).
   */
  function icono(nombre, tamanio, titulo) {
    var trazos = ICONOS[nombre];
    if (!trazos) return '';
    var lado = tamanio || 16;
    var semantica = titulo
      ? ' role="img"><title>' + esc(titulo) + '</title>'
      : ' aria-hidden="true">';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + lado +
      '" height="' + lado + '" fill="none" stroke="currentColor" stroke-width="1.75" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + semantica + trazos + '</svg>';
  }

  /* --------------------------------------------------------------------------------------- *
   * Utilidades
   * --------------------------------------------------------------------------------------- */
  function $(selector, raiz) {
    return (raiz || document).querySelector(selector);
  }

  function $$(selector, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(selector));
  }

  /** Escapa `& < > "`. Obligatorio antes de todo `innerHTML`. */
  function esc(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Lee un parámetro de la URL. Degrada a `null` donde no hay `URLSearchParams`. */
  function parametro(nombre) {
    if (!global.URLSearchParams) return null;
    return new global.URLSearchParams(global.location.search).get(nombre);
  }

  function formatearNumero(valor) {
    return new Intl.NumberFormat('es-AR').format(valor);
  }

  /** Identificador estable sin dependencias: marca de tiempo + contador. */
  var secuencia = 0;
  function nuevoId(prefijo) {
    secuencia += 1;
    return prefijo + '-' + Date.now().toString(36) + '-' + secuencia;
  }

  /* --------------------------------------------------------------------------------------- *
   * Navegación entre superficies
   *
   * El ítem activo se resuelve por `data-destino` del `<body>` contra `data-mq-destino` del
   * enlace: el camino de navegación es un dato declarado en el marcado, no una comparación de
   * cadenas de `location`.
   * --------------------------------------------------------------------------------------- */
  /** Pinta la marca: el ícono sale del diccionario, el rótulo sale del propio marcado. */
  function pintarMarca() {
    var marca = $('[data-mq-ico-marca]');
    if (!marca) return;
    marca.innerHTML = icono('marca', 20) + '<span>' + esc(marca.textContent.trim()) + '</span>';
  }

  function pintarNavegacion() {
    var destino = document.body.getAttribute('data-destino');
    $$('[data-mq-destino]').forEach(function (enlace) {
      var activo = enlace.getAttribute('data-mq-destino') === destino;
      enlace.classList.toggle('mq-nav__enlace--activo', activo);
      if (activo) {
        enlace.setAttribute('aria-current', 'page');
      } else {
        enlace.removeAttribute('aria-current');
      }
    });
  }

  /** Escribe el sello de versión en el pie de la página. */
  function pintarSelloDeVersion() {
    var sello = $('[data-mq-sello]');
    if (sello) sello.textContent = 'v' + VERSION;
  }

  /* --------------------------------------------------------------------------------------- *
   * Almacenamiento
   *
   * Todo el estado del producto vive en `localStorage`: alcanza para una demostración estática y
   * hace que las pruebas E2E puedan preparar o limpiar datos sin depender de un backend.
   * --------------------------------------------------------------------------------------- */
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

  /* --------------------------------------------------------------------------------------- *
   * Bandas de resultado
   *
   * Una sola banda por superficie, en `#aviso`, que cambia de tono según el resultado. El tono es
   * del catálogo (`exito` | `atencion` | `peligro` | `info`) y nunca es el único canal: la banda
   * imprime siempre su texto.
   * --------------------------------------------------------------------------------------- */
  var TONOS = ['exito', 'atencion', 'peligro', 'info'];

  /** Aplica un tono y saca los otros, sin pisar las clases de composición del marcado. */
  function pintarTono(aviso, tono) {
    TONOS.forEach(function (candidato) {
      aviso.classList.toggle('mq-banda--' + candidato, candidato === tono);
    });
  }

  function mostrarAviso(mensaje, tono) {
    var aviso = $('#aviso');
    if (!aviso) return;
    pintarTono(aviso, tono || 'info');
    aviso.setAttribute('role', tono === 'peligro' ? 'alert' : 'status');
    aviso.textContent = mensaje;
    aviso.hidden = false;
  }

  function ocultarAviso() {
    var aviso = $('#aviso');
    if (!aviso) return;
    pintarTono(aviso, null);
    aviso.textContent = '';
    aviso.hidden = true;
  }

  /* --------------------------------------------------------------------------------------- *
   * Validación
   *
   * El mensaje se asocia al campo por `aria-describedby`: cada control declara en el marcado su
   * requisito (`<id>-req`, antes del intento) y su hueco de error (`<id>-error`, vacío hasta que
   * hay algo que decir).
   * --------------------------------------------------------------------------------------- */
  function huecoDeError(control) {
    return document.getElementById(control.id + '-error');
  }

  function marcarError(control, mensaje) {
    control.classList.add(control.tagName === 'SELECT' ? 'mq-select--error' : 'mq-input--error');
    control.setAttribute('aria-invalid', 'true');
    var hueco = huecoDeError(control);
    if (hueco) {
      hueco.textContent = mensaje;
      hueco.hidden = false;
    }
  }

  function limpiarError(control) {
    control.classList.remove('mq-input--error', 'mq-select--error');
    control.removeAttribute('aria-invalid');
    var hueco = huecoDeError(control);
    if (hueco) {
      hueco.textContent = '';
      hueco.hidden = true;
    }
  }

  /* --------------------------------------------------------------------------------------- *
   * Conmutación de estados
   *
   * `data-mq-estado="a b c"` en cualquier nodo significa: este bloque se ve sólo si el estado
   * vigente es `a`, `b` o `c`. Un nodo sin el atributo se ve siempre. La conmutación es una sola
   * pasada que setea `hidden`, y el inventario de estados se releva del DOM: agregar un estado es
   * agregar un bloque con su atributo, sin tocar el JavaScript.
   * --------------------------------------------------------------------------------------- */
  var estadosDeclarados = [];
  var estadoVigente = null;

  function relevarEstados() {
    var vistos = [];
    $$('[data-mq-estado]').forEach(function (nodo) {
      nodo.getAttribute('data-mq-estado').split(/\s+/).forEach(function (id) {
        if (id && vistos.indexOf(id) === -1) vistos.push(id);
      });
    });
    return vistos;
  }

  function aplicarEstado(id) {
    if (!id) return;
    // El hook corre ANTES de la pasada de visibilidad: sólo para lo que no se resuelve mostrando
    // y ocultando —repoblar una zona, mover el foco, sincronizar un rótulo—.
    if (typeof global.alCambiarEstado === 'function') global.alCambiarEstado(id);

    $$('[data-mq-estado]').forEach(function (nodo) {
      nodo.hidden = nodo.getAttribute('data-mq-estado').split(/\s+/).indexOf(id) === -1;
    });

    estadoVigente = id;
    document.body.setAttribute('data-estado-vigente', id);
  }

  /* --------------------------------------------------------------------------------------- *
   * Diálogos
   *
   * `<dialog>` nativo con `showModal()`: trae confinamiento de foco y cierre por Escape sin
   * código, con degradación explícita donde no está. El velo es `::backdrop` con token, no un
   * `<div>` de overlay propio.
   * --------------------------------------------------------------------------------------- */
  var disparadorDelDialogo = null;

  function abrirDialogo(dialogo, disparador) {
    if (!dialogo) return;
    disparadorDelDialogo = disparador || null;
    dialogo.returnValue = '';
    if (dialogo.showModal) {
      dialogo.showModal();
    } else {
      dialogo.setAttribute('open', '');
    }
    var primero = $('input, button, [href]', dialogo);
    if (primero) primero.focus();
  }

  /** Cablea el cierre de todos los diálogos. Idempotente: se puede volver a llamar sin duplicar. */
  function activarDialogos(raiz) {
    $$('[data-mq-cierra-dialogo]', raiz).forEach(function (boton) {
      if (boton.dataset.mqDlgCableado) return;
      boton.dataset.mqDlgCableado = '1';
      boton.addEventListener('click', function () {
        var dialogo = boton.closest('dialog');
        if (dialogo) dialogo.close();
      });
    });

    $$('dialog', raiz).forEach(function (dialogo) {
      if (dialogo.dataset.mqDlgCableado) return;
      dialogo.dataset.mqDlgCableado = '1';
      // El foco vuelve al control que lo abrió, si ese control sigue en el documento: tras una
      // baja la fila se redibuja y su botón deja de existir.
      dialogo.addEventListener('close', function () {
        var disparador = disparadorDelDialogo;
        disparadorDelDialogo = null;
        if (disparador && document.contains(disparador)) disparador.focus();
      });
    });
  }

  /* --------------------------------------------------------------------------------------- *
   * Arranque
   * --------------------------------------------------------------------------------------- */
  function arrancar() {
    pintarMarca();
    pintarNavegacion();
    pintarSelloDeVersion();
    activarDialogos(document);
    estadosDeclarados = relevarEstados();

    // `?estado=<id>` fuerza el estado inicial: permite abrir cualquier superficie directamente en
    // cualquiera de sus estados, que es lo que hace verificable la superficie sin recorrerla.
    var forzado = parametro('estado');

    // Inversión de control: el armazón llama a la superficie, no al revés.
    if (typeof global.renderSuperficie === 'function') global.renderSuperficie(App);

    aplicarEstado(forzado || estadoVigente || document.body.getAttribute('data-estado-inicial'));
  }

  var App = {
    // Utilidades
    $: $,
    $$: $$,
    esc: esc,
    icono: icono,
    parametro: parametro,
    formatearNumero: formatearNumero,
    nuevoId: nuevoId,
    version: VERSION,

    // Almacenamiento
    CLAVE_LOCALIDADES: CLAVE_LOCALIDADES,
    CLAVE_ENCUESTAS: CLAVE_ENCUESTAS,
    obtenerLocalidades: obtenerLocalidades,
    guardarLocalidades: guardarLocalidades,
    obtenerEncuestas: obtenerEncuestas,
    agregarEncuesta: agregarEncuesta,

    // Bandas y validación
    mostrarAviso: mostrarAviso,
    ocultarAviso: ocultarAviso,
    marcarError: marcarError,
    limpiarError: limpiarError,

    // Estados
    aplicarEstado: aplicarEstado,
    estadoVigente: function () { return estadoVigente; },
    estados: function () { return estadosDeclarados.slice(); },

    // Diálogos
    abrirDialogo: abrirDialogo,
    activarDialogos: activarDialogos
  };

  global.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})(window);

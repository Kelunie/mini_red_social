const STORAGE_KEY = "publicaciones";

// H17: clave para borrador automático (guardar solo los campos necesarios)
const DRAFT_KEY = "borrador_publicacion";

const ETIQUETAS_VALIDAS = ["General", "Estudio", "Evento", "Ayuda"];
const ETIQUETA_POR_DEFECTO = "General";

function normalizarEtiqueta(etiqueta) {
  return ETIQUETAS_VALIDAS.includes(etiqueta) ? etiqueta : ETIQUETA_POR_DEFECTO;
}

function cargarPublicaciones() {
  const datos = localStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
}

function guardarPublicaciones() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(publicaciones));
}

function obtenerLikesIniciales() {
  return 4;
}

function generarId() {
  return Date.now() + Math.floor(Math.random() * 1000000);
}

// Funciones de borrador (H17)
function guardarBorrador() {
  try {
    const borrador = {
      nombre: (typeof inputNombre !== 'undefined' && inputNombre) ? inputNombre.value : "",
      mensaje: (typeof inputMensaje !== 'undefined' && inputMensaje) ? inputMensaje.value : "",
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(borrador));
  } catch (e) {
    // fallar silenciosamente si localStorage no está disponible
  }
}

function cargarBorrador() {
  try {
    const datos = localStorage.getItem(DRAFT_KEY);
    return datos ? JSON.parse(datos) : null;
  } catch (e) {
    return null;
  }
}

function eliminarBorrador() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    // ignore
  }
}

function normalizarComentarios(comentarios) {
  if (!Array.isArray(comentarios)) {
    return [];
  }

  return comentarios.map(function (comentario) {
    return {
      ...comentario,
      id: comentario.id || generarId(),
      fecha: comentario.fecha || new Date().toISOString(),
      respuestas: Array.isArray(comentario.respuestas) ? comentario.respuestas : [],
    };
  });
}

function normalizarPublicaciones(items) {
  return items.map(function (item) {
    const likes = typeof item.likes === "number" ? item.likes : obtenerLikesIniciales();
    const reactions = item.reactions || {
      like: 0,
      dislike: 0,
      angry: 0,
      love: 0,
      funny: 0,
    };

    return {
      ...item,
      likes: likes,
      reactions: {
        like: typeof reactions.like === "number" ? reactions.like : 0,
        dislike: typeof reactions.dislike === "number" ? reactions.dislike : 0,
        angry: typeof reactions.angry === "number" ? reactions.angry : 0,
        love: typeof reactions.love === "number" ? reactions.love : 0,
        funny: typeof reactions.funny === "number" ? reactions.funny : 0,
      },
      userReactions: item.userReactions || {},
      fecha: item.fecha || new Date().toISOString(),
      comentarios: normalizarComentarios(item.comentarios),
      etiqueta: normalizarEtiqueta(item.etiqueta),
    };
  });
}

function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function alternarReaccion(id, tipo) {
  const publicacion = publicaciones.find(function (item) {
    return item.id === id;
  });

  if (!publicacion) {
    return;
  }

  const activeReaction = publicacion.userReactions && publicacion.userReactions[tipo];

  if (activeReaction) {
    publicacion.reactions[tipo] = Math.max(0, publicacion.reactions[tipo] - 1);
    delete publicacion.userReactions[tipo];
  } else {
    if (publicacion.userReactions) {
      Object.keys(publicacion.userReactions).forEach(function (reaccionActual) {
        publicacion.reactions[reaccionActual] = Math.max(0, publicacion.reactions[reaccionActual] - 1);
      });
      publicacion.userReactions = {};
    }

    publicacion.reactions[tipo] += 1;
    publicacion.userReactions[tipo] = true;
  }

  guardarPublicaciones();
  renderPublicaciones();
}

let publicaciones = normalizarPublicaciones(cargarPublicaciones());
let publicacionEnEdicionId = null;
let comentarioEnEdicion = null;
let respuestaActiva = null;
const LIMITE_MENSAJE = 200;
const LIMITE_COMENTARIO = LIMITE_MENSAJE;

const form = document.getElementById("form-publicacion");
const inputNombre = document.getElementById("input-nombre");
const inputMensaje = document.getElementById("input-mensaje");
const inputEtiqueta = document.getElementById("input-etiqueta");
const listaPublicaciones = document.getElementById("lista-publicaciones");
const tituloMuro = document.querySelector(".titulo-muro");

inputMensaje.maxLength = LIMITE_MENSAJE;

const contadorMensajePublicacion = document.createElement("small");
contadorMensajePublicacion.className = "contador-mensaje-publicacion text-muted d-block mt-1";
contadorMensajePublicacion.setAttribute("aria-live", "polite");
contadorMensajePublicacion.setAttribute("data-contador", "mensaje-publicacion");
inputMensaje.insertAdjacentElement("afterend", contadorMensajePublicacion);

const errorLongitudPublicacion = document.createElement("small");
errorLongitudPublicacion.className = "text-danger d-none d-block mt-1";
errorLongitudPublicacion.setAttribute("data-error", "mensaje-publicacion");
contadorMensajePublicacion.insertAdjacentElement("afterend", errorLongitudPublicacion);

const contenedorBusqueda = document.createElement("div");
contenedorBusqueda.className = "mb-3";

const contenedorOrden = document.createElement("div");
contenedorOrden.className = "mb-3 bloque-orden";

let criterioOrdenPublicaciones = "recientes";

const etiquetaBusqueda = document.createElement("label");
etiquetaBusqueda.className = "form-label fw-semibold";
etiquetaBusqueda.setAttribute("for", "input-busqueda-publicaciones");
etiquetaBusqueda.textContent = "Buscar publicaciones";

const etiquetaOrden = document.createElement("label");
etiquetaOrden.className = "form-label fw-semibold";
etiquetaOrden.setAttribute("for", "boton-orden-publicaciones");
etiquetaOrden.textContent = "Ordenar publicaciones";

const formBusqueda = document.createElement("form");
formBusqueda.className = "d-flex gap-2 flex-column flex-sm-row";

const inputBusqueda = document.createElement("input");
inputBusqueda.type = "search";
inputBusqueda.className = "form-control";
inputBusqueda.id = "input-busqueda-publicaciones";
inputBusqueda.placeholder = "Buscar por autor o contenido";
inputBusqueda.setAttribute("aria-label", "Buscar por autor o contenido");

const botonBusqueda = document.createElement("button");
botonBusqueda.type = "submit";
botonBusqueda.className = "btn btn-outline-secondary";
botonBusqueda.textContent = "Buscar";

const contenedorDropdownOrden = document.createElement("div");
contenedorDropdownOrden.className = "dropdown-orden-publicaciones";

const botonOrden = document.createElement("button");
botonOrden.type = "button";
botonOrden.className = "boton-orden-publicaciones";
botonOrden.id = "boton-orden-publicaciones";
botonOrden.setAttribute("aria-haspopup", "true");
botonOrden.setAttribute("aria-expanded", "false");
botonOrden.textContent = "Recientes";

const menuOrden = document.createElement("div");
menuOrden.className = "menu-orden-publicaciones d-none";
menuOrden.setAttribute("role", "menu");

const opcionesOrden = [
  { value: "recientes", label: "Recientes" },
  { value: "antiguas", label: "Antiguas" },
  { value: "gustadas", label: "Más gustadas" },
];

opcionesOrden.forEach(function (opcion) {
  const itemOrden = document.createElement("button");
  itemOrden.type = "button";
  itemOrden.className = "opcion-orden-publicaciones";
  itemOrden.dataset.valorOrden = opcion.value;
  itemOrden.setAttribute("role", "menuitemradio");
  itemOrden.setAttribute("aria-checked", opcion.value === criterioOrdenPublicaciones ? "true" : "false");
  itemOrden.textContent = opcion.label;
  menuOrden.appendChild(itemOrden);
});

const mensajeBusqueda = document.createElement("small");
mensajeBusqueda.className = "mensaje-busqueda d-none d-block mt-1";
mensajeBusqueda.setAttribute("role", "status");
mensajeBusqueda.setAttribute("aria-live", "polite");

let filtroEtiquetaActual = "Todas";

const contenedorFiltroEtiquetas = document.createElement("div");
contenedorFiltroEtiquetas.className = "mb-3 bloque-filtro-etiquetas";

const etiquetaFiltro = document.createElement("label");
etiquetaFiltro.className = "form-label fw-semibold";
etiquetaFiltro.textContent = "Filtrar por etiqueta";

const grupoFiltroEtiquetas = document.createElement("div");
grupoFiltroEtiquetas.className = "filtro-etiquetas";
grupoFiltroEtiquetas.setAttribute("role", "group");
grupoFiltroEtiquetas.setAttribute("aria-label", "Filtrar publicaciones por etiqueta");

const opcionesFiltroEtiquetas = ["Todas"].concat(ETIQUETAS_VALIDAS);

opcionesFiltroEtiquetas.forEach(function (opcion) {
  const botonFiltro = document.createElement("button");
  botonFiltro.type = "button";
  botonFiltro.className = "filtro-etiqueta-btn";
  botonFiltro.classList.toggle("active", opcion === filtroEtiquetaActual);
  botonFiltro.dataset.valorFiltro = opcion;
  botonFiltro.textContent = opcion;
  grupoFiltroEtiquetas.appendChild(botonFiltro);
});

contenedorFiltroEtiquetas.appendChild(etiquetaFiltro);
contenedorFiltroEtiquetas.appendChild(grupoFiltroEtiquetas);

function actualizarBotonesFiltroEtiquetas() {
  grupoFiltroEtiquetas.querySelectorAll(".filtro-etiqueta-btn").forEach(function (boton) {
    boton.classList.toggle("active", boton.dataset.valorFiltro === filtroEtiquetaActual);
  });
}

function cambiarFiltroEtiqueta(nuevoFiltro) {
  filtroEtiquetaActual = nuevoFiltro;
  actualizarBotonesFiltroEtiquetas();
  renderPublicaciones();
}

grupoFiltroEtiquetas.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".filtro-etiqueta-btn");

  if (!boton) {
    return;
  }

  cambiarFiltroEtiqueta(boton.dataset.valorFiltro);
});

formBusqueda.appendChild(inputBusqueda);
formBusqueda.appendChild(botonBusqueda);
contenedorBusqueda.appendChild(etiquetaBusqueda);
contenedorBusqueda.appendChild(formBusqueda);
contenedorOrden.appendChild(etiquetaOrden);
contenedorDropdownOrden.appendChild(botonOrden);
contenedorDropdownOrden.appendChild(menuOrden);
contenedorOrden.appendChild(contenedorDropdownOrden);

if (tituloMuro && tituloMuro.parentElement) {
  tituloMuro.insertAdjacentElement("afterend", contenedorBusqueda);
  contenedorBusqueda.insertAdjacentElement("afterend", mensajeBusqueda);
  mensajeBusqueda.insertAdjacentElement("afterend", contenedorFiltroEtiquetas);
  contenedorFiltroEtiquetas.insertAdjacentElement("afterend", contenedorOrden);
} else {
  listaPublicaciones.parentElement.insertBefore(mensajeBusqueda, listaPublicaciones);
  listaPublicaciones.parentElement.insertBefore(contenedorBusqueda, mensajeBusqueda);
  listaPublicaciones.parentElement.insertBefore(contenedorFiltroEtiquetas, listaPublicaciones);
  listaPublicaciones.parentElement.insertBefore(contenedorOrden, listaPublicaciones);
}

  // Restaurar borrador si existe (H17)
  const _borrador_inicial = cargarBorrador();
  if (_borrador_inicial) {
    inputNombre.value = _borrador_inicial.nombre || "";
    inputMensaje.value = _borrador_inicial.mensaje || "";
  }

  // Guardar borrador al escribir en el nombre
  if (inputNombre) {
    inputNombre.addEventListener("input", function () {
      guardarBorrador();
    });
  }

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function obtenerLongitudTexto(texto) {
  return String(texto || "").length;
}

function actualizarContadorCaracteres(elemento, limite, destino) {
  const restantes = limite - obtenerLongitudTexto(elemento.value);
  destino.textContent = `${restantes} caracteres restantes`;
  destino.classList.toggle("text-danger", restantes < 0);
  destino.classList.toggle("text-warning", restantes >= 0 && restantes <= 20);
  destino.classList.toggle("text-muted", restantes > 20);
}

function mostrarErrorLongitudPublicacion(mensaje) {
  errorLongitudPublicacion.textContent = mensaje;
  errorLongitudPublicacion.classList.remove("d-none");
}

function ocultarErrorLongitudPublicacion() {
  errorLongitudPublicacion.textContent = "";
  errorLongitudPublicacion.classList.add("d-none");
}

function mostrarErrorLongitudEdicion(errorElemento, mensaje) {
  errorElemento.textContent = mensaje;
  errorElemento.classList.remove("d-none");
}

function ocultarErrorLongitudEdicion(errorElemento) {
  errorElemento.textContent = "";
  errorElemento.classList.add("d-none");
}

function esTextoValidoConLimite(texto, limite) {
  return obtenerLongitudTexto(texto) <= limite;
}

function obtenerMensajeRestante(texto, limite) {
  return `${limite - obtenerLongitudTexto(texto)} caracteres restantes`;
}

actualizarContadorCaracteres(inputMensaje, LIMITE_MENSAJE, contadorMensajePublicacion);

function obtenerPublicacionesFiltradas() {
  const terminoBusqueda = normalizarTexto(inputBusqueda.value);

  const publicacionesPorEtiqueta =
    filtroEtiquetaActual === "Todas"
      ? publicaciones
      : publicaciones.filter(function (publicacion) {
          return publicacion.etiqueta === filtroEtiquetaActual;
        });

  if (terminoBusqueda === "") {
    return publicacionesPorEtiqueta;
  }

  return publicacionesPorEtiqueta.filter(function (publicacion) {
    const nombre = normalizarTexto(publicacion.nombre);
    const mensaje = normalizarTexto(publicacion.mensaje);

    return nombre.includes(terminoBusqueda) || mensaje.includes(terminoBusqueda);
  });
}

function obtenerPopularidad(publicacion) {
  const likesClasicos = typeof publicacion.likes === "number" ? publicacion.likes : 0;
  const meGustaReacciones =
    publicacion.reactions && typeof publicacion.reactions.like === "number"
      ? publicacion.reactions.like
      : 0;

  return likesClasicos + meGustaReacciones;
}

function obtenerPublicacionesOrdenadas(items) {
  const publicacionesOrdenadas = items.slice();

  publicacionesOrdenadas.sort(function (a, b) {
    if (criterioOrdenPublicaciones === "antiguas") {
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    }

    if (criterioOrdenPublicaciones === "gustadas") {
      const diferenciaPopularidad = obtenerPopularidad(b) - obtenerPopularidad(a);

      if (diferenciaPopularidad !== 0) {
        return diferenciaPopularidad;
      }

      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    }

    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  return publicacionesOrdenadas;
}

function actualizarTextoOrden() {
  const opcionActual = opcionesOrden.find(function (opcion) {
    return opcion.value === criterioOrdenPublicaciones;
  });

  if (opcionActual) {
    botonOrden.textContent = opcionActual.label;
  }

  menuOrden.querySelectorAll(".opcion-orden-publicaciones").forEach(function (item) {
    const seleccionado = item.dataset.valorOrden === criterioOrdenPublicaciones;
    item.classList.toggle("active", seleccionado);
    item.setAttribute("aria-checked", seleccionado ? "true" : "false");
  });
}

function cambiarOrdenPublicaciones(nuevoCriterio) {
  criterioOrdenPublicaciones = nuevoCriterio;
  actualizarTextoOrden();
  renderPublicaciones();
}

botonOrden.addEventListener("click", function () {
  const menuVisible = !menuOrden.classList.contains("d-none");

  menuOrden.classList.toggle("d-none", menuVisible);
  botonOrden.setAttribute("aria-expanded", menuVisible ? "false" : "true");
});

menuOrden.addEventListener("click", function (evento) {
  const opcion = evento.target.closest(".opcion-orden-publicaciones");

  if (!opcion) {
    return;
  }

  cambiarOrdenPublicaciones(opcion.dataset.valorOrden);
  menuOrden.classList.add("d-none");
  botonOrden.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", function (evento) {
  if (!contenedorDropdownOrden.contains(evento.target)) {
    menuOrden.classList.add("d-none");
    botonOrden.setAttribute("aria-expanded", "false");
  }
});

function actualizarEstadoBusqueda(cantidadResultados) {
  const terminoBusqueda = normalizarTexto(inputBusqueda.value);
  const hayFiltroEtiqueta = filtroEtiquetaActual !== "Todas";
  const sinCoincidencias =
    (terminoBusqueda !== "" || hayFiltroEtiqueta) && cantidadResultados === 0 && publicaciones.length > 0;

  if (sinCoincidencias) {
    mensajeBusqueda.textContent = "No se encontraron coincidencias.";
    mensajeBusqueda.classList.remove("d-none");
    return;
  }

  mensajeBusqueda.textContent = "";
  mensajeBusqueda.classList.add("d-none");
}

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nombre = inputNombre.value.trim();
  const mensajeIngresado = inputMensaje.value;
  const mensaje = mensajeIngresado.trim();

  if (!esTextoValidoConLimite(mensajeIngresado, LIMITE_MENSAJE)) {
    mostrarErrorLongitudPublicacion(`El mensaje no puede superar los ${LIMITE_MENSAJE} caracteres.`);
    inputMensaje.focus();
    return;
  }

  if (nombre === "" || mensaje === "") {
    ocultarErrorLongitudPublicacion();
    alert("El nombre y el mensaje son obligatorios.");
    return;
  }

  ocultarErrorLongitudPublicacion();

  const publicacion = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    nombre: nombre,
    mensaje: mensaje,
    likes: 0,
    reactions: {
      like: 0,
      dislike: 0,
      angry: 0,
      love: 0,
      funny: 0,
    },
    userReactions: {},
    fecha: new Date().toISOString(),
    comentarios: [],
    etiqueta: normalizarEtiqueta(inputEtiqueta.value),
  };

  publicaciones.unshift(publicacion);
  guardarPublicaciones();
  renderPublicaciones();

  form.reset();
  // Publicación exitosa: eliminar borrador (H17)
  eliminarBorrador();
  actualizarContadorCaracteres(inputMensaje, LIMITE_MENSAJE, contadorMensajePublicacion);
});

inputMensaje.addEventListener("input", function () {
  actualizarContadorCaracteres(inputMensaje, LIMITE_MENSAJE, contadorMensajePublicacion);
  ocultarErrorLongitudPublicacion();
  guardarBorrador();
});

inputBusqueda.addEventListener("input", function () {
  renderPublicaciones();
});

formBusqueda.addEventListener("submit", function (evento) {
  evento.preventDefault();
  renderPublicaciones();
});

// Botón: Descartar borrador (H17)
const btnDescartar = document.getElementById("btn-descartar-borrador");
if (btnDescartar) {
  btnDescartar.addEventListener("click", function () {
    eliminarBorrador();
    form.reset();
    actualizarContadorCaracteres(inputMensaje, LIMITE_MENSAJE, contadorMensajePublicacion);
    mensajeBusqueda.classList.add("d-none");
  });
}

function eliminarPublicacion(id) {
  const confirmado = confirm("¿Seguro que deseas eliminar esta publicación?");

  if (!confirmado) {
    return;
  }

  publicaciones = publicaciones.filter(function (item) {
    return item.id !== id;
  });

  guardarPublicaciones();
  renderPublicaciones();
}

function agregarComentario(id, nombreComentario, textoComentario) {
  const publicacion = publicaciones.find(function (item) {
    return item.id === id;
  });

  if (!publicacion) {
    return;
  }

  publicacion.comentarios.push({
    id: generarId(),
    nombre: nombreComentario,
    texto: textoComentario,
    fecha: new Date().toISOString(),
    respuestas: [],
  });

  guardarPublicaciones();
  renderPublicaciones();
}

function agregarRespuesta(publicacionId, comentarioId, nombreRespuesta, textoRespuesta) {
  const publicacion = buscarPublicacion(publicacionId);

  if (!publicacion) {
    return;
  }

  const comentario = publicacion.comentarios.find(function (item) {
    return item.id === comentarioId;
  });

  if (!comentario) {
    return;
  }

  if (!Array.isArray(comentario.respuestas)) {
    comentario.respuestas = [];
  }

  comentario.respuestas.push({
    id: generarId(),
    nombre: nombreRespuesta,
    texto: textoRespuesta,
    fecha: new Date().toISOString(),
  });

  guardarPublicaciones();
  renderPublicaciones();
}

function buscarPublicacion(publicacionId) {
  return publicaciones.find(function (item) {
    return item.id === publicacionId;
  });
}

function buscarComentario(publicacionId, comentarioId) {
  const publicacion = buscarPublicacion(publicacionId);

  if (!publicacion) {
    return { publicacion: null, comentario: null };
  }

  const comentario = publicacion.comentarios.find(function (item) {
    return item.id === comentarioId;
  });

  return { publicacion: publicacion, comentario: comentario || null };
}

function iniciarEdicionComentario(publicacionId, comentarioId) {
  comentarioEnEdicion = { publicacionId: publicacionId, comentarioId: comentarioId };
  renderPublicaciones();
}

function cancelarEdicionComentario() {
  comentarioEnEdicion = null;
  renderPublicaciones();
}

function guardarEdicionComentario(publicacionId, comentarioId, nuevoTexto) {
  const { comentario } = buscarComentario(publicacionId, comentarioId);

  if (!comentario) {
    return;
  }

  comentario.texto = nuevoTexto;

  guardarPublicaciones();
  comentarioEnEdicion = null;
  renderPublicaciones();
}

function eliminarComentario(publicacionId, comentarioId) {
  const confirmado = confirm("¿Seguro que deseas eliminar este comentario?");

  if (!confirmado) {
    return;
  }

  const publicacion = buscarPublicacion(publicacionId);

  if (!publicacion) {
    return;
  }

  publicacion.comentarios = publicacion.comentarios.filter(function (item) {
    return item.id !== comentarioId;
  });

  if (
    comentarioEnEdicion &&
    comentarioEnEdicion.publicacionId === publicacionId &&
    comentarioEnEdicion.comentarioId === comentarioId
  ) {
    comentarioEnEdicion = null;
  }

  guardarPublicaciones();
  renderPublicaciones();
}

function iniciarEdicion(id) {
  publicacionEnEdicionId = id;
  renderPublicaciones();
}

function cancelarEdicion() {
  publicacionEnEdicionId = null;
  renderPublicaciones();
}

listaPublicaciones.addEventListener("click", function (evento) {
  const botonEliminar = evento.target.closest(".btn-eliminar");

  if (botonEliminar) {
    const idEliminar = Number(botonEliminar.dataset.publicacionId);
    eliminarPublicacion(idEliminar);
    return;
  }

  const botonEditar = evento.target.closest(".btn-editar");

  if (botonEditar) {
    const idEditar = Number(botonEditar.dataset.publicacionId);
    iniciarEdicion(idEditar);
    return;
  }

  const botonCancelarEdicion = evento.target.closest(".btn-cancelar-edicion");

  if (botonCancelarEdicion) {
    cancelarEdicion();
    return;
  }

  const botonGuardarEdicion = evento.target.closest(".btn-guardar-edicion");

  if (botonGuardarEdicion) {
    const nota = botonGuardarEdicion.closest(".nota");
    const textarea = nota.querySelector(".textarea-edicion");
    const errorEdicion = nota.querySelector(".error-edicion");
    const nuevoMensajeIngresado = textarea.value;
    const nuevoMensaje = nuevoMensajeIngresado.trim();

    if (!esTextoValidoConLimite(nuevoMensajeIngresado, LIMITE_MENSAJE)) {
      mostrarErrorLongitudEdicion(errorEdicion, `El mensaje no puede superar los ${LIMITE_MENSAJE} caracteres.`);
      textarea.focus();
      return;
    }

    if (nuevoMensaje === "") {
      mostrarErrorLongitudEdicion(errorEdicion, "El mensaje no puede quedar vacío.");
      textarea.focus();
      return;
    }

    ocultarErrorLongitudEdicion(errorEdicion);

    const idEditado = Number(botonGuardarEdicion.dataset.publicacionId);
    const publicacion = publicaciones.find(function (item) {
      return item.id === idEditado;
    });

    if (publicacion) {
      publicacion.mensaje = nuevoMensaje;
    }

    guardarPublicaciones();
    publicacionEnEdicionId = null;
    renderPublicaciones();
    return;
  }

  const botonEliminarComentario = evento.target.closest(".btn-eliminar-comentario");

  if (botonEliminarComentario) {
    const publicacionId = Number(botonEliminarComentario.dataset.publicacionId);
    const comentarioId = Number(botonEliminarComentario.dataset.comentarioId);
    eliminarComentario(publicacionId, comentarioId);
    return;
  }

  const botonEditarComentario = evento.target.closest(".btn-editar-comentario");

  if (botonEditarComentario) {
    const publicacionId = Number(botonEditarComentario.dataset.publicacionId);
    const comentarioId = Number(botonEditarComentario.dataset.comentarioId);
    iniciarEdicionComentario(publicacionId, comentarioId);
    return;
  }

  const botonCancelarComentario = evento.target.closest(".btn-cancelar-comentario");

  if (botonCancelarComentario) {
    cancelarEdicionComentario();
    return;
  }

  const botonGuardarComentario = evento.target.closest(".btn-guardar-comentario");

  if (botonGuardarComentario) {
    const itemComentario = botonGuardarComentario.closest(".comentario-item");
    const textareaComentario = itemComentario.querySelector(".textarea-edicion-comentario");
    const errorEdicionComentario = itemComentario.querySelector(".error-edicion-comentario");
    const nuevoTextoIngresado = textareaComentario.value;
    const nuevoTexto = nuevoTextoIngresado.trim();

    if (!esTextoValidoConLimite(nuevoTextoIngresado, LIMITE_COMENTARIO)) {
      errorEdicionComentario.textContent = `El comentario no puede superar los ${LIMITE_COMENTARIO} caracteres.`;
      errorEdicionComentario.classList.remove("d-none");
      textareaComentario.focus();
      return;
    }

    if (nuevoTexto === "") {
      errorEdicionComentario.textContent = "El comentario no puede quedar vacío.";
      errorEdicionComentario.classList.remove("d-none");
      textareaComentario.focus();
      return;
    }

    errorEdicionComentario.classList.add("d-none");

    const publicacionId = Number(botonGuardarComentario.dataset.publicacionId);
    const comentarioId = Number(botonGuardarComentario.dataset.comentarioId);
    guardarEdicionComentario(publicacionId, comentarioId, nuevoTexto);
    return;
  }

  const botonComentar = evento.target.closest(".btn-comentar");

  if (botonComentar) {
    const nota = botonComentar.closest(".nota");
    const inputNombreComentario = nota.querySelector(".input-nombre-comentario");
    const inputTextoComentario = nota.querySelector(".input-texto-comentario");
    const errorComentario = nota.querySelector(".error-comentario");

    const nombreComentario = inputNombreComentario.value.trim();
    const textoComentarioIngresado = inputTextoComentario.value;
    const textoComentario = textoComentarioIngresado.trim();

    if (!esTextoValidoConLimite(textoComentarioIngresado, LIMITE_COMENTARIO)) {
      errorComentario.textContent = `El comentario no puede superar los ${LIMITE_COMENTARIO} caracteres.`;
      errorComentario.classList.remove("d-none");
      inputTextoComentario.focus();
      return;
    }

    if (nombreComentario === "" || textoComentario === "") {
      errorComentario.textContent = "El nombre y el comentario son obligatorios.";
      errorComentario.classList.remove("d-none");
      return;
    }

    errorComentario.classList.add("d-none");

    const idComentado = Number(botonComentar.dataset.publicacionId);
    agregarComentario(idComentado, nombreComentario, textoComentario);
    return;
  }

  const botonResponder = evento.target.closest(".btn-responder");

  if (botonResponder) {
    const publicacionId = Number(botonResponder.dataset.publicacionId);
    const comentarioId = Number(botonResponder.dataset.comentarioId);

    if (
      respuestaActiva &&
      respuestaActiva.publicacionId === publicacionId &&
      respuestaActiva.comentarioId === comentarioId
    ) {
      respuestaActiva = null;
    } else {
      respuestaActiva = { publicacionId: publicacionId, comentarioId: comentarioId };
    }

    renderPublicaciones();
    return;
  }

  const botonCancelarRespuesta = evento.target.closest(".btn-cancelar-respuesta");

  if (botonCancelarRespuesta) {
    respuestaActiva = null;
    renderPublicaciones();
    return;
  }

  const botonEnviarRespuesta = evento.target.closest(".btn-enviar-respuesta");

  if (botonEnviarRespuesta) {
    const contenedorRespuesta = botonEnviarRespuesta.closest(".form-respuesta");
    const inputNombreRespuesta = contenedorRespuesta.querySelector(".input-nombre-respuesta");
    const inputTextoRespuesta = contenedorRespuesta.querySelector(".input-texto-respuesta");
    const errorRespuesta = contenedorRespuesta.querySelector(".error-respuesta");

    const nombreRespuesta = inputNombreRespuesta.value.trim();
    const textoRespuesta = inputTextoRespuesta.value.trim();

    if (nombreRespuesta === "" || textoRespuesta === "") {
      errorRespuesta.textContent = "El nombre y la respuesta son obligatorios.";
      errorRespuesta.classList.remove("d-none");
      return;
    }

    errorRespuesta.classList.add("d-none");

    const publicacionId = Number(botonEnviarRespuesta.dataset.publicacionId);
    const comentarioId = Number(botonEnviarRespuesta.dataset.comentarioId);
    respuestaActiva = null;
    agregarRespuesta(publicacionId, comentarioId, nombreRespuesta, textoRespuesta);
    return;
  }

  const boton = evento.target.closest(".reaction-btn");

  if (!boton) {
    return;
  }

  const id = Number(boton.dataset.publicacionId);
  const tipo = boton.dataset.tipo;
  alternarReaccion(id, tipo);
});

function actualizarResumen() {
  const totalPublicaciones = publicaciones.length;

  const reactionTotals = {
    like: 0,
    love: 0,
    dislike: 0,
    angry: 0
  };

  publicaciones.forEach(function (pub) {
    // Sumar likes clásicos si existen
    reactionTotals.like += typeof pub.likes === "number" ? pub.likes : 0;

    if (pub.reactions) {
      Object.keys(reactionTotals).forEach(function (tipo) {
        if (typeof pub.reactions[tipo] === "number") {
          reactionTotals[tipo] += pub.reactions[tipo];
        }
      });
    }
  });

  const totalComentarios = publicaciones.reduce(function (acc, pub) {
    return acc + (Array.isArray(pub.comentarios) ? pub.comentarios.length : 0);
  }, 0);

  const elPublicaciones = document.getElementById("total-publicaciones");
  const elComentarios = document.getElementById("total-comentarios");
  const elLikes = document.getElementById("total-likes");
  const elLoves = document.getElementById("total-loves");
  const elDislikes = document.getElementById("total-dislikes");
  const elAngries = document.getElementById("total-angries");

  if (elPublicaciones) {
    elPublicaciones.textContent = totalPublicaciones;
  }
  if (elComentarios) {
    elComentarios.textContent = totalComentarios;
  }
  if (elLikes) {
    elLikes.textContent = reactionTotals.like;
  }
  if (elLoves) {
    elLoves.textContent = reactionTotals.love;
  }
  if (elDislikes) {
    elDislikes.textContent = reactionTotals.dislike;
  }
  if (elAngries) {
    elAngries.textContent = reactionTotals.angry;
  }
}

function renderPublicaciones() {
  actualizarResumen();
  const publicacionesFiltradas = obtenerPublicacionesOrdenadas(obtenerPublicacionesFiltradas());
  const terminoBusqueda = normalizarTexto(inputBusqueda.value);

  listaPublicaciones.innerHTML = "";

  actualizarEstadoBusqueda(publicacionesFiltradas.length);

  if (publicacionesFiltradas.length === 0) {
    if (publicaciones.length === 0 && terminoBusqueda === "") {
      listaPublicaciones.innerHTML = '<p class="mensaje-vacio">Todavía no hay publicaciones.</p>';
    }

    return;
  }

  if (publicaciones.length === 0) {
    listaPublicaciones.innerHTML = '<p class="mensaje-vacio">Todavía no hay publicaciones.</p>';
    return;
  }

  publicacionesFiltradas.forEach(function (publicacion) {
    const nota = document.createElement("div");
    nota.className = "nota";

    const encabezado = document.createElement("div");
    encabezado.className = "nota-encabezado";

    const nombre = document.createElement("p");
    nombre.className = "nota-nombre mb-0";
    nombre.textContent = publicacion.nombre;

    const etiquetaPublicacion = normalizarEtiqueta(publicacion.etiqueta);
    const badgeEtiqueta = document.createElement("span");
    badgeEtiqueta.className = `badge-etiqueta badge-etiqueta-${etiquetaPublicacion.toLowerCase()}`;
    badgeEtiqueta.textContent = etiquetaPublicacion;

    encabezado.appendChild(nombre);
    encabezado.appendChild(badgeEtiqueta);

    const enEdicion = publicacion.id === publicacionEnEdicionId;

    const mensaje = document.createElement("p");
    mensaje.className = "nota-mensaje";
    mensaje.textContent = publicacion.mensaje;

    const fecha = document.createElement("p");
    fecha.className = "nota-fecha";
    fecha.textContent = formatearFecha(publicacion.fecha);

    const acciones = document.createElement("div");
    acciones.className = "nota-acciones";

    const reacciones = [
      { tipo: "like", emoji: "👍", label: "Me gusta" },
      { tipo: "dislike", emoji: "👎", label: "No me gusta" },
      { tipo: "angry", emoji: "😡", label: "Me enoja" },
      { tipo: "love", emoji: "❤️", label: "Me encanta" },
      { tipo: "funny", emoji: "😂", label: "Me divierte" },
    ];

    const reaccionSeleccionada = Object.keys(publicacion.userReactions || {}).find(function (tipo) {
      return publicacion.userReactions[tipo];
    });

    const emojiPrincipal = reaccionSeleccionada
      ? reacciones.find(function (reaccion) {
          return reaccion.tipo === reaccionSeleccionada;
        }).emoji
      : "👍";

    const botonPrincipal = document.createElement("button");
    botonPrincipal.type = "button";
    botonPrincipal.className = "reaction-main-btn";
    botonPrincipal.textContent = emojiPrincipal;
    botonPrincipal.title = "Reaccionar";

    const menuReacciones = document.createElement("div");
    menuReacciones.className = "reaction-menu";

    reacciones.forEach(function (reaccion) {
      const contenedorReaccion = document.createElement("div");
      contenedorReaccion.className = "reaccion-item";

      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = publicacion.userReactions && publicacion.userReactions[reaccion.tipo]
        ? "reaction-btn active"
        : "reaction-btn";
      boton.dataset.publicacionId = publicacion.id;
      boton.dataset.tipo = reaccion.tipo;
      boton.title = reaccion.label;
      boton.textContent = `${reaccion.emoji}`;

      const contador = document.createElement("span");
      contador.className = "contador-reaccion";
      contador.textContent = publicacion.reactions[reaccion.tipo];

      contenedorReaccion.appendChild(boton);
      contenedorReaccion.appendChild(contador);
      menuReacciones.appendChild(contenedorReaccion);
    });

    botonPrincipal.appendChild(document.createElement("span"));
    acciones.appendChild(botonPrincipal);
    acciones.appendChild(menuReacciones);

    const botonesGestion = document.createElement("div");
    botonesGestion.className = "botones-gestion";

    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.className = "btn-editar";
    botonEditar.dataset.publicacionId = publicacion.id;
    botonEditar.title = "Editar publicación";
    botonEditar.textContent = "Editar";

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className = "btn-eliminar";
    botonEliminar.dataset.publicacionId = publicacion.id;
    botonEliminar.title = "Eliminar publicación";
    botonEliminar.textContent = "Eliminar";

    botonesGestion.appendChild(botonEditar);
    botonesGestion.appendChild(botonEliminar);

    const seccionComentarios = document.createElement("div");
    seccionComentarios.className = "seccion-comentarios";

    publicacion.comentarios.forEach(function (comentario) {
      const itemComentario = document.createElement("div");
      itemComentario.className = "comentario-item";

      const comentarioEnEdicionActual =
        comentarioEnEdicion &&
        comentarioEnEdicion.publicacionId === publicacion.id &&
        comentarioEnEdicion.comentarioId === comentario.id;

      const nombreComentario = document.createElement("span");
      nombreComentario.className = "comentario-nombre";
      nombreComentario.textContent = comentario.nombre;

      const fechaComentario = document.createElement("span");
      fechaComentario.className = "comentario-fecha";
      fechaComentario.textContent = formatearFecha(comentario.fecha);

      itemComentario.appendChild(nombreComentario);

      if (comentarioEnEdicionActual) {
        const textareaEdicionComentario = document.createElement("textarea");
        textareaEdicionComentario.className = "form-control textarea-edicion-comentario";
        textareaEdicionComentario.rows = 2;
        textareaEdicionComentario.maxLength = LIMITE_COMENTARIO;
        textareaEdicionComentario.value = comentario.texto;

        const contadorEdicionComentario = document.createElement("small");
        contadorEdicionComentario.className = "contador-edicion-comentario text-muted d-block";
        contadorEdicionComentario.textContent = obtenerMensajeRestante(textareaEdicionComentario.value, LIMITE_COMENTARIO);

        const errorEdicionComentario = document.createElement("small");
        errorEdicionComentario.className = "error-edicion-comentario d-none";

        textareaEdicionComentario.addEventListener("input", function () {
          actualizarContadorCaracteres(textareaEdicionComentario, LIMITE_COMENTARIO, contadorEdicionComentario);
          errorEdicionComentario.textContent = "";
          errorEdicionComentario.classList.add("d-none");
        });

        const botonesEdicionComentario = document.createElement("div");
        botonesEdicionComentario.className = "botones-edicion-comentario";

        const botonGuardarComentario = document.createElement("button");
        botonGuardarComentario.type = "button";
        botonGuardarComentario.className = "btn-guardar-comentario";
        botonGuardarComentario.dataset.publicacionId = publicacion.id;
        botonGuardarComentario.dataset.comentarioId = comentario.id;
        botonGuardarComentario.textContent = "Guardar";

        const botonCancelarComentario = document.createElement("button");
        botonCancelarComentario.type = "button";
        botonCancelarComentario.className = "btn-cancelar-comentario";
        botonCancelarComentario.dataset.publicacionId = publicacion.id;
        botonCancelarComentario.dataset.comentarioId = comentario.id;
        botonCancelarComentario.textContent = "Cancelar";

        botonesEdicionComentario.appendChild(botonGuardarComentario);
        botonesEdicionComentario.appendChild(botonCancelarComentario);

        itemComentario.appendChild(textareaEdicionComentario);
        itemComentario.appendChild(contadorEdicionComentario);
        itemComentario.appendChild(errorEdicionComentario);
        itemComentario.appendChild(botonesEdicionComentario);
        itemComentario.appendChild(fechaComentario);
      } else {
        const textoComentario = document.createElement("span");
        textoComentario.className = "comentario-texto";
        textoComentario.textContent = comentario.texto;

        const botonEditarComentario = document.createElement("button");
        botonEditarComentario.type = "button";
        botonEditarComentario.className = "btn-editar-comentario";
        botonEditarComentario.dataset.publicacionId = publicacion.id;
        botonEditarComentario.dataset.comentarioId = comentario.id;
        botonEditarComentario.title = "Editar comentario";
        botonEditarComentario.textContent = "Editar";

        const botonEliminarComentario = document.createElement("button");
        botonEliminarComentario.type = "button";
        botonEliminarComentario.className = "btn-eliminar-comentario";
        botonEliminarComentario.dataset.publicacionId = publicacion.id;
        botonEliminarComentario.dataset.comentarioId = comentario.id;
        botonEliminarComentario.title = "Eliminar comentario";
        botonEliminarComentario.textContent = "Eliminar";

        const botonResponder = document.createElement("button");
        botonResponder.type = "button";
        botonResponder.className = "btn-responder";
        botonResponder.dataset.publicacionId = publicacion.id;
        botonResponder.dataset.comentarioId = comentario.id;
        botonResponder.title = "Responder comentario";
        botonResponder.textContent = "Responder";

        itemComentario.appendChild(textoComentario);
        itemComentario.appendChild(fechaComentario);
        itemComentario.appendChild(botonEditarComentario);
        itemComentario.appendChild(botonEliminarComentario);
        itemComentario.appendChild(botonResponder);

        // Renderizar respuestas existentes debajo del comentario
        const respuestas = Array.isArray(comentario.respuestas) ? comentario.respuestas : [];

        if (respuestas.length > 0) {
          const listaRespuestas = document.createElement("div");
          listaRespuestas.className = "lista-respuestas";

          respuestas.forEach(function (respuesta) {
            const itemRespuesta = document.createElement("div");
            itemRespuesta.className = "respuesta-item";

            const nombreRespuesta = document.createElement("span");
            nombreRespuesta.className = "respuesta-nombre";
            nombreRespuesta.textContent = respuesta.nombre;

            const textoRespuesta = document.createElement("span");
            textoRespuesta.className = "respuesta-texto";
            textoRespuesta.textContent = respuesta.texto;

            const fechaRespuesta = document.createElement("span");
            fechaRespuesta.className = "respuesta-fecha";
            fechaRespuesta.textContent = formatearFecha(respuesta.fecha);

            itemRespuesta.appendChild(nombreRespuesta);
            itemRespuesta.appendChild(textoRespuesta);
            itemRespuesta.appendChild(fechaRespuesta);
            listaRespuestas.appendChild(itemRespuesta);
          });

          itemComentario.appendChild(listaRespuestas);
        }

        // Formulario inline de respuesta (solo visible cuando respuestaActiva apunta a este comentario)
        const formularioAbierto =
          respuestaActiva &&
          respuestaActiva.publicacionId === publicacion.id &&
          respuestaActiva.comentarioId === comentario.id;

        if (formularioAbierto) {
          const formRespuesta = document.createElement("div");
          formRespuesta.className = "form-respuesta";

          const inputNombreRespuesta = document.createElement("input");
          inputNombreRespuesta.type = "text";
          inputNombreRespuesta.className = "form-control input-nombre-respuesta";
          inputNombreRespuesta.placeholder = "Tu nombre";

          const inputTextoRespuesta = document.createElement("input");
          inputTextoRespuesta.type = "text";
          inputTextoRespuesta.className = "form-control input-texto-respuesta";
          inputTextoRespuesta.placeholder = "Escribe tu respuesta...";

          const botonesRespuesta = document.createElement("div");
          botonesRespuesta.className = "botones-respuesta";

          const botonEnviarRespuesta = document.createElement("button");
          botonEnviarRespuesta.type = "button";
          botonEnviarRespuesta.className = "btn-enviar-respuesta";
          botonEnviarRespuesta.dataset.publicacionId = publicacion.id;
          botonEnviarRespuesta.dataset.comentarioId = comentario.id;
          botonEnviarRespuesta.textContent = "Enviar";

          const botonCancelarRespuesta = document.createElement("button");
          botonCancelarRespuesta.type = "button";
          botonCancelarRespuesta.className = "btn-cancelar-respuesta";
          botonCancelarRespuesta.dataset.publicacionId = publicacion.id;
          botonCancelarRespuesta.dataset.comentarioId = comentario.id;
          botonCancelarRespuesta.textContent = "Cancelar";

          const errorRespuesta = document.createElement("small");
          errorRespuesta.className = "error-respuesta d-none";

          botonesRespuesta.appendChild(botonEnviarRespuesta);
          botonesRespuesta.appendChild(botonCancelarRespuesta);

          formRespuesta.appendChild(inputNombreRespuesta);
          formRespuesta.appendChild(inputTextoRespuesta);
          formRespuesta.appendChild(botonesRespuesta);
          formRespuesta.appendChild(errorRespuesta);

          itemComentario.appendChild(formRespuesta);
        }
      }

      seccionComentarios.appendChild(itemComentario);
    });

    const formComentario = document.createElement("div");
    formComentario.className = "form-comentario";

    const inputNombreComentario = document.createElement("input");
    inputNombreComentario.type = "text";
    inputNombreComentario.className = "form-control input-nombre-comentario";
    inputNombreComentario.placeholder = "Tu nombre";

    const inputTextoComentario = document.createElement("input");
    inputTextoComentario.type = "text";
    inputTextoComentario.className = "form-control input-texto-comentario";
    inputTextoComentario.placeholder = "Escribe un comentario...";
    inputTextoComentario.maxLength = LIMITE_COMENTARIO;

    const contadorComentario = document.createElement("small");
    contadorComentario.className = "contador-comentario text-muted d-block";
    contadorComentario.textContent = obtenerMensajeRestante(inputTextoComentario.value, LIMITE_COMENTARIO);

    inputTextoComentario.addEventListener("input", function () {
      actualizarContadorCaracteres(inputTextoComentario, LIMITE_COMENTARIO, contadorComentario);
      errorComentario.textContent = "";
      errorComentario.classList.add("d-none");
    });

    const botonComentar = document.createElement("button");
    botonComentar.type = "button";
    botonComentar.className = "btn-comentar";
    botonComentar.dataset.publicacionId = publicacion.id;
    botonComentar.textContent = "Comentar";

    const errorComentario = document.createElement("small");
    errorComentario.className = "error-comentario d-none";

    formComentario.appendChild(inputNombreComentario);
    formComentario.appendChild(inputTextoComentario);
    formComentario.appendChild(contadorComentario);
    formComentario.appendChild(botonComentar);
    formComentario.appendChild(errorComentario);

    seccionComentarios.appendChild(formComentario);

    nota.appendChild(encabezado);

    if (enEdicion) {
      const textareaEdicion = document.createElement("textarea");
      textareaEdicion.className = "form-control textarea-edicion";
      textareaEdicion.rows = 3;
      textareaEdicion.maxLength = LIMITE_MENSAJE;
      textareaEdicion.value = publicacion.mensaje;

      const contadorEdicion = document.createElement("small");
      contadorEdicion.className = "contador-edicion text-muted d-block mt-1";
      contadorEdicion.textContent = obtenerMensajeRestante(textareaEdicion.value, LIMITE_MENSAJE);

      const errorEdicion = document.createElement("small");
      errorEdicion.className = "error-edicion d-none";

      textareaEdicion.addEventListener("input", function () {
        const longitudActual = obtenerLongitudTexto(textareaEdicion.value);

        contadorEdicion.textContent = obtenerMensajeRestante(textareaEdicion.value, LIMITE_MENSAJE);
        contadorEdicion.classList.toggle("text-danger", longitudActual > LIMITE_MENSAJE);
        contadorEdicion.classList.toggle("text-warning", longitudActual <= LIMITE_MENSAJE && longitudActual > LIMITE_MENSAJE - 20);
        contadorEdicion.classList.toggle("text-muted", longitudActual <= LIMITE_MENSAJE - 20);
        ocultarErrorLongitudEdicion(errorEdicion);
      });

      const botonesEdicion = document.createElement("div");
      botonesEdicion.className = "botones-edicion";

      const botonGuardarEdicion = document.createElement("button");
      botonGuardarEdicion.type = "button";
      botonGuardarEdicion.className = "btn-guardar-edicion";
      botonGuardarEdicion.dataset.publicacionId = publicacion.id;
      botonGuardarEdicion.textContent = "Guardar";

      const botonCancelarEdicion = document.createElement("button");
      botonCancelarEdicion.type = "button";
      botonCancelarEdicion.className = "btn-cancelar-edicion";
      botonCancelarEdicion.dataset.publicacionId = publicacion.id;
      botonCancelarEdicion.textContent = "Cancelar";

      botonesEdicion.appendChild(botonGuardarEdicion);
      botonesEdicion.appendChild(botonCancelarEdicion);

      nota.appendChild(textareaEdicion);
      nota.appendChild(contadorEdicion);
      nota.appendChild(errorEdicion);
      nota.appendChild(botonesEdicion);
      nota.appendChild(fecha);
    } else {
      nota.appendChild(mensaje);
      nota.appendChild(fecha);
      nota.appendChild(acciones);
      nota.appendChild(botonesGestion);
      nota.appendChild(seccionComentarios);
    }

    listaPublicaciones.appendChild(nota);
  });
}

renderPublicaciones();
actualizarTextoOrden();

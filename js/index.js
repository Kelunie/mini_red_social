const STORAGE_KEY = "publicaciones";

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

function normalizarComentarios(comentarios) {
  if (!Array.isArray(comentarios)) {
    return [];
  }

  return comentarios.map(function (comentario) {
    return {
      ...comentario,
      id: comentario.id || generarId(),
      fecha: comentario.fecha || new Date().toISOString(),
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

const form = document.getElementById("form-publicacion");
const inputNombre = document.getElementById("input-nombre");
const inputMensaje = document.getElementById("input-mensaje");
const listaPublicaciones = document.getElementById("lista-publicaciones");
const tituloMuro = document.querySelector(".titulo-muro");

const contenedorBusqueda = document.createElement("div");
contenedorBusqueda.className = "mb-3";

const etiquetaBusqueda = document.createElement("label");
etiquetaBusqueda.className = "form-label fw-semibold";
etiquetaBusqueda.setAttribute("for", "input-busqueda-publicaciones");
etiquetaBusqueda.textContent = "Buscar publicaciones";

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

const mensajeBusqueda = document.createElement("div");
mensajeBusqueda.className = "alert alert-warning py-2 mb-3 d-none";
mensajeBusqueda.setAttribute("role", "status");
mensajeBusqueda.setAttribute("aria-live", "polite");

formBusqueda.appendChild(inputBusqueda);
formBusqueda.appendChild(botonBusqueda);
contenedorBusqueda.appendChild(etiquetaBusqueda);
contenedorBusqueda.appendChild(formBusqueda);

if (tituloMuro && tituloMuro.parentElement) {
  tituloMuro.insertAdjacentElement("afterend", contenedorBusqueda);
  contenedorBusqueda.insertAdjacentElement("afterend", mensajeBusqueda);
} else {
  listaPublicaciones.parentElement.insertBefore(mensajeBusqueda, listaPublicaciones);
  listaPublicaciones.parentElement.insertBefore(contenedorBusqueda, mensajeBusqueda);
}

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function obtenerPublicacionesFiltradas() {
  const terminoBusqueda = normalizarTexto(inputBusqueda.value);

  if (terminoBusqueda === "") {
    return publicaciones;
  }

  return publicaciones.filter(function (publicacion) {
    const nombre = normalizarTexto(publicacion.nombre);
    const mensaje = normalizarTexto(publicacion.mensaje);

    return nombre.includes(terminoBusqueda) || mensaje.includes(terminoBusqueda);
  });
}

function actualizarEstadoBusqueda(cantidadResultados) {
  const terminoBusqueda = normalizarTexto(inputBusqueda.value);
  const sinCoincidencias = terminoBusqueda !== "" && cantidadResultados === 0;

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
  const mensaje = inputMensaje.value.trim();

  if (nombre === "" || mensaje === "") {
    alert("El nombre y el mensaje son obligatorios.");
    return;
  }

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
  };

  publicaciones.unshift(publicacion);
  guardarPublicaciones();
  renderPublicaciones();

  form.reset();
});

inputBusqueda.addEventListener("input", function () {
  renderPublicaciones();
});

formBusqueda.addEventListener("submit", function (evento) {
  evento.preventDefault();
  renderPublicaciones();
});

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
    const nuevoMensaje = textarea.value.trim();

    if (nuevoMensaje === "") {
      errorEdicion.textContent = "El mensaje no puede quedar vacío.";
      errorEdicion.classList.remove("d-none");
      textarea.focus();
      return;
    }

    errorEdicion.classList.add("d-none");

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
    const nuevoTexto = textareaComentario.value.trim();

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
    const textoComentario = inputTextoComentario.value.trim();

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

  const boton = evento.target.closest(".reaction-btn");

  if (!boton) {
    return;
  }

  const id = Number(boton.dataset.publicacionId);
  const tipo = boton.dataset.tipo;
  alternarReaccion(id, tipo);
});

function renderPublicaciones() {
  const publicacionesFiltradas = obtenerPublicacionesFiltradas();
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

    const nombre = document.createElement("p");
    nombre.className = "nota-nombre";
    nombre.textContent = publicacion.nombre;

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
        textareaEdicionComentario.value = comentario.texto;

        const errorEdicionComentario = document.createElement("small");
        errorEdicionComentario.className = "error-edicion-comentario d-none";

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

        itemComentario.appendChild(textoComentario);
        itemComentario.appendChild(fechaComentario);
        itemComentario.appendChild(botonEditarComentario);
        itemComentario.appendChild(botonEliminarComentario);
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

    const botonComentar = document.createElement("button");
    botonComentar.type = "button";
    botonComentar.className = "btn-comentar";
    botonComentar.dataset.publicacionId = publicacion.id;
    botonComentar.textContent = "Comentar";

    const errorComentario = document.createElement("small");
    errorComentario.className = "error-comentario d-none";

    formComentario.appendChild(inputNombreComentario);
    formComentario.appendChild(inputTextoComentario);
    formComentario.appendChild(botonComentar);
    formComentario.appendChild(errorComentario);

    seccionComentarios.appendChild(formComentario);

    nota.appendChild(nombre);

    if (enEdicion) {
      const textareaEdicion = document.createElement("textarea");
      textareaEdicion.className = "form-control textarea-edicion";
      textareaEdicion.rows = 3;
      textareaEdicion.value = publicacion.mensaje;

      const errorEdicion = document.createElement("small");
      errorEdicion.className = "error-edicion d-none";

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

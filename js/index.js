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

function normalizarPublicaciones(items) {
  return items.map(function (item) {
    const likes = typeof item.likes === "number" ? item.likes : 0;
    const reactions = item.reactions || {
      like: 0,
      dislike: 0,
      angry: 0,
      love: 0,
    };

    return {
      ...item,
      likes: likes > 0 ? likes : obtenerLikesIniciales(),
      reactions: {
        like: typeof reactions.like === "number" ? reactions.like : 0,
        dislike: typeof reactions.dislike === "number" ? reactions.dislike : 0,
        angry: typeof reactions.angry === "number" ? reactions.angry : 0,
        love: typeof reactions.love === "number" ? reactions.love : 0,
      },
      userReactions: item.userReactions || {},
    };
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

const form = document.getElementById("form-publicacion");
const inputNombre = document.getElementById("input-nombre");
const inputMensaje = document.getElementById("input-mensaje");
const listaPublicaciones = document.getElementById("lista-publicaciones");

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
    likes: obtenerLikesIniciales(),
    reactions: {
      like: 4,
      dislike: 2,
      angry: 3,
      love: 5,
    },
    userReactions: {},
  };

  publicaciones.unshift(publicacion);
  guardarPublicaciones();
  renderPublicaciones();

  form.reset();
});

listaPublicaciones.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".reaction-btn");

  if (!boton) {
    return;
  }

  const id = Number(boton.dataset.publicacionId);
  const tipo = boton.dataset.tipo;
  alternarReaccion(id, tipo);
});

function renderPublicaciones() {
  listaPublicaciones.innerHTML = "";

  if (publicaciones.length === 0) {
    listaPublicaciones.innerHTML = '<p class="mensaje-vacio">Todavía no hay publicaciones.</p>';
    return;
  }

  publicaciones.forEach(function (publicacion) {
    const nota = document.createElement("div");
    nota.className = "nota";

    const nombre = document.createElement("p");
    nombre.className = "nota-nombre";
    nombre.textContent = publicacion.nombre;

    const mensaje = document.createElement("p");
    mensaje.className = "nota-mensaje";
    mensaje.textContent = publicacion.mensaje;

    const acciones = document.createElement("div");
    acciones.className = "nota-acciones";

    const reacciones = [
      { tipo: "like", emoji: "👍", label: "Me gusta" },
      { tipo: "dislike", emoji: "👎", label: "No me gusta" },
      { tipo: "angry", emoji: "😡", label: "Me enoja" },
      { tipo: "love", emoji: "❤️", label: "Me encanta" },
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

    nota.appendChild(nombre);
    nota.appendChild(mensaje);
    nota.appendChild(acciones);

    listaPublicaciones.appendChild(nota);
  });
}

renderPublicaciones();

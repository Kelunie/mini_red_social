// Historia 1: Publicar un mensaje
// Por ahora las publicaciones solo viven en memoria (array).
// Historia 4 se encarga de guardarlas en LocalStorage.

const publicaciones = [];

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
    id: Date.now(),
    nombre: nombre,
    mensaje: mensaje,
    likes: 0, // Historia 3 lo va a usar
  };

  publicaciones.unshift(publicacion); // los nuevos van primero (Historia 2)
  renderPublicaciones();

  form.reset();
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

    nota.innerHTML = `
      <p class="nota-nombre">${publicacion.nombre}</p>
      <p class="nota-mensaje">${publicacion.mensaje}</p>
    `;

    listaPublicaciones.appendChild(nota);
  });
}

renderPublicaciones();

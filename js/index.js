const STORAGE_KEY = "publicaciones";

function cargarPublicaciones() {
  const datos = localStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
}

function guardarPublicaciones() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(publicaciones));
}

let publicaciones = cargarPublicaciones();

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
    likes: 0,
  };

  publicaciones.unshift(publicacion);
  guardarPublicaciones();
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

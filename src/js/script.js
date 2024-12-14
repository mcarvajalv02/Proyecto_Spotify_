// Variables globales
let currentAudio = null;
let isPlaying = false;
let currentSongIndex = 0;
let songsList = [];
let filteredSongs = [];
let isLooping = false;
let isShuffling = false;
let progressBar;
let currentTimeDisplay;
let totalTimeDisplay;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Evento principal
document.addEventListener("DOMContentLoaded", () => {
  setupProgressBar();
  setupFilters();
  anadirCancion();
  cargarCanciones();
  
  // Event listeners para los controles
  const playIcon = document.querySelector(".play-icon");
  const skipPreviousIcon = document.querySelector(".antes-icon");
  const skipNextIcon = document.querySelector(".siguiente-icon");
  const loopIcon = document.querySelector(".repeat-icon");
  const shuffleIcon = document.querySelector(".aleatorio-icon");
  const pauseButton = document.querySelector(".pause-btn");
  const volumeControl = document.querySelector(".volume-control");
  const volumeIcon = document.querySelector(".volume-icon");
  
  // Establecer volumen inicial
  volumeControl.value = 100;
  
  // Control de volumen y actualización del icono
  volumeControl.addEventListener("input", (e) => {
    const volume = e.target.value;
    if (currentAudio) {
      currentAudio.volume = volume / 100;
    }
    actualizarIconoVolumen(volume);
  });

  // Establecer icono inicial
  actualizarIconoVolumen(volumeControl.value);
  
  playIcon.addEventListener("click", togglePlayPause);
  pauseButton.addEventListener("click", togglePlayPause);
  
  loopIcon.addEventListener("click", () => {
    if (isShuffling) { // Si shuffle está activado, desactivamos shuffle
      isShuffling = false;
      shuffleIcon.setAttribute("color", "#ffffff");
      shuffleIcon.style.fill = "#ffffff";
    }
    
    isLooping = !isLooping;
    if (currentAudio) {
      currentAudio.loop = isLooping;
    }
    loopIcon.setAttribute("color", isLooping ? "#1db954" : "#ffffff");
    loopIcon.style.fill = isLooping ? "#1db954" : "#ffffff";
  });
  
  shuffleIcon.addEventListener("click", () => {
    if (isLooping) { // Si loop está activado, desactivamos loop
      isLooping = false;
      loopIcon.setAttribute("color", "#ffffff");
      loopIcon.style.fill = "#ffffff";
    }
  
    isShuffling = !isShuffling;
    shuffleIcon.setAttribute("color", isShuffling ? "#1db954" : "#ffffff");
    shuffleIcon.style.fill = isShuffling ? "#1db954" : "#ffffff";
  });
  
  skipPreviousIcon.addEventListener("click", () => {
    if (currentSongIndex > 0) {
      currentSongIndex--;
    } else {
      currentSongIndex = songsList.length - 1;
    }
    mostrarImagenYReproducirCancion(songsList[currentSongIndex]);
  });

  skipNextIcon.addEventListener("click", () => {
    if (isShuffling) {
      reproducirCancionAleatoria();
    } else {
      if (currentSongIndex < songsList.length - 1) {
        currentSongIndex++;
      } else {
        currentSongIndex = 0;
      }
      mostrarImagenYReproducirCancion(songsList[currentSongIndex]);
    }
  });
});


/**
 * Configura los filtros de la lista de canciones
 * Permite filtrar entre todas las canciones y favoritos
 */
function setupFilters() {
  const filterOptions = document.querySelectorAll(".filter-option");

  filterOptions.forEach(option => {
    option.addEventListener("click", () => {
      const filterType = option.textContent;
      if (filterType === "Favoritos") {
        mostrarFavoritos();
      } else {
        filteredSongs = [...songsList];
        actualizarTablaCanciones();
      }
    });
  });
}


/**
 * Configura la barra de progreso y los displays de tiempo
 * Permite la interacción del usuario con la barra de progreso
 */
function setupProgressBar() {
  progressBar = document.querySelector('.progress-bar');
  currentTimeDisplay = document.querySelectorAll('.time-display')[0];
  totalTimeDisplay = document.querySelectorAll('.time-display')[1];

  progressBar.addEventListener('input', (e) => {
    if (!currentAudio) return;
    const time = (progressBar.value / 100) * currentAudio.duration;
    currentAudio.currentTime = time;
    updateTimeDisplay();
  });
}


/**
 * Actualiza la barra de progreso durante la reproducción
 */
function updateProgress() {
  if (!currentAudio || !progressBar) return;
  
  const percent = (currentAudio.currentTime / currentAudio.duration) * 100;
  progressBar.value = percent;
  updateTimeDisplay();
}


/**
 * Actualiza el display del tiempo total de la canción
 */
function updateTimeDisplay() {
  if (!currentAudio) return;
  totalTimeDisplay.textContent = formatearTiempo(currentAudio.duration);
}


/**
 * Actualiza el icono de volumen según el nivel
 * @param {number} volume - Nivel de volumen (0-100)
 */
function actualizarIconoVolumen(volume) {
  const volumeIcon = document.querySelector(".volume-icon");
  if (!volumeIcon) return;
  
  if (volume == 0) {
    volumeIcon.setAttribute("name", "volume-mute");
  } else if (volume < 90) {
    volumeIcon.setAttribute("name", "volume-low");
  } else {
    volumeIcon.setAttribute("name", "volume-full");
  }
}


/**
 * Selecciona y reproduce una canción aleatoria
 * Evita repetir la canción actual si hay más de una canción
 */
function reproducirCancionAleatoria() {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * songsList.length);
  } while (newIndex === currentSongIndex && songsList.length > 1);
  
  currentSongIndex = newIndex;
  mostrarImagenYReproducirCancion(songsList[currentSongIndex]);
}


/**
 * Alterna entre reproducir y pausar la canción actual
 * Actualiza los iconos y estados correspondientes
 */
function togglePlayPause() {
  if (!currentAudio) return;
  
  const playIcon = document.querySelector(".play-icon");
  const pauseButton = document.querySelector(".pause-btn");
  
  if (isPlaying) {
    currentAudio.pause();
    playIcon.setAttribute("name", "play-circle");
    pauseButton.textContent = "PLAY";
    isPlaying = false;
  } else {
    currentAudio.play();
    playIcon.setAttribute("name", "pause-circle");
    pauseButton.textContent = "PAUSE";
    isPlaying = true;
  }
}


/**
 * Gestiona el estado de los corazones de favoritos
 * Permite añadir/quitar canciones de favoritos
 */
function rellenarCorazon() {
  const heartIcons = document.querySelectorAll(".corazon");

  heartIcons.forEach((icon, index) => {
    // Obtener la canción correspondiente del array filtrado
    const song = filteredSongs[index];
    if (!song) return;

    // Establecer estado inicial basado en localStorage
    if (favorites.includes(song.id)) {
      icon.setAttribute("type", "solid");
    } else {
      icon.setAttribute("type", "regular");
    }

    // Eliminar event listeners anteriores
    const newIcon = icon.cloneNode(true);
    icon.parentNode.replaceChild(newIcon, icon);

    newIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const songId = song.id;
      
      if (favorites.includes(songId)) {
        newIcon.setAttribute("type", "regular");
        favorites = favorites.filter(id => id !== songId);
      } else {
        newIcon.setAttribute("type", "solid");
        favorites.push(songId);
      }
      
      newIcon.setAttribute("color", "#1db954");
      localStorage.setItem('favorites', JSON.stringify(favorites));
    });
  });
}


/**
 * Configura el modal para añadir nuevas canciones
 * Gestiona el formulario de subida y la comunicación con el servidor
 */
function anadirCancion() {
  const addIcon = document.querySelector(".add-icon");
  const modal = document.getElementById("uploadModal");
  const closeBtn = document.querySelector(".close-btn");
  const uploadForm = document.getElementById("uploadForm");

  addIcon.addEventListener("click", () => {
    modal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    uploadForm.reset();
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      uploadForm.reset();
    }
  });

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const musicFile = document.getElementById("songFile").files[0];
    const title = document.getElementById("songTitle").value;
    const artist = document.getElementById("songArtist").value;
    const coverFile = document.getElementById("coverImage").files[0];

    if (!musicFile || !title || !artist || !coverFile) {
      return;
    }

    formData.append("music", musicFile);
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("cover", coverFile);

    try {
      const response = await fetch("http://informatica.iesalbarregas.com:7008/upload", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        modal.style.display = "none";
        uploadForm.reset();
        await cargarCanciones();
      } else {
        const error = await response.text();
        console.error("Error del servidor:", error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
}


/**
 * Filtra las canciones según el término de búsqueda
 * @param {string} searchTerm - Término de búsqueda
 */
function filtrarCanciones(searchTerm) {
  if (!searchTerm) {
    filteredSongs = [...songsList];
  } else {
    searchTerm = searchTerm.toLowerCase();
    filteredSongs = songsList.filter(song => 
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm)
    );
  }
  actualizarTablaCanciones();
}


/**
 * Muestra solo las canciones marcadas como favoritas
 */
function mostrarFavoritos() {
  filteredSongs = songsList.filter(song => favorites.includes(song.id));
  actualizarTablaCanciones();
}


/**
 * Carga las canciones desde el servidor
 * Actualiza las listas global y filtrada
 */
async function cargarCanciones() {
  try {
    const response = await fetch('http://informatica.iesalbarregas.com:7008/songs');
    songsList = await response.json();
    filteredSongs = [...songsList];
    actualizarTablaCanciones();
  } catch (error) {
    console.error('Error al cargar las canciones:', error);
  }
}



/**
 * Actualiza la tabla de canciones con las canciones filtradas
 * Muestra las canciones y gestiona los corazones de favoritos
 */
function actualizarTablaCanciones() {
  const tbody = document.getElementById('songs-table-body');
  tbody.innerHTML = '';

  filteredSongs.forEach((song, index) => {
    const tr = document.createElement('tr');
    tr.className = 'canciones';
    const isFavorite = favorites.includes(song.id);
    
    tr.innerHTML = `
      <td class="cancion-titulo">${song.title}</td>
      <td>${song.artist}</td>
      <td class="duracion-${index}">Cargando...</td>
      <td><box-icon name="heart" color="#1db954" class="corazon" ${isFavorite ? 'type="solid"' : 'type="regular"'}></box-icon></td>
    `;

    tr.addEventListener("click", () => {
      currentSongIndex = songsList.indexOf(song);
      mostrarImagenYReproducirCancion(song);
    });

    tbody.appendChild(tr);
    cargarDuracionCancion(song.filepath, index);
  });

  rellenarCorazon();
}


/**
 * Carga y muestra la duración de una canción
 * @param {string} url - URL del archivo de audio
 * @param {number} index - Índice de la canción
 */
function cargarDuracionCancion(url, index) {
  const audio = new Audio();
  
  audio.addEventListener('loadedmetadata', () => {
    const duracionElement = document.querySelector(`.duracion-${index}`);
    if (duracionElement) {
      duracionElement.textContent = formatearTiempo(audio.duration);
    }
  });

  audio.addEventListener('error', () => {
    const duracionElement = document.querySelector(`.duracion-${index}`);
    if (duracionElement) {
      duracionElement.textContent = '0:00';
    }
  });

  audio.src = url;
}


/**
 * Formatea segundos en formato mm:ss
 * @param {number} segundos - Duración en segundos
 * @returns {string} Tiempo formateado
 */
function formatearTiempo(segundos) {
  if (!segundos || isNaN(segundos)) return '0:00';
  
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = Math.floor(segundos % 60);
  return `${minutos}:${segsRestantes.toString().padStart(2, '0')}`;
}


/**
 * Muestra la imagen y reproduce la canción seleccionada
 * Configura los eventos de audio y actualiza la interfaz
 * @param {Object} song - Objeto con la información de la canción
 */
function mostrarImagenYReproducirCancion(song) {
  const cuadroImagen = document.querySelector(".cuadro-imagen");
  const songinfo = document.querySelector(".song-info");
  const playIcon = document.querySelector(".play-icon");
  const pauseButton = document.querySelector(".pause-btn");

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const audioElement = new Audio(song.filepath);
  audioElement.loop = isLooping;
  
  audioElement.addEventListener('timeupdate', updateProgress);
  
  audioElement.addEventListener('loadedmetadata', () => {
    updateTimeDisplay();
  });
  
  
  const volumeControl = document.querySelector(".volume-control");
  audioElement.volume = volumeControl.value / 100;
  actualizarIconoVolumen(volumeControl.value);
  
  currentAudio = audioElement;

  cuadroImagen.innerHTML = `
    <img class="imagen-cancion" src="${song.cover}" alt="Cover de la canción"/>
  `;

  songinfo.innerHTML = `
    <p class="current-song">${song.title}</p>
    <p class="current-artist">${song.artist}</p>
  `;

  audioElement.play();
  isPlaying = true;
  playIcon.setAttribute("name", "pause-circle");
  pauseButton.textContent = "PAUSE";

  audioElement.onended = function() {
    if (!isLooping) {
      if (isShuffling) {
        reproducirCancionAleatoria();
      } else {
        if (currentSongIndex < songsList.length - 1) {
          currentSongIndex++;
        } else {
          currentSongIndex = 0;
        }
        mostrarImagenYReproducirCancion(songsList[currentSongIndex]);
      }
    }
  };

  audioElement.onerror = function() {
    console.error('Error al cargar el audio');
    isPlaying = false;
    playIcon.setAttribute("name", "play-circle");
    pauseButton.textContent = "PLAY";
    if (isShuffling) {
      reproducirCancionAleatoria();
    } else {
      if (currentSongIndex < songsList.length - 1) {
        currentSongIndex++;
      } else {
        currentSongIndex = 0;
      }
      mostrarImagenYReproducirCancion(songsList[currentSongIndex]);
    }
  };
}


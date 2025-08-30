// --- Configuración de API ---
const API_URL = 'https://movie.azurewebsites.net/api/cartelera?title=&ubication=';

// --- Elementos del DOM ---
const moviesContainer = document.getElementById('movies-container');
const searchInput = document.getElementById('search');
const filterSelect = document.getElementById('filter');
const loading = document.getElementById('loading');
const btnDarkmode = document.getElementById('btn-darkmode');

// Modal
const modal = document.getElementById('modal');
const closeModal = document.getElementById('close-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalGenre = document.getElementById('modal-genre');
const modalDescription = document.getElementById('modal-description');
const modalYear = document.getElementById('modal-year');
const modalUbication = document.getElementById('modal-ubication');
const btnFavorite = document.getElementById('btn-favorite');

// Tabs
const tabCartelera = document.getElementById('tab-cartelera');
const tabFavorites = document.getElementById('tab-favorites');

// Navbar responsive
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

// --- Estado ---
let allMovies = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// --- Utilidades ---
function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function setActiveTab(tabToActivate) {
    if (tabToActivate === 'favorites') {
        tabFavorites.classList.add('active-tab');
        tabCartelera.classList.remove('active-tab');
    } else {
        tabCartelera.classList.add('active-tab');
        tabFavorites.classList.remove('active-tab');
    }
}

// --- Carga inicial ---
async function loadMovies() {
    try {
        loading.style.display = 'block';
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al cargar la cartelera. Código de estado: ' + res.status);
        const data = await res.json();
        allMovies = Array.isArray(data) ? data : [];
        populateFilters();
        updateUIBasedOnTab();
    } catch (error) {
        console.error('Error:', error);
        moviesContainer.innerHTML = `<p style="text-align:center;color:#d32f2f">${error.message}</p>`;
    } finally {
        loading.style.display = 'none';
    }
}

// --- Render ---
function displayMovies(list) {
    moviesContainer.innerHTML = '';
    if (!list || list.length === 0) {
        moviesContainer.innerHTML = '<p style="text-align:center;color:#555">No se encontraron películas.</p>';
        return;
    }

    list.forEach(movie => {
        const isFavorite = favorites.some(f => f.imdbID === movie.imdbID);
        const card = document.createElement('div');
        card.classList.add('movie-card');
        if (isFavorite) card.classList.add('favorite');

        card.innerHTML = `
      <img src="${movie.Poster || 'https://placehold.co/220x320/374151/FFFFFF?text=No+Image'}"
           alt="${movie.Title}"
           onerror="this.onerror=null;this.src='https://placehold.co/220x320/374151/FFFFFF?text=No+Image';">
      <span class="favorite-icon"><i class="fas fa-star"></i></span>
      <div class="info">
        <h3>${movie.Title}</h3>
        <p>Género: ${movie.Type || 'Desconocido'}</p>
      </div>
    `;

        // Abrir modal
        card.addEventListener('click', () => openModal(movie));

        // Toggle favorito desde la tarjeta
        const favIcon = card.querySelector('.favorite-icon');
        favIcon.addEventListener('click', e => {
            e.stopPropagation();
            toggleFavorite(movie);
        });

        moviesContainer.appendChild(card);
    });
}

// --- Modal ---
function openModal(movie) {
    modalImg.src = movie.Poster || 'https://placehold.co/220x320/374151/FFFFFF?text=No+Image';
    modalImg.alt = movie.Title;
    modalTitle.textContent = movie.Title;
    modalGenre.textContent = `Género: ${movie.Type || 'Desconocido'}`;
    modalYear.textContent = `Año: ${movie.Year || 'Desconocido'}`;
    modalUbication.textContent = `Ubicación: ${movie.Ubication || 'Desconocido'}`;
    modalDescription.textContent = movie.description || 'Sin descripción disponible';

    const isFavorite = favorites.some(f => f.imdbID === movie.imdbID);
    btnFavorite.textContent = isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
    btnFavorite.onclick = () => toggleFavorite(movie);

    modal.style.display = 'flex';
}

function closeModalNow() {
    modal.style.display = 'none';
}

// --- Favoritos ---
function toggleFavorite(movie) {
    const exists = favorites.some(f => f.imdbID === movie.imdbID);
    if (exists) {
        favorites = favorites.filter(f => f.imdbID !== movie.imdbID);
    } else {
        favorites.push(movie);
    }
    saveFavorites();
    updateUIBasedOnTab();

    // Si el modal está abierto, refrescar texto del botón
    if (modal.style.display === 'flex' && modalTitle.textContent === movie.Title) {
        const nowFav = favorites.some(f => f.imdbID === movie.imdbID);
        btnFavorite.textContent = nowFav ? 'Quitar de favoritos' : 'Añadir a favoritos';
    }
}

// --- Filtros y búsqueda ---
function populateFilters() {
    const ubications = [...new Set(allMovies.map(m => m.Ubication))].filter(Boolean).sort();
    filterSelect.innerHTML = '<option value="">Todas las ubicaciones</option>';
    ubications.forEach(ubi => {
        const opt = document.createElement('option');
        opt.value = ubi;
        opt.textContent = ubi;
        filterSelect.appendChild(opt);
    });
}

function filterMovies() {
    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    const ubicationTerm = filterSelect.value;
    const listToFilter = tabFavorites.classList.contains('active-tab') ? favorites : allMovies;

    const filtered = listToFilter.filter(movie => {
        const byText = (movie.Title || '').toLowerCase().includes(searchTerm);
        const byUbi = ubicationTerm === '' || movie.Ubication === ubicationTerm;
        return byText && byUbi;
    });

    displayMovies(filtered);
}

function updateUIBasedOnTab() {
    if (tabFavorites.classList.contains('active-tab')) {
        displayMovies(favorites);
    } else {
        displayMovies(allMovies);
    }
}

// --- Listeners globales ---
closeModal.onclick = closeModalNow;
window.addEventListener('click', e => { if (e.target === modal) closeModalNow(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalNow(); });

// Modo oscuro (persistencia opcional)
const THEME_KEY = 'cineapp_theme';
(function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') document.body.classList.add('dark-mode');
})();
btnDarkmode.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Tabs
tabCartelera.addEventListener('click', e => {
    e.preventDefault();
    setActiveTab('cartelera');
    filterMovies();
    // cerrar menú en mobile
    navLinks.classList.remove('show');
});
tabFavorites.addEventListener('click', e => {
    e.preventDefault();
    setActiveTab('favorites');
    filterMovies();
    navLinks.classList.remove('show');
});

// Búsqueda y filtro
searchInput.addEventListener('input', filterMovies);
filterSelect.addEventListener('change', filterMovies);

// Menú 
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
});

// --- Init ---
loadMovies();
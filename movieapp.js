// --- IMPORTANT SECURITY WARNING ---
// It is highly insecure to expose your API key in client-side JavaScript.
// Anyone can view it and misuse it. In a real application, you should make
// API calls from a backend server (e.g., using Node.js) or a serverless
// function which securely stores and adds the API key to requests.
const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // Replace with your TMDb API key

const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const API_BASE_URL = 'https://api.themoviedb.org/3';

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
];

// DOM Elements
const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const suggestions = document.getElementById('search-suggestions');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupVideo = document.getElementById('popup-video');
const popupDetails = document.getElementById('popup-details');
const popupReviews = document.getElementById('popup-reviews');
const popupShare = document.getElementById('popup-share');
const popupRelated = document.getElementById('popup-related');
const closePopup = document.getElementById('close-popup');
const genreSelect = document.getElementById('genre-select');
const sortSelect = document.getElementById('sort-select');
const yearSelect = document.getElementById('year-select');
const langSelect = document.getElementById('lang-select');
const ratingSelect = document.getElementById('rating-select');
const loader = document.getElementById('loader');
const darkToggle = document.getElementById('dark-mode-toggle');
const langToggle = document.getElementById('language-toggle');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileBtn = document.getElementById('profile-btn');
const favoritesBtn = document.getElementById('favorites-btn');
const watchlistBtn = document.getElementById('watchlist-btn');
const authModal = document.getElementById('auth-modal');
const closeAuth = document.getElementById('close-auth');
const authForms = document.getElementById('auth-forms');
const siteTitle = document.getElementById('site-title');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const reloadBtn = document.getElementById('reload-btn'); // ADDED

// State Management
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let userData = JSON.parse(localStorage.getItem('users')) || {};
let currentLang = localStorage.getItem('lang') || 'en';
let currentPage = 1;
let totalPages = 1;
let currentView = 'discover'; // 'discover', 'search', 'favorites', 'watchlist'
let lastQuery = '';
let isFetching = false;

/**
 * Initializes the application
 */
async function init() {
  await setupUI();
  addEventListeners();
  restoreState();
  fetchAndShowMovies();
}

/**
 * Sets up initial UI elements like genre and year options
 */
async function setupUI() {
  await buildGenreOptions();
  buildYearOptions();
  buildLanguageOptions();
}

/**
 * Adds all major event listeners for the application
 */
function addEventListeners() {
  siteTitle.addEventListener('click', goHome);
  siteTitle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goHome(); });

  form.addEventListener('submit', handleSearchSubmit);
  search.addEventListener('input', handleSearchInput);

  // Add listeners to all filter controls to re-fetch movies on change
  [sortSelect, genreSelect, yearSelect, langSelect, ratingSelect].forEach(select => {
    select.addEventListener('change', () => {
      currentView = 'discover';
      fetchAndShowMovies();
    });
  });

  resetFiltersBtn.addEventListener('click', resetFilters);

  // ADDED: Reload button reloads the Spline animation and movie list
  reloadBtn.addEventListener('click', () => {
    const spline = document.querySelector('spline-viewer');
    if (spline) {
      spline.reload();
    }
    goHome();
  });

  window.addEventListener('scroll', handleInfiniteScroll);

  darkToggle.addEventListener('click', toggleDarkMode);
  langToggle.addEventListener('click', toggleLanguage);

  loginBtn.addEventListener('click', () => showAuthModal('login'));
  logoutBtn.addEventListener('click', logoutUser);
  profileBtn.addEventListener('click', showUserProfile);
  closeAuth.addEventListener('click', closeAuthModal);

  favoritesBtn.addEventListener('click', showFavorites);
  watchlistBtn.addEventListener('click', showWatchlist);
  closePopup.addEventListener('click', closeMoviePopup);
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (popup.classList.contains('visible')) closeMoviePopup();
      if (authModal.classList.contains('visible')) closeAuthModal();
    }
  });
}

/**
 * Restores user preferences like theme and auth state from localStorage
 */
function restoreState() {
  const theme = localStorage.getItem('theme') || 'dark';
  setTheme(theme);
  updateAuthDisplay();
}

/**
 * Resets filters and search to default and returns to homepage view
 */
function goHome() {
  search.value = '';
  suggestions.innerHTML = '';
  resetFilters();
}

/**
 * Resets filter controls to their default values and refreshes movies
 */
function resetFilters() {
  sortSelect.value = 'popularity.desc';
  genreSelect.value = '';
  yearSelect.value = '';
  ratingSelect.value = '';
  // Note: We don't reset the language filter, as that's a user preference
  
  currentView = 'discover';
  fetchAndShowMovies();
}


/**
 * Main function to fetch movies from API and display them
 * @param {object} options - Options for fetching, e.g., { append: true }
 */
async function fetchAndShowMovies(options = {}) {
  if (isFetching) return;
  
  showLoading();
  isFetching = true;

  if (!options.append) {
    main.innerHTML = '';
    currentPage = 1;
  }

  const url = getMoviesUrl(currentPage);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    totalPages = data.total_pages || 1;
    showMovies(data.results || [], options);
  } catch (error) {
    console.error('Failed to load movies:', error);
    showError('Failed to load movies. Please check your connection and try again.');
  } finally {
    hideLoading();
    isFetching = false;
  }
}

/**
 * Constructs the appropriate API URL based on the current view and filters
 * @param {number} page - The page number to fetch
 * @returns {string} The constructed API URL
 */
function getMoviesUrl(page = 1) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: currentLang,
    page: page
  });

  if (currentView === 'search') {
    params.append('query', lastQuery);
    return `${API_BASE_URL}/search/movie?${params.toString()}`;
  }
  
  // Discover view
  params.append('sort_by', sortSelect.value);
  if (genreSelect.value) params.append('with_genres', genreSelect.value);
  if (yearSelect.value) params.append('primary_release_year', yearSelect.value);
  if (langSelect.value) params.append('with_original_language', langSelect.value);
  if (ratingSelect.value) params.append('vote_average.gte', ratingSelect.value);
  params.append('vote_count.gte', 100); // Filter out movies with very few votes

  return `${API_BASE_URL}/discover/movie?${params.toString()}`;
}

/**
 * Renders the list of movies in the main container
 * @param {Array} movies - Array of movie objects
 * @param {object} options - Display options, e.g., { append: false }
 */
function showMovies(movies, { append = false } = {}) {
  if (!append) main.innerHTML = '';
  
  if (movies.length === 0 && currentPage === 1) {
    showError('No movies found matching your criteria.');
    return;
  }

  const fragment = document.createDocumentFragment();
  movies.forEach(movie => {
    const { id, title, poster_path, vote_average, overview } = movie;
    const el = document.createElement('div');
    el.classList.add('movie');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${title}, Rating: ${vote_average.toFixed(1)}`);
    el.innerHTML = `
      <div class="movie-img">
        <img data-src="${poster_path ? IMG_PATH + poster_path : 'https://via.placeholder.com/500x750.png?text=No+Image'}" alt="${title} Poster" class="lazy-img" loading="lazy" />
      </div>
      <button class="favorite-toggle" aria-label="Toggle Favorite">★</button>
      <button class="watchlist-toggle" aria-label="Toggle Watchlist">+</button>
      <div class="overview">
        <h3>${title}</h3>
        <p>${truncate(overview, 100)}</p>
        <button class="details-btn">More details</button>
      </div>
      <div class="movie-info">
        <h3>${title}</h3>
        <span class="${getClassByRate(vote_average)}">${vote_average > 0 ? vote_average.toFixed(1) : "N/A"}</span>
      </div>
    `;
    
    // Event listeners for movie card actions
    el.addEventListener('click', () => showMovieDetails(id));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') showMovieDetails(id) });

    el.querySelector('.details-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showMovieDetails(id);
    });
    
    el.querySelector('.favorite-toggle').addEventListener('click', e => {
      e.stopPropagation();
      toggleList('favorites', { id, title, poster_path });
      updateMovieCardState(el, id);
    });

    el.querySelector('.watchlist-toggle').addEventListener('click', e => {
      e.stopPropagation();
      toggleList('watchlist', { id, title, poster_path });
      updateMovieCardState(el, id);
    });

    updateMovieCardState(el, id);
    fragment.appendChild(el);
  });
  
  main.appendChild(fragment);
  initLazyLoading();
}

/**
 * Updates the favorite/watchlist icon state on a movie card
 */
function updateMovieCardState(card, id) {
  if (!currentUser) return;
  const isFavorite = getUserList('favorites').some(m => m.id === id);
  const isWatchlisted = getUserList('watchlist').some(m => m.id === id);
  card.querySelector('.favorite-toggle').classList.toggle('active', isFavorite);
  card.querySelector('.watchlist-toggle').classList.toggle('active', isWatchlisted);
}

/**
 * Fetches and displays detailed movie info in a popup
 * @param {number} id - The movie ID
 */
async function showMovieDetails(id) {
  showLoading();
  popup.classList.add('visible');
  popup.setAttribute('aria-hidden', 'false');
  popupTitle.textContent = 'Loading...';
  [popupVideo, popupDetails, popupReviews, popupShare, popupRelated].forEach(el => el.innerHTML = '');

  try {
    const fetchPromises = [
      fetch(`${API_BASE_URL}/movie/${id}?api_key=${API_KEY}&language=${currentLang}`),
      fetch(`${API_BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`),
      fetch(`${API_BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`),
      fetch(`${API_BASE_URL}/movie/${id}/reviews?api_key=${API_KEY}`),
      fetch(`${API_BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}`)
    ];

    const responses = await Promise.all(fetchPromises);
    for (const res of responses) {
      if (!res.ok) throw new Error(`Failed to fetch movie details. Status: ${res.status}`);
    }
    const [movie, credits, videos, reviews, recs] = await Promise.all(responses.map(r => r.json()));
    
    // --- Render Popup Content ---
    popupTitle.textContent = movie.title;

    // Details
    const director = credits.crew.find(c => c.job === "Director");
    popupDetails.innerHTML = `
      <div class="movie-meta">
        <img src="${movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/500x750.png?text=No+Image'}" alt="${movie.title} poster" />
        <p>${movie.overview || 'No overview available.'}</p>
        <p><b>Release:</b> ${movie.release_date || 'N/A'}</p>
        <p><b>Genres:</b> ${movie.genres.length > 0 ? movie.genres.map(g => g.name).join(', ') : 'N/A'}</p>
        <p><b>Runtime:</b> ${movie.runtime ? `${movie.runtime} min` : 'N/A'}</p>
        <p><b>Director:</b> ${director ? director.name : 'N/A'}</p>
        <p><b>Cast:</b> ${credits.cast.length > 0 ? credits.cast.slice(0, 5).map(c => c.name).join(', ') : 'N/A'}</p>
      </div>`;
    
    // Video
    const trailer = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    popupVideo.innerHTML = trailer
      ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : '<div>No trailer available.</div>';

    // Reviews
    popupReviews.innerHTML = `
      <div class="review-section">
        <h4>User Reviews</h4>
        ${reviews.results.length > 0 ? `<ul>${reviews.results.slice(0, 3).map(r => `<li><b>${r.author}</b>: ${truncate(r.content, 160)}</li>`).join('')}</ul>` : '<p>No API reviews found.</p>'}
        ${currentUser ? `
          <form id="review-form">
            <label for="review-text">Leave your review:</label><br>
            <textarea id="review-text" maxlength="500" required></textarea><br>
            <button type="submit">Submit</button>
          </form>` : '<p>Please log in to leave a review.</p>'
        }
        <div id="local-reviews"></div>
      </div>`;
    
    // Share
    popupShare.innerHTML = `
      <div class="share-buttons">
        <button type="button" id="share-btn">Share</button>
      </div>`;
    document.getElementById('share-btn')?.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({ title: movie.title, url: window.location.href }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied to clipboard!'));
        }
    });

    // Related
    if (recs.results.length > 0) {
      popupRelated.innerHTML = `
        <div class="related-section">
          <h4>Related Movies</h4>
          <div>${recs.results.slice(0, 5).map(r => `<span class="related-movie" data-id="${r.id}" tabindex="0">${r.title}</span>`).join('')}</div>
        </div>`;
      popupRelated.querySelectorAll('.related-movie').forEach(el => {
        el.addEventListener('click', () => showMovieDetails(el.dataset.id));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') showMovieDetails(el.dataset.id) });
      });
    }

    if (currentUser) {
      document.getElementById('review-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const txtArea = document.getElementById('review-text');
        saveLocalReview(id, currentUser, txtArea.value);
        txtArea.value = '';
        loadLocalReviews(id);
      });
      loadLocalReviews(id);
    }

  } catch (error) {
    console.error('Failed to load movie details:', error);
    popupDetails.innerHTML = '<p class="error-message">Failed to load movie details.</p>';
  } finally {
    hideLoading();
  }
}

function closeMoviePopup() {
  popup.classList.remove('visible');
  popup.setAttribute('aria-hidden', 'true');
  popupVideo.innerHTML = ''; // Stop video playback
}

// --- Helper Functions ---
function showLoading() { loader.style.display = 'block'; }
function hideLoading() { loader.style.display = 'none'; }
function showError(message) { main.innerHTML = `<div class="error-message">${message}</div>`; }
function truncate(text, length = 165) { return text && text.length > length ? text.slice(0, length) + '…' : text || ""; }
function getClassByRate(r) {
  if (r >= 8) return 'green';
  if (r >= 6) return 'orange';
  return 'red';
}

// --- Local Storage Functions for Reviews/Lists ---
function saveLocalReview(movieId, user, content) {
  let movieReviews = JSON.parse(localStorage.getItem(`reviews_${movieId}`)) || [];
  movieReviews.unshift({ user: user.username, text: content.trim().slice(0, 500), date: new Date().toISOString() });
  localStorage.setItem(`reviews_${movieId}`, JSON.stringify(movieReviews));
}

function loadLocalReviews(movieId) {
  const local = JSON.parse(localStorage.getItem(`reviews_${movieId}`)) || [];
  const container = popupReviews.querySelector('#local-reviews');
  if (container) {
    container.innerHTML = local.map(r => `<div><b>${r.user}</b> (${new Date(r.date).toLocaleDateString()}): ${r.text}</div>`).join('');
  }
}

// --- Favorite and Watchlist Management ---
function toggleList(type, movie) {
  if (!currentUser) {
    alert('Please log in to use this feature.');
    return;
  }
  let list = getUserList(type);
  const idx = list.findIndex(m => m.id === movie.id);

  if (idx > -1) {
    list.splice(idx, 1); // Remove
  } else {
    list.push({ id: movie.id, title: movie.title, poster_path: movie.poster_path }); // Add
  }
  setUserList(type, list);
  
  // If user is currently viewing that list, refresh it
  if (currentView === type) {
    showList(type);
  }
}

function getUserList(type) {
  if (!currentUser || !userData[currentUser?.username]) return [];
  return userData[currentUser.username][type] || [];
}

function setUserList(type, list) {
  userData[currentUser.username][type] = list;
  localStorage.setItem('users', JSON.stringify(userData));
}

function showList(type) {
  if (!currentUser) return alert('Please log in.');
  currentView = type;
  const list = getUserList(type);
  showMovies(list.map(m => ({ ...m, vote_average: 0, overview: '' })));
}

function showFavorites() { showList('favorites'); }
function showWatchlist() { showList('watchlist'); }


// --- UI Builders ---
async function buildGenreOptions() {
  try {
    const res = await fetch(`${API_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=${currentLang}`);
    const data = await res.json();
    genreSelect.innerHTML = '<option value="">All Genres</option>' + data.genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
  } catch {
    console.error("Failed to build genre options");
  }
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  let options = '<option value="">All Years</option>';
  for (let y = currentYear; y >= currentYear - 100; y--) {
    options += `<option value="${y}">${y}</option>`;
  }
  yearSelect.innerHTML = options;
}

function buildLanguageOptions() {
  langSelect.innerHTML = LANGS.map(l => `<option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>${l.label}</option>`).join('');
}


// --- Search and Suggestions ---
let debounceTimer;
function handleSearchInput(e) {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  if (query) {
    debounceTimer = setTimeout(() => fetchSuggestions(query), 350);
  } else {
    suggestions.innerHTML = '';
  }
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const query = search.value.trim();
  if (query) {
    currentView = 'search';
    lastQuery = query;
    fetchAndShowMovies();
    suggestions.innerHTML = '';
    search.blur();
  }
}

async function fetchSuggestions(query) {
  try {
    const res = await fetch(`${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${currentLang}`);
    const data = await res.json();
    suggestions.innerHTML = data.results.slice(0, 5).map(m => `<div class="suggestion" role="option" tabindex="0" data-query="${m.title}">${m.title}</div>`).join('');

    suggestions.querySelectorAll('.suggestion').forEach(el => {
      const suggestionQuery = el.dataset.query;
      el.addEventListener('click', () => {
        search.value = suggestionQuery;
        currentView = 'search';
        lastQuery = suggestionQuery;
        fetchAndShowMovies();
        suggestions.innerHTML = '';
      });
    });
  } catch {
    suggestions.innerHTML = '';
  }
}

// --- Lazy Loading ---
function initLazyLoading() {
  const lazyImages = document.querySelectorAll('.lazy-img');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy-img');
        obs.unobserve(img);
      }
    });
  }, { rootMargin: '0px 0px 200px 0px' });
  lazyImages.forEach(img => observer.observe(img));
}

// --- Auth Display and Modals ---
function updateAuthDisplay() {
  if (currentUser) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    profileBtn.style.display = 'inline-block';
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    profileBtn.style.display = 'none';
  }
}

function showAuthModal(type) {
  authModal.classList.add('visible');
  authModal.setAttribute('aria-hidden', 'false');
  renderAuthForm(type);
}
function closeAuthModal() {
  authModal.classList.remove('visible');
  authModal.setAttribute('aria-hidden', 'true');
}

function renderAuthForm(type) {
  authForms.innerHTML = `
    <form id="${type}-form" novalidate>
      <h3>${type === 'login' ? 'Login' : 'Register'}</h3>
      <p style="font-size:0.8em; color: var(--text-muted);">This is a demo. Do not use real passwords.</p>
      <input required type="text" id="auth-username" placeholder="Username" autocomplete="username" minlength="3" />
      <input required type="password" id="auth-password" placeholder="Password (min 6 chars)" autocomplete="${type === 'login' ? 'current-password' : 'new-password'}" minlength="6" />
      <button type="submit">${type === 'login' ? 'Login' : 'Register'}</button>
      <button type="button" id="switch-auth" class="link-btn">${type === 'login' ? 'Need an account? Register' : 'Have an account? Login'}</button>
    </form>`;
  
  document.getElementById(`${type}-form`).addEventListener('submit', function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
      alert('Please fill out the form correctly (min username 3 chars, password 6 chars).');
      return;
    }
    const username = this['auth-username'].value.trim().toLowerCase();
    const password = this['auth-password'].value;
    if (type === 'login') loginUser(username, password);
    else registerUser(username, password);
  });
  
  document.getElementById('switch-auth').addEventListener('click', () => {
    renderAuthForm(type === 'login' ? 'register' : 'login');
  });
}

// --- *** AUTHENTICATION LOGIC (INSECURE DEMO) *** ---
// WARNING: The following authentication logic is for demonstration purposes ONLY.
// It stores user data, including a representation of the password, in localStorage,
// which is NOT secure. In a real-world application, never store passwords on the
// client-side. Authentication MUST be handled by a secure backend server that
// hashes and salts passwords.

function registerUser(username, password) {
  if (userData[username]) {
    alert('User already exists.');
    return;
  }
  // This is NOT secure hashing. It's a simple placeholder.
  const mockHash = 'hashed_' + password;
  userData[username] = { passwordHash: mockHash, favorites: [], watchlist: [] };
  localStorage.setItem('users', JSON.stringify(userData));
  loginUser(username, password);
}

function loginUser(username, password) {
  const mockHash = 'hashed_' + password;
  if (!userData[username] || userData[username].passwordHash !== mockHash) {
    alert('Invalid username or password.');
    return;
  }
  currentUser = { username };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  updateAuthDisplay();
  closeAuthModal();
  goHome(); // Refresh movie list to show user-specific data
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthDisplay();
  goHome(); // Refresh to non-logged-in state
}

function showUserProfile() {
  showAuthModal('profile');
  authForms.innerHTML = `
    <div>
      <h3>Profile</h3>
      <p>Logged in as: <b>${currentUser.username}</b></p>
      <button type="button" id="logout-profile-btn">Logout</button>
    </div>`;
  document.getElementById('logout-profile-btn').addEventListener('click', () => {
    logoutUser();
    closeAuthModal();
  });
}

// --- Infinite Scroll and Theme/Language Toggles ---
function handleInfiniteScroll() {
  if (isFetching || currentView === 'favorites' || currentView === 'watchlist') return;
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 300 && currentPage < totalPages) {
    currentPage++;
    fetchAndShowMovies({ append: true });
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

function toggleDarkMode() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
}

function toggleLanguage() {
  const currentIndex = LANGS.findIndex(l => l.code === currentLang);
  currentLang = LANGS[(currentIndex + 1) % LANGS.length].code;
  localStorage.setItem('lang', currentLang);
  buildLanguageOptions();
  buildGenreOptions();
  goHome();
}

// Start the application
init();
/* ========================================
   UNIVERSAL LOADER + CACHE MANAGER
   Header/Footer me ek baar - Sab automatic!
   ======================================== */

// CACHE CONFIG - Date wise update control
const CACHE_CONFIG = {
  lastUpdate: localStorage.getItem('mbk-lastUpdate') || null,
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  dataCache: JSON.parse(localStorage.getItem('mbk-dataCache') || '{}'),
  filesLoaded: new Set()
};

// Universal init - DOM loaded hone par chalega
document.addEventListener('DOMContentLoaded', initUniversalLoader);

function initUniversalLoader() {
  console.log('🔥 Universal Loader Active');
  
  // Check if data update needed
  checkCacheExpiry();
  
  // Auto-detect page type
  detectPageType();
  
  // CSS auto-load
  loadCSS();
}

function checkCacheExpiry() {
  const now = Date.now();
  const today = new Date().toDateString();
  
  if (!CACHE_CONFIG.lastUpdate || CACHE_CONFIG.lastUpdate !== today) {
    // Clear old cache, new day = fresh data
    localStorage.removeItem('mbk-dataCache');
    localStorage.setItem('mbk-lastUpdate', today);
    CACHE_CONFIG.dataCache = {};
    console.log('📅 New day - Cache cleared');
  }
}

function detectPageType() {
  // GOLD PAGE DETECT
  if (typeof gctqury !== 'undefined') {
    loadGoldPage(gctqury);
  }
  // SILVER PAGE DETECT  
  else if (typeof sctqury !== 'undefined') {
    loadSilverPage(sctqury);
  }
}

async function loadCSS() {
  // Auto CSS based on page
  if (typeof gctqury !== 'undefined') {
    loadCSSFile('https://aditya-kumar-tech.github.io/mbk/data/core/gold-style.css');
  } else if (typeof sctqury !== 'undefined') {
    loadCSSFile('https://aditya-kumar-tech.github.io/mbk/data/core/silver-style.css');
  }
}

function loadCSSFile(url) {
  if (document.querySelector(`link[href="${url}"]`)) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// GOLD PAGE FULL LOAD
async function loadGoldPage(query) {
  const cacheKey = `gold-${query}`;
  
  // Check cache first
  if (CACHE_CONFIG.dataCache[cacheKey]) {
    console.log('💾 Gold cache HIT');
    applyGoldData(CACHE_CONFIG.dataCache[cacheKey]);
    return;
  }
  
  console.log('📥 Gold loading...');
  loadScript('https://aditya-kumar-tech.github.io/mbk/data/gold-rates/gold-data.js', () => {
    golddata(query, 'Gold');
  });
}

// SILVER PAGE FULL LOAD  
async function loadSilverPage(query) {
  const cacheKey = `silver-${query}`;
  
  if (CACHE_CONFIG.dataCache[cacheKey]) {
    console.log('💾 Silver cache HIT');
    applySilverData(CACHE_CONFIG.dataCache[cacheKey]);
    return;
  }
  
  console.log('📥 Silver loading...');
  loadScript('https://aditya-kumar-tech.github.io/mbk/data/silver-rates/silver-data.js', () => {
    Silverdata(query, 'Silver');
  });
}

function loadScript(src, callback) {
  if (CACHE_CONFIG.filesLoaded.has(src)) {
    callback();
    return;
  }
  
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => {
    CACHE_CONFIG.filesLoaded.add(src);
    callback();
  };
  script.onerror = () => console.error('❌ Script load failed:', src);
  document.head.appendChild(script);
}

// DATA CACHE SAVE (golddata/Silverdata me ye call karna)
window.saveToCache = function(key, data) {
  CACHE_CONFIG.dataCache[key] = data;
  localStorage.setItem('mbk-dataCache', JSON.stringify(CACHE_CONFIG.dataCache));
};

// Universal error handler
window.addEventListener('error', (e) => {
  console.error('🚨 Universal Loader Error:', e.message);
});

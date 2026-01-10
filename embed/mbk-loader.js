(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';

  const CSS_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css';
  const JS_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js';

  let manifest = {};
  let bootPromise = null;

  const PRICES_TTL_MS = 5 * 60 * 1000; // 5 minutes
  const CACHE_PREFIX = 'mbk:';
  
  const el = {};
  let mandiData = [];
  let viewMode = 'table';
  let currentMandiId = '';
  let currentDate = '';
  let pricesData = null;

  // ------------------ UTIL ------------------
  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id}`);
    return node;
  }

  function showLoading(show) {
    if (!el.loadingMsg) return;
    el.loadingMsg.style.display = show ? 'block' : 'none';
  }

  function clearCache(keys = []) {
    if (!keys.length) {
      // clear all mbk cache
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k); });
      return;
    }
    keys.forEach(k => sessionStorage.removeItem(k));
  }

  function loadCssOnce(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('link[data-mbk="css"]')) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href + '?v=' + manifest.css_ver;
      link.setAttribute('data-mbk','css');
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('CSS load failed'));
      document.head.appendChild(link);
    });
  }

  function loadJsOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-mbk="js"]')) return resolve();
      const s = document.createElement('script');
      s.src = src + '?v=' + manifest.js_ver;
      s.async = true;
      s.setAttribute('data-mbk','js');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('JS load failed'));
      document.head.appendChild(s);
    });
  }

  async function fetchManifest() {
    const res = await fetch(MANIFEST_URL, {cache:'no-store'});
    manifest = await res.json();
    return manifest;
  }

  function isCacheExpired(key, ttl) {
    const data = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!data || !data.t) return true;
    return (Date.now() - data.t) > ttl;
  }

  async function cachedPricesJson(pricesUrl, key) {
    const cacheKey = CACHE_PREFIX + key;
    if (!isCacheExpired(cacheKey, PRICES_TTL_MS)) {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached?.data) return cached.data;
    }
    const res = await fetch(pricesUrl);
    const data = await res.json();
    sessionStorage.setItem(cacheKey, JSON.stringify({t: Date.now(), data}));
    return data;
  }

  // ------------------ BOOT ------------------
  async function ensureBoot(force=false) {
    if (window.MBK && window.MBK.init && !force) return window.MBK.init();
    if (!bootPromise) {
      bootPromise = (async () => {
        await loadCssOnce(CSS_URL);
        await loadJsOnce(JS_URL);
      })();
    }
    await bootPromise;
    if (window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ------------------ LOAD MANI BHAV ------------------
  async function loadMandiBhav(mandiId, forceReload=false) {
    currentMandiId = mandiId;

    if (!mandiId) {
      showLoading(false);
      return;
    }

    showLoading(true);

    try {
      // load manifest and decide cache clear
      await fetchManifest();

      if (forceReload || manifest.force_reload) {
        clearCache();
      }

      await ensureBoot(forceReload);

      // prices url
      const stateId = mandiId.slice(0,2);
      const distId = mandiId.slice(0,5);
      const stateSlug = stateId; // simplification, map slug if needed
      const distSlug = distId; // simplification, map slug if needed
      const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;

      pricesData = await cachedPricesJson(pricesUrl, distId);

      // Filter data for current mandi/date
      const dateSet = new Set();
      (pricesData.rows||[]).forEach(r=>{if(r[1]===mandiId&&r[0]) dateSet.add(r[0]);});
      const allDates = Array.from(dateSet).sort().reverse();
      currentDate = allDates[0] || '';

      mandiData = (pricesData.rows||[]).filter(r=>r[1]===mandiId && r[0]===currentDate);

      renderDynamicHTML();
    } finally {
      showLoading(false);
    }
  }

  // ------------------ RENDER ------------------
  function renderDynamicHTML() {
    // create container if not exists
    if (!document.getElementById('mbkApp')) {
      const div = document.createElement('div');
      div.id = 'mbkApp';
      document.body.appendChild(div);
    }

    const app = document.getElementById('mbkApp');
    app.innerHTML = '';

    // stats
    const stats = document.createElement('div');
    stats.id = 'stats';
    stats.textContent = `Records: ${mandiData.length} | Mandi: ${currentMandiId} | Date: ${currentDate}`;
    app.appendChild(stats);

    // table
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    ['क्रम','कमोडिटी','वैरायटी','ग्रेड','न्यूनतम ₹','अधिकतम ₹','मॉडल ₹','क्विंटल','बोरी','तारीख'].forEach(t=>{
      const th = document.createElement('th'); th.textContent = t; trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    mandiData.forEach((row,i)=>{
      const tr = document.createElement('tr');
      tr.insertCell().textContent = i+1;
      for(let c=2;c<=9;c++){
        tr.insertCell().textContent = row[c]||'-';
      }
      tr.insertCell().textContent = row[0]||'-';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    app.appendChild(table);
  }

  // ------------------ GLOBAL ------------------
  window.mandibhavloadfresh = function(force=false){
    const cfg = document.getElementById('mbk-config');
    const id = cfg?.dataset?.mandi;
    loadMandiBhav(id, force || manifest.force_reload_on_button);
  };

  // Auto-load
  (function autoLoad(){
    const cfg = document.getElementById('mbk-config');
    const autoload = cfg?.dataset?.autoload==='1';
    if(autoload){
      window.mandibhavloadfresh();
    } else {
      showLoading(false);
    }
  })();

})();

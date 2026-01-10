(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';

  const APP_VER = "2026-01-10_01"; // Update version for cache busting
  const APP_VER_KEY = "mbk:app_ver";

  const MAPS_VER_KEY = 'mbk:maps_ver';
  const MAP_PREFIX = 'mbk:map:';
  const PRICES_PREFIX = 'mbk:prices:';
  const PRICES_TTL_MS = 5 * 60 * 1000;

  let commodities = {}, varieties = {}, varietiesEng = {}, grades = {};
  let mandiData = [], states = {}, allDates = [], mandiNames = {};
  let currentMandiId = '', currentMandiName = '', currentStateName = '', currentDistName = '', currentDate = '';
  let pricesData = null, viewMode = 'table', visibleColumns = [];
  let __inited = false;
  const el = {};

  // --- Helper Functions ---

  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id}`);
    return node;
  }

  // Null, 0, aur "-" ko hide karne ke liye main validation
  function isValid(v) {
    return !(v === null || v === undefined || v === '' || v === 0 || v === '0' || v === '-');
  }

  function safeVal(v) {
    return isValid(v) ? v : '-';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  }

  // Variety Mapping: .n property handling
  function getVarietyName(vId) {
    if (!isValid(vId)) return '-';
    const vData = varietiesEng[vId];
    if (vData && typeof vData === 'object' && vData.n) return vData.n;
    return varieties[vId] || vId;
  }

  // Grade Mapping: Padding 01, 02... 17 ke liye
  function getGradeName(gId) {
    if (!isValid(gId)) return '-';
    const paddedId = String(gId).padStart(2, '0');
    return grades[paddedId] || grades[gId] || gId;
  }

  // --- Cache Management ---

  async function loadManifest() {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    return await res.json();
  }

  function clearByPrefix(prefix) {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach(k => sessionStorage.removeItem(k));
  }

  function resetAllMbkCache() {
    const prefixes = [MAP_PREFIX, PRICES_PREFIX, MAPS_VER_KEY];
    prefixes.forEach(p => clearByPrefix(p));
  }

  const oldVer = sessionStorage.getItem(APP_VER_KEY) || "";
  if (oldVer !== APP_VER) {
    resetAllMbkCache();
    sessionStorage.setItem(APP_VER_KEY, APP_VER);
  }

  async function syncManifestAndInvalidate() {
    try {
      const mf = await loadManifest();
      const newMapsVer = String(mf.maps_ver || '');
      const oldMapsVer = sessionStorage.getItem(MAPS_VER_KEY) || '';
      if (newMapsVer && newMapsVer !== oldMapsVer) {
        clearByPrefix(MAP_PREFIX);
        sessionStorage.setItem(MAPS_VER_KEY, newMapsVer);
      }
    } catch (e) {}
  }

  async function cachedMapJson(url) {
    const key = MAP_PREFIX + url;
    const raw = sessionStorage.getItem(key);
    if (raw) { try { return JSON.parse(raw); } catch(e) {} }
    const res = await fetch(url);
    const data = await res.json();
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    return data;
  }

  async function cachedPricesJson(pricesUrl, districtKey) {
    const key = PRICES_PREFIX + districtKey;
    const now = Date.now();
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached?.data?.rows && (now - cached.t) < PRICES_TTL_MS) return cached.data;
    } catch(e) {}
    const res = await fetch(pricesUrl);
    const data = await res.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: now, data })); } catch(e) {}
    return data;
  }

  // --- Core Loading & Rendering ---

  async function loadCommodities() {
    const [c, v, vEng, g] = await Promise.all([
      cachedMapJson(`${BASE_URL}commodities.json`),
      cachedMapJson(`${BASE_URL}varieties.json`),
      cachedMapJson(`${BASE_URL}varietiesEng.json`),
      cachedMapJson(`${BASE_URL}grades.json`)
    ]);
    commodities = c || {};
    varieties = v || {};
    varietiesEng = vEng || {};
    grades = g || {};
  }

  async function getPricesUrl(mandiId) {
    const stateId = mandiId.slice(0, 2);
    const distId = mandiId.slice(0, 5);
    states = await cachedMapJson(`${BASE_URL}states.json`);
    const stateInfo = states?.data?.[stateId];
    const stateSlug = stateInfo?.[1];

    const mandiDataFile = await cachedMapJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`);
    mandiNames = mandiDataFile.data || {};

    const distData = await cachedMapJson(`${BASE_URL}dists/${stateSlug}.json`);
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[1] || distId;

    return { 
      pricesUrl: `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`, 
      stateInfo, 
      distInfo, 
      distSlug 
    };
  }

  function detectVisibleColumns() {
    visibleColumns = [];
    const allCols = [
      { idx: 2, label: 'कमोडिटी' },
      { idx: 3, label: 'वैरायटी' },
      { idx: 4, label: 'ग्रेड' },
      { idx: 5, label: 'न्यूनतम ₹' },
      { idx: 6, label: 'अधिकतम ₹' },
      { idx: 7, label: 'मॉडल ₹' },
      { idx: 8, label: 'आवक (क्विंटल)' },
      { idx: 9, label: 'आवक (बोरी)' },
      { idx: 0, label: 'तारीख' }
    ];
    allCols.forEach(col => {
      if (mandiData.some(row => isValid(row[col.idx]))) {
        visibleColumns.push(col);
      }
    });
  }

  function renderTable(data) {
    const tbody = el.tableBody;
    const theadRow = el.mandiTable.querySelector('thead tr');
    tbody.innerHTML = '';
    theadRow.innerHTML = '<th>क्रम</th>';

    visibleColumns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      theadRow.appendChild(th);
    });

    data.forEach((row, index) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = index + 1;
      visibleColumns.forEach(col => {
        let val = '-';
        if (isValid(row[col.idx])) {
          if (col.idx === 2) val = commodities[row[2]] || row[2];
          else if (col.idx === 3) val = getVarietyName(row[3]);
          else if (col.idx === 4) val = getGradeName(row[4]);
          else if (col.idx === 0) val = formatDate(row[0]);
          else val = row[col.idx];
        }
        const td = tr.insertCell();
        td.textContent = val;
        if ([5, 6, 7].includes(col.idx) && val !== '-') td.classList.add('price');
        if (col.idx === 2) td.classList.add('commodity');
      });
    });
    el.mandiTable.style.display = 'table';
    el.cardsContainer.style.display = 'none';
  }

  function renderCards(data) {
    el.cardsContainer.innerHTML = data.map((row, index) => `
      <div class="card">
        <div class="card-header">
          <div><p class="card-title">${commodities[row[2]] || row[2] || '-'}</p><div class="card-serial">#${index + 1}</div></div>
          <div class="card-date-box"><div class="card-date">${formatDate(row[0])}</div></div>
        </div>
        <div class="card-grid">
          ${isValid(row[3]) ? `<div class="card-field"><div class="card-label">वैरायटी</div><div class="card-value">${getVarietyName(row[3])}</div></div>` : ''}
          ${isValid(row[4]) ? `<div class="card-field"><div class="card-label">ग्रेड</div><div class="card-value">${getGradeName(row[4])}</div></div>` : ''}
        </div>
        <div class="card-prices">
          <div class="card-prices-grid">
            ${isValid(row[5]) ? `<div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${row[5]}</div></div>` : ''}
            ${isValid(row[6]) ? `<div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${row[6]}</div></div>` : ''}
            ${isValid(row[7]) ? `<div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${row[7]}</div></div>` : ''}
          </div>
        </div>
        <div class="card-grid">
          ${isValid(row[8]) ? `<div class="card-field"><div class="card-label">आवक (क्विंटल)</div><div class="card-value">${row[8]}</div></div>` : ''}
          ${isValid(row[9]) ? `<div class="card-field"><div class="card-label">आवक (बोरी)</div><div class="card-value">${row[9]}</div></div>` : ''}
        </div>
      </div>`).join('');
    el.cardsContainer.style.display = 'grid';
    el.mandiTable.style.display = 'none';
  }

  function renderContent(data) {
    if (viewMode === 'table') renderTable(data);
    else renderCards(data);
  }

  function updateStats() {
    el.totalRecords.textContent = mandiData.length;
    el.uniqueCommodities.textContent = new Set(mandiData.map(r => r[2])).size;
    el.selectedDate.textContent = formatDate(currentDate);
    el.mandiName.textContent = currentMandiName;
    el.distName.textContent = currentDistName;
    el.stateName.textContent = currentStateName;
    
    el.stats.style.display = 'flex';
    el.mandiInfo.style.display = 'block';
    el.searchInput.style.display = 'block';
  }

  async function loadMandiBhav(mandiId) {
    if (!mandiId) return;
    currentMandiId = mandiId;
    el.loadingMsg.style.display = 'block';
    try {
      const { pricesUrl, stateInfo, distInfo, distSlug } = await getPricesUrl(mandiId);
      currentMandiName = mandiNames[mandiId]?.[0] || mandiId;
      currentStateName = stateInfo?.[0] || '-';
      currentDistName = distInfo?.[0] || distSlug;

      pricesData = await cachedPricesJson(pricesUrl, mandiId.slice(0, 5));
      const dateSet = new Set();
      (pricesData.rows || []).forEach(r => { if(r[1] === currentMandiId) dateSet.add(r[0]); });
      allDates = Array.from(dateSet).sort().reverse();

      el.dateSelect.innerHTML = allDates.map(d => `<option value="${d}">📅 ${formatDate(d)}</option>`).join('');
      if(allDates.length > 0) {
        currentDate = allDates[0];
        mandiData = (pricesData.rows || []).filter(r => r[1] === currentMandiId && r[0] === currentDate);
        detectVisibleColumns();
        renderContent(mandiData);
        updateStats();
        el.pageTitle.textContent = `🌱 ${currentMandiName} मंडी भाव`;
      }
    } finally {
      el.loadingMsg.style.display = 'none';
    }
  }

  async function init() {
    if (__inited) return;
    __inited = true;

    el.dateSelect = mustGet('dateSelect');
    el.toggleBtn = mustGet('toggleBtn');
    el.stats = mustGet('stats');
    el.totalRecords = mustGet('totalRecords');
    el.uniqueCommodities = mustGet('uniqueCommodities');
    el.selectedDate = mustGet('selectedDate');
    el.mandiInfo = mustGet('mandiInfo');
    el.mandiName = mustGet('mandiName');
    el.distName = mustGet('distName');
    el.stateName = mustGet('stateName');
    el.searchInput = mustGet('searchInput');
    el.pageTitle = mustGet('pageTitle');
    el.loadingMsg = mustGet('loadingMsg');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');

    el.toggleBtn.onclick = () => {
      viewMode = viewMode === 'table' ? 'card' : 'table';
      el.toggleBtn.textContent = viewMode === 'table' ? '🃏 कार्ड' : '📊 टेबल';
      renderContent(mandiData);
    };

    el.dateSelect.onchange = (e) => {
      currentDate = e.target.value;
      mandiData = (pricesData.rows || []).filter(r => r[1] === currentMandiId && r[0] === currentDate);
      detectVisibleColumns();
      renderContent(mandiData);
      updateStats();
    };

    el.searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = mandiData.filter(r => {
        const c = (commodities[r[2]]||r[2]||'').toLowerCase();
        const v = getVarietyName(r[3]).toLowerCase();
        return c.includes(q) || v.includes(q);
      });
      renderContent(filtered);
    };

    await syncManifestAndInvalidate();
    await loadCommodities();
    
    if (window.MBK_CONFIG?.autoLoad) loadMandiBhav(window.MBK_CONFIG.mandiId);
  }

  window.MBK = { init, loadMandiBhav };
})();

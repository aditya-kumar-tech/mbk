(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';

  const APP_VER_KEY = "mbk:app_ver";
  const MAPS_VER_KEY = 'mbk:maps_ver';
  const MAP_PREFIX = 'mbk:map:';
  const PRICES_PREFIX = 'mbk:prices:';
  const PRICES_TTL_MS = 5 * 60 * 1000; // 5 minutes strict TTL

  // data stores
  let commodities = {}, varieties = {}, varietiesEng = {}, grades = {};
  let states = {}, mandiNames = {}, mandiData = [], allDates = [];
  let currentMandiId = '', currentMandiName = '', currentStateName = '', currentDistName = '', currentDate = '';
  let pricesData = null;
  let viewMode = 'table';
  let visibleColumns = [];

  // DOM refs
  const el = {};
  let __inited = false;

  // --------- UTILITIES ----------
  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id}`);
    return node;
  }

  function showLoading(show) {
    const loader = document.getElementById('loadingMsg');
    const app = document.getElementById('mbkApp');
    if (loader) loader.style.display = show ? 'block' : 'none';
    if (app) app.style.display = show ? 'none' : 'block';
  }

  function isValid(v) {
    return !(v === null || v === undefined || v === '' || v === 0 || v === '-');
  }

  function safeVal(v) {
    return isValid(v) ? v : '-';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  }

  function getVarietyName(varietyId) {
    if (!varietyId) return '-';
    const vData = varietiesEng[varietyId];
    return vData?.n || varieties[varietyId] || varietyId || '-';
  }

  // --------- MANIFEST + CACHE ----------
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
    ["mbk:map:", "mbk:prices:", "mbk:maps_ver"].forEach(p => clearByPrefix(p));
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

      // Check app/css/js versions
      if (mf.app_ver && mf.app_ver !== sessionStorage.getItem(APP_VER_KEY)) {
        resetAllMbkCache();
        sessionStorage.setItem(APP_VER_KEY, mf.app_ver);
      }

      window.MBK_MANIFEST = mf; // store for button control
    } catch { }
  }

  async function cachedMapJson(url) {
    const key = MAP_PREFIX + url;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    const data = await (await fetch(url)).json();
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
    return data;
  }

  async function cachedPricesJson(pricesUrl, districtKey) {
    const key = PRICES_PREFIX + districtKey;
    const now = Date.now();

    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached?.data?.rows && cached?.t && (now - cached.t) < PRICES_TTL_MS) return cached.data;
    } catch {}

    const data = await (await fetch(pricesUrl)).json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: now, data })); } catch {}
    return data;
  }

  // --------- LOAD JSONS ----------
  async function loadCommodities() {
    [commodities, varieties, varietiesEng, grades] = await Promise.all([
      cachedMapJson(`${BASE_URL}commodities.json`),
      cachedMapJson(`${BASE_URL}varieties.json`),
      cachedMapJson(`${BASE_URL}varietiesEng.json`),
      cachedMapJson(`${BASE_URL}grades.json`)
    ]);
  }

  async function loadStates() {
    states = await cachedMapJson(`${BASE_URL}states.json`);
  }

  async function loadMandiNamesForState(stateSlug) {
    const data = await cachedMapJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`);
    mandiNames = data.data || {};
  }

  async function getPricesUrl(mandiId) {
    const stateId = mandiId.slice(0, 2);
    const distId = mandiId.slice(0, 5);

    const stateInfo = states?.data?.[stateId];
    const stateSlug = stateInfo?.[1];
    if (!stateSlug) throw new Error("State slug not found");

    if (!Object.keys(mandiNames).length) await loadMandiNamesForState(stateSlug);

    const distData = await cachedMapJson(`${BASE_URL}dists/${stateSlug}.json`);
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[1];
    if (!distSlug) throw new Error("Dist slug not found");

    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
    return { pricesUrl, stateInfo, distInfo, distSlug };
  }

  // --------- RENDER & UI ----------
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
      const hasData = mandiData.some(row => isValid(row[col.idx]));
      if (hasData) visibleColumns.push(col);
    });
  }

  function renderContent(data) {
    viewMode === 'table' ? renderTable(data) : renderCards(data);
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
    data.slice(0, 200).forEach((row, index) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = index + 1;
      visibleColumns.forEach(col => {
        let cellValue = safeVal(row[col.idx]);
        if (col.idx === 2) cellValue = commodities[row[2]] || row[2] || '-';
        else if (col.idx === 3) cellValue = getVarietyName(row[3]);
        else if (col.idx === 4) cellValue = grades[row[4]] || row[4] || '-';
        else if (col.idx === 0) cellValue = formatDate(row[0]);
        const td = tr.insertCell();
        td.textContent = cellValue;
        if ([5,6,7].includes(col.idx) && cellValue !== '-') td.classList.add('price');
        if (col.idx === 2) td.classList.add('commodity');
      });
    });
    el.mandiTable.style.display = 'table';
    el.cardsContainer.style.display = 'none';
  }

  function renderCards(data) {
    let html = '';
    data.slice(0, 200).forEach((row, index) => {
      const commodityName = commodities[row[2]] || row[2] || '-';
      const varietyName = getVarietyName(row[3]);
      const gradeName = grades[row[4]] || row[4] || '-';
      const dateDisplay = formatDate(row[0]);
      html += `<div class="card">
        <div class="card-header"><p class="card-title">${commodityName}</p></div>
        <div class="card-grid">
          ${row[3] ? `<div>वैरायटी: ${varietyName}</div>` : ''}
          ${row[4] ? `<div>ग्रेड: ${gradeName}</div>` : ''}
        </div>
      </div>`;
    });
    el.cardsContainer.innerHTML = html;
    el.cardsContainer.style.display = 'grid';
    el.mandiTable.style.display = 'none';
  }

  function updateStats() {
    el.mandiName.textContent = currentMandiName;
    el.stateName.textContent = currentStateName;
    el.distName.textContent = currentDistName;
    el.totalRecords.textContent = mandiData.length;
  }

  // --------- MAIN LOAD ----------
  async function loadMandiBhav(mandiInput) {
    currentMandiId = mandiInput;
    if (!currentMandiId || String(currentMandiId).length !== 8) { alert('भाव लोड करने असमर्थ'); return; }
    showLoading(true);
    try {
      const { pricesUrl, stateInfo, distInfo } = await getPricesUrl(currentMandiId);
      currentMandiName = mandiNames[currentMandiId]?.[0] || currentMandiId;
      currentStateName = stateInfo?.[0] || '-';
      currentDistName = distInfo?.[0] || '-';
      const districtKey = currentMandiId.slice(0, 5);
      pricesData = await cachedPricesJson(pricesUrl, districtKey);

      const dateSet = new Set();
      (pricesData.rows || []).forEach(row => { if (row[1] === currentMandiId && row[0]) dateSet.add(row[0]); });
      allDates = Array.from(dateSet).sort().reverse();
      currentDate = allDates[0] || '';
      mandiData = (pricesData.rows || []).filter(row => row[1] === currentMandiId && row[0] === currentDate);

      detectVisibleColumns();
      renderContent(mandiData);
      updateStats();
    } finally { showLoading(false); }
  }

  async function init() {
    if (__inited) return;
    __inited = true;

    el.loadingMsg = mustGet('loadingMsg');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiName = mustGet('mandiName');
    el.stateName = mustGet('stateName');
    el.distName = mustGet('distName');
    el.totalRecords = mustGet('totalRecords');

    await syncManifestAndInvalidate();
    await loadCommodities();
    await loadStates();
  }

  async function mandibhavloadfresh() {
    const mf = window.MBK_MANIFEST;
    if (mf?.force_reload_on_button) {
      resetAllMbkCache();
      await init();
      if (currentMandiId) await loadMandiBhav(currentMandiId);
    }
  }

  window.MBK = { init, loadMandiBhav, mandibhavloadfresh };
})();

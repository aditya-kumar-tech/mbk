(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';

  // cache keys
  const MAPS_VER_KEY = 'mbk:maps_ver';
  const MAP_PREFIX = 'mbk:map:';
  const PRICES_PREFIX = 'mbk:prices:';
  const PRICES_TTL_MS = 5 * 60 * 1000; // ✅ strict 5 minutes

  // data stores
  let commodities = {};
  let varieties = {};
  let varietiesEng = {};
  let grades = {};
  let mandiData = [];
  let states = {};
  let allDates = [];
  let mandiNames = {};
  let currentMandiId = '';
  let currentMandiName = '';
  let currentStateName = '';
  let currentDistName = '';
  let currentDate = '';
  let pricesData = null;
  let viewMode = 'table';
  let visibleColumns = [];

  // DOM refs
  const el = {};
  let __inited = false;

  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id} in Blogger HTML`);
    return node;
  }

  // ✅ Production: debug disabled (no debug panel needed)
  function debugLog() {}

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
    return (v === null || v === undefined || v === '' || v === 0) ? '-' : v;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  }

  function getVarietyName(varietyId) {
    if (!varietyId) return '-';
    const vData = varietiesEng[varietyId];
    return vData?.n || varieties[varietyId] || varietyId || '-';
  }

  // ---------- Manifest + cache helpers ----------
  async function loadManifest() {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' }); // keep fresh [web:580]
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

  async function syncManifestAndInvalidate() {
    try {
      const mf = await loadManifest();
      const newMapsVer = String(mf.maps_ver || '');
      const oldMapsVer = sessionStorage.getItem(MAPS_VER_KEY) || '';
      if (newMapsVer && newMapsVer !== oldMapsVer) {
        clearByPrefix(MAP_PREFIX); // clear only mapping cache
        sessionStorage.setItem(MAPS_VER_KEY, newMapsVer);
      }
    } catch {
      // manifest fail => ignore
    }
  }

  async function cachedMapJson(url) {
    const key = MAP_PREFIX + url;

    const raw = sessionStorage.getItem(key);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }

    const res = await fetch(url);
    const data = await res.json();

    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
    return data;
  }

  async function cachedPricesJson(pricesUrl, districtKey) {
    const key = PRICES_PREFIX + districtKey;
    const now = Date.now();

    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached?.data && cached?.t && (now - cached.t) < PRICES_TTL_MS) return cached.data;
    } catch {}

    const res = await fetch(pricesUrl);
    const data = await res.json();

    try { sessionStorage.setItem(key, JSON.stringify({ t: now, data })); } catch {}
    return data;
  }

  // ---------- Loads ----------
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

    if (Object.keys(mandiNames).length === 0) {
      await loadMandiNamesForState(stateSlug);
    }

    const distMappingUrl = `${BASE_URL}dists/${stateSlug}.json`;
    const distData = await cachedMapJson(distMappingUrl);
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[1] || distId;

    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
    return { pricesUrl, stateInfo, distInfo, distSlug };
  }

  function detectVisibleColumns() {
    visibleColumns = [];
    const allCols = [
      // ✅ single mandi mode => no "मंडी" column needed
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
    if (viewMode === 'table') renderTable(data);
    else renderCards(data);
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

        if ((col.idx === 5 || col.idx === 6 || col.idx === 7) && cellValue !== '-') td.classList.add('price');
        if (col.idx === 2) td.classList.add('commodity');
      });
    });

    el.mandiTable.classList.add('show');
    el.mandiTable.style.display = 'table';
    el.cardsContainer.classList.remove('show');
    el.cardsContainer.style.display = 'none';
  }

  function renderCards(data) {
    let html = '';
    data.slice(0, 200).forEach((row, index) => {
      const commodityName = commodities[row[2]] || row[2] || '-';
      const varietyName = getVarietyName(row[3]);
      const gradeName = grades[row[4]] || row[4] || '-';
      const dateDisplay = formatDate(row[0]);

      html += `
        <div class="card">
          <div class="card-header">
            <div>
              <p class="card-title">${commodityName}</p>
              <div class="card-serial">#${index + 1}</div>
            </div>
            <div class="card-date-box">
              <div class="card-date-label">तारीख</div>
              <div class="card-date">${dateDisplay}</div>
            </div>
          </div>

          <div class="card-grid">
            ${row[3] ? `<div class="card-field"><div class="card-label">वैरायटी</div><div class="card-value">${varietyName}</div></div>` : ''}
            ${row[4] ? `<div class="card-field"><div class="card-label">ग्रेड</div><div class="card-value">${gradeName}</div></div>` : ''}
          </div>

          ${(row[5] && row[5] !== 0) || (row[6] && row[6] !== 0) || (row[7] && row[7] !== 0) ? `
            <div class="card-prices">
              <div class="card-prices-label">💰 मूल्य विवरण</div>
              <div class="card-prices-grid">
                ${row[5] && row[5] !== 0 ? `<div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${row[5]}</div></div>` : ''}
                ${row[6] && row[6] !== 0 ? `<div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${row[6]}</div></div>` : ''}
                ${row[7] && row[7] !== 0 ? `<div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${row[7]}</div></div>` : ''}
              </div>
            </div>
          ` : ''}

          <div class="card-grid">
            ${isValid(row[8]) ? `<div class="card-field"><div class="card-label">आवक (क्विंटल)</div><div class="card-value">${row[8]}</div></div>` : ''}
            ${isValid(row[9]) ? `<div class="card-field"><div class="card-label">आवक (बोरी)</div><div class="card-value">${row[9]}</div></div>` : ''}
          </div>
        </div>
      `;
    });

    el.cardsContainer.innerHTML = html;
    el.cardsContainer.classList.add('show');
    el.cardsContainer.style.display = 'grid';
    el.mandiTable.classList.remove('show');
    el.mandiTable.style.display = 'none';
  }

  function updateStats() {
    const formattedDate = formatDate(el.dateSelect.value || currentDate);
    el.mandiName.textContent = currentMandiName;
    el.stateName.textContent = currentStateName;
    el.distName.textContent = currentDistName;

    el.totalRecords.textContent = mandiData.length;
    const uniqueCommodities = new Set(mandiData.map(row => row[2]));
    el.uniqueCommodities.textContent = uniqueCommodities.size;
    el.selectedDate.textContent = formattedDate;

    el.stats.style.display = 'flex';
    el.mandiInfo.style.display = 'block';
    el.searchInput.style.display = 'block';
    if (el.watermark) el.watermark.style.display = 'block';
  }

  async function loadMandiBhav(mandiInput) {
    currentMandiId = mandiInput;

    if (!currentMandiId || String(currentMandiId).length !== 8) {
      alert('भाव लोड करने असमर्थ');
      return;
    }

    showLoading(true);

    try {
      const { pricesUrl, stateInfo, distInfo, distSlug } = await getPricesUrl(currentMandiId);

      currentMandiName = mandiNames[currentMandiId]?.[0] || currentMandiId;
      currentStateName = stateInfo?.[0] || '-';
      currentDistName = distInfo?.[0] || distSlug;

      el.pageTitle.textContent = `🌱 ${currentMandiName}`;

      // ✅ prices cache: strict 5 min
      const districtKey = currentMandiId.slice(0, 5);
      pricesData = await cachedPricesJson(pricesUrl, districtKey);

      // ✅ build dates from pricesData (no extra fetch)
      const dateSet = new Set();
      (pricesData.rows || []).forEach(row => {
        if (row[1] === currentMandiId && row[0]) dateSet.add(row[0]);
      });
      allDates = Array.from(dateSet).sort().reverse();

      el.dateSelect.innerHTML = '';
      allDates.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = `📅 ${formatDate(d)}`;
        el.dateSelect.appendChild(option);
      });

      if (!allDates.length) return;

      const selectedDate = el.dateSelect.value || allDates[0];
      currentDate = selectedDate;

      // ✅ SINGLE MANDI ONLY filter
      mandiData = (pricesData.rows || []).filter(row =>
        row[1] === currentMandiId && row[0] === selectedDate
      );

      if (!mandiData.length) return;

      detectVisibleColumns();
      if (el.pageSubtitle) el.pageSubtitle.textContent = `जिला ${currentDistName} | ${currentStateName} | ${formatDate(selectedDate)}`;

      renderContent(mandiData);
      updateStats();
    } finally {
      showLoading(false);
    }
  }

  function toggleViewMode() {
    viewMode = viewMode === 'table' ? 'card' : 'table';
    el.toggleBtn.textContent = viewMode === 'table' ? '🃏 कार्ड' : '📊 टेबल';
    if (mandiData.length > 0) renderContent(mandiData);
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
    // ✅ debugPanel removed from required list
    el.mandiInfo = mustGet('mandiInfo');
    el.mandiName = mustGet('mandiName');
    el.distName = mustGet('distName');
    el.stateName = mustGet('stateName');
    el.searchInput = mustGet('searchInput');
    el.pageTitle = mustGet('pageTitle');
    el.pageSubtitle = document.getElementById('pageSubtitle');
    el.loadingMsg = mustGet('loadingMsg');
    el.dataArea = mustGet('dataArea');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');
    el.watermark = document.getElementById('watermark');

    el.dateSelect.addEventListener('change', function () {
      if (!this.value) return;
      currentDate = this.value;

      showLoading(true);
      setTimeout(() => {
        try {
          mandiData = (pricesData.rows || []).filter(row =>
            row[1] === currentMandiId && row[0] === currentDate
          );
          if (mandiData.length > 0) {
            detectVisibleColumns();
            if (el.pageSubtitle) el.pageSubtitle.textContent = `जिला ${currentDistName} | ${currentStateName} | ${formatDate(currentDate)}`;
            renderContent(mandiData);
            updateStats();
          }
        } finally {
          showLoading(false);
        }
      }, 60);
    });

    el.searchInput.addEventListener('input', function (e) {
      const query = e.target.value.toLowerCase();
      const filtered = mandiData.filter(row => {
        const c = (commodities[row[2]] || row[2] || '').toLowerCase();
        const v = (varieties[row[3]] || row[3] || '').toLowerCase();
        const g = (grades[row[4]] || row[4] || '').toLowerCase();
        return c.includes(query) || v.includes(query) || g.includes(query);
      });
      el.totalRecords.textContent = filtered.length;
      renderContent(filtered);
    });

    // ✅ manifest sync first, then load mapping jsons
    await syncManifestAndInvalidate();
    await loadCommodities();
    await loadStates();
  }

  window.MBK = { init, loadMandiBhav, toggleViewMode };
})();
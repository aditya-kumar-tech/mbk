(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';

  // cache keys
  const MAPS_VER_KEY = 'mbk:maps_ver';
  const MAP_PREFIX = 'mbk:map:';      // mapping json cache
  const PRICES_PREFIX = 'mbk:prices:'; // prices cache
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
  let isDistrictView = false;
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

  function debugLog(message, type = 'info') {
    if (!el.debugPanel) return;
    const div = document.createElement('div');
    div.style.padding = '6px 8px';
    div.style.margin = '2px 0';
    div.style.background = type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eef';
    div.style.borderLeft = `4px solid ${type === 'error' ? '#f44' : type === 'success' ? '#4f4' : '#44f'}`;
    div.style.fontSize = '12px';
    div.innerHTML = `<strong>${new Date().toLocaleTimeString('hi-IN')}:</strong> ${message}`;
    el.debugPanel.appendChild(div);
    el.debugPanel.scrollTop = el.debugPanel.scrollHeight;
  }

  function showLoading(show) {
    const loader = document.getElementById('loadingMsg');
    const app = document.getElementById('mbkApp');

    if (loader) loader.style.display = show ? 'block' : 'none';
    if (app) app.style.display = show ? 'none' : 'block';
  }

  function isValid(v){
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
    // always try to get fresh manifest [1]
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

  async function syncManifestAndInvalidate() {
    try {
      const mf = await loadManifest();
      const newMapsVer = String(mf.maps_ver || '');
      const oldMapsVer = sessionStorage.getItem(MAPS_VER_KEY) || '';

      if (newMapsVer && newMapsVer !== oldMapsVer) {
        clearByPrefix(MAP_PREFIX);
        sessionStorage.setItem(MAPS_VER_KEY, newMapsVer);
        debugLog(`🔁 Maps updated: ${oldMapsVer} → ${newMapsVer}`, 'info');
      } else {
        debugLog(`✅ Maps cache ok (ver: ${oldMapsVer || newMapsVer || '-'})`, 'success');
      }
    } catch (e) {
      // manifest fail => do nothing, app still works
      debugLog(`⚠️ Manifest load failed: ${e.message}`, 'info');
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
      if (cached?.data && cached?.t && (now - cached.t) < PRICES_TTL_MS) {
        debugLog(`💾 Prices cache (≤5 min)`, 'success');
        return cached.data;
      }
    } catch {}

    const res = await fetch(pricesUrl);
    const data = await res.json();

    try { sessionStorage.setItem(key, JSON.stringify({ t: now, data })); } catch {}
    debugLog(`📡 Prices fetched`, 'success');
    return data;
  }

  // ---------- Loads (updated to use cachedMapJson) ----------
  async function loadCommodities() {
    try {
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
      debugLog('✅ Commodity/Variety/Grade mapping ready', 'success');
    } catch (e) {
      debugLog('⚠️ Mapping files optional', 'info');
    }
  }

  async function loadStates() {
    try {
      states = await cachedMapJson(`${BASE_URL}states.json`);
      debugLog('✅ States लोड', 'success');
    } catch (e) {
      debugLog('States error', 'error');
    }
  }

  async function loadMandiNamesForState(stateSlug) {
    try {
      const data = await cachedMapJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`);
      mandiNames = data.data || {};
      debugLog(`✅ ${stateSlug} के लिए ${Object.keys(mandiNames).length} मंडी names लोड`, 'success');
    } catch (e) {
      debugLog(`⚠️ Mandi names नहीं मिले: ${stateSlug}`, 'info');
    }
  }

  async function getPricesUrl(mandiId) {
    const stateId = mandiId.slice(0, 2);
    const distId = mandiId.slice(0, 5);

    const stateInfo = states?.data?.[stateId];
    const stateSlug = stateInfo?.[3];

    if (Object.keys(mandiNames).length === 0) {
      await loadMandiNamesForState(stateSlug);
    }

    const distMappingUrl = `${BASE_URL}dists/${stateSlug}.json`;
    const distData = await cachedMapJson(distMappingUrl);
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[3] || distId;

    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
    return { pricesUrl, stateSlug, distSlug, stateInfo, distInfo };
  }

  async function loadAvailableDates(pricesUrl, mandiId) {
    try {
      // Dates निकालने के लिए pricesUrl JSON चाहिए; TTL handled by cachedPricesJson in loadMandiBhav
      // यहाँ direct fetch OK है, क्योंकि loadMandiBhav में वही pricesData cache करेगा
      const response = await fetch(pricesUrl);
      const data = await response.json();

      const dateSet = new Set();
      (data.rows || []).forEach(row => {
        if (row[3] === mandiId && row) dateSet.add(row);
      });

      allDates = Array.from(dateSet).sort().reverse();

      const previousValue = el.dateSelect.value;
      el.dateSelect.innerHTML = '';

      allDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = `📅 ${formatDate(date)}`;
        el.dateSelect.appendChild(option);
      });

      if (allDates.length > 0) {
        el.dateSelect.value = allDates.includes(previousValue) ? previousValue : allDates;
        currentDate = el.dateSelect.value;
        el.dateSelect.style.display = 'inline-block';
      }

      debugLog(`✅ ${allDates.length} तारीखें मिलीं`, 'success');
      return currentDate;
    } catch (e) {
      debugLog(`⚠️ Dates error: ${e.message}`, 'error');
      return null;
    }
  }

  function detectVisibleColumns() {
    visibleColumns = [];
    const allCols = [
      { idx: 10, label: 'मंडी' },
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
      const hasData = mandiData.some(row => {
        if (col.idx === 10) return isValid(row[3]) || isValid(row);
        return isValid(row[col.idx]);
      });
      if (hasData) visibleColumns.push(col);
    });
  }

  function renderContent(data, showMarket) {
    if (viewMode === 'table') renderTable(data, showMarket);
    else renderCards(data, showMarket);
  }

  function renderTable(data, showMarket) {
    const tbody = el.tableBody;
    const theadRow = el.mandiTable.querySelector('thead tr');

    tbody.innerHTML = '';
    theadRow.innerHTML = '<th>क्रम</th>';

    visibleColumns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      if (col.idx === 10) {
        th.id = 'thMarket';
        th.style.display = showMarket ? '' : 'none';
      }
      theadRow.appendChild(th);
    });

    data.slice(0, 200).forEach((row, index) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = index + 1;

      visibleColumns.forEach(col => {
        let cellValue = safeVal(row[col.idx]);

        if (col.idx === 10) {
          const mandiId = row[3];
          cellValue = (mandiNames?.[mandiId]?.) || row || mandiId || '-';
        } else if (col.idx === 2) cellValue = commodities[row] || row || '-';
        else if (col.idx === 3) cellValue = getVarietyName(row);
        else if (col.idx === 4) cellValue = grades[row] || row || '-';
        else if (col.idx === 0) cellValue = formatDate(row);

        const td = tr.insertCell();
        td.textContent = cellValue;

        if (col.idx === 10 && !showMarket) td.style.display = 'none';
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
      const commodityName = commodities[row] || row || '-';
      const varietyName = getVarietyName(row);
      const gradeName = grades[row] || row || '-';
      const dateDisplay = formatDate(row);

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
            ${row ? `<div class="card-field"><div class="card-label">वैरायटी</div><div class="card-value">${varietyName}</div></div>` : ''}
            ${row ? `<div class="card-field"><div class="card-label">ग्रेड</div><div class="card-value">${gradeName}</div></div>` : ''}
          </div>

          ${(row && row !== 0) || (row && row !== 0) || (row && row !== 0) ? `
            <div class="card-prices">
              <div class="card-prices-label">💰 मूल्य विवरण</div>
              <div class="card-prices-grid">
                ${row && row !== 0 ? `<div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${row[4]}</div></div>` : ''}
                ${row && row !== 0 ? `<div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${row[5]}</div></div>` : ''}
                ${row && row !== 0 ? `<div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${row[6]}</div></div>` : ''}
              </div>
            </div>
          ` : ''}

          <div class="card-grid">
            ${isValid(row) ? `<div class="card-field"><div class="card-label">आवक (क्विंटल)</div><div class="card-value">${row[8]}</div></div>` : ''}
            ${isValid(row) ? `<div class="card-field"><div class="card-label">आवक (बोरी)</div><div class="card-value">${row[9]}</div></div>` : ''}
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
    el.mandiName.textContent = isDistrictView ? `📊 पूरा जिला` : currentMandiName;
    el.stateName.textContent = currentStateName;
    el.distName.textContent = currentDistName;

    el.totalRecords.textContent = mandiData.length;
    const uniqueCommodities = new Set(mandiData.map(row => row));
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

    debugLog(`🚀 लोड: ${currentMandiId}`);
    showLoading(true);
    isDistrictView = false;

    try {
      const { pricesUrl, stateInfo, distInfo, distSlug } = await getPricesUrl(currentMandiId);

      currentMandiName = mandiNames[currentMandiId]?. || currentMandiId;
      currentStateName = stateInfo?. || '-';
      currentDistName = distInfo?. || distSlug;

      el.pageTitle.textContent = `🌱 ${currentMandiName}`;

      const latestDate = await loadAvailableDates(pricesUrl, currentMandiId);

      // ✅ prices cache: strict 5 minutes
      const districtKey = currentMandiId.slice(0, 5);
      pricesData = await cachedPricesJson(pricesUrl, districtKey);

      const selectedDate = el.dateSelect.value || latestDate || currentDate;
      currentDate = selectedDate;

      mandiData = (pricesData.rows || []).filter(row =>
        row[3] === currentMandiId && row === selectedDate
      );

      if (mandiData.length === 0) {
        debugLog('⚠️ इस मंडी का डेटा नहीं मिला', 'error');
        return;
      }

      detectVisibleColumns();

      const formattedDate = formatDate(selectedDate);
      el.pageTitle.textContent = `🌱 ${currentMandiName} मंडी`;
      if (el.pageSubtitle) el.pageSubtitle.textContent = `जिला ${currentDistName} | ${currentStateName} | ${formattedDate}`;

      renderContent(mandiData, false);
      updateStats();
      debugLog(`✅ ${mandiData.length} भाव लोड`, 'success');
    } catch (e) {
      debugLog(`❌ ${e.message}`, 'error');
    } finally {
      showLoading(false);
    }
  }

  function toggleViewMode() {
    viewMode = viewMode === 'table' ? 'card' : 'table';
    el.toggleBtn.textContent = viewMode === 'table' ? '🃏 कार्ड' : '📊 टेबल';
    if (mandiData.length > 0) renderContent(mandiData, isDistrictView);
  }

  async function init() {
    if (__inited) return;
    __inited = true;

    // cache DOM refs
    el.dateSelect = mustGet('dateSelect');
    el.toggleBtn = mustGet('toggleBtn');
    el.stats = mustGet('stats');
    el.totalRecords = mustGet('totalRecords');
    el.uniqueCommodities = mustGet('uniqueCommodities');
    el.selectedDate = mustGet('selectedDate');
    el.debugPanel = mustGet('debugPanel');
    el.mandiInfo = mustGet('mandiInfo');
    el.mandiName = mustGet('mandiName');
    el.distName = mustGet('distName');
    el.stateName = mustGet('stateName');
    el.searchInput = mustGet('searchInput');
    el.pageTitle = mustGet('pageTitle');
    // subtitle & watermark optional (don’t hard fail)
    el.pageSubtitle = document.getElementById('pageSubtitle');
    el.loadingMsg = mustGet('loadingMsg');
    el.dataArea = mustGet('dataArea');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');
    el.watermark = document.getElementById('watermark');

    // bind events (once)
    el.dateSelect.addEventListener('change', function () {
      if (!this.value) return;
      currentDate = this.value;
      showLoading(true);

      setTimeout(() => {
        try {
          if (!isDistrictView) {
            mandiData = (pricesData.rows || []).filter(row =>
              row[3] === currentMandiId && row === currentDate
            );
          } else {
            mandiData = (pricesData.rows || []).filter(row => row === currentDate);
          }

          if (mandiData.length > 0) {
            detectVisibleColumns();
            if (el.pageSubtitle) el.pageSubtitle.textContent = `${currentStateName} | ${currentDistName} | ${formatDate(currentDate)}`;
            renderContent(mandiData, isDistrictView);
            updateStats();
            debugLog(`✅ अपडेट`, 'success');
          }
        } catch (e) {
          debugLog(`❌ Error: ${e.message}`, 'error');
        } finally {
          showLoading(false);
        }
      }, 100);
    });

    el.searchInput.addEventListener('input', function (e) {
      const query = e.target.value.toLowerCase();
      const filtered = mandiData.filter(row => {
        const c = (commodities[row] || row || '').toLowerCase();
        const v = (varieties[row] || row || '').toLowerCase();
        const g = (grades[row] || row || '').toLowerCase();
        return c.includes(query) || v.includes(query) || g.includes(query);
      });
      el.totalRecords.textContent = filtered.length;
      renderContent(filtered, isDistrictView);
    });

    debugLog('🌐 Ready!', 'success');

    // ✅ IMPORTANT: manifest sync first (clears mapping cache when you bump maps_ver)
    await syncManifestAndInvalidate();

    await loadCommodities();
    await loadStates();
  }

  // expose API for loader
  window.MBK = { init, loadMandiBhav, toggleViewMode };
})();
(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  
  const PRICES_TTL_MS = 5 * 60 * 1000; // 5 minutes strict TTL
  
  // cache keys - using localStorage for prices, sessionStorage for maps
  const MAP_PREFIX = 'mbk:map:';
  const PRICES_PREFIX = 'mbk:prices:';
  const MAPS_VER_KEY = 'mbk:maps_ver';

  // data stores
  let commodities = {}, varieties = {}, varietiesEng = {}, grades = {};
  let states = {}, mandiNames = {}, pricesData = null;
  let mandiData = [], allDates = [], currentMandiId = '', currentDate = '';
  let currentMandiName = '', currentStateName = '', currentDistName = '';
  let viewMode = 'table', visibleColumns = [];
  const el = {};
  let __inited = false;

  // DOM helpers
  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing #${id}`);
    return node;
  }

  function showLoading(show) {
    const loader = document.getElementById('loadingMsg');
    if (loader) loader.style.display = show ? 'block' : 'none';
  }

  function isValid(v) { return !(v === null || v === undefined || v === '' || v === 0 || v === '-'); }
  function safeVal(v) { return (v === null || v === undefined || v === '' || v === 0) ? '-' : v; }
  function formatDate(d) { 
    if (!d) return '-'; 
    const p = d.split('-'); 
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : d; 
  }
  function getVarietyName(id) { 
    return varietiesEng[id]?.n || varieties[id] || id || '-'; 
  }

  // ========== CACHE HELPERS ==========
  function clearByPrefix(prefix) {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
    keys.forEach(k => sessionStorage.removeItem(k));
  }

  async function cachedMapJson(url) {
    const key = MAP_PREFIX + url;
    const raw = sessionStorage.getItem(key);
    if (raw) try { return JSON.parse(raw); } catch {}

    const res = await fetch(url);
    const data = await res.json();
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
    return data;
  }

  async function cachedPricesJson(pricesUrl, districtKey, forceReload = false) {
    const key = PRICES_PREFIX + districtKey;
    const now = Date.now();

    // Force reload bypasses cache
    if (!forceReload) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached?.data?.rows && cached?.t && (now - cached.t) < PRICES_TTL_MS) {
          return cached.data;
        }
      } catch {}
    }

    // Fresh fetch + cache (localStorage for persistence)
    try {
      const res = await fetch(pricesUrl);
      const data = await res.json();
      localStorage.setItem(key, JSON.stringify({ t: now, data }));
      return data;
    } catch (error) {
      console.error('Price fetch failed:', error);
      // Return stale cache if available
      try {
        return JSON.parse(localStorage.getItem(key) || 'null')?.data || null;
      } catch {
        throw error;
      }
    }
  }

  // ========== DATA LOADING ==========
  async function loadCommodities() {
    [commodities, varieties, varietiesEng, grades] = await Promise.all([
      cachedMapJson(`${BASE_URL}commodities.json`),
      cachedMapJson(`${BASE_URL}varieties.json`),
      cachedMapJson(`${BASE_URL}varietiesEng.json`),
      cachedMapJson(`${BASE_URL}grades.json`)
    ]);
  }

  async function loadStates() {
    states = await cachedMapJson(`${BASE_URL}states.json`) || { data: {} };
  }

  async function loadMandiNamesForState(stateSlug) {
    const data = await cachedMapJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`);
    mandiNames = data?.data || {};
  }

  async function getPricesUrl(mandiId) {
    const stateId = mandiId.slice(0, 2);
    const distId = mandiId.slice(0, 5);
    
    const stateInfo = states?.data?.[stateId];
    const stateSlug = stateInfo?.[1];
    if (!stateSlug) throw new Error('State mapping missing');

    if (Object.keys(mandiNames).length === 0) {
      await loadMandiNamesForState(stateSlug);
    }

    const distMappingUrl = `${BASE_URL}dists/${stateSlug}.json`;
    const distData = await cachedMapJson(distMappingUrl);
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[1] || distId;

    return {
      pricesUrl: `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`,
      stateInfo, distInfo, distSlug
    };
  }

  // ========== RENDERING ==========
  function detectVisibleColumns() {
    visibleColumns = [];
    const allCols = [
      { idx: 2, label: 'कमोडिटी' }, { idx: 3, label: 'वैरायटी' },
      { idx: 4, label: 'ग्रेड' }, { idx: 5, label: 'न्यूनतम ₹' },
      { idx: 6, label: 'अधिकतम ₹' }, { idx: 7, label: 'मॉडल ₹' },
      { idx: 8, label: 'आवक (क्विंटल)' }, { idx: 9, label: 'आवक (बोरी)' },
      { idx: 0, label: 'तारीख' }
    ];
    allCols.forEach(col => {
      if (mandiData.some(r => isValid(r[col.idx]))) visibleColumns.push(col);
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

    data.slice(0, 200).forEach((row, i) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = i + 1;
      visibleColumns.forEach(col => {
        let val = safeVal(row[col.idx]);
        if (col.idx === 2) val = commodities[row[2]] || row[2] || '-';
        else if (col.idx === 3) val = getVarietyName(row[3]);
        else if (col.idx === 4) val = grades[row[4]] || row[4] || '-';
        else if (col.idx === 0) val = formatDate(row[0]);
        
        const td = tr.insertCell();
        td.textContent = val;
        if ([5,6,7].includes(col.idx) && val !== '-') td.classList.add('price');
        if (col.idx === 2) td.classList.add('commodity');
      });
    });

    el.mandiTable.classList.add('show');
    el.cardsContainer.classList.remove('show');
  }

  function renderCards(data) {
    let html = '';
    data.slice(0, 200).forEach((row, i) => {
      const commodity = commodities[row[2]] || row[2] || '-';
      const variety = getVarietyName(row[3]);
      const grade = grades[row[4]] || row[4] || '-';
      html += `
        <div class="card">
          <div class="card-header">
            <div><p class="card-title">${commodity}</p><div class="card-serial">#${i+1}</div></div>
            <div class="card-date-box">
              <div class="card-date-label">तारीख</div><div class="card-date">${formatDate(row[0])}</div>
            </div>
          </div>
          <div class="card-grid">
            ${row[3] ? `<div class="card-field"><div class="card-label">वैरायटी</div><div class="card-value">${variety}</div></div>` : ''}
            ${row[4] ? `<div class="card-field"><div class="card-label">ग्रेड</div><div class="card-value">${grade}</div></div>` : ''}
          </div>
          ${(row[5]||row[6]||row[7]) ? `
            <div class="card-prices">
              <div class="card-prices-label">💰 मूल्य विवरण</div>
              <div class="card-prices-grid">
                ${row[5] ? `<div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${row[5]}</div></div>` : ''}
                ${row[6] ? `<div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${row[6]}</div></div>` : ''}
                ${row[7] ? `<div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${row[7]}</div></div>` : ''}
              </div>
            </div>` : ''}
          <div class="card-grid">
            ${isValid(row[8]) ? `<div class="card-field"><div class="card-label">आवक (क्विंटल)</div><div class="card-value">${row[8]}</div></div>` : ''}
            ${isValid(row[9]) ? `<div class="card-field"><div class="card-label">आवक (बोरी)</div><div class="card-value">${row[9]}</div></div>` : ''}
          </div>
        </div>`;
    });
    
    el.cardsContainer.innerHTML = html;
    el.cardsContainer.classList.add('show');
    el.mandiTable.classList.remove('show');
  }

  function renderContent(data) {
    viewMode === 'table' ? renderTable(data) : renderCards(data);
  }

  function updateUI() {
    el.pageTitle.textContent = `🌱 ${currentMandiName} मंडी का भाव`;
    if (el.pageSubtitle) el.pageSubtitle.textContent = `जिला ${currentDistName} | ${currentStateName} | ${formatDate(currentDate)}`;
    
    el.mandiName.textContent = currentMandiName;
    el.stateName.textContent = currentStateName;
    el.distName.textContent = currentDistName;
    
    el.totalRecords.textContent = mandiData.length;
    el.uniqueCommodities.textContent = new Set(mandiData.map(r => r[2])).size;
    el.selectedDate.textContent = formatDate(currentDate);
    
    el.stats.style.display = 'flex';
    el.mandiInfo.style.display = 'block';
    el.searchInput.style.display = 'block';
    el.watermark.style.display = 'block';
  }

  // ========== PUBLIC API ==========
  window.MBK.loadMandiBhavImpl = async function(mandiId, forcePriceReload = false) {
    currentMandiId = mandiId;
    if (String(currentMandiId).length !== 8) {
      alert('अमान्य मंडी कोड');
      return;
    }

    showLoading(true);
    try {
      const { pricesUrl, stateInfo, distInfo, distSlug } = await getPricesUrl(currentMandiId);
      
      currentMandiName = mandiNames[currentMandiId]?.[0] || currentMandiId;
      currentStateName = stateInfo?.[0] || '-';
      currentDistName = distInfo?.[0] || distSlug;

      // ✅ 5-MINUTE PRICES + FORCE RELOAD SUPPORT
      const districtKey = currentMandiId.slice(0, 5);
      pricesData = await cachedPricesJson(pricesUrl, districtKey, forcePriceReload);

      const dateSet = new Set();
      (pricesData.rows || []).forEach(r => {
        if (r[1] === currentMandiId && r[0]) dateSet.add(r[0]);
      });
      allDates = Array.from(dateSet).sort().reverse();

      el.dateSelect.innerHTML = '';
      allDates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = `📅 ${formatDate(d)}`;
        el.dateSelect.appendChild(opt);
      });

      if (!allDates.length) return;
      
      currentDate = el.dateSelect.value || allDates[0];
      mandiData = (pricesData.rows || []).filter(r => 
        r[1] === currentMandiId && r[0] === currentDate
      );

      if (mandiData.length) {
        detectVisibleColumns();
        renderContent(mandiData);
        updateUI();
      }
    } finally {
      showLoading(false);
    }
  };

  window.MBK.toggleViewMode = function() {
    viewMode = viewMode === 'table' ? 'card' : 'table';
    el.toggleBtn.textContent = viewMode === 'table' ? '🃏 कार्ड' : '📊 टेबल';
    if (mandiData.length) renderContent(mandiData);
  };

  window.MBK.init = async function() {
    if (__inited) return; __inited = true;

    // Cache all DOM elements
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
    el.pageSubtitle = document.getElementById('pageSubtitle');
    el.dataArea = mustGet('dataArea');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');
    el.watermark = document.getElementById('watermark');
    el.loadingMsg = mustGet('loadingMsg');

    // Event listeners
    el.dateSelect.addEventListener('change', function() {
      if (!this.value) return;
      currentDate = this.value;
      showLoading(true);
      setTimeout(() => {
        mandiData = (pricesData.rows || []).filter(r => 
          r[1] === currentMandiId && r[0] === currentDate
        );
        if (mandiData.length) {
          detectVisibleColumns();
          renderContent(mandiData);
          updateUI();
        }
        showLoading(false);
      }, 100);
    });

    el.searchInput.addEventListener('input', function(e) {
      const q = e.target.value.toLowerCase();
      const filtered = mandiData.filter(row => {
        const c = (commodities[row[2]] || '').toLowerCase();
        const v = getVarietyName(row[3]).toLowerCase();
        const g = (grades[row[4]] || '').toLowerCase();
        return c.includes(q) || v.includes(q) || g.includes(q);
      });
      el.totalRecords.textContent = filtered.length;
      renderContent(filtered);
    });

    el.toggleBtn.addEventListener('click', window.MBK.toggleViewMode);

    // Load mapping data
    await loadCommodities();
    await loadStates();
  };

  // Global namespace
  window.MBK = window.MBK || {};
  Object.assign(window.MBK, {
    init: window.MBK.init,
    loadMandiBhavImpl: window.MBK.loadMandiBhavImpl,
    toggleViewMode: window.MBK.toggleViewMode
  });
})();

(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const PRICES_PREFIX = 'mbk:prices:';
  
  // Data stores
  let commodities = {}, varieties = {}, varietiesEng = {}, grades = {}, states = {};
  let mandiData = [], allDates = [], mandiNames = {};
  let currentMandiId = '', currentMandiName = '', currentStateName = '', currentDistName = '', currentDate = '';
  let pricesData = null, viewMode = 'table', visibleColumns = [];
  let __inited = false;

  const el = {};

  // --- Helpers ---
  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id}`);
    return node;
  }

  function safeVal(v) { return (v === null || v === undefined || v === '' || v === 0) ? '-' : v; }
  function isValid(v) { return !(v === null || v === undefined || v === '' || v === 0 || v === '-'); }
  
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  }

  // --- HTML Injection ---
  function injectUI() {
    const root = document.getElementById('mbkRoot');
    if (!root) return;
    root.innerHTML = `
      <div class="stats" id="stats" style="display:none;">
        <div class="stat-card"><div class="stat-number" id="totalRecords">-</div><div class="stat-label">कुल भाव</div></div>
        <div class="stat-card"><div class="stat-number" id="uniqueCommodities">-</div><div class="stat-label">कमोडिटी</div></div>
        <div class="stat-card"><div class="stat-number" id="selectedDate">-</div><div class="stat-label">तारीख</div></div>
      </div>
      <div class="input-row">
        <select id="dateSelect"></select>
        <button id="toggleBtn">🃏 कार्ड</button>
      </div>
      <div class="mandi-info" id="mandiInfo" style="display:none;">
        <strong>📍 मंडी:</strong> <span id="mandiName">-</span> | <strong>🌆 जिला:</strong> <span id="distName">-</span>
      </div>
      <input class="search-box" id="searchInput" placeholder="🔍 गेहूं, प्याज, टमाटर..." type="text" style="display:none;" />
      <div class="header">
        <h1 id="pageTitle">मंडी भाव</h1>
        <p id="pageSubtitle">लोड हो रहा है...</p>
      </div>
      <div id="dataArea">
        <div id="cardsContainer"></div>
        <div class="table-wrapper">
          <table id="mandiTable"><thead id="tableHead"></thead><tbody id="tableBody"></tbody></table>
        </div>
      </div>
      <div class="watermark" id="watermark" style="display:none;">📱 @MandiBhavKhabar</div>
    `;
  }

  // --- Caching Logic (5 Min Expiry) ---
  async function cachedJson(url, storageKey = null, isPrice = false) {
    const now = Date.now();
    const TTL = 5 * 60 * 1000; // 5 mins for prices
    
    if (storageKey) {
      try {
        const cached = JSON.parse(localStorage.getItem(storageKey) || 'null');
        // Prices check for 5 min, others follow manifest reload
        if (cached && (!isPrice || (now - cached.t) < TTL) && !window.MBK_CONFIG?.needForceReload) {
          return cached.data;
        }
      } catch (e) {}
    }

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({ t: now, data: data }));
    }
    return data;
  }

  // --- Data Loading ---
  async function loadMandiBhav(mandiId) {
    if (!mandiId) return;
    currentMandiId = mandiId;
    
    const loader = document.getElementById('loadingMsg');
    const app = document.getElementById('mbkApp');
    if (loader) loader.style.display = 'block';
    
    try {
      const stateId = mandiId.slice(0, 2);
      const distId = mandiId.slice(0, 5);
      
      states = await cachedJson(`${BASE_URL}states.json`, 'mbk:map:states');
      const stateSlug = states.data?.[stateId]?.[1];
      
      const mNames = await cachedJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`, `mbk:map:mandis:${stateId}`);
      mandiNames = mNames.data || {};
      
      const dData = await cachedJson(`${BASE_URL}dists/${stateSlug}.json`, `mbk:map:dists:${stateId}`);
      const distInfo = dData.data?.[distId];
      const distSlug = distInfo?.[1] || distId;
      
      currentMandiName = mandiNames[mandiId]?.[0] || mandiId;
      currentDistName = distInfo?.[0] || distSlug;
      currentStateName = states.data?.[stateId]?.[0] || '-';

      const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
      pricesData = await cachedJson(pricesUrl, PRICES_PREFIX + distId, true);

      setupDateSelect();
      renderByDate(el.dateSelect.value);
      
      if (app) app.style.display = 'block';
    } catch (err) {
      console.error(err);
    } finally {
      if (loader) loader.style.display = 'none';
    }
  }

  function setupDateSelect() {
    const dateSet = new Set();
    (pricesData.rows || []).forEach(row => {
      if (row[1] === currentMandiId && row[0]) dateSet.add(row[0]);
    });
    allDates = Array.from(dateSet).sort().reverse();

    el.dateSelect.innerHTML = '';
    allDates.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = `📅 ${formatDate(d)}`;
      el.dateSelect.appendChild(opt);
    });
  }

  function renderByDate(date) {
    currentDate = date;
    mandiData = (pricesData.rows || []).filter(row => row[1] === currentMandiId && row[0] === date);
    
    el.pageTitle.textContent = `🌱 ${currentMandiName} मंडी भाव`;
    el.pageSubtitle.textContent = `जिला ${currentDistName} | ${currentStateName} | ${formatDate(date)}`;
    
    detectColumns();
    renderContent(mandiData);
    updateStats();
  }

  // --- Standard Render Logic ---
  function detectColumns() {
    visibleColumns = [
      { idx: 2, label: 'कमोडिटी' }, { idx: 3, label: 'वैरायटी' }, { idx: 4, label: 'ग्रेड' },
      { idx: 5, label: 'न्यूनतम' }, { idx: 6, label: 'अधिकतम' }, { idx: 7, label: 'मॉडल' },
      { idx: 8, label: 'क्विंटल' }, { idx: 0, label: 'तारीख' }
    ].filter(col => mandiData.some(row => isValid(row[col.idx])));
  }

  function renderContent(data) {
    if (viewMode === 'table') renderTable(data); else renderCards(data);
  }

  function renderTable(data) {
    const thead = document.getElementById('tableHead');
    thead.innerHTML = `<tr><th>#</th>${visibleColumns.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
    
    el.tableBody.innerHTML = data.map((row, i) => `
      <tr>
        <td>${i + 1}</td>
        ${visibleColumns.map(col => {
          let val = safeVal(row[col.idx]);
          if (col.idx === 2) val = commodities[row[2]] || row[2];
          if (col.idx === 3) val = varieties[row[3]] || row[3];
          if (col.idx === 0) val = formatDate(val);
          return `<td class="${col.idx === 2 ? 'commodity' : ''} ${[5,6,7].includes(col.idx) ? 'price' : ''}">${val}</td>`;
        }).join('')}
      </tr>
    `).join('');
    
    el.mandiTable.style.display = 'table';
    el.cardsContainer.style.display = 'none';
  }

  function renderCards(data) {
    el.cardsContainer.innerHTML = data.map((row, i) => `
      <div class="card">
        <div class="card-header">
            <div><p class="card-title">${commodities[row[2]] || row[2]}</p><div class="card-serial">#${i+1}</div></div>
            <div class="card-date-box"><div class="card-date">${formatDate(row[0])}</div></div>
        </div>
        <div class="card-grid">
            <div class="card-field"><div class="card-label">वैरायटी</div><div class="card-value">${varieties[row[3]] || row[3] || '-'}</div></div>
            <div class="card-field"><div class="card-label">ग्रेड</div><div class="card-value">${grades[row[4]] || row[4] || '-'}</div></div>
        </div>
        <div class="card-prices">
            <div class="card-prices-grid">
                <div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${row[5]}</div></div>
                <div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${row[6]}</div></div>
                <div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${row[7]}</div></div>
            </div>
        </div>
      </div>
    `).join('');
    el.cardsContainer.style.display = 'grid';
    el.mandiTable.style.display = 'none';
  }

  function updateStats() {
    el.totalRecords.textContent = mandiData.length;
    el.uniqueCommodities.textContent = new Set(mandiData.map(r => r[2])).size;
    el.selectedDate.textContent = formatDate(currentDate);
    el.mandiName.textContent = currentMandiName;
    el.distName.textContent = currentDistName;
    
    [el.stats, el.mandiInfo, el.searchInput, el.watermark].forEach(s => { if(s) s.style.display = 'flex'; });
  }

  // --- Initialization ---
  async function init() {
    if (__inited) return;
    __inited = true;
    
    injectUI();
    
    el.dateSelect = mustGet('dateSelect');
    el.toggleBtn = mustGet('toggleBtn');
    el.stats = mustGet('stats');
    el.totalRecords = mustGet('totalRecords');
    el.uniqueCommodities = mustGet('uniqueCommodities');
    el.selectedDate = mustGet('selectedDate');
    el.mandiInfo = mustGet('mandiInfo');
    el.mandiName = mustGet('mandiName');
    el.distName = mustGet('distName');
    el.searchInput = mustGet('searchInput');
    el.pageTitle = mustGet('pageTitle');
    el.pageSubtitle = mustGet('pageSubtitle');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');
    el.watermark = mustGet('watermark');

    // Events
    el.toggleBtn.onclick = () => {
        viewMode = viewMode === 'table' ? 'card' : 'table';
        el.toggleBtn.textContent = viewMode === 'table' ? '🃏 कार्ड' : '📊 टेबल';
        renderContent(mandiData);
    };

    el.dateSelect.onchange = (e) => renderByDate(e.target.value);

    el.searchInput.oninput = (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = mandiData.filter(r => 
            (commodities[r[2]]||r[2]||'').toLowerCase().includes(q) || 
            (varieties[r[3]]||r[3]||'').toLowerCase().includes(q)
        );
        renderContent(filtered);
    };

    // Mapping load
    [commodities, varieties, grades] = await Promise.all([
        cachedJson(`${BASE_URL}commodities.json`, 'mbk:map:commodities'),
        cachedJson(`${BASE_URL}varieties.json`, 'mbk:map:varieties'),
        cachedJson(`${BASE_URL}grades.json`, 'mbk:map:grades')
    ]);

    if (window.MBK_CONFIG?.autoLoad) {
        loadMandiBhav(window.MBK_CONFIG.mandiId);
    }
  }

  window.MBK = { init, loadMandiBhav };
})();

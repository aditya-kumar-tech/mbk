(function () {
  const BASE_URL = 'https://api.mandibhavkhabar.com/data/hi/';
  const PRICES_PREFIX = 'mbk:prices:';
  
  let commodities = {}, varieties = {}, grades = {}, states = {};
  let mandiData = [], allDates = [], mandiNames = {};
  let currentMandiId = '', currentMandiName = '', currentStateName = '', currentDistName = '', currentDate = '';
  let pricesData = null, viewMode = 'table', visibleColumns = [];
  let __inited = false;

  const el = {};

  function isValid(v) { return v !== null && v !== undefined && v !== '' && v !== 0 && v !== '0' && v !== '-'; }
  function safeVal(v) { return isValid(v) ? v : '-'; }
  
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  }

 function getVarietyName(vId) {
  if (!isValid(vId)) return '-';

  const vObj = varieties[vId];

  if (vObj && typeof vObj === 'object' && vObj.n) {
    return vObj.n;
  }

  return '-'; // ✅ mapping fail → "-"
}


 function getGradeName(gId) {
  if (!isValid(gId)) return '-';

  const paddedId = String(gId).padStart(2, '0');

  if (grades[paddedId]) return grades[paddedId];
  if (grades[gId]) return grades[gId];

  return '-'; // ✅ mapping fail → "-"
}


  // --- Naya Trend Calculation Logic ---
  function getTrend(row) {
    if (!pricesData || allDates.length < 2) return '';
    
    // Agli available date dhundho (jo current date se purani ho)
    const currentIndex = allDates.indexOf(currentDate);
    if (currentIndex === -1 || currentIndex === allDates.length - 1) return '';
    
    const prevDate = allDates[currentIndex + 1];
    
    // Pichli date ka wahi commodity + variety + grade wala record dhundho
    const prevRecord = pricesData.rows.find(r => 
      r[0] === prevDate && 
      r[1] === currentMandiId && 
      r[2] === row[2] && // Commodity ID
      r[3] === row[3] && // Variety ID
      r[4] === row[4]    // Grade ID
    );

    if (!prevRecord || !isValid(row[7]) || !isValid(prevRecord[7])) return '';

    const currentModal = parseFloat(row[7]);
    const prevModal = parseFloat(prevRecord[7]);
    const diff = currentModal - prevModal;

    if (diff > 0) {
      return `<span style="color: #28a745; font-size: 0.85em; font-weight: bold; margin-left: 5px;">▲ ${diff}</span>`;
    } else if (diff < 0) {
      return `<span style="color: #dc3545; font-size: 0.85em; font-weight: bold; margin-left: 5px;">▼ ${Math.abs(diff)}</span>`;
    }
    return '';
  }

  function injectUI() {
    const root = document.getElementById('mbkRoot');
    if (!root) return;
    root.innerHTML = `
      <div id="statsSection" style="display: none;">
        <div class="stats" id="stats">
          <div class="stat-card"><div class="stat-number" id="totalRecords">-</div><div class="stat-label">कुल भाव</div></div>
          <div class="stat-card"><div class="stat-number" id="uniqueCommodities">-</div><div class="stat-label">कमोडिटीज</div></div>
          <div class="stat-card"><div class="stat-number" id="selectedDate">-</div><div class="stat-label">तारीख</div></div>
        </div>
      </div>
      <div class="input-row">
        <select id="dateSelect"></select>
        <button id="refreshBtn">🔄 लोड करें</button>
        <button id="toggleBtn">🃏 कार्ड</button>
      </div>
      <div id="infoSearchSection" style="display: none;">
        <div class="mandi-info" id="mandiInfo">
          <strong>📍 मंडी:</strong> <span id="mandiName">-</span> |
          <strong>🌆 जिला:</strong> <span id="distName">-</span> |
          <strong>🏛️ राज्य:</strong> <span id="stateName">-</span>
        </div>
        <input class="search-box" id="searchInput" placeholder="🔍 गेहूं, प्याज, टमाटर, सोयाबीन..." type="text" />
      </div>
      <div class="header">
        <h1 id="pageTitle">🌱 मंडी भाव - Mandi Bhav Khabar</h1>
        <p id="pageSubtitle">रियल टाइम कृषि मंडी भाव</p>
      </div>
      <div id="dataArea">
        <div id="cardsContainer"></div>
        <div class="table-wrapper">
          <table id="mandiTable"><thead id="tableHead"></thead><tbody id="tableBody"></tbody></table>
        </div>
      </div>
      <div class="watermark" id="watermark" style="display: none;">📱 Follow @MandiBhavKhabar for Latest Updates</div>
    `;
  }

  async function cachedJson(url, storageKey = null, isPrice = false) {
    const now = Date.now();
    if (storageKey && !window.MBK_CONFIG?.needForceReload) {
      try {
        const cached = JSON.parse(localStorage.getItem(storageKey));
        if (cached && (!isPrice || (now - cached.t) < 300000)) return cached.data;
      } catch (e) {}
    }
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify({ t: now, data }));
    return data;
  }

  async function loadMandiBhav(mandiId) {
    if (!mandiId) return;
    currentMandiId = mandiId;
    const loader = document.getElementById('loadingMsg');
    if(loader) loader.style.display = 'block';
    
    try {
      states = await cachedJson(`${BASE_URL}states.json`, 'mbk:map:states');
      const sId = mandiId.slice(0, 2), dId = mandiId.slice(0, 5);
      const sSlug = states.data?.[sId]?.[1];
      
      const mNames = await cachedJson(`${BASE_URL}mandis/${sSlug}_mandis.json`, `mbk:map:mandis:${sId}`);
      const dData = await cachedJson(`${BASE_URL}dists/${sSlug}.json`, `mbk:map:dists:${sId}`);
      
      currentMandiName = mNames.data?.[mandiId]?.[0] || mandiId;
      currentDistName = dData.data?.[dId]?.[0] || dId;
      currentStateName = states.data?.[sId]?.[0] || '-';

      pricesData = await cachedJson(`${BASE_URL}prices/${sSlug}/${dData.data?.[dId]?.[1] || dId}_prices.json`, PRICES_PREFIX + dId, true);

      const dateSet = new Set();
      (pricesData.rows || []).forEach(r => { if(r[1] === mandiId) dateSet.add(r[0]); });
      allDates = Array.from(dateSet).sort().reverse();

      el.dateSelect.innerHTML = allDates.map(d => `<option value="${d}">📅 ${formatDate(d)}</option>`).join('');
      renderByDate(allDates[0]);
      const appEl = document.getElementById('mbkApp');
      if(appEl) appEl.style.display = 'block';
    } finally {
      if(loader) loader.style.display = 'none';
    }
  }

  function renderByDate(date) {
    if(!date) return;
    currentDate = date;
    mandiData = (pricesData.rows || []).filter(r => r[1] === currentMandiId && r[0] === date);
    detectColumns();
    renderContent(mandiData);
    updateStats();
  }

  function detectColumns() {
    const cols = [
      { idx: 2, label: 'कमोडिटी' }, { idx: 3, label: 'वैरायटी' }, { idx: 4, label: 'ग्रेड' },
      { idx: 5, label: 'न्यूनतम ₹' }, { idx: 6, label: 'अधिकतम ₹' }, { idx: 7, label: 'मॉडल ₹' },
      { idx: 8, label: 'क्विंटल' }, { idx: 9, label: 'बोरी' }, { idx: 0, label: 'तारीख' }
    ];
    visibleColumns = cols.filter(c => mandiData.some(r => isValid(r[c.idx])));
  }

  function renderContent(data) {
    if (viewMode === 'table') {
      const head = document.getElementById('tableHead');
      head.innerHTML = `<tr><th>क्रम</th>${visibleColumns.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
      document.getElementById('tableBody').innerHTML = data.map((r, i) => `
        <tr><td>${i+1}</td>${visibleColumns.map(c => {
          let v = safeVal(r[c.idx]);
          if(c.idx===2) v = commodities[r[2]] || r[2];
       //   let vid = String(r[2]) + String(r[3]).padStart(2, "0");
//if(c.idx===3) v = getVarietyName(vid);
          //let vid = r[2]+r[3]
          let vid = r[3];
         // if(c.idx===3) v = getVarietyName(r[3]);
          if(c.idx===3) v = getVarietyName(vid);
          if(c.idx===4) v = getGradeName(r[4]);
          if(c.idx===0) v = formatDate(v);
          
          // Modal Price (Index 7) ke liye trend add karein
          let displayVal = v;
          if(c.idx === 7) displayVal = v + getTrend(r);
          
          return `<td class="${c.idx===2?'commodity':''} ${[5,6,7].includes(c.idx)?'price':''}">${displayVal}</td>`;
        }).join('')}</tr>`).join('');
      el.mandiTable.style.display = 'table';
      el.cardsContainer.style.display = 'none';
    } else {
  el.cardsContainer.innerHTML = data.map((r, i) => {
    //const vid = r[2] + r[3];   // ✅ FIX HERE
const vid = r[3];
    return `
    <div class="card">
      <div class="card-header">
        <div>
          <p class="card-title">${commodities[r[2]] || r[2]}</p>
          <div class="card-serial">#${i+1}</div>
        </div>
        <div class="card-date-box">
          <div class="card-date">${formatDate(r[0])}</div>
        </div>
      </div>

      <div class="card-grid">
        ${isValid(r[3]) ? `
        <div class="card-field">
          <div class="card-label">वैरायटी</div>
          <div class="card-value">${getVarietyName(vid)}</div>
        </div>` : ''}

        ${isValid(r[4]) ? `
        <div class="card-field">
          <div class="card-label">ग्रेड</div>
          <div class="card-value">${getGradeName(r[4])}</div>
        </div>` : ''}
      </div>

      <div class="card-prices">
        <div class="card-prices-label">💰 मूल्य विवरण</div>
        <div class="card-prices-grid">
          ${isValid(r[5]) ? `<div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${r[5]}</div></div>`:''}
          ${isValid(r[6]) ? `<div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${r[6]}</div></div>`:''}
          ${isValid(r[7]) ? `<div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${r[7]}${getTrend(r)}</div></div>`:''}
        </div>
      </div>

      <div class="card-grid">
        ${isValid(r[8]) ? `<div class="card-field"><div class="card-label">आवक (क्विंटल)</div><div class="card-value">${r[8]}</div></div>`:''}
        ${isValid(r[9]) ? `<div class="card-field"><div class="card-label">आवक (बोरी)</div><div class="card-value">${r[9]}</div></div>`:''}
      </div>
    </div>`;
  }).join('');

  el.cardsContainer.style.display = 'grid';
  el.mandiTable.style.display = 'none';
}

  }

  function updateStats() {
    document.getElementById('totalRecords').textContent = mandiData.length;
    document.getElementById('uniqueCommodities').textContent = new Set(mandiData.map(r => r[2])).size;
    document.getElementById('selectedDate').textContent = formatDate(currentDate);
    document.getElementById('mandiName').textContent = currentMandiName;
    document.getElementById('distName').textContent = currentDistName;
    document.getElementById('stateName').textContent = currentStateName;
    document.getElementById('pageTitle').textContent = `🌱 कृषि उपज मंडी समिति ${currentMandiName} 🌱`;
    document.getElementById('pageSubtitle').textContent = `जिला ${currentDistName} | ${currentStateName} | ${formatDate(currentDate)}`;
    
    ['statsSection', 'infoSearchSection', 'watermark'].forEach(id => {
       const node = document.getElementById(id);
       if(node) node.style.display = 'block';
    });
  }

  async function init() {
    if (__inited) return;
    __inited = true;
    injectUI();
    
    el.dateSelect = document.getElementById('dateSelect');
    el.cardsContainer = document.getElementById('cardsContainer');
    el.mandiTable = document.getElementById('mandiTable');
    
    document.getElementById('toggleBtn').onclick = () => {
      viewMode = viewMode === 'table' ? 'card' : 'table';
      document.getElementById('toggleBtn').textContent = viewMode === 'table' ? '🃏 कार्ड' : '📊 टेबल';
      renderContent(mandiData);
    };

    const refreshBtn = document.getElementById('refreshBtn');
    if(refreshBtn) {
        refreshBtn.onclick = () => {
            if(window.mandibhavloadfresh) window.mandibhavloadfresh();
            else loadMandiBhav(currentMandiId);
        };
    }

    el.dateSelect.onchange = (e) => renderByDate(e.target.value);
    
    document.getElementById('searchInput').oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = mandiData.filter(r => {
          const cName = (commodities[r[2]]||r[2]||'').toLowerCase();
          //const vName = getVarietyName(r[3]).toLowerCase();
        const vid = r[2] + r[3]; // ✅ FIX
        const vName = getVarietyName(vid).toLowerCase();
          return cName.includes(q) || vName.includes(q);
      });
      renderContent(filtered);
    };

    const [c, v, g] = await Promise.all([
      cachedJson(`${BASE_URL}commodities.json`, 'mbk:map:commodities'),
      cachedJson(`${BASE_URL}varieties.json`, 'mbk:map:varieties'),
      cachedJson(`${BASE_URL}grades.json`, 'mbk:map:grades')
    ]);
    commodities = c; varieties = v; grades = g;

    if (window.MBK_CONFIG?.autoLoad) loadMandiBhav(window.MBK_CONFIG.mandiId);
  }

  window.MBK = { init, loadMandiBhav };
})();

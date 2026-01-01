(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';

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
  let viewMode = 'card';
  let visibleColumns = [];

  // DOM refs (init में set होंगी)
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

 /* function showLoading(show) {
    if (el.loadingMsg) el.loadingMsg.style.display = show ? 'block' : 'none';
  }*/
  function showLoading(show) {
  const loader = document.getElementById('loadingMsg');
  const app = document.getElementById('mbkApp');

  if (loader) loader.style.display = show ? 'block' : 'none';

  // ✅ only show app when loading finished
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

  async function loadCommodities() {
    try {
      const [cRes, vRes, vEngRes, gRes] = await Promise.all([
        fetch(`${BASE_URL}commodities.json`),
        fetch(`${BASE_URL}varieties.json`),
        fetch(`${BASE_URL}varietiesEng.json`),
        fetch(`${BASE_URL}grades.json`)
      ]);
      commodities = await cRes.json();
      varieties = await vRes.json().catch(() => ({}));
      varietiesEng = await vEngRes.json().catch(() => ({}));
      grades = await gRes.json().catch(() => ({}));
      debugLog('✅ Commodity/Variety/Grade mapping ready', 'success');
    } catch (e) {
      debugLog('⚠️ Mapping files optional', 'info');
    }
  }

  async function loadStates() {
    try {
      const response = await fetch(`${BASE_URL}states.json`);
      states = await response.json();
      debugLog('✅ States लोड', 'success');
    } catch (e) {
      debugLog('States error', 'error');
    }
  }

  async function loadMandiNamesForState(stateSlug) {
    try {
      const response = await fetch(`${BASE_URL}mandis/${stateSlug}_mandis.json`);
      const data = await response.json();
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
    const stateSlug = stateInfo?.[1];

    if (Object.keys(mandiNames).length === 0) {
      await loadMandiNamesForState(stateSlug);
    }

    const distMappingUrl = `${BASE_URL}dists/${stateSlug}.json`;
    const distResponse = await fetch(distMappingUrl);
    const distData = await distResponse.json();
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[1] || distId;

    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
    return { pricesUrl, stateSlug, distSlug, stateInfo, distInfo };
  }

  async function loadAvailableDates(pricesUrl, mandiId) {
    try {
      const response = await fetch(pricesUrl);
      const data = await response.json();

      const dateSet = new Set();
      (data.rows || []).forEach(row => {
        if (row[1] === mandiId && row[0]) dateSet.add(row[0]);
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
        el.dateSelect.value = allDates.includes(previousValue) ? previousValue : allDates[0];
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
      { idx: 7, label: 'मोडल ₹' },
      { idx: 8, label: 'आवक (क्विंटल)' },
      { idx: 9, label: 'आवक (बोरी)' },
      { idx: 0, label: 'तारीख' }
    ];

    allCols.forEach(col => {
      const hasData = mandiData.some(row => {
        if (col.idx === 10) return isValid(row[1]) || isValid(row[10]);
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
          const mandiId = row[1];
          cellValue = (mandiNames?.[mandiId]?.[0]) || row[10] || mandiId || '-';
        } else if (col.idx === 2) cellValue = commodities[row[2]] || row[2] || '-';
        else if (col.idx === 3) cellValue = getVarietyName(row[3]);
        else if (col.idx === 4) cellValue = grades[row[4]] || row[4] || '-';
        else if (col.idx === 0) cellValue = formatDate(row[0]);

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
                ${row[7] && row[7] !== 0 ? `<div class="card-price-item"><div class="card-price-label">मोडल</div><div class="card-price-value">₹${row[7]}</div></div>` : ''}
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
    el.mandiName.textContent = isDistrictView ? `📊 पूरा जिला` : currentMandiName;
    el.stateName.textContent = currentStateName;
    el.distName.textContent = currentDistName;

    el.totalRecords.textContent = mandiData.length;
    const uniqueCommodities = new Set(mandiData.map(row => row[2]));
    el.uniqueCommodities.textContent = uniqueCommodities.size;
    el.selectedDate.textContent = formattedDate;

    el.stats.style.display = 'flex';
    el.mandiInfo.style.display = 'block';
    el.searchInput.style.display = 'block';
    el.watermark.style.display = 'block';
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

      currentMandiName = mandiNames[currentMandiId]?.[0] || currentMandiId;
      currentStateName = stateInfo?.[0] || '-';
      currentDistName = distInfo?.[0] || distSlug;

      el.pageTitle.textContent = `🌱 ${currentMandiName}`;

      const latestDate = await loadAvailableDates(pricesUrl, currentMandiId);

      const cacheKey = `prices_${currentMandiId.slice(0,5)}`;
      const now = Date.now();
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');

      if (cached.data && (now - cached.timestamp) < 300000) {
        pricesData = cached.data;
        debugLog(`💾 Cache से डेटा`, 'success');
      } else {
        const response = await fetch(pricesUrl);
        pricesData = await response.json();
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: pricesData, timestamp: now }));
        debugLog(`📡 नया डेटा fetch`, 'success');
      }

      const selectedDate = el.dateSelect.value || latestDate || currentDate;
      currentDate = selectedDate;

      mandiData = (pricesData.rows || []).filter(row =>
        row[1] === currentMandiId && row[0] === selectedDate
      );

      if (mandiData.length === 0) {
        debugLog('⚠️ इस मंडी का डेटा नहीं मिला', 'error');
        return;
      }

      detectVisibleColumns();

      const formattedDate = formatDate(selectedDate);
      el.pageTitle.textContent = `🌱 ${currentMandiName} मंडी`;
      el.pageSubtitle.textContent = `जिला ${currentDistName} | ${currentStateName} | ${formattedDate}`;

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
    el.toggleBtn.textContent = viewMode === 'table' ? '📊 टेबल' : '🃏 कार्ड';
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
    el.pageSubtitle = mustGet('pageSubtitle');
    el.loadingMsg = mustGet('loadingMsg');
    el.dataArea = mustGet('dataArea');
    el.cardsContainer = mustGet('cardsContainer');
    el.mandiTable = mustGet('mandiTable');
    el.tableBody = mustGet('tableBody');
    el.watermark = mustGet('watermark');

    // bind events (once)
    el.dateSelect.addEventListener('change', function () {
      if (!this.value) return;
      currentDate = this.value;
      showLoading(true);

      setTimeout(() => {
        try {
          if (!isDistrictView) {
            mandiData = (pricesData.rows || []).filter(row =>
              row[1] === currentMandiId && row[0] === currentDate
            );
          } else {
            mandiData = (pricesData.rows || []).filter(row => row[0] === currentDate);
          }

          if (mandiData.length > 0) {
            detectVisibleColumns();
            el.pageSubtitle.textContent = `${currentStateName} | ${currentDistName} | ${formatDate(currentDate)}`;
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
        const c = (commodities[row[2]] || row[2] || '').toLowerCase();
        const v = (varieties[row[3]] || row[3] || '').toLowerCase();
        const g = (grades[row[4]] || row[4] || '').toLowerCase();
        return c.includes(query) || v.includes(query) || g.includes(query);
      });
      el.totalRecords.textContent = filtered.length;
      renderContent(filtered, isDistrictView);
    });

    debugLog('🌐 Ready!', 'success');
    await loadCommodities();
    await loadStates();
  }

  // expose API for loader
  window.MBK = { init, loadMandiBhav, toggleViewMode };
})();

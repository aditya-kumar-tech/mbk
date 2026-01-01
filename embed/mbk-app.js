 <script>
        const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
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
        const debugDiv = document.getElementById('debugPanel');
        let debugVisible = false;

        function debugLog(message, type = 'info') {
            const div = document.createElement('div');
            div.style.padding = '6px 8px';
            div.style.margin = '2px 0';
            div.style.background = type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eef';
            div.style.borderLeft = `4px solid ${type === 'error' ? '#f44' : type === 'success' ? '#4f4' : '#44f'}`;
            div.style.fontSize = '12px';
            div.innerHTML = `<strong>${new Date().toLocaleTimeString('hi-IN')}:</strong> ${message}`;
            debugDiv.appendChild(div);
            debugDiv.scrollTop = debugDiv.scrollHeight;
        }

        /* ✅ ADD: Blogger/JSON entity decode helper (no other behavior change) */
        function decodeEntitiesDeep(str, times = 8) {
            let s = (str === null || str === undefined) ? '' : String(str);
            for (let i = 0; i < times; i++) {
                const ta = document.createElement('textarea');
                ta.innerHTML = s;
                const next = ta.value;
                if (next === s) break;
                s = next;
            }
            return s;
        }
function decodeTextNodes(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.nodeValue;
    if (!t) continue;

    // agar entity pattern mile tabhi decode (fast + safe)
    if (t.includes('&#') || t.includes('&amp;#') || t.includes('&#x') || t.includes('&amp;#x')) {
      const decoded = decodeEntitiesDeep(t);
      if (decoded !== t) node.nodeValue = decoded;
    }
  }
}

function decodeAttrs(root = document.body) {
  const attrs = ['placeholder', 'title', 'aria-label', 'value'];
  const nodes = root.querySelectorAll('*');

  nodes.forEach(el => {
    attrs.forEach(a => {
      if (el.hasAttribute && el.hasAttribute(a)) {
        const v = el.getAttribute(a);
        if (v && (v.includes('&#') || v.includes('&amp;#') || v.includes('&#x') || v.includes('&amp;#x'))) {
          el.setAttribute(a, decodeEntitiesDeep(v));
        }
      }
    });
  });
}


        /* ✅ ADD: decode static HTML (table headers etc.) if Blogger escaped them */
        function fixEscapedHtmlInUI() {
            const nodes = [
                document.querySelector('.header'),
                document.querySelector('#mandiInfo'),
                document.querySelector('#mandiTable thead'),
                document.querySelector('#toggleBtn'),
                document.querySelector('.watermark')
            ].filter(Boolean);

            nodes.forEach(el => {
                el.innerHTML = decodeEntitiesDeep(el.innerHTML);
            });
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
                
                const dateSelect = document.getElementById('dateSelect');
                const previousValue = dateSelect.value;
                
                dateSelect.innerHTML = '';
                allDates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    option.textContent = `📅 ${formatDate(date)}`;
                    dateSelect.appendChild(option);
                });
                
                if (allDates.length > 0) {
                    if (allDates.includes(previousValue)) {
                        dateSelect.value = previousValue;
                        currentDate = previousValue;
                    } else {
                        dateSelect.value = allDates[0];
                        currentDate = allDates[0];
                    }
                    dateSelect.style.display = 'inline-block';
                }
                
                debugLog(`✅ ${allDates.length} तारीखें मिलीं`, 'success');
                return currentDate;
            } catch (e) {
                debugLog(`⚠️ Dates error: ${e.message}`, 'error');
                return null;
            }
        }

        async function loadMandiBhav(mandiInput) {
        currentMandiId = mandiInput
            if (currentMandiId.length !== 8) {
                alert('भाव लोड करने असमर्थ');
                return;
            }

            debugLog(`🚀 लोड: ${currentMandiId}`);
            showLoading(true);
            isDistrictView = false;

            try {
                const { pricesUrl, stateSlug, distSlug, stateInfo, distInfo } = await getPricesUrl(currentMandiId);
                
                currentMandiName = mandiNames[currentMandiId]?.[0] || currentMandiId;
                currentStateName = stateInfo?.[0] || '-';
                currentDistName = distInfo?.[0] || distSlug;

                /* ✅ ADD: decode if entities are coming (Blogger / JSON) */
                currentMandiName = decodeEntitiesDeep(currentMandiName);
                currentStateName = decodeEntitiesDeep(currentStateName);
                currentDistName = decodeEntitiesDeep(currentDistName);

                document.getElementById('mandiName').textContent = currentMandiName;
                document.getElementById('stateName').textContent = currentStateName;
                document.getElementById('distName').textContent = currentDistName;
                document.getElementById('pageTitle').textContent = `🌱 ${currentMandiName}`;
                
                debugLog(`📍 ${currentMandiName} - ${currentDistName} - ${currentStateName}`, 'success');
                
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
                
                const selectedDate = document.getElementById('dateSelect').value || latestDate || currentDate;
                currentDate = selectedDate;
                mandiData = (pricesData.rows || []).filter(row => 
                    row[1] === currentMandiId && row[0] === selectedDate
                );

                if (mandiData.length === 0) {
                    debugLog('⚠️ इस मंडी का डेटा नहीं मिला', 'error');
                    showLoading(false);
                    return;
                }

                detectVisibleColumns();
                
               const thM = document.getElementById('thMarket');
if (thM) thM.style.display = 'none';   // mandi view

               const formattedDate = formatDate(selectedDate);
                document.getElementById('pageTitle').textContent = `🌱 ${currentMandiName} मंडी`;
                document.getElementById('pageSubtitle').textContent = `जिला ${currentDistName} | ${currentStateName} |  ${formattedDate}`;
                document.getElementById('selectedDate').textContent = formattedDate;
                renderContent(mandiData, false);
                updateStats();
                debugLog(`✅ ${mandiData.length} भाव लोड`, 'success');

            } catch (e) {
                debugLog(`❌ ${e.message}`, 'error');
            } finally {
                showLoading(false);
            }
           applyAllDecodes();
 
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
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return dateStr;
        }

        function getVarietyName(varietyId) {
            if (!varietyId) return '-';
            const vData = varietiesEng[varietyId];
            return vData?.n || varieties[varietyId] || varietyId || '-';
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
                // ✅ add these
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
            if (viewMode === 'table') {
                renderTable(data, showMarket);
            } else {
                renderCards(data, showMarket);
            }
        }

        function renderTable(data, showMarket) {
  const tbody = document.getElementById('tableBody');
  const thead = document.getElementById('mandiTable').querySelector('thead tr');

  tbody.innerHTML = '';
  thead.innerHTML = '<th>क्रम</th>';

  visibleColumns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;

    if (col.idx === 10) {
      th.id = 'thMarket';
      th.style.display = showMarket ? '' : 'none';
    }
    thead.appendChild(th);
  });

  data.slice(0, 200).forEach((row, index) => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = index + 1;
    tr.lastChild.setAttribute('data-label', 'क्रम');

    visibleColumns.forEach(col => {
      let cellValue = safeVal(row[col.idx]);

      if (col.idx === 10) {
        const mandiId = row[1];
        cellValue = (mandiNames?.[mandiId]?.[0]) || row[10] || mandiId || '-';
        cellValue = decodeEntitiesDeep(cellValue);
      }
      else if (col.idx === 2) cellValue = commodities[row[2]] || row[2] || '-';
      else if (col.idx === 3) cellValue = getVarietyName(row[3]);
      else if (col.idx === 4) cellValue = grades[row[4]] || row[4] || '-';
      else if (col.idx === 0) cellValue = formatDate(row[0]);

      const td = tr.insertCell();
      td.textContent = cellValue;
      td.setAttribute('data-label', col.label);

      if (col.idx === 10 && !showMarket) td.style.display = 'none';
      if ((col.idx === 5 || col.idx === 6 || col.idx === 7) && cellValue !== '-') td.classList.add('price');
      if (col.idx === 2) td.classList.add('commodity');
    });
  });

  const table = document.getElementById('mandiTable');
  table.classList.add('show');
  table.style.display = 'table';
  document.getElementById('cardsContainer').classList.remove('show');

  // ✅ ADD: render ke baad decode (Blogger entities fix)
  decodeTextNodes(document.getElementById('dataArea'));
}


        function renderCards(data, showMarket) {
            const container = document.getElementById('cardsContainer');
            let html = '';

            data.slice(0, 200).forEach((row, index) => {                    const commodityName = commodities[row[2]] || row[2] || '-';
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
                              </div> </div>
                `;
            });

            container.innerHTML = html;
            container.classList.add('show');
            const table = document.getElementById('mandiTable');
            table.classList.remove('show');
            table.style.display = 'none';
            // ✅ ADD: render ke baad decode (Blogger entities fix)
  decodeTextNodes(document.getElementById('dataArea'));
        }

        function updateStats() {
            const selectedDate = document.getElementById('dateSelect').value || currentDate;
            const formattedDate = formatDate(selectedDate);
            document.getElementById('mandiName').textContent = isDistrictView ? `📊 पूरा जिला` : currentMandiName;
            document.getElementById('stateName').textContent = currentStateName;
            document.getElementById('distName').textContent = currentDistName;
            document.getElementById('totalRecords').textContent = mandiData.length;
            
            const uniqueCommodities = new Set(mandiData.map(row => row[2]));
            document.getElementById('uniqueCommodities').textContent = uniqueCommodities.size;

            document.getElementById('stats').style.display = 'flex';
            document.getElementById('mandiInfo').style.display = 'block';
            document.getElementById('searchInput').style.display = 'block';
            document.getElementById('watermark').style.display = 'block';
        applyAllDecodes();

        }

        function showLoading(show) {
            document.getElementById('loadingMsg').style.display = show ? 'block' : 'none';
        }

        function toggleViewMode() {
            viewMode = viewMode === 'table' ? 'card' : 'table';
            const btn = document.getElementById('toggleBtn');
            btn.textContent = viewMode === 'table' ? '📊 टेबल' : '🃏 कार्ड';
            debugLog(`🎨 View: ${viewMode}`, 'info');
            if (mandiData.length > 0) {
                renderContent(mandiData, isDistrictView);
            }

        applyAllDecodes();

        }

        document.getElementById('dateSelect').addEventListener('change', function() {
            if (this.value === '') return;
            currentDate = this.value;
            const formattedDate = formatDate(currentDate);
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
                        document.getElementById('pageSubtitle').textContent = `${currentStateName} | ${currentDistName} | ${formattedDate}`;
                        document.getElementById('selectedDate').textContent = formattedDate;
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

        document.getElementById('searchInput').addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const filtered = mandiData.filter(row => {
                const c = (commodities[row[2]] || row[2] || '').toLowerCase();
                const v = (varieties[row[3]] || row[3] || '').toLowerCase();
                const g = (grades[row[4]] || row[4] || '').toLowerCase();
                return c.includes(query) || v.includes(query) || g.includes(query);
            });
            document.getElementById('totalRecords').textContent = filtered.length;
            renderContent(filtered, isDistrictView);
        });
function mandibhavloadfresh(){
loadMandiBhav("19044003");
}
        window.addEventListener('load', async () => {
            /* ✅ ADD: decode any escaped HTML produced by Blogger */
            decodeTextNodes();
            fixEscapedHtmlInUI();

            debugLog('🌐 Ready!', 'success');
            await loadCommodities();
            await loadStates();
            mandibhavloadfresh();
        });
      decodeTextNodes(document.getElementById('dataArea'));
function applyAllDecodes() {
  decodeTextNodes(document.body);
  decodeAttrs(document.body);
}
let __MBK_INIT_DONE = false;

async function mbkInit() {
  if (__MBK_INIT_DONE) return;
  __MBK_INIT_DONE = true;

  // aapka existing init flow
  debugLog('🌐 Ready!', 'success');
  await loadCommodities();
  await loadStates();
}

// expose for loader + inline onclick
window.MBK = {
  init: mbkInit,
  loadMandiBhav,
  toggleViewMode
};

    </script>

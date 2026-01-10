(function() {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const PRICES_TTL_MS = 5 * 60 * 1000; // 5 min TTL only for prices

  // ---------- DOM & State ----------
  const el = {};
  let __inited = false;
  let commodities = {}, varieties = {}, varietiesEng = {}, grades = {};
  let states = {}, mandiNames = {}, mandiData = [], allDates = [];
  let currentMandiId = '', currentMandiName = '', currentStateName = '', currentDistName = '', currentDate = '';
  let pricesData = null, viewMode = 'table', visibleColumns = [];

  // ---------- Helpers ----------
  function mustGet(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element #${id}`);
    return node;
  }

  function showLoading(show) {
    const loader = document.getElementById('loadingMsg');
    if (loader) loader.style.display = show ? 'block' : 'none';
  }

  function safeVal(v) { return (v === null || v === undefined || v === '' || v === 0) ? '-' : v; }
  function isValid(v) { return !(v === null || v === undefined || v === '' || v === 0 || v === '-'); }
  function formatDate(dateStr) { if (!dateStr) return '-'; const p = dateStr.split('-'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : dateStr; }

  function getVarietyName(varietyId) {
    if (!varietyId) return '-';
    const vData = varietiesEng[varietyId];
    return vData?.n || varieties[varietyId] || varietyId || '-';
  }

  // ---------- Manifest + cache helpers ----------
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

  async function cachedMapJson(url) {
    const key = 'mbk:map:' + url;
    const raw = sessionStorage.getItem(key);
    if (raw) { try { return JSON.parse(raw); } catch {} }
    const res = await fetch(url);
    const data = await res.json();
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
    return data;
  }

  async function cachedPricesJson(pricesUrl, districtKey) {
    const key = 'mbk:prices:' + districtKey;
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

  async function syncManifestAndInvalidate() {
    try {
      const mf = await loadManifest();
      const oldMapsVer = sessionStorage.getItem('mbk:maps_ver') || '';
      if (mf.maps_ver && mf.maps_ver !== oldMapsVer) {
        clearByPrefix('mbk:map:');
        sessionStorage.setItem('mbk:maps_ver', mf.maps_ver);
      }
      if (mf.force_reload) {
        clearByPrefix('mbk:prices:'); // only prices cache
      }
    } catch {}
  }

  // ---------- Load Mapping Data ----------
  async function loadCommodities() {
    [commodities, varieties, varietiesEng, grades] = await Promise.all([
      cachedMapJson(`${BASE_URL}commodities.json`),
      cachedMapJson(`${BASE_URL}varieties.json`),
      cachedMapJson(`${BASE_URL}varietiesEng.json`),
      cachedMapJson(`${BASE_URL}grades.json`)
    ]);
  }

  async function loadStates() { states = await cachedMapJson(`${BASE_URL}states.json`); }

  async function loadMandiNamesForState(stateSlug) {
    const data = await cachedMapJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`);
    mandiNames = data.data || {};
  }

  async function getPricesUrl(mandiId) {
    const stateId = mandiId.slice(0, 2);
    const distId = mandiId.slice(0, 5);
    const stateInfo = states?.data?.[stateId];
    const stateSlug = stateInfo?.[1] || stateId;

    if (Object.keys(mandiNames).length === 0) await loadMandiNamesForState(stateSlug);

    const distMappingUrl = `${BASE_URL}dists/${stateSlug}.json`;
    const distData = await cachedMapJson(distMappingUrl);
    const distInfo = distData?.data?.[distId];
    const distSlug = distInfo?.[1] || distId;

    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
    return { pricesUrl, stateInfo, distInfo, distSlug };
  }

  // ---------- UI Rendering ----------
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
    if (viewMode === 'table') renderTable(data); else renderCards(data);
  }

  function renderTable(data) {
    const tbody = el.tableBody;
    const theadRow = el.mandiTable.querySelector('thead tr');
    tbody.innerHTML = '';
    theadRow.innerHTML = '<th>क्रम</th>';
    visibleColumns.forEach(col => { const th = document.createElement('th'); th.textContent = col.label; theadRow.appendChild(th); });

    data.slice(0, 200).forEach((row, idx) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = idx + 1;
      visibleColumns.forEach(col => {
        let val = safeVal(row[col.idx]);
        if (col.idx === 2) val = commodities[row[2]] || row[2] || '-';
        else if (col.idx === 3) val = getVarietyName(row[3]);
        else if (col.idx === 4) val = grades[row[4]] || row[4] || '-';
        else if (col.idx === 0) val = formatDate(row[0]);
        const td = tr.insertCell();
        td.textContent = val;
        if ([5,6,7].includes(col.idx) && val!=='-') td.classList.add('price');
        if (col.idx===2) td.classList.add('commodity');
      });
    });

    el.mandiTable.classList.add('show'); el.mandiTable.style.display='table';
    el.cardsContainer.classList.remove('show'); el.cardsContainer.style.display='none';
  }

  function renderCards(data) {
    let html='';
    data.slice(0,200).forEach((row,idx)=>{
      const cname=commodities[row[2]]||row[2]||'-';
      const vname=getVarietyName(row[3]);
      const gname=grades[row[4]]||row[4]||'-';
      const d=formatDate(row[0]);
      html+=`<div class="card">
        <div class="card-header"><div><p class="card-title">${cname}</p><div class="card-serial">#${idx+1}</div></div>
        <div class="card-date-box"><div class="card-date-label">तारीख</div><div class="card-date">${d}</div></div></div>
        <div class="card-grid">${row[3]?`<div class="card-field"><div class="card-label">वैरायटी</div><div class="card-value">${vname}</div></div>`:''}${row[4]?`<div class="card-field"><div class="card-label">ग्रेड</div><div class="card-value">${gname}</div></div>`:''}</div>
        ${(row[5]&&row[5]!=0)||(row[6]&&row[6]!=0)||(row[7]&&row[7]!=0)?`<div class="card-prices"><div class="card-prices-label">💰 मूल्य विवरण</div><div class="card-prices-grid">${row[5]&&row[5]!=0?`<div class="card-price-item"><div class="card-price-label">न्यूनतम</div><div class="card-price-value">₹${row[5]}</div></div>`:''}${row[6]&&row[6]!=0?`<div class="card-price-item"><div class="card-price-label">अधिकतम</div><div class="card-price-value">₹${row[6]}</div></div>`:''}${row[7]&&row[7]!=0?`<div class="card-price-item"><div class="card-price-label">मॉडल</div><div class="card-price-value">₹${row[7]}</div></div>`:''}</div></div>`:''}</div>`;
    });
    el.cardsContainer.innerHTML=html;
    el.cardsContainer.classList.add('show'); el.cardsContainer.style.display='grid';
    el.mandiTable.classList.remove('show'); el.mandiTable.style.display='none';
  }

  function updateStats() {
    const d=formatDate(el.dateSelect.value||currentDate);
    el.mandiName.textContent=currentMandiName;
    el.stateName.textContent=currentStateName;
    el.distName.textContent=currentDistName;
    el.totalRecords.textContent=mandiData.length;
    el.uniqueCommodities.textContent=new Set(mandiData.map(r=>r[2])).size;
    el.selectedDate.textContent=d;
    el.stats.style.display='flex';
    el.mandiInfo.style.display='block';
    el.searchInput.style.display='block';
    if(el.watermark) el.watermark.style.display='block';
  }

  // ---------- Load mandi bhav ----------
  async function loadMandiBhav(mandiInput){
    currentMandiId=mandiInput;
    if(!currentMandiId || currentMandiId.length!==8){alert('भाव लोड करने असमर्थ');return;}
    showLoading(true);
    try{
      const {pricesUrl,stateInfo,distInfo,distSlug}=await getPricesUrl(currentMandiId);
      currentMandiName=mandiNames[currentMandiId]?.[0]||currentMandiId;
      currentStateName=stateInfo?.[0]||'-';
      currentDistName=distInfo?.[0]||distSlug;
      el.pageTitle.textContent=`🌱 ${currentMandiName} मंडी का भाव`;
      pricesData = await cachedPricesJson(pricesUrl, currentMandiId.slice(0,5));
      // build dates
      const dateSet=new Set(); (pricesData.rows||[]).forEach(r=>{if(r[1]===currentMandiId&&r[0]) dateSet.add(r[0]);});
      allDates=Array.from(dateSet).sort().reverse();
      el.dateSelect.innerHTML=''; allDates.forEach(d=>{const o=document.createElement('option'); o.value=d; o.textContent=`📅 ${formatDate(d)}`; el.dateSelect.appendChild(o);});
      if(!allDates.length) return;
      currentDate=el.dateSelect.value||allDates[0];
      mandiData=(pricesData.rows||[]).filter(r=>r[1]===currentMandiId && r[0]===currentDate);
      if(!mandiData.length) return;
      detectVisibleColumns();
      if(el.pageSubtitle) el.pageSubtitle.textContent=`जिला ${currentDistName} | ${currentStateName} | ${formatDate(currentDate)}`;
      renderContent(mandiData);
      updateStats();
    } finally{showLoading(false);}
  }

  // ---------- Toggle view ----------
  function toggleViewMode() { viewMode = viewMode==='table'?'card':'table'; el.toggleBtn.textContent=viewMode==='table'?'🃏 कार्ड':'📊 टेबल'; if(mandiData.length>0) renderContent(mandiData); }

  // ---------- Init ----------
  async function init(){
    if(__inited) return; __inited=true;
    el.dateSelect = mustGet('dateSelect'); el.toggleBtn = mustGet('toggleBtn'); el.stats = mustGet('stats');
    el.totalRecords = mustGet('totalRecords'); el.uniqueCommodities = mustGet('uniqueCommodities'); el.selectedDate = mustGet('selectedDate');
    el.mandiInfo = mustGet('mandiInfo'); el.mandiName = mustGet('mandiName'); el.distName = mustGet('distName'); el.stateName = mustGet('stateName');
    el.searchInput = mustGet('searchInput'); el.pageTitle = mustGet('pageTitle'); el.pageSubtitle = document.getElementById('pageSubtitle');
    el.loadingMsg = mustGet('loadingMsg'); el.dataArea = mustGet('dataArea'); el.cardsContainer = mustGet('cardsContainer'); el.mandiTable = mustGet('mandiTable'); el.tableBody = mustGet('tableBody'); el.watermark = document.getElementById('watermark');

    el.dateSelect.addEventListener('change', function() {
      if(!this.value) return; currentDate=this.value; showLoading(true);
      setTimeout(()=>{ try{ mandiData=(pricesData.rows||[]).filter(r=>r[1]===currentMandiId && r[0]===currentDate); if(mandiData.length>0){ detectVisibleColumns(); if(el.pageSubtitle) el.pageSubtitle.textContent=`जिला ${currentDistName} | ${currentStateName} | ${formatDate(currentDate)}`; renderContent(mandiData); updateStats();} }finally{showLoading(false);} }, 60);
    });

    el.searchInput.addEventListener('input', function(e){ const q=e.target.value.toLowerCase(); const f=mandiData.filter(r=>{ const c=(commodities[r[2]]||r[2]||'').toLowerCase(); const v=(varieties[r[3]]||r[3]||'').toLowerCase(); const g=(grades[r[4]]||r[4]||'').toLowerCase(); return c.includes(q)||v.includes(q)||g.includes(q); }); el.totalRecords.textContent=f.length; renderContent(f); });

    await syncManifestAndInvalidate();
    await loadCommodities();
    await loadStates();
  }

  // ---------- Export ----------
  window.MBK = { init, loadMandiBhav, toggleViewMode };

})();

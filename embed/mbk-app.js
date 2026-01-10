(function () {
  const BASE_URL='https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL='https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const PRICES_TTL_MS=5*60*1000;

  const APP_VER="2026-01-10_01";
  const APP_VER_KEY="mbk:app_ver";
  const MAPS_VER_KEY='mbk:maps_ver';
  const MAP_PREFIX='mbk:map:';
  const PRICES_PREFIX='mbk:prices:';

  let commodities={},varieties={},varietiesEng={},grades={};
  let mandiData=[],states={},allDates=[],mandiNames={};
  let currentMandiId='',currentMandiName='',currentStateName='',currentDistName='',currentDate='';
  let pricesData=null,viewMode='table',visibleColumns=[];
  const el={};
  let __inited=false;

  function mustGet(id){const node=document.getElementById(id);if(!node)throw new Error(`#${id} missing`);return node;}
  function showLoading(show){const l=el.loadingMsg,a=el.dataArea;if(l)l.style.display=show?'block':'none';if(a)a.style.display=show?'none':'block';}
  function isValid(v){return !(v===null||v===undefined||v===''||v===0||v==='-');}
  function safeVal(v){return (v===null||v===undefined||v===''||v===0)?'-':v;}
  function formatDate(d){if(!d)return'-';const p=d.split('-');return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:d;}
  function getVarietyName(id){return varietiesEng[id]?.n||varieties[id]||id||'-';}

  async function loadManifest(){const res=await fetch(MANIFEST_URL,{cache:'no-store'});return res.json();}
  function clearByPrefix(prefix){for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k?.startsWith(prefix))sessionStorage.removeItem(k);}}
  function resetAllMbkCache(){["mbk:map:","mbk:prices:","mbk:maps_ver"].forEach(p=>{if(p==="mbk:maps_ver"){sessionStorage.removeItem(p);return;}clearByPrefix(p);});}
  if(sessionStorage.getItem(APP_VER_KEY)!==APP_VER){resetAllMbkCache();sessionStorage.setItem(APP_VER_KEY,APP_VER);}

  async function syncManifestAndInvalidate(){try{const mf=await loadManifest();const newMapsVer=String(mf.maps_ver||'');const oldMapsVer=sessionStorage.getItem(MAPS_VER_KEY)||'';if(newMapsVer&&newMapsVer!==oldMapsVer){clearByPrefix(MAP_PREFIX);sessionStorage.setItem(MAPS_VER_KEY,newMapsVer);}}catch{}}

  async function cachedMapJson(url){const key=MAP_PREFIX+url;const raw=sessionStorage.getItem(key);if(raw)try{return JSON.parse(raw);}catch{}const res=await fetch(url);const data=await res.json();try{sessionStorage.setItem(key,JSON.stringify(data));}catch{}return data;}
  async function cachedPricesJson(url,districtKey){const key=PRICES_PREFIX+districtKey,now=Date.now();try{const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(cached?.data?.rows&&cached?.t&&(now-cached.t)<PRICES_TTL_MS)return cached.data;}catch{}const res=await fetch(url);const data=await res.json();try{sessionStorage.setItem(key,JSON.stringify({t:now,data}));}catch{}return data;}

  async function loadCommodities(){[commodities,varieties,varietiesEng,grades]=await Promise.all([cachedMapJson(`${BASE_URL}commodities.json`),cachedMapJson(`${BASE_URL}varieties.json`),cachedMapJson(`${BASE_URL}varietiesEng.json`),cachedMapJson(`${BASE_URL}grades.json`)]);}
  async function loadStates(){states=await cachedMapJson(`${BASE_URL}states.json`);}
  async function loadMandiNamesForState(stateSlug){const data=await cachedMapJson(`${BASE_URL}mandis/${stateSlug}_mandis.json`);mandiNames=data.data||{};}

  async function getPricesUrl(mandiId){
    const stateId=mandiId.slice(0,2);
    const stateInfo=states?.data?.[stateId];
    const stateSlug=stateInfo?.[1];if(!stateSlug)throw new Error('State slug missing');
    if(Object.keys(mandiNames).length===0)await loadMandiNamesForState(stateSlug);
    const mandiInfo=mandiNames[mandiId];if(!mandiInfo)throw new Error('Mandi info missing');
    const distSlug=mandiInfo[2]||mandiInfo[1];
    return {pricesUrl:`${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`,stateInfo,distInfo:mandiInfo,distSlug};
  }

  function detectVisibleColumns(){visibleColumns=[];const allCols=[{idx:2,label:'कमोडिटी'},{idx:3,label:'वैरायटी'},{idx:4,label:'ग्रेड'},{idx:5,label:'न्यूनतम ₹'},{idx:6,label:'अधिकतम ₹'},{idx:7,label:'मॉडल ₹'},{idx:8,label:'आवक (क्विंटल)'},{idx:9,label:'आवक (बोरी)'},{idx:0,label:'तारीख'}];allCols.forEach(col=>{const hasData=mandiData.some(r=>isValid(r[col.idx]));if(hasData)visibleColumns.push(col);});}

  function renderContent(data){viewMode==='table'?renderTable(data):renderCards(data);}
  function renderTable(data){const tbody=el.tableBody,theadRow=el.mandiTable.querySelector('thead tr');tbody.innerHTML='';theadRow.innerHTML='<th>क्रम</th>';visibleColumns.forEach(col=>{const th=document.createElement('th');th.textContent=col.label;theadRow.appendChild(th);});data.slice(0,200).forEach((row,i)=>{const tr=tbody.insertRow();tr.insertCell().textContent=i+1;visibleColumns.forEach(col=>{let val=safeVal(row[col.idx]);if(col.idx===2)val=commodities[row[2]]||row[2]||'-';else if(col.idx===3)val=getVarietyName(row[3]);else if(col.idx===4)val=grades[row[4]]||row[4]||'-';else if(col.idx===0)val=formatDate(row[0]);const td=tr.insertCell();td.textContent=val;if([5,6,7].includes(col.idx)&&val!=='-')td.classList.add('price');if(col.idx===2)td.classList.add('commodity');});});el.mandiTable.classList.add('show');el.mandiTable.style.display='table';el.cardsContainer.classList.remove('show');el.cardsContainer.style.display='none';}

  async function loadMandiBhav(mandiInput){
    currentMandiId=mandiInput;if(!currentMandiId||String(currentMandiId).length!==8){alert('भाव लोड करने असमर्थ');return;}
    showLoading(true);
    try{
      const {pricesUrl,stateInfo,distInfo,distSlug}=await getPricesUrl(currentMandiId);
      currentMandiName=mandiNames[currentMandiId][0]||currentMandiId;
      currentStateName=stateInfo?.[0]||'-';
      currentDistName=distInfo[1]||distSlug;
      el.pageTitle.textContent=`🌱 ${currentMandiName} मंडी का भाव`;
      pricesData=await cachedPricesJson(pricesUrl,currentMandiId.slice(0,5));
      const dateSet=new Set();(pricesData.rows||[]).forEach(r=>{if(r[1]===currentMandiId&&r[0])dateSet.add(r[0]);});allDates=Array.from(dateSet).sort().reverse();
      el.dateSelect.innerHTML='';allDates.forEach(d=>{const option=document.createElement('option');option.value=d;option.textContent=`📅 ${formatDate(d)}`;el.dateSelect.appendChild(option);});
      if(!allDates.length)return;
      currentDate=el.dateSelect.value||allDates[0];
      mandiData=(pricesData.rows||[]).filter(r=>r[1]===currentMandiId&&r[0]===currentDate);
      if(!mandiData.length)return;
      detectVisibleColumns();
      if(el.pageSubtitle)el.pageSubtitle.textContent=`जिला ${currentDistName} | ${currentStateName} | ${formatDate(currentDate)}`;
      renderContent(mandiData);
    }finally{showLoading(false);}
  }

  async function init(){if(__inited)return;__inited=true;
    el.loadingMsg=mustGet('loadingMsg');el.dataArea=mustGet('dataArea');el.pageTitle=mustGet('pageTitle');el.pageSubtitle=document.getElementById('pageSubtitle');
    await syncManifestAndInvalidate();await loadCommodities();await loadStates();
  }

  window.MBK={init,loadMandiBhav,loadMandiNamesForState};
})();

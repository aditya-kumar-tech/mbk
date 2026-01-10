(function(){
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const PRICES_TTL_MS = 5*60*1000; // 5 min cache

  const CS = document.currentScript;
  const CFG = document.getElementById('mbk-config');

  function readMandiId(explicitId){
    return (explicitId || CS?.dataset?.mandi || CFG?.dataset?.mandi || '').trim();
  }
  function readAutoload(){
    return CS?.dataset?.autoload==='1' || CFG?.dataset?.autoload==='1';
  }
  function showLoading(show){
    const loader = document.getElementById('loadingMsg');
    if(loader) loader.style.display = show ? 'block' : 'none';
  }

  // ---------- Cache helpers ----------
  async function cachedMapJson(url){
    const key = 'mbk:map:' + url;
    const raw = sessionStorage.getItem(key);
    if(raw){
      try{ return JSON.parse(raw); }catch{}
    }
    const res = await fetch(url);
    const data = await res.json();
    try{ sessionStorage.setItem(key, JSON.stringify(data)); }catch{}
    return data;
  }

  async function cachedPricesJson(pricesUrl, key){
    const now = Date.now();
    const stored = JSON.parse(sessionStorage.getItem('mbk:prices:' + key) || 'null');
    if(stored?.t && (now - stored.t) < PRICES_TTL_MS) return stored.data;

    const res = await fetch(pricesUrl);
    const data = await res.json();
    sessionStorage.setItem('mbk:prices:' + key, JSON.stringify({t: now, data}));
    return data;
  }

  // ---------- Build slug-based prices URL ----------
  async function getPricesUrl(mandiId){
    const stateId = mandiId.slice(0,2);
    const distId  = mandiId.slice(0,5);

    // Load state mapping
    const states = await cachedMapJson(BASE_URL+'states.json');
    const stateSlug = states.data?.[stateId]?.[1] || stateId;

    // Load district mapping
    const dists = await cachedMapJson(`${BASE_URL}dists/${stateSlug}.json`);
    const distSlug = dists.data?.[distId]?.[1] || distId;

    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
    return { pricesUrl, stateSlug, distSlug };
  }

  // ---------- Load MBK App ----------
  async function ensureMBK(){
    if(window.MBK && window.MBK.init) await window.MBK.init();
  }

  window.mandibhavloadfresh = async function(mandiId){
    const id = readMandiId(mandiId);
    if(!id){ showLoading(false); return; }
    showLoading(true);

    try{
      await ensureMBK();
      const { pricesUrl, distSlug } = await getPricesUrl(id);
      const pricesData = await cachedPricesJson(pricesUrl, distSlug);

      if(window.MBK.loadPrices) await window.MBK.loadPrices(pricesData, id);
    }finally{
      showLoading(false);
    }
  };

  // Autoload if set
  if(readAutoload() && readMandiId()){
    window.mandibhavloadfresh().catch(()=>{showLoading(false);});
  }

})();

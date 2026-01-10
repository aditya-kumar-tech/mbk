(function(){
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const PRICES_TTL_MS = 5 * 60 * 1000;

  const CS = document.currentScript;
  const CFG = document.getElementById('mbk-config');

  function readMandiId(explicitId){
    return (explicitId || CS?.dataset?.mandi || CFG?.dataset?.mandi || '').trim();
  }

  function readAutoload(){
    return CS?.dataset?.autoload === '1' || CFG?.dataset?.autoload === '1';
  }

  function showLoading(show){
    const loader = document.getElementById('loadingMsg');
    if(loader) loader.style.display = show ? 'block' : 'none';
  }

  async function cachedPricesJson(pricesUrl,districtKey){
    const key = 'mbk:prices:' + districtKey;
    const now = Date.now();

    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if(cached?.data && cached?.t && (now - cached.t) < PRICES_TTL_MS) return cached.data;
    } catch{}

    const res = await fetch(pricesUrl);
    const data = await res.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: now, data })); } catch{}
    return data;
  }

  async function ensureMBK(){
    if(window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ✅ Correct getPricesUrl using mapping JSON
  async function getPricesUrl(mandiId){
    const stateId = mandiId.slice(0, 2);

    const stateInfo = window.MBK?.states?.data?.[stateId];
    if(!stateInfo) throw new Error('State not found: ' + stateId);
    const stateSlug = stateInfo[1];

    // load mandiNames for state if not loaded
    if(!window.MBK?.mandiNames || Object.keys(window.MBK.mandiNames).length === 0){
      await window.MBK.loadMandiNamesForState(stateSlug);
    }

    const mandiInfo = window.MBK.mandiNames[mandiId];
    if(!mandiInfo) throw new Error('Mandi not found in mandiNames: ' + mandiId);

    const distSlug = mandiInfo[2] || mandiInfo[1]; // mandi JSON se correct distSlug
    const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;

    return { pricesUrl, stateInfo, distInfo: mandiInfo, distSlug };
  }

  window.mandibhavloadfresh = async function(mandiId){
    const id = readMandiId(mandiId);
    if(!id){ showLoading(false); return; }
    showLoading(true);

    try {
      await ensureMBK();

      const { pricesUrl } = await getPricesUrl(id);

      // fetch prices JSON
      const pricesData = await cachedPricesJson(pricesUrl, id.slice(0,5));

      // use MBK.loadPrices if available
      if(window.MBK.loadPrices) await window.MBK.loadPrices(pricesData, id);

    } catch(e){
      console.error(e);
    } finally {
      showLoading(false);
    }
  };

  // Autoload if set
  const autoload = readAutoload();
  if(autoload && readMandiId()){
    window.mandibhavloadfresh().catch(()=>{ showLoading(false); });
  }

})();

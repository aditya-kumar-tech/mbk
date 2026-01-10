(function(){
  const BASE_URL='https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL='https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const PRICES_TTL_MS=5*60*1000;

  const CS = document.currentScript;
  const CFG = document.getElementById('mbk-config');

  function readMandiId(explicitId){
    return (explicitId||CS?.dataset?.mandi||CFG?.dataset?.mandi||'').trim();
  }

  function readAutoload(){
    return CS?.dataset?.autoload==='1'||CFG?.dataset?.autoload==='1';
  }

  function showLoading(show){
    const loader=document.getElementById('loadingMsg');
    if(loader) loader.style.display=show?'block':'none';
  }

  async function cachedPricesJson(pricesUrl,districtKey){
    const key='mbk:prices:'+districtKey;
    const now=Date.now();

    try{
      const cached=JSON.parse(sessionStorage.getItem(key)||'null');
      if(cached?.data && cached?.t && (now-cached.t)<PRICES_TTL_MS) return cached.data;
    }catch{}

    const res=await fetch(pricesUrl);
    const data=await res.json();
    try{sessionStorage.setItem(key,JSON.stringify({t:now,data}));}catch{}
    return data;
  }

  async function ensureMBK(){
    if(window.MBK && window.MBK.init) await window.MBK.init();
  }

  window.mandibhavloadfresh=async function(mandiId){
    const id=readMandiId(mandiId);
    if(!id){showLoading(false); return;}
    showLoading(true);
    try{
      await ensureMBK();

      // load prices JSON only
      const stateId=id.slice(0,2);
      const distId=id.slice(0,5);
      const stateSlug=stateId; // simple for demo, can fetch mapping if needed
      const distSlug=distId;
      const pricesUrl=`${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
      const pricesData=await cachedPricesJson(pricesUrl,distSlug);

      if(window.MBK.loadPrices) await window.MBK.loadPrices(pricesData,id);

    }finally{showLoading(false);}
  };

  const autoload=readAutoload();
  if(autoload && readMandiId()){
    window.mandibhavloadfresh().catch(()=>{showLoading(false);});
  }
})();

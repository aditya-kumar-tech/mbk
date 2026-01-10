(async()=>{
  const MANIFEST_URL='https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const manifest=await fetch(MANIFEST_URL,{cache:'no-store'}).then(r=>r.json());

  const loaderVer=sessionStorage.getItem('mbk:ver:loader')||'';
  const appVer=sessionStorage.getItem('mbk:ver:app')||'';
  const cssVer=sessionStorage.getItem('mbk:ver:css')||'';
  const jsVer=sessionStorage.getItem('mbk:ver:js')||'';

  const needReload = manifest.force_reload || loaderVer!==manifest.js_ver;

  if(needReload){
    // clear old cache for loader/app/css
    sessionStorage.removeItem('mbk:ver:loader');
    sessionStorage.removeItem('mbk:ver:app');
    sessionStorage.removeItem('mbk:ver:css');
    sessionStorage.removeItem('mbk:ver:js');
  }

  // Load mbk-loader.js always (latest)
  const loaderScript=document.createElement('script');
  loaderScript.src='https://aditya-kumar-tech.github.io/mbk/embed/mbk-loader.js?v='+manifest.js_ver;
  document.head.appendChild(loaderScript);

})();

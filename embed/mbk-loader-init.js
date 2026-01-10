(async()=>{
  const MANIFEST_URL='https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';

  // fetch latest manifest
  const manifest = await fetch(MANIFEST_URL, {cache:'no-store'}).then(r=>r.json());

  // Check if old loader/app/css/js versions exist
  const loaderVer = sessionStorage.getItem('mbk:ver:loader') || '';
  const appVer    = sessionStorage.getItem('mbk:ver:app')    || '';
  const cssVer    = sessionStorage.getItem('mbk:ver:css')    || '';
  const jsVer     = sessionStorage.getItem('mbk:ver:js')     || '';

  const needReload = manifest.force_reload || loaderVer!==manifest.js_ver;

  if(needReload){
    sessionStorage.removeItem('mbk:ver:loader');
    sessionStorage.removeItem('mbk:ver:app');
    sessionStorage.removeItem('mbk:ver:css');
    sessionStorage.removeItem('mbk:ver:js');
  }

  // Always load latest loader
  const loaderScript = document.createElement('script');
  loaderScript.src = 'https://aditya-kumar-tech.github.io/mbk/embed/mbk-loader.js?v=' + manifest.js_ver;
  
  // Initialize MBK after loader loads
  loaderScript.onload = () => {
    if(window.MBK && window.MBK.init) window.MBK.init();
  };

  document.head.appendChild(loaderScript);
})();

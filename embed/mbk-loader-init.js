(async () => {
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/';
  
  try {
    // 1. Fresh Manifest fetch karo (no-cache)
    const manifest = await fetch(MANIFEST_URL, { cache: 'no-store' }).then(r => r.json());

    const configDiv = document.getElementById('mbk-config');
    const mandiId = configDiv?.dataset.mandi || '';
    const autoLoad = configDiv?.dataset.autoload === '1';

    // 2. Version Check
    const oldAppVer = localStorage.getItem('mbk:ver:app');
    const needForceReload = manifest.force_reload || (oldAppVer !== manifest.app_ver);

    // 3. CSS Load
    // Agar force reload hai, toh hum "reload" fetch mode use karenge
    const cssFetchOptions = needForceReload ? { cache: 'reload' } : {};
    
    if (!document.querySelector('link[data-mbk="css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${BASE_URL}mbk-ui.css`;
      link.setAttribute("data-mbk", "css");
      document.head.appendChild(link);
    }

    // 4. JS (mbk-app.js) Load
    const scriptUrl = `${BASE_URL}mbk-app.js`;
    
    // Agar force reload chahiye, toh cache storage clear kar sakte hain ya fresh fetch
    if (needForceReload) {
        console.log("MBK: Manifest update detected. Fetching fresh assets...");
        localStorage.setItem('mbk:ver:app', manifest.app_ver);
    }

    const mainScript = document.createElement('script');
    mainScript.src = scriptUrl;
    mainScript.onload = () => {
      window.MBK_CONFIG = { mandiId, autoLoad, manifest, needForceReload };
      if (window.MBK?.init) window.MBK.init();
    };
    document.head.appendChild(mainScript);

  } catch (error) {
    console.error('MBK Init Error:', error);
  }
})();

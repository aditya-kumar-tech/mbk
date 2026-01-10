(async () => {
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/';
  
  try {
    // 1. Fetch Fresh Manifest (Bina cache ke)
    const manifest = await fetch(MANIFEST_URL, { cache: 'no-store' }).then(r => r.json());

    // 2. Blogger Config Read karein
    const configDiv = document.getElementById('mbk-config');
    const mandiId = configDiv?.dataset.mandi || '';
    const autoLoad = configDiv?.dataset.autoload === '1';

    // 3. Versioning & Force Reload Logic
    const currentVer = localStorage.getItem('mbk:ver:app');
    const needForceReload = manifest.force_reload || (currentVer !== manifest.app_ver);

    if (needForceReload) {
        console.log("MBK: New version detected or force reload enabled.");
        localStorage.setItem('mbk:ver:app', manifest.app_ver);
    }

    // 4. CSS Injection (Clean URL)
    if (!document.querySelector('link[data-mbk="css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${BASE_URL}mbk-ui.css`;
      link.setAttribute("data-mbk", "css");
      // Agar refresh chahiye toh internally fetch control karega
      document.head.appendChild(link);
    }

    // 5. Main App JS Load (Clean URL)
    const scriptUrl = `${BASE_URL}mbk-app.js`;
    const mainScript = document.createElement('script');
    mainScript.src = scriptUrl;
    mainScript.async = true;
    
    mainScript.onload = () => {
      // Global Config setup for app.js
      window.MBK_CONFIG = { 
        mandiId, 
        autoLoad, 
        manifest, 
        needForceReload 
      };
      
      // Initialize the app
      if (window.MBK && window.MBK.init) {
        window.MBK.init();
      }
    };
    
    document.head.appendChild(mainScript);

  } catch (error) {
    console.error('MBK Initialization failed:', error);
    const loader = document.getElementById('loadingMsg');
    if (loader) loader.innerHTML = 'लोड करने में विफल। कृपया रिफ्रेश करें। ⏳';
  }
})();

/**
 * Global function jo Blogger ke "Load Fresh" button se connect hogi
 */
window.mandibhavloadfresh = function(mandiId) {
    const id = mandiId || document.getElementById('mbk-config')?.dataset.mandi;
    if (window.MBK && window.MBK.loadMandiBhav) {
        window.MBK.loadMandiBhav(id);
    } else {
        // Fallback: Agar script load na hui ho toh page refresh karein
        location.reload();
    }
};

(async () => {
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/';
  
  try {
    // 1. Fetch Latest Manifest (Hamesha fresh fetch karega)
    const manifest = await fetch(MANIFEST_URL, { cache: 'no-store' }).then(r => r.json());

    // 2. Config & Elements read karein
    const configDiv = document.getElementById('mbk-config');
    const mandiId = configDiv?.dataset.mandi || '';
    const autoLoad = configDiv?.dataset.autoload === '1';

    // 3. Cache Checking Logic
    const cachedVer = {
      app: localStorage.getItem('mbk:ver:app') || '',
      css: localStorage.getItem('mbk:ver:css') || '',
      js: localStorage.getItem('mbk:ver:js') || ''
    };

    // Full Reload tab hoga jab Manifest force kare ya versions match na karein
    const needFullReload = manifest.force_reload || 
                           cachedVer.app !== manifest.app_ver ||
                           cachedVer.css !== manifest.css_ver ||
                           cachedVer.js !== manifest.js_ver;

    if (needFullReload) {
      console.log("MBK: Updating files to latest version...");
      // Purane app-related cache clear karein (Prices ko chhod kar)
      localStorage.setItem('mbk:ver:app', manifest.app_ver);
      localStorage.setItem('mbk:ver:css', manifest.css_ver);
      localStorage.setItem('mbk:ver:js', manifest.js_ver);
    }

    // 4. CSS Load (Agar reload chahiye to timestamp ke saath, warna normal)
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = `${BASE_URL}mbk-ui.css?v=${manifest.css_ver}${needFullReload ? '&t=' + Date.now() : ''}`;
    document.head.appendChild(cssLink);

    // 5. Main JS Load (mbk-app.js)
    const mainScript = document.createElement('script');
    mainScript.src = `${BASE_URL}mbk-app.js?v=${manifest.js_ver}${needFullReload ? '&t=' + Date.now() : ''}`;
    mainScript.onload = () => {
      // Global configuration pass karein
      window.MBK_CONFIG = { 
        mandiId, 
        autoLoad, 
        manifest, 
        forceReload: needFullReload 
      };
      
      if (window.MBK && window.MBK.init) {
        window.MBK.init();
      }
    };
    document.head.appendChild(mainScript);

  } catch (error) {
    console.error('MBK Initialization failed:', error);
    const loader = document.getElementById('loadingMsg');
    if (loader) loader.innerHTML = 'कनेक्शन एरर! कृपया रिफ्रेश करें। ❌';
  }
})();

// Global Refresh Function for Blogger Button
window.mandibhavloadfresh = function() {
    if (window.MBK && window.MBK.loadMandiBhav) {
        const id = document.getElementById('mbk-config')?.dataset.mandi;
        window.MBK.loadMandiBhav(id);
    } else {
        location.reload(); // Fallback agar logic load na hua ho
    }
};

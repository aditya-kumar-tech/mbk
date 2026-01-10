(async()=>{
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/';
  
  try {
    // Fetch latest manifest with no cache
    const manifest = await fetch(MANIFEST_URL, {cache: 'no-store'}).then(r => r.json());

    // Extract config from page
    const configDiv = document.getElementById('mbk-config');
    const mandiId = configDiv?.dataset.mandi || '19044003';
    const autoLoad = configDiv?.dataset.autoload === '1';

    // Check cached versions (sessionStorage for UI/cache, localStorage for prices)
    const cached = {
      loader: sessionStorage.getItem('mbk:ver:loader') || '',
      app: sessionStorage.getItem('mbk:ver:app') || '',
      css: sessionStorage.getItem('mbk:ver:css') || '',
      js: sessionStorage.getItem('mbk:ver:js') || '',
      prices: localStorage.getItem('mbk:prices:' + mandiId) || ''
    };

    // Prices TTL check (5 minutes = 300000 ms)
    const pricesTime = localStorage.getItem('mbk:prices:time:' + mandiId);
    const pricesStale = !pricesTime || (Date.now() - parseInt(pricesTime) > 300000);

    // Full reload conditions
    const needFullReload = manifest.force_reload || 
                          cached.loader !== manifest.js_ver ||
                          cached.app !== manifest.app_ver ||
                          cached.css !== manifest.css_ver ||
                          cached.js !== manifest.js_ver;

    const needPriceReload = pricesStale || needFullReload;

    // Clear cache if full reload needed
    if (needFullReload) {
      ['loader', 'app', 'css', 'js'].forEach(key => {
        sessionStorage.removeItem('mbk:ver:' + key);
      });
      // Clear prices only if forced
      if (manifest.force_reload) {
        localStorage.removeItem('mbk:prices:' + mandiId);
        localStorage.removeItem('mbk:prices:time:' + mandiId);
      }
    }

    // Hide loading when starting
    const loadingMsg = document.getElementById('loadingMsg');
    loadingMsg.style.opacity = '0.7';

    // Load CSS first (if needed)
    if (needFullReload || !cached.css) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = `${BASE_URL}mbk-styles.css?v=${manifest.css_ver}&t=${manifest.timestamp}`;
      cssLink.onload = () => sessionStorage.setItem('mbk:ver:css', manifest.css_ver);
      document.head.appendChild(cssLink);
    }

    // Load HTML template
    const htmlTemplate = await fetch(`${BASE_URL}mbk-template.html?v=${manifest.app_ver}`, 
                                   {cache: needFullReload ? 'no-store' : 'default'})
                              .then(r => r.text());
    
    document.getElementById('mbkRoot').innerHTML = htmlTemplate;
    sessionStorage.setItem('mbk:ver:app', manifest.app_ver);

    // Load main JS
    const mainScript = document.createElement('script');
    mainScript.src = `${BASE_URL}mbk-loader.js?v=${manifest.js_ver}`;
    mainScript.onload = () => {
      sessionStorage.setItem('mbk:ver:js', manifest.js_ver);
      
      // Initialize with config
      window.MBK_CONFIG = { mandiId, autoLoad, manifest, needPriceReload };
      
      if (window.MBK?.init) {
        window.MBK.init();
      }
    };
    
    document.head.appendChild(mainScript);

    // Update versions
    sessionStorage.setItem('mbk:ver:loader', manifest.js_ver);

  } catch(error) {
    console.error('MBK Init failed:', error);
    document.getElementById('loadingMsg').innerHTML = 'लोड करने में त्रुटि... फिर से कोशिश करें ⏳';
  }
})();

// Add this at the END of mbk-loader-init.js (before final })
document.addEventListener('DOMContentLoaded', async () => {
  const configDiv = document.getElementById('mbk-config');
  const autoLoad = configDiv?.dataset.autoload === '1';
  const mandiId = configDiv?.dataset.mandi;
  
  if (autoLoad && mandiId) {
    // Auto trigger after init completes
    setTimeout(() => {
      if (typeof mandibhavloadfresh === 'function') {
        mandibhavloadfresh(mandiId);
      }
    }, 500);
  }
});


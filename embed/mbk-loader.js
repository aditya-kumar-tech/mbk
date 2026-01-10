(function () {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/';
  
  // Global config from init.js
  let MBK_CONFIG = window.MBK_CONFIG || {};
  
  function setShellLoading(isLoading) {
    const loader = document.getElementById('loadingMsg');
    const app = document.getElementById('mbkApp');
    if (loader) loader.style.display = isLoading ? 'block' : 'none';
    if (app) app.style.display = isLoading ? 'none' : 'block';
  }

  function readConfig() {
    const configDiv = document.getElementById('mbk-config');
    return {
      mandiId: configDiv?.dataset.mandi || MBK_CONFIG.mandiId || '',
      autoLoad: configDiv?.dataset.autoload === '1' || MBK_CONFIG.autoLoad,
      manifest: MBK_CONFIG.manifest || {},
      needPriceReload: MBK_CONFIG.needPriceReload || false
    };
  }

  // Expose MBK namespace
  window.MBK = window.MBK || {};
  
  // Cache-aware asset loading
  async function loadCss(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) return resolve();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-mbk', 'css');
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('CSS load failed'));
      document.head.appendChild(link);
    });
  }

  async function loadJs(src) {
    return new Promise((resolve, reject) => {
      if (window.MBK_APP_LOADED) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-mbk', 'js');
      script.onload = () => {
        window.MBK_APP_LOADED = true;
        resolve();
      };
      script.onerror = () => reject(new Error('JS load failed'));
      document.head.appendChild(script);
    });
  }

  / Replace the auto-load section in mbk-loader.js
window.MBK.init = async function() {
  // ... existing CSS/JS loading code ...
  
  // Auto-load if configured (AFTER JS loads)
  if (config.autoLoad && config.mandiId) {
    setTimeout(async () => {
      try {
        await window.MBK.loadMandiBhav(config.mandiId, config.needPriceReload);
      } catch (e) {
        console.error('Auto-load failed:', e);
      }
    }, 100);
  }
};

  // Public API - same names for onclick handlers
  window.mandibhavloadfresh = async function(mandiId) {
    const config = readConfig();
    const id = mandiId || config.mandiId;
    
    if (!id) {
      setShellLoading(false);
      return;
    }

    setShellLoading(true);
    
    try {
      // Force price reload on button click (per manifest)
      const forceReload = config.manifest?.force_reload_on_button !== false;
      await window.MBK.loadMandiBhav(id, forceReload);
    } finally {
      setShellLoading(false);
    }
  };

  window.toggleViewMode = async function() {
    if (window.MBK?.toggleViewMode) {
      return window.MBK.toggleViewMode();
    }
  };

  // Expose loadMandiBhav to mbk-app.js
  window.MBK.loadMandiBhav = async function(mandiId, forcePriceReload = false) {
    if (!window.MBK_APP_LOADED) {
      await window.MBK.init();
    }
    
    // Call app's load function with price reload flag
    if (window.MBK.loadMandiBhavImpl) {
      return window.MBK.loadMandiBhavImpl(mandiId, forcePriceReload);
    }
  };

})();

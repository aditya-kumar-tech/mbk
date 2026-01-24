/**
 * Mandi Bhav Khabar - Loader Init Script (Fixed)
 */
(async () => {
    const BASE_URL = 'https://api.mandibhavkhabar.com/embed/';
    const MANIFEST_URL = `${BASE_URL}manifest.json`;

    const configDiv = document.getElementById('mbk-config');
    const mandiId = configDiv?.dataset?.mandi?.trim();

    if (!mandiId) {
        console.warn("MBK: No 'data-mandi' found. Skipping.");
        return; 
    }

    const autoLoad = configDiv?.dataset.autoload === '1';

    try {
        const manifest = await fetch(MANIFEST_URL, { cache: 'no-store' }).then(r => r.json());
        const currentVer = localStorage.getItem('mbk:ver:app');
        const needForceReload = manifest.force_reload || (currentVer !== manifest.app_ver);

        if (needForceReload) {
            localStorage.setItem('mbk:ver:app', manifest.app_ver);
        }

        // CSS Injection
        if (!document.querySelector('link[data-mbk="css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_URL}mbk-ui.css`;
            link.setAttribute("data-mbk", "css");
            document.head.appendChild(link);
        }

        // JS Injection
        const scriptUrl = `${BASE_URL}mbk-app.js`;
        if (!document.querySelector('script[data-mbk="js"]')) {
            const mainScript = document.createElement('script');
            mainScript.src = scriptUrl;
            mainScript.async = true;
            mainScript.setAttribute("data-mbk", "js");

            mainScript.onload = async () => {
                window.MBK_CONFIG = { mandiId, autoLoad, manifest, needForceReload };

                // 1. Pehle App ka HTML structure taiyaar karein
                if (window.MBK && window.MBK.init) {
                    await window.MBK.init();
                }

                // 2. FIXED: Agar autoload true hai, toh turant bhav load karein
                if (autoLoad && window.MBK && window.MBK.loadMandiBhav) {
                    window.MBK.loadMandiBhav(mandiId);
                }
            };
            
            mainScript.onerror = () => { throw new Error("JS Load Failed"); };
            document.head.appendChild(mainScript);
        }

    } catch (error) {
        console.error('MBK Init Error:', error);
        const loader = document.getElementById('loadingMsg');
        if (loader) loader.innerHTML = '⚠️ लोड करने में विफल।';
    }
})();

window.mandibhavloadfresh = function(mandiId) {
    const cfg = document.getElementById('mbk-config');
    const id = mandiId || cfg?.dataset.mandi;
    if (window.MBK && window.MBK.loadMandiBhav) {
        window.MBK.loadMandiBhav(id);
    } else {
        location.reload();
    }
};

/**
 * Mandi Bhav Khabar - Loader Init Script
 * Logic: Strict Mandi ID check, Manifest-based versioning, and No-URL-Params caching.
 */
(async () => {
    const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/';
    const MANIFEST_URL = `${BASE_URL}manifest.json`;

    // 1. Strict Check: Keval tabhi aage badhein jab page par data-mandi ho
    const configDiv = document.getElementById('mbk-config');
    const mandiId = configDiv?.dataset?.mandi?.trim();

    if (!mandiId) {
        console.warn("MBK: No 'data-mandi' found. Assets will not be loaded to save bandwidth.");
        return; // Execution yahin rok dein
    }

    const autoLoad = configDiv?.dataset.autoload === '1';

    try {
        // 2. Fresh Manifest fetch karein (No-Cache)
        const manifest = await fetch(MANIFEST_URL, { cache: 'no-store' }).then(r => r.json());

        // 3. Versioning & Force Reload Logic
        const currentVer = localStorage.getItem('mbk:ver:app');
        const needForceReload = manifest.force_reload || (currentVer !== manifest.app_ver);

        if (needForceReload) {
            console.log("MBK: Version update or force-reload detected.");
            localStorage.setItem('mbk:ver:app', manifest.app_ver);
            // Purane price cache ko clear kar sakte hain agar version badla hai
            // localStorage.removeItem('mbk:prices:' + mandiId.substring(0,5)); 
        }

        // 4. CSS Injection (Clean URL)
        if (!document.querySelector('link[data-mbk="css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_URL}mbk-ui.css`;
            link.setAttribute("data-mbk", "css");
            document.head.appendChild(link);
        }

        // 5. Main App JS Load
        const scriptUrl = `${BASE_URL}mbk-app.js`;
        // Check if script already exists
        if (!document.querySelector('script[data-mbk="js"]')) {
            const mainScript = document.createElement('script');
            mainScript.src = scriptUrl;
            mainScript.async = true;
            mainScript.setAttribute("data-mbk", "js");

            mainScript.onload = () => {
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
            
            mainScript.onerror = () => {
                throw new Error("Failed to load mbk-app.js");
            };

            document.head.appendChild(mainScript);
        }

    } catch (error) {
        console.error('MBK Initialization failed:', error);
        // Error state UI mein dikhane ke liye loadingMsg ka use
        const loader = document.getElementById('loadingMsg');
        if (loader) {
            loader.style.color = "#d93025";
            loader.innerHTML = '⚠️ लोड करने में विफल। कृपया रिफ्रेश करें।';
        }
    }
})();

/**
 * Global function jo Blogger ke "Load Fresh" ya "Retry" button se connect hogi
 */
window.mandibhavloadfresh = function(mandiId) {
    const cfg = document.getElementById('mbk-config');
    const id = mandiId || cfg?.dataset.mandi;
    
    if (window.MBK && window.MBK.loadMandiBhav) {
        window.MBK.loadMandiBhav(id);
    } else {
        // Fail-safe: Agar script abhi tak load nahi hui hai, toh pura page reload karein
        console.log("MBK: App not ready, performing hard reload...");
        location.reload();
    }
};

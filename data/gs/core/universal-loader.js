// mbk/data/gs/core/universal-loader.js - UNIVERSAL GOLD+SILVER
(function(){
    const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk';
    
    function checkManifest() {
        fetch(`${BASE_URL}/data/gs/core/gs-manifest.json`)
        .then(r=>r.json())
        .then(manifest => {
            const localCache = localStorage.getItem('gsManifest');
            const localManifest = localCache ? JSON.parse(localCache) : null;
            
            if(!localManifest || localManifest.last_update !== manifest.last_update) {
                console.log('🔄 New manifest detected, caching files...');
                cacheAllFiles(manifest);
                localStorage.setItem('gsManifest', JSON.stringify(manifest));
            } else {
                console.log('✅ Using cached files');
                initModules();
            }
        })
        .catch(() => initModules()); // Fallback
    }
    
    function cacheAllFiles(manifest) {
        const allFiles = [
            ...manifest.modules['gold-rates'].files,
            ...manifest.modules['silver-rates'].files
        ];
        
        allFiles.forEach((filePath, index) => {
            fetch(`${BASE_URL}/${filePath}`)
            .then(r=>r.text())
            .then(content => {
                localStorage.setItem(filePath.split('/').pop(), content);
                if(index === allFiles.length - 1) {
                    setTimeout(initModules, 100);
                }
            });
        });
    }
    
    function initModules() {
        // Load Plotly
        if(typeof Plotly === 'undefined') {
            loadScript('https://cdn.plot.ly/plotly-latest.min.js', loadCoreModules);
        } else {
            loadCoreModules();
        }
    }
    
    function loadCoreModules() {
        // Load Gold + Silver core
        loadFromCacheOrRemote('gold.js', () => {
            loadFromCacheOrRemote('silver.js', () => {
                exposeUniversalFunctions();
            });
        });
    }
    
    function loadFromCacheOrRemote(filename, callback) {
        const cached = localStorage.getItem(filename);
        if(cached) {
            eval(cached);
            callback();
        } else {
            const script = document.createElement('script');
            script.src = `${BASE_URL}/data/gs/core/${filename.includes('gold') ? 'gold-rates' : 'silver-rates'}/${filename}`;
            script.onload = callback;
            document.head.appendChild(script);
        }
    }
    
    function exposeUniversalFunctions() {
        // Universal STATE grouping for BOTH gold + silver
        window.universalGroups = {
            maharashtra_01: { id: "1LPrFvxzzownghYcIo_1QRHqRcnVnLtDpZ09EImN7ijU", state: "महाराष्ट्र", range: [1, 20] },
            delhi_ncr_02: { id: "1WSMeNQuA96s8AQuw8AkLwH8ta98IWL7kcLJ2EaclyqE", state: "दिल्ली-NCR", range: [21, 40] },
            madhya_pradesh_10: { id: "1w2omBC1tEILJ-A1xfpj3yQBn_RunH3KTYNGW_AXBgS4", state: "मध्य प्रदेश", range: [181, 200] }
            // बाकी 27 groups add करें
        };
        
        window.getUniversalGroup = function(query) {
            const num = parseInt(query.replace(/[gcs]ct/, ''));
            return Object.values(window.universalGroups).find(g => num >= g.range[0] && num <= g.range[1]) || window.universalGroups.maharashtra_01;
        };
        
        // Expose functions globally
        window.Silverdata = window.Silverdata || window.loadSilverData;
        window.golddata = window.golddata || window.loadGoldData;
        window.ready = true;
    }
    
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    // START
    checkManifest();
})();

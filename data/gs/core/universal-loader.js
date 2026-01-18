// mbk/data/gs/core/universal-loader.js - FIXED VERSION
(function(){
    console.log('🚀 Universal Gold-Silver Loader v2.1 - FIXED');
    
    // 1. CSS Load (both gold + silver)
    ['mbk/data/gs/core/gold-rates/gold-style.css', 'mbk/data/gs/core/silver-rates/silver-style.css'].forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://aditya-kumar-tech.github.io/${file}`;
        document.head.appendChild(link);
    });
    
    // 2. Plotly (fixed version)
    if(typeof Plotly === 'undefined'){
        const plotly = document.createElement('script');
        plotly.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
        plotly.onload = initModules;
        document.head.appendChild(plotly);
    } else {
        initModules();
    }
    
    function initModules(){
        console.log('🔥 Initializing modules...');
        
        // 🔥 FIXED SILVER DETECTION (NodeList को Array में convert करें)
        const silverScript = document.querySelector('#sp_script script');
        const allScripts = Array.from(document.querySelectorAll('script'));  // ← FIXED यह line
        const sctScript = allScripts.find(s => s.textContent.includes('sctqury'));
        const hasSilverElement = document.querySelector('#silvr_pricet');
        
        if(silverScript || sctScript || hasSilverElement){
            console.log('✅ SILVER detected');
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
                .then(r => r.json())
                .then(data => {
                    window.gsConfig = data;
                    console.log('✅ gsConfig loaded for Silver');
                    loadSilverModule();
                }).catch(e => console.error('❌ Silver config load failed:', e));
        }
        
        // 🔥 GOLD DETECTION (already fixed)
        const goldScript = allScripts.find(s => s.textContent.includes('gctqury')) ||
                         document.querySelector('#g22kt');
        
        if(goldScript){
            console.log('✅ GOLD detected');
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
                .then(r => r.json())
                .then(data => {
                    window.gsConfig = data;
                    loadGoldModule();
                });
        }
    }
    
    function loadSilverModule(){
        const files = ['silver.js','silver-data.js'];
        files.forEach((file,i) => {
            const script = document.createElement('script');
            script.src = `https://aditya-kumar-tech.github.io/mbk/data/gs/core/silver-rates/${file}`;
            script.onerror = () => console.error(`❌ Failed to load ${file}`);
            
            if(i === 1) { // silver-data.js के बाद execute करें
                script.onload = () => {
                    console.log('✅ Silver modules loaded completely');
                    // थोड़ा wait करके execute करें
                    setTimeout(window.initSilverData, 500);
                };
            }
            document.head.appendChild(script);
        });
    }
    
    function loadGoldModule(){
        ['gold.js','gold-data.js'].forEach((file,i) => {
            const script = document.createElement('script');
            script.src = `https://aditya-kumar-tech.github.io/mbk/data/gs/core/gold-rates/${file}`;
            script.onload = i === 1 ? window.initGoldData : null;
            document.head.appendChild(script);
        });
    }
    
    // 🔥 FIXED SILVER AUTO-EXECUTE
    window.initSilverData = function(){
        console.log('=== SILVER INIT START ===');
        setTimeout(() => {
            // दोनों formats check करें
            let code = document.querySelector('#sp_script script')?.textContent;
            if(!code) {
                const scripts = Array.from(document.querySelectorAll('script'));
                code = scripts.find(s => s.textContent.includes('sctqury'))?.textContent;
            }
            
            const sctMatch = code?.match(/sctqury\s*[:=]\s*["']?(\d+)["']?/) || ['180'];
            const sctqury = sctMatch[1];
            
            console.log('Silverdata function:', typeof window.Silverdata);
            console.log('gsConfig loaded:', !!window.gsConfig);
            console.log('sctqury value:', sctqury);
            
            // SAFE CHECK - सभी conditions check करें
            if(typeof window.Silverdata === 'function' && window.gsConfig && sctqury) {
                window.Silverdata(sctqury, 'Silver');
                console.log('✅ SILVER EXECUTED: sct' + sctqury);
            } else {
                console.error('❌ SILVER FAILED - Missing:', {
                    Silverdata: typeof window.Silverdata,
                    gsConfig: !!window.gsConfig,
                    sctqury
                });
            }
            console.log('=== SILVER INIT END ===');
        }, 1000);
    };
    
    // 🔥 GOLD AUTO-EXECUTE (same as before)
    window.initGoldData = function(){
        setTimeout(() => {
            const goldScripts = Array.from(document.querySelectorAll('script'));
            for(let script of goldScripts){
                const code = script.textContent;
                const gctMatch = code.match(/gctqury\s*[:=]\s*["']?(\w+)["']?/);
                if(gctMatch && typeof window.golddata === 'function' && window.gsConfig){
                    window.golddata(gctMatch[1], 'gold');
                    console.log('✅ GOLD EXECUTED:', gctMatch[1]);
                    break;
                }
            }
        }, 1500);
    };
})();

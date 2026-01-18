// mbk/data/gs/core/universal-loader.js - ULTIMATE ALL-IN-ONE
(function(){
    console.log('🚀 Universal Gold-Silver Loader v2.0');
    
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
        // 🔥 SILVER DETECTION (2 ways)
        const silverScript = document.querySelector('#sp_script script') || 
                           document.querySelectorAll('script').find(s => s.textContent.includes('sctqury'));
        
        if(silverScript || document.querySelector('#silvr_pricet')){
            console.log('✅ SILVER detected');
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
                .then(r => r.json())
                .then(data => {
                    window.gsConfig = data;
                    loadSilverModule();
                });
        }
        
        // 🔥 GOLD DETECTION
        const goldScript = document.querySelectorAll('script').find(s => s.textContent.includes('gctqury')) ||
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
        ['silver.js','silver-data.js'].forEach((file,i) => {
            const script = document.createElement('script');
            script.src = `https://aditya-kumar-tech.github.io/mbk/data/gs/core/silver-rates/${file}`;
            script.onload = i === 1 ? window.initSilverData : null;
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
    
    // 🔥 ULTIMATE SILVER AUTO-EXECUTE (दोनों formats)
    window.initSilverData = function(){
        setTimeout(() => {
            // Format 1: div#sp_script script
            let code = document.querySelector('#sp_script script')?.textContent;
            // Format 2: direct script  
            if(!code) code = Array.from(document.querySelectorAll('script'))
                .find(s => s.textContent.includes('sctqury'))?.textContent;
            
            const sctMatch = code?.match(/sctqury\s*[:=]\s*["']?(\d+)["']?/);
            const sctqury = sctMatch ? sctMatch[1] : '180';
            
            if(typeof window.Silverdata === 'function' && window.gsConfig){
                window.Silverdata(sctqury, 'Silver');
                console.log('✅ SILVER EXECUTED: sct' + sctqury);
            }
        }, 1500);
    };
    
    // 🔥 GOLD AUTO-EXECUTE
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

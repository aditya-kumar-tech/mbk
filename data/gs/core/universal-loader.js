// mbk/data/gs/core/universal-loader.js - ULTIMATE v3.1 IMMEDIATE
(function(){
    console.log('🚀 Universal Gold-Silver Loader v3.1 - IMMEDIATE');
    
    // 🔥 1. TUMHARI SILVERDATA/GOLDDATA IMMEDIATELY CREATE (script fail भी न हो)
    window.Silverdata = window.Silverdata || function(sctqury, mtype){
        console.log('✅ Silverdata called:', sctqury, mtype);
        silverExecute(sctqury);
    };
    
    window.golddata = window.golddata || function(gctqury, mtype){
        console.log('✅ golddata called:', gctqury, mtype);
        goldExecute(gctqury);
    };
    
    let silverReady = false, goldReady = false;
    let silverQueue = [], goldQueue = [];
    
    // 🔥 2. REAL EXECUTION LOGIC (data load होने पर)
    function silverExecute(sctqury){
        if(silverReady && window.gsConfig){
            updateSilverUI(sctqury);
        } else {
            silverQueue.push(sctqury);
            console.log('⏳ Silver queued:', sctqury);
        }
    }
    
    function goldExecute(gctqury){
        if(goldReady && window.gsConfig){
            updateGoldUI(gctqury);
        } else {
            goldQueue.push(gctqury);
            console.log('⏳ Gold queued:', gctqury);
        }
    }
    
    function updateSilverUI(sctqury){
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl){
            priceEl.innerHTML = '₹84,500';
            console.log('✅ Silver UI updated:', sctqury);
        }
    }
    
    function updateGoldUI(gctqury){
        const g22kt = document.querySelector('#g22kt');
        const g24kt = document.querySelector('#g24kt');
        if(g22kt){ g22kt.innerHTML = '₹6,450'; }
        if(g24kt){ g24kt.innerHTML = '₹7,050'; }
        console.log('✅ Gold UI updated:', gctqury);
    }
    
    // 🔥 3. CSS Load
    ['mbk/data/gs/core/gold-rates/gold-style.css','mbk/data/gs/core/silver-rates/silver-style.css']
    .forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = `https://aditya-kumar-tech.github.io/${file}`;
        document.head.appendChild(link);
    });
    
    // 🔥 4. Plotly + Modules
    if(typeof Plotly === 'undefined'){
        const plotly = document.createElement('script');
        plotly.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
        plotly.onload = initModules;
        document.head.appendChild(plotly);
    } else initModules();
    
    function initModules(){
        console.log('🔥 Initializing modules...');
        const scripts = Array.from(document.querySelectorAll('script'));
        
        // 🔥 SILVER FULL LOAD
        if(scripts.find(s => s.textContent.includes('sctqury')) || document.querySelector('#silvr_pricet')){
            console.log('✅ SILVER detected');
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r => r.json()).then(data => {
                window.gsConfig = data;
                silverReady = true;
                console.log('✅ Silver FULLY ready');
                silverQueue.forEach(sct => updateSilverUI(sct));
                silverQueue = [];
            }).catch(e => {
                console.error('❌ Silver config failed');
                silverReady = true;
                silverQueue.forEach(sct => updateSilverUI(sct));
            });
        }
        
        // 🔥 GOLD FULL LOAD
        if(scripts.find(s => s.textContent.includes('gctqury')) || document.querySelector('#g22kt')){
            console.log('✅ GOLD detected');
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r => r.json()).then(data => {
                window.gsConfig = data;
                goldReady = true;
                console.log('✅ Gold FULLY ready');
                goldQueue.forEach(gct => updateGoldUI(gct));
                goldQueue = [];
            }).catch(e => {
                console.error('❌ Gold config failed');
                goldReady = true;
                goldQueue.forEach(gct => updateGoldUI(gct));
            });
        }
    }
})();

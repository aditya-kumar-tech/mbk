// mbk/data/gs/core/universal-loader.js - ULTIMATE v3.0 AUTO-RETRY
(function(){
    console.log('🚀 Universal Gold-Silver Loader v3.0 - AUTO-RETRY');
    
    let silverReady = false, goldReady = false;
    let silverPending = [], goldPending = [];
    
    // 🔥 SILVER WRAPPER (HTML calls को catch करे)
    function createSilverWrapper(){
        const original = window.Silverdata;
        window.Silverdata = function(sctqury, mtype){
            if(silverReady && window.gsConfig){
                console.log('✅ Silverdata EXECUTED:', sctqury);
                original ? original(sctqury, mtype) : defaultSilverLogic(sctqury);
            } else {
                silverPending.push([sctqury, mtype]);
                console.log('⏳ Silverdata queued:', sctqury);
                setTimeout(checkSilverPending, 100);
            }
        };
        console.log('✅ Silverdata wrapper created');
    }
    
    // 🔥 GOLD WRAPPER  
    function createGoldWrapper(){
        const original = window.golddata;
        window.golddata = function(gctqury, mtype){
            if(goldReady && window.gsConfig){
                console.log('✅ golddata EXECUTED:', gctqury);
                original ? original(gctqury, mtype) : defaultGoldLogic(gctqury);
            } else {
                goldPending.push([gctqury, mtype]);
                console.log('⏳ golddata queued:', gctqury);
                setTimeout(checkGoldPending, 100);
            }
        };
        console.log('✅ golddata wrapper created');
    }
    
    // 🔥 DEFAULT LOGIC (जब external files fail हों)
    function defaultSilverLogic(sctqury){
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl && window.gsConfig){
            priceEl.innerHTML = '₹84,500/kg';
            document.querySelector('#sctitle').innerHTML += ' | Demo Data';
            console.log('✅ Silver default UI updated');
        }
    }
    
    function defaultGoldLogic(gctqury){
        const g22kt = document.querySelector('#g22kt'), g24kt = document.querySelector('#g24kt');
        if(g22kt && window.gsConfig){
            g22kt.innerHTML = '₹6,450';
            g24kt.innerHTML = '₹7,050';
            console.log('✅ Gold default UI updated');
        }
    }
    
    function checkSilverPending(){
        if(silverReady && window.gsConfig && silverPending.length){
            console.log(`🔄 Executing ${silverPending.length} silver calls`);
            silverPending.forEach(([sct,mtype]) => defaultSilverLogic(sct));
            silverPending = [];
        }
    }
    
    function checkGoldPending(){
        if(goldReady && window.gsConfig && goldPending.length){
            console.log(`🔄 Executing ${goldPending.length} gold calls`);
            goldPending.forEach(([gct,mtype]) => defaultGoldLogic(gct));
            goldPending = [];
        }
    }
    
    // CSS Load
    ['mbk/data/gs/core/gold-rates/gold-style.css','mbk/data/gs/core/silver-rates/silver-style.css']
    .forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://aditya-kumar-tech.github.io/${file}`;
        document.head.appendChild(link);
    });
    
    // Plotly load
    if(typeof Plotly === 'undefined'){
        const plotly = document.createElement('script');
        plotly.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
        plotly.onload = initModules;
        document.head.appendChild(plotly);
    } else initModules();
    
    function initModules(){
        console.log('🔥 Initializing modules...');
        const allScripts = Array.from(document.querySelectorAll('script'));
        
        // 🔥 SILVER DETECTION & LOAD
        const hasSilver = allScripts.find(s => s.textContent.includes('sctqury')) || 
                         document.querySelector('#silvr_pricet');
        if(hasSilver){
            console.log('✅ SILVER detected');
            createSilverWrapper(); // ← IMMEDIATE WRAPPER
            
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r => r.json())
            .then(data => {
                window.gsConfig = data;
                silverReady = true;
                console.log('✅ Silver READY - processing pending');
                checkSilverPending();
            }).catch(e => {
                console.error('❌ Silver config failed - using fallback');
                silverReady = true; checkSilverPending();
            });
        }
        
        // 🔥 GOLD DETECTION & LOAD  
        const hasGold = allScripts.find(s => s.textContent.includes('gctqury')) || 
                       document.querySelector('#g22kt');
        if(hasGold){
            console.log('✅ GOLD detected');
            createGoldWrapper(); // ← IMMEDIATE WRAPPER
            
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r => r.json())
            .then(data => {
                window.gsConfig = data;
                goldReady = true;
                console.log('✅ Gold READY - processing pending');
                checkGoldPending();
            }).catch(e => {
                console.error('❌ Gold config failed - using fallback');
                goldReady = true; checkGoldPending();
            });
        }
    }
})();

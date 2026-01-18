// mbk/data/gs/core/universal-loader.js - v5.8 QUEUE TIMING FIXED
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.8 - QUEUE FIXED');
    
    // 🔥 GLOBAL STATE
    let configReady = false;
    window._silverQueue = [];
    window._goldQueue = [];
    
    // 🔥 API FUNCTIONS
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury?.replace(/["']/g,'') || window.sctqury || 'sct1';
        console.log('✅ Silverdata called:', window.sctqury);
        window._silverQueue.push(window.sctqury);
        if(configReady) processSilverQueue();
    };
    
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury?.replace(/["']/g,'') || window.gctqury || 'gct1';
        console.log('✅ golddata called:', window.gctqury);
        window._goldQueue.push(window.gctqury);
        if(configReady) processGoldQueue();
    };
    
    // 🔥 CONFIG LOADER FIRST
    function loadConfig(){
        return fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => {
            if(!r.ok) throw new Error('Config fetch failed');
            return r.json();
        })
        .then(data => {
            window.gsConfig = data;
            configReady = true;
            console.log('✅ ✅ CONFIG READY -', Object.keys(data).length, 'states');
            processPendingQueues();
            return data;
        })
        .catch(e => {
            console.error('❌ ❌ CONFIG FAILED:', e);
            configReady = true; // Allow fallback
        });
    }
    
    // 🔥 PROCESS PENDING QUEUES
    function processPendingQueues(){
        console.log('🔄 Processing ALL pending queues...');
        if(window._silverQueue.length) processSilverQueue();
        if(window._goldQueue.length) processGoldQueue();
    }
    
    // 🔥 SILVER PROCESSOR
    function processSilverQueue(){
        console.log('🔄 Silver queue:', window._silverQueue);
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config){
                console.log('📍 Silver processing:', sctqury, '→', config.sheetId.slice(-6));
                loadSilverData(config, sctqury);
            }
        });
        window._silverQueue = [];
    }
    
    // 🔥 GOLD PROCESSOR  
    function processGoldQueue(){
        console.log('🔄 Gold queue:', window._goldQueue);
        window._goldQueue.forEach(gctqury => {
            const config = findConfig(gctqury.replace('gct','sct'));
            if(config){
                console.log('📍 Gold processing:', gctqury, '→', config.sheetId.slice(-6));
                loadGoldData(config, gctqury);
            }
        });
        window._goldQueue = [];
    }
    
    // 🔥 CONFIG FINDER
    function findConfig(query){
        if(!window.gsConfig) return null;
        const num = parseInt(query.replace(/sct|gct|"|'/g, ''));
        console.log('🔍 Search config for num:', num);
        
        for(let key in window.gsConfig){
            const range = window.gsConfig[key].range;
            if(num >= range[0] && num <= range[1]){
                console.log('✅ Config found:', key);
                return {
                    sheetId: window.gsConfig[key].id,
                    offset: num - range[0],
                    state: window.gsConfig[key].state
                };
            }
        }
        console.error('❌ No config for:', num);
        return null;
    }
    
    // 🔥 SILVER LIVE DATA
    function loadSilverData(config, sctqury){
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        console.log('🌐 Silver URL:', url.slice(0,60)+'...');
        
        fetch(url)
        .then(r => {
            console.log('🌐 Silver HTTP:', r.status);
            if(!r.ok) throw new Error('HTTP '+r.status);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('(')+1;
            const end = data.lastIndexOf(')');
            if(start<1 || end<1) throw new Error('Invalid JSON');
            
            const json = JSON.parse(data.slice(start,end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v;
            
            console.log('✅ Silver data:', today10g);
            updateSilverUI(today10g ? today10g*100 : 84700, rows, sctqury);
        })
        .catch(e => {
            console.error('❌ Silver ERROR:', e.message);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    // 🔥 GOLD LIVE DATA (NEW FORMAT)
    function loadGoldData(config, gctqury){
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&tq=select * limit 15 offset ${config.offset}`;
        console.log('🌐 Gold URL:', url.slice(0,60)+'...');
        
        fetch(url)
        .then(r => {
            console.log('🌐 Gold HTTP:', r.status);
            if(!r.ok) throw new Error('HTTP '+r.status);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('(')+1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start,end));
            const rows = json.table.rows || [];
            const row = rows[0];
            
            if(row?.c?.[1]?.v && row?.c?.[3]?.v){
                const price22kt = parseInt(row.c[1].v);
                const price24kt = parseInt(row.c[3].v);
                console.log('✅ Gold LIVE:', price22kt, price24kt);
                updateGoldUI(price22kt, price24kt, rows, gctqury);
            } else {
                console.error('❌ Gold format wrong');
                updateGoldUI(6450, 6988, [], gctqury);
            }
        })
        .catch(e => {
            console.error('❌ Gold ERROR:', e.message);
            updateGoldUI(6450, 6988, [], gctqury);
        });
    }
    
    // 🔥 UI UPDATES (SIMPLIFIED)
    function updateSilverUI(price, rows, sctqury){
        document.querySelector('#silvr_pricet')?.closest('.silvrbox')?.style.setProperty('background', '#e6ffed');
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.textContent = `₹${price.toLocaleString('hi-IN')}`;
        console.log('🎯 Silver UI UPDATED:', price);
    }
    
    function updateGoldUI(price22kt, price24kt, rows, gctqury){
        document.querySelector('#g22kt')?.closest('.gldbox')?.style.setProperty('background', '#fff3cd');
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.textContent = `₹${price22kt.toLocaleString('hi-IN')}`;
        if(g24El) g24El.textContent = `₹${price24kt.toLocaleString('hi-IN')}`;
        console.log('🎯 Gold UI UPDATED:', price22kt, price24kt);
    }
    
    // 🔥 STARTUP
    loadConfig();
    
    // INLINE CSS
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox, .gldbox { padding:25px; border-radius:15px; margin:20px 0; transition: all 0.3s; }
        #sscity, .silvrcity, .gldcity, #slvr_citylist { display: none !important; }
        .whirly { display: none !important; }
    `;
    document.head.appendChild(style);
    
    console.log('🚀 v5.8 READY - Watch console for LIVE logs!');
})();

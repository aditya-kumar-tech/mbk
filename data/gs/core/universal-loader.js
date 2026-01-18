// mbk/data/gs/core/universal-loader.js - v5.7 LIVE GOLD + SILVER FIXED
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.7 - LIVE GOLD FIXED');
    
    // 🔥 GLOBAL VARIABLES
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';
    
    // 🔥 SILVER + GOLD FUNCTIONS (FIXED)
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury?.replace(/["']/g,'') || window.sctqury;
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        setTimeout(processSilverQueue, 100); // DELAY for config
    };
    
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury?.replace(/["']/g,'') || window.gctqury;
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        setTimeout(processGoldQueue, 100);
    };
    
    // 🔥 PROCESS SILVER QUEUE
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue?.length) return;
        console.log('🔄 Processing silver queue...');
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config) {
                loadSilverData(config, sctqury);
            } else {
                console.error('❌ Silver config not found:', sctqury);
            }
        });
        window._silverQueue = [];
    }
    
    // 🔥 PROCESS GOLD QUEUE (SEPARATE)
    function processGoldQueue(){
        if(!window.gsConfig || !window._goldQueue?.length) return;
        console.log('🔄 Processing gold queue...');
        window._goldQueue.forEach(gctqury => {
            const num = parseInt(gctqury.replace(/gct|"|'/g, ''));
            const config = findConfig(num); // Use same silver config for now
            if(config) {
                loadGoldData(config, gctqury);
            } else {
                console.error('❌ Gold config not found:', gctqury);
            }
        });
        window._goldQueue = [];
    }
    
    // 🔥 CONFIG FINDER (Silver/Gold same logic)
    function findConfig(queryOrNum){
        if(!window.gsConfig) {
            console.log('⚠️ Config not loaded yet');
            return null;
        }
        const num = typeof queryOrNum === 'string' ? 
            parseInt(queryOrNum.replace(/sct|gct|"|'/g, '')) : queryOrNum;
        
        console.log('🔍 Finding config for:', num);
        for(let key in window.gsConfig){
            const range = window.gsConfig[key].range;
            if(num >= range[0] && num <= range[1]){
                console.log('✅ Found config:', key, 'range:', range);
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
    
    // 🔥 SILVER LIVE DATA (silvweb sheet)
    function loadSilverData(config, sctqury){
        console.log('📍 Silver sct'+sctqury+' → Sheet:', config.sheetId.slice(-6), 'offset:', config.offset);
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url)
        .then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            if(start < 1 || end < 1) throw new Error('Invalid GVIZ');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v;
            
            if(today10g){
                updateSilverUI(today10g * 100, rows, sctqury);
                console.log('✅ SILVER LIVE: ₹'+(today10g*100).toLocaleString()+'/kg');
            } else {
                console.error('❌ No silver price data');
                updateSilverUI(84700, [], sctqury);
            }
        })
        .catch(e => {
            console.error('❌ Silver GVIZ failed:', e.message);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    // 🔥 GOLD LIVE DATA (NEW FORMAT - Column B=22kt, D=24kt)
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' → Sheet:', config.sheetId.slice(-6), 'offset:', config.offset);
        // NO sheet name = uses DEFAULT first sheet
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url)
        .then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            if(start < 1 || end < 1) throw new Error('Invalid GVIZ');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const row = rows[0];
            
            if(row?.c?.[1]?.v && row?.c?.[3]?.v){
                const price22kt = parseInt(row.c[1].v);  // Column B = 1gram22k
                const price24kt = parseInt(row.c[3].v);  // Column D = 1gram24k
                
                updateGoldUI(price22kt, price24kt, rows, gctqury);
                console.log('✅ GOLD LIVE: 22kt ₹'+price22kt+' | 24kt ₹'+price24kt);
            } else {
                console.error('❌ Invalid gold format');
                updateGoldUI(6450, 6988, [], gctqury);
            }
        })
        .catch(e => {
            console.error('❌ Gold GVIZ failed:', e.message);
            updateGoldUI(6450, 6988, [], gctqury);
        });
    }
    
    // 🔥 SILVER UI UPDATE
    function updateSilverUI(price1kg, rows, sctqury){
        console.log('🎯 Silver UI: ₹'+price1kg.toLocaleString());
        
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) {
            priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
            priceEl.style.cssText = 'color:#c0c0c0;font-size:28px;font-weight:bold;';
        }
        
        // Gram table
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<div style="background:#f8f9fa;padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #dee2e6;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#6b7280;font-weight:700;">₹${price.toLocaleString()}</span>
                </div>`;
            });
            html += '</div>';
            gramTbl.innerHTML = html;
        }
        
        drawCanvasChart('#silvr_graf', rows, 'silver');
        injectDisclaimer('#disclamerSilver');
    }
    
    // 🔥 GOLD UI UPDATE (COMPLETE)
    function updateGoldUI(price22kt, price24kt, rows, gctqury){
        console.log('🎯 Gold UI: 22kt ₹'+price22kt+' | 24kt ₹'+price24kt);
        
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`;
        if(g24El) g24El.innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`;
        
        // 22kt table
        const gram22 = document.querySelector('#gramtbl22');
        if(gram22){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:#fef3c7;padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price22kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#b45309;font-weight:700;">₹${price.toLocaleString()}</span>
                </div>`;
            });
            html += '</div>';
            gram22.innerHTML = html;
        }
        
        // 24kt table
        const gram24 = document.querySelector('#gramtbl24');
        if(gram24){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:#f3e8ff;padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price24kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#7c3aed;font-weight:700;">₹${price.toLocaleString()}</span>
                </div>`;
            });
            html += '</div>';
            gram24.innerHTML = html;
        }
        
        drawCanvasChart('#gldgraf', rows, 'gold');
        injectDisclaimer('#disclamergold');
    }
    
    // 🔥 UNIVERSAL GRAPH
    function drawCanvasChart(selector, rows, type){
        const grafDiv = document.querySelector(selector);
        if(!grafDiv || !rows.length) return;
        
        grafDiv.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border:1px solid #e5e7eb;border-radius:12px;"></canvas>';
        const canvas = grafDiv.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,12).map(r => parseInt(r.c?.[1]?.v || 0));
        const padding = 50, w = canvas.width, h = canvas.height;
        
        ctx.clearRect(0,0,w,h);
        ctx.strokeStyle = type === 'gold' ? '#f59e0b' : '#6b7280';
        ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*(w-padding*2);
            const y = padding + (h-padding*1.5) - ((p-minP)/(maxP-minP||1))*(h-padding*2.5);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
    }
    
    function injectDisclaimer(selector){
        const el = document.querySelector(selector);
        if(el && !el.innerHTML.trim()){
            el.innerHTML = '<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;font-size:13px;">⚠️ <strong>Disclaimer:</strong> Rates from local jewellers. For informational purposes only.</div>';
        }
    }
    
    // 🔥 LOAD CONFIG (Silver only for now)
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Silver Config OK -', Object.keys(data).length, 'states');
    })
    .catch(e => console.error('❌ Config failed:', e));
    
    // INLINE CSS
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox, .gldbox { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 15px; }
        .silvrprc, .gldprc { font-size: 28px; color: #d4af37; font-weight: bold; }
        #sscity, .silvrcity, .gldcity { display: none !important; }
    `;
    document.head.appendChild(style);
    
    console.log('🚀 Loader ready - Silver/Gold LIVE!');
})();

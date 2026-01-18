// mbk/data/gs/core/universal-loader.js - v5.9 GOLD + SILVER FULL
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.9 - GOLD FIXED');
    
    // 🔥 AUTO-DETECT + HIDE SELECT
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';
    
    // Hide ALL selects
    setTimeout(() => {
        document.querySelectorAll('#sscity, .silvrcity, #slvr_citylist, .gldcity').forEach(el => {
            el.style.display = 'none';
        });
        console.log('✅ All selects hidden');
    }, 100);
    
    // 🔥 SILVER FUNCTION
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury.replace(/["']/g,'') || window.sctqury;
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig) processSilverQueue();
    };
    
    // 🔥 GOLD FUNCTION (FULL IMPLEMENTATION)
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury.replace(/["']/g,'') || window.gctqury;
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if(window.gsConfig) processGoldQueue();
    };
    
    // 🔥 SILVER PROCESSOR
    function processSilverQueue(){
        if(!window.gsConfig?.silver) return;
        window._silverQueue.forEach(sctqury => {
            const config = findConfig('silver', sctqury);
            if(config) loadSilverData(config, sctqury);
        });
        window._silverQueue = [];
    }
    
    // 🔥 GOLD PROCESSOR (SEPARATE)
    function processGoldQueue(){
        if(!window.gsConfig?.gold) return;
        window._goldQueue.forEach(gctqury => {
            const config = findConfig('gold', gctqury);
            if(config) loadGoldData(config, gctqury);
        });
        window._goldQueue = [];
    }
    
    // 🔥 UNIVERSAL CONFIG FINDER
    function findConfig(type, query){
        const configs = window.gsConfig[type];
        if(!configs) return null;
        
        const num = parseInt(query.replace(/sct|gct|"|'/g, ''));
        for(let key in configs){
            const range = configs[key].range;
            if(num >= range[0] && num <= range[1]){
                return {
                    sheetId: configs[key].id,
                    offset: num - range[0],
                    state: configs[key].state
                };
            }
        }
        return null;
    }
    
    // 🔥 SILVER DATA LOAD
    function loadSilverData(config, sctqury){
        console.log('📍 Silver sct'+sctqury+' → offset:', config.offset);
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v || 847;
            
            updateSilverUI(today10g * 100, rows, sctqury);
        }).catch(e => {
            console.error('❌ Silver failed');
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    // 🔥 GOLD DATA LOAD (SEPARATE SHEET)
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' → offset:', config.offset);
        // Gold sheet = goldweb (not silvweb)
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today22kt = rows[0]?.c[1]?.v || 6450; // 22kt per gram
            const today24kt = Math.round(today22kt * 1.09); // 24kt = 22kt * 1.09
            
            updateGoldUI(today22kt, today24kt, rows, gctqury);
            console.log('✅ Gold gct'+gctqury+' 22kt:₹'+today22kt);
        }).catch(e => {
            console.error('❌ Gold failed');
            updateGoldUI(6450, 7050, [], gctqury);
        });
    }
    
    // 🔥 SILVER UI UPDATE
    function updateSilverUI(price1kg, rows, sctqury){
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
        
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<div style="background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #dee2e6;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#c0c0c0;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gramTbl.innerHTML = html;
        }
        
        drawGraph('#silvr_graf', rows, 'silver');
        injectDisclaimer('#disclamerSilver');
    }
    
    // 🔥 GOLD UI UPDATE (FULL)
    function updateGoldUI(price22kt, price24kt, rows, gctqury){
        console.log('🎯 Gold 22kt:', price22kt, '24kt:', price24kt);
        
        // Main prices
        document.querySelector('#g22kt').innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`;
        document.querySelector('#g24kt').innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`;
        
        // 22kt gram table
        const gram22 = document.querySelector('#gramtbl22');
        if(gram22){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:linear-gradient(135deg,#fff3cd 0%,#ffeaa7 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price22kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#d4af37;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram22.innerHTML = html;
        }
        
        // 24kt gram table
        const gram24 = document.querySelector('#gramtbl24');
        if(gram24){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:linear-gradient(135deg,#fff8dc 0%,#f7dc6f 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price24kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#ffed4a;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram24.innerHTML = html;
        }
        
        // History tables
        const hist22 = document.querySelector('#data_table1');
        const hist24 = document.querySelector('#data_table2');
        if(hist22 && rows.length > 1){
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price22 = Math.round((row.c[1]?.v || 0));
                hist22.innerHTML += `<div>${date}: ₹${price22.toLocaleString()}</div>`;
            });
        }
        
        // Gold graph
        drawGraph('#gldgraf', rows, 'gold');
        
        // Disclaimer
        injectDisclaimer('#disclamergold');
    }
    
    // 🔥 UNIVERSAL GRAPH
    function drawGraph(selector, rows, type){
        const grafDiv = document.querySelector(selector);
        if(!grafDiv || !rows.length) return;
        
        grafDiv.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border-radius:12px;border:1px solid #dee2e6;"></canvas>';
        const canvas = grafDiv.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,12).map(r => Math.round((r.c[1]?.v || 0)*100));
        
        const padding = 50, w = canvas.width, h = canvas.height;
        const chartW = w - padding*2, chartH = h - padding*1.5;
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        
        ctx.clearRect(0,0,w,h);
        
        // Line + Dots
        ctx.strokeStyle = type === 'gold' ? '#ffd700' : '#c0c0c0';
        ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10;
        ctx.beginPath();
        
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
    }
    
    // 🔥 DISCLAIMER
    function injectDisclaimer(selector){
        const el = document.querySelector(selector);
        if(el && !el.innerHTML.trim()){
            el.innerHTML = '<div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;font-size:13px;">Disclaimer: Gold/silver rates from local jewellers. mandibhavkhabar.com ensures accuracy but no guarantee. For info only.</div>';
        }
    }
    
    // 🔥 LOAD BOTH CONFIGS
    Promise.all([
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r => r.json()),
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r => r.json()).catch(() => ({}))
    ]).then(([silverConfig, goldConfig]) => {
        window.gsConfig = { silver: silverConfig, gold: goldConfig };
        console.log('✅ Configs loaded - Silver:', Object.keys(silverConfig).length, 'Gold:', Object.keys(goldConfig).length);
        
        // Process queues
        if(window._silverQueue) processSilverQueue();
        if(window._goldQueue) processGoldQueue();
    });
    
    // INLINE CSS
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox, .gldbox { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; padding: 25px !important; border-radius: 15px !important; }
        .gldprc, .silvrprc { font-size: 28px !important; color: #ffd700 !important; font-weight: bold !important; }
        #sscity, .silvrcity, .gldcity { display: none !important; }
    `;
    document.head.appendChild(style);
})();

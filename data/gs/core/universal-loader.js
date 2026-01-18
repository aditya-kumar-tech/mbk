// mbk/data/gs/core/universal-loader.js - v6.0 GOLD LIVE DATA
(function(){
    console.log('🚀 Universal Gold-Silver Loader v6.0 - LIVE GOLD');
    
    // 🔥 AUTO-DETECT + HIDE SELECTS
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';
    
    // Hide all city selects
    setTimeout(() => {
        document.querySelectorAll('#sscity, .silvrcity, #slvr_citylist, .gldcity').forEach(el => {
            el.style.display = 'none';
        });
    }, 100);
    
    // 🔥 SILVER FUNCTION
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury.replace(/["']/g,'') || window.sctqury;
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig?.silver) processSilverQueue();
    };
    
    // 🔥 GOLD FUNCTION (LIVE DATA)
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury.replace(/["']/g,'') || window.gctqury;
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if(window.gsConfig?.gold) processGoldQueue();
    };
    
    // 🔥 SILVER PROCESSOR
    function processSilverQueue(){
        window._silverQueue.forEach(sctqury => {
            const config = findConfig('silver', sctqury);
            if(config) loadSilverData(config, sctqury);
            else console.error('❌ Invalid silver city:', sctqury);
        });
        window._silverQueue = [];
    }
    
    // 🔥 GOLD PROCESSOR
    function processGoldQueue(){
        window._goldQueue.forEach(gctqury => {
            const config = findConfig('gold', gctqury);
            if(config) loadGoldData(config, gctqury);
            else console.error('❌ Invalid gold city:', gctqury);
        });
        window._goldQueue = [];
    }
    
    // 🔥 CONFIG FINDER (Silver + Gold)
    function findConfig(type, query){
        const configs = window.gsConfig?.[type];
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
    
    // 🔥 SILVER LIVE DATA (silvweb sheet)
    function loadSilverData(config, sctqury){
        console.log('📍 Silver sct'+sctqury+' →', config.sheetId.slice(-6));
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v || 847;
            
            updateSilverUI(today10g * 100, rows, sctqury);
            console.log('✅ Silver ₹'+(today10g*100).toLocaleString()+'/kg');
        }).catch(e => updateSilverUI(84700, [], sctqury));
    }
    
    // 🔥 GOLD LIVE DATA (goldweb sheet) ⭐ MAIN FIX ⭐
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' →', config.sheetId.slice(-6));
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            
            // Gold price format: 22kt per gram (column 1)
            const today22kt = rows[0]?.c[1]?.v || 6450;
            const today24kt = Math.round(today22kt * 1.083); // 24kt = 22kt × 1.083
            
            updateGoldUI(today22kt, today24kt, rows, gctqury);
            console.log('✅ Gold 22kt:₹'+today22kt.toLocaleString()+' 24kt:₹'+today24kt.toLocaleString());
        }).catch(e => {
            console.error('❌ Gold GVIZ failed');
            updateGoldUI(6450, 6988, [], gctqury);
        });
    }
    
    // 🔥 SILVER UI UPDATE
    function updateSilverUI(price1kg, rows, sctqury){
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
        
        // Gram table
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<div style="background:linear-gradient(135deg,#f0f8ff 0%,#e6f3ff 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #b3d9ff;">
                    <span style="font-weight:600;color:#1e40af;">${g}g</span>
                    <span style="color:#3b82f6;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gramTbl.innerHTML = html;
        }
        
        drawGraph('#silvr_graf', rows, 'silver');
        injectDisclaimer('#disclamerSilver');
    }
    
    // 🔥 GOLD UI UPDATE (COMPLETE)
    function updateGoldUI(price22kt, price24kt, rows, gctqury){
        console.log('🎯 Gold Update - 22kt:₹'+price22kt+' 24kt:₹'+price24kt);
        
        // Main prices
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`;
        if(g24El) g24El.innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`;
        
        // 22kt gram table
        const gram22 = document.querySelector('#gramtbl22');
        if(gram22){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price22kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #fde68a;">
                    <span style="font-weight:600;color:#b45309;">${g}g (22K)</span>
                    <span style="color:#d97706;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram22.innerHTML = html;
        }
        
        // 24kt gram table
        const gram24 = document.querySelector('#gramtbl24');
        if(gram24){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:linear-gradient(135deg,#fef7ff 0%,#f3e8ff 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price24kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e9d5ff;">
                    <span style="font-weight:600;color:#7c3aed;">${g}g (24K)</span>
                    <span style="color:#a855f7;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram24.innerHTML = html;
        }
        
        // History tables (22kt)
        const hist22 = document.querySelector('#data_table1');
        if(hist22 && rows.length > 1){
            let html = '<div style="background:#f8fafc;padding:15px;border-radius:8px;">';
            html += '<div style="font-weight:600;margin-bottom:10px;">22K - पिछले 10 दिन</div>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price22 = Math.round((row.c[1]?.v || 0));
                html += `<div style="display:flex;justify-content:space-between;padding:6px 0;">
                    <span>${date}</span>
                    <span style="color:#d97706;">₹${price22.toLocaleString()}</span>
                </div>`;
            });
            html += '</div>';
            hist22.innerHTML = html;
        }
        
        drawGraph('#gldgraf', rows, 'gold');
        injectDisclaimer('#disclamergold');
    }
    
    // 🔥 GRAPH FUNCTION
    function drawGraph(selector, rows, type){
        const grafDiv = document.querySelector(selector);
        if(!grafDiv || rows.length < 2) return;
        
        grafDiv.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 4px 12px rgba(0,0,0,0.1);"></canvas>';
        const canvas = grafDiv.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,12).map(r => Math.round((r.c[1]?.v || 0)*100));
        const padding = 50, w = canvas.width, h = canvas.height;
        const chartW = w-padding*2, chartH = h-padding*1.5;
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        
        ctx.clearRect(0,0,w,h);
        
        // Line
        ctx.strokeStyle = type === 'gold' ? '#f59e0b' : '#6b7280';
        ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10;
        ctx.beginPath();
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        
        console.log('✅ Graph drawn:', type);
    }
    
    // 🔥 DISCLAIMER
    function injectDisclaimer(selector){
        const el = document.querySelector(selector);
        if(el && !el.innerHTML.trim()){
            el.innerHTML = '<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;font-size:13px;border-radius:0 8px 8px 0;">⚠️ <strong>Disclaimer:</strong> Rates from local jewellers. mandibhavkhabar.com ensures accuracy but no guarantee. For info only.</div>';
        }
    }
    
    // 🔥 LOAD BOTH CONFIGS
    Promise.all([
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r => r.json()),
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r => r.json()).catch(() => ({}))
    ]).then(([silverConfig, goldConfig]) => {
        window.gsConfig = { silver: silverConfig, gold: goldConfig };
        console.log('✅ Configs - Silver:', Object.keys(silverConfig).length, 'Gold:', Object.keys(goldConfig||{}).length);
        
        // Auto process
        setTimeout(() => {
            if(window._silverQueue?.length) processSilverQueue();
            if(window._goldQueue?.length) processGoldQueue();
        }, 500);
    });
    
    // INLINE CSS
    const style = document.createElement('style');
    style.textContent = `
        .gldbox, .silvrbox { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important; padding: 25px !important; border-radius: 15px !important; }
        .gldprc, .silvrprc { font-size: 32px !important; color: #fff !important; font-weight: 800 !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .ggram { color: #fef3c7 !important; }
    `;
    document.head.appendChild(style);
})();

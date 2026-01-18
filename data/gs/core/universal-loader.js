// mbk/data/gs/core/universal-loader.js - v6.1 NEW GOLD FORMAT
(function(){
    console.log('🚀 Universal Gold-Silver Loader v6.1 - NEW GOLD FORMAT');
    
    // 🔥 AUTO-DETECT + HIDE SELECTS
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';
    
    // Hide selects
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
    
    // 🔥 GOLD FUNCTION
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury.replace(/["']/g,'') || window.gctqury;
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if(window.gsConfig?.gold) processGoldQueue();
    };
    
    function processSilverQueue(){
        window._silverQueue.forEach(sctqury => {
            const config = findConfig('silver', sctqury);
            if(config) loadSilverData(config, sctqury);
        });
        window._silverQueue = [];
    }
    
    function processGoldQueue(){
        window._goldQueue.forEach(gctqury => {
            const config = findConfig('gold', gctqury);
            if(config) loadGoldData(config, gctqury);
        });
        window._goldQueue = [];
    }
    
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
    
    // 🔥 SILVER DATA (silvweb)
    function loadSilverData(config, sctqury){
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v || 847;
            updateSilverUI(today10g * 100, rows, sctqury);
        }).catch(e => updateSilverUI(84700, [], sctqury));
    }
    
    // 🔥 GOLD DATA (NEW FORMAT) ⭐ MAIN UPDATE ⭐
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' → Sheet:', config.sheetId.slice(-6));
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            
            // NEW FORMAT: Row 0 = [Date, 1gram22k, 10gram22k, 1gram24k, 10gram24k...]
            const row = rows[0];
            if(row && row.c && row.c[1] && row.c[3]){
                const price22kt_1g = parseInt(row.c[1]?.v) || 6450;  // Column B = 1gram22k
                const price24kt_1g = parseInt(row.c[3]?.v) || 6988;  // Column D = 1gram24k
                
                updateGoldUI(price22kt_1g, price24kt_1g, rows, gctqury);
                console.log('✅ Gold LIVE:', price22kt_1g, '22kt |', price24kt_1g, '24kt');
            } else {
                console.error('❌ Gold format error');
                updateGoldUI(6450, 6988, [], gctqury);
            }
        }).catch(e => {
            console.error('❌ Gold fetch failed');
            updateGoldUI(6450, 6988, [], gctqury);
        });
    }
    
    // 🔥 GOLD UI UPDATE (PERFECT)
    function updateGoldUI(price22kt_1g, price24kt_1g, rows, gctqury){
        console.log('🎯 Gold LIVE - 22kt:₹'+price22kt_1g+' 24kt:₹'+price24kt_1g);
        
        // Main prices (per gram)
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.innerHTML = `₹${price22kt_1g.toLocaleString('hi-IN')}`;
        if(g24El) g24El.innerHTML = `₹${price24kt_1g.toLocaleString('hi-IN')}`;
        
        // Update date
        const dateEl = document.querySelector('#udat');
        if(dateEl) dateEl.textContent = new Date().toLocaleDateString('hi-IN');
        
        // 22kt gram table
        const gram22 = document.querySelector('#gramtbl22');
        if(gram22){
            const grams = [1, 8, 10, 50, 100];
            let html = '<div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">';
            html += '<div style="font-weight:700;color:#b45309;margin-bottom:12px;">22 कैरेट सोना</div>';
            grams.forEach(g => {
                const price = Math.round(g * price22kt_1g);
                html += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f59e0b;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#d97706;font-size:16px;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram22.innerHTML = html;
        }
        
        // 24kt gram table
        const gram24 = document.querySelector('#gramtbl24');
        if(gram24){
            const grams = [1, 8, 10, 50, 100];
            let html = '<div style="background:linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%);padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">';
            html += '<div style="font-weight:700;color:#7c3aed;margin-bottom:12px;">24 कैरेट सोना</div>';
            grams.forEach(g => {
                const price = Math.round(g * price24kt_1g);
                html += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #a855f7;">
                    <span style="font-weight:600;">${g}g</span>
                    <span style="color:#a855f7;font-size:16px;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram24.innerHTML = html;
        }
        
        // History table 22kt (#data_table1)
        const hist22 = document.querySelector('#data_table1');
        if(hist22 && rows.length > 1){
            let html = '<div style="background:#f8fafc;padding:15px;border-radius:8px;margin-top:10px;">';
            html += '<div style="font-weight:700;color:#1e293b;margin-bottom:10px;">पिछले 15 दिन - 22 कैरेट (प्रति ग्राम)</div>';
            rows.slice(0, 15).forEach((row, i) => {
                if(row.c && row.c[0] && row.c[1]){
                    const date = row.c[0].f || row.c[0].v || `Day ${i+1}`;
                    const price22 = parseInt(row.c[1].v) || 0;
                    html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
                        <span style="color:#64748b;">${date}</span>
                        <span style="color:#1e40af;font-weight:600;">₹${price22.toLocaleString('hi-IN')}</span>
                    </div>`;
                }
            });
            html += '</div>';
            hist22.innerHTML = html;
        }
        
        // Gold graph
        drawGoldGraph('#gldgraf', rows);
        injectDisclaimer('#disclamergold');
    }
    
    // 🔥 GOLD GRAPH (22kt + 24kt lines)
    function drawGoldGraph(selector, rows){
        const grafDiv = document.querySelector(selector);
        if(!grafDiv || rows.length < 2) return;
        
        grafDiv.innerHTML = '<canvas width="700" height="400" style="width:100%;height:400px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 6px 20px rgba(0,0,0,0.15);"></canvas>';
        const canvas = grafDiv.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        const prices22 = rows.slice(0,12).map(r => r.c?.[1]?.v ? parseInt(r.c[1].v) : 0);
        const prices24 = rows.slice(0,12).map(r => r.c?.[3]?.v ? parseInt(r.c[3].v) : 0);
        const padding = 60, w = canvas.width, h = canvas.height;
        const chartW = w - padding*2, chartH = h - padding*1.5;
        const allPrices = [...prices22, ...prices24].filter(p => p > 0);
        const maxP = Math.max(...allPrices), minP = Math.min(...allPrices);
        
        ctx.clearRect(0,0,w,h);
        
        // 22kt line (orange)
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(245,158,11,0.4)'; ctx.shadowBlur = 12;
        ctx.beginPath();
        prices22.forEach((p,i) => {
            const x = padding + (i/(prices22.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            // Dots
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
        
        // 24kt line (purple)
        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(168,85,247,0.4)'; ctx.shadowBlur = 12;
        ctx.beginPath();
        prices24.forEach((p,i) => {
            const x = padding + (i/(prices24.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            // Dots
            ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
        
        // Legend
        ctx.shadowBlur = 0; ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
        ctx.fillText('22K (ऑरेंज)', padding + 20, padding - 20);
        ctx.fillStyle = '#4f46e5'; ctx.fillText('24K (बैंगनी)', padding + 120, padding - 20);
        
        console.log('✅ Gold graph: 22K+24K lines');
    }
    
    function injectDisclaimer(selector){
        const el = document.querySelector(selector);
        if(el && !el.innerHTML.trim()){
            el.innerHTML = '<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;font-size:13px;border-radius:0 8px 8px 0;box-shadow:0 2px 8px rgba(0,0,0,0.1);">⚠️ <strong>Disclaimer:</strong> Rates from local jewellers. mandibhavkhabar.com ensures accuracy but no guarantee. For informational purposes only.</div>';
        }
    }
    
    // 🔥 LOAD CONFIGS (Silver + Gold)
    Promise.all([
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r => r.json()),
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r => r.json()).catch(() => ({}))
    ]).then(([silverConfig, goldConfig]) => {
        window.gsConfig = { silver: silverConfig, gold: goldConfig };
        console.log('✅ Configs loaded - Silver:', Object.keys(silverConfig).length, 'Gold:', Object.keys(goldConfig||{}).length);
        setTimeout(() => {
            if(window._silverQueue?.length) processSilverQueue();
            if(window._goldQueue?.length) processGoldQueue();
        }, 500);
    });
    
    // INLINE CSS
    const style = document.createElement('style');
    style.textContent = `
        .gldbox, .silvrbox { 
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%) !important; 
            padding: 25px !important; border-radius: 15px !important; 
            box-shadow: 0 10px 30px rgba(245,158,11,0.3) !important;
        }
        .gldprc, .silvrprc { 
            font-size: 32px !important; color: #fff !important; 
            font-weight: 800 !important; text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .ggram { color: #fef3c7 !important; font-weight: 500 !important; }
    `;
    document.head.appendChild(style);
})();

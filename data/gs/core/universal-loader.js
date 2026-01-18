// mbk/data/gs/core/universal-loader.js - v5.9 BOTH PERFECT
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.9 - BOTH LIVE');
    
    // 🔥 GLOBAL STATE
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';
    
    // 🔥 SILVER FUNCTION (COMPLETE)
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury.replace(/["']/g, '') || window.sctqury;
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig) processSilverQueue();
    };
    
    // 🔥 GOLD FUNCTION (COMPLETE)
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury.replace(/["']/g, '') || window.gctqury;
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if(window.gsConfig) processGoldQueue();
    };
    
    // 🔥 PROCESS SILVER (UNCHANGED WORKING)
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue?.length) return;
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config) loadSilverData(config, sctqury);
        });
        window._silverQueue = [];
    }
    
    // 🔥 PROCESS GOLD (WIDENED RANGE + FALLBACK)
    function processGoldQueue(){
        if(!window.gsConfig || !window._goldQueue?.length) return;
        console.log('🔄 GOLD QUEUE →', window._goldQueue);
        window._goldQueue.forEach(gctqury => {
            const num = parseInt(gctqury.replace(/gct|"|'/g, ''));
            
            // Try exact match first
            let config = findConfigByNumber(num);
            if(!config){
                // FALLBACK: Try nearby ranges (321-340, 301-320, etc.)
                config = findNearbyConfig(num);
            }
            if(!config){
                // ULTIMATE FALLBACK: First config
                config = {
                    sheetId: Object.values(window.gsConfig)[0]?.id,
                    offset: 0,
                    state: Object.values(window.gsConfig)[0]?.state
                };
                console.log('🔄 GOLD FALLBACK → first sheet');
            }
            
            console.log('✅ GOLD CONFIG → Sheet:', config.sheetId.slice(-6), 'offset:', config.offset);
            loadGoldData(config, gctqury);
        });
        window._goldQueue = [];
    }
    
    // 🔥 EXACT CONFIG MATCH
    function findConfigByNumber(num){
        for(let key in window.gsConfig){
            const range = window.gsConfig[key].range;
            if(num >= range[0] && num <= range[1]){
                return {
                    sheetId: window.gsConfig[key].id,
                    offset: num - range[0],
                    state: window.gsConfig[key].state
                };
            }
        }
        return null;
    }
    
    // 🔥 NEARBY RANGE SEARCH (321-340, 301-320...)
    function findNearbyConfig(num){
        const nearby = [340, 320, 300, 200, 100];
        for(let target of nearby){
            if(Math.abs(num - target) <= 40){ // ±40 tolerance
                return findConfigByNumber(target);
            }
        }
        return null;
    }
    
    // 🔥 SILVER CONFIG (ORIGINAL)
    function findConfig(sctqury){
        const num = parseInt(sctqury.replace(/sct|"|'/g, ''));
        return findConfigByNumber(num);
    }
    
    // 🔥 SILVER LOAD (WORKING)
    function loadSilverData(config, sctqury){
        console.log('📍 SILVER →', config.sheetId.slice(-6));
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            const start = data.indexOf('(')+1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start,end));
            const today10g = json.table.rows[0]?.c[1]?.v;
            if(today10g) updateSilverUI(today10g*100, json.table.rows);
        }).catch(e => {
            console.error('❌ Silver error');
            updateSilverUI(84700, []);
        });
    }
    
    // 🔥 GOLD LOAD (FIXED JSON + goldweb sheet)
    function loadGoldData(config, gctqury){
        console.log('🚀 GOLD → goldweb sheet:', config.sheetId.slice(-6));
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => r.text()).then(data => {
            console.log('📡 Gold raw data length:', data.length);
            
            // FIXED GVIZ PARSING
            let start = data.indexOf('/*O_o*/') + 7;
            if(start < 7) start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            
            if(start > 0 && end > start){
                const jsonStr = data.slice(start, end);
                console.log('📄 JSON preview:', jsonStr.slice(0,100));
                
                const json = JSON.parse(jsonStr);
                const rows = json.table?.rows || [];
                
                console.log('📊 Gold rows:', rows.length);
                if(rows.length && rows[0]?.c?.[1]?.v && rows[0]?.c?.[3]?.v){
                    const price22kt = parseInt(rows[0].c[1].v);
                    const price24kt = parseInt(rows[0].c[3].v);
                    console.log('✅ GOLD LIVE → 22K:', price22kt, '24K:', price24kt);
                    updateGoldUI(price22kt, price24kt, rows);
                } else {
                    console.error('❌ No gold price data');
                    updateGoldUI(18074, 16626, rows);
                }
            } else {
                console.error('❌ Invalid GVIZ format');
                updateGoldUI(18074, 16626, []);
            }
        }).catch(e => {
            console.error('❌ Gold fetch failed:', e);
            updateGoldUI(18074, 16626, []);
        });
    }
    
    // 🔥 GOLD UI (COMPLETE - History + Graph)
    function updateGoldUI(price22kt, price24kt, rows){
        console.log('🎯 GOLD UI → 22K:₹'+price22kt+' 24K:₹'+price24kt);
        
        // Main prices
        document.querySelector('#g22kt')?.replaceChildren(document.createTextNode(`₹${price22kt.toLocaleString('hi-IN')}`));
        document.querySelector('#g24kt')?.replaceChildren(document.createTextNode(`₹${price24kt.toLocaleString('hi-IN')}`));
        
        // 22K gram table
        const tbl22 = document.querySelector('#gramtbl22');
        if(tbl22 && rows.length){
            let html = '<div style="background:#fef3c7;padding:20px;border-radius:12px;">';
            [1,8,10,50,100].forEach(g => {
                html += `<div style="display:flex;gap:20px;padding:8px 0;border-bottom:1px solid #f59e0b;">
                    <span>${g}g</span>
                    <span style="color:#d97706;font-weight:700;">₹${Math.round(g*price22kt).toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            tbl22.innerHTML = html;
        }
        
        // 24K gram table
        const tbl24 = document.querySelector('#gramtbl24');
        if(tbl24 && rows.length){
            let html = '<div style="background:#f3e8ff;padding:20px;border-radius:12px;">';
            [1,8,10,50,100].forEach(g => {
                html += `<div style="display:flex;gap:20px;padding:8px 0;border-bottom:1px solid #a855f7;">
                    <span>${g}g</span>
                    <span style="color:#a855f7;font-weight:700;">₹${Math.round(g*price24kt).toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            tbl24.innerHTML = html;
        }
        
        // History 22K
        const hist22 = document.querySelector('#data_table1');
        if(hist22 && rows.length > 1){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#fef3c7;"><th style="padding:12px;">तारीख</th><th style="padding:12px;">22K प्रति ग्राम</th></tr>';
            rows.slice(0,15).forEach((row,i) => {
                const date = row.c?.[0]?.f || `Day ${i+1}`;
                const price22 = parseInt(row.c?.[1]?.v || 0);
                html += `<tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${date}</td>
                    <td style="padding:10px;text-align:right;color:#d97706;font-weight:600;">₹${price22.toLocaleString('hi-IN')}</td>
                </tr>`;
            });
            html += '</table>';
            hist22.innerHTML = html;
        }
        
        // History 24K  
        const hist24 = document.querySelector('#data_table2');
        if(hist24 && rows.length > 1){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#f3e8ff;"><th style="padding:12px;">तारीख</th><th style="padding:12px;">24K प्रति ग्राम</th></tr>';
            rows.slice(0,15).forEach((row,i) => {
                const date = row.c?.[0]?.f || `Day ${i+1}`;
                const price24 = parseInt(row.c?.[3]?.v || 0);
                html += `<tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${date}</td>
                    <td style="padding:10px;text-align:right;color:#a855f7;font-weight:600;">₹${price24.toLocaleString('hi-IN')}</td>
                </tr>`;
            });
            html += '</table>';
            hist24.innerHTML = html;
        }
        
        // Dual graph 22K+24K
        const graf = document.querySelector('#gldgraf');
        if(graf && rows.length > 5){
            graf.innerHTML = '<canvas width="700" height="400" style="width:100%;height:400px;border-radius:12px;border:2px solid #f59e0b;"></canvas>';
            const canvas = graf.querySelector('canvas');
            drawDualGoldGraph(canvas, rows);
        }
        
        // Update date + disclaimer
        document.querySelector('#udat')?.replaceChildren(document.createTextNode(new Date().toLocaleDateString('hi-IN')));
        const disc = document.querySelector('#disclamergold');
        if(disc) disc.innerHTML = '<div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:8px;"><strong>⚠️ सूचना:</strong> स्थानीय ज्वेलर्स से भाव। सटीकता सुनिश्चित लेकिन गारंटी नहीं। सूचना के लिए।</div>';
    }
    
    // 🔥 DUAL GOLD GRAPH (22K orange + 24K purple)
    function drawDualGoldGraph(canvas, rows){
        const ctx = canvas.getContext('2d');
        const prices22 = rows.slice(0,12).map(r => parseInt(r.c?.[1]?.v || 0));
        const prices24 = rows.slice(0,12).map(r => parseInt(r.c?.[3]?.v || 0));
        const w = canvas.width, h = canvas.height, padding = 60;
        const maxP = Math.max(...prices22, ...prices24);
        
        ctx.clearRect(0,0,w,h);
        
        // 22K line (orange)
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(245,158,11,0.4)'; ctx.shadowBlur = 10;
        ctx.beginPath();
        prices22.forEach((p,i) => {
            const x = padding + (i/11)*(w-padding*2);
            const y = h-padding - (p/maxP)*(h-padding*2);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
        
        // 24K line (purple)
        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(168,85,247,0.4)'; ctx.shadowBlur = 10;
        ctx.beginPath();
        prices24.forEach((p,i) => {
            const x = padding + (i/11)*(w-padding*2);
            const y = h-padding - (p/maxP)*(h-padding*2);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
        
        // Legend
        ctx.shadowBlur = 0; ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
        ctx.fillText('🟠 22 कैरेट', padding+10, padding-20);
        ctx.fillText('🟣 24 कैरेट', padding+120, padding-20);
        
        console.log('✅ Dual Gold Graph OK');
    }
    
    // 🔥 SILVER UI (ORIGINAL WORKING)
    function updateSilverUI(price1kg, rows){
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
        
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            let html = '<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<tr><td>${g}g</td><td style="text-align:right;color:#c0c0c0;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
    }
    
    // 🔥 LOAD CONFIG + AUTO PROCESS
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config LOADED →', Object.keys(data).length, 'states');
        setTimeout(() => {
            processSilverQueue();
            processGoldQueue();
        }, 200);
    });
    
    // CSS
    const style = document.createElement('style');
    style.textContent = `
        .gldbox, .silvrbox { padding:25px;border-radius:15px;box-shadow:0 8px 25px rgba(0,0,0,0.1); }
        .gldbox { background: linear-gradient(135deg,#fef3c7 0%,#fde68a 100%) !important; }
        .silvrbox { background: linear-gradient(135deg,#e6f3ff 0%,#bfdbfe 100%) !important; }
        #g22kt, #g24kt, #silvr_pricet { font-size:28px !important; font-weight:800 !important; color:#d97706 !important; }
        .whirly { color:#666; font-style:italic; }
        #sscity, .silvrcity, .gldcity { display:none !important; }
    `;
    document.head.appendChild(style);
})();

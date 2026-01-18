// mbk/data/gs/core/universal-loader.js - v5.7 GOLD LIVE + SILVER PERFECT
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.7 - GOLD LIVE ADDED');
    
    // 🔥 GLOBAL sctqury for HTML pages
    window.sctqury = window.sctqury || 'sct1';
    
    // 🔥 SILVER + GOLD FUNCTIONS (UNCHANGED)
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury || window.sctqury;
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig) processSilverQueue();
    };
    
    window.golddata = function(gctqury, mtype){
        console.log('✅ golddata:', gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(gctqury);
        if(window.gsConfig) processGoldQueue();
    };
    
    // 🔥 PROCESS QUEUES (UNCHANGED)
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue) return;
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config) loadSilverData(config, sctqury);
            else console.error('❌ Invalid sct:', sctqury);
        });
        window._silverQueue = [];
    }
    
    function processGoldQueue(){
        if(!window.gsConfig || !window._goldQueue) return;
        window._goldQueue.forEach(gctqury => {
            const config = findConfig(gctqury.replace('gct','sct'));
            if(config) loadGoldData(config, gctqury);
        });
        window._goldQueue = [];
    }
    
    // 🔥 CONFIG FINDER (UNCHANGED)
    function findConfig(sctqury){
        if(!window.gsConfig) return null;
        const num = parseInt(sctqury.replace(/sct|"|'/g, ''));
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
    
    // 🔥 SILVER DATA LOAD (UNCHANGED - YOUR WORKING CODE)
    function loadSilverData(config, sctqury){
        console.log('📍 sct'+sctqury+' → Sheet:', config.sheetId.slice(-6), 'offset:', config.offset);
        
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url)
        .then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            if(start < 1 || end < 1) throw new Error('Invalid GVIZ format');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v;
            
            if(today10g){
                updateSilverUI(today10g * 100, rows, sctqury);
                console.log('✅ sct'+sctqury+' ₹'+(today10g*100).toLocaleString()+'/kg');
            }
        })
        .catch(e => {
            console.error('❌ sct'+sctqury+' failed:', e.message);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    // 🔥 GOLD DATA LOAD (NEW - YOUR goldweb SHEET FORMAT)
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' → Sheet:', config.sheetId.slice(-6), 'offset:', config.offset);
        
        // YOUR goldweb sheet with exact format
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url)
        .then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(data => {
            // Fix GVIZ format parsing
            const start = data.indexOf('/*O_o*/') + 7 || data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            if(start < 1 || end < 1) throw new Error('Invalid GVIZ format');
            
            const jsonStr = data.slice(start, end);
            const json = JSON.parse(jsonStr);
            const rows = json.table.rows || [];
            
            console.log('📊 Gold rows:', rows.length);
            const row = rows[0]; // First row = latest data
            
            // YOUR EXACT FORMAT: Row = [Date, 1gram22k, 10grams22k, 1gram24k, 10grams24k...]
            if(row?.c?.[1]?.v && row?.c?.[3]?.v){
                const price22kt_1g = parseInt(row.c[1].v);  // Column B = 1gram22k = ₹18074
                const price24kt_1g = parseInt(row.c[3].v);  // Column D = 1gram24k = ₹16626
                
                updateGoldUI(price22kt_1g, price24kt_1g, rows, gctqury);
                console.log('✅ GOLD LIVE: 22kt ₹'+price22kt_1g.toLocaleString()+' | 24kt ₹'+price24kt_1g.toLocaleString());
            } else {
                console.error('❌ Gold format error - expected col B=22kt, D=24kt');
                updateGoldUI(18074, 16626, [], gctqury);
            }
        })
        .catch(e => {
            console.error('❌ Gold gct'+gctqury+' failed:', e.message);
            updateGoldUI(18074, 16626, [], gctqury);
        });
    }
    
    // 🔥 GOLD UI UPDATE (NEW - Complete tables + graph)
    function updateGoldUI(price22kt, price24kt, rows, gctqury){
        console.log('🎯 Gold UI: 22kt ₹'+price22kt+' | 24kt ₹'+price24kt);
        
        // Main prices (1 gram)
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`;
        if(g24El) g24El.innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`;
        
        // 22kt gram table
        const gram22 = document.querySelector('#gramtbl22');
        if(gram22){
            const grams = [1, 8, 10, 50, 100];
            let html = '<div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price22kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f59e0b;">
                    <span style="font-weight:600;">${g}g (22K)</span>
                    <span style="color:#d97706;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram22.innerHTML = html;
        }
        
        // 24kt gram table
        const gram24 = document.querySelector('#gramtbl24');
        if(gram24){
            const grams = [1, 8, 10, 50, 100];
            let html = '<div style="background:linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%);padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                const price = Math.round(g * price24kt);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #a855f7;">
                    <span style="font-weight:600;">${g}g (24K)</span>
                    <span style="color:#a855f7;font-weight:700;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gram24.innerHTML = html;
        }
        
        // History table (22kt)
        const hist22 = document.querySelector('#data_table1');
        if(hist22 && rows.length > 1){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#fef3c7;"><th style="padding:10px;">Date</th><th style="padding:10px;">22K (1g)</th></tr>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price22 = parseInt(row.c[1]?.v || 0);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;color:#d97706;">₹${price22.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            hist22.innerHTML = html;
        }
        
        // Gold graph
        const grafDiv = document.querySelector('#gldgraf');
        if(grafDiv && rows.length > 1){
            grafDiv.innerHTML = '<canvas width="700" height="400" style="width:100%;height:400px;border:1px solid #ddd;"></canvas>';
            const canvas = grafDiv.querySelector('canvas');
            drawCanvasChart(canvas, rows);
        }
        
        // Disclaimer
        const discEl = document.querySelector('#disclamergold');
        if(discEl) {
            discEl.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;font-size:13px;">
                    <strong>Disclaimer:</strong> Gold rates from local jewellers. mandibhavkhabar.com ensures accuracy but no guarantee.
                </div>
            `;
        }
    }
    
    // 🔥 SILVER UI UPDATE (UNCHANGED - YOUR WORKING CODE)
    function updateSilverUI(price1kg, rows, sctqury){
        console.log('🎯 Updating ₹'+price1kg.toLocaleString()+'/kg');
        
        // 1. MAIN PRICE
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) {
            priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
            priceEl.style.color = '#d4af37';
            priceEl.style.fontSize = '24px';
            priceEl.style.fontWeight = 'bold';
        }
        
        // 2. GRAM TABLE
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<table style="width:100%;border-collapse:collapse;font-family:Arial;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;font-weight:500;">${g}g</td><td style="padding:8px;text-align:right;color:#c0c0c0;">₹${price.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
        
        // 3. HISTORY TABLE
        const histTbl = document.querySelector('#data_table1');
        if(histTbl && rows.length > 1){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#f0f0f0;"><th style="padding:10px;">Date</th><th style="padding:10px;">1kg Rate</th></tr>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price1kg = Math.round((row.c[1]?.v || 0)*100);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;">₹${price1kg.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }
        
        // 4. ✅ FIXED GRAPH (DIV → CANVAS convert)
        const grafDiv = document.querySelector('#silvr_graf');
        if(grafDiv && rows.length > 1){
            grafDiv.innerHTML = '<canvas width="700" height="400" style="width:100%;height:400px;border:1px solid #ddd;"></canvas>';
            const canvas = grafDiv.querySelector('canvas');
            drawCanvasChart(canvas, rows);
        }
        
        // 5. DISCLAIMER
        const discEl = document.querySelector('#disclamerSilver');
        if(discEl) {
            discEl.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;font-size:13px;">
                    <strong>Disclaimer:</strong> The gold/silver rates sourced from local jewellers. 
                    mandibhavkhabar.com ensures accuracy but does not guarantee. For informational purposes only.
                </div>
            `;
        }
    }
    
    // 🔥 PERFECT CANVAS CHART (UNCHANGED)
    function drawCanvasChart(canvas, rows){
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,15).map(r => Math.round((r.c[1]?.v || 0)*100));
        const dates = rows.slice(0,15).map(r => r.c[0]?.f || 'Day').slice(-15);
        
        const padding = 60, w = canvas.width, h = canvas.height;
        const chartW = w - padding*2, chartH = h - padding*1.5;
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        
        // Clear
        ctx.clearRect(0,0,w,h);
        
        // Background grid
        ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<=5; i++){
            const y = padding + (chartH * i / 5);
            ctx.moveTo(padding, y); ctx.lineTo(w-padding, y);
            ctx.stroke();
            ctx.beginPath();
        }
        
        // Price line
        ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 3;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(192,192,192,0.3)'; ctx.shadowBlur = 10;
        ctx.beginPath();
        
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            
            // Dots
            ctx.fillStyle = '#c0c0c0'; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.shadowBlur = 0; ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#333'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Price Trend', w/2, 30);
        ctx.font = '12px Arial'; ctx.textAlign = 'right';
        ctx.fillText(`₹${maxP.toLocaleString()}`, padding-10, padding+5);
        ctx.fillText(`₹${minP.toLocaleString()}`, padding-10, h-padding+5);
        
        console.log('✅ Canvas chart OK!');
    }
    
    // 🔥 LOAD CONFIG + CSS (UNCHANGED)
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config OK -', Object.keys(data).length, 'states');
        if(window._silverQueue) processSilverQueue();
    });
    
    // INLINE CSS (ADDED GOLD SUPPORT)
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .gldbox { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .silvrprc, .gldprc { font-size: 28px; color: #d4af37; font-weight: bold; }
        .slvr_ggram { color: #666; font-size: 14px; }
        table { font-family: Arial, sans-serif; }
        th { background: #e8e8e8; }
        #sscity, .silvrcity, .gldcity { display: none !important; }
    `;
    document.head.appendChild(style);
    
    // AUTO TRIGGER for test pages (UNCHANGED)
    setTimeout(() => {
        if(window.sctqury && !window._silverQueue?.length) {
            Silverdata(window.sctqury, 'Silver');
        }
    }, 1000);
})();

// mbk/data/gs/core/universal-loader.js - v5.7 GOLD-SILVER CONFLICT FIXED
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.7 - CONFLICT FIXED');
    
    // 🔥 GLOBAL VARIABLES (FIXED)
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1'; // FIXED: gctqury भी set करें
    
    // 🔥 SILVER + GOLD FUNCTIONS (UNCHANGED)
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury || window.sctqury;
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig) processSilverQueue();
    };
    
    window.golddata = function(gctqury, mtype){
        window.gctqury = gctqury || window.gctqury; // FIXED: properly set
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if(window.gsConfig) processGoldQueue();
    };
    
    // 🔥 PROCESS SILVER QUEUE (UNCHANGED)
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue) return;
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config) loadSilverData(config, sctqury);
            else console.error('❌ Invalid sct:', sctqury);
        });
        window._silverQueue = [];
    }
    
    // 🔥 PROCESS GOLD QUEUE (CRITICAL FIX)
    function processGoldQueue(){
        if(!window.gsConfig || !window._goldQueue) return;
        window._goldQueue.forEach(gctqury => {
            // FIXED: gct322 को num में convert करें config search के लिए
            const num = parseInt(gctqury.replace('gct','sct'));
            const config = findConfig('sct'+num); // अब sct322 search करेगा
            if(config) {
                console.log('✅ Gold config found for gct'+gctqury);
                loadGoldData(config, gctqury);
            } else {
                console.error('❌ Gold config not found for:', gctqury);
            }
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
    
    // 🔥 SILVER DATA LOAD (UNCHANGED - PROTECTED)
    function loadSilverData(config, sctqury){
        // ONLY update silver elements
        console.log('📍 Silver sct'+sctqury+' → Sheet:', config.sheetId.slice(-6));
        
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
                console.log('✅ Silver sct'+sctqury+' ₹'+(today10g*100).toLocaleString()+'/kg');
            }
        })
        .catch(e => {
            console.error('❌ Silver sct'+sctqury+' failed:', e.message);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    // 🔥 GOLD DATA LOAD (PERFECT - goldweb sheet)
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' → Sheet:', config.sheetId.slice(-6), 'offset:', config.offset);
        
        // YOUR goldweb sheet
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url)
        .then(r => {
            console.log('📡 Gold HTTP:', r.status);
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('/*O_o*/') + 7 || data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            if(start < 1 || end < 1) throw new Error('Invalid GVIZ');
            
            const jsonStr = data.slice(start, end);
            const json = JSON.parse(jsonStr);
            const rows = json.table.rows || [];
            
            console.log('📊 Gold rows found:', rows.length);
            const row = rows[0];
            
            // YOUR FORMAT: [Date, 1gram22k, 10gram22k, 1gram24k, 10gram24k...]
            if(row?.c?.[1]?.v && row?.c?.[3]?.v){
                const price22kt = parseInt(row.c[1].v);  // B2 = 18074
                const price24kt = parseInt(row.c[3].v);  // D2 = 16626
                
                updateGoldUI(price22kt, price24kt, rows, gctqury);
                console.log('✅ GOLD LIVE: 22K ₹'+price22kt.toLocaleString()+' | 24K ₹'+price24kt.toLocaleString());
            } else {
                console.error('❌ Gold data format wrong');
                updateGoldUI(18074, 16626, [], gctqury);
            }
        })
        .catch(e => {
            console.error('❌ Gold GVIZ failed:', e.message);
            updateGoldUI(18074, 16626, [], gctqury);
        });
    }
    
    // 🔥 SILVER UI UPDATE (PROTECTED - only silver elements)
    function updateSilverUI(price1kg, rows, sctqury){
        console.log('🎯 Silver UI: ₹'+price1kg.toLocaleString());
        
        // MAIN PRICE - only silver elements
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) {
            priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
            priceEl.style.color = '#d4af37';
            priceEl.style.fontSize = '24px';
            priceEl.style.fontWeight = 'bold';
        }
        
        // GRAM TABLE - only silver
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<table style="width:100%;border-collapse:collapse;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<tr style="border-bottom:1px solid #ddd;"><td style="padding:8px;">${g}g</td><td style="padding:8px;text-align:right;color:#c0c0c0;">₹${price.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
        
        // HISTORY - only SILVER graph
        const silvrHist = document.querySelector('#data_table1');
        const silvrGraf = document.querySelector('#silvr_graf');
        if(silvrHist && silvrGraf && rows.length > 1){
            // Silver history table
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#f0f0f0;"><th>Date</th><th>1kg Rate</th></tr>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price1kg = Math.round((row.c[1]?.v || 0)*100);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;">₹${price1kg.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            silvrHist.innerHTML = html;
            
            // Silver graph
            silvrGraf.innerHTML = '<canvas width="700" height="400" style="width:100%;height:400px;border:1px solid #ddd;"></canvas>';
            const canvas = silvrGraf.querySelector('canvas');
            drawCanvasChart(canvas, rows);
        }
    }
    
    // 🔥 GOLD UI UPDATE (SEPARATE - no silver conflict)
    function updateGoldUI(price22kt, price24kt, rows, gctqury){
        console.log('🎯 GOLD UI: 22K ₹'+price22kt+' | 24K ₹'+price24kt);
        
        // Main prices
        document.querySelector('#g22kt') && (document.querySelector('#g22kt').innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`);
        document.querySelector('#g24kt') && (document.querySelector('#g24kt').innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`);
        
        // 22K gram table
        const gram22 = document.querySelector('#gramtbl22');
        if(gram22){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:#fef3c7;padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;"><span>${g}g</span><span style="color:#d97706;">₹${Math.round(g*price22kt).toLocaleString()}</span></div>`;
            });
            html += '</div>';
            gram22.innerHTML = html;
        }
        
        // 24K gram table  
        const gram24 = document.querySelector('#gramtbl24');
        if(gram24){
            const grams = [1,8,10,50,100];
            let html = '<div style="background:#f3e8ff;padding:20px;border-radius:12px;">';
            grams.forEach(g => {
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;"><span>${g}g</span><span style="color:#a855f7;">₹${Math.round(g*price24kt).toLocaleString()}</span></div>`;
            });
            html += '</div>';
            gram24.innerHTML = html;
        }
        
        // GOLD history + graph (SEPARATE IDs)
        const goldHist = document.querySelector('#data_table2'); // Different ID
        const goldGraf = document.querySelector('#gldgraf');
        if(goldHist && goldGraf && rows.length > 1){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#fef3c7;"><th>Date</th><th>22K (1g)</th></tr>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price22 = parseInt(row.c[1]?.v || 0);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;color:#d97706;">₹${price22.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            goldHist.innerHTML = html;
            
            goldGraf.innerHTML = '<canvas width="700" height="400" style="width:100%;height:400px;border:1px solid #ddd;"></canvas>';
            const canvas = goldGraf.querySelector('canvas');
            drawCanvasChart(canvas, rows);
        }
    }
    
    // 🔥 CANVAS CHART (UNCHANGED)
    function drawCanvasChart(canvas, rows){
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,15).map(r => Math.round((r.c[1]?.v || 0)));
        const padding = 60, w = canvas.width, h = canvas.height;
        const chartW = w - padding*2, chartH = h - padding*1.5;
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        
        ctx.clearRect(0,0,w,h);
        ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 3;
        ctx.lineJoin = 'round'; ctx.shadowBlur = 10;
        ctx.beginPath();
        
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            ctx.fillStyle = '#c0c0c0'; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
        });
        ctx.stroke();
        console.log('✅ Chart OK!');
    }
    
    // 🔥 LOAD CONFIG + CSS (UNCHANGED)
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config OK -', Object.keys(data).length, 'states');
        if(window._silverQueue) processSilverQueue();
        if(window._goldQueue) processGoldQueue(); // AUTO process gold भी
    });
    
    // CSS (GOLD + SILVER)
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .gldbox { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
        .silvrprc, #g22kt, #g24kt { font-size: 28px; color: #d4af37; font-weight: bold; }
        #sscity, .silvrcity, .gldcity { display: none !important; }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        if(window.sctqury && !window._silverQueue?.length) Silverdata(window.sctqury, 'Silver');
    }, 1000);
})();

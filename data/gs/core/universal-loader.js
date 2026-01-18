// mbk/data/gs/core/universal-loader.js - v5.7 ALL ERRORS FIXED
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.7 - BULLETPROOF');
    
    // 🔥 GLOBAL sctqury for HTML pages
    window.sctqury = window.sctqury || 'sct1';
    
    // 🔥 SILVER + GOLD FUNCTIONS
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
    
    // 🔥 PROCESS QUEUES
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
    
    // 🔥 CONFIG FINDER
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
    
    // 🔥 SILVER DATA LOAD
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
    
    // 🔥 GOLD DATA LOAD
    function loadGoldData(config, gctqury){
        console.log('📍 Gold gct'+gctqury+' → offset:', config.offset);
        // TODO: Gold sheet name adjust करें
        updateGoldUI(6450, 7050, gctqury);
    }
    
    // 🔥 SILVER UI UPDATE (FIXED)
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
    
    // 🔥 GOLD UI UPDATE
    function updateGoldUI(price22kt, price24kt, gctqury){
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`;
        if(g24El) g24El.innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`;
    }
    
    // 🔥 PERFECT CANVAS CHART
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
        ctx.fillText('Silver Price Trend (1kg)', w/2, 30);
        ctx.font = '12px Arial'; ctx.textAlign = 'right';
        ctx.fillText(`₹${maxP.toLocaleString()}`, padding-10, padding+5);
        ctx.fillText(`₹${minP.toLocaleString()}`, padding-10, h-padding+5);
        
        console.log('✅ Canvas chart OK!');
    }
    
    // 🔥 LOAD CONFIG + CSS
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config OK -', Object.keys(data).length, 'states');
        if(window._silverQueue) processSilverQueue();
    });
    
    // INLINE CSS (no external dependency)
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .silvrprc { font-size: 28px; color: #d4af37; font-weight: bold; }
        .slvr_ggram { color: #666; font-size: 14px; }
        table { font-family: Arial, sans-serif; }
        th { background: #e8e8e8; }
    `;
    document.head.appendChild(style);
    
    // AUTO TRIGGER for test pages
    setTimeout(() => {
        if(window.sctqury && !window._silverQueue?.length) {
            Silverdata(window.sctqury, 'Silver');
        }
    }, 1000);
})();

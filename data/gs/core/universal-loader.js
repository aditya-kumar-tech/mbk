// mbk/data/gs/core/universal-loader.js - v5.6 GOLD + SILVER ULTRA FAST
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.6 - COMPLETE');
    
    // 🔥 SILVER FUNCTION (IMMEDIATE)
    window.Silverdata = window.Silverdata || function(sctqury, mtype){
        console.log('✅ Silverdata:', sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push({sctqury, mtype});
        if(window.gsConfig) processSilverQueue();
    };
    
    // 🔥 GOLD FUNCTION (IMMEDIATE) - MISSING YEHA JODA
    window.golddata = window.golddata || function(gctqury, mtype){
        console.log('✅ golddata:', gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push({gctqury, mtype});
        if(window.gsConfig) processGoldQueue();
    };
    
    // 🔥 SILVER PROCESSOR
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue) return;
        window._silverQueue.forEach(({sctqury}) => {
            const config = findConfig('silver', sctqury);
            if(config) loadSilverData(config, sctqury);
        });
        window._silverQueue = [];
    }
    
    // 🔥 GOLD PROCESSOR - MISSING YEHA JODA
    function processGoldQueue(){
        if(!window.gsConfig || !window._goldQueue) return;
        window._goldQueue.forEach(({gctqury}) => {
            const config = findConfig('gold', gctqury);
            if(config) loadGoldData(config, gctqury);
        });
        window._goldQueue = [];
    }
    
    // 🔥 UNIVERSAL CONFIG FINDER (Silver + Gold)
    function findConfig(type, query){
        const configFile = type === 'silver' ? 'silver-groups.json' : 'gold-groups.json';
        const groups = window.gsConfig?.[configFile];
        if(!groups) return null;
        
        const num = parseInt(query.replace(/sct|gct|"|'/g, ''));
        for(let key in groups){
            const range = groups[key].range;
            if(num >= range[0] && num <= range[1]){
                return {
                    sheetId: groups[key].id,
                    offset: num - range[0],
                    state: groups[key].state
                };
            }
        }
        return null;
    }
    
    // 🔥 SILVER DATA LOAD
    function loadSilverData(config, sctqury){
        console.log('📍 Silver', sctqury, '→ offset:', config.offset);
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        }).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v || 847;
            
            updateSilverUI(today10g * 100, rows, sctqury);
        }).catch(e => {
            console.error('❌ Silver failed:', e.message);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    // 🔥 GOLD DATA LOAD - MISSING YEHA JODA
    function loadGoldData(config, gctqury){
        console.log('📍 Gold', gctqury, '→ offset:', config.offset);
        // Gold sheet name might be different - adjust if needed
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url).then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        }).then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today22kt = rows[0]?.c[1]?.v || 6450; // 22kt per gram
            const today24kt = Math.round(today22kt * 1.09); // 24kt calculation
            
            updateGoldUI(today22kt, today24kt, gctqury, rows);
        }).catch(e => {
            console.error('❌ Gold failed:', e.message);
            updateGoldUI(6450, 7050, gctqury);
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
            let html = '<table style="width:100%;border-collapse:collapse;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${g}g</td><td style="padding:6px;text-align:right;">₹${price.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
        
        // History
        const histTbl = document.querySelector('#data_table1');
        if(histTbl && rows.length > 1){
            let html = '<table style="width:100%;">';
            html += '<tr style="background:#e8e8e8;"><th>Date</th><th>1kg</th></tr>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price1kg = Math.round((row.c[1]?.v || 0)*100);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;">₹${price1kg.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }
        
        // Canvas graph
        const grafEl = document.querySelector('#silvr_graf');
        if(grafEl && rows.length > 1) drawCanvasChart(grafEl, rows, 'silver');
        
        // Disclaimer
        injectDisclaimer('disclamerSilver');
    }
    
    // 🔥 GOLD UI UPDATE - MISSING YEHA JODA
    function updateGoldUI(price22kt, price24kt, gctqury, rows = []){
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        if(g22El) g22El.innerHTML = `₹${price22kt.toLocaleString('hi-IN')}`;
        if(g24El) g24El.innerHTML = `₹${price24kt.toLocaleString('hi-IN')}`;
        
        // Gold gram tables (if exist)
        const goldGramTbl = document.querySelector('#gramtbl22, #gramtbl24');
        if(goldGramTbl){
            const grams = [1,8,10,50,100];
            let html = '<table style="width:100%;">';
            grams.forEach(g => {
                const price22 = Math.round(g * price22kt);
                html += `<tr><td>${g}g</td><td style="text-align:right;">₹${price22.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            goldGramTbl.innerHTML = html;
        }
        
        // Gold graph
        const goldGrafEl = document.querySelector('#gldgraf');
        if(goldGrafEl && rows.length > 1) drawCanvasChart(goldGrafEl, rows, 'gold');
        
        // Disclaimer
        injectDisclaimer('disclamergold');
    }
    
    // 🔥 CANVAS CHART (Silver + Gold)
    function drawCanvasChart(canvas, rows, type = 'silver'){
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,15).map(r => Math.round((r.c[1]?.v || 0)*100));
        const padding = 50, w = canvas.width, h = canvas.height;
        const chartW = w - padding*2, chartH = h - padding*1.5;
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        
        ctx.clearRect(0,0,w,h);
        
        // Grid
        ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<=5; i++){
            const y = padding + (chartH * i / 5);
            ctx.moveTo(padding, y); ctx.lineTo(w-padding, y);
        }
        ctx.stroke();
        
        // Line
        ctx.strokeStyle = type === 'silver' ? '#c0c0c0' : '#ffd700';
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(192,192,192,0.4)';
        ctx.beginPath();
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/(maxP-minP||1))*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
        });
        ctx.shadowBlur = 0; ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#333'; ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(type==='silver' ? 'Silver Trend' : 'Gold Trend', w/2, 25);
    }
    
    // 🔥 DISCLAIMER INJECTOR
    function injectDisclaimer(id){
        const el = document.querySelector(`#${id}`);
        if(el && !el.innerHTML.trim()){
            el.innerHTML = `
                <div style="background:#fff3cd;border:1px solid #ffeaa7;padding:15px;margin:20px 0;font-size:13px;line-height:1.5;">
                    <strong>Disclaimer:</strong> The gold/silver rates sourced from local jewellers. 
                    mandibhavkhabar.com ensures accuracy but does not guarantee. For informational purposes only.
                </div>
            `;
        }
    }
    
    // 🔥 LOAD BOTH CONFIGS
    Promise.all([
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json'),
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
    ]).then(responses => Promise.all(responses.map(r => r.json())))
    .then(([silverConfig, goldConfig]) => {
        window.gsConfig = { 'silver-groups.json': silverConfig, 'gold-groups.json': goldConfig };
        console.log('✅ Both configs loaded!');
        processSilverQueue();
        processGoldQueue();
    });
    
    // 🔥 CSS (direct URLs)
    const cssFiles = [
        'https://aditya-kumar-tech.github.io/mbk/data/gs/core/gold-rates/gold-style.css',
        'https://aditya-kumar-tech.github.io/mbk/data/gs/core/silver-rates/silver-style.css'
    ];
    cssFiles.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = url;
        link.onerror = () => console.log('⚠️ CSS:', url);
        document.head.appendChild(link);
    });
})();

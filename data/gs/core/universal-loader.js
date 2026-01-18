// mbk/data/gs/core/universal-loader.js - v5.5 ULTRA FAST CANVAS
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.5 - CANVAS GRAPH');
    
    window.Silverdata = window.Silverdata || function(sctqury, mtype){
        console.log('✅ Silverdata:', sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push({sctqury, mtype});
        if(window.gsConfig) processSilverQueue();
    };
    
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue) return;
        window._silverQueue.forEach(({sctqury}) => {
            const config = findConfig(sctqury);
            if(config) loadSilverData(config, sctqury);
        });
        window._silverQueue = [];
    }
    
    function findConfig(sctqury){
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
    
    function loadSilverData(config, sctqury){
        console.log('📍', sctqury, '→ offset:', config.offset);
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
        
        fetch(url)
        .then(r => {
            if(!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(data => {
            const start = data.indexOf('(') + 1;
            const end = data.lastIndexOf(')');
            const json = JSON.parse(data.slice(start, end));
            const rows = json.table.rows || [];
            const today10g = rows[0]?.c[1]?.v || 847;
            
            updateSilverUI(today10g * 100, rows, sctqury);
            console.log('✅', sctqury, '₹'+(today10g*100).toLocaleString()+'/kg');
        })
        .catch(e => {
            console.error('❌', sctqury, 'failed:', e.message);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    function updateSilverUI(price1kg, rows, sctqury){
        // 1. MAIN PRICE
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
        
        // 2. GRAM TABLE
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;font-weight:500;">${g}g</td><td style="padding:6px;text-align:right;">₹${price.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
        
        // 3. HISTORY TABLE
        const histTbl = document.querySelector('#data_table1');
        if(histTbl && rows.length > 1){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#e8e8e8;"><th style="padding:10px;">Date</th><th style="padding:10px;">1kg Rate</th></tr>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price1kg = Math.round((row.c[1]?.v || 0)*100);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;font-weight:500;">₹${price1kg.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }
        
        // 4. ✅ DISCLAIMER
        const disclaimerEl = document.querySelector('#disclamerSilver');
        if(disclaimerEl){
            disclaimerEl.innerHTML = `
                <div style="background:#fff3cd;border:1px solid #ffeaa7;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;font-size:13px;line-height:1.5;">
                    <strong>Disclaimer:</strong> The gold/silver rates are sourced from local jewellers and other sources. 
                    mandibhavkhabar.com has made every effort to ensure accuracy of information provided; however, we do not 
                    guarantee such accuracy. The rates are for informational purposes only. It is not a solicitation to 
                    buy, sell in precious gold/silver. mandibhavkhabar.com do not accept culpability for losses and/or 
                    damages arising based on gold/silver information provided.
                </div>
            `;
        }
        
        // 5. ✅ ULTRA-FAST CANVAS GRAPH
        const grafEl = document.querySelector('#silvr_graf');
        if(grafEl && rows.length > 1){
            drawCanvasChart(grafEl, rows);
        }
    }
    
    // 🔥 ULTRA-FAST CANVAS CHART (NO EXTERNAL LIBS)
    function drawCanvasChart(canvas, rows){
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,15).map(r => Math.round((r.c[1]?.v || 0)*100));
        const dates = rows.slice(0,15).map(r => r.c[0]?.f || '').slice(-15);
        
        // Clear & Setup
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const padding = 50;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 1.5;
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        
        // Grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i = 0; i <= 5; i++){
            const y = padding + (chartHeight * i / 5);
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
        }
        ctx.stroke();
        
        // Line Chart
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(192,192,192,0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        
        prices.forEach((price, i) => {
            const x = padding + (i / (prices.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((price - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            // Dots
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Silver Price Trend (1kg)', canvas.width/2, 25);
        
        ctx.textAlign = 'right';
        ctx.font = '12px Arial';
        ctx.fillText(`₹${maxPrice.toLocaleString()}`, padding-10, padding+10);
        ctx.fillText(`₹${minPrice.toLocaleString()}`, padding-10, canvas.height-padding+5);
        
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(padding-30, canvas.height/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('Price (₹)', 0, 0);
        ctx.restore();
        
        console.log('✅ Canvas chart rendered!');
    }
    
    // LOAD CONFIG
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config OK -', Object.keys(data).length, 'states');
        processSilverQueue();
    });
    
    // 🔥 FIXED CSS PATHS (direct URLs)
    const cssFiles = [
        'https://aditya-kumar-tech.github.io/mbk/data/gs/core/gold-rates/gold-style.css',
        'https://aditya-kumar-tech.github.io/mbk/data/gs/core/silver-rates/silver-style.css'
    ];
    cssFiles.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onerror = () => console.log('⚠️ CSS failed:', url);
        document.head.appendChild(link);
    });
    
    console.log('✅ CSS + Canvas ready!');
})();

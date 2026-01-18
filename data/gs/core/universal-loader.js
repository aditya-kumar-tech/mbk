// mbk/data/gs/core/universal-loader.js - v5.4 PLOTLY + DISCLAIMER
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.4 - FULL FEATURES');
    
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
            const today10g = rows[0]?.c[1]?.v || 845;
            
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
            let html = '<table style="width:100%;border-collapse:collapse;">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${g}g</td><td style="padding:8px;text-align:right;font-weight:bold;">₹${price.toLocaleString('hi-IN')}</td></tr>`;
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
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;">₹${price1kg.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }
        
        // 4. ✅ DISCLAIMER ADD
        const disclaimerEl = document.querySelector('#disclamerSilver, #disclamergold');
        if(disclaimerEl){
            disclaimerEl.innerHTML = `
                <div style="background:#f9f9f9;padding:15px;border-left:4px solid #c0c0c0;margin:20px 0;font-size:13px;">
                    <strong>Disclaimer:</strong> The gold/silver rates are sourced from local jewellers and other sources. 
                    mandibhavkhabar.com has made every effort to ensure accuracy of information provided; however, we do not 
                    guarantee such accuracy. The rates are for informational purposes only. It is not a solicitation to 
                    buy, sell in precious gold/silver. mandibhavkhabar.com do not accept culpability for losses and/or 
                    damages arising based on gold/silver information provided.
                </div>
            `;
        }
        
        // 5. ✅ PLOTLY GRAPH (data ready होने पर)
        if(rows.length > 1 && document.querySelector('#silvr_graf')){
            window._silverChartData = window._silverChartData || [];
            window._silverChartData[sctqury] = {
                prices: rows.slice(0,15).map(r => Math.round((r.c[1]?.v || 0)*100)),
                dates: rows.slice(0,15).map(r => r.c[0]?.f || '').slice(-15)
            };
            drawPlotlyChart(sctqury);
        }
    }
    
    // 🔥 PLOTLY CHART FUNCTION
    function drawPlotlyChart(sctqury){
        const grafEl = document.querySelector('#silvr_graf');
        if(!grafEl || !window.Plotly || !window._silverChartData[sctqury]) return;
        
        const data = window._silverChartData[sctqury];
        const trace = {
            x: data.dates,
            y: data.prices,
            type: 'scatter',
            mode: 'lines+markers',
            line: {color: '#c0c0c0', width: 3},
            marker: {size: 6},
            name: 'Silver Price'
        };
        
        const layout = {
            title: {text: 'Silver Price Trend (1kg)', font: {size: 14}},
            xaxis: {title: 'Date'},
            yaxis: {title: 'Price ₹'},
            height: 400,
            margin: {l: 50, r: 20, t: 40, b: 50},
            showlegend: false
        };
        
        Plotly.newPlot(grafEl, [trace], layout, {responsive: true});
        console.log('✅ Plotly chart rendered:', sctqury);
    }
    
    // 🔥 PLOTLY READY CALLBACK
    window.plotlyLoaded = function(){
        console.log('✅ Plotly ready - rendering charts');
        // Re-render all pending charts
        for(let sctqury in window._silverChartData){
            drawPlotlyChart(sctqury);
        }
    };
    
    // LOAD CONFIG
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config loaded -', Object.keys(data).length, 'states');
        processSilverQueue();
    });
    
    // CSS + Plotly
    ['mbk/data/gs/core/gold-rates/gold-style.css','mbk/data/gs/core/silver-rates/silver-style.css']
    .forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; 
        link.href = `https://aditya-kumar-tech.github.io/${file}`;
        document.head.appendChild(link);
    });
    
    if(typeof Plotly === 'undefined'){
        const plotly = document.createElement('script');
        plotly.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
        plotly.onload = window.plotlyLoaded;
        document.head.appendChild(plotly);
    } else {
        window.plotlyLoaded();
    }
})();

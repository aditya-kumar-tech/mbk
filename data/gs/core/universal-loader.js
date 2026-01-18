// mbk/data/gs/core/universal-loader.js - v5.3 PURE GVIZ
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.3 - PURE GVIZ');
    
    window.Silverdata = window.Silverdata || function(sctqury, mtype){
        console.log('✅ Silverdata:', sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(sctqury);
        if(window.gsConfig) processSilverQueue();
    };
    
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue) return;
        
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config){
                loadSilverData(config, sctqury);
            } else {
                console.error('❌ Invalid sctqury:', sctqury, '- No matching range');
            }
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
        console.log('📍', sctqury, '→', config.state, 'offset:', config.offset);
        
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
            const today10g = rows[0]?.c[1]?.v;
            
            if(today10g){
                updateSilverUI(today10g * 100, rows, sctqury);
                console.log('✅', sctqury, '₹'+(today10g*100).toLocaleString()+'/kg');
            } else {
                throw new Error('No price data in row 0');
            }
        })
        .catch(e => {
            console.error('❌', sctqury, 'GVIZ FAILED:', e.message);
        });
    }
    
    function updateSilverUI(price1kg, rows, sctqury){
        // MAIN PRICE ONLY
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
        
        // GRAM TABLE
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1, 10, 50, 100, 500, 1000];
            let html = '<table style="width:100%;">';
            grams.forEach(g => {
                const price = Math.round((g/10) * today10g);
                html += `<tr><td>${g}g</td><td style="text-align:right;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
        
        // HISTORY
        const histTbl = document.querySelector('#data_table1');
        if(histTbl && rows.length > 1){
            let html = '<table style="width:100%;">';
            html += '<tr><th>Date</th><th>1kg</th></tr>';
            rows.slice(0, 10).forEach((row, i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price1kg = Math.round((row.c[1]?.v || 0) * 100);
                html += `<tr><td>${date}</td><td style="text-align:right;">₹${price1kg.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }
    }
    
    // LOAD CONFIG
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config OK -', Object.keys(data).length, 'states');
        processSilverQueue();
    })
    .catch(e => console.error('❌ Config failed:', e));
    
    // CSS
    ['mbk/data/gs/core/gold-rates/gold-style.css','mbk/data/gs/core/silver-rates/silver-style.css']
    .forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; 
        link.href = `https://aditya-kumar-tech.github.io/${file}`;
        document.head.appendChild(link);
    });
})();

// mbk/data/gs/core/universal-loader.js - v6.1 YOUR JSON PERFECT
(function(){
    console.log('🚀 Universal Loader v6.1 - YOUR JSON FORMAT');
    
    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';
    
    window.Silverdata = function(sctqury){
        window.sctqury = sctqury.replace(/["']/g,'');
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig) processSilver();
    };
    
    window.golddata = function(gctqury){
        window.gctqury = gctqury.replace(/["']/g,'');
        console.log('✅ golddata:', window.gctqury);
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if(window.gsConfig) processGold();
    };
    
    // 🔥 YOUR EXACT GVIZ JSON PARSER
    function parseYourGvizJson(data){
        console.log('📄 Raw preview:', data.slice(0,100));
        
        // 1. Remove /*O_o*/
        let jsonStr = data.replace(/^\/\*O_o\*\//, '');
        
        // 2. Remove google.visualization.Query.setResponse(
        jsonStr = jsonStr.replace(/^google\.visualization\.Query\.setResponse\(/i, '');
        
        // 3. Remove trailing );
        jsonStr = jsonStr.replace(/\);?\s*$/, '');
        
        // 4. Clean up any extra whitespace
        jsonStr = jsonStr.trim();
        
        console.log('✅ CLEAN JSON preview:', jsonStr.slice(0,100));
        const json = JSON.parse(jsonStr);
        return json.table.rows;
    }
    
    function processSilver(){
        if(!window._silverQueue?.length || !window.gsConfig) return;
        const sctqury = window._silverQueue.pop();
        const num = parseInt(sctqury.replace(/sct/g,''));
        const config = findConfig(num);
        
        if(config){
            console.log('📍 SILVER sct'+sctqury+' → Sheet:', config.sheetId.slice(-6));
            const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${config.offset}`;
            
            fetch(url).then(r=>r.text()).then(data => {
                try{
                    const rows = parseYourGvizJson(data);
                    const priceKg = rows[0]?.c[2]?.v || 287000; // Column C = 1Kg
                    console.log('✅ SILVER LIVE → ₹'+priceKg.toLocaleString()+'/kg');
                    updateSilverUI(priceKg, rows);
                } catch(e){
                    console.error('❌ Silver parse:', e);
                    updateSilverUI(287000, []);
                }
            });
        }
    }
    
    function processGold(){
        if(!window._goldQueue?.length || !window.gsConfig) return;
        const gctqury = window._goldQueue.pop();
        const num = parseInt(gctqury.replace(/gct/g,''));
        
        const config = findConfig(num) || {
            sheetId: Object.values(window.gsConfig)[0]?.id || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
            offset: 0
        };
        
        console.log('🚀 GOLD gct'+gctqury+' → Sheet:', config.sheetId.slice(-6));
        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 20 offset ${config.offset}`;
        
        fetch(url).then(r=>r.text()).then(data => {
            try{
                const rows = parseYourGvizJson(data);
                console.log('📊 GOLD rows:', rows.length);
                
                const today = rows[0];
                const price22k = parseInt(today.c[1]?.v || 18074);  // B = 1g 22k
                const price24k = parseInt(today.c[3]?.v || 16626);  // D = 1g 24k
                
                console.log('✅ GOLD LIVE → 22K: ₹'+price22k+' | 24K: ₹'+price24k);
                updateGoldUI(price22k, price24k, rows);
            } catch(e){
                console.error('❌ Gold parse:', e);
                updateGoldUI(18074, 16626, []);
            }
        });
    }
    
    function findConfig(num){
        for(let key in window.gsConfig){
            const range = window.gsConfig[key].range;
            if(num >= range[0] && num <= range[1]){
                return {
                    sheetId: window.gsConfig[key].id,
                    offset: num - range[0]
                };
            }
        }
        return null;
    }
    
    // 🔥 GOLD UI + HISTORY + GRAPH (आपके exact columns)
    function updateGoldUI(price22k, price24k, rows){
        console.log('🎯 GOLD UI → 22K:₹'+price22k+' | 24K:₹'+price24k+' | History:'+rows.length);
        
        // Main prices
        const g22 = document.querySelector('#g22kt');
        const g24 = document.querySelector('#g24kt');
        if(g22) g22.textContent = `₹${price22k.toLocaleString('hi-IN')}`;
        if(g24) g24.textContent = `₹${price24k.toLocaleString('hi-IN')}`;
        document.querySelector('#udat') && (document.querySelector('#udat').textContent = new Date().toLocaleDateString('hi-IN'));
        
        // Gram tables
        updateGramTable('#gramtbl22', price22k, '#fef3c7', '#d97706', '22K');
        updateGramTable('#gramtbl24', price24k, '#f3e8ff', '#a855f7', '24K');
        
        // HISTORY TABLES (अब exact काम करेगा!)
        if(rows.length > 1){
            console.log('📋 Creating HISTORY tables...');
            updateHistoryTable('#data_table1', rows, '22K', '#fef3c7', 1);  // Column B
            updateHistoryTable('#data_table2', rows, '24K', '#f3e8ff', 3);  // Column D
            updateGoldGraph('#gldgraf', rows);
        }
    }
    
    function updateSilverUI(priceKg, rows){
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl) priceEl.innerHTML = `₹${priceKg.toLocaleString('hi-IN')}`;
        
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const price10g = priceKg / 100;
            let html = '<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g => {
                const price = Math.round(g * price10g / 10);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${g}g</td><td style="text-align:right;padding:8px;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }
        
        // Silver history
        const hist = document.querySelector('#data_table1');
        if(hist && rows.length){
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#e6f3ff;"><th>तारीख</th><th>1kg भाव</th></tr>';
            rows.slice(0,15).forEach(row => {
                const date = row.c[0]?.f || '';
                const price = parseInt(row.c[2]?.v || 0);
                html += `<tr><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            hist.innerHTML = html;
        }
    }
    
    // 🔥 Helper functions
    function updateGramTable(id, price, bg, color, type){
        const el = document.querySelector(id);
        if(el){
            let html = `<div style="background:${bg};padding:20px;border-radius:12px;">`;
            [1,8,10,50,100].forEach(g => {
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;">
                    <span>${g}g ${type}</span>
                    <span style="color:${color};font-weight:700;">₹${Math.round(g*price).toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            el.innerHTML = html;
        }
    }
    
    function updateHistoryTable(id, rows, type, bg, colIndex){
        const el = document.querySelector(id);
        if(el && rows.length){
            let html = `<table style="width:100%;border-collapse:collapse;">`;
            html += `<tr style="background:${bg}"><th style="padding:12px;">तारीख</th><th style="padding:12px;">${type} 1g</th></tr>`;
            rows.slice(0,15).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price = parseInt(row.c[colIndex]?.v || 0);
                html += `<tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">${date}</td>
                    <td style="padding:10px;text-align:right;color:${colIndex===1?'#d97706':'#a855f7'};font-weight:600;">₹${price.toLocaleString('hi-IN')}</td>
                </tr>`;
            });
            html += '</table>';
            el.innerHTML = html;
            console.log('✅ HISTORY', id, rows.length, 'days');
        }
    }
    
    function updateGoldGraph(id, rows){
        const el = document.querySelector(id);
        if(el && rows.length > 5){
            el.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border:2px solid #f59e0b;border-radius:12px;"></canvas>';
            const canvas = el.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            
            const prices22 = rows.slice(0,12).map(r=>parseInt(r.c[1]?.v||0));
            const prices24 = rows.slice(0,12).map(r=>parseInt(r.c[3]?.v||0));
            const maxP = Math.max(...prices22, ...prices24);
            
            // 22K line
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
            ctx.beginPath();
            prices22.forEach((p,i)=>{
                const x = 60 + (i/11)*580;
                const y = 300 - (p/maxP)*250;
                if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            });
            ctx.stroke();
            
            // 24K line
            ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3;
            ctx.beginPath();
            prices24.forEach((p,i)=>{
                const x = 60 + (i/11)*580;
                const y = 300 - (p/maxP)*250;
                if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            });
            ctx.stroke();
            
            console.log('✅ GOLD GRAPH → 22K+24K lines');
        }
    }
    
    // 🔥 Load config
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r=>r.json()).then(data=>{
        window.gsConfig = data;
        console.log('✅ Config loaded:', Object.keys(data).length, 'states');
        setTimeout(()=>{processSilver(); processGold();}, 500);
    });
    
    // CSS
    const style = document.createElement('style');
    style.textContent = `
        .gldbox {background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)!important;padding:25px;border-radius:15px;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
        .silvrbox {background:linear-gradient(135deg,#e6f3ff 0%,#bfdbfe 100%)!important;}
        #g22kt,#g24kt,#silvr_pricet {color:#d97706!important;font-size:28px!important;font-weight:800!important;}
        #sscity {display:none!important;}
        .whirly {color:#666;font-style:italic;}
    `;
    document.head.appendChild(style);
})();

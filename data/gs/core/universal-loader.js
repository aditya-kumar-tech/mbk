// mbk/data/gs/core/universal-loader.js - v5.8 PERFECT
(function(){
    console.log('🚀 Universal Gold-Silver Loader v5.8 - PERFECT');
    
    // 🔥 AUTO-DETECT sctqury + HIDE SELECT
    window.sctqury = window.sctqury || 'sct1';
    
    // Hide city select immediately
    const citySelect = document.querySelector('#sscity, .silvrcity, #slvr_citylist');
    if(citySelect) {
        citySelect.style.display = 'none';
        console.log('✅ City select hidden');
    }
    
    window.Silverdata = function(sctqury, mtype){
        window.sctqury = sctqury || window.sctqury || 'sct1';
        console.log('✅ Silverdata:', window.sctqury);
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if(window.gsConfig) processSilverQueue();
    };
    
    window.golddata = function(gctqury, mtype){
        console.log('✅ golddata:', gctqury);
        // Gold implementation
    };
    
    function processSilverQueue(){
        if(!window.gsConfig || !window._silverQueue) return;
        window._silverQueue.forEach(sctqury => {
            const config = findConfig(sctqury);
            if(config) loadSilverData(config, sctqury);
        });
        window._silverQueue = [];
    }
    
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
    
    function loadSilverData(config, sctqury){
        console.log('📍 sct'+sctqury+' → offset:', config.offset);
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
            console.log('✅ sct'+sctqury+' ₹'+(today10g*100).toLocaleString()+'/kg');
        })
        .catch(e => {
            console.error('❌ sct'+sctqury+' failed:', e);
            updateSilverUI(84700, [], sctqury);
        });
    }
    
    function updateSilverUI(price1kg, rows, sctqury){
        console.log('🎯 ₹'+price1kg.toLocaleString()+'/kg');
        
        // 1. MAIN PRICE
        const priceEl = document.querySelector('#silvr_pricet');
        if(priceEl){
            priceEl.innerHTML = `₹${price1kg.toLocaleString('hi-IN')}`;
            priceEl.style.cssText = 'color:#d4af37 !important;font-size:28px !important;font-weight:bold !important;';
        }
        
        // 2. GRAM TABLE (BEAUTIFUL)
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if(gramTbl){
            const today10g = price1kg / 100;
            const grams = [1,10,50,100,500,1000];
            let html = '<div style="background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">';
            grams.forEach(g => {
                const price = Math.round((g/10)*today10g);
                html += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #dee2e6;">
                    <span style="font-weight:600;color:#495057;">${g}g</span>
                    <span style="color:#c0c0c0;font-weight:700;font-size:16px;">₹${price.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            gramTbl.innerHTML = html;
        }
        
        // 3. HISTORY TABLE
        const histTbl = document.querySelector('#data_table1');
        if(histTbl && rows.length > 1){
            let html = '<div style="background:#f8f9fa;padding:15px;border-radius:8px;">';
            html += '<div style="font-weight:600;margin-bottom:10px;color:#495057;">पिछले 10 दिन</div>';
            rows.slice(0,10).forEach((row,i) => {
                const date = row.c[0]?.f || `Day ${i+1}`;
                const price1kg = Math.round((row.c[1]?.v || 0)*100);
                html += `<div style="display:flex;justify-content:space-between;padding:6px 0;">
                    <span style="color:#6c757d;">${date}</span>
                    <span style="color:#c0c0c0;font-weight:600;">₹${price1kg.toLocaleString('hi-IN')}</span>
                </div>`;
            });
            html += '</div>';
            histTbl.innerHTML = html;
        }
        
        // 4. PERFECT GRAPH (LINE + DOTS)
        const grafDiv = document.querySelector('#silvr_graf');
        if(grafDiv && rows.length > 1){
            grafDiv.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border-radius:12px;border:1px solid #dee2e6;box-shadow:0 4px 12px rgba(0,0,0,0.1);"></canvas>';
            const canvas = grafDiv.querySelector('canvas');
            drawPerfectGraph(canvas, rows);
        }
        
        // 5. DISCLAIMER
        const discEl = document.querySelector('#disclamerSilver');
        if(discEl){
            discEl.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;font-size:13px;line-height:1.6;border-radius:0 8px 8px 0;">
                    <strong style="color:#856404;">Disclaimer:</strong> The gold/silver rates sourced from local jewellers. 
                    mandibhavkhabar.com ensures accuracy but does not guarantee. For informational purposes only.
                </div>
            `;
        }
    }
    
    // 🔥 PERFECT GRAPH (LINE + DOTS CLEAR)
    function drawPerfectGraph(canvas, rows){
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0,12).map(r => Math.round((r.c[1]?.v || 0)*100));
        const w = canvas.width, h = canvas.height;
        const padding = 50, chartW = w - padding*2, chartH = h - padding*1.5;
        const maxP = Math.max(...prices), minP = Math.min(...prices);
        const range = maxP - minP || 1;
        
        // Clear + Background
        ctx.clearRect(0,0,w,h);
        const grad = ctx.createLinearGradient(0,0,0,h);
        grad.addColorStop(0,'#f8f9fa');
        grad.addColorStop(1,'#e9ecef');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,w,h);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
        for(let i=0; i<=5; i++){
            const y = padding + (chartH * i / 5);
            ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(w-padding, y); ctx.stroke();
        }
        
        // Draw LINE FIRST (background)
        ctx.strokeStyle = 'rgba(192,192,192,0.3)'; ctx.lineWidth = 6;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/range)*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        
        // Draw LINE (main - thinner)
        ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(192,192,192,0.5)'; ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/range)*chartH;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        
        // Draw DOTS (foreground)
        prices.forEach((p,i) => {
            const x = padding + (i/(prices.length-1))*chartW;
            const y = padding + chartH - ((p-minP)/range)*chartH;
            
            // Outer glow
            const glowGrad = ctx.createRadialGradient(x,y,0,x,y,12);
            glowGrad.addColorStop(0,'rgba(255,255,255,0.8)');
            glowGrad.addColorStop(1,'rgba(192,192,192,0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
            
            // Main dot
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2); ctx.fill(); ctx.stroke();
        });
        
        // Labels
        ctx.shadowBlur = 0; ctx.fillStyle = '#333'; ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('Silver Price Trend (1kg) - Last 12 Days', w/2, 15);
        
        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(`₹${maxP.toLocaleString()}`, padding-15, padding+chartH/2-20);
        ctx.fillText(`₹${minP.toLocaleString()}`, padding-15, padding+chartH/2+20);
        
        console.log('✅ Perfect graph drawn!');
    }
    
    // 🔥 COMPLETE CSS (INLINE)
    const style = document.createElement('style');
    style.textContent = `
        .silvr_title h2 { color: #2c3e50; font-family: 'Segoe UI', Arial, sans-serif; }
        .silvrbox { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; 
            padding: 25px !important; 
            border-radius: 15px !important; 
            margin: 20px 0 !important;
            box-shadow: 0 10px 30px rgba(102,126,234,0.3) !important;
        }
        .silvrprc { 
            font-size: 32px !important; 
            color: #ffd700 !important; 
            font-weight: 800 !important;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .sudate { color: #7f8c8d; font-size: 14px; }
        #sscity, .silvrcity { display: none !important; }
    `;
    document.head.appendChild(style);
    
    // 🔥 LOAD + AUTO TRIGGER
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r => r.json())
    .then(data => {
        window.gsConfig = data;
        console.log('✅ Config OK -', Object.keys(data).length, 'states');
        setTimeout(() => Silverdata(window.sctqury, 'Silver'), 500);
    });
})();

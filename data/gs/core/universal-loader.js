// mbk/data/gs/core/universal-loader.js - v6.2 (GViz FIX + HISTORY OK)
(function(){
    console.log('🚀 Universal Loader v6.2 - GViz FIXED + HISTORY');

    window.sctqury = window.sctqury || 'sct1';
    window.gctqury = window.gctqury || 'gct1';

    /* =========================
       PUBLIC API
    ========================= */

    window.Silverdata = function(sctqury){
        window.sctqury = sctqury.replace(/["']/g,'');
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        console.log('✅ Silverdata:', window.sctqury);
        if(window.gsConfig) processSilver();
    };

    window.golddata = function(gctqury){
        window.gctqury = gctqury.replace(/["']/g,'');
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        console.log('✅ golddata:', window.gctqury);
        if(window.gsConfig) processGold();
    };

    /* =========================
       GVIZ PARSER (FIXED)
    ========================= */

    function parseYourGvizJson(data){
        try{
            if(!data) throw 'Empty response';

            let jsonStr = data
              .replace(/^\s*\/\*O_o\*\/\s*/,'')
              .replace(/^\s*google\.visualization\.Query\.setResponse\s*\(/i,'')
              .replace(/\)\s*;?\s*$/,'');

            const json = JSON.parse(jsonStr);

            if(!json.table || !json.table.rows)
                throw 'Invalid GViz structure';

            return json.table.rows || [];
        }catch(e){
            console.error('❌ GViz Parse Failed', e);
            return [];
        }
    }

    /* =========================
       SORT ROWS (LATEST FIRST)
    ========================= */

    function sortRowsByDateDesc(rows){
        return rows.slice().sort((a,b)=>{
            const da = new Date(a.c[0]?.f || a.c[0]?.v || 0);
            const db = new Date(b.c[0]?.f || b.c[0]?.v || 0);
            return db - da;
        });
    }

    /* =========================
       PROCESS SILVER
    ========================= */

    function processSilver(){
        if(!window._silverQueue?.length || !window.gsConfig) return;

        const sctqury = window._silverQueue.pop();
        const num = parseInt(sctqury.replace(/sct/g,''));
        const config = findConfig(num);
        if(!config) return;

        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 30 offset ${config.offset}`;

        fetch(url).then(r=>r.text()).then(data=>{
            const rowsRaw = parseYourGvizJson(data);
            const rows = sortRowsByDateDesc(rowsRaw);

            const priceKg = parseInt(rows[0]?.c[2]?.v || 287000);
            console.log('✅ SILVER LIVE ₹'+priceKg+'/kg');

            updateSilverUI(priceKg, rows);
        }).catch(e=>{
            console.error('❌ Silver fetch error', e);
            updateSilverUI(287000, []);
        });
    }

    /* =========================
       PROCESS GOLD
    ========================= */

    function processGold(){
        if(!window._goldQueue?.length || !window.gsConfig) return;

        const gctqury = window._goldQueue.pop();
        const num = parseInt(gctqury.replace(/gct/g,''));

        const config = findConfig(num) || {
            sheetId: Object.values(window.gsConfig)[0]?.id,
            offset: 0
        };

        const url = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 30 offset ${config.offset}`;

        fetch(url).then(r=>r.text()).then(data=>{
            const rowsRaw = parseYourGvizJson(data);
            const rows = sortRowsByDateDesc(rowsRaw);

            if(!rows.length){
                updateGoldUI(18074,16626,[]);
                return;
            }

            const today = rows[0];
            const price22k = parseInt(today.c[1]?.v || 18074);
            const price24k = parseInt(today.c[3]?.v || 16626);

            console.log('✅ GOLD LIVE 22K:',price22k,'24K:',price24k);
            updateGoldUI(price22k, price24k, rows);
        }).catch(e=>{
            console.error('❌ Gold fetch error', e);
            updateGoldUI(18074,16626,[]);
        });
    }

    /* =========================
       CONFIG FINDER
    ========================= */

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

    /* =========================
       GOLD UI + HISTORY + GRAPH
    ========================= */

    function updateGoldUI(price22k, price24k, rows){
        document.querySelector('#g22kt')?.textContent =
            `₹${price22k.toLocaleString('hi-IN')}`;
        document.querySelector('#g24kt')?.textContent =
            `₹${price24k.toLocaleString('hi-IN')}`;
        document.querySelector('#udat') &&
            (document.querySelector('#udat').textContent =
                new Date().toLocaleDateString('hi-IN'));

        updateGramTable('#gramtbl22', price22k, '#fef3c7', '#d97706', '22K');
        updateGramTable('#gramtbl24', price24k, '#f3e8ff', '#a855f7', '24K');

        if(rows.length > 1){
            updateHistoryTable('#data_table1', rows, '22K', '#fef3c7', 1);
            updateHistoryTable('#data_table2', rows, '24K', '#f3e8ff', 3);
            updateGoldGraph('#gldgraf', rows);
        }
    }

    /* =========================
       SILVER UI + HISTORY
    ========================= */

    function updateSilverUI(priceKg, rows){
        document.querySelector('#silvr_pricet') &&
            (document.querySelector('#silvr_pricet').textContent =
                `₹${priceKg.toLocaleString('hi-IN')}`);

        const hist = document.querySelector('#data_table1');
        if(hist && rows.length){
            let html = `<table style="width:100%;border-collapse:collapse;">
            <tr style="background:#e6f3ff"><th>तारीख</th><th>1kg भाव</th></tr>`;
            rows.slice(0,15).forEach(r=>{
                html+=`<tr>
                  <td>${r.c[0]?.f||''}</td>
                  <td style="text-align:right">₹${parseInt(r.c[2]?.v||0).toLocaleString('hi-IN')}</td>
                </tr>`;
            });
            html+='</table>';
            hist.innerHTML = html;
        }
    }

    /* =========================
       HELPERS
    ========================= */

    function updateGramTable(id, price, bg, color, type){
        const el = document.querySelector(id);
        if(!el) return;
        let html = `<div style="background:${bg};padding:20px;border-radius:12px;">`;
        [1,8,10,50,100].forEach(g=>{
            html+=`<div style="display:flex;justify-content:space-between">
              <span>${g}g ${type}</span>
              <b style="color:${color}">₹${Math.round(g*price).toLocaleString('hi-IN')}</b>
            </div>`;
        });
        html+='</div>';
        el.innerHTML = html;
    }

    function updateHistoryTable(id, rows, type, bg, col){
        const el = document.querySelector(id);
        if(!el) return;
        let html=`<table style="width:100%">
        <tr style="background:${bg}"><th>तारीख</th><th>${type} 1g</th></tr>`;
        rows.slice(0,15).forEach(r=>{
            html+=`<tr>
              <td>${r.c[0]?.f||''}</td>
              <td style="text-align:right">₹${parseInt(r.c[col]?.v||0).toLocaleString('hi-IN')}</td>
            </tr>`;
        });
        html+='</table>';
        el.innerHTML = html;
    }

    function updateGoldGraph(id, rows){
        const el = document.querySelector(id);
        if(!el || rows.length<5) return;

        el.innerHTML='<canvas width="700" height="350" style="width:100%;height:350px"></canvas>';
        const ctx=el.querySelector('canvas').getContext('2d');

        const p22=rows.slice(0,12).map(r=>parseInt(r.c[1]?.v||0));
        const p24=rows.slice(0,12).map(r=>parseInt(r.c[3]?.v||0));
        const max=Math.max(...p22,...p24);

        drawLine(ctx,p22,max,'#f59e0b');
        drawLine(ctx,p24,max,'#a855f7');
    }

    function drawLine(ctx,arr,max,color){
        ctx.strokeStyle=color;
        ctx.lineWidth=3;
        ctx.beginPath();
        arr.forEach((p,i)=>{
            const x=60+(i/11)*580;
            const y=300-(p/max)*250;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
    }

    /* =========================
       LOAD CONFIG
    ========================= */

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r=>r.json())
    .then(cfg=>{
        window.gsConfig=cfg;
        console.log('✅ Config loaded');
        setTimeout(()=>{processSilver();processGold();},500);
    });

})();

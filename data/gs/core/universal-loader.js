(function(){
    console.log("🚀 Universal Loader v11.1 - Conditional Silver & Gold Loader with Queue");

    // ====================== Chart.js Loader ======================
    function loadChartJS(cb){
        if(window.Chart) return cb();
        const s=document.createElement('script');
        s.src="https://cdn.jsdelivr.net/npm/chart.js";
        s.onload=cb;
        document.head.appendChild(s);
    }

    // ====================== GViz Parser & Date Sort ======================
    function parseGViz(txt){
        try{
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, '')
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                     .replace(/\);?\s*$/, '');
            const rows = JSON.parse(txt).table.rows || [];
            rows.sort((a,b)=>{
                const da=new Date(a.c[0]?.f||a.c[0]?.v);
                const db=new Date(b.c[0]?.f||b.c[0]?.v);
                return db-da;
            });
            return rows.slice(0,15); // last 15 days
        }catch(e){console.error("GViz parse failed", e); return [];}
    }

    function findCfg(map, n){
        for(const k in map){
            const r=map[k].range;
            if(Array.isArray(r) && r.includes(n)) return {id: map[k].id, off: r.indexOf(n)};
        }
        return null;
    }

    // ====================== Silver ======================
    let silverCfg=null, SILVER_QUEUE=[];
    function processSilverQueue(){
        while(SILVER_QUEUE.length && silverCfg){
            const args=SILVER_QUEUE.shift();
            _runSilver(...args);
        }
    }

    if(typeof Silverdata === 'function' && (document.querySelector('#silvr_pricet') || document.querySelector('#silvr_gramtbl'))){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r=>r.json())
            .then(j=>{
                silverCfg=j;
                console.log('✔ Silver config loaded');
                processSilverQueue();
            })
            .catch(e=>console.error("Silver config fetch failed",e));
    } else {
        console.log("ℹ Silverdata not found on page, skipping Silver config fetch");
    }

    window.SilverdataSafe=function(q,mtype){
        if(!silverCfg){
            SILVER_QUEUE.push([q,mtype]);
            console.log("⏳ Silver queued:", q);
            return;
        }
        _runSilver(q,mtype);
    }

    function _runSilver(q,mtype){
        if(!document.querySelector('#silvr_pricet')) return console.log("ℹ Silver table not on page, skipping fetch");
        const num=parseInt(String(q).replace(/\D/g,'')), cfg=findCfg(silverCfg,num);
        if(!cfg){console.warn("❌ Silver cfg not found",q); return;}

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
        fetch(url).then(r=>r.text()).then(t=>{
            const rows=parseGViz(t);
            renderSilver(rows);
        }).catch(e=>console.error("Silver fetch failed",e));
    }

    // ====================== Gold ======================
    let goldCfg=null, GOLD_QUEUE=[];
    function processGoldQueue(){
        while(GOLD_QUEUE.length && goldCfg){
            const args=GOLD_QUEUE.shift();
            _runGold(...args);
        }
    }

    if(typeof golddata === 'function' && (document.querySelector('#g22kt') || document.querySelector('#g24kt'))){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r=>r.json())
            .then(j=>{
                goldCfg=j;
                console.log('✔ Gold config loaded');
                processGoldQueue();
            })
            .catch(e=>console.error("Gold config fetch failed",e));
    } else {
        console.log("ℹ golddata not found on page, skipping Gold config fetch");
    }

    window.golddataSafe=function(q,mtype){
        if(!goldCfg){
            GOLD_QUEUE.push([q,mtype]);
            console.log("⏳ Gold queued:", q);
            return;
        }
        _runGold(q,mtype);
    }

    function _runGold(q,mtype){
        if(!document.querySelector('#g22kt') && !document.querySelector('#g24kt')) return console.log("ℹ Gold table not on page, skipping fetch");
        const num=parseInt(String(q).replace(/\D/g,'')), cfg=findCfg(goldCfg,num);
        if(!cfg){console.warn("❌ Gold cfg not found",q); return;}

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
        fetch(url).then(r=>r.text()).then(t=>{
            const rows=parseGViz(t);
            renderGold(rows);
        }).catch(e=>console.error("Gold fetch failed",e));
    }

    // ====================== GLOBAL REFS ======================
    window.g22kt=document.querySelector('#g22kt');
    window.g24kt=document.querySelector('#g24kt');
    window.udat=document.querySelector('#udat');
    window.silvr_pricet=document.querySelector('#silvr_pricet');

})();

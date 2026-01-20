(function () {
    console.log("🚀 Universal Loader v8.1 SAFE – Gold & Silver");

    /* ====================== LOAD Chart.js ====================== */
    function loadChartJS(cb){
        if(window.Chart) return cb();
        const s=document.createElement('script');
        s.src="https://cdn.jsdelivr.net/npm/chart.js";
        s.onload=cb;
        document.head.appendChild(s);
    }

    /* ====================== HELPERS ====================== */
    function parseGViz(txt) {
        try {
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, '')
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                     .replace(/\);?\s*$/, '');
            return JSON.parse(txt).table.rows || [];
        } catch {
            return [];
        }
    }

    function findCfg(map, n) {
        for (const k in map) {
            const r = map[k].range;
            if (Array.isArray(r) && r.includes(n)) {
                return { id: map[k].id, off: r.indexOf(n) };
            }
        }
        return null;
    }

    /* ====================== QUEUE (SAFE) ====================== */
    window._mbkQueue = window._mbkQueue || [];
    function processMBKQueue() {
        window._mbkQueue = window._mbkQueue.filter(it => {
            if (typeof window[it.fn] === 'function') {
                window[it.fn](...it.args);
                return false;
            }
            return true;
        });
    }

    /* ========================= SILVER ========================= */
    let silverConfig=null;
    const silverQueue = [];

    window.Silverdata = function(q){
        const num = parseInt(String(q).replace(/\D/g,''),10);
        if (!num) return;

        // ✅ DUPLICATE PREVENT
        if (!silverQueue.includes(num)) silverQueue.push(num);

        if (silverConfig) runSilver();
        processMBKQueue();
    };

    function runSilver(){
        if (!silverQueue.length) return;

        const num = silverQueue.shift(); // ✅ FIFO (sort issue fix)
        const cfg = findCfg(silverConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.off}`;

        fetch(url)
            .then(r=>r.text())
            .then(t=>{
                const rows=parseGViz(t);
                if (!rows.length) return;
                renderSilver(rows);
            })
            .catch(()=>setTimeout(()=>silverQueue.unshift(num),1500));
    }

    function renderSilver(rows){
        const priceKg = rows[0]?.c[2]?.v || 0;

        if (window.silvr_pricet)
            silvr_pricet.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;

        if (window.udat)
            udat.textContent = new Date().toLocaleDateString('hi-IN');

        const graf=document.getElementById('silvr_graf');
        if (graf){
            loadChartJS(()=>{
                graf.innerHTML='<canvas id="silverChart"></canvas>';
                new Chart(silverChart,{
                    type:'line',
                    data:{
                        labels:rows.map(r=>r.c[0]?.f||''),
                        datasets:[{label:'Silver 1kg',data:rows.map(r=>r.c[2]?.v||0)}]
                    }
                });
            });
        }
    }

    /* ========================= GOLD ========================= */
    let goldConfig=null;
    const goldQueue=[];

    window.golddata=function(q){
        const num=parseInt(String(q).replace(/\D/g,''),10);
        if (!num) return;
        if (!goldQueue.includes(num)) goldQueue.push(num);
        if (goldConfig) runGold();
        processMBKQueue();
    };

    function runGold(){
        if (!goldQueue.length) return;
        const num=goldQueue.shift();
        const cfg=findCfg(goldConfig,num);
        if (!cfg) return;

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select *`;
        fetch(url)
            .then(r=>r.text())
            .then(t=>renderGold(parseGViz(t)));
    }

    function renderGold(rows){
        if (!rows.length) return;
        if (window.g22kt) g22kt.textContent=`₹${rows[0].c[1]?.v||0}`;
        if (window.g24kt) g24kt.textContent=`₹${rows[0].c[3]?.v||0}`;
    }

    /* ====================== CONFIG LOAD ====================== */
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r=>r.json())
        .then(j=>{silverConfig=j; runSilver();});

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r=>r.json())
        .then(j=>{goldConfig=j; runGold();});

    /* ====================== GLOBAL REFS ====================== */
    window.silvr_pricet=document.querySelector('#silvr_pricet');
    window.g22kt=document.querySelector('#g22kt');
    window.g24kt=document.querySelector('#g24kt');
    window.udat=document.querySelector('#udat');

})();
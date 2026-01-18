window.golddata=function(gctqury,mtype){
    const num=parseInt(gctqury.replace('gct',''));
    
    // PERFECT RANGE MATCHING (आपका code)
    for(let key in window.gsConfig){
        let group=window.gsConfig[key];
        if(num>=group.range[0] && num<=group.range[1]){
            const url=`https://docs.google.com/spreadsheets/d/${group.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
            
            document.getElementById("sctitle")?.setAttribute('data-state',group.state);
            
            fetch(url).then(r=>r.text()).then(data=>{
                try{
                    const json=JSON.parse(data.substr(47).slice(0,-2));
                    const rows=json.table.rows;
                    
                    // 22K/24K prices (आपका basic code)
                    document.getElementById("g22kt").innerHTML=`₹${rows[0].c[1].v.toFixed(2)}`;
                    document.getElementById("g24kt").innerHTML=`₹${rows[0].c[2].v.toFixed(2)}`;
                    document.getElementById("udat").textContent=new Date().toLocaleDateString("hi-IN");
                    
                    // COMPLETE FEATURES add करें
                    GoldTable22(rows);  // 22K table
                    GoldTable24(rows);  // 24K table  
                    GoldChart(rows);    // Graph
                    GramTable(rows);    // Gram wise
                    
                }catch(e){
                    console.log("Gold data error:", e);
                }
            });
            return;
        }
    }
};

// Additional functions (आपके existing code में add करें)
function GoldTable22(rows){
    let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#f5f5f5;"><th>तारीख</th><th>22K (1g)</th></tr>';
    rows.slice(0,10).forEach(row=>{
        html+=`<tr><td>${row.c[0]?.f||'-'}</td><td>₹${row.c[1]?.f||'-'}</td></tr>`;
    });
    document.getElementById("gramtbl22").innerHTML=html+'</table>';
}

function GoldTable24(rows){
    let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#f5f5f5;"><th>तारीख</th><th>24K (1g)</th></tr>';
    rows.slice(0,10).forEach(row=>{
        html+=`<tr><td>${row.c[0]?.f||'-'}</td><td>₹${row.c[2]?.f||'-'}</td></tr>`;
    });
    document.getElementById("gramtbl24").innerHTML=html+'</table>';
}

function GoldChart(rows){
    if(typeof Plotly!=='undefined'){
        const dates=rows.map(r=>r.c[0]?.f).slice(0,15);
        const prices22=rows.map(r=>parseFloat(r.c[1]?.f||0)).slice(0,15);
        const prices24=rows.map(r=>parseFloat(r.c[2]?.f||0)).slice(0,15);
        Plotly.newPlot("gldgraf",[
            {x:dates,y:prices22,name:"22K",line:{color:"gold"}},
            {x:dates,y:prices24,name:"24K",line:{color:"orange"}}
        ],{title:"22K vs 24K Gold Trend"});
    }
}

function GramTable(rows){
    const today22=rows[0].c[1].v, today24=rows[0].c[2].v;
    // Gram table logic यहाँ
}

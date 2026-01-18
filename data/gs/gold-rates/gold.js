window.golddata=function(gctqury,mtype){
    const num=parseInt(gctqury.replace('gct',''));
    
    // PERFECT RANGE MATCHING
    for(let key in window.gsConfig){
        let group=window.gsConfig[key];
        if(num>=group.range[0] && num<=group.range[1]){
            const url=`https://docs.google.com/spreadsheets/d/${group.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
            
            document.getElementById("sctitle")?.setAttribute('data-state',group.state);
            
            fetch(url).then(r=>r.text()).then(data=>{
                try{
                    const json=JSON.parse(data.substr(47).slice(0,-2));
                    const rows=json.table.rows;
                    document.getElementById("g22kt").innerHTML=`₹${rows[0].c[1].v.toFixed(2)}`;
                    document.getElementById("g24kt").innerHTML=`₹${rows[0].c[2].v.toFixed(2)}`;
                    document.getElementById("udat").textContent=new Date().toLocaleDateString("hi-IN");
                }catch(e){}
            });
            return;
        }
    }
};

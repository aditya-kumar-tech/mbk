window.Silverdata=function(sctqury,mtype){
    const num=parseInt(sctqury.replace('sct',''));
    
    for(let key in window.gsConfig){
        let group=window.gsConfig[key];
        if(num>=group.range[0] && num<=group.range[1]){
            const url=`https://docs.google.com/spreadsheets/d/${group.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
            
            fetch(url).then(r=>r.text()).then(data=>{
                try{
                    const json=JSON.parse(data.substr(47).slice(0,-2));
                    const rows=json.table.rows;
                    const today10g=rows[0].c[1].v;
                    
                    document.getElementById("silvr_pricet").innerHTML=`₹${(today10g*100).toFixed(0)}`;
                    document.getElementById("sctitle").innerHTML=`${group.state} Silver | ${group.state} चाँदी का भाव`;
                    document.getElementById("udat").textContent=new Date().toLocaleDateString("hi-IN");
                    
                    SilverTable(rows);
                    SilverChart(rows);
                    SilverGramTable(rows);
                    
                }catch(e){}
            });
            return;
        }
    }
};

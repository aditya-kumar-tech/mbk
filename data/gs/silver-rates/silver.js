// ✅ STATE GROUPING - 30 sheets only, sct1-sct600+ support
const silverGroups = {
    maharashtra_01: { id: "1LPrFvxzzownghYcIo_1QRHqRcnVnLtDpZ09EImN7ijU", state: "महाराष्ट्र", range: [1, 20] },
    delhi_ncr_02: { id: "1WSMeNQuA96s8AQuw8AkLwH8ta98IWL7kcLJ2EaclyqE", state: "दिल्ली-NCR", range: [21, 40] },
    west_bengal_03: { id: "1DtZLJjHEx_KMjJqlhd6tvRLlpahO232BRFNduW4wnFU", state: "पश्चिम बंगाल", range: [41, 60] },
    tamil_nadu_04: { id: "1MnFZowECC9Afh4H-9NL06BIf0sEpD5ZI4WcwuP2CKig", state: "तमिलनाडु", range: [61, 80] },
    telangana_05: { id: "1qtaEYAFxpU0OVbiiRcfEDDMa2fUYn3uj6nfRM5m1Ueg", state: "तेलंगाना", range: [81, 100] },
    karnataka_06: { id: "1i7keQ8qtR-gmCqIKGr1W3qUMPkiXQOJMn09CjUZ8LNw", state: "कर्नाटक", range: [101, 120] },
    gujarat_07: { id: "1qNLZNDopBZgffKPVSOVPrgh9NAHknToG201lLxJGNCA", state: "गुजरात", range: [121, 140] },
    rajasthan_08: { id: "1Ir2EcXi_YCjZUO8cpOgQb2K5Dh3vVaLhBSXDEdzD_Rs", state: "राजस्थान", range: [141, 160] },
    uttar_pradesh_09: { id: "1TUmurCYn7_WPHAptprXic2vi5ahS3a659hgMVJYlX68", state: "उत्तर प्रदेश", range: [161, 180] },
    madhya_pradesh_10: { id: "1w2omBC1tEILJ-A1xfpj3yQBn_RunH3KTYNGW_AXBgS4", state: "मध्य प्रदेश", range: [181, 200] }
    // ADD बाकी 20 states यहाँ - कुल 30 groups
};

function getGroupBySct(sctName) {
    const num = parseInt(sctName.replace('sct', ''));
    return Object.values(silverGroups).find(g => num >= g.range[0] && num <= g.range[1]) || silverGroups.maharashtra_01;
}

function Silverdata(sctqury, mtype="Silver") {
    const groupData = getGroupBySct(sctqury);
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${groupData.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
    
    document.getElementById("sctitle").textContent = `${groupData.state} Silver Price Today | आज का चाँदी का भाव ${groupData.state}`;
    
    fetch(sheetUrl).then(r=>r.text()).then(data=>{
        try {
            const json = JSON.parse(data.substr(47).slice(0,-2));
            const rows = json.table.rows;
            const today10g = rows[0].c[1].v;
            const yest10g = rows[1]?.c[1]?.v || 0;
            
            const today = new Date();
            document.getElementById("udat").textContent = `${today.getDate().padStart(2,'0')}-${(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;
            document.getElementById("silvr_pricet").innerHTML = `₹${(today10g*100).toFixed(0)}`;
            
            const change = today10g - yest10g;
            const gt = document.getElementById("slvr_gt");
            gt.textContent = change > 0 ? `+₹${Math.round(change*100)} ↑` : change < 0 ? `₹${Math.round(change*100)} ↓` : `कोई बदलाव नहीं`;
            gt.style.color = change > 0 ? "#008900" : change < 0 ? "#da0000" : "#666";
            
            document.getElementById("silvr_gramtbl").innerHTML = `
                <table style="width:100%;border-collapse:collapse;">
                    <tr style="background:#f5f5f5;"><th style="padding:10px;border:1px solid #ddd;">वजन</th><th style="padding:10px;border:1px solid #ddd;">आज (${groupData.state})</th><th style="padding:10px;border:1px solid #ddd;">कल</th></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;">1g</td><td style="padding:8px;border:1px solid #ddd;">₹${(today10g/10).toFixed(2)}</td><td style="padding:8px;border:1px solid #ddd;">₹${(yest10g/10).toFixed(2)}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;">10g</td><td style="padding:8px;border:1px solid #ddd;">₹${today10g.toFixed(2)}</td><td style="padding:8px;border:1px solid #ddd;">₹${yest10g.toFixed(2)}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;">100g</td><td style="padding:8px;border:1px solid #ddd;">₹${(today10g*10).toFixed(2)}</td><td style="padding:8px;border:1px solid #ddd;">₹${(yest10g*10).toFixed(2)}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;">1kg</td><td style="padding:8px;border:1px solid #ddd;">₹${(today10g*100).toFixed(2)}</td><td style="padding:8px;border:1px solid #ddd;">₹${(yest10g*100).toFixed(2)}</td></tr>
                </table>`;
            
            Silver_table(rows);
            Silver_chart(rows);
        } catch(e) {
            document.getElementById("silvr_gramtbl").innerHTML = "<p style='color:red'>डेटा लोड नहीं हो सका</p>";
        }
    });
}

function Silver_table(rows){
    let html = '<table class="displaydata" style="width:100%;border-collapse:collapse;"><tr style="background:#f5f5f5;"><th style="padding:10px;border:1px solid #ddd;">तारीख</th><th style="padding:10px;border:1px solid #ddd;">10g</th><th style="padding:10px;border:1px solid #ddd;">1kg</th><th style="padding:10px;border:1px solid #ddd;">बदलाव</th></tr>';
    rows.slice(0,10).forEach((row,i)=>{
        const cells = [row.c[0]?.f || '-', row.c[1]?.f || '-', row.c[2]?.f || '-', row.c[3]?.f || '-'];
        const changeColor = cells[3] !== '-' && row.c[3]?.v > 0 ? '#008900' : cells[3] !== '-' && row.c[3]?.v < 0 ? '#da0000' : '#666';
        html += `<tr><td style="padding:8px;border:1px solid #ddd;">${cells[0]}</td><td style="padding:8px;border:1px solid #ddd;">${cells[1]}</td><td style="padding:8px;border:1px solid #ddd;">${cells[2]}</td><td style="padding:8px;border:1px solid #ddd;color:${changeColor};">${cells[3]}</td></tr>`;
    });
    document.getElementById("data_table1").innerHTML = html + '</table>';
}

function Silver_chart(rows){
    const dates = rows.map(r=>r.c[5]?.f).filter(Boolean).slice(0,15);
    const prices = rows.map(r=>parseFloat(r.c[2]?.f || 0)).filter(p=>p>0).slice(0,15);
    Plotly.newPlot("silvr_graf", [{x: dates, y: prices, type: 'scatter', mode: 'lines+markers', line: {color: '#C0C0C0', width: 3}}], {title: 'चाँदी प्राइस ट्रेंड (1kg)', xaxis: {title: 'तारीख'}, yaxis: {title: '₹'}});
}

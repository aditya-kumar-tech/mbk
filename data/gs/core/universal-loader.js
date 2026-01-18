// ULTRA MINIMAL - सिर्फ page detect + JSON load
(function(){
    window.isGoldPage=!!document.querySelector('#g22kt');
    window.isSilverPage=!!document.querySelector('#silvr_pricet');
    
    // Group-wise JSONs load
    if(window.isGoldPage){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r=>r.json()).then(d=>window.gsConfig=d);
    }
    if(window.isSilverPage){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r=>r.json()).then(d=>window.gsConfig=d);
    }
})();

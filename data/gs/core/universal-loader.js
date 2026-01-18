(function(){
    if(document.querySelector('#g22kt')){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r=>r.json()).then(d=>window.gsConfig=d);
    }
    if(document.querySelector('#silvr_pricet')){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r=>r.json()).then(d=>window.gsConfig=d);
    }
})();

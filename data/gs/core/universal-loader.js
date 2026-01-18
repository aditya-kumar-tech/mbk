// mbk/data/gs/core/universal-loader.js
(function(){
    // Plotly पहले load करें
    if(typeof Plotly==='undefined'){
        const plotly=document.createElement('script');
        plotly.src='https://cdn.plot.ly/plotly-latest.min.js';
        document.head.appendChild(plotly);
    }
    
    // आपके existing code
    if(document.querySelector('#g22kt')){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r=>r.json()).then(d=>window.gsConfig=d);
    }
    if(document.querySelector('#silvr_pricet')){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r=>r.json()).then(d=>window.gsConfig=d);
    }
})();

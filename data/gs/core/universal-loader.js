// mbk/data/gs/core/universal-loader.js
(function(){
    // 1. CSS files पहले load करें (Manifest के बिना)
    const cssFiles = [
        'mbk/data/gs/core/gold-rates/gold-style.css',
        'mbk/data/gs/core/silver-rates/silver-style.css'
    ];
    
    cssFiles.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://aditya-kumar-tech.github.io/${file}`;
        document.head.appendChild(link);
    });
    
    // 2. Plotly load करें (अगर नहीं है)
    if(typeof Plotly === 'undefined'){
        const plotly = document.createElement('script');
        plotly.src = 'https://cdn.plot.ly/plotly-latest.min.js';
        plotly.onload = initModules;  // Modules init करने के बाद
        document.head.appendChild(plotly);
    } else {
        initModules();
    }
    
    // 3. Core modules initialize करें
    function initModules(){
        // Gold config load करें
        if(document.querySelector('#g22kt')){
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
                .then(r => r.json())
                .then(data => {
                    window.gsConfig = data;
                    loadGoldModule();
                })
                .catch(err => console.error('Gold config load failed:', err));
        }
        
        // Silver config load करें  
        if(document.querySelector('#silvr_pricet')){
            fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
                .then(r => r.json())
                .then(data => {
                    window.gsConfig = data;
                    loadSilverModule();
                })
                .catch(err => console.error('Silver config load failed:', err));
        }
    }
    
    // 4. Gold module files load करें
    function loadGoldModule(){
        const goldFiles = [
            'mbk/data/gs/core/gold-rates/gold.js',
            'mbk/data/gs/core/gold-rates/gold-data.js'
        ];
        
        goldFiles.forEach((file, index) => {
            const script = document.createElement('script');
            script.src = `https://aditya-kumar-tech.github.io/${file}`;
            script.onload = index === goldFiles.length - 1 ? initGoldData : null;
            document.head.appendChild(script);
        });
    }
    
    // 5. Silver module files load करें
    function loadSilverModule(){
        const silverFiles = [
            'mbk/data/gs/core/silver-rates/silver.js',
            'mbk/data/gs/core/silver-rates/silver-data.js'
        ];
        
        silverFiles.forEach((file, index) => {
            const script = document.createElement('script');
            script.src = `https://aditya-kumar-tech.github.io/${file}`;
            script.onload = index === silverFiles.length - 1 ? initSilverData : null;
            document.head.appendChild(script);
        });
    }
    
    // 6. Data initialization functions
    window.initGoldData = function(){
        if(typeof golddata === 'function' && window.gsConfig){
            golddata();
        }
    };
    
    window.initSilverData = function(){
        if(typeof Silverdata === 'function' && window.gsConfig){
            Silverdata();
        }
    };
})();

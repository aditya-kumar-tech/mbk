// mbk/data/gs/core/gold-rates/gold-data.js
// Supporting data structures और utilities for gold.js

// 1. Auto-trigger initialization (DOM ready होने पर)
document.addEventListener('DOMContentLoaded', function() {
    // Gold elements detect करें और auto-init करें
    const goldElements = document.querySelectorAll('[id^="gct"]');
    goldElements.forEach(el => {
        const triggerId = el.id;
        if (typeof window.golddata === 'function') {
            setTimeout(() => window.golddata(triggerId), 500);
        }
    });
});

// 2. Manual trigger के लिए (universal-loader.js से call होगा)
window.initGoldData = function() {
    const goldTrigger = document.querySelector('#gcttitle, [id^="gct"]');
    if (goldTrigger && typeof window.golddata === 'function') {
        window.golddata(goldTrigger.id);
    }
};

// 3. Data refresh function (5 min interval)
window.refreshGoldData = function() {
    const goldTrigger = document.querySelector('#gcttitle, [id^="gct"]');
    if (goldTrigger && typeof window.golddata === 'function') {
        window.golddata(goldTrigger.id);
    }
};

// 4. Auto-refresh setup (5 minutes)
setInterval(() => {
    if (document.querySelector('#g22kt')) {
        window.refreshGoldData();
    }
}, 300000); // 5 minutes

// 5. Loading states management
window.showGoldLoading = function() {
    const elements = ['g22kt', 'g24kt', 'gramtbl22', 'gramtbl24', 'data_table1', 'gldgraf'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span style="color:#666;">लोड हो रहा है...</span>';
    });
};

window.hideGoldLoading = function() {
    // Loading complete - do nothing
};

// 6. Error handling utility
window.goldErrorHandler = function(error) {
    console.error('Gold Data Error:', error);
    const elements = ['g22kt', 'g24kt', 'gramtbl22', 'gramtbl24', 'data_table1'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span style="color:#e74c3c;">डेटा लोड नहीं हो सका</span>';
    });
};

// 7. Cache management (localStorage)
window.goldCache = {
    set: function(key, data, ttl = 300000) { // 5 min default
        const now = new Date().getTime();
        localStorage.setItem(key, JSON.stringify({
            data: data,
            timestamp: now,
            ttl: ttl
        }));
    },
    
    get: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        const now = new Date().getTime();
        
        if (now - item.timestamp > item.ttl) {
            localStorage.removeItem(key);
            return null;
        }
        return item.data;
    },
    
    clear: function(key) {
        localStorage.removeItem(key);
    }
};

// 8. Export utilities (अगर जरूरत हो)
window.GoldUtils = {
    formatPrice: (price) => `₹${parseFloat(price || 0).toFixed(2)}`,
    formatDate: (date) => new Date(date).toLocaleDateString("hi-IN"),
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

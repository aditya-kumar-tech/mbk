// mbk/data/gs/core/silver-rates/silver-data.js
// Silver utilities + auto-trigger (gold-data.js के जैसा exactly)

document.addEventListener('DOMContentLoaded', function() {
    // Silver elements detect करें और auto-init करें
    const silverElements = document.querySelectorAll('[id^="sct"]');
    silverElements.forEach(el => {
        const triggerId = el.id;
        if (typeof window.Silverdata === 'function') {
            setTimeout(() => window.Silverdata(triggerId), 500);
        }
    });
});

// Manual trigger (universal-loader.js के लिए)
window.initSilverData = function() {
    const silverTrigger = document.querySelector('#scttitle, [id^="sct"]');
    if (silverTrigger && typeof window.Silverdata === 'function') {
        window.Silverdata(silverTrigger.id);
    }
};

// Auto-refresh (5 min)
window.refreshSilverData = function() {
    const silverTrigger = document.querySelector('#scttitle, [id^="sct"]');
    if (silverTrigger && typeof window.Silverdata === 'function') {
        window.Silverdata(silverTrigger.id);
    }
};

setInterval(() => {
    if (document.querySelector('#silvr_pricet')) {
        window.refreshSilverData();
    }
}, 300000); // 5 minutes

// Loading states
window.showSilverLoading = function() {
    const elements = ['silvr_pricet', 'silvr_gramtbl', 'data_table1', 'silvr_graf'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span style="color:#666;">लोड हो रहा है...</span>';
    });
};

window.hideSilverLoading = function() {
    // Loading complete
};

// Error handling
window.silverErrorHandler = function(error) {
    console.error('Silver Data Error:', error);
    const elements = ['silvr_pricet', 'silvr_gramtbl', 'data_table1'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span style="color:#e74c3c;">डेटा लोड नहीं हो सका</span>';
    });
};

// Cache management
window.silverCache = {
    set: function(key, data, ttl = 300000) {
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

// Silver Utilities
window.SilverUtils = {
    formatPrice: (price10g) => `₹${((price10g * 100) || 0).toFixed(0)}`,
    formatGramPrice: (grams, price10g) => `₹${(((grams / 10) * price10g * 100) || 0).toFixed(0)}`,
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

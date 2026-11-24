const CONFIG = {
    // USE RELATIVE PATHS IN PRODUCTION TO AVOID CORS AND DNS ISSUES
    API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5001'
        : ''
};

window.CONFIG = CONFIG;
console.log("Velvorax API Config Loaded: " + (CONFIG.API_BASE_URL || "Relative Mode"));

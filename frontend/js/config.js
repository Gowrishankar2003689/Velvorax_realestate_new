const CONFIG = {
    // Dynamically set API URL based on environment
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : window.location.origin
};

window.CONFIG = CONFIG;
console.log("Velvorax API Config Loaded (config.js fallback): Relative Mode");

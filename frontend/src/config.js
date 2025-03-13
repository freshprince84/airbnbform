// Konfiguration für verschiedene Umgebungen
const config = {
  // API-Basis-URL (ohne trailing slash)
  apiBaseUrl: process.env.REACT_APP_API_URL || window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `${window.location.protocol}//${window.location.hostname}`
};

export default config; 
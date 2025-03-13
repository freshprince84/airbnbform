// Konfiguration für verschiedene Umgebungen
const config = {
  // API-Basis-URL
  apiBaseUrl: process.env.REACT_APP_API_URL || window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `${window.location.protocol}//${window.location.hostname}/api`
};

export default config; 
// Konfigurationsdatei für die Frontend-Anwendung
// Hier werden globale Einstellungen definiert

const config = {
  // API-Basis-URL - leer lassen, um relative Pfade zu verwenden
  apiBaseUrl: '',
  
  // Debug-Funktion, um die Konfiguration zu überprüfen
  _debug() {
    console.log('Aktuelle API-Konfiguration:');
    console.log('- Host:', window.location.hostname);
    console.log('- Verwendet relativen Pfad für API-Anfragen');
  }
};

export default config; 
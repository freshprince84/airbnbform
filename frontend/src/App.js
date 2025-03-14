import React, { useState, useEffect } from 'react';
import GuestForm from './components/GuestForm';
import ContractPreview from './components/ContractPreview';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import config from './config';
import './styles.css';

function App() {
  const [contractData, setContractData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Überprüft den Server-Status beim Laden der App
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const apiUrl = `/api/status`;
      console.log('Prüfe Server-Status unter URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('Server-Antwort erhalten:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Server-Status:', data);
        setServerStatus('online');
      } else {
        console.error('Server nicht erreichbar - Status Code:', response.status);
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('Server-Statusprüfung fehlgeschlagen:', error);
      console.error('Details:', error.message);
      setServerStatus('offline');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (serverStatus === 'offline') {
        alert('Der Server ist nicht erreichbar. Bitte stellen Sie sicher, dass der Backend-Server läuft.');
        return;
      }

      console.log('Sende Formulardaten:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        hasPassportFile: !!formData.passportFile,
      });

      // Formular wurde bereits in GuestForm.js mit FormData abgesendet
      // Hier müssen wir die Daten nur für die nächste Ansicht speichern
      setContractData(formData.contractData);
    } catch (error) {
      console.error('Fehler beim Senden der Formulardaten:', error);
      alert(`Es ist ein Fehler aufgetreten: ${error.message || 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`);
    }
  };

  const handleSign = () => {
    alert('Digitale Signatur wird implementiert (z.B. DocuSign).'); // TODO: Drittanbieter-API für Signatur integrieren
  };

  const handleAdminLogin = (password) => {
    // Hardcodiertes Passwort überprüfen
    if (password === 'Admin-Bereich123!') {
      setIsAdminAuthenticated(true);
      return true;
    } else {
      return false;
    }
  };

  const toggleView = () => {
    setIsAdmin(!isAdmin);
    // Wenn von Admin-Bereich zurück zur Gästeansicht gewechselt wird, Authentifizierung zurücksetzen
    if (isAdmin) {
      setIsAdminAuthenticated(false);
    }
  };

  const resetForm = () => {
    setContractData(null);
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>Gastdaten für Kolumbien</h1>
        <div className="nav-links">
          <span 
            className={`nav-link ${!isAdmin ? 'active' : ''}`} 
            onClick={() => {
              setIsAdmin(false);
            }}
          >
            Gästeformular
          </span>
          <span 
            className={`nav-link ${isAdmin ? 'active' : ''}`} 
            onClick={() => {
              setIsAdmin(true);
            }}
          >
            Admin-Bereich
          </span>
        </div>
      </div>

      {serverStatus === 'offline' && (
        <div className="server-status error-message">
          Der Backend-Server ist nicht erreichbar. Bitte stellen Sie sicher, dass er läuft.
          <button onClick={checkServerStatus} className="retry-btn">Erneut versuchen</button>
        </div>
      )}

      {isAdmin ? (
        isAdminAuthenticated ? (
          <AdminPanel />
        ) : (
          <AdminLogin onLogin={handleAdminLogin} />
        )
      ) : (
        <>
          {!contractData ? (
            <GuestForm onSubmit={handleFormSubmit} serverStatus={{ isConnected: serverStatus === 'online' }} />
          ) : (
            <>
              <ContractPreview contractData={contractData} onSign={handleSign} />
              <button 
                onClick={resetForm} 
                style={{ marginTop: '20px' }}
              >
                Neues Formular
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;

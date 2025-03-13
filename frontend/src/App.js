import React, { useState, useEffect } from 'react';
import GuestForm from './components/GuestForm';
import ContractPreview from './components/ContractPreview';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import './styles.css';

function App() {
  const [contractUrl, setContractUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Überprüft den Server-Status beim Laden der App
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('Server-Statusprüfung fehlgeschlagen:', error);
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
        name: formData.name,
        passportNumber: formData.passportNumber,
        arrivalDate: formData.arrivalDate,
        hasPassportFile: !!formData.passportFile,
      });

      const response = await fetch('http://localhost:3001/generate-contract', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
        throw new Error(errorData.error || 'Fehler bei der Vertragsgenerierung');
      }
      
      const data = await response.json();
      setContractUrl(data.url);
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
    setContractUrl(null);
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
          {!contractUrl ? (
            <GuestForm onSubmit={handleFormSubmit} />
          ) : (
            <>
              <ContractPreview contractUrl={contractUrl} onSign={handleSign} />
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

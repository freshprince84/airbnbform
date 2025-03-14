import React, { useState, useEffect } from 'react';
import config from '../config';

const AdminPanel = () => {
  const [files, setFiles] = useState({ 
    contracts: [], 
    standalone_passports: []
  });
  const [driveConfig, setDriveConfig] = useState({
    folderPath: '',
    apiKey: ''
  });
  const [hostSettings, setHostSettings] = useState({
    hostFirstName: '',
    hostLastName: '',
    propertyAddress: '',
    rentalAmount: ''
  });
  const [contractTemplate, setContractTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateEditorContent, setTemplateEditorContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configSaved, setConfigSaved] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [hostSettingsSaved, setHostSettingsSaved] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);

  useEffect(() => {
    // Laden der gespeicherten Dateien beim Mounten der Komponente
    fetchFiles();
    fetchContractTemplate();

    // Laden der gespeicherten Konfiguration (falls vorhanden)
    const savedConfig = localStorage.getItem('driveConfig');
    if (savedConfig) {
      setDriveConfig(JSON.parse(savedConfig));
    }
    
    // Laden der gespeicherten Gastgebereinstellungen
    const savedHostSettings = localStorage.getItem('hostSettings');
    if (savedHostSettings) {
      setHostSettings(JSON.parse(savedHostSettings));
    }
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/files`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Dateien');
      }
      
      const data = await response.json();
      setFiles(data);
      setError(null);
    } catch (error) {
      console.error('Fehler:', error);
      setError('Dateien konnten nicht geladen werden. Bitte stellen Sie sicher, dass der Server läuft.');
    } finally {
      setLoading(false);
    }
  };

  const fetchContractTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/contract-template`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Vertragsvorlage');
      }
      
      const template = await response.json();
      setContractTemplate(template);
      setTemplateEditorContent(JSON.stringify(template, null, 2));
    } catch (error) {
      console.error('Fehler beim Abrufen der Vertragsvorlage:', error);
      setError('Vertragsvorlage konnte nicht geladen werden. Bitte stellen Sie sicher, dass der Server läuft.');
    }
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setDriveConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHostSettingsChange = (e) => {
    const { name, value } = e.target;
    setHostSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveHostSettings = () => {
    // Speichern der Gastgebereinstellungen im localStorage
    localStorage.setItem('hostSettings', JSON.stringify(hostSettings));
    setHostSettingsSaved(true);
    
    // Nach 3 Sekunden die Erfolgsmeldung zurücksetzen
    setTimeout(() => {
      setHostSettingsSaved(false);
    }, 3000);
  };

  const saveConfig = () => {
    // Speichern der Konfiguration im localStorage (in einer echten Anwendung sollte dies serverseitig erfolgen)
    localStorage.setItem('driveConfig', JSON.stringify(driveConfig));
    setConfigSaved(true);
    
    // Nach 3 Sekunden die Erfolgsmeldung zurücksetzen
    setTimeout(() => {
      setConfigSaved(false);
    }, 3000);
  };

  const formatDate = (filename) => {
    // Extraktion eines Datums aus einem Dateinamen mit Zeitstempel
    const match = filename.match(/(\d{13})/); // Suche nach 13-stelligem Zeitstempel
    if (match) {
      const timestamp = parseInt(match[0]);
      return new Date(timestamp).toLocaleString('de-DE');
    }
    return 'Unbekanntes Datum';
  };

  const saveContractTemplate = async () => {
    try {
      let templateObject;
      
      try {
        templateObject = JSON.parse(templateEditorContent);
      } catch (error) {
        alert('Ungültiges JSON-Format. Bitte überprüfen Sie die Eingabe.');
        return;
      }
      
      const response = await fetch(`/api/admin/contract-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateObject),
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Vertragsvorlage');
      }
      
      setContractTemplate(templateObject);
      setTemplateSaved(true);
      
      // Nach 3 Sekunden die Erfolgsmeldung zurücksetzen
      setTimeout(() => {
        setTemplateSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Fehler beim Speichern der Vertragsvorlage:', error);
      alert('Fehler beim Speichern der Vertragsvorlage: ' + error.message);
    }
  };

  const toggleTemplateEditor = () => {
    setShowTemplateEditor(!showTemplateEditor);
  };

  const handleDownload = (url, fileName) => {
    // Erstellt einen Link zum Herunterladen und klickt ihn automatisch
    const link = document.createElement('a');
    link.href = url; // Die URL ist bereits vollständig vom Backend geliefert
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTemplateFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTemplateFile(e.target.files[0]);
    }
  };

  const uploadTemplateFile = async () => {
    if (!templateFile) {
      alert('Bitte wählen Sie eine Datei aus');
      return;
    }

    try {
      // Datei als FormData vorbereiten
      const formData = new FormData();
      formData.append('template', templateFile);
      
      const response = await fetch('/api/admin/upload-contract-template', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Vertragsvorlage erfolgreich hochgeladen!');
        setTemplateFile(null);
        // Input-Feld zurücksetzen
        const fileInput = document.getElementById('templateFileInput');
        if (fileInput) fileInput.value = '';
      } else {
        alert('Fehler beim Hochladen: ' + result.error);
      }
    } catch (error) {
      console.error('Fehler beim Hochladen der Vorlage:', error);
      alert('Fehler beim Hochladen der Vorlage: ' + error.message);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin-Bereich</h2>
      
      <div className="config-section">
        <h3>Google Drive Konfiguration</h3>
        <div className="form-group">
          <label htmlFor="folderPath">Google Drive Ordnerpfad:</label>
          <input 
            type="text" 
            id="folderPath" 
            name="folderPath" 
            value={driveConfig.folderPath} 
            onChange={handleConfigChange}
            placeholder="z.B. /Meine Dokumente/Airbnb Verträge"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="apiKey">Google API Schlüssel:</label>
          <input 
            type="password" 
            id="apiKey" 
            name="apiKey" 
            value={driveConfig.apiKey} 
            onChange={handleConfigChange}
            placeholder="Ihr Google API Schlüssel"
          />
        </div>
        
        <button onClick={saveConfig} className="save-btn">Konfiguration speichern</button>
        {configSaved && <p className="success-message">Konfiguration gespeichert!</p>}
        <p className="config-note">
          Hinweis: Diese Konfiguration wird nur lokal im Browser gespeichert. 
          In einer Produktivumgebung sollten diese Daten sicher im Backend verwaltet werden.
        </p>
      </div>
      
      <div className="host-settings-section">
        <h3>Gastgeber-Informationen</h3>
        <div className="form-group">
          <label htmlFor="hostFirstName">Vorname des Gastgebers:</label>
          <input 
            type="text" 
            id="hostFirstName" 
            name="hostFirstName" 
            value={hostSettings.hostFirstName} 
            onChange={handleHostSettingsChange}
            placeholder="Vorname des Gastgebers"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="hostLastName">Nachname des Gastgebers:</label>
          <input 
            type="text" 
            id="hostLastName" 
            name="hostLastName" 
            value={hostSettings.hostLastName} 
            onChange={handleHostSettingsChange}
            placeholder="Nachname des Gastgebers"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="propertyAddress">Adresse der Unterkunft:</label>
          <input 
            type="text" 
            id="propertyAddress" 
            name="propertyAddress" 
            value={hostSettings.propertyAddress} 
            onChange={handleHostSettingsChange}
            placeholder="Vollständige Adresse der Unterkunft"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="rentalAmount">Mietbetrag:</label>
          <input 
            type="text" 
            id="rentalAmount" 
            name="rentalAmount" 
            value={hostSettings.rentalAmount} 
            onChange={handleHostSettingsChange}
            placeholder="z.B. 500€ pro Nacht"
          />
        </div>
        
        <button onClick={saveHostSettings} className="save-btn">Gastgebereinstellungen speichern</button>
        {hostSettingsSaved && <p className="success-message">Gastgebereinstellungen gespeichert!</p>}
      </div>
      
      <div className="template-section">
        <h3>Vertragsvorlage</h3>
        
        <div className="template-upload">
          <h4>Vertragsvorlage als Word-Dokument hochladen</h4>
          <p className="template-info">
            Laden Sie ein Word-Dokument als Vertragsvorlage hoch. Folgende Platzhalter werden automatisch ersetzt:
            {'{guestFirstName}'}, {'{guestLastName}'}, {'{checkInDate}'}, {'{checkOutDate}'}, {'{hostFirstName}'}, {'{hostLastName}'}, {'{propertyAddress}'}, {'{rentalAmount}'}
          </p>
          <div className="form-group">
            <input 
              type="file" 
              id="templateFileInput" 
              accept=".docx" 
              onChange={handleTemplateFileChange}
            />
            {templateFile && (
              <div className="file-info">
                Ausgewählte Datei: {templateFile.name} 
                ({Math.round(templateFile.size / 1024)} KB)
              </div>
            )}
            <button 
              onClick={uploadTemplateFile} 
              className="upload-btn" 
              disabled={!templateFile}
            >
              Vorlage hochladen
            </button>
          </div>
        </div>
        
        <button onClick={toggleTemplateEditor} className="toggle-btn">
          {showTemplateEditor ? 'Editor schließen' : 'JSON-Vertragsvorlage bearbeiten (Legacy)'}
        </button>
        
        {showTemplateEditor && (
          <div className="template-editor">
            <p className="template-info">
              Verfügbare Platzhalter: {'{name}'}, {'{passportNumber}'}, {'{arrivalDate}'}, {'{currentDate}'}
            </p>
            <textarea
              value={templateEditorContent}
              onChange={(e) => setTemplateEditorContent(e.target.value)}
              rows={20}
              placeholder="JSON-Vertragsvorlage hier bearbeiten"
            />
            <button onClick={saveContractTemplate} className="save-btn">Vorlage speichern</button>
            {templateSaved && <p className="success-message">Vertragsvorlage gespeichert!</p>}
          </div>
        )}
      </div>
      
      <div className="files-section">
        <h3>Gespeicherte Verträge</h3>
        <button onClick={fetchFiles} className="refresh-btn">Aktualisieren</button>
        
        {loading ? (
          <p>Lade Dateien...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="contracts-list">
            {files.contracts.length === 0 ? (
              <p>Keine Verträge generiert</p>
            ) : (
              <div className="contracts-table">
                <table>
                  <thead>
                    <tr>
                      <th>Gast</th>
                      <th>Datum</th>
                      <th>Typ</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.contracts.map((contract, index) => (
                      <tr key={index} className={contract.type === 'signed' ? 'signed-contract' : ''}>
                        <td>{contract.guestName || 'Unbekannt'}</td>
                        <td>{contract.date}</td>
                        <td>{contract.type === 'signed' ? 'Unterzeichnet' : 'Nicht unterzeichnet'}</td>
                        <td className="actions-cell">
                          <button 
                            onClick={() => handleDownload(contract.downloadUrl, contract.fileName)}
                            className="download-btn"
                            title="Vertrag herunterladen"
                          >
                            <span className="icon">📄</span>
                          </button>
                          {contract.passportFile && (
                            <button
                              onClick={() => handleDownload(contract.passportDownloadUrl, contract.passportFile)}
                              className="download-passport-btn"
                              title="Pass herunterladen"
                            >
                              <span className="icon">🪪</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {files.standalone_passports && files.standalone_passports.length > 0 && (
              <div className="standalone-passports">
                <h4>Unzugeordnete Pässe ({files.standalone_passports.length})</h4>
                <ul>
                  {files.standalone_passports.map((file, index) => (
                    <li key={index}>
                      <span className="file-name">{file}</span>
                      <button 
                        onClick={() => handleDownload(`/api/admin/download?type=passport&fileName=${encodeURIComponent(file)}`, file)}
                        className="download-btn-small"
                        title="Pass herunterladen"
                      >
                        🪪
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 
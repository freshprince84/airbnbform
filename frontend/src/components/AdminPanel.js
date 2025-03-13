import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [files, setFiles] = useState({ 
    contracts: [], 
    standalone_passports: []
  });
  const [driveConfig, setDriveConfig] = useState({
    folderPath: '',
    apiKey: ''
  });
  const [contractTemplate, setContractTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateEditorContent, setTemplateEditorContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configSaved, setConfigSaved] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    // Laden der gespeicherten Dateien beim Mounten der Komponente
    fetchFiles();
    fetchContractTemplate();

    // Laden der gespeicherten Konfiguration (falls vorhanden)
    const savedConfig = localStorage.getItem('driveConfig');
    if (savedConfig) {
      setDriveConfig(JSON.parse(savedConfig));
    }
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/files');
      
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
      const response = await fetch('http://localhost:3001/api/admin/contract-template');
      
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
      
      const response = await fetch('http://localhost:3001/api/admin/contract-template', {
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
    const fullUrl = `http://localhost:3001${url}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      <div className="template-section">
        <h3>Vertragsvorlage</h3>
        <button onClick={toggleTemplateEditor} className="toggle-btn">
          {showTemplateEditor ? 'Editor schließen' : 'Vertragsvorlage bearbeiten'}
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
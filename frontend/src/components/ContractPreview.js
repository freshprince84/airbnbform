import React, { useState } from 'react';
import '../styles/ContractPreview.css';

const ContractPreview = ({ contractData, onSign }) => {
  const [signedFile, setSignedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [signedDocUrl, setSignedDocUrl] = useState(null);

  // Prüfen, ob Vertragsdaten vorhanden sind
  if (!contractData || !contractData.url) {
    return <div className="contract-preview-error">Vertrag konnte nicht geladen werden.</div>;
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSignedFile(e.target.files[0]);
    }
  };

  const handleUploadSigned = async () => {
    if (!signedFile) {
      setUploadStatus('Bitte wählen Sie eine Datei aus');
      return;
    }

    try {
      setUploadStatus('Wird hochgeladen...');
      
      // Datei als Base64 einlesen
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1]; // Base64-Teil nach dem Komma extrahieren
        
        const response = await fetch(`/api/upload-signed-contract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractBuffer: base64Data,
            guestName: 'Gast' // TODO: Gastnamen aus Elternkomponente übergeben
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setSignedDocUrl(result.url);
          setUploadStatus('Dokument erfolgreich hochgeladen!');
        } else {
          setUploadStatus(`Fehler: ${result.error}`);
        }
      };
      
      reader.readAsDataURL(signedFile);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      setUploadStatus('Fehler beim Hochladen. Bitte versuchen Sie es erneut.');
    }
  };

  const handleDownloadClick = () => {
    // Öffnen des Vertrags in einem neuen Tab
    window.open(contractData.url, '_blank');
  };

  const handleViewPassportClick = () => {
    // Wenn Passfoto-Informationen vorhanden sind, öffnen wir es in einem neuen Tab
    if (contractData.passportUrl) {
      window.open(contractData.passportUrl, '_blank');
    } else {
      alert('Kein Passfoto vorhanden.');
    }
  };

  return (
    <div className="contract-preview">
      <h2>Vertrag erfolgreich erstellt</h2>
      
      <div className="contract-actions">
        <button onClick={handleDownloadClick} className="btn-download">
          Vertrag öffnen
        </button>
        
        {contractData.passportUrl && (
          <button onClick={handleViewPassportClick} className="btn-view-passport">
            Passfoto anzeigen
          </button>
        )}
        
        {onSign && (
          <button onClick={onSign} className="btn-sign">
            Vertrag digital unterschreiben
          </button>
        )}
      </div>
      
      <p className="contract-info">
        Der Vertrag wurde erfolgreich erstellt und gespeichert. Sie können ihn jetzt herunterladen oder direkt öffnen.
      </p>

      <div className="upload-signed-section">
        <h3>Signiertes Dokument hochladen</h3>
        <p>Falls Sie den Vertrag manuell signiert haben, können Sie ihn hier hochladen:</p>
        <input 
          type="file" 
          accept=".doc,.docx,.pdf" 
          onChange={handleFileChange} 
        />
        <button 
          onClick={handleUploadSigned} 
          disabled={!signedFile}
          className="upload-btn"
        >
          Hochladen
        </button>
        
        {uploadStatus && <p className="status-message">{uploadStatus}</p>}
        
        {signedDocUrl && (
          <div className="signed-doc-preview">
            <p>Ihr signiertes Dokument wurde hochgeladen!</p>
            <a href={signedDocUrl} target="_blank" rel="noopener noreferrer">
              Signiertes Dokument anzeigen
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPreview;

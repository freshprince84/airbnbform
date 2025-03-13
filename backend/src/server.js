const express = require('express');
const { generateContract } = require('./contractTemplate');
const { uploadToDrive } = require('./googleDrive');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' })); // Erhöhung der Größenbeschränkung für größere Dateien

// CORS-Middleware hinzufügen, um Anfragen vom Frontend zu ermöglichen
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3002', 'http://localhost:3000', 'https://airbnbform.vercel.app'];
  const origin = req.headers.origin;
  
  // Erlaube Zugriff von allen Ursprüngen in der Liste
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Falls der Ursprung nicht in der Liste ist, prüfe, ob wir im Produktionsmodus sind
    const host = req.headers.host;
    if (host && (host.endsWith('.vercel.app') || !host.includes('localhost'))) {
      res.header('Access-Control-Allow-Origin', `https://${host}`);
    }
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// Verzeichnis für Vertragsvorlagen erstellen, falls es nicht existiert
const templatesDir = path.join(__dirname, '../templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
  console.log('Templates-Verzeichnis erstellt:', templatesDir);
  
  // Speichern der Standard-Vorlage beim ersten Start
  const defaultTemplate = require('./contractTemplate').getDefaultTemplate();
  fs.writeFileSync(path.join(templatesDir, 'default_template.json'), JSON.stringify(defaultTemplate, null, 2));
  console.log('Standard-Vertragsvorlage erstellt');
}

// Verzeichnis für Uploads erstellen, falls es nicht existiert
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads-Verzeichnis erstellt:', uploadsDir);
}

// Verzeichnis für Verträge erstellen, falls es nicht existiert
const contractsDir = path.join(__dirname, '../contracts');
if (!fs.existsSync(contractsDir)) {
  fs.mkdirSync(contractsDir, { recursive: true });
  console.log('Verträge-Verzeichnis erstellt:', contractsDir);
}

// Hilfsfunktion zum Speichern von Base64-Daten als Datei
const saveBase64File = (base64Data, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Versuche Base64-Datei zu speichern: ${fileName}`);
      if (!base64Data) {
        return reject(new Error('Keine Base64-Daten vorhanden'));
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      console.log(`Datei erfolgreich gespeichert: ${filePath}`);
      resolve(filePath);
    } catch (error) {
      console.error('Fehler beim Speichern der Base64-Datei:', error);
      reject(error);
    }
  });
};

// OPTIONS-Anfragen für CORS unterstützen
app.options('*', (req, res) => {
  res.status(200).end();
});

// Test-Endpunkt, um zu prüfen, ob der Server läuft
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server läuft' });
});

// Admin-Endpunkt zum Abrufen gespeicherter Dateien
app.get('/api/admin/files', (req, res) => {
  try {
    console.log('Abrufen der gespeicherten Dateien...');
    
    // Prüfen, ob die Verzeichnisse existieren
    if (!fs.existsSync(uploadsDir)) {
      console.log('Uploads-Verzeichnis existiert nicht, erstelle es...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(contractsDir)) {
      console.log('Verträge-Verzeichnis existiert nicht, erstelle es...');
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    
    // Passportdateien auflisten
    const passportFiles = fs.existsSync(uploadsDir) 
      ? fs.readdirSync(uploadsDir) 
      : [];
    
    // Vertragsdateien auflisten
    const contractFiles = fs.existsSync(contractsDir) 
      ? fs.readdirSync(contractsDir) 
      : [];
    
    // Verträge und zugehörige Pässe zuordnen
    const contractsWithMetadata = [];
    
    contractFiles.forEach(contractFile => {
      // Extrahiere den Namen aus dem Vertrag (Format: Vertrag_Name_Timestamp.docx oder Signierter_Vertrag_Name_Timestamp.docx)
      let guestName = '';
      let timestamp = '';
      let isSigned = false;
      
      if (contractFile.startsWith('Signierter_Vertrag_')) {
        isSigned = true;
        const parts = contractFile.replace('Signierter_Vertrag_', '').split('_');
        if (parts.length >= 2) {
          guestName = parts[0];
          timestamp = parts[parts.length - 1].replace('.docx', '');
        }
      } else if (contractFile.startsWith('Vertrag_')) {
        const parts = contractFile.replace('Vertrag_', '').split('_');
        if (parts.length >= 2) {
          guestName = parts[0];
          timestamp = parts[parts.length - 1].replace('.docx', '');
        }
      }
      
      // Suche nach passenden Passport-Dateien
      let matchingPassport = null;
      passportFiles.forEach(passportFile => {
        if (passportFile.includes(`passport_${guestName}_`)) {
          matchingPassport = passportFile;
        }
      });
      
      contractsWithMetadata.push({
        fileName: contractFile,
        type: isSigned ? 'signed' : 'contract',
        guestName: guestName,
        timestamp: parseInt(timestamp) || Date.now(),
        date: new Date(parseInt(timestamp) || Date.now()).toLocaleDateString('de-DE'),
        downloadUrl: `/api/admin/download?type=contract&fileName=${encodeURIComponent(contractFile)}`,
        passportFile: matchingPassport,
        passportDownloadUrl: matchingPassport ? `/api/admin/download?type=passport&fileName=${encodeURIComponent(matchingPassport)}` : null
      });
    });
    
    // Sortiere nach Zeitstempel (neueste zuerst)
    contractsWithMetadata.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`Gefundene Dateien: ${passportFiles.length} Pässe, ${contractFiles.length} Verträge`);
    
    res.json({
      contracts: contractsWithMetadata,
      standalone_passports: passportFiles.filter(file => {
        // Finde Pässe, die keinem Vertrag zugeordnet sind
        return !contractsWithMetadata.some(contract => contract.passportFile === file);
      })
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Dateien:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Dateien' });
  }
});

// Neuer Endpunkt zum Herunterladen von Dateien
app.get('/api/admin/download', (req, res) => {
  try {
    const { type, fileName } = req.query;
    
    if (!type || !fileName) {
      return res.status(400).json({ error: 'Typ und Dateiname sind erforderlich' });
    }
    
    let filePath;
    
    if (type === 'contract') {
      filePath = path.join(contractsDir, fileName);
    } else if (type === 'passport') {
      filePath = path.join(uploadsDir, fileName);
    } else {
      return res.status(400).json({ error: 'Ungültiger Dateityp' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }
    
    console.log(`Sende Datei zum Download: ${filePath}`);
    res.download(filePath);
  } catch (error) {
    console.error('Fehler beim Herunterladen der Datei:', error);
    res.status(500).json({ error: 'Fehler beim Herunterladen der Datei' });
  }
});

// API-Endpunkt zum Abrufen der Vertragsvorlage
app.get('/api/admin/contract-template', (req, res) => {
  try {
    console.log('Abrufen der Vertragsvorlage...');
    const templatePath = path.join(templatesDir, 'default_template.json');
    
    if (!fs.existsSync(templatePath)) {
      // Falls keine Vorlage existiert, Standard-Vorlage erstellen
      const defaultTemplate = require('./contractTemplate').getDefaultTemplate();
      fs.writeFileSync(templatePath, JSON.stringify(defaultTemplate, null, 2));
      console.log('Standard-Vertragsvorlage erstellt, da keine existiert');
      return res.json(defaultTemplate);
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(templateContent);
    console.log('Vertragsvorlage erfolgreich abgerufen');
    res.json(template);
  } catch (error) {
    console.error('Fehler beim Abrufen der Vertragsvorlage:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Vertragsvorlage' });
  }
});

// API-Endpunkt zum Aktualisieren der Vertragsvorlage
app.post('/api/admin/contract-template', (req, res) => {
  try {
    console.log('Aktualisieren der Vertragsvorlage...');
    const template = req.body;
    
    if (!template || typeof template !== 'object') {
      return res.status(400).json({ error: 'Ungültiges Vorlagenformat' });
    }
    
    const templatePath = path.join(templatesDir, 'default_template.json');
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    
    // Aktualisiere den Contract Generator
    require('./contractTemplate').updateTemplate(template);
    
    console.log('Vertragsvorlage erfolgreich aktualisiert');
    res.json({ success: true, message: 'Vertragsvorlage erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Vertragsvorlage:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Vertragsvorlage' });
  }
});

app.post('/generate-contract', async (req, res) => {
  console.log('Anfrage zum Generieren eines Vertrags erhalten');
  try {
    const formData = req.body;
    console.log('Empfangene Formulardaten:', {
      name: formData.name,
      passportNumber: formData.passportNumber,
      arrivalDate: formData.arrivalDate,
      passportFileReceived: !!formData.passportFile
    });
    
    // Speichern der Passport-Datei, falls vorhanden
    let passportFilePath = null;
    if (formData.passportFile && formData.passportFile.data) {
      console.log('Passport-Datei gefunden, speichere...');
      const fileName = `passport_${formData.name}_${Date.now()}_${formData.passportFile.name}`;
      passportFilePath = await saveBase64File(formData.passportFile.data, fileName);
      console.log('Pass-Datei gespeichert unter:', passportFilePath);
    } else {
      console.log('Keine Passport-Datei in den Formulardaten gefunden oder keine Daten vorhanden');
      console.log('Passport-Dateiformat:', formData.passportFile ? JSON.stringify(Object.keys(formData.passportFile)) : 'null');
    }
    
    // Vertrag generieren
    console.log('Generiere Vertrag...');
    const contractBuffer = await generateContract(formData);
    
    // Speichern des Vertrags lokal
    const contractFileName = `Vertrag_${formData.name}_${Date.now()}.docx`;
    const contractPath = path.join(contractsDir, contractFileName);
    console.log('Speichere Vertrag unter:', contractPath);
    fs.writeFileSync(contractPath, contractBuffer);
    
    // Vertrag auf Google Drive hochladen
    console.log('Lade Vertrag auf Google Drive hoch...');
    const driveUrl = await uploadToDrive(contractBuffer, contractFileName);
    
    console.log('Vertrag generiert und hochgeladen:', driveUrl);
    
    res.json({ 
      url: driveUrl,
      localPath: contractPath
    });
  } catch (error) {
    console.error('Fehler bei der Vertragsgenerierung:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      error: 'Fehler bei der Vertragsgenerierung',
      details: error.message
    });
  }
});

// Neue Route zum Hochladen signierter Dokumente
app.post('/upload-signed-contract', async (req, res) => {
  console.log('Anfrage zum Hochladen eines signierten Vertrags erhalten');
  try {
    const { contractBuffer, guestName } = req.body;
    
    if (!contractBuffer) {
      console.log('Kein Dokument in der Anfrage gefunden');
      return res.status(400).json({ error: 'Kein Dokument gesendet' });
    }
    
    // Dateiname für signiertes Dokument
    const fileName = `Signierter_Vertrag_${guestName || 'Gast'}_${Date.now()}.docx`;
    console.log('Erstelle signiertes Dokument:', fileName);
    
    // Buffer für das signierte Dokument aus der Base64-Kodierung erstellen
    const buffer = Buffer.from(contractBuffer, 'base64');
    
    // Speichern des signierten Dokuments lokal
    const filePath = path.join(contractsDir, fileName);
    console.log('Speichere signiertes Dokument unter:', filePath);
    fs.writeFileSync(filePath, buffer);
    
    // Hochladen auf Google Drive
    console.log('Lade signiertes Dokument auf Google Drive hoch...');
    const driveUrl = await uploadToDrive(buffer, fileName);
    
    console.log('Signierter Vertrag hochgeladen:', driveUrl);
    
    res.json({ 
      url: driveUrl,
      localPath: filePath 
    });
  } catch (error) {
    console.error('Fehler beim Hochladen des signierten Vertrags:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      error: 'Fehler beim Hochladen des Dokuments',
      details: error.message
    });
  }
});

// Ein Fallback für alle anderen Routen
app.use((req, res) => {
  console.log(`404 - Route nicht gefunden: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route nicht gefunden' });
});

// Globaler Fehlerhandler
app.use((err, req, res, next) => {
  console.error('Unbehandelter Fehler:', err);
  res.status(500).json({ 
    error: 'Interner Serverfehler', 
    details: err.message 
  });
});

app.listen(3001, () => console.log('Server läuft auf Port 3001'));

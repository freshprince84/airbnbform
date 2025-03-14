const express = require('express');
const { generateContract } = require('./contractTemplate');
const { uploadToDrive } = require('./googleDrive');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json({ limit: '10mb' })); // Erhöhung der Größenbeschränkung für größere Dateien

// Multer für Datei-Uploads konfigurieren
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destPath = path.join(__dirname, '../templates');
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Speichern mit Originalname für Vertragsvorlagen
    if (file.fieldname === 'template') {
      cb(null, 'contract_template.docx');
    } else {
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB Limit
  fileFilter: (req, file, cb) => {
    // Überprüfen des Dateityps
    if (file.fieldname === 'template') {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
        cb(new Error('Nur Word-Dokumente (.docx) sind erlaubt.'));
      }
    } else {
      // Für andere Dateien (wie Passports) akzeptieren wir verschiedene Typen
      cb(null, true);
    }
  }
});

// CORS-Middleware hinzufügen, um Anfragen vom Frontend zu ermöglichen
app.use((req, res, next) => {
  console.log('CORS Request von:', req.headers.origin, 'Für URL:', req.url);
  
  const allowedOrigins = [
    'http://localhost:3002', 
    'http://localhost:3000', 
    'https://airbnbform.vercel.app',
    'http://65.109.228.106',
    'https://65.109.228.106',
    // Füge weitere mögliche Domains hinzu
    'http://65.109.228.106:3002',
    'http://65.109.228.106:80'
  ];
  const origin = req.headers.origin;
  
  // Erlaube Zugriff von allen Ursprüngen in der Liste
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('CORS: Origin erlaubt:', origin);
  } else {
    // Falls der Ursprung nicht in der Liste ist, prüfe, ob wir im Produktionsmodus sind
    const host = req.headers.host;
    if (host && (host.endsWith('.vercel.app') || !host.includes('localhost'))) {
      // Im Produktionsmodus erlauben wir den aktuellen Host
      res.header('Access-Control-Allow-Origin', `https://${host}`);
      console.log('CORS: Host erlaubt:', host);
    } else {
      // Für Entwicklungszwecke können wir alle Ursprünge erlauben
      // HINWEIS: In Produktion sollte dies entfernt werden!
      res.header('Access-Control-Allow-Origin', origin || '*');
      console.log('CORS: Wildcard erlaubt für:', origin || 'keine Origin');
    }
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

  // Behandlung von Preflight-Anfragen
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
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

// Standardvertragsvorlage als Word-Dokument erstellen, falls sie nicht existiert
const templateWordPath = path.join(templatesDir, 'contract_template.docx');
if (!fs.existsSync(templateWordPath)) {
  // Hier würde normalerweise die Erstellung der Word-Vorlage erfolgen
  // Für diesen Kontext nehmen wir an, dass die Vorlage später hochgeladen wird
  console.log('Keine Word-Vertragsvorlage gefunden. Bitte laden Sie eine hoch.');
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

app.post('/api/generate-contract', async (req, res) => {
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
app.post('/api/upload-signed-contract', async (req, res) => {
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

// API-Endpunkt zum Hochladen der Vertragsvorlage als Word-Dokument
app.post('/api/admin/upload-contract-template', upload.single('template'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }
    
    console.log('Vertragsvorlage hochgeladen:', req.file.path);
    
    // Hier könnten weitere Verarbeitungsschritte erfolgen, wie das Validieren des Dokuments
    // oder das Extrahieren von Metadaten
    
    res.json({ 
      success: true, 
      message: 'Vertragsvorlage erfolgreich hochgeladen',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Fehler beim Hochladen der Vertragsvorlage:', error);
    res.status(500).json({ 
      error: 'Fehler beim Hochladen der Vertragsvorlage',
      details: error.message
    });
  }
});

// API-Endpunkt für Gastgebereinstellungen
app.post('/api/admin/host-settings', (req, res) => {
  try {
    const hostSettings = req.body;
    
    if (!hostSettings || typeof hostSettings !== 'object') {
      return res.status(400).json({ error: 'Ungültiges Format für Gastgebereinstellungen' });
    }
    
    const hostSettingsPath = path.join(templatesDir, 'host_settings.json');
    fs.writeFileSync(hostSettingsPath, JSON.stringify(hostSettings, null, 2));
    
    console.log('Gastgebereinstellungen gespeichert:', hostSettings);
    res.json({ 
      success: true, 
      message: 'Gastgebereinstellungen erfolgreich gespeichert' 
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Gastgebereinstellungen:', error);
    res.status(500).json({ 
      error: 'Fehler beim Speichern der Gastgebereinstellungen',
      details: error.message
    });
  }
});

// API-Endpunkt zum Abrufen der Gastgebereinstellungen
app.get('/api/admin/host-settings', (req, res) => {
  try {
    const hostSettingsPath = path.join(templatesDir, 'host_settings.json');
    
    if (!fs.existsSync(hostSettingsPath)) {
      // Falls keine Einstellungen existieren, leere Standardeinstellungen zurückgeben
      return res.json({
        hostFirstName: '',
        hostLastName: '',
        propertyAddress: '',
        rentalAmount: ''
      });
    }
    
    const hostSettingsContent = fs.readFileSync(hostSettingsPath, 'utf8');
    const hostSettings = JSON.parse(hostSettingsContent);
    
    console.log('Gastgebereinstellungen abgerufen');
    res.json(hostSettings);
  } catch (error) {
    console.error('Fehler beim Abrufen der Gastgebereinstellungen:', error);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen der Gastgebereinstellungen',
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

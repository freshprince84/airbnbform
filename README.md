# Airbnb Guest Form Solution

Dieses Projekt erstellt eine Lösung für Airbnb-Gastdatenverwaltung mit Formular, Vertragsgenerierung und Google Drive-Integration.

## Setup und Installation

### Erstinstallation
```bash
# Abhängigkeiten für das gesamte Projekt installieren
npm run install-all
```

Alternativ können die Abhängigkeiten auch manuell installiert werden:
```bash
# Hauptabhängigkeiten
npm install

# Frontend-Abhängigkeiten
cd frontend
npm install

# Backend-Abhängigkeiten
cd ../backend
npm install
```

### Google Drive API konfigurieren
Erstelle eine `.env`-Datei im `backend`-Verzeichnis mit deinen Google Drive API-Schlüsseln:
```
GOOGLE_KEY_FILE=pfad/zu/deinem/google-api-schlüssel.json
DRIVE_FOLDER_ID=dein-google-drive-ordner-id
```

## Starten der Anwendung

### Backend starten
```bash
# Im Hauptverzeichnis
npm run start-backend

# Oder direkt im Backend-Verzeichnis
cd backend
npm start
```

### Frontend starten (Windows)
```bash
# Im Hauptverzeichnis
npm run start-frontend-win

# Oder direkt im Frontend-Verzeichnis
cd frontend
npm start
```

## Fehlerbehebung

### "Could not find a required file. Name: index.html"
Wenn du diese Meldung erhältst, fehlen manche Frontend-Dateien. Prüfe, ob die folgenden Dateien existieren:

- `frontend/public/index.html`
- `frontend/src/index.js`

Falls die Dateien fehlen, lege sie neu an oder lade das Repository erneut herunter.

### "Error: Cannot find module 'express'"
Wenn diese Fehlermeldung angezeigt wird, wurden die Abhängigkeiten nicht korrekt installiert. Führe folgende Befehle aus:

```bash
cd backend
npm install
```

## Port-Konfiguration
- **Backend-Server**: Läuft auf Port 3001
- **Frontend-Server**: Läuft auf Port 3002 (angepasst von Standard-Port 3000)
- **HINWEIS**: Die Ports 3000, 5000 und 5555 werden für andere Anwendungen verwendet und sind nicht verfügbar.

## Funktionen
- **Frontend**: Formular zum Ausfüllen der Gastdaten und Hochladen des Passes.
- **Backend**: Verarbeitung der Daten, Generierung eines Vertrags (DOCX), Speicherung in Google Drive.
- **Integration**: E-Mail-Versand und digitale Signatur (via Drittanbieter wie DocuSign möglich).

## Entwicklungsschritte
1. Frontend mit Formular für Gastdaten (`frontend/src`).
2. Backend-Server für die Datenverarbeitung (`backend/src/server.js`).
3. Vertragslogik zur Generierung von DOCX-Dokumenten (`contractTemplate.js`).
4. Google Drive-Integration für die Dokumentenspeicherung (`googleDrive.js`).

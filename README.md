# Airbnb Guest Form Solution

Dieses Projekt erstellt eine Lösung für Airbnb-Gastdatenverwaltung mit Formular, Vertragsgenerierung und Google Drive-Integration.

## Setup
1. Erstelle ein neues Node.js-Projekt: `npm init -y`
2. Installiere Abhängigkeiten: `npm install express dotenv docx pdf-lib googleapis`
3. Erstelle eine `.env`-Datei mit deinen Google Drive API-Schlüsseln (siehe `backend/src/googleDrive.js`).
4. Starte den Backend-Server: `node backend/src/server.js`
5. Starte das Frontend: `npm start` (im `frontend`-Ordner).

## Funktionen
- **Frontend**: Formular zum Ausfüllen der Gastdaten und Hochladen des Passes.
- **Backend**: Verarbeitung der Daten, Generierung eines Vertrags (DOCX), Speicherung in Google Drive.
- **Integration**: E-Mail-Versand und digitale Signatur (via Drittanbieter wie DocuSign möglich).

## Entwicklungsschritte für Claude 3.7
1. Implementiere das Frontend (`frontend/src`).
2. Erstelle den Backend-Server (`backend/src/server.js`).
3. Füge die Vertragslogik hinzu (`contractTemplate.js`).
4. Integriere Google Drive (`googleDrive.js`).

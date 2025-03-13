const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

// Mock-Funktion für die Entwicklung
async function uploadToDrive(buffer, fileName) {
  console.log('MOCK: Google Drive Upload simuliert für:', fileName);
  return `https://example.com/mock-drive-link/${fileName}`;
}

// Echte Implementierung (auskommentiert)
/*
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadToDrive(buffer, fileName) {
  try {
    const fileMetadata = { name: fileName, parents: [process.env.DRIVE_FOLDER_ID] };
    const media = { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', body: buffer };
    const res = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });
    return res.data.webViewLink;
  } catch (error) {
    console.error('Fehler beim Hochladen auf Google Drive:', error);
    return null;
  }
}
*/

module.exports = { uploadToDrive };

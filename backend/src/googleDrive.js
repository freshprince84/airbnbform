const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadToDrive(buffer, fileName) {
  const fileMetadata = { name: fileName, parents: [process.env.DRIVE_FOLDER_ID] };
  const media = { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', body: buffer };
  const res = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });
  return res.data.webViewLink;
}

module.exports = { uploadToDrive };

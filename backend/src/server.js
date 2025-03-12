const express = require('express');
const { generateContract } = require('./contractTemplate');
const { uploadToDrive } = require('./googleDrive');
const app = express();
app.use(express.json());

app.post('/generate-contract', async (req, res) => {
  const formData = req.body;
  const contractBuffer = await generateContract(formData);
  const driveUrl = await uploadToDrive(contractBuffer, 'Vertrag.docx');
  
  // Hier könntest du eine E-Mail mit nodemailer senden
  console.log('Vertrag generiert und hochgeladen:', driveUrl);

  res.json({ url: driveUrl });
});

app.listen(3001, () => console.log('Server läuft auf Port 3001'));

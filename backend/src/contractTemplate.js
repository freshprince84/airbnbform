const { Document, Packer, Paragraph, TextRun } = require('docx');

async function generateContract(formData) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun(`Vertrag für ${formData.name}`),
            new TextRun(`Passnummer: ${formData.passportNumber}`).break(),
            new TextRun(`Ankunftsdatum: ${formData.arrivalDate}`).break(),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { generateContract };

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

// Standard-Vertragsvorlage
let contractTemplate = {
  title: "MIETVERTRAG FÜR TOURISTISCHE UNTERKÜNFTE",
  dateLine: "Datum: {currentDate}",
  sections: [
    {
      title: "1. VERTRAGSPARTEIEN",
      content: [
        { label: "Vermieter: ", value: "Airbnb Gastgeber / Airbnb Host" },
        { label: "Gast: ", value: "{name}" },
        { label: "Reisepass-Nr: ", value: "{passportNumber}" }
      ]
    },
    {
      title: "2. MIETOBJEKT",
      content: [
        { value: "Ferienunterkunft in Kolumbien gemäß Airbnb-Angebot" }
      ]
    },
    {
      title: "3. MIETDAUER",
      content: [
        { label: "Ankunftsdatum: ", value: "{arrivalDate}" },
        { value: "Die genaue Aufenthaltsdauer ist in der Airbnb-Buchung festgelegt." }
      ]
    },
    {
      title: "4. UNTERSCHRIFTEN",
      content: [
        { value: "Dieser Vertrag wird elektronisch oder in ausgedruckter Form zur Verfügung gestellt und kann in beiden Formaten unterzeichnet werden." },
        { label: "Datum und Unterschrift des Gastes: ", value: "" }
      ]
    }
  ]
};

// Gibt die Standard-Vertragsvorlage zurück
function getDefaultTemplate() {
  return JSON.parse(JSON.stringify(contractTemplate));
}

// Aktualisiert die Vertragsvorlage
function updateTemplate(newTemplate) {
  contractTemplate = newTemplate;
  console.log('Vertragsvorlage wurde aktualisiert');
}

// Ersetzt Platzhalter in einem Text
function replacePlaceholders(text, formData) {
  const currentDate = new Date().toLocaleDateString('de-DE');
  
  return text
    .replace(/{currentDate}/g, currentDate)
    .replace(/{name}/g, formData.name || "Nicht angegeben")
    .replace(/{passportNumber}/g, formData.passportNumber || "Nicht angegeben")
    .replace(/{arrivalDate}/g, formData.arrivalDate || "Nicht angegeben");
}

async function generateContract(formData) {
  // Dokument mit Abschnitten aus der Vorlage erstellen
  const docChildren = [];
  
  // Titel
  docChildren.push(
    new Paragraph({
      text: replacePlaceholders(contractTemplate.title, formData),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      thematicBreak: true,
    })
  );
  
  // Datumszeile
  docChildren.push(
    new Paragraph({
      text: replacePlaceholders(contractTemplate.dateLine, formData),
      alignment: AlignmentType.RIGHT,
    })
  );
  
  docChildren.push(new Paragraph({})); // Leerzeile
  
  // Abschnitte durchgehen und hinzufügen
  for (const section of contractTemplate.sections) {
    // Abschnittstitel
    docChildren.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
      })
    );
    
    // Abschnittsinhalte
    for (const contentItem of section.content) {
      if (contentItem.label) {
        // Mit Label & Wert
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contentItem.label,
                bold: true,
              }),
              new TextRun(replacePlaceholders(contentItem.value, formData))
            ]
          })
        );
      } else {
        // Nur Text
        docChildren.push(
          new Paragraph({
            text: replacePlaceholders(contentItem.value, formData)
          })
        );
      }
    }
    
    docChildren.push(new Paragraph({})); // Leerzeile nach jedem Abschnitt
  }
  
  // Unterschriftslinie am Ende
  docChildren.push(
    new Paragraph({
      text: "_______________________________",
      spacing: {
        before: 720, // 1/2 inch in Twips
      }
    })
  );
  
  const doc = new Document({
    sections: [{
      children: docChildren,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { generateContract, getDefaultTemplate, updateTemplate };

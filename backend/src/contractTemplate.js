const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Pfad zur Word-Vorlage
const templateDir = path.join(__dirname, '../templates');
const templatePath = path.join(templateDir, 'contract_template.docx');

// Standard-Vertragsvorlage (JSON-Format, wird nur verwendet, wenn keine Word-Vorlage existiert)
let contractTemplate = {
  title: "CONTRATO DE ARRENDAMIENTO PARA FINES TURÍSTICOS",
  dateLine: "Fecha: {currentDate}",
  sections: [
    {
      title: "1. PARTES DEL CONTRATO",
      content: [
        { label: "Arrendador: ", value: "{hostFirstName} {hostLastName}" },
        { label: "Dirección del inmueble: ", value: "{propertyAddress}" },
        { label: "Arrendatario: ", value: "{guestFirstName} {guestLastName}" },
        { label: "Documento de identidad: ", value: "Pasaporte No. {passportNumber}" },
        { label: "Correo electrónico: ", value: "{email}" }
      ]
    },
    {
      title: "2. OBJETO DEL CONTRATO",
      content: [
        { value: "El ARRENDADOR entrega al ARRENDATARIO en calidad de arrendamiento, el inmueble ubicado en la dirección indicada anteriormente, para uso exclusivamente turístico y temporal." }
      ]
    },
    {
      title: "3. DURACIÓN DEL CONTRATO",
      content: [
        { label: "Fecha de entrada: ", value: "{checkInDate}" },
        { label: "Fecha de salida: ", value: "{checkOutDate}" },
        { label: "Número de huéspedes: ", value: "{guests}" }
      ]
    },
    {
      title: "4. VALOR Y FORMA DE PAGO",
      content: [
        { label: "Valor del arrendamiento: ", value: "{rentalAmount}" },
        { value: "El pago se realizará según lo acordado en la plataforma de reserva." }
      ]
    },
    {
      title: "5. OBLIGACIONES DEL ARRENDATARIO",
      content: [
        { value: "a) Destinar el inmueble exclusivamente para fines turísticos." },
        { value: "b) Cuidar el inmueble y los enseres que se encuentran en él." },
        { value: "c) No realizar fiestas o eventos sin autorización previa." },
        { value: "d) Entregar el inmueble en las mismas condiciones en que fue recibido." },
        { value: "e) Respetar las normas de convivencia del edificio o conjunto residencial." }
      ]
    },
    {
      title: "6. ACUERDOS ESPECIALES",
      content: [
        { value: "{specialAgreements}" }
      ]
    },
    {
      title: "7. FIRMAS",
      content: [
        { value: "Este contrato se firma en señal de aceptación por ambas partes." },
        { label: "Firma del Arrendador: ", value: "____________________" },
        { label: "Firma del Arrendatario: ", value: "____________________" }
      ]
    }
  ]
};

// Erstellt die Standard-Word-Vorlage, falls keine existiert
function createDefaultWordTemplate() {
  if (!fs.existsSync(templatePath)) {
    console.log('Erstelle Standard-Word-Vorlage...');
    
    // Erstelle ein neues Word-Dokument mit der Standard-Vorlage
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: contractTemplate.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: contractTemplate.dateLine,
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({}), // Leerzeile
          
          // Abschnitte
          ...contractTemplate.sections.flatMap(section => [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
            }),
            
            // Inhalte des Abschnitts
            ...section.content.map(item => {
              if (item.label) {
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: item.label,
                      bold: true,
                    }),
                    new TextRun(item.value)
                  ]
                });
              } else {
                return new Paragraph({
                  text: item.value
                });
              }
            }),
            
            new Paragraph({}), // Leerzeile nach jedem Abschnitt
          ])
        ]
      }]
    });
    
    // Speichern der Word-Vorlage
    Packer.toBuffer(doc).then(buffer => {
      fs.writeFileSync(templatePath, buffer);
      console.log('Standard-Word-Vorlage erstellt:', templatePath);
    });
  }
}

// Gibt die Standard-Vertragsvorlage zurück
function getDefaultTemplate() {
  return JSON.parse(JSON.stringify(contractTemplate));
}

// Aktualisiert die Vertragsvorlage
function updateTemplate(newTemplate) {
  contractTemplate = newTemplate;
  console.log('Vertragsvorlage wurde aktualisiert');
}

// Generiert einen Vertrag basierend auf den Formulardaten
async function generateContract(formData) {
  try {
    // Prüfen, ob eine Word-Vorlage existiert
    if (fs.existsSync(templatePath)) {
      console.log('Verwende Word-Vorlage:', templatePath);
      return generateFromWordTemplate(formData);
    } else {
      console.log('Keine Word-Vorlage gefunden, erstelle Standard-Vorlage');
      createDefaultWordTemplate();
      
      // Wenn die Vorlage gerade erstellt wurde, verwende sie
      if (fs.existsSync(templatePath)) {
        return generateFromWordTemplate(formData);
      } else {
        // Fallback zur JSON-Vorlage
        console.log('Verwende JSON-Vorlage als Fallback');
        return generateFromJsonTemplate(formData);
      }
    }
  } catch (error) {
    console.error('Fehler bei der Vertragsgenerierung:', error);
    throw error;
  }
}

// Generiert einen Vertrag aus einer Word-Vorlage mit Docxtemplater
async function generateFromWordTemplate(formData) {
  try {
    // Lade die Gastgebereinstellungen
    let hostSettings = {
      hostFirstName: '',
      hostLastName: '',
      propertyAddress: '',
      rentalAmount: ''
    };
    
    const hostSettingsPath = path.join(templateDir, 'host_settings.json');
    if (fs.existsSync(hostSettingsPath)) {
      try {
        const hostSettingsContent = fs.readFileSync(hostSettingsPath, 'utf8');
        hostSettings = JSON.parse(hostSettingsContent);
      } catch (error) {
        console.error('Fehler beim Laden der Gastgebereinstellungen:', error);
      }
    }
    
    // Lese die Word-Vorlage
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Setze die Daten für die Platzhalter
    const currentDate = new Date().toLocaleDateString('de-DE');
    
    doc.setData({
      currentDate: currentDate,
      guestFirstName: formData.firstName || '',
      guestLastName: formData.lastName || '',
      email: formData.email || '',
      checkInDate: formData.checkInDate || '',
      checkOutDate: formData.checkOutDate || '',
      guests: formData.guests || '1',
      passportNumber: formData.passportNumber || '',
      specialAgreements: formData.specialAgreements || '',
      hostFirstName: hostSettings.hostFirstName || '',
      hostLastName: hostSettings.hostLastName || '',
      propertyAddress: hostSettings.propertyAddress || '',
      rentalAmount: hostSettings.rentalAmount || ''
    });
    
    // Render das Dokument (ersetze alle Platzhalter)
    doc.render();
    
    // Generiere das Ausgabedokument
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    
    return buffer;
  } catch (error) {
    console.error('Fehler bei der Generierung aus Word-Vorlage:', error);
    // Fallback zur JSON-Vorlage bei Fehler
    return generateFromJsonTemplate(formData);
  }
}

// Generiert einen Vertrag aus der JSON-Vorlage (Legacy-Methode)
async function generateFromJsonTemplate(formData) {
  console.log('Generiere Vertrag aus JSON-Vorlage');
  
  // Lade die Gastgebereinstellungen
  let hostSettings = {
    hostFirstName: '',
    hostLastName: '',
    propertyAddress: '',
    rentalAmount: ''
  };
  
  const hostSettingsPath = path.join(templateDir, 'host_settings.json');
  if (fs.existsSync(hostSettingsPath)) {
    try {
      const hostSettingsContent = fs.readFileSync(hostSettingsPath, 'utf8');
      hostSettings = JSON.parse(hostSettingsContent);
    } catch (error) {
      console.error('Fehler beim Laden der Gastgebereinstellungen:', error);
    }
  }
  
  // Dokument mit Abschnitten aus der Vorlage erstellen
  const docChildren = [];
  
  // Titel
  docChildren.push(
    new Paragraph({
      text: replacePlaceholders(contractTemplate.title, formData, hostSettings),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      thematicBreak: true,
    })
  );
  
  // Datumszeile
  docChildren.push(
    new Paragraph({
      text: replacePlaceholders(contractTemplate.dateLine, formData, hostSettings),
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
              new TextRun(replacePlaceholders(contentItem.value, formData, hostSettings))
            ]
          })
        );
      } else {
        // Nur Text
        docChildren.push(
          new Paragraph({
            text: replacePlaceholders(contentItem.value, formData, hostSettings)
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

// Ersetzt Platzhalter in einem Text
function replacePlaceholders(text, formData, hostSettings) {
  const currentDate = new Date().toLocaleDateString('de-DE');
  
  return text
    .replace(/{currentDate}/g, currentDate)
    .replace(/{guestFirstName}/g, formData.firstName || '')
    .replace(/{guestLastName}/g, formData.lastName || '')
    .replace(/{name}/g, `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Nicht angegeben')
    .replace(/{email}/g, formData.email || '')
    .replace(/{passportNumber}/g, formData.passportNumber || 'Nicht angegeben')
    .replace(/{checkInDate}/g, formData.checkInDate || 'Nicht angegeben')
    .replace(/{arrivalDate}/g, formData.checkInDate || 'Nicht angegeben')
    .replace(/{checkOutDate}/g, formData.checkOutDate || '')
    .replace(/{guests}/g, formData.guests || '1')
    .replace(/{specialAgreements}/g, formData.specialAgreements || '')
    .replace(/{hostFirstName}/g, hostSettings.hostFirstName || '')
    .replace(/{hostLastName}/g, hostSettings.hostLastName || '')
    .replace(/{propertyAddress}/g, hostSettings.propertyAddress || '')
    .replace(/{rentalAmount}/g, hostSettings.rentalAmount || '');
}

// Beim Start die Standard-Word-Vorlage erstellen, falls keine existiert
createDefaultWordTemplate();

module.exports = { generateContract, getDefaultTemplate, updateTemplate };

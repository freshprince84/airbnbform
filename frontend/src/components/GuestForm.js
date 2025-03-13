import React, { useState } from 'react';

const GuestForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    passportNumber: '',
    arrivalDate: '',
    passportFile: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = 'Passnummer ist erforderlich';
    } else if (formData.passportNumber.length < 5) {
      newErrors.passportNumber = 'Passnummer muss mindestens 5 Zeichen haben';
    }
    
    if (!formData.arrivalDate) {
      newErrors.arrivalDate = 'Ankunftsdatum ist erforderlich';
    }
    
    if (!formData.passportFile) {
      newErrors.passportFile = 'Pass-Datei ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'passportFile' && files && files[0]) {
      // Überprüfen der Dateigröße (max 5MB)
      if (files[0].size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          passportFile: 'Die Datei ist zu groß (max. 5MB)'
        });
        return;
      }
      
      console.log(`Datei ausgewählt: ${files[0].name}, Größe: ${files[0].size} Bytes, Typ: ${files[0].type}`);
    }
    
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
    
    // Fehler bei Eingabe zurücksetzen
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProgress('Validiere Formular...');
    
    if (!validateForm()) {
      setProgress('');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Konvertiere die Datei in Base64 für den Upload
      setProgress('Verarbeite Datei...');
      
      if (!formData.passportFile) {
        throw new Error('Keine Datei ausgewählt');
      }
      
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          setProgress('Datei wurde geladen, extrahiere Base64-Daten...');
          
          // Das base64-kodierte Ergebnis extrahieren
          const base64String = event.target.result;
          const base64Data = base64String.split(',')[1]; // Base64-Teil nach dem Komma extrahieren
          
          if (!base64Data) {
            throw new Error('Fehler beim Extrahieren der Base64-Daten');
          }
          
          setProgress('Bereite Formulardaten vor...');
          
          // Formular mit Base64-Datei vorbereiten
          const formDataForSubmit = {
            name: formData.name,
            passportNumber: formData.passportNumber,
            arrivalDate: formData.arrivalDate,
            passportFile: {
              name: formData.passportFile.name,
              type: formData.passportFile.type,
              size: formData.passportFile.size,
              data: base64Data
            }
          };
          
          setProgress('Sende Daten zum Server...');
          console.log('Sende Formulardaten mit Datei:', {
            name: formDataForSubmit.name,
            passportFileName: formDataForSubmit.passportFile.name,
            passportFileSize: formDataForSubmit.passportFile.size,
            base64DataLength: formDataForSubmit.passportFile.data ? 
              formDataForSubmit.passportFile.data.length : 'keine Daten'
          });
          
          await onSubmit(formDataForSubmit);
          setProgress('');
        } catch (error) {
          console.error('Fehler beim Konvertieren der Datei:', error);
          setErrors({
            ...errors,
            form: `Fehler beim Verarbeiten der Datei: ${error.message}`
          });
          setIsSubmitting(false);
          setProgress('');
        }
      };
      
      fileReader.onerror = (error) => {
        console.error('FileReader-Fehler:', error);
        setErrors({
          ...errors,
          form: 'Fehler beim Lesen der Datei. Bitte versuchen Sie es erneut.'
        });
        setIsSubmitting(false);
        setProgress('');
      };
      
      fileReader.readAsDataURL(formData.passportFile);
      
    } catch (error) {
      console.error('Fehler beim Absenden des Formulars:', error);
      setErrors({
        ...errors,
        form: `Es ist ein Fehler aufgetreten: ${error.message}`
      });
      setIsSubmitting(false);
      setProgress('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="guest-form">
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input 
          type="text" 
          id="name"
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          disabled={isSubmitting}
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="passportNumber">Passnummer:</label>
        <input 
          type="text" 
          id="passportNumber"
          name="passportNumber" 
          value={formData.passportNumber} 
          onChange={handleChange} 
          disabled={isSubmitting}
        />
        {errors.passportNumber && <div className="error-message">{errors.passportNumber}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="arrivalDate">Ankunftsdatum:</label>
        <input 
          type="date" 
          id="arrivalDate"
          name="arrivalDate" 
          value={formData.arrivalDate} 
          onChange={handleChange} 
          disabled={isSubmitting}
        />
        {errors.arrivalDate && <div className="error-message">{errors.arrivalDate}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="passportFile">Pass hochladen:</label>
        <input 
          type="file" 
          id="passportFile"
          name="passportFile" 
          accept=".pdf,.jpg,.jpeg,.png" 
          onChange={handleChange} 
          disabled={isSubmitting}
        />
        {formData.passportFile && (
          <div className="file-info">
            Ausgewählte Datei: {formData.passportFile.name} 
            ({Math.round(formData.passportFile.size / 1024)} KB)
          </div>
        )}
        {errors.passportFile && <div className="error-message">{errors.passportFile}</div>}
      </div>
      
      {errors.form && <div className="error-message form-error">{errors.form}</div>}
      
      {progress && (
        <div className="progress-message">
          <div className="spinner"></div>
          {progress}
        </div>
      )}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Wird verarbeitet...' : 'Weiter'}
      </button>
    </form>
  );
};

export default GuestForm;

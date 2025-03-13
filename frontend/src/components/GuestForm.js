import React, { useState, useRef } from 'react';
import FormField from './FormField';
import ContractPreview from './ContractPreview';
import '../styles/GuestForm.css';

// Dateitypen, die für Pass-Uploads erlaubt sind
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in Bytes

const GuestForm = ({ onFormSubmit, serverStatus }) => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    hostFirstName: '',
    hostLastName: '',
    propertyAddress: '',
    rentalAmount: '',
    specialAgreements: '',
  });

  // Pass-Datei state
  const [passportFile, setPassportFile] = useState(null);
  const [passportError, setPassportError] = useState('');
  const [passportPreview, setPassportPreview] = useState(null);
  
  // Contract state
  const [contractData, setContractData] = useState(null);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [contractError, setContractError] = useState('');
  
  // Validation state
  const [formErrors, setFormErrors] = useState({});
  const [validated, setValidated] = useState(false);

  // Refs für das Formular und die Pass-Datei
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handler für Änderungen in Formularfeldern
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Entfernt Fehlermeldungen, wenn Felder bearbeitet werden
    if (formErrors[name]) {
      const updatedErrors = { ...formErrors };
      delete updatedErrors[name];
      setFormErrors(updatedErrors);
    }
  };

  // Handler für die Auswahl der Pass-Datei
  const handlePassportChange = (e) => {
    const file = e.target.files[0];
    setPassportError('');
    
    if (!file) {
      setPassportFile(null);
      setPassportPreview(null);
      return;
    }
    
    // Überprüfung des Dateityps
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setPassportError('Nur JPG, PNG oder PDF-Dateien sind erlaubt.');
      e.target.value = '';
      return;
    }
    
    // Überprüfung der Dateigröße
    if (file.size > MAX_FILE_SIZE) {
      setPassportError('Die Datei ist zu groß. Maximale Größe ist 10 MB.');
      e.target.value = '';
      return;
    }
    
    setPassportFile(file);
    
    // Vorschau der Datei erstellen (für Bilder)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPassportPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // Für PDFs zeigen wir keinen Inhalt an, aber einen Hinweis
      setPassportPreview('pdf');
    }
  };

  // Validierung aller Formularfelder
  const validateForm = () => {
    const errors = {};
    
    // Überprüfung der Pflichtfelder
    if (!formData.firstName.trim()) errors.firstName = 'Vorname ist erforderlich';
    if (!formData.lastName.trim()) errors.lastName = 'Nachname ist erforderlich';
    if (!formData.email.trim()) errors.email = 'E-Mail ist erforderlich';
    if (!formData.checkInDate) errors.checkInDate = 'Check-in Datum ist erforderlich';
    if (!formData.checkOutDate) errors.checkOutDate = 'Check-out Datum ist erforderlich';
    
    // Überprüfung der Host-Informationen
    if (!formData.hostFirstName.trim()) errors.hostFirstName = 'Vorname des Gastgebers ist erforderlich';
    if (!formData.hostLastName.trim()) errors.hostLastName = 'Nachname des Gastgebers ist erforderlich';
    if (!formData.propertyAddress.trim()) errors.propertyAddress = 'Adresse der Unterkunft ist erforderlich';
    if (!formData.rentalAmount.trim()) errors.rentalAmount = 'Mietbetrag ist erforderlich';
    
    // Überprüfung des E-Mail-Formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Ungültiges E-Mail-Format';
    }
    
    // Überprüfung der Datumsfelder
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(formData.checkInDate);
    const checkOutDate = new Date(formData.checkOutDate);
    
    if (checkInDate < today) {
      errors.checkInDate = 'Check-in Datum kann nicht in der Vergangenheit liegen';
    }
    
    if (checkOutDate <= checkInDate) {
      errors.checkOutDate = 'Check-out Datum muss nach dem Check-in Datum liegen';
    }
    
    // Pass-Datei
    if (!passportFile) {
      errors.passport = 'Eine Kopie des Ausweisdokuments ist erforderlich';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler zum Absenden des Formulars und Generieren des Vertrags
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Zurücksetzen aller vorherigen Statuszustände
    setContractError('');
    setContractData(null);
    
    // Validierung aller Felder
    const isValid = validateForm();
    setValidated(true);
    
    if (!isValid) {
      return;
    }
    
    // Formular und Pass-Daten zusammenstellen
    const data = new FormData();
    
    // Formularfelder hinzufügen
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    
    // Pass-Datei hinzufügen
    if (passportFile) {
      data.append('passport', passportFile);
    }
    
    try {
      setGeneratingContract(true);
      
      // Überprüfen, ob der Server erreichbar ist
      if (!serverStatus.isConnected) {
        throw new Error('Der Server ist nicht erreichbar. Bitte versuchen Sie es später erneut.');
      }
      
      // Abfrage zum Generieren des Vertrags
      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        let errorMessage = 'Fehler bei der Generierung des Vertrags';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Fehler beim Parsen der Fehlermeldung', e);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Erfolgreiche Generierung des Vertrags
      setContractData(result);
      
      // Callback für übergeordnete Komponente
      if (onFormSubmit) {
        onFormSubmit(formData, result);
      }
      
    } catch (error) {
      console.error('Fehler beim Generieren des Vertrags:', error);
      setContractError(error.message || 'Fehler beim Generieren des Vertrags. Bitte versuchen Sie es später erneut.');
    } finally {
      setGeneratingContract(false);
    }
  };

  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      checkInDate: '',
      checkOutDate: '',
      guests: 1,
      hostFirstName: '',
      hostLastName: '',
      propertyAddress: '',
      rentalAmount: '',
      specialAgreements: '',
    });
    
    setPassportFile(null);
    setPassportPreview(null);
    setPassportError('');
    setContractData(null);
    setFormErrors({});
    setValidated(false);
    
    // Datei-Input zurücksetzen
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Formular-Scroll zurücksetzen
    if (formRef.current) {
      formRef.current.scrollTop = 0;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="guest-form" ref={formRef}>
      <div className="form-group">
        <label htmlFor="firstName">Vorname:</label>
        <input 
          type="text" 
          id="firstName"
          name="firstName" 
          value={formData.firstName} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.firstName && <div className="error-message">{formErrors.firstName}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="lastName">Nachname:</label>
        <input 
          type="text" 
          id="lastName"
          name="lastName" 
          value={formData.lastName} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.lastName && <div className="error-message">{formErrors.lastName}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">E-Mail:</label>
        <input 
          type="email" 
          id="email"
          name="email" 
          value={formData.email} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.email && <div className="error-message">{formErrors.email}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="checkInDate">Check-in Datum:</label>
        <input 
          type="date" 
          id="checkInDate"
          name="checkInDate" 
          value={formData.checkInDate} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.checkInDate && <div className="error-message">{formErrors.checkInDate}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="checkOutDate">Check-out Datum:</label>
        <input 
          type="date" 
          id="checkOutDate"
          name="checkOutDate" 
          value={formData.checkOutDate} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.checkOutDate && <div className="error-message">{formErrors.checkOutDate}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="guests">Gäste:</label>
        <input 
          type="number" 
          id="guests"
          name="guests" 
          value={formData.guests} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.guests && <div className="error-message">{formErrors.guests}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="hostFirstName">Vorname des Gastgebers:</label>
        <input 
          type="text" 
          id="hostFirstName"
          name="hostFirstName" 
          value={formData.hostFirstName} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.hostFirstName && <div className="error-message">{formErrors.hostFirstName}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="hostLastName">Nachname des Gastgebers:</label>
        <input 
          type="text" 
          id="hostLastName"
          name="hostLastName" 
          value={formData.hostLastName} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.hostLastName && <div className="error-message">{formErrors.hostLastName}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="propertyAddress">Adresse der Unterkunft:</label>
        <input 
          type="text" 
          id="propertyAddress"
          name="propertyAddress" 
          value={formData.propertyAddress} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.propertyAddress && <div className="error-message">{formErrors.propertyAddress}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="rentalAmount">Mietbetrag:</label>
        <input 
          type="text" 
          id="rentalAmount"
          name="rentalAmount" 
          value={formData.rentalAmount} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.rentalAmount && <div className="error-message">{formErrors.rentalAmount}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="specialAgreements">Besondere Vereinbarungen:</label>
        <textarea 
          id="specialAgreements"
          name="specialAgreements" 
          value={formData.specialAgreements} 
          onChange={handleInputChange} 
          disabled={generatingContract}
        />
        {formErrors.specialAgreements && <div className="error-message">{formErrors.specialAgreements}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="passportFile">Pass hochladen:</label>
        <input 
          type="file" 
          id="passportFile"
          name="passportFile" 
          accept=".pdf,.jpg,.jpeg,.png" 
          onChange={handlePassportChange} 
          disabled={generatingContract}
          ref={fileInputRef}
        />
        {passportFile && (
          <div className="file-info">
            Ausgewählte Datei: {passportFile.name} 
            ({Math.round(passportFile.size / 1024)} KB)
          </div>
        )}
        {passportError && <div className="error-message">{passportError}</div>}
      </div>
      
      {passportPreview && (
        <div className="file-preview">
          {passportPreview === 'pdf' ? 'Dies ist eine PDF-Datei' : (
            <img src={passportPreview} alt="Passport Preview" />
          )}
        </div>
      )}
      
      {contractError && <div className="error-message form-error">{contractError}</div>}
      
      <button type="submit" disabled={generatingContract}>
        {generatingContract ? 'Wird verarbeitet...' : 'Weiter'}
      </button>
    </form>
  );
};

export default GuestForm;

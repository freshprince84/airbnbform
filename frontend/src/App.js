import React, { useState } from 'react';
import GuestForm from './components/GuestForm';
import ContractPreview from './components/ContractPreview';
import './styles.css';

function App() {
  const [contractUrl, setContractUrl] = useState(null);

  const handleFormSubmit = async (formData) => {
    const response = await fetch('http://localhost:3001/generate-contract', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' },
    });
    const { url } = await response.json();
    setContractUrl(url);
  };

  const handleSign = () => {
    alert('Digitale Signatur wird implementiert (z.B. DocuSign).');
  };

  return (
    <div className="App">
      <h1>Gastdaten für Kolumbien</h1>
      {!contractUrl ? (
        <GuestForm onSubmit={handleFormSubmit} />
      ) : (
        <ContractPreview contractUrl={contractUrl} onSign={handleSign} />
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';

const GuestForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    passportNumber: '',
    arrivalDate: '',
    passportFile: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      <label>Passnummer:</label>
      <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleChange} required />
      <label>Ankunftsdatum:</label>
      <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} required />
      <label>Pass hochladen:</label>
      <input type="file" name="passportFile" onChange={handleChange} required />
      <button type="submit">Weiter</button>
    </form>
  );
};

export default GuestForm;

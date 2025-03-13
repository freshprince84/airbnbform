import React from 'react';

/**
 * Wiederverwendbare Formularfeld-Komponente
 * @param {Object} props - Die Komponentenprops
 * @param {string} props.id - Die ID des Eingabefelds
 * @param {string} props.label - Das Label für das Eingabefeld
 * @param {string} props.name - Der Name des Eingabefelds (für formData)
 * @param {string} props.type - Der Typ des Eingabefelds (text, email, date, number, ...)
 * @param {string} props.value - Der aktuelle Wert des Eingabefelds
 * @param {function} props.onChange - Die Funktion, die bei Änderungen aufgerufen wird
 * @param {boolean} props.disabled - Ob das Eingabefeld deaktiviert ist
 * @param {string} props.error - Die Fehlermeldung, falls vorhanden
 * @param {Object} props.rest - Weitere Props, die an das Eingabefeld übergeben werden
 */
const FormField = ({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  disabled = false,
  error,
  ...rest
}) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        />
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FormField; 
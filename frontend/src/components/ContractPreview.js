import React from 'react';

const ContractPreview = ({ contractUrl, onSign }) => {
  return (
    <div>
      <h2>Ihr Vertrag</h2>
      <a href={contractUrl} download="Vertrag.docx">Download</a>
      <button onClick={onSign}>Digital signieren</button>
    </div>
  );
};

export default ContractPreview;

'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';

const GeneratePdfPage = () => {
  const [correcao, setCorrecao] = useState()
  const [error, setError] = useState(null);
  const [date, setDate] = useState(null);
  const [modulo, setModulo] = useState(null);



  useEffect(() => {
    // Recuperar dados do localStorage se existirem
    const storedData = localStorage.getItem('UserEmail');
    setDate(storedData)
  }, []);

  useEffect(() => {
    // Recuperar dados do localStorage se existirem
    const storedCorrecao = localStorage.getItem('correcao');
    setCorrecao(storedCorrecao)
  }, []);

  useEffect(() => {
    // Recuperar dados do localStorage se existirem
    const storedUFCD = localStorage.getItem('UFCD clicada');
    setModulo(storedUFCD)
  }, []);

  const FormeDate = {
    name:date,
    modulo:modulo,
    correcao:correcao,
    
  }
  console.log(FormeDate);
  
  const generatePdf = async () => {
    setError(null); // Reset error state
    try {
      const response = await axios.post('/api/generate-pdf', FormeDate, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificate.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // Capture and display error details
      const errorMessage = await error.response.data.text();
      console.error('Error generating PDF:', errorMessage);
      setError(`Error generating PDF: ${errorMessage}`);
    }
  };

  return (
    <div>
<button type="button" onClick={generatePdf}>Generate PDF</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default GeneratePdfPage;





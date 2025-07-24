import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const TermsOfService: React.FC = () => {
  const [content, setContent] = useState('Cargando...');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/legal/terms_of_service.txt`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        } else {
          setContent('No se pudo cargar el contenido. Por favor, inténtelo más tarde.');
        }
      } catch (error) {
        setContent('Error de conexión. No se pudo cargar el contenido.');
      }
    };

    fetchContent();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      <h1>Términos de Servicio</h1>
      <div style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '2rem', background: '#f9f9f9' }}>
        {content}
      </div>
    </div>
  );
};

export default TermsOfService;

import React, { useState } from 'react';
import { marked } from 'marked'; // Importar la biblioteca marked

interface ReportProps {
  reportContent: string;
}

const Report: React.FC<ReportProps> = ({ reportContent }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');

  const getHtmlContent = () => {
    if (!reportContent) return { __html: '' };
    // Configurar marked para que trate los saltos de línea como <br>
    marked.setOptions({
      breaks: true,
    });
    const html = marked(reportContent) as string;
    return { __html: html };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setMessage('Debe aceptar la política de privacidad para continuar.');
      return;
    }

    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/api/capture-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, company, consent }),
      });

      if (response.ok) {
        setMessage('¡Gracias! Nos pondremos en contacto contigo pronto.');
        setName('');
        setEmail('');
        setCompany('');
        setConsent(false);
      } else {
        const errorData = await response.text();
        setMessage(`Error al enviar los datos: ${errorData}`);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      console.error('Error al enviar el lead:', error);
    }
  };

  return (
    <div>
      <h1>Tu Informe de Futuro Estratégico</h1>
      {/* Renderizar el HTML convertido */}
      <div dangerouslySetInnerHTML={getHtmlContent()} />

      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h2>¿Listo para diseñar tu futuro real?</h2>
        <p>Este es el futuro que has construido en una simulación. ¿Estás seguro del futuro que estás construyendo en la realidad? En Rebus Insights no predecimos el futuro, te ayudamos a diseñarlo. ¿Conversamos sobre tu verdadero dilema?</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Tu Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Tu Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Tu Empresa"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
          <div>
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <label htmlFor="consent">Acepto ser contactado por Rebus Insights y he leído y acepto la Política de Privacidad.</label>
          </div>
          <button type="submit">Agendar Sesión Estratégica</button>
        </form>
        {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
      </div>
    </div>
  );
};

export default Report;
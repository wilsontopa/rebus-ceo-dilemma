import React, { useState, useEffect } from 'react';
import { marked } from 'marked';

// Definir la estructura del objeto del informe para mayor seguridad de tipos
interface ReportData {
  title?: string;
  date?: string;
  ceo?: string;
  summary?: string;
  analysis?: Array<{ [key: string]: any }>;
  recommendations?: string[];
}

interface ReportProps {
  reportContent: ReportData | null;
  onStartNewGame: () => void;
}

const API_URL = 'http://localhost:3000'; // Apuntar al backend local

// Función para construir el informe en Markdown de forma segura
const buildMarkdownReport = (data: ReportData): string => {
  let md = '';
  if (data.title) md += `# ${data.title}\n\n`;
  if (data.date) md += `**Fecha:** ${data.date}\n`;
  if (data.ceo) md += `**CEO:** ${data.ceo}\n\n`;
  if (data.summary) md += `### Resumen Ejecutivo\n${data.summary}\n\n`;
  
  if (data.analysis && Array.isArray(data.analysis)) {
    md += `### Análisis de Decisiones\n`;
    data.analysis.forEach(item => {
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'object' && value !== null) {
          md += `* **${key.charAt(0).toUpperCase() + key.slice(1)}:**\n`;
          for (const [subKey, subValue] of Object.entries(value)) {
            md += `  * *${subKey.charAt(0).toUpperCase() + subKey.slice(1)}:* ${subValue}\n`;
          }
        } else {
          md += `* **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}\n`;
        }
      }
      md += `\n`;
    });
  }
  
  if (data.recommendations && Array.isArray(data.recommendations)) {
    md += `### Recomendaciones Estratégicas\n`;
    data.recommendations.forEach(rec => {
      md += `* ${rec}\n`;
    });
    md += `\n`;
  }
  return md;
};

const Report: React.FC<ReportProps> = ({ reportContent, onStartNewGame }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (reportContent && typeof reportContent === 'object') {
      const markdown = buildMarkdownReport(reportContent);
      marked.setOptions({ breaks: true });
      const html = marked(markdown) as string;
      setHtmlContent(html);
    } else {
      setHtmlContent('<p>Generando informe...</p>');
    }
  }, [reportContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setMessage('Debe aceptar la política de privacidad para continuar.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, consent }),
      });

      if (response.ok) {
        setMessage('¡Gracias! Nos pondremos en contacto contigo pronto.');
        // Limpiar formulario
        setName('');
        setEmail('');
        setCompany('');
        setConsent(false);
      } else {
        setMessage(`Error: ${await response.text()}`);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div 
        style={{ textAlign: 'left', border: '1px solid #ddd', padding: '2rem', borderRadius: '8px', background: 'white' }}
        dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Generando informe...</p>' }} 
      />

      <div style={{ marginTop: '40px', borderTop: '2px solid #007bff', paddingTop: '20px', background: '#f9f9f9', padding: '2rem', borderRadius: '8px' }}>
        <h2>¿Listo para diseñar tu futuro real?</h2>
        <p>Este es el futuro que has construido en una simulación. ¿Estás seguro del futuro que estás construyendo en la realidad? En Rebus Insights no predecimos el futuro, te ayudamos a diseñarlo. ¿Conversamos sobre tu verdadero dilema?</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="Tu Nombre" value={name} onChange={(e) => setName(e.target.value)} required style={{padding: '0.5rem'}} />
          <input type="email" placeholder="Tu Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{padding: '0.5rem'}} />
          <input type="text" placeholder="Tu Empresa" value={company} onChange={(e) => setCompany(e.target.value)} required style={{padding: '0.5rem'}} />
          <div>
            <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <label htmlFor="consent" style={{marginLeft: '0.5rem'}}>Acepto ser contactado y he leído la Política de Privacidad.</label>
          </div>
          <button type="submit">Agendar Sesión Estratégica</button>
        </form>
        {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green', marginTop: '1rem' }}>{message}</p>}
      </div>

      <button onClick={onStartNewGame} style={{ marginTop: '2rem' }}>
        Iniciar Nueva Simulación
      </button>
    </div>
  );
};

export default Report;

import React from 'react';

interface ReportProps {
  reportContent: string;
}

const Report: React.FC<ReportProps> = ({ reportContent }) => {
  return (
    <div>
      <h1>Tu Informe de Futuro Estratégico</h1>
      <div dangerouslySetInnerHTML={{ __html: reportContent }} />
      {/* Aquí irá el formulario de captura de leads */}
    </div>
  );
};

export default Report;

import React, { useState } from 'react';

interface HomeProps {
  onStartGame: (name: string, company: string, sector: string) => void;
  isLoading: boolean; // Aceptar la nueva propiedad
}

const Home: React.FC<HomeProps> = ({ onStartGame, isLoading }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [sector, setSector] = useState('');

  const handleStart = () => {
    if (name && company && sector) {
      onStartGame(name, company, sector);
    } else {
      alert('Por favor, rellena todos los campos.');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1>El Dilema del CEO</h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>Pon a prueba tu visión estratégica.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <input
          type="text"
          placeholder="Tu Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '0.8rem', fontSize: '1rem' }}
        />
        <input
          type="text"
          placeholder="Tu Empresa"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          style={{ padding: '0.8rem', fontSize: '1rem' }}
        />
        <input
          type="text"
          placeholder="Sector de tu Empresa (ej. Tecnología, Retail)"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          list="sector-suggestions"
          required
          style={{ padding: '0.8rem', fontSize: '1rem' }}
        />
        <datalist id="sector-suggestions">
          <option value="Tecnología" />
          <option value="Servicios Financieros" />
          <option value="Retail" />
          <option value="Manufactura" />
          <option value="Salud" />
          <option value="Educación" />
          <option value="Energía" />
          <option value="Transporte" />
          <option value="Alimentos y Bebidas" />
          <option value="Bienes Raíces" />
          <option value="Consultoría" />
          <option value="Medios y Entretenimiento" />
        </datalist>
      </div>
      <button onClick={handleStart} disabled={isLoading} style={{ marginTop: '2rem', width: '100%', padding: '1rem' }}>
        {isLoading ? 'Iniciando...' : 'Iniciar Simulación'}
      </button>
    </div>
  );
};

export default Home;

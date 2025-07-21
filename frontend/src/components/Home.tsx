import React, { useState } from 'react';

interface HomeProps {
  onStartGame: (name: string, company: string, sector: string) => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
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
    <div>
      <h1>El Dilema del CEO</h1>
      <p>Pon a prueba tu visión estratégica.</p>
      <div>
        <input
          type="text"
          placeholder="Tu Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Tu Empresa"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
        <select value={sector} onChange={(e) => setSector(e.target.value)} required>
          <option value="">Selecciona un Sector</option>
          <option value="Tecnologia">Tecnología</option>
          <option value="Manufactura">Manufactura</option>
          <option value="Servicios Financieros">Servicios Financieros</option>
          <option value="Retail">Retail</option>
        </select>
      </div>
      <button onClick={handleStart}>Iniciar Simulación</button>
    </div>
  );
};

export default Home;

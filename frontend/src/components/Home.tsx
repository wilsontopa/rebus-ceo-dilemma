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
        <input
          type="text"
          placeholder="Sector de tu Empresa (ej. Tecnología, Retail)"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          list="sector-suggestions"
          required
        />
        <datalist id="sector-suggestions">
          <option value="Tecnología"></option>
          <option value="Servicios Financieros"></option>
          <option value="Retail"></option>
          <option value="Manufactura"></option>
          <option value="Salud"></option>
          <option value="Educación"></option>
          <option value="Energía"></option>
          <option value="Transporte"></option>
          <option value="Alimentos y Bebidas"></option>
          <option value="Bienes Raíces"></option>
          <option value="Consultoría"></option>
          <option value="Medios y Entretenimiento"></option>
        </datalist>
      </div>
      <button onClick={handleStart}>Iniciar Simulación</button>
    </div>
  );
};

export default Home;

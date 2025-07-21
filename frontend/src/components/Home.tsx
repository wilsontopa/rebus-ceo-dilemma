import React from 'react';

interface HomeProps {
  onStartGame: () => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
  return (
    <div>
      <h1>El Dilema del CEO</h1>
      <p>Pon a prueba tu visión estratégica.</p>
      <button onClick={onStartGame}>Iniciar Simulación</button>
    </div>
  );
};

export default Home;

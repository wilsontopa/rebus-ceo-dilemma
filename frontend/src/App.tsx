import React, { useState } from 'react';
import Home from './components/Home';
import Dilemma from './components/Dilemma';
import Report from './components/Report';
import './App.css';

type GameState = 'home' | 'dilemma' | 'report';

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [currentDilemma, setCurrentDilemma] = useState<any>(null);
  const [reportContent, setReportContent] = useState<string>('');

  const startGame = () => {
    // Lógica para iniciar el juego y obtener el primer dilema
    setCurrentDilemma({
      text: 'Este es el primer dilema de prueba.',
      options: ['Opción A', 'Opción B'],
    });
    setGameState('dilemma');
  };

  const handleOptionSelect = (option: string) => {
    // Lógica para enviar la opción seleccionada al backend y obtener el siguiente dilema o el informe final
    console.log('Opción seleccionada:', option);
    // Simulación de avance
    if (Math.random() > 0.5) {
      setCurrentDilemma({
        text: 'Este es el siguiente dilema.',
        options: ['Opción X', 'Opción Y'],
      });
    } else {
      setReportContent('Este es un informe de prueba generado por la simulación.');
      setGameState('report');
    }
  };

  return (
    <div className="App">
      {gameState === 'home' && <Home onStartGame={startGame} />}
      {gameState === 'dilemma' && currentDilemma && (
        <Dilemma
          dilemmaText={currentDilemma.text}
          options={currentDilemma.options}
          onSelectOption={handleOptionSelect}
        />
      )}
      {gameState === 'report' && <Report reportContent={reportContent} />}
    </div>
  );
}

export default App;
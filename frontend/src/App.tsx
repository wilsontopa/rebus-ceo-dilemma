import React, { useState } from 'react';
import Home from './components/Home';
import Dilemma from './components/Dilemma';
import Report from './components/Report';
import AdminPanel from './components/AdminPanel';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Disclaimer from './components/Disclaimer';
import './App.css';

type GameState = 'home' | 'dilemma' | 'report' | 'admin' | 'privacy' | 'terms' | 'disclaimer';

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDilemma, setCurrentDilemma] = useState<{ dilemmaText: string; options: string[] } | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para la carga

  const startGame = async (name: string, company: string, sector: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/api/start-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, company, sector }),
      });
      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentDilemma(data.dilemma);
      setGameState('dilemma');
    } catch (error) {
      console.error('Error al iniciar el juego:', error);
      alert('Error al iniciar el juego. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = async (option: string) => {
    if (!sessionId || isLoading) {
      return; // Evitar múltiples envíos si ya está cargando
    }
    setIsLoading(true);
    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/api/make-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, decision: option }),
      });
      const data = await response.json();

      if (data.type === 'dilemma') {
        setCurrentDilemma(data.dilemma);
      } else if (data.type === 'report') {
        setReportContent(data.report);
        setGameState('report');
      }
    } catch (error) {
      console.error('Error al tomar la decisión:', error);
      alert('Error al tomar la decisión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewGame = () => {
    setSessionId(null);
    setCurrentDilemma(null);
    setReportContent('');
    setGameState('home');
  };

  return (
    <div className="App">
      <img
        src="/Logo_Rebus.png"
        alt="Logo Rebus"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '100px', /* 10cm */
          height: '100px', /* 10cm */
          zIndex: 1000, /* Asegura que esté por encima de otros elementos */
        }}
      />
      {gameState === 'home' && <Home onStartGame={startGame} />}
      {gameState === 'dilemma' && currentDilemma && (
        <Dilemma
          dilemmaText={currentDilemma.dilemmaText}
          options={currentDilemma.options}
          onSelectOption={handleOptionSelect}
          isLoading={isLoading} // Pasar el estado de carga
        />
      )}
      {gameState === 'report' && <Report reportContent={reportContent} onStartNewGame={startNewGame} />}
      {gameState === 'admin' && <AdminPanel />}
      {gameState === 'privacy' && <PrivacyPolicy />}
      {gameState === 'terms' && <TermsOfService />}
      {gameState === 'disclaimer' && <Disclaimer />}

      <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#666' }}>
        <button onClick={() => setGameState('privacy')} style={{ background: 'none', color: '#007bff', border: 'none', padding: '0 5px', cursor: 'pointer' }}>Política de Privacidad</button> |
        <button onClick={() => setGameState('terms')} style={{ background: 'none', color: '#007bff', border: 'none', padding: '0 5px', cursor: 'pointer' }}>Términos de Servicio</button> |
        <button onClick={() => setGameState('disclaimer')} style={{ background: 'none', color: '#007bff', border: 'none', padding: '0 5px', cursor: 'pointer' }}>Descargo de Responsabilidad</button> |
        <button onClick={() => setGameState('admin')} style={{ background: 'none', color: '#007bff', border: 'none', padding: '0 5px', cursor: 'pointer' }}>Admin</button>
      </div>
      <img
        src="/Rebus_pie.png"
        alt="Imagen Institucional Rebus"
        style={{
          width: '100%',
          height: 'auto', /* Altura automática para no recortar */
          maxHeight: '140px', /* Máximo 14cm de alto (duplicado) */
          objectFit: 'contain', /* Para que la imagen se vea completa */
          marginTop: 'auto', /* Empuja la imagen al final */
          display: 'block', /* Elimina espacio extra debajo de la imagen */
        }}
      />
    </div>
  );
}

export default App;

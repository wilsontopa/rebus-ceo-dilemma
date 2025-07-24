import React, { useState } from 'react';
import Home from './components/Home';
import Dilemma from './components/Dilemma';
import Report from './components/Report';
import AdminPanel from './components/AdminPanel';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Disclaimer from './components/Disclaimer';
import './App.css';

// Definir tipos para el estado del juego y los datos
type GameState = 'home' | 'dilemma' | 'report' | 'admin' | 'privacy' | 'terms' | 'disclaimer';

interface ReportData {
  title?: string;
  date?: string;
  ceo?: string;
  summary?: string;
  analysis?: Array<{ [key: string]: any }>;
  recommendations?: string[];
}

const API_URL = 'http://localhost:3000'; // Apuntar al backend local para pruebas

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDilemma, setCurrentDilemma] = useState<{ dilemmaText: string; options: string[] } | null>(null);
  const [reportContent, setReportContent] = useState<ReportData | null>(null); // Estado robusto para el informe
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const startGame = async (name: string, company: string, sector: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, sector }),
      });
      const data = await response.json();
      if (response.ok) {
        setSessionId(data.sessionId);
        setCurrentDilemma(data.dilemma);
        setGameState('dilemma');
      } else {
        throw new Error(data.message || 'Error al iniciar el juego.');
      }
    } catch (error) {
      console.error('Error al iniciar el juego:', error);
      alert(error instanceof Error ? error.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = async (option: string) => {
    if (!sessionId || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/make-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, decision: option }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.type === 'dilemma') {
          setCurrentDilemma(data.dilemma);
        } else if (data.type === 'report') {
          setReportContent(data.report); // Guardar el objeto del informe
          setGameState('report');
        }
      } else {
        throw new Error(data.message || 'Error al tomar la decisión.');
      }
    } catch (error) {
      console.error('Error al tomar la decisión:', error);
      alert(error instanceof Error ? error.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewGame = () => {
    setSessionId(null);
    setCurrentDilemma(null);
    setReportContent(null); // Reiniciar el informe a null
    setGameState('home');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'home': return <Home onStartGame={startGame} isLoading={isLoading} />;
      case 'dilemma': return currentDilemma && <Dilemma {...currentDilemma} onSelectOption={handleOptionSelect} isLoading={isLoading} />;
      // Renderizar Report solo si reportContent tiene datos
      case 'report': return reportContent && <Report reportContent={reportContent} onStartNewGame={startNewGame} />;
      case 'admin': return <AdminPanel />;
      case 'privacy': return <PrivacyPolicy />;
      case 'terms': return <TermsOfService />;
      case 'disclaimer': return <Disclaimer />;
      default: return <Home onStartGame={startGame} isLoading={isLoading} />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src="/Logo_Rebus.png" alt="Logo Rebus" className="App-logo" onClick={() => setGameState('home')} style={{cursor: 'pointer'}} />
      </header>
      
      <main className="App-main">
        {renderGameState()}
      </main>

      <footer className="App-footer">
        <div className="footer-links">
          <button onClick={() => setGameState('privacy')}>Política de Privacidad</button> |
          <button onClick={() => setGameState('terms')}>Términos de Servicio</button> |
          <button onClick={() => setGameState('disclaimer')}>Descargo de Responsabilidad</button> |
          <button onClick={() => setGameState('admin')}>Admin</button>
        </div>
        <div className="footer-credits">
          <p>© 2025 Rebus Insights. Todos los derechos reservados. | Creado por Wilson Toledo, Director y Fundador de Rebus Insights.</p>
          <p>Desarrollado con la asistencia de Gemini, un modelo de lenguaje grande de Google. | Contacto: <a href="mailto:contacto@rebusinsights.net">contacto@rebusinsights.net</a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;

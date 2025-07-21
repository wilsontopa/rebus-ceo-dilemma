import React, { useState } from 'react';

const AdminPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [contextFiles, setContextFiles] = useState<string[]>([]);

  const handleLogin = async () => {
    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setMessage('Inicio de sesión exitoso.');
        // Aquí podrías almacenar un token de sesión o cambiar el estado para mostrar las funcionalidades de admin
      } else {
        const errorText = await response.text();
        setMessage(`Error de inicio de sesión: ${errorText}`);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      console.error('Error de login:', error);
    }
  };

  const handleFileUpload = async () => {
    // Lógica para subir el archivo
    setMessage('Funcionalidad de carga de archivo no implementada aún.');
  };

  const handleListFiles = async () => {
    // Lógica para listar archivos
    setMessage('Funcionalidad de listar archivos no implementada aún.');
  };

  const handleDeleteFile = async (filename: string) => {
    // Lógica para eliminar archivo
    setMessage(`Funcionalidad de eliminar ${filename} no implementada aún.`);
  };

  return (
    <div>
      <h1>Panel de Administración</h1>
      <div>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Iniciar Sesión</button>
      </div>

      {/* Funcionalidades de administración (visibles después del login) */}
      <div>
        <h2>Cargar Documento de Contexto</h2>
        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={handleFileUpload}>Cargar Archivo</button>
      </div>

      <div>
        <h2>Documentos de Contexto Actuales</h2>
        <button onClick={handleListFiles}>Listar Archivos</button>
        <ul>
          {contextFiles.map((filename) => (
            <li key={filename}>
              {filename} <button onClick={() => handleDeleteFile(filename)}>Eliminar</button>
            </li>
          ))}
        </ul>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminPanel;

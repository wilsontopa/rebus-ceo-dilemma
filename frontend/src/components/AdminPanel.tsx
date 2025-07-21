import React, { useState } from 'react';

const AdminPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [contextFiles, setContextFiles] = useState<string[]>([]);

  const handleLogin = async () => {
    // Lógica para autenticar al administrador
    setMessage('Funcionalidad de login no implementada aún.');
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

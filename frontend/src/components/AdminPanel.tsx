import React, { useState, useEffect } from 'react';

const AdminPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contextFiles, setContextFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setMessage('Autenticación exitosa.');
      } else {
        setMessage('Error: Credenciales inválidas.');
        setIsAuthenticated(false);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      setIsAuthenticated(false);
    }
  };

  const fetchContextFiles = async () => {
    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/admin/list-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // Enviar credenciales
      });
      if (response.ok) {
        const files = await response.json();
        setContextFiles(files);
      } else {
        setMessage('Error al listar los archivos de contexto.');
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor, selecciona un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('contextFile', selectedFile);
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/admin/upload-context', {
        method: 'POST',
        body: formData, // No se necesita Content-Type, el navegador lo pone
      });

      const resultMessage = await response.text();
      setMessage(resultMessage);
      if (response.ok) {
        fetchContextFiles(); // Recargar la lista de archivos
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await fetch('https://rebus-ceo-dilemma.onrender.com/admin/delete-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, filename }),
      });

      const resultMessage = await response.text();
      setMessage(resultMessage);
      if (response.ok) {
        fetchContextFiles(); // Recargar la lista de archivos
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
    }
  };

  // Cargar archivos cuando el componente se monta después de la autenticación
  useEffect(() => {
    if (isAuthenticated) {
      fetchContextFiles();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setMessage('Sesión cerrada.');
  };

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Acceso de Administrador</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Iniciar Sesión</button>
        </form>
        {message && <p style={{ color: 'red' }}>{message}</p>}
      </div>
    );
  }

  return (
    <div>
      <h2>Panel de Administración</h2>
      <button onClick={handleLogout} style={{ marginBottom: '20px' }}>Cerrar Sesión</button>
      {message && <p>{message}</p>}

      <div>
        <h3>Cargar Nuevo Documento de Contexto</h3>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload}>Cargar Archivo</button>
      </div>

      <div>
        <h3>Documentos de Contexto Actuales</h3>
        <ul>
          {contextFiles.map((file) => (
            <li key={file}>
              {file} <button onClick={() => handleDeleteFile(file)}>Eliminar</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminPanel;

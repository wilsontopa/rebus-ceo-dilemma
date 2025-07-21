import React, { useState, useEffect } from 'react';

const AdminPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
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
        setLoggedIn(true);
        // Limpiar credenciales después del login exitoso
        setPassword('');
      } else {
        const errorText = await response.text();
        setMessage(`Error de inicio de sesión: ${errorText}`);
        setLoggedIn(false);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      console.error('Error de login:', error);
      setLoggedIn(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage('Por favor, selecciona un archivo para cargar.');
      return;
    }

    const formData = new FormData();
    formData.append('contextFile', file);
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch('/admin/upload-context', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage(`Archivo ${file.name} cargado con éxito.`);
        setFile(null);
        handleListFiles(); // Actualizar la lista de archivos después de la carga
      } else {
        const errorText = await response.text();
        setMessage(`Error al cargar el archivo: ${errorText}`);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      console.error('Error al cargar el archivo:', error);
    }
  };

  const handleListFiles = async () => {
    try {
      const response = await fetch('/admin/list-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON_stringify({ username, password }),
      });

      if (response.ok) {
        const files = await response.json();
        setContextFiles(files);
        setMessage('Archivos listados con éxito.');
      } else {
        const errorText = await response.text();
        setMessage(`Error al listar archivos: ${errorText}`);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      console.error('Error al listar archivos:', error);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await fetch('/admin/delete-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, filename }),
      });

      if (response.ok) {
        setMessage(`Archivo ${filename} eliminado con éxito.`);
        handleListFiles(); // Actualizar la lista de archivos después de la eliminación
      } else {
        const errorText = await response.text();
        setMessage(`Error al eliminar el archivo: ${errorText}`);
      }
    } catch (error) {
      setMessage('Error de conexión al servidor.');
      console.error('Error al eliminar el archivo:', error);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      handleListFiles(); // Listar archivos automáticamente al iniciar sesión
    }
  }, [loggedIn]);

  return (
    <div>
      <h1>Panel de Administración</h1>
      {!loggedIn ? (
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
      ) : (
        <div>
          <p>Bienvenido, {username}.</p>
          <h2>Cargar Documento de Contexto</h2>
          <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          <button onClick={handleFileUpload}>Cargar Archivo</button>

          <h2>Documentos de Contexto Actuales</h2>
          <button onClick={handleListFiles}>Actualizar Lista</button>
          <ul>
            {contextFiles.length > 0 ? (
              contextFiles.map((filename) => (
                <li key={filename}>
                  {filename} <button onClick={() => handleDeleteFile(filename)}>Eliminar</button>
                </li>
              ))
            ) : (
              <p>No hay documentos de contexto cargados.</p>
            )}
          </ul>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminPanel;

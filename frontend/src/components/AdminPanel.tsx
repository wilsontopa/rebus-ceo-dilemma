import React, { useState, useEffect, useCallback } from 'react';

// Estilos CSS en JS para un diseño más limpio
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' },
  loginContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' },
  input: { padding: '0.5rem', fontSize: '1rem' },
  button: { padding: '0.7rem', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' },
  logoutButton: { position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#dc3545' },
  tabs: { display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '1rem' },
  tab: { padding: '1rem', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1rem', color: '#333' },
  activeTab: { borderBottom: '3px solid #007bff' },
  section: { marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '5px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { borderBottom: '2px solid #ddd', padding: '0.8rem', textAlign: 'left', backgroundColor: '#f7f7f7' },
  td: { borderBottom: '1px solid #ddd', padding: '0.8rem' },
  ul: { listStyle: 'none', padding: 0 },
  li: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee' },
  textarea: { width: '100%', minHeight: '300px', padding: '0.5rem', fontSize: '1rem', marginTop: '1rem' },
  message: { marginTop: '1rem', padding: '1rem', borderRadius: '5px', color: 'white' },
  successMessage: { backgroundColor: '#28a745' },
  errorMessage: { backgroundColor: '#dc3545' },
};

// Definición del tipo para los Leads
interface Lead {
  timestamp: string;
  name: string;
  email: string;
  company: string;
}

// Definición del tipo para los textos legales
type LegalDoc = 'privacy_policy.txt' | 'terms_of_service.txt' | 'disclaimer.txt';

const AdminPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('leads');
  
  // Estados para las diferentes secciones
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contextFiles, setContextFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>('privacy_policy.txt');
  const [legalContent, setLegalContent] = useState('');

  const [message, setMessage] = useState({ text: '', type: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        showMessage('Autenticación exitosa.', 'success');
      } else {
        showMessage('Error: Credenciales inválidas.', 'error');
        setIsAuthenticated(false);
      }
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    showMessage('Sesión cerrada.', 'success');
  };

  // --- Funciones para Leads ---
  const fetchNewLeads = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/get-new-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        showMessage('Error al cargar los leads.', 'error');
      }
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  }, [username, password]);

  const handleExportAndArchive = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/export-and-archive-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_exportados.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        showMessage('Leads exportados y archivados con éxito.', 'success');
        fetchNewLeads(); // Recargar la lista, que ahora debería estar vacía
      } else {
        const errorText = await response.text();
        showMessage(`Error: ${errorText}`, 'error');
      }
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  };

  // --- Funciones para Documentos de Contexto ---
  const fetchContextFiles = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/list-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) setContextFiles(await response.json());
      else showMessage('Error al listar los archivos de contexto.', 'error');
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  }, [username, password]);

  const handleFileUpload = async () => {
    if (!selectedFile) return showMessage('Por favor, selecciona un archivo.', 'error');
    const formData = new FormData();
    formData.append('contextFile', selectedFile);
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_URL}/admin/upload-context`, {
        method: 'POST',
        body: formData,
      });
      const resultMessage = await response.text();
      showMessage(resultMessage, response.ok ? 'success' : 'error');
      if (response.ok) fetchContextFiles();
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/delete-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, filename }),
      });
      const resultMessage = await response.text();
      showMessage(resultMessage, response.ok ? 'success' : 'error');
      if (response.ok) fetchContextFiles();
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  };

  // --- Funciones para Textos Legales ---
  const fetchLegalText = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/get-legal-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, filename: legalDoc }),
      });
      if (response.ok) {
        const data = await response.json();
        setLegalContent(data.content);
      } else {
        showMessage('Error al cargar el texto legal.', 'error');
      }
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  }, [username, password, legalDoc]);

  const handleUpdateLegalText = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/update-legal-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, filename: legalDoc, content: legalContent }),
      });
      const resultMessage = await response.text();
      showMessage(resultMessage, response.ok ? 'success' : 'error');
    } catch (error) {
      showMessage('Error de conexión al servidor.', 'error');
    }
  };

  // Cargar datos iniciales al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      fetchNewLeads();
      fetchContextFiles();
      fetchLegalText();
    }
  }, [isAuthenticated, fetchNewLeads, fetchContextFiles, fetchLegalText]);

  // Recargar texto legal cuando se cambia el documento seleccionado
  useEffect(() => {
    if (isAuthenticated) {
      fetchLegalText();
    }
  }, [legalDoc, isAuthenticated, fetchLegalText]);

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginContainer}>
          <h2>Acceso de Administrador</h2>
          <form onSubmit={handleLogin} style={styles.form}>
            <input style={styles.input} type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button style={styles.button} type="submit">Iniciar Sesión</button>
          </form>
          {message.text && <p style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>{message.text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Panel de Administración</h2>
      <button onClick={handleLogout} style={{...styles.button, ...styles.logoutButton}}>Cerrar Sesión</button>
      {message.text && <p style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>{message.text}</p>}

      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('leads')} style={{ ...styles.tab, ...(activeTab === 'leads' && styles.activeTab) }}>Gestión de Leads</button>
        <button onClick={() => setActiveTab('context')} style={{ ...styles.tab, ...(activeTab === 'context' && styles.activeTab) }}>Documentos de Contexto</button>
        <button onClick={() => setActiveTab('legal')} style={{ ...styles.tab, ...(activeTab === 'legal' && styles.activeTab) }}>Textos Legales</button>
      </div>

      {activeTab === 'leads' && (
        <div style={styles.section}>
          <h3>Nuevos Leads</h3>
          <button onClick={handleExportAndArchive} style={styles.button} disabled={leads.length === 0}>Exportar y Archivar Leads</button>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Empresa</th>
              </tr>
            </thead>
            <tbody>
              {leads.length > 0 ? (
                leads.map((lead, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{new Date(lead.timestamp).toLocaleString()}</td>
                    <td style={styles.td}>{lead.name}</td>
                    <td style={styles.td}>{lead.email}</td>
                    <td style={styles.td}>{lead.company}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ ...styles.td, textAlign: 'center' }}>No hay nuevos leads.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'context' && (
        <div style={styles.section}>
          <h3>Cargar Nuevo Documento de Contexto</h3>
          <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} style={{ marginRight: '1rem' }} />
          <button onClick={handleFileUpload} style={styles.button}>Cargar Archivo</button>
          <h3 style={{ marginTop: '2rem' }}>Documentos Actuales</h3>
          <ul style={styles.ul}>
            {contextFiles.length > 0 ? (
              contextFiles.map((file) => (
                <li key={file} style={styles.li}>
                  <span>{file}</span>
                  <button onClick={() => handleDeleteFile(file)} style={{ ...styles.button, backgroundColor: '#c82333' }}>Eliminar</button>
                </li>
              ))
            ) : (
              <p>No hay documentos de contexto cargados.</p>
            )}
          </ul>
        </div>
      )}

      {activeTab === 'legal' && (
        <div style={styles.section}>
          <h3>Editor de Textos Legales</h3>
          <select value={legalDoc} onChange={(e) => setLegalDoc(e.target.value as LegalDoc)} style={{ ...styles.input, marginBottom: '1rem' }}>
            <option value="privacy_policy.txt">Política de Privacidad</option>
            <option value="terms_of_service.txt">Términos de Servicio</option>
            <option value="disclaimer.txt">Descargo de Responsabilidad</option>
          </select>
          <textarea style={styles.textarea} value={legalContent} onChange={(e) => setLegalContent(e.target.value)} />
          <button onClick={handleUpdateLegalText} style={{ ...styles.button, marginTop: '1rem' }}>Guardar Cambios</button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

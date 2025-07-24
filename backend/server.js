const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const cors = require('cors');
const { generateContent } = require('./utils/geminiApi');
require('dotenv').config({ path: '.env.admin' });

const app = express();
const port = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const CONTEXT_DOCS_PATH = path.join(__dirname, 'context_documents');
const LEGAL_TEXTS_PATH = path.join(__dirname, 'legal_texts');
const LEAD_FILE_PATH = path.join(__dirname, 'leads.txt');

const gameSessions = {};

// --- Caching for Combined Context ---
let cachedContext = null; // Variable para almacenar el contexto combinado en caché

// --- Funciones de Utilidad ---
const getCombinedContext = async () => {
  if (cachedContext) {
    console.log('Contexto combinado recuperado de la caché.');
    return cachedContext;
  }

  const allowedExtensions = ['.txt', '.md', '.csv'];
  try {
    const files = await fsp.readdir(CONTEXT_DOCS_PATH);
    let combinedContext = '';
    for (const file of files) {
      const fileExtension = path.extname(file).toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        try {
          const content = await fsp.readFile(path.join(CONTEXT_DOCS_PATH, file), 'utf8');
          combinedContext += `--- Contexto de ${file} ---\n${content}\n\n`;
        } catch (readError) {
          console.error(`Error al leer el archivo de texto ${file}:`, readError);
        }
      } else {
        console.log(`Archivo omitido (no es un archivo de texto plano admitido): ${file}`);
      }
    }
    cachedContext = combinedContext; // Almacenar en caché
    console.log('Contexto combinado generado y almacenado en caché.');
    return combinedContext;
  } catch (error) {
    console.error('Error al leer el directorio de documentos de contexto:', error);
    return ''; // Devolver vacío si hay un error
  }
};

// --- Inicialización ---
const initializeApp = async () => {
  for (const dir of [CONTEXT_DOCS_PATH, LEGAL_TEXTS_PATH]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  }
  try {
    await fsp.access(LEAD_FILE_PATH);
  } catch (error) {
    await fsp.writeFile(LEAD_FILE_PATH, 'timestamp,name,email,company,consent,status\n');
  }
};
initializeApp();

// --- Middlewares ---
app.use(cors({ origin: ['https://rebus-el-dilema-del-ceo.netlify.app', 'http://localhost:3001'] }));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CONTEXT_DOCS_PATH),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage: storage });

// --- Rutas Públicas ---
app.get('/', (req, res) => res.send('Backend de El Dilema del CEO funcionando!'));

app.post('/api/start-game', async (req, res) => {
  console.log('DEBUG: Solicitud recibida en /api/start-game');
  res.json({ sessionId: 'test-session-id', type: 'dilemma', dilemma: { dilemmaText: 'Dilema de prueba', options: ['Opción A', 'Opción B'] } });
});

app.post('/api/make-decision', async (req, res) => {
  const { sessionId, decision } = req.body;
  if (!gameSessions[sessionId]) return res.status(404).json({ message: 'Sesión de juego no encontrada.' });

  const { turn, name, company } = gameSessions[sessionId];
  const MAX_TURNS = 3;
  const userMessage = `El usuario ha elegido la opción: "${decision}".`;
  gameSessions[sessionId].history.push({ role: 'user', parts: [{ text: userMessage }] });

  const context = await getCombinedContext();
  let modelPrompt = '';

  if (turn >= MAX_TURNS) {
    const currentDate = new Date().toISOString().split('T')[0];
    modelPrompt = `${context}Basado en la decisión anterior y todo el historial, la partida ha terminado. Genera el "Informe de Futuro Estratégico" final para ${name} de ${company}. La respuesta DEBE ser un objeto JSON con una única propiedad: "report", que a su vez contiene: "title", "date" (usar ${currentDate}), "ceo" (usar ${name}), "summary", "analysis" (array de objetos), y "recommendations" (array de strings).`;
  } else {
    modelPrompt = `${context}Basado en la decisión anterior, presenta el siguiente dilema estratégico. La respuesta DEBE ser un objeto JSON con 'dilemmaText' y 'options'.`;
  }

  try {
    const rawResponse = await generateContent(modelPrompt, gameSessions[sessionId].history);
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error('La respuesta de la IA no contiene un JSON válido.');

    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsedResponse = JSON.parse(jsonString);

    gameSessions[sessionId].history.push({ role: 'model', parts: [{ text: JSON.stringify(parsedResponse) }] });
    gameSessions[sessionId].turn++;

    if (turn >= MAX_TURNS) {
        res.json({ type: 'report', report: parsedResponse.report });
    } else {
        res.json({ type: 'dilemma', dilemma: parsedResponse });
    }
  } catch (error) {
    console.error('Error al tomar la decisión con IA:', error);
    res.status(500).json({ message: 'Error al tomar la decisión. Por favor, inténtalo de nuevo.' });
  }
});

app.post('/api/capture-lead', async (req, res) => {
  const { name, email, company, consent } = req.body;
  if (!name || !email || !company || !consent) {
    return res.status(400).send('Faltan datos o el consentimiento no fue otorgado.');
  }
  const timestamp = new Date().toISOString();
  const leadData = `${timestamp},"${name}","${email}","${company}",${consent},nuevo\n`;
  try {
    await fsp.appendFile(LEAD_FILE_PATH, leadData);
    res.send('Lead capturado con éxito.');
  } catch (err) {
    res.status(500).send('Error al guardar el lead.');
  }
});

app.get('/api/legal/:filename', async (req, res) => {
    const { filename } = req.params;
    if (!['privacy_policy.txt', 'terms_of_service.txt', 'disclaimer.txt'].includes(filename)) {
        return res.status(400).send('Nombre de archivo inválido.');
    }
    const filePath = path.join(LEGAL_TEXTS_PATH, filename);
    try {
        const content = await fsp.readFile(filePath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.json({ content: 'Contenido no disponible.' });
    }
});

// --- Rutas de Administración ---
const adminAuth = (req, res, next) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).send('Credenciales inválidas.');
  }
  next();
};

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.status(200).send('Autenticación exitosa.');
  } else {
    res.status(401).send('Credenciales inválidas.');
  }
});

app.post('/admin/upload-context', adminAuth, upload.single('contextFile'), (req, res) => {
  if (!req.file) return res.status(400).send('No se ha subido ningún archivo.');
  cachedContext = null; // Invalidar la caché al subir un nuevo archivo
  res.send(`Archivo ${req.file.originalname} cargado con éxito.`);
});

app.post('/admin/list-context', adminAuth, async (req, res) => {
  try {
    res.json(await fsp.readdir(CONTEXT_DOCS_PATH));
  } catch (err) {
    res.status(500).send('Error al listar documentos.');
  }
});

app.post('/admin/delete-context', adminAuth, async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).send('Nombre de archivo no proporcionado.');
  const filePath = path.join(CONTEXT_DOCS_PATH, filename);
  if (!filePath.startsWith(CONTEXT_DOCS_PATH)) return res.status(403).send('Acceso denegado.');
  try {
    await fsp.unlink(filePath);
    cachedContext = null; // Invalidar la caché al eliminar un archivo
    res.send(`Archivo ${filename} eliminado con éxito.`);
  } catch (err) {
    res.status(500).send(`Error al eliminar el archivo.`);
  }
});

app.post('/admin/get-new-leads', adminAuth, async (req, res) => {
    try {
        const data = await fsp.readFile(LEAD_FILE_PATH, 'utf8');
        const lines = data.trim().split('\n').slice(1);
        const newLeads = lines.map(line => {
            const [timestamp, name, email, company, consent, status] = line.split(',');
            return { timestamp, name, email, company, consent, status };
        }).filter(lead => lead.status === 'nuevo');
        res.json(newLeads);
    } catch (error) {
        res.status(500).send('Error al obtener los leads.');
    }
});

app.post('/admin/export-and-archive-leads', adminAuth, async (req, res) => {
    try {
        const data = await fsp.readFile(LEAD_FILE_PATH, 'utf8');
        const lines = data.trim().split('\n');
        const header = lines[0];
        const leads = lines.slice(1);
        const newLeadsToExport = leads.filter(line => line.split(',')[5] === 'nuevo');

        if (newLeadsToExport.length === 0) {
            return res.status(404).send('No hay nuevos leads para exportar.');
        }

        const remainingLeads = leads.map(line => {
            let columns = line.split(',');
            if (columns[5] === 'nuevo') columns[5] = 'archivado';
            return columns.join(',');
        });

        await fsp.writeFile(LEAD_FILE_PATH, [header, ...remainingLeads].join('\n') + '\n', 'utf8');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leads_exportados.csv"');
        res.send([header, ...newLeadsToExport].join('\n'));
    } catch (error) {
        res.status(500).send('Error al exportar los leads.');
    }
});

app.post('/admin/get-legal-text', adminAuth, async (req, res) => {
    const { filename } = req.body;
    const filePath = path.join(LEGAL_TEXTS_PATH, filename);
    try {
        res.json({ content: await fsp.readFile(filePath, 'utf8') });
    } catch (error) {
        res.json({ content: '' });
    }
});

app.post('/admin/update-legal-text', adminAuth, async (req, res) => {
    const { filename, content } = req.body;
    const filePath = path.join(LEGAL_TEXTS_PATH, filename);
    try {
        await fsp.writeFile(filePath, content, 'utf8');
        res.send('Archivo actualizado con éxito.');
    } catch (error) {
        res.status(500).send('Error al guardar el archivo.');
    }
});

// --- Iniciar Servidor ---
app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
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
const CONTEXT_SUMMARIES_PATH = path.join(__dirname, 'context_summaries');
const LEGAL_TEXTS_PATH = path.join(__dirname, 'legal_texts');
const LEAD_FILE_PATH = path.join(__dirname, 'leads.txt');

const gameSessions = {};

// --- Funciones de Utilidad ---

// Función para extraer texto de diferentes tipos de archivo
const extractTextFromFile = async (filePath) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  if (['.txt', '.md', '.csv'].includes(fileExtension)) {
    return await fsp.readFile(filePath, 'utf8');
  } else if (['.pdf', '.xlsx'].includes(fileExtension)) {
    throw new Error(`Extracción de texto no soportada para archivos ${fileExtension}. Por favor, sube archivos .txt, .md o .csv.`);
  } else {
    throw new Error(`Tipo de archivo no soportado para extracción de texto: ${fileExtension}. Por favor, sube archivos .txt, .md o .csv.`);
  }
};

// Función para resumir texto usando la IA de Gemini
const summarizeTextWithAI = async (text) => {
  const prompt = `Por favor, resume el siguiente texto de manera concisa y relevante para un contexto de dilemas estratégicos empresariales. Enfócate en los puntos clave, estrategias, desafíos y oportunidades. El resumen debe ser de aproximadamente 100-200 palabras.\n\nTexto a resumir:\n"""\n${text}\n"""\n\nResumen:`;
  try {
    const rawResponse = await generateContent(prompt);
    return rawResponse.trim();
  } catch (error) {
    console.error('Error al resumir texto con IA:', error);
    return `Error al generar resumen para el texto.`;
  }
};

const getCombinedContext = async () => {
  try {
    const files = await fsp.readdir(CONTEXT_SUMMARIES_PATH);
    let combinedContext = '';
    for (const file of files) {
      try {
        const content = await fsp.readFile(path.join(CONTEXT_SUMMARIES_PATH, file), 'utf8');
        combinedContext += `--- Resumen de ${file.replace('.summary', '')} ---\n${content}\n\n`;
      } catch (readError) {
        console.error(`Error al leer el archivo de resumen ${file}:`, readError);
      }
    }
    return combinedContext;
  } catch (error) {
    console.error('Error al leer el directorio de resúmenes de contexto:', error);
    return ''; // Devolver vacío si hay un error
  }
};

// --- Inicialización ---
const initializeApp = async () => {
  for (const dir of [CONTEXT_DOCS_PATH, LEGAL_TEXTS_PATH, CONTEXT_SUMMARIES_PATH]) {
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
app.use(cors());
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
  const { name, company, sector } = req.body;
  const sessionId = Date.now().toString();
  gameSessions[sessionId] = { history: [], turn: 0, name, company, sector };

  const context = await getCombinedContext();
  const initialPromptText = `Eres el Director del Juego de una simulación estratégica llamada "El Dilema del CEO".\n${context}El usuario ${name}, CEO de ${company} en el sector de ${sector}, ha iniciado la simulación. Presenta el primer dilema estratégico. Tu respuesta DEBE ser un objeto JSON con EXACTAMENTE dos propiedades: 'dilemmaText' (string) y 'options' (array de strings).`;

  try {
    const rawResponse = await generateContent(initialPromptText);
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error('La respuesta de la IA no contiene un JSON válido.');
    
    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsedResponse = JSON.parse(jsonString);

    gameSessions[sessionId].history.push({ role: 'user', parts: [{ text: initialPromptText }] });
    gameSessions[sessionId].history.push({ role: 'model', parts: [{ text: JSON.stringify(parsedResponse) }] });
    gameSessions[sessionId].turn++;

    res.json({ sessionId, type: 'dilemma', dilemma: parsedResponse });
  } catch (error) {
    console.error('Error al iniciar el juego con IA:', error);
    res.status(500).json({ message: 'Error al iniciar el juego. Por favor, inténtalo de nuevo.' });
  }
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

app.post('/admin/upload-context', adminAuth, upload.single('contextFile'), async (req, res) => {
  if (!req.file) return res.status(400).send('No se ha subido ningún archivo.');

  const originalFilePath = req.file.path; // Usar la ruta temporal de Multer
  const summaryFileName = `${req.file.originalname}.summary`;
  const summaryFilePath = path.join(CONTEXT_SUMMARIES_PATH, summaryFileName);

  try {
    // Extraer texto del archivo original
    const extractedText = await extractTextFromFile(originalFilePath);
    
    // Generar resumen con IA
    const summary = await summarizeTextWithAI(extractedText);

    // Guardar el resumen
    await fsp.writeFile(summaryFilePath, summary, 'utf8');

    // Mover el archivo original a su destino final
    await fsp.rename(originalFilePath, path.join(CONTEXT_DOCS_PATH, req.file.originalname));

    res.send(`Archivo ${req.file.originalname} cargado y resumido con éxito.`);
  } catch (error) {
    console.error('Error al procesar el archivo de contexto:', error);
    // Si hay un error, intentar limpiar el archivo temporal de Multer
    if (fs.existsSync(originalFilePath)) {
      await fsp.unlink(originalFilePath).catch(e => console.error('Error al eliminar archivo temporal:', e));
    }
    res.status(500).send(`Error al procesar el archivo ${req.file.originalname}: ${error.message}`);
  }
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
  const originalFilePath = path.join(CONTEXT_DOCS_PATH, filename);
  const summaryFilePath = path.join(CONTEXT_SUMMARIES_PATH, `${filename}.summary`);

  try {
    // Eliminar el archivo original
    if (fs.existsSync(originalFilePath)) {
      await fsp.unlink(originalFilePath);
    }
    // Eliminar el archivo de resumen si existe
    if (fs.existsSync(summaryFilePath)) {
      await fsp.unlink(summaryFilePath);
    }
    res.send(`Archivo ${filename} y su resumen eliminados con éxito.`);
  } catch (err) {
    console.error('Error al eliminar el archivo de contexto o su resumen:', err);
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

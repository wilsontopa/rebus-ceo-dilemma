const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Importar cors
const { generateContent } = require('./utils/geminiApi'); // Importar generateContent
require('dotenv').config({ path: '.env.admin' });

const app = express();
const port = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const CONTEXT_DOCS_PATH = path.join(__dirname, 'context_documents');

// Almacenamiento temporal de sesiones de juego (en memoria)
const gameSessions = {}; // { sessionId: { history: [], turn: 0, name: '', company: '', sector: '' } }

// Asegurarse de que la carpeta de documentos de contexto exista
if (!fs.existsSync(CONTEXT_DOCS_PATH)) {
  fs.mkdirSync(CONTEXT_DOCS_PATH);
}

// Configuración de Multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CONTEXT_DOCS_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

app.use(cors()); // Usar cors
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log('Request body:', req.body);
  next();
});



app.get('/', (req, res) => {
  res.send('Backend de El Dilema del CEO funcionando!');
});

app.post('/admin/login', (req, res) => {
  console.log('Login attempt body:', req.body); // Depuración
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.status(200).send('Autenticación exitosa.');
  } else {
    res.status(401).send('Credenciales inválidas.');
  }
});

app.post('/admin/upload-context', upload.single('contextFile'), (req, res) => {
  console.log('Upload attempt body:', req.body); // Depuración
  const { username, password } = req.body; // Multer ya ha parseado el body
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).send('Credenciales de administrador inválidas.');
  }
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }
  res.send(`Archivo ${req.file.originalname} cargado con éxito.`);
});

// Ruta para listar documentos de contexto
app.post('/admin/list-context', (req, res) => {
  console.log('List attempt body:', req.body); // Depuración
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).send('Credenciales de administrador inválidas.');
  }
  fs.readdir(CONTEXT_DOCS_PATH, (err, files) => {
    if (err) {
      return res.status(500).send('Error al listar documentos.');
    }
    res.json(files);
  });
});

// Ruta para eliminar documentos de contexto
app.post('/admin/delete-context', (req, res) => {
  console.log('Delete attempt body:', req.body); // Depuración
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).send('Credenciales de administrador inválidas.');
  }
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).send('Nombre de archivo no proporcionado.');
  }

  const filePath = path.join(CONTEXT_DOCS_PATH, filename);

  // Medida de seguridad contra Path Traversal
  if (!filePath.startsWith(CONTEXT_DOCS_PATH)) {
      return res.status(403).send('Acceso denegado: intento de acceso fuera del directorio permitido.');
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send(`Error al eliminar el archivo ${filename}.`);
    }
    res.send(`Archivo ${filename} eliminado con éxito.`);
  });
});

app.post('/api/start-game', async (req, res) => {
  console.log('Start game attempt body:', req.body); // Depuración
  const { name, company, sector } = req.body;
  const sessionId = Date.now().toString(); // Generar un ID de sesión simple
  gameSessions[sessionId] = { history: [], turn: 0, name, company, sector };

  const initialPromptText = `Eres el Director del Juego de una simulación estratégica llamada "El Dilema del CEO". El usuario ${name}, CEO de ${company} en el sector de ${sector}, ha iniciado la simulación. Presenta el primer dilema estratégico. Tu respuesta DEBE ser un objeto JSON con EXACTAMENTE dos propiedades: 'dilemmaText' (string, que contiene la descripción completa del dilema) y 'options' (array de strings, que contiene las opciones de respuesta, sin prefijos como A, B, C o 1, 2, 3). Ejemplo: { "dilemmaText": "Nuestra empresa enfrenta un dilema crucial...", "options": ["Opción de respuesta 1", "Opción de respuesta 2"] }.`;
  
  try {
    const rawResponse = await generateContent(initialPromptText);
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error('La respuesta de la IA no contiene un JSON válido.');
    }
    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsedResponse = JSON.parse(jsonString);
    console.log('Parsed AI Response (start-game):', parsedResponse); // Depuración: Ver qué devuelve la IA

    gameSessions[sessionId].history.push({ role: 'user', parts: [{ text: initialPromptText }] });
    gameSessions[sessionId].history.push({ role: 'model', parts: [{ text: JSON.stringify(parsedResponse) }] });
    gameSessions[sessionId].turn++;

    res.json({ sessionId, type: 'dilemma', dilemma: parsedResponse });
  } catch (error) {
    console.error('Error al iniciar el juego con IA:', error.message);
    res.status(500).send('Error al iniciar el juego. Por favor, inténtalo de nuevo.');
  }
});

app.post('/api/make-decision', async (req, res) => {
  console.log('Make decision attempt body:', req.body); // Depuración
  const { sessionId, decision } = req.body;

  if (!gameSessions[sessionId]) {
    return res.status(400).send('Sesión de juego no encontrada.');
  }

  const { history, turn, name, company, sector } = gameSessions[sessionId];
  const MAX_TURNS = 3; // Definir el número máximo de dilemas

  const userMessage = `El usuario ha elegido la opción: "${decision}".`;

  // Añadir el mensaje del usuario al historial para que la IA lo tenga en cuenta
  gameSessions[sessionId].history.push({ role: 'user', parts: [{ text: userMessage }] });

  let modelPrompt = '';

  if (turn >= MAX_TURNS) {
    const currentDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    // El historial ya contiene la última decisión, ahora pedimos el informe final.
    modelPrompt = `Basado en la decisión anterior y todo el historial de la simulación, la partida ha terminado. Genera el "Informe de Futuro Estratégico" final para ${name} de ${company}.
La respuesta DEBE ser un objeto JSON con una única propiedad: "report".
El valor de "report" DEBE ser otro objeto JSON con la siguiente estructura EXACTA:
- "title": Un título para el informe (string).
- "date": La fecha del informe, que debe ser "${currentDate}" (string).
- "ceo": El nombre del CEO, que es "${name}" (string).
- "summary": Un párrafo de resumen ejecutivo (string).
- "analysis": Un array de objetos. Cada objeto debe representar el análisis de una decisión clave y sus implicaciones (array of objects).
- "recommendations": Un array de strings, donde cada string es una recomendación estratégica concreta (array of strings).

Analiza las decisiones tomadas y sus implicaciones en rentabilidad, cuota de mercado, cultura organizacional, reputación y resiliencia dentro de la sección 'analysis'.`;
  } else {
    // El historial ya contiene la última decisión, ahora pedimos el siguiente dilema.
    modelPrompt = `Basado en la decisión anterior, presenta el siguiente dilema estratégico. La respuesta DEBE ser un objeto JSON con EXACTAMENTE dos propiedades: 'dilemmaText' (string con la descripción del nuevo dilema) y 'options' (array de strings con las nuevas opciones, sin prefijos).`;
  }

  // Añadir el mensaje del usuario al historial
  gameSessions[sessionId].history.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const rawResponse = await generateContent(modelPrompt, gameSessions[sessionId].history);
    const jsonStartIndex = rawResponse.indexOf('{');
    const jsonEndIndex = rawResponse.lastIndexOf('}');
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error('La respuesta de la IA no contiene un JSON válido.');
    }
    const jsonString = rawResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsedResponse = JSON.parse(jsonString);
    console.log('Parsed AI Response (make-decision):', parsedResponse); // Depuración: Ver qué devuelve la IA

    // Añadir la respuesta del modelo al historial
    gameSessions[sessionId].history.push({ role: 'model', parts: [{ text: JSON.stringify(parsedResponse) }] });
    gameSessions[sessionId].turn++;

    if (turn >= MAX_TURNS) {
      const reportData = parsedResponse.report;
      let formattedReport = '';

      // Si la IA devuelve un objeto, lo formateamos a Markdown.
      if (typeof reportData === 'object' && reportData !== null) {
        const buildMarkdownReport = (data) => {
          let md = '';
          if (data.title) md += `## ${data.title}\n\n`;
          if (data.date) md += `**Fecha:** ${data.date}\n`;
          if (data.ceo) md += `**CEO:** ${data.ceo}\n\n`;
          if (data.summary) md += `### Resumen Ejecutivo\n${data.summary}\n\n`;
          
          if (data.analysis && Array.isArray(data.analysis)) {
            md += `### Análisis de Decisiones\n`;
            data.analysis.forEach(item => {
              for (const [key, value] of Object.entries(item)) {
                // Si el valor es un objeto (como en 'implicaciones'), lo recorremos también.
                if (typeof value === 'object' && value !== null) {
                  md += `* **${key.charAt(0).toUpperCase() + key.slice(1)}:**\n`;
                  for (const [subKey, subValue] of Object.entries(value)) {
                    md += `  * *${subKey.charAt(0).toUpperCase() + subKey.slice(1)}:* ${subValue}\n`;
                  }
                } else {
                  md += `* **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}\n`;
                }
              }
              md += `\n`;
            });
          }
          
          if (data.recommendations && Array.isArray(data.recommendations)) {
            md += `### Recomendaciones\n`;
            data.recommendations.forEach(rec => {
              md += `* ${rec}\n`;
            });
            md += `\n`;
          }
          return md;
        };
        formattedReport = buildMarkdownReport(reportData);
      } else {
        // Si no es un objeto, lo convierte a string para mostrarlo (plan B).
        formattedReport = reportData ? reportData.toString() : 'No se pudo generar el informe.';
      }

      res.json({ type: 'report', report: formattedReport });
    } else {
      res.json({ type: 'dilemma', dilemma: parsedResponse });
    }
  } catch (error) {
    console.error('Error al tomar la decisión con IA:', error.message);
    res.status(500).send('Error al tomar la decisión. Por favor, inténtalo de nuevo.');
  }
});

app.post('/api/capture-lead', (req, res) => {
  console.log('Capture lead attempt body:', req.body); // Depuración
  const { name, email, company, consent } = req.body;

  if (!name || !email || !company || !consent) {
    return res.status(400).send('Faltan datos o el consentimiento no fue otorgado.');
  }

  const leadData = `Nombre: ${name}, Email: ${email}, Empresa: ${company}, Consentimiento: ${consent}\n`;
  fs.appendFile('leads.txt', leadData, (err) => {
    if (err) {
      console.error('Error al guardar el lead:', err);
      return res.status(500).send('Error al guardar el lead.');
    }
    res.send('Lead capturado con éxito.');
  });
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});

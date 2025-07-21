const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.admin' });

const app = express();
const port = process.env.PORT || 3001;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const CONTEXT_DOCS_PATH = path.join(__dirname, 'context_documents');

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

app.use(express.json());

// Middleware de autenticación básica para rutas de administración
const authenticateAdmin = (req, res, next) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).send('Credenciales de administrador inválidas.');
  }
};

app.get('/', (req, res) => {
  res.send('Backend de El Dilema del CEO funcionando!');
});

// Ruta para cargar documentos de contexto
app.post('/admin/upload-context', authenticateAdmin, upload.single('contextFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }
  res.send(`Archivo ${req.file.originalname} cargado con éxito.`);
});

// Ruta para listar documentos de contexto
app.post('/admin/list-context', authenticateAdmin, (req, res) => {
  fs.readdir(CONTEXT_DOCS_PATH, (err, files) => {
    if (err) {
      return res.status(500).send('Error al listar documentos.');
    }
    res.json(files);
  });
});

// Ruta para eliminar documentos de contexto
app.post('/admin/delete-context', authenticateAdmin, (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).send('Nombre de archivo no proporcionado.');
  }
  const filePath = path.join(CONTEXT_DOCS_PATH, filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send(`Error al eliminar el archivo ${filename}.`);
    }
    res.send(`Archivo ${filename} eliminado con éxito.`);
  });
});

app.post('/api/start-game', async (req, res) => {
  const { name, company, sector } = req.body;
  // Aquí se podría inicializar la sesión del juego para el usuario
  // Por ahora, simplemente generamos el primer dilema
  const initialPrompt = `Eres el Director del Juego. El usuario ${name}, CEO de ${company} en el sector de ${sector}, ha iniciado la simulación. Presenta el primer dilema estratégico.`;
  try {
    const dilemma = await generateContent(initialPrompt);
    res.json({ type: 'dilemma', dilemma: { text: dilemma, options: ['Opción 1', 'Opción 2', 'Opción 3'] } });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/api/make-decision', async (req, res) => {
  const { decision } = req.body;
  // Aquí se procesaría la decisión y se generaría el siguiente dilema o el informe final
  const nextPrompt = `El usuario ha elegido: ${decision}. Ahora, presenta el siguiente dilema o el informe final si la simulación ha terminado.`;
  try {
    const response = await generateContent(nextPrompt);
    // Lógica para determinar si es un dilema o un informe
    if (Math.random() > 0.7) { // Simulación: 30% de probabilidad de que sea el informe final
      res.json({ type: 'report', report: response });
    } else {
      res.json({ type: 'dilemma', dilemma: { text: response, options: ['Opción A', 'Opción B', 'Opción C'] } });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/api/capture-lead', (req, res) => {
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

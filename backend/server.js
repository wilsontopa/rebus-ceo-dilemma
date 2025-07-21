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

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONTEXT_DOCS_PATH = path.join(__dirname, '..', 'context_documents');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_TOOL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'; // Usamos la misma URL para tool calls

const tools = [
  {
    functionDeclarations: [
      {
        name: 'google_web_search',
        description: 'Performs a web search using Google Search (via the Gemini API) and returns the results. This tool is useful for finding information on the internet based on a query.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to find information on the web.',
            },
          },
          required: ['query'],
        },
      },
    ],
  },
];

function loadContextDocuments() {  let context = '';  try {    const files = fs.readdirSync(CONTEXT_DOCS_PATH);    for (const file of files) {      const filePath = path.join(CONTEXT_DOCS_PATH, file);      if (fs.statSync(filePath).isFile() && (file.endsWith('.txt') || file.endsWith('.md'))) {        context += `\n--- ${file} ---\n`;        context += fs.readFileSync(filePath, 'utf8');        context += '\n';      }    }  } catch (error) {    console.warn('No se pudieron cargar los documentos de contexto o la carpeta no existe:', error.message);  }  return context;}async function generateContent(prompt, history = []) {  const context = loadContextDocuments();  const fullPrompt = context ? `Contexto adicional:\n${context}\n\n${prompt}` : prompt;
  try {
    let requestBody = {
      contents: [...history, { parts: [{ text: prompt }] }],
      tools: tools,
    };

    let response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      requestBody
    );

    if (response.data.candidates && response.data.candidates[0].content.parts[0].functionCall) {
      const functionCall = response.data.candidates[0].content.parts[0].functionCall;
      if (functionCall.name === 'google_web_search') {
        console.log('AI solicitó una búsqueda web con la consulta:', functionCall.args.query);
        // Simular la respuesta de la búsqueda web
        const searchResult = `Web search results for "${functionCall.args.query}":\n\nExample search result: Information about ${functionCall.args.query} from a reliable source.`;

        // Enviar el resultado de la herramienta de vuelta al modelo
        requestBody.contents.push({
          role: 'model',
          parts: [{ functionCall: functionCall }],
        });
        requestBody.contents.push({
          role: 'tool',
          parts: [{ functionResponse: { name: 'google_web_search', response: { output: searchResult } } }],
        });

        response = await axios.post(
          `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
          requestBody
        );
      } else {
        throw new Error(`Función no soportada: ${functionCall.name}`);
      }
    }

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error al llamar a la API de Gemini:', error.response ? error.response.data : error.message);
    throw new Error('Error al generar contenido con la IA.');
  }
}

module.exports = { generateContent };

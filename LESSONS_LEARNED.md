# LECCIONES APRENDIDAS DEL PROYECTO "EL DILEMA DEL CEO"

Este documento resume los errores y desafíos clave encontrados durante el desarrollo del proyecto "El Dilema del CEO", junto con las soluciones implementadas y las lecciones aprendidas. El objetivo es mejorar la eficiencia y robustez en futuros proyectos.

---

## 1. Errores de Formato de Datos entre IA (Gemini) y Backend/Frontend

**Problema:**
La IA (Gemini) no siempre devolvía los datos en el formato exacto esperado por el backend o el frontend, o cambiaba la estructura de la respuesta en diferentes interacciones. Esto causaba errores de `JSON.parse` o `TypeError: marked(): input parameter is of type [object Object], string expected`.

**Diagnóstico:**
- Inicialmente, la IA no incluía el historial completo en el prompt, lo que llevaba a respuestas inconsistentes.
- Posteriormente, la IA devolvía el informe final como un objeto JSON anidado (`{ report: { ... } }`) en lugar de un string de Markdown, o con nombres de propiedades inconsistentes (`report` vs `reportContent`).
- El frontend esperaba Markdown, pero la IA a veces enviaba objetos.

**Solución:**
- **Backend (`server.js`):**
    - Se hizo el `modelPrompt` para la IA **extremadamente estricto y explícito** sobre la estructura JSON esperada, incluyendo todos los campos anidados (`analysis`, `recommendations`).
    - Se implementó una **capa de validación y formateo** en el backend para el informe final: si la IA devolvía un objeto, se parseaba y se construía un string de Markdown estructurado a partir de sus propiedades. Esto aseguró que el frontend siempre recibiera un string de Markdown.
- **Frontend (`Report.tsx`):**
    - Se utilizó la biblioteca `marked` para una conversión robusta de Markdown a HTML.

**Lección Aprendida:**
- **Ser explícito con la IA:** Siempre que se espere una estructura de datos específica de una IA, el prompt debe ser lo más detallado y estricto posible, incluyendo ejemplos y la estructura JSON esperada.
- **Validación y Transformación en el Backend:** El backend debe ser el "guardián" de los datos. Siempre validar y transformar los datos recibidos de servicios externos (como APIs de IA) al formato exacto que espera el frontend. No confiar ciegamente en que el servicio externo siempre devolverá lo esperado.
- **Manejo de Errores Robusto:** Implementar `try-catch` y mensajes de error claros para el usuario, pero también logs detallados en el servidor para el desarrollador.

---

## 2. Errores de Configuración de ESLint/TypeScript en Entornos de CI/CD (Netlify)

**Problema:**
El proyecto compilaba y funcionaba localmente, pero fallaba en Netlify con errores de compilación relacionados con ESLint y TypeScript (`TS2304: Cannot find name 'isLoading'`, `React Hook useEffect has a missing dependency`, `The identifier 'username' has already been declared`).

**Diagnóstico:**
- Netlify (y otros entornos de CI/CD) suelen configurar `process.env.CI = true`, lo que hace que las advertencias de ESLint se traten como errores y detengan la compilación.
- Errores de `useEffect` y `useCallback` (`react-hooks/exhaustive-deps`) son comunes cuando las dependencias de los hooks no se manejan correctamente o las funciones se recrean en cada renderizado.
- Errores de "identificador ya declarado" (`SyntaxError`) surgieron de operaciones de `replace` que no fueron atómicas y dejaron el código en un estado inconsistente (duplicando declaraciones).

**Solución:**
- **`useEffect` y `useCallback`:**
    - Se añadió `fetchContextFiles` a la lista de dependencias del `useEffect` en `AdminPanel.tsx`.
    - Se envolvió la función `fetchContextFiles` con `useCallback` y se le pasaron sus propias dependencias (`username`, `password`) para asegurar que la función solo se recree cuando sea necesario.
- **Errores de Sintaxis por `replace`:**
    - En lugar de múltiples operaciones de `replace` para cambios complejos, se optó por **reescribir el archivo completo** (`write_file`) con el contenido correcto y validado. Esto eliminó la posibilidad de dejar el archivo en un estado intermedio erróneo.

**Lección Aprendida:**
- **Entornos de CI/CD son más estrictos:** Lo que funciona localmente no siempre funciona en producción. Los entornos de CI/CD aplican reglas más estrictas (como tratar advertencias de ESLint como errores).
- **Dominar los Hooks de React:** Entender a fondo `useEffect` y `useCallback` y sus dependencias es crucial para evitar errores de rendimiento y compilación en proyectos de React.
- **Precaución con `replace` en código:** Para cambios complejos o que puedan afectar la estructura del código, es más seguro usar `write_file` con el contenido completo y correcto del archivo, en lugar de múltiples `replace` que pueden dejar el código en un estado inconsistente.

---

## 3. Gestión de Cuotas de API y Experiencia de Usuario

**Problema:**
El consumo de la cuota gratuita de la API de Gemini causaba que la aplicación dejara de funcionar, y las ideas iniciales para mitigar esto (filtrar usuarios, cerrar la app) podrían dañar la imagen de marca.

**Diagnóstico:**
- El error `503 - The model is overloaded` o "superado mi cuota gratis" es un problema externo a nuestro código, pero afecta directamente la funcionalidad.
- Las soluciones propuestas inicialmente (filtrado de usuarios, cierre forzado de la app) priorizaban la optimización de la cuota sobre la experiencia del usuario y el branding.

**Solución:**
- **Transparencia y Mensajes Claros:** Se optó por mantener la aplicación funcional y mostrar mensajes claros al usuario cuando la API no esté disponible (debido a la cuota).
- **Mejora de la Experiencia de Usuario:**
    - Se implementó un estado de `isLoading` en el frontend para deshabilitar los botones y mostrar un mensaje de "Procesando..." durante las llamadas a la API, evitando clics duplicados y mejorando la percepción de la aplicación.
    - Se añadió una opción "Iniciar Nueva Simulación" al final del juego, permitiendo al usuario reiniciar la experiencia de forma controlada y amigable, en lugar de cerrar la aplicación.
- **Recomendación Estratégica:** Se priorizó la experiencia del usuario y el branding sobre la optimización agresiva de la cuota, entendiendo que el costo de la API es una inversión en la captación de leads de alto valor.

**Lección Aprendida:**
- **Priorizar la UX y el Branding:** En herramientas de marketing, la experiencia del usuario y la imagen de marca son primordiales. Las optimizaciones de recursos no deben comprometer estos aspectos.
- **Manejo Elegante de Fallos Externos:** Cuando un servicio externo falla (como una API sobrecargada), la aplicación debe manejarlo con gracia, informando al usuario sin romperse y ofreciendo alternativas si es posible.
- **El Costo de Adquisición:** El consumo de API es parte del costo de adquisición de leads. Es una inversión que debe ser evaluada en el contexto del valor del cliente potencial.

---

Este documento servirá como una guía valiosa para futuros proyectos, ayudándonos a anticipar y evitar errores comunes, y a aplicar soluciones probadas.

---

## 4. Error 500 por Lectura de Archivos no Textuales en el Backend

**Problema:**
La aplicación sufría un `500 Internal Server Error` al iniciar una simulación si en la carpeta `context_documents` existían archivos no textuales como `.docx`, `.xlsx` o `.pdf`.

**Diagnóstico:**
El servidor intentaba leer todos los archivos de la carpeta de contexto como si fueran texto plano (`utf8`). Al encontrar un formato binario, el proceso de lectura fallaba y provocaba la caída del servidor.

**Solución:**
- **Backend (`server.js`):**
    - Se implementó una **lógica de lectura selectiva**. Se definió una lista blanca de extensiones permitidas (`.txt`, `.md`, `.csv`).
    - Antes de intentar leer un archivo, el servidor ahora comprueba su extensión. Si es una extensión permitida, lo lee y lo añade al contexto. Si no, lo ignora y muestra un mensaje en la consola del servidor.

**Lección Aprendida:**
- **Validar el tipo de archivo antes de procesarlo:** Nunca se debe asumir que los archivos subidos o presentes en una carpeta serán del tipo esperado. Siempre se debe validar la extensión o el tipo MIME antes de intentar una operación de lectura o procesamiento, especialmente en el backend, para evitar caídas del servidor.
- **Construir sistemas tolerantes a fallos:** El backend debe ser lo suficientemente robusto como para ignorar archivos no válidos o inesperados sin que esto afecte a la funcionalidad principal de la aplicación.

---

## 5. Error de Compilación de TypeScript por `props` Faltantes

**Problema:**
La aplicación mostraba un error de compilación en el navegador (`TS2322: Type ... is not assignable to type ... Property 'isLoading' does not exist on type 'HomeProps'`) que impedía que se renderizara.

**Diagnóstico:**
El componente padre (`App.tsx`) pasaba una `prop` (`isLoading`) al componente hijo (`Home.tsx`), pero la interfaz de `props` del componente hijo no había sido actualizada para declarar que esperaba recibir dicha propiedad.

**Solución:**
- **Frontend (`Home.tsx`):**
    - Se modificó la interfaz `HomeProps` para incluir `isLoading: boolean;`.
    - Se utilizó la nueva `prop` para controlar el estado del botón de inicio (deshabilitarlo y cambiar el texto mientras se carga).

**Lección Aprendida:**
- **Sincronización de `props` entre componentes:** En TypeScript, es fundamental que la "firma" (las `props` que un componente espera recibir) y la "llamada" (las `props` que se le pasan) coincidan exactamente. Un desajuste, por pequeño que sea, detendrá la compilación.
- **Los errores de TypeScript son una guía:** Aunque pueden parecer un obstáculo, los errores de TypeScript son una guía extremadamente útil que señala inconsistencias en el código antes de que se conviertan en errores de ejecución difíciles de depurar.

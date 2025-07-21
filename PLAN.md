# PLAN DE DESARROLLO: "El Dilema del CEO"

## Objetivo del Proyecto
Crear una simulación web estratégica e interactiva que sirva como herramienta de marketing de alto valor para Rebus Insights. La plataforma será una experiencia viva, actualizable y segura, diseñada para atraer y persuadir a líderes de alto nivel, reflejando la sofisticación y el enfoque prospectivo de la firma.

## Fases y Tareas

### Fase 1: Arquitectura y Diseño (Semana 1)
- [x] 1.1. Inicializar el repositorio en Git y crear la estructura de carpetas del proyecto.
- [x] 1.2. Configurar el proyecto de React (TypeScript) y Node.js (Express).
- [x] 1.3. Diseñar el "prompt" maestro para la IA Generativa, incluyendo instrucciones para:
    - Actuar como "Director del Juego".
    - Utilizar el contexto base (documentos iniciales).
    - Realizar búsquedas web en fuentes fiables cuando necesite información actual.
- [x] 1.4. Diseñar la arquitectura del backend para permitir la carga dinámica de documentos de contexto.
- [x] 1.5. Crear los wireframes y el diseño visual de la interfaz (minimalista y profesional).
- [x] 1.6. Redactar los borradores de la Política de Privacidad, Términos de Servicio y el descargo de responsabilidad legal.

### Fase 2: Desarrollo del Backend y Lógica Central (Semanas 2-3)
- [x] 2.1. Desarrollar el servidor en Node.js para gestionar las sesiones de juego.
- [x] 2.2. Implementar la comunicación segura con la API de la IA Generativa.
- [x] 2.3. Integrar la función de búsqueda web (`google_web_search`) en el flujo de la IA.
- [x] 2.4. Construir la lógica para que la IA pueda acceder y utilizar los documentos de contexto cargados.
- [x] 2.5. Realizar pruebas unitarias del backend y la lógica de la IA. (Fallo externo: API de Gemini sobrecargada)

### Fase 3: Desarrollo del Frontend (Semana 4)
- [x] 3.1. Construir los componentes de la interfaz en React: pantalla de inicio, pantalla de dilema, pantalla de informe.
- [x] 3.2. Desarrollar el backend en Node.js para la comunicación con la API de la IA. (Lógica de juego implementada)
- [x] 3.3. Añadir animaciones sutiles y transiciones para una experiencia de usuario fluida y premium.
- [x] 3.4. Asegurar un diseño completamente responsivo para escritorio y móvil.

### Fase 4: Funcionalidades de Administración y Legales (Semana 5)
- [x] 4.1. Desarrollar una interfaz de administración simple y protegida por contraseña para que los consultores de Rebus puedan cargar nuevos documentos de contexto. (Login implementado)
- [x] 4.2. Integrar las páginas o modales con la Política de Privacidad, Términos de Servicio y descargo de responsabilidad.
- [x] 4.3. Implementar la lógica de captura de leads (nombre, email, empresa) con consentimiento explícito, sin anonimizar completamente los datos del usuario si este decide proporcionarlos.

### Fase 5: Pruebas, Despliegue y Entrega (Semana 6)
- [x] 5.1. Realizar pruebas exhaustivas del flujo completo (juego, carga de documentos, búsquedas web).
- [ ] 5.2. Optimizar el rendimiento y la seguridad de la aplicación.
- [ ] 5.3. Configurar el hosting y desplegar la aplicación en un servidor web.
- [ ] 5.4. Realizar una demostración final y entregar el proyecto y su documentación.

# Notebook RAG

Un sistema **Full Stack RAG (Retrieval-Augmented Generation)** completamente local y privado. Permite subir documentos PDF y chatear con ellos utilizando Inteligencia Artificial.

![Status](https://img.shields.io/badge/Status-Functional-green) ![Docker](https://img.shields.io/badge/Docker-Enabled-blue) ![AI](https://img.shields.io/badge/AI-Ollama-orange)

## Tech Stack

### Frontend (Interfaz)
* **Framework:** Next.js 14 (App Router)
* **Lenguaje:** TypeScript
* **Estilos:** Tailwind CSS + Shadcn UI
* **Features:** Markdown rendering, Gestión de Sesiones, Sidebar dinámico.

### Backend
* **API:** FastAPI (Python)
* **Orquestación IA:** LangChain
* **Base de Datos Vectorial:** ChromaDB (Persistente en disco)
* **Base de Datos Relacional:** SQLite (Historial de chat y sesiones)
* **Arquitectura:** Service Pattern (Separación de Controladores y Lógica).

### Infraestructura & IA
* **Contenedores:** Docker & Docker Compose
* **Modelo LLM:** Llama 3.2 (vía Ollama)
* **Embeddings:** Nomic Embed Text (vía Ollama)

---

## Funcionalidades Actuales

1.  **Chat con Memoria:** La IA recuerda el contexto de la conversación.
2.  **RAG (Chat con PDFs):**
    * Subida de archivos PDF.
    * Fragmentación (Chunking) y Vectorización automática.
    * Búsqueda semántica para responder basándose en los documentos.
3.  **Gestión de Documentos:**
    * Lista visual de archivos indexados.
    * **Borrado completo:** Elimina el archivo del registro visual y sus vectores de la memoria de la IA.
4.  **Gestión de Sesiones:**
    * Crear nuevos chats.
    * Navegar por el historial de conversaciones pasadas.
    * Persistencia total al recargar la página.
5.  **Interfaz Moderna:** Diseño "Dark Mode" con acentos neón y feedback visual (toasts, loading states).

---

## Cómo arrancar el proyecto

### 1. Prerrequisitos
Tener instalado **Docker Desktop** y **Ollama**.

### 2. Preparar la IA (Ollama Local)
Descargar los modelos necesarios:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

Ejecutar

```bash
docker compose up --build

# Local Mind 🧠

**Local Mind** is a privacy-focused local chatbot that allows you to interact with powerful Large Language Models (LLMs) without sending any data to the cloud. It features a modern React-based UI, persistent memory using vector databases, and runs entirely on your machine.

---

## 🚀 Features

*   **100% Local & Private**: All processing happens on your device. No data leaves your network.
*   **Smart Memory**:
    *   **Short-term**: Uses Redis to remember your current conversation context.
    *   **Long-term**: Uses Qdrant (Vector DB) to store and retrieve relevant past interactions.
*   **Modern UI**: A clean, responsive chat interface built with React, Vite, and TailwindCSS.
*   **Flexible Backend**: Python FastAPI backend that orchestrates the LLM, memory, and API endpoints.
*   **Zero-Setup LLM**: Integrated with [Ollama](https://ollama.ai/) for easy model management.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, TypeScript, TailwindCSS
*   **Backend**: Python, FastAPI
*   **LLM Engine**: Ollama
*   **Databases**:
    *   Redis (Session/Hot Memory)
    *   Qdrant (Vector/Cold Memory)
*   **Containerization**: Docker & Docker Compose

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Required to run the application containers.
*   **[Git](https://git-scm.com/)**: To clone the repository.
*   **(Optional) Node.js & Python**: Only if you plan to run the services locally without Docker.

---

## 📦 Installation & Setup

The easiest way to run Local Mind is using Docker Compose.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/local-mind.git
cd local-mind
```

### 2. Start the Application
Run the following command to build and start all services:
```bash
docker-compose up --build
```
*Wait for a few minutes for the initial build and model downloading.*

### 3. Access the Application
*   **Frontend (Chat Interface)**: Open [http://localhost:3000](http://localhost:3000) in your browser.
*   **Backend API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs) to explore the API.

---

## 🖥️ Local Development (Optional)

If you prefer to run the services individually for development:

### Backend
1.  Navigate to the project root: `cd local-mind`
2.  Install dependencies: `pip install -r requirements.txt`
3.  Run the server: `uvicorn app.main:app --reload`

### Frontend
1.  Navigate to the directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start the dev server: `npm run dev`

*Note: You will still need Redis, Qdrant, and Ollama running, either via Docker or installed locally.*

---

## 📂 Project Structure

```
local-mind/
├── app/                 # Backend (FastAPI)
│   ├── core/            # Configs and settings
│   ├── routers/         # API endpoints
│   ├── services/        # Logic for LLM and Memory
│   └── main.py          # Entry point
├── frontend/            # Frontend (React + Vite)
│   ├── src/             # React source code
│   └── public/          # Static assets
├── docker-compose.yml   # Docker service orchestration
└── README.md            # You are here
```

---



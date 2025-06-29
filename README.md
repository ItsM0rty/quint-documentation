# Quint - Document Intelligence with RagFlow

Quint is a powerful document intelligence application that leverages RagFlow for advanced document processing, semantic search, and AI-powered question answering. Built with React, FastAPI, and RagFlow, it provides a modern interface for document management and intelligent querying.

## 🚀 Features

### Core Functionality
- **Document Indexing** - Upload and process PDFs, Word documents, and text files
- **Semantic Search** - Advanced document retrieval using RagFlow's deep understanding
- **AI-Powered Q&A** - Get intelligent answers with precise citations
- **Interactive Chat** - Context-aware conversations with your documents
- **Citation Tracking** - Every answer includes source references
- **Real-time Health Monitoring** - Live status of backend and RagFlow services

### Technical Features
- **RagFlow Integration** - Powered by the latest RAG engine with deep document understanding
- **Modern UI** - Built with React, Vite, and shadcn/ui components
- **FastAPI Backend** - High-performance Python backend with automatic API documentation
- **Docker Support** - Easy deployment with Docker and Docker Compose
- **Real-time Updates** - Live document indexing and chat interface

## 🏗️ Architecture

```
Quint/
├── frontend/                 # React + Vite + shadcn/ui
│   ├── src/
│   │   ├── components/ui/   # shadcn/ui components
│   │   ├── QuintApp.jsx     # Main application
│   │   └── lib/utils.js     # Utility functions
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── api/
│   │   └── main.py          # Main API with RagFlow integration
│   ├── ragflow_service.py   # RagFlow service wrapper
│   └── requirements.txt
├── ragflow-core/            # RagFlow engine (cloned from GitHub)
├── start_quint.py           # Startup script
└── test_ragflow_setup.py    # Integration tests
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker & Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Quint
   ```

2. **Start all services**
   ```bash
   python start_quint.py full
   ```

   This will:
   - Start RagFlow using Docker
   - Install backend dependencies and start the API
   - Install frontend dependencies and start the dev server

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - RagFlow: http://localhost:9380

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### RagFlow Setup
```bash
cd ragflow-core/docker
docker compose -f docker-compose.yml up -d
```

## 📖 Usage

### 1. Upload Documents
- Drag and drop files or click to select
- Supported formats: PDF, DOCX, TXT
- Documents are automatically processed and indexed by RagFlow

### 2. Chat with Documents
- Use the chat interface to ask questions
- Get context-aware responses with citations
- View source documents and references

### 3. Quick Queries
- Use the quick query section for direct answers
- Perfect for one-off questions without chat history

### 4. Monitor Health
- Real-time status indicators for backend and RagFlow
- Automatic health checks every 30 seconds

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
RAGFLOW_API_URL=http://localhost:9380
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### RagFlow Configuration
RagFlow configuration can be customized in `ragflow-core/conf/`:
- `mapping.json` - Model configurations
- `llm_factories.json` - LLM provider settings

## 🧪 Testing

Run the integration tests to verify your setup:

```bash
python test_ragflow_setup.py
```

This will test:
- RagFlow health and connectivity
- Backend API functionality
- Document upload and processing
- Query and chat capabilities

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check backend and RagFlow status

### Document Management
- `POST /api/upload-document` - Upload and index documents
- `GET /api/documents` - List uploaded documents
- `GET /api/datasets` - List RagFlow datasets
- `GET /api/knowledgebases` - List knowledge bases

### Query & Chat
- `POST /api/query` - Direct document querying
- `POST /api/chat` - Context-aware chat with documents

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Setup
1. Set up a reverse proxy (nginx)
2. Configure SSL certificates
3. Set production environment variables
4. Use production RagFlow configuration

## 🔍 Troubleshooting

### Common Issues

1. **RagFlow not starting**
   - Check Docker is running
   - Verify `vm.max_map_count >= 262144`
   - Check Docker logs: `docker logs ragflow-core`

2. **Backend connection issues**
   - Verify RagFlow is running on port 9380
   - Check firewall settings
   - Review backend logs

3. **Frontend not loading**
   - Check Node.js version (16+)
   - Clear npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Logs
- Backend logs: Check terminal where uvicorn is running
- Frontend logs: Check browser console
- RagFlow logs: `docker logs ragflow-core`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [RagFlow](https://github.com/infiniflow/ragflow) - The powerful RAG engine that powers Quint
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review the troubleshooting section

---

**Quint** - Making document intelligence accessible and powerful with RagFlow. 
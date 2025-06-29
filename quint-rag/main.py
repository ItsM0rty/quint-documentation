from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from pathlib import Path
import uuid
from datetime import datetime
import asyncio
import threading
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent
from rag_engine import RAGEngine
import uvicorn

app = FastAPI(title="Quint RAG API", version="1.0.0")

# Enable CORS for your Tauri app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG engine
rag = RAGEngine()

# Folder monitoring system
watched_folders = {}  # folder_path -> {last_scan, files, status}
folder_observers = {}  # folder_path -> observer
documents_db = {}  # file_id -> document_info

class FolderEventHandler(FileSystemEventHandler):
    def __init__(self, folder_path: str):
        self.folder_path = Path(folder_path)
        self.known_files = set()
        self._scan_initial_files()
    
    def _scan_initial_files(self):
        """Scan all existing files in the folder"""
        if not self.folder_path.exists():
            return
        
        # Get supported file extensions
        supported_extensions = ['.pdf', '.txt', '.docx', '.pptx']
        
        for file_path in self.folder_path.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                relative_path = str(file_path.relative_to(self.folder_path))
                self.known_files.add(relative_path)
                self._add_document_to_db(file_path, relative_path)
        
        print(f"Initial scan found {len(self.known_files)} supported files in {self.folder_path}")
    
    def on_created(self, event):
        """Called when a file is created"""
        supported_extensions = ['.pdf', '.txt', '.docx', '.pptx']
        if not event.is_directory and Path(str(event.src_path)).suffix.lower() in supported_extensions:
            file_path = Path(str(event.src_path))
            if file_path.exists():
                relative_path = str(file_path.relative_to(self.folder_path))
                if relative_path not in self.known_files:
                    self.known_files.add(relative_path)
                    self._add_document_to_db(file_path, relative_path)
                    print(f"New file detected: {relative_path}")
    
    def on_modified(self, event):
        """Called when a file is modified"""
        supported_extensions = ['.pdf', '.txt', '.docx', '.pptx']
        if not event.is_directory and Path(str(event.src_path)).suffix.lower() in supported_extensions:
            file_path = Path(str(event.src_path))
            if file_path.exists():
                relative_path = str(file_path.relative_to(self.folder_path))
                self._update_document_in_db(file_path, relative_path)
                print(f"File modified: {relative_path}")
    
    def on_deleted(self, event):
        """Called when a file is deleted"""
        supported_extensions = ['.pdf', '.txt', '.docx', '.pptx']
        if not event.is_directory and Path(str(event.src_path)).suffix.lower() in supported_extensions:
            file_path = Path(str(event.src_path))
            relative_path = str(file_path.relative_to(self.folder_path))
            if relative_path in self.known_files:
                self.known_files.remove(relative_path)
                self._remove_document_from_db(relative_path)
                print(f"File deleted: {relative_path}")
    
    def _add_document_to_db(self, file_path: Path, relative_path: str):
        """Add a new document to the database"""
        try:
            # Check if file already exists in DB
            existing_file_id = None
            for file_id, doc_info in documents_db.items():
                if doc_info.get("file_path") == str(file_path):
                    existing_file_id = file_id
                    break
            
            if existing_file_id:
                # Update existing document
                documents_db[existing_file_id].update({
                    "file_size": file_path.stat().st_size,
                    "uploaded_at": datetime.now().isoformat(),
                })
                print(f"Updated existing document: {relative_path}")
                
                # Re-index in RAG system
                def delayed_index():
                    time.sleep(1)  # Small delay to prevent overwhelming
                    rag.index_document(str(file_path))
                    print(f"Re-indexed document in RAG: {relative_path}")
                
                threading.Thread(target=delayed_index, daemon=True).start()
            else:
                # Create new document
                file_id = str(uuid.uuid4())
                document_info = {
                    "id": file_id,
                    "filename": relative_path,
                    "original_name": file_path.name,
                    "file_path": str(file_path),
                    "file_size": file_path.stat().st_size,
                    "file_type": "application/pdf",
                    "uploaded_at": datetime.now().isoformat(),
                    "status": "watched_folder",
                    "source_folder": str(self.folder_path),
                    "is_watched_file": True
                }
                documents_db[file_id] = document_info
                print(f"Added new document: {relative_path}")
                
                # Index in RAG system
                def delayed_index():
                    time.sleep(1)  # Small delay to prevent overwhelming
                    rag.index_document(str(file_path))
                    print(f"Indexed document in RAG: {relative_path}")
                
                threading.Thread(target=delayed_index, daemon=True).start()
                
        except Exception as e:
            print(f"Error adding document {relative_path}: {e}")
    
    def _update_document_in_db(self, file_path: Path, relative_path: str):
        """Update an existing document in the database"""
        try:
            for file_id, doc_info in documents_db.items():
                if doc_info.get("file_path") == str(file_path):
                    doc_info.update({
                        "file_size": file_path.stat().st_size,
                        "uploaded_at": datetime.now().isoformat(),
                    })
                    print(f"Updated document: {relative_path}")
                    
                    # Re-index in RAG system
                    rag.index_document(str(file_path))
                    print(f"Re-indexed document in RAG: {relative_path}")
                    break
        except Exception as e:
            print(f"Error updating document {relative_path}: {e}")
    
    def _remove_document_from_db(self, relative_path: str):
        """Remove a document from the database"""
        try:
            file_ids_to_remove = []
            for file_id, doc_info in documents_db.items():
                if doc_info.get("filename") == relative_path:
                    file_ids_to_remove.append(file_id)
            
            for file_id in file_ids_to_remove:
                del documents_db[file_id]
                print(f"Removed document: {relative_path}")
                
        except Exception as e:
            print(f"Error removing document {relative_path}: {e}")

# Pydantic models
class QueryRequest(BaseModel):
    question: str
    max_results: Optional[int] = 5

class IndexFolderRequest(BaseModel):
    folder_path: str

class WatchFolderRequest(BaseModel):
    folder_path: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    context_used: List[Dict[str, Any]]

class IndexResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None

class WatchFolderResponse(BaseModel):
    success: bool
    message: str
    folder_path: str
    files_found: int
    mode: str

@app.get("/")
async def root():
    return {"message": "Quint RAG API is running"}

@app.get("/health")
async def health_check():
    stats = rag.get_stats()
    stats["watched_folders"] = len(watched_folders)
    stats["total_documents"] = len(documents_db)
    return {"status": "healthy", "stats": stats}

@app.post("/index/folder", response_model=IndexResponse)
async def index_folder(request: IndexFolderRequest, background_tasks: BackgroundTasks):
    """Index all PDFs in a folder"""
    if not os.path.exists(request.folder_path):
        raise HTTPException(status_code=404, detail=f"Folder not found: {request.folder_path}")
    
    # Run indexing in background for large folders
    def index_task():
        return rag.index_folder(request.folder_path)
    
    try:
        result = index_task()  # For now, run synchronously
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        total_processed = len(result["processed"])
        total_errors = len(result["errors"])
        
        return IndexResponse(
            success=True,
            message=f"Indexing completed. Processed: {total_processed}, Errors: {total_errors}",
            details=result
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@app.post("/watch/folder", response_model=WatchFolderResponse)
async def watch_folder(request: WatchFolderRequest):
    """Start watching a folder for PDF changes"""
    try:
        print(f"Received watch folder request: {request.folder_path}")
        folder_path = request.folder_path
        if not folder_path:
            raise HTTPException(status_code=400, detail="folder_path is required")
        
        folder_path = Path(folder_path)
        print(f"Checking if folder exists: {folder_path}")
        if not folder_path.exists():
            print(f"Folder does not exist: {folder_path}")
            raise HTTPException(status_code=404, detail="Folder does not exist")
        
        print(f"Checking if path is directory: {folder_path}")
        if not folder_path.is_dir():
            print(f"Path is not a directory: {folder_path}")
            raise HTTPException(status_code=400, detail="Path is not a directory")
        
        print(f"Stopping existing observer if any for: {folder_path}")
        # Stop existing observer if any
        if str(folder_path) in folder_observers:
            folder_observers[str(folder_path)].stop()
            folder_observers[str(folder_path)].join()
        
        print(f"Creating new event handler for: {folder_path}")
        # Create new event handler and observer
        event_handler = FolderEventHandler(str(folder_path))
        print(f"Creating observer for: {folder_path}")
        observer = Observer()
        observer.schedule(event_handler, str(folder_path), recursive=True)
        print(f"Starting observer for: {folder_path}")
        observer.start()
        
        folder_observers[str(folder_path)] = observer
        
        # Count files found
        files_found = len(event_handler.known_files)
        
        # Add folder to watched folders
        watched_folders[str(folder_path)] = {
            "path": str(folder_path),
            "status": "watching",
            "last_scan": datetime.now().isoformat(),
            "file_count": files_found
        }
        
        print(f"Started watching folder: {folder_path} with {files_found} supported files")
        
        return WatchFolderResponse(
            success=True,
            message=f"Now watching folder: {folder_path}",
            folder_path=str(folder_path),
            files_found=files_found,
            mode="file_system_watch"
        )
        
    except Exception as e:
        import traceback
        print(f"ERROR in watch_folder: {str(e)}")
        print(f"Full traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to watch folder: {str(e)}")

@app.delete("/watch/folder/{folder_path:path}")
async def remove_watched_folder(folder_path: str):
    """Stop watching a folder and remove all tracked files from that folder"""
    try:
        # Stop the observer if it exists
        if folder_path in folder_observers:
            folder_observers[folder_path].stop()
            folder_observers[folder_path].join()
            del folder_observers[folder_path]
        
        # Remove folder from watched folders
        if folder_path in watched_folders:
            del watched_folders[folder_path]
        
        # Remove all documents that were tracked from this folder
        files_to_remove = []
        for file_id, doc_info in documents_db.items():
            if doc_info.get("source_folder") == folder_path and doc_info.get("is_watched_file"):
                files_to_remove.append(file_id)
        
        # Remove the documents from the database
        for file_id in files_to_remove:
            del documents_db[file_id]
        
        print(f"Stopped watching folder: {folder_path} and removed {len(files_to_remove)} tracked files")
        
        return {
            "success": True,
            "message": f"Stopped watching folder: {folder_path}",
            "files_removed": len(files_to_remove)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove folder: {str(e)}")

@app.get("/watch/folders")
async def list_watched_folders():
    """List all watched folders and their status"""
    try:
        folders = []
        for folder_path, info in watched_folders.items():
            folder_info = {
                "path": folder_path,
                "status": info.get("status", "unknown"),
                "last_scan": info.get("last_scan"),
                "file_count": info.get("file_count", 0)
            }
            
            # Add observer status if available
            if folder_path in folder_observers:
                observer = folder_observers[folder_path]
                folder_info["observer_running"] = observer.is_alive()
            
            folders.append(folder_info)
        
        return {
            "folders": folders,
            "total_folders": len(folders),
            "active_observers": len(folder_observers)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list folders: {str(e)}")

@app.get("/documents")
async def list_documents():
    """List all tracked documents"""
    try:
        documents = []
        for file_id, doc_info in documents_db.items():
            documents.append({
                "id": file_id,
                "filename": doc_info.get("filename"),
                "original_name": doc_info.get("original_name"),
                "file_size": doc_info.get("file_size"),
                "file_type": doc_info.get("file_type"),
                "uploaded_at": doc_info.get("uploaded_at"),
                "status": doc_info.get("status"),
                "source_folder": doc_info.get("source_folder"),
                "is_watched_file": doc_info.get("is_watched_file", False)
            })
        
        return {
            "documents": documents,
            "total_documents": len(documents)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@app.post("/index/file", response_model=IndexResponse)
async def index_file(file_path: str):
    """Index a single file"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    supported_extensions = ['.pdf', '.txt', '.docx', '.pptx']
    if not any(file_path.lower().endswith(ext) for ext in supported_extensions):
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Supported: {', '.join(supported_extensions)}")
    
    try:
        result = rag.index_document(file_path)
        
        return IndexResponse(
            success=result["success"],
            message=result["message"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """Query the indexed documents"""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        max_results = request.max_results if request.max_results is not None else 5
        result = rag.query(request.question, max_results)
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            context_used=result["context_used"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.get("/search")
async def search_documents(q: str, limit: int = 5):
    """Search documents without generating an answer"""
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        results = rag.search(q, limit)
        return {"results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/stats")
async def get_stats():
    """Get indexing statistics"""
    stats = rag.get_stats()
    stats["watched_folders"] = len(watched_folders)
    stats["total_documents"] = len(documents_db)
    return stats

@app.delete("/reset")
async def reset_index():
    """Reset the entire index (use with caution)"""
    try:
        rag.collection.delete()
        # Clear watched folders and documents
        for observer in folder_observers.values():
            observer.stop()
            observer.join()
        folder_observers.clear()
        watched_folders.clear()
        documents_db.clear()
        return {"message": "Index reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@app.get("/files")
async def list_indexed_files():
    """List all indexed files"""
    stats = rag.get_stats()
    return {"files": stats.get("files", [])}

if __name__ == "__main__":
    # Create data directory if it doesn't exist
    os.makedirs("./data/documents", exist_ok=True)
    
    print("🚀 Starting Quint RAG API...")
    print("📁 Document storage: ./data/documents")
    print("💾 ChromaDB storage: ./data/chroma_db")
    print("🔍 Ready to index and query documents!")
    print("👀 Folder watching enabled!")
    
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=8000,
        log_level="info"
    ) 
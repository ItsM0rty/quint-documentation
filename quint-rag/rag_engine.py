import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict, Any
from document_processor import DocumentProcessor
import openai
from dotenv import load_dotenv
import json

load_dotenv()

class RAGEngine:
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        self.documents_dir = os.path.join(data_dir, "documents")
        self.chroma_dir = os.path.join(data_dir, "chroma_db")
        
        # Ensure directories exist
        os.makedirs(self.documents_dir, exist_ok=True)
        os.makedirs(self.chroma_dir, exist_ok=True)
        
        # Initialize ChromaDB (persistent, local SQLite)
        self.client = chromadb.PersistentClient(
            path=self.chroma_dir,
            settings=Settings(allow_reset=True)
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="quint_documents",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Initialize document processor
        self.doc_processor = DocumentProcessor()
        
        # Initialize Deepseek client
        self.llm_client = openai.OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        )
    
    def index_folder(self, folder_path: str) -> Dict[str, Any]:
        """Index all supported files in a folder"""
        results = {
            "processed": [],
            "skipped": [],
            "errors": []
        }
        
        if not os.path.exists(folder_path):
            return {"error": f"Folder {folder_path} does not exist"}
        
        # Get supported file extensions
        supported_extensions = self.doc_processor.get_supported_extensions()
        
        # Find all supported files
        supported_files = []
        for f in os.listdir(folder_path):
            if any(f.lower().endswith(ext) for ext in supported_extensions):
                supported_files.append(f)
        
        for file_name in supported_files:
            file_path = os.path.join(folder_path, file_name)
            try:
                result = self.index_document(file_path)
                if result.get("success"):
                    results["processed"].append(file_name)
                else:
                    results["skipped"].append(file_name)
            except Exception as e:
                results["errors"].append(f"{file_name}: {str(e)}")
        
        return results
    
    def index_document(self, file_path: str) -> Dict[str, Any]:
        """Index a single document file"""
        filename = os.path.basename(file_path)
        
        # Check if already indexed
        file_hash = self.doc_processor.get_file_hash(file_path)
        existing = self.collection.get(
            where={"filename": filename}
        )
        
        if existing['documents'] and len(existing['documents']) > 0:
            # Check if file changed
            existing_metadata = existing['metadatas'][0]
            if existing_metadata.get('file_hash') == file_hash:
                return {"success": False, "message": "Document already indexed and unchanged"}
        
        # Extract text and create chunks
        chunks = self.doc_processor.extract_text_with_metadata(file_path)
        
        if not chunks:
            return {"success": False, "message": "No text extracted from document"}
        
        # Remove existing entries for this file
        if existing['documents']:
            existing_ids = existing['ids']
            self.collection.delete(ids=existing_ids)
        
        # Prepare data for ChromaDB
        documents = [chunk["text"] for chunk in chunks]
        metadatas = []
        ids = []
        
        for chunk in chunks:
            metadata = {
                "filename": chunk["filename"],
                "page": chunk["page"],
                "chunk_id": chunk["chunk_id"],
                "start_char": chunk["start_char"],
                "end_char": chunk["end_char"],
                "file_hash": file_hash
            }
            metadatas.append(metadata)
            ids.append(chunk["hash"])
        
        # Add to ChromaDB
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        return {
            "success": True, 
            "message": f"Indexed {len(chunks)} chunks from {filename}"
        }
    
    def search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant document chunks"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        search_results = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                metadata = results['metadatas'][0][i]
                distance = results['distances'][0][i] if results['distances'] else None
                
                search_results.append({
                    "text": doc,
                    "filename": metadata["filename"],
                    "page": metadata["page"],
                    "chunk_id": metadata["chunk_id"],
                    "relevance_score": 1 - distance if distance else None
                })
        
        return search_results
    
    def generate_answer(self, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Generate answer using Deepseek with context and citations"""
        # Prepare context with citations
        context_text = ""
        for i, chunk in enumerate(context_chunks):
            context_text += f"\n[{chunk['filename']}|page {chunk['page']}]\n{chunk['text']}\n"

        system_prompt = """You are a helpful research assistant. Answer questions based on the provided context documents. \n\nIMPORTANT CITATION RULES:\n1. Always cite your sources using the format [filename|page X]\n2. Be specific about which document and page number you're referencing\n3. If information comes from multiple sources, cite each one\n4. Only use information from the provided context\n5. If you can't find relevant information in the context, say so clearly\n\nProvide accurate, well-cited responses."""

        user_prompt = f"""Question: {query}\n\nContext Documents:\n{context_text}\n\nPlease provide a comprehensive answer with proper citations in the format [filename|page X]."""

        try:
            # Check if API key is available
            api_key = os.getenv("DEEPSEEK_API_KEY")
            if not api_key or api_key == "your-api-key-here":
                # Fallback: create a simple response from context
                return self._generate_fallback_answer(query, context_chunks)
            response = self.llm_client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            # Fallback: create a simple response from context
            return self._generate_fallback_answer(query, context_chunks)
    
    def _generate_fallback_answer(self, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Generate a fallback answer when API is not available"""
        if not context_chunks:
            return "I couldn't find any relevant information in the indexed documents to answer your question."
        answer_parts = []
        answer_parts.append(f"Based on the indexed documents, here's what I found regarding your question: '{query}'\n\n")
        chunks_by_file = {}
        for chunk in context_chunks:
            filename = chunk['filename']
            if filename not in chunks_by_file:
                chunks_by_file[filename] = []
            chunks_by_file[filename].append(chunk)
        for filename, chunks in chunks_by_file.items():
            answer_parts.append(f"**From {filename}:**\n")
            for chunk in chunks:
                text = chunk['text'].strip()
                if len(text) > 300:
                    text = text[:300] + "..."
                answer_parts.append(f"[{filename}|page {chunk['page']}] {text}\n")
            answer_parts.append("\n")
        answer_parts.append("\n*Note: This is a fallback response. For more sophisticated AI-generated answers, please configure a valid API key.*")
        return "".join(answer_parts)
    
    def query(self, question: str, n_results: int = 5) -> Dict[str, Any]:
        """Main query method - search and generate answer"""
        # Search for relevant chunks
        relevant_chunks = self.search(question, n_results)
        
        if not relevant_chunks:
            return {
                "answer": "I couldn't find any relevant information in the indexed documents.",
                "sources": [],
                "context_used": []
            }
        
        # Generate answer with citations
        answer = self.generate_answer(question, relevant_chunks)
        
        # Prepare source list
        sources = []
        for chunk in relevant_chunks:
            source_info = {
                "filename": chunk["filename"],
                "page": chunk["page"],
                "relevance_score": chunk.get("relevance_score", 0),
                "text_preview": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"]
            }
            if source_info not in sources:
                sources.append(source_info)
        
        return {
            "answer": answer,
            "sources": sources,
            "context_used": relevant_chunks
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed documents"""
        all_docs = self.collection.get()
        
        if not all_docs['metadatas']:
            return {"total_chunks": 0, "unique_files": 0, "total_pages": 0}
        
        filenames = set()
        pages = set()
        
        for metadata in all_docs['metadatas']:
            filenames.add(metadata['filename'])
            pages.add(f"{metadata['filename']}_page_{metadata['page']}")
        
        return {
            "total_chunks": len(all_docs['documents']),
            "unique_files": len(filenames),
            "total_pages": len(pages),
            "files": list(filenames)
        } 
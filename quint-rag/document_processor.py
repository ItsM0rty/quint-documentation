import pymupdf4llm
import os
from typing import List, Dict, Any
import hashlib
from pathlib import Path

class DocumentProcessor:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def extract_text_with_metadata(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract text from various file types with page and position metadata"""
        try:
            file_path = Path(file_path)
            file_extension = file_path.suffix.lower()
            
            if file_extension == '.pdf':
                return self._extract_pdf_text(file_path)
            elif file_extension == '.txt':
                return self._extract_txt_text(file_path)
            elif file_extension == '.docx':
                return self._extract_docx_text(file_path)
            elif file_extension == '.pptx':
                return self._extract_pptx_text(file_path)
            else:
                print(f"Unsupported file type: {file_extension}")
                return []
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return []
    
    def _extract_pdf_text(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """Extract text from PDF with page and position metadata"""
        try:
            # Use pymupdf4llm for better text extraction
            md_text = pymupdf4llm.to_markdown(str(pdf_path))
            
            # Also get page-by-page text for better metadata
            import pymupdf
            doc = pymupdf.open(str(pdf_path))
            
            chunks = []
            filename = pdf_path.name
            
            # Process page by page
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                if not page_text.strip():
                    continue
                
                # Create chunks from page text
                page_chunks = self._create_chunks(page_text, page_num + 1, filename)
                chunks.extend(page_chunks)
            
            doc.close()
            return chunks
            
        except Exception as e:
            print(f"Error processing PDF {pdf_path}: {e}")
            return []
    
    def _extract_txt_text(self, txt_path: Path) -> List[Dict[str, Any]]:
        """Extract text from TXT file"""
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            filename = txt_path.name
            # Treat entire file as one page
            return self._create_chunks(text, 1, filename)
            
        except Exception as e:
            print(f"Error processing TXT {txt_path}: {e}")
            return []
    
    def _extract_docx_text(self, docx_path: Path) -> List[Dict[str, Any]]:
        """Extract text from DOCX file"""
        try:
            from docx import Document
            doc = Document(str(docx_path))
            
            text_parts = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
            
            text = '\n'.join(text_parts)
            filename = docx_path.name
            # Treat entire document as one page
            return self._create_chunks(text, 1, filename)
            
        except Exception as e:
            print(f"Error processing DOCX {docx_path}: {e}")
            return []
    
    def _extract_pptx_text(self, pptx_path: Path) -> List[Dict[str, Any]]:
        """Extract text from PPTX file"""
        try:
            from pptx import Presentation
            prs = Presentation(str(pptx_path))
            
            text_parts = []
            for slide_num, slide in enumerate(prs.slides, 1):
                slide_text = []
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        slide_text.append(shape.text)
                
                if slide_text:
                    text_parts.append(f"Slide {slide_num}: {' '.join(slide_text)}")
            
            text = '\n'.join(text_parts)
            filename = pptx_path.name
            # Treat entire presentation as one page
            return self._create_chunks(text, 1, filename)
            
        except Exception as e:
            print(f"Error processing PPTX {pptx_path}: {e}")
            return []
    
    def _create_chunks(self, text: str, page_num: int, filename: str) -> List[Dict[str, Any]]:
        """Create overlapping text chunks with metadata"""
        chunks = []
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            # Don't break words
            if end < len(text) and not text[end].isspace():
                last_space = chunk_text.rfind(' ')
                if last_space > 0:
                    end = start + last_space
                    chunk_text = text[start:end]
            
            if chunk_text.strip():
                # Create unique chunk ID
                chunk_hash = hashlib.md5(f"{filename}_{page_num}_{chunk_id}_{chunk_text[:50]}".encode()).hexdigest()[:8]
                
                chunks.append({
                    "text": chunk_text.strip(),
                    "filename": filename,
                    "page": page_num,
                    "chunk_id": f"{filename}_p{page_num}_c{chunk_id}",
                    "start_char": start,
                    "end_char": end,
                    "hash": chunk_hash
                })
                chunk_id += 1
            
            start = end - self.overlap
            if start >= len(text):
                break
        
        return chunks
    
    def get_file_hash(self, filepath: str) -> str:
        """Get file hash to detect changes"""
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    def get_supported_extensions(self) -> List[str]:
        """Get list of supported file extensions"""
        return ['.pdf', '.txt', '.docx', '.pptx'] 
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set up PDF.js worker for Vite (must use a public path string, not import)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';

/**
 * PDFHighlighterViewer (robust, scrollable, multi-page, highlightable)
 * @param {string} fileUrl - URL or path to the PDF file
 * @param {object} highlight - { page, text, position }
 * @param {function} onHighlightClick - optional, called when highlight is clicked
 */
const PDFHighlighterViewer = ({ fileUrl, highlight, onHighlightClick }) => {
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageViewports, setPageViewports] = useState([]);
  const [error, setError] = useState(null);
  const canvasRefs = useRef([]);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    setError(null);
    setPdf(null);
    setNumPages(0);
    setPageViewports([]);
    pdfjsLib.getDocument(fileUrl).promise
      .then((loadedPdf) => {
        if (isMounted) {
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
        }
      })
      .catch((err) => {
        setError('Failed to load PDF: ' + err.message);
      });
    return () => { isMounted = false; };
  }, [fileUrl]);

  // Render all pages
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    const viewports = [];
    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const scale = 1.2;
          const viewport = page.getViewport({ scale });
          viewports[pageNum - 1] = viewport;
          // Render PDF page to canvas
          const canvas = canvasRefs.current[pageNum - 1];
          if (canvas) {
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
          }
        } catch (err) {
          if (!cancelled) setError('Failed to render page: ' + err.message);
        }
      }
      if (!cancelled) setPageViewports([...viewports]);
    };
    renderAllPages();
    return () => { cancelled = true; };
  }, [pdf]);

  // Scroll to cited page if highlight changes
  useEffect(() => {
    if (!highlight || !highlight.page || !containerRef.current) return;
    const pageIdx = highlight.page - 1;
    const pageDiv = document.getElementById(`pdf-page-${pageIdx}`);
    if (pageDiv && containerRef.current) {
      pageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight, numPages]);

  // Render highlights as overlays
  const renderHighlightOverlay = (pageIdx) => {
    if (!highlight || highlight.page !== pageIdx + 1 || !pageViewports[pageIdx]) return null;
    // For now, just highlight the whole page as a demo
    // You can improve this to highlight specific rects/text
    const viewport = pageViewports[pageIdx];
    return (
      <div
        className="absolute top-0 left-0 w-full h-full bg-yellow-300 opacity-30 pointer-events-none rounded"
        style={{ width: viewport.width, height: viewport.height }}
      />
    );
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }
  if (!pdf) {
    return <div className="p-4">Loading PDF...</div>;
  }

  return (
    <div
      ref={containerRef}
      className="bg-neutral-900 border-l border-neutral-800 relative flex justify-center items-center"
      style={{
        maxWidth: '80vw',
        maxHeight: '80vh',
        width: '100%',
        height: '100%',
        margin: 'auto',
        overflow: 'auto',
        borderRadius: '1rem',
      }}
    >
      <div className="flex flex-col items-center gap-8 py-8 w-full">
        {Array.from({ length: numPages }).map((_, i) => (
          <div
            key={i}
            id={`pdf-page-${i}`}
            className="relative mb-4 shadow-lg rounded overflow-hidden bg-[#222]"
          >
            <canvas ref={el => (canvasRefs.current[i] = el)} />
            {renderHighlightOverlay(i)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFHighlighterViewer; 
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const PDFHighlighterViewer = ({ fileUrl, highlight }) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightRects, setHighlightRects] = useState([]);
  const renderTaskRef = useRef(null);

  // Load PDF
  useEffect(() => {
    if (!fileUrl) return;

    setLoading(true);
    setError(null);

    pdfjsLib.getDocument(fileUrl).promise
      .then((pdfDoc) => {
        setPdf(pdfDoc);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load PDF: ' + err.message);
        setLoading(false);
      });
  }, [fileUrl]);

  // Find and highlight text
  const findAndHighlightText = async (page, viewport, searchText) => {
    if (!searchText) return [];

    try {
      const textContent = await page.getTextContent();
      const items = textContent.items;
      const searchLower = searchText.toLowerCase();
      
      const rects = [];
      
      // Simple text matching - find text items that contain the search text
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.str.toLowerCase().includes(searchLower)) {
          // Transform the text item's bounding box to viewport coordinates
          const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
          
          rects.push({
            left: transform[4],
            top: transform[5] - item.height,
            width: item.width,
            height: item.height,
          });
        }
      }

      // If no direct matches, try to find partial matches across multiple items
      if (rects.length === 0) {
        const searchWords = searchText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemLower = item.str.toLowerCase();
          
          for (const word of searchWords) {
            if (itemLower.includes(word)) {
              const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
              
              rects.push({
                left: transform[4],
                top: transform[5] - item.height,
                width: item.width,
                height: item.height,
              });
              break;
            }
          }
        }
      }

      return rects;
    } catch (err) {
      console.error('Error finding text:', err);
      return [];
    }
  };

  // Draw highlights on overlay canvas
  const drawHighlights = (rects) => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw highlight rectangles
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.8)';
    ctx.lineWidth = 1;

    rects.forEach(rect => {
      ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    });
  };

  // Render page
  const renderPage = async (pageNum, targetScale = scale) => {
    if (!pdf || !canvasRef.current) return;

    // Cancel previous render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: targetScale });

      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      if (overlay) {
        overlay.height = viewport.height;
        overlay.width = viewport.width;
      }

      // Render PDF page
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
      
      setCurrentPage(pageNum);

      // Find and draw highlights if we have highlight text
      if (highlight?.text) {
        const rects = await findAndHighlightText(page, viewport, highlight.text);
        setHighlightRects(rects);
        drawHighlights(rects);
      } else {
        setHighlightRects([]);
        if (overlay) {
          const ctx = overlay.getContext('2d');
          ctx.clearRect(0, 0, overlay.width, overlay.height);
        }
      }
    } catch (err) {
      if (err.name !== 'RenderingCancelled') {
        console.error('Render error:', err);
      }
    }
  };

  // Handle zoom
  const handleZoom = (newScale) => {
    const clampedScale = Math.max(0.5, Math.min(3.0, newScale));
    setScale(clampedScale);
    
    if (highlight?.page) {
      renderPage(highlight.page, clampedScale);
    }
  };

  // Fit to width
  const fitToWidth = async () => {
    if (!pdf || !highlight?.page || !containerRef.current) return;

    const page = await pdf.getPage(highlight.page);
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current.offsetWidth;
    const newScale = containerWidth / viewport.width;
    
    setScale(newScale);
    renderPage(highlight.page, newScale);
  };

  // Render highlighted page when highlight changes
  useEffect(() => {
    if (pdf && highlight?.page) {
      renderPage(highlight.page, scale);
    }
  }, [pdf, highlight?.page, scale]);

  // Fit to width on mount and resize
  useEffect(() => {
    if (pdf && highlight?.page) {
      fitToWidth();
    }
  }, [pdf, highlight?.page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
        <button
          onClick={() => handleZoom(scale - 0.25)}
          className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
          disabled={scale <= 0.5}
        >
          Zoom Out
        </button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => handleZoom(scale + 0.25)}
          className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
          disabled={scale >= 3.0}
        >
          Zoom In
        </button>
        <button
          onClick={fitToWidth}
          className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100 ml-2"
        >
          Fit Width
        </button>
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar"
      >
        <div className="flex justify-center p-4 relative">
          <canvas
            ref={canvasRef}
            className="border shadow-sm"
          />
          <canvas
            ref={overlayRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFHighlighterViewer; 
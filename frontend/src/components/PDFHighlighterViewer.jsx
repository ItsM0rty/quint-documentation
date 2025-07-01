import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set up PDF.js worker for Vite (must use a public path string, not import)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';

// DEBUG: Set this to true to enable console logging for highlight matching
const DEBUG_HIGHLIGHT = true;

function normalizeText(str) {
  // Remove all punctuation, normalize whitespace, lowercase
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\d\s]/g, '')
    .trim();
}

function fuzzyIncludes(haystack, needle) {
  // Robust fuzzy match: ignore case, allow up to 20% difference, ignore whitespace
  if (!haystack || !needle) return false;
  const h = haystack.toLowerCase().replace(/\s+/g, '');
  const n = needle.toLowerCase().replace(/\s+/g, '');
  if (h.includes(n)) return true;
  // Levenshtein distance (basic, for short text)
  function lev(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return matrix[a.length][b.length];
  }
  const dist = lev(h, n);
  return dist / Math.max(h.length, n.length) < 0.2;
}

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
  const [textHighlights, setTextHighlights] = useState({}); // { pageIdx: [ { left, top, width, height } ] }
  const canvasRefs = useRef([]);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    setError(null);
    setPdf(null);
    setNumPages(0);
    setPageViewports([]);
    setTextHighlights({});
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

  // Extract and highlight cited text (if available)
  useEffect(() => {
    if (DEBUG_HIGHLIGHT) {
      console.log('[Quint PDF Highlight] useEffect triggered', { pdf, highlight });
    }
    if (!pdf || !highlight || !highlight.page || !highlight.text) {
      if (DEBUG_HIGHLIGHT) {
        console.warn('[Quint PDF Highlight] Early return: missing pdf or highlight info', {
          pdf,
          highlight,
          page: highlight && highlight.page,
          text: highlight && highlight.text,
          typeofPage: highlight && typeof highlight.page,
          typeofText: highlight && typeof highlight.text,
          isPageTruthy: !!(highlight && highlight.page),
          isTextTruthy: !!(highlight && highlight.text),
        });
      }
      setTextHighlights({});
      return;
    }
    let cancelled = false;
    const pageIdx = highlight.page - 1;
    const citedText = highlight.text;
    const doTextHighlight = async () => {
      try {
        const page = await pdf.getPage(highlight.page);
        const scale = 1.2;
        const viewport = page.getViewport({ scale });
        const textContent = await page.getTextContent();
        const items = textContent.items;
        // Aggressively normalize all text
        const normCited = normalizeText(citedText);
        const normItems = items.map(i => normalizeText(i.str));
        if (DEBUG_HIGHLIGHT) {
          console.log('[Quint PDF Highlight] Cited:', citedText);
          console.log('[Quint PDF Highlight] Normalized cited:', normCited);
          console.log('[Quint PDF Highlight] Page items:', items.map(i => i.str));
          console.log('[Quint PDF Highlight] Normalized items:', normItems);
        }
        // Windowed n-gram matching
        let bestMatch = null;
        let bestScore = Infinity;
        let bestRects = [];
        let bestWindowText = '';
        const maxWindow = Math.min(30, items.length);
        for (let windowSize = 1; windowSize <= maxWindow; windowSize++) {
          for (let start = 0; start <= items.length - windowSize; start++) {
            const windowText = items.slice(start, start + windowSize).map(i => i.str).join(' ');
            const normWindow = normalizeText(windowText);
            // Jaccard similarity (token overlap)
            const setA = new Set(normWindow.split(' '));
            const setB = new Set(normCited.split(' '));
            const intersection = new Set([...setA].filter(x => setB.has(x)));
            const union = new Set([...setA, ...setB]);
            const jaccard = intersection.size / union.size;
            // Levenshtein distance (normalized)
            function lev(a, b) {
              const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
              for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
              for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
              for (let i = 1; i <= a.length; i++) {
                for (let j = 1; j <= b.length; j++) {
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                  );
                }
              }
              return matrix[a.length][b.length];
            }
            const levDist = lev(normWindow, normCited);
            const levScore = levDist / Math.max(normWindow.length, normCited.length);
            // Combine scores: prefer high Jaccard, low Levenshtein
            const score = levScore - jaccard; // lower is better
            if (score < bestScore || (score === bestScore && windowSize > 1)) {
              bestScore = score;
              bestMatch = { start, end: start + windowSize };
              bestWindowText = windowText;
            }
          }
        }
        if (DEBUG_HIGHLIGHT) {
          console.log('[Quint PDF Highlight] Best match:', bestMatch, 'Score:', bestScore, 'Text:', bestWindowText);
        }
        // Threshold: allow up to 0.35 normalized Levenshtein, require some Jaccard overlap
        if (bestMatch && bestScore < 0.35) {
          const rects = [];
          for (let i = bestMatch.start; i < bestMatch.end; i++) {
            const item = items[i];
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            rects.push({
              left: tx[4],
              top: tx[5] - item.height,
              width: item.width,
              height: item.height,
            });
          }
          if (!cancelled) setTextHighlights({ [pageIdx]: rects });
          return;
        }
        // Fallback: highlight the single item with max Jaccard overlap
        let bestIdx = -1;
        let bestItemScore = 0;
        for (let i = 0; i < normItems.length; i++) {
          const setA = new Set(normItems[i].split(' '));
          const setB = new Set(normCited.split(' '));
          const intersection = new Set([...setA].filter(x => setB.has(x)));
          const union = new Set([...setA, ...setB]);
          const jaccard = intersection.size / union.size;
          if (jaccard > bestItemScore) {
            bestItemScore = jaccard;
            bestIdx = i;
          }
        }
        if (bestIdx !== -1 && bestItemScore > 0.2) {
          const item = items[bestIdx];
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          if (!cancelled) setTextHighlights({ [pageIdx]: [{
            left: tx[4],
            top: tx[5] - item.height,
            width: item.width,
            height: item.height,
          }] });
          return;
        }
        // Final fallback: highlight the whole page
        if (!cancelled) setTextHighlights({});
      } catch (err) {
        if (!cancelled) setTextHighlights({});
      }
    };
    doTextHighlight();
    return () => { cancelled = true; };
  }, [pdf, highlight]);

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
    // If we have text highlights, render them
    if (textHighlights[pageIdx] && textHighlights[pageIdx].length > 0) {
      if (DEBUG_HIGHLIGHT) {
        console.log('[Quint PDF Highlight] Rendering highlight rects:', textHighlights[pageIdx]);
      }
      return textHighlights[pageIdx].map((rect, i) => (
        <div
          key={i}
          className="absolute bg-yellow-300 opacity-50 pointer-events-none rounded"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: '2px solid #facc15',
            boxSizing: 'border-box',
          }}
        />
      ));
    }
    // Fallback: highlight the whole page
    const viewport = pageViewports[pageIdx];
    if (DEBUG_HIGHLIGHT) {
      console.warn('[Quint PDF Highlight] Fallback: highlighting entire page', { pageIdx, viewport });
    }
    return (
      <div
        className="absolute top-0 left-0 w-full h-full bg-yellow-300 opacity-30 pointer-events-none rounded"
        style={{ width: viewport.width, height: viewport.height, border: '2px solid red', boxSizing: 'border-box' }}
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
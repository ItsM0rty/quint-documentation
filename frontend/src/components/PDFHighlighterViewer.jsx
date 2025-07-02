import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { remove as removeDiacritics } from 'diacritics';

// Set up PDF.js worker for Vite (must use a public path string, not import)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

// DEBUG: Set this to true to enable console logging for highlight matching
const DEBUG_HIGHLIGHT = true;

function robustNormalize(str) {
  if (!str) return '';
  return removeDiacritics(str)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[-‐‑‒–—―]/g, ' ') // all hyphens to space
    .replace(/[\u2018-\u201F\u0022\u0027]/g, '') // remove quotes
    .replace(/[^a-z0-9\s]/g, '') // remove all punctuation
    .replace(/\s+/g, ' ') // collapse whitespace
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
const PDFHighlighterViewer = ({ fileUrl, highlight }) => {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageViewport, setPageViewport] = useState(null);
  const [error, setError] = useState(null);
  const [textHighlights, setTextHighlights] = useState([]);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    setError(null);
    setPdf(null);
    setPageViewport(null);
    setTextHighlights([]);
    pdfjsLib.getDocument(fileUrl).promise
      .then((loadedPdf) => {
        if (isMounted) {
          setPdf(loadedPdf);
        }
      })
      .catch((err) => {
        setError('Failed to load PDF: ' + err.message);
      });
    return () => { isMounted = false; };
  }, [fileUrl]);

  // Render only the cited page
  useEffect(() => {
    if (!pdf || !highlight || !highlight.page) return;
    let cancelled = false;
    const renderPage = async () => {
      try {
        const page = await pdf.getPage(highlight.page);
        const scale = 1.2;
        const viewport = page.getViewport({ scale });
        setPageViewport(viewport);
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
        }
      } catch (err) {
        if (!cancelled) setError('Failed to render page: ' + err.message);
      }
    };
    renderPage();
    return () => { cancelled = true; };
  }, [pdf, highlight]);

  // Extract and highlight cited text (if available) on the cited page only
  useEffect(() => {
    if (!pdf || !highlight || !highlight.page || !highlight.text) {
      setTextHighlights([]);
      return;
    }
    let cancelled = false;
    const citedText = highlight.text;
    const doTextHighlight = async () => {
      try {
        const page = await pdf.getPage(highlight.page);
        const scale = 1.2;
        const viewport = page.getViewport({ scale });
        const textContent = await page.getTextContent();
        const items = textContent.items;
        const normCited = robustNormalize(citedText);
        const normItems = items.map(i => robustNormalize(i.str));
        // Try exact substring match first
        let matchIndices = null;
        for (let i = 0; i < normItems.length; i++) {
          for (let j = i + 1; j <= normItems.length; j++) {
            const windowNorm = normItems.slice(i, j).join(' ');
            if (windowNorm.includes(normCited) && normCited.length > 5) {
              matchIndices = [i, j];
              break;
            }
          }
          if (matchIndices) break;
        }
        if (matchIndices) {
          const rects = [];
          for (let i = matchIndices[0]; i < matchIndices[1]; i++) {
            const item = items[i];
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            rects.push({
              left: tx[4],
              top: tx[5] - item.height,
              width: item.width,
              height: item.height,
            });
          }
          if (!cancelled) setTextHighlights(rects);
          return;
        }
        // Fallback: fuzzy match (windowed Jaccard/Levenshtein)
        let bestMatch = null;
        let bestScore = Infinity;
        for (let windowSize = 1; windowSize <= Math.min(30, normItems.length); windowSize++) {
          for (let start = 0; start <= normItems.length - windowSize; start++) {
            const windowNorm = normItems.slice(start, start + windowSize).join(' ');
            // Jaccard
            const setA = new Set(windowNorm.split(' '));
            const setB = new Set(normCited.split(' '));
            const intersection = new Set([...setA].filter(x => setB.has(x)));
            const union = new Set([...setA, ...setB]);
            const jaccard = intersection.size / union.size;
            // Levenshtein
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
            const levDist = lev(windowNorm, normCited);
            const levScore = levDist / Math.max(windowNorm.length, normCited.length);
            const score = levScore - jaccard;
            if (score < bestScore) {
              bestScore = score;
              bestMatch = { start, end: start + windowSize };
            }
          }
        }
        if (bestMatch && bestScore < 0.5) {
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
          if (!cancelled) setTextHighlights(rects);
          return;
        }
        // Final fallback: highlight nothing
        setTextHighlights([]);
      } catch (err) {
        if (!cancelled) setTextHighlights([]);
      }
    };
    doTextHighlight();
    return () => { cancelled = true; };
  }, [pdf, highlight]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }
  if (!pdf || !highlight || !highlight.page) {
    return <div className="p-4">Loading PDF...</div>;
  }

  return (
    <div
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
        <div
          id={`pdf-page-${highlight.page - 1}`}
          className="relative mb-4 shadow-lg rounded overflow-hidden bg-[#222]"
        >
          <canvas ref={canvasRef} />
          {/* Render highlight overlays */}
          {pageViewport && textHighlights.length > 0 && textHighlights.map((rect, i) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFHighlighterViewer; 
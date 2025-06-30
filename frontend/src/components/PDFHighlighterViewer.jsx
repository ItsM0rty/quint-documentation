import React from "react";
import { PdfLoader, PdfHighlighter, Highlight } from "react-pdf-highlighter";
import "react-pdf-highlighter/dist/style.css";

/**
 * PDFHighlighterViewer
 * @param {string} fileUrl - URL or path to the PDF file
 * @param {object} highlight - { page, text, position }
 * @param {function} onHighlightClick - optional, called when highlight is clicked
 * @param {number} pageWindow - how many pages before/after to render (for large PDFs)
 */
const PDFHighlighterViewer = ({
  fileUrl,
  highlight,
  onHighlightClick,
  pageWindow = 2,
}) => {
  // Only render a window of pages around the citation for large PDFs
  const pageRange = highlight?.page
    ? {
        start: Math.max(1, highlight.page - pageWindow),
        end: highlight.page + pageWindow,
      }
    : null;

  // Build highlight object for react-pdf-highlighter
  const highlights = highlight
    ? [
        {
          id: "citation-highlight",
          content: { text: highlight.text },
          position: highlight.position || { pageNumber: highlight.page },
          comment: { text: "Citation", emoji: "🔖" },
        },
      ]
    : [];

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <PdfLoader url={fileUrl} beforeLoad={<div>Loading PDF...</div>}>
        {(pdfDocument) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            highlights={highlights}
            enableAreaSelection={false}
            scrollRef={null}
            onSelectionFinished={() => null}
            highlightTransform={(h, idx, setTip, hideTip, viewportToScaled, screenshot, isScrolledTo) => (
              <Highlight
                isScrolledTo={isScrolledTo}
                position={h.position}
                comment={h.comment}
                onClick={() => onHighlightClick && onHighlightClick(h)}
              />
            )}
            pageRange={pageRange}
          />
        )}
      </PdfLoader>
    </div>
  );
};

export default PDFHighlighterViewer; 
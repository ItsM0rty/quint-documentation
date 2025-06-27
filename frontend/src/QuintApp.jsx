import React, { useState, useRef, useEffect } from 'react';
import { Send, FolderOpen, Plus, X, Share, Download, RotateCcw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

const QuintApp = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'user',
      content: 'Can you do a research and write a detailed research paper for me? The topic is "The role of AI in enhancing the accuracy of medical diagnostics"'
    },
    {
      id: 2,
      type: 'assistant',
      content: 'Artificial Intelligence (AI) is revolutionizing the healthcare industry, particularly in medical diagnostics. By leveraging advanced algorithms, AI enhances diagnostic accuracy and speed. This allows for earlier disease detection and improved patient outcomes.',
      citations: [
        { id: 1, docId: 'doc1', page: 15, text: 'AI enhances diagnostic accuracy and speed' },
        { id: 2, docId: 'doc1', page: 23, text: 'improved patient outcomes' }
      ]
    }
  ]);
  const [activeDoc, setActiveDoc] = useState('doc1');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const textareaRef = useRef(null);

  const documents = {
    doc1: {
      title: 'AI-Powered Precision in Diagnostics',
      type: 'PDF',
      pages: 45,
      content: `The Role of AI in Enhancing the Accuracy of Medical Diagnostics\n\nArtificial Intelligence (AI) is revolutionizing the healthcare industry, particularly in the realm of medical diagnostics. By leveraging advanced algorithms, machine learning, and deep learning technologies, AI is enhancing the accuracy, speed, and efficiency of diagnosing diseases. This transformation is enabling healthcare providers to detect conditions earlier, reduce human error, and personalize patient care, ultimately improving outcomes and saving lives. As of March 12, 2025, AI's role in diagnostics continues to expand, driven by ongoing advancements and its integration into clinical practice.\n\nAI-Powered Precision in Diagnostics\n\nOne of the most significant contributions of AI to medical diagnostics is its ability to analyze vast amounts of data with unparalleled precision. Traditional diagnostic methods often rely on human interpretation, which, while skilled, can be subject to fatigue, oversight, or variability. AI, however, processes medical images—such as X-rays, MRIs, and CT scans—along with patient records, lab results, and genetic data, identifying patterns and anomalies that might escape the human eye. For example, AI algorithms have demonstrated remarkable accuracy in detecting breast cancer in mammograms, often outperforming radiologists by recognizing subtle changes invisible to human observers. This precision is particularly critical in early disease detection, where timely intervention can dramatically alter a patient's prognosis.\n\nIn fields like radiology and pathology, AI's enhanced pattern recognition is transforming workflows. Deep learning models, a subset of AI, use neural networks to analyze complex datasets, spotting minute discrepancies that indicate conditions such as tumors, fractures, or vascular irregularities. Studies have shown that AI can achieve sensitivity and specificity rates comparable to or exceeding those of clinical specialists, particularly in high-stakes areas like oncology and cardiology. By providing consistent, fatigue-free analysis, AI ensures a higher standard of diagnostic accuracy across diverse medical imaging applications.`
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: messages.length + 1, type: 'user', content: message.trim() }]);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => adjustTextareaHeight(), [message]);

  const handleCitationClick = (citationNumber, citations) => {
    const citation = citations[citationNumber - 1];
    if (citation) {
      setActiveDoc(citation.docId);
      setShowSidebar(true);
    }
  };

  const renderMessageWithCitations = (content, citations = []) => {
    if (!citations || citations.length === 0) {
      return <div>{content}</div>;
    }

    // Split content into parts and insert citations
    let parts = [];
    let remainingContent = content;
    let currentIndex = 0;

    citations.forEach((citation, index) => {
      const citationNumber = index + 1;
      const citationIndex = remainingContent.indexOf(citation.text);
      
      if (citationIndex !== -1) {
        // Add text before citation
        if (citationIndex > 0) {
          parts.push(
            <span key={`text-${currentIndex}`}>
              {remainingContent.substring(0, citationIndex)}
            </span>
          );
        }
        
        // Add citation text with clickable reference
        parts.push(
          <span key={`citation-${citationNumber}`}>
            {citation.text}
            <sup 
              className="citation"
              onClick={() => handleCitationClick(citationNumber, citations)}
              style={{
                background: '#4b5e97',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                marginLeft: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'inline-block'
              }}
            >
              [{citationNumber}]
            </sup>
          </span>
        );
        
        // Update remaining content
        remainingContent = remainingContent.substring(citationIndex + citation.text.length);
        currentIndex++;
      }
    });
    
    // Add any remaining content
    if (remainingContent) {
      parts.push(
        <span key={`text-final`}>
          {remainingContent}
        </span>
      );
    }

    return <div>{parts}</div>;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Collapsible Sidebar */}
      <div className={`bg-[#181818] border-r border-[#232323] transition-all duration-300 ease-in-out ${isNavCollapsed ? 'w-12' : 'w-16 sm:w-20'} flex flex-col items-center py-4 gap-4 relative`}>
        {/* Q Logo */}
        <div className="mb-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">Q</span>
          </div>
        </div>
        
        {/* Navigation Icons */}
        <button className="p-2 rounded hover:bg-[#232323] transition-colors">
          <span className="sr-only">Home</span>
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l1.41-1.41a2 2 0 0 1 2.83 0L12 14.17l3.76-3.76a2 2 0 0 1 2.83 0L20 12"/>
          </svg>
        </button>
        
        {!isNavCollapsed && (
          <>
            <button className="p-2 rounded hover:bg-[#232323] transition-colors">
              <FolderOpen className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded hover:bg-[#232323] transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </>
        )}
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#232323] border border-[#333] rounded-full flex items-center justify-center hover:bg-[#333] transition-colors"
        >
          {isNavCollapsed ? (
            <ChevronRight className="w-3 h-3 text-white" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-white" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#232323] bg-black">
          <h1 className="text-xl font-semibold text-white">LLM research papers</h1>
        </div>

        {/* Chat and PDF viewer */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className={`flex-1 flex flex-col justify-end px-8 py-6 overflow-y-auto transition-all duration-500 ease-in-out ${showSidebar ? 'w-2/3' : 'w-full'}`}>
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-center'}`}>
                  {msg.type === 'user' ? (
                    <div className="bg-[#181818] max-w-2xl rounded-xl p-4 text-white border border-[#232323]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full max-w-4xl">
                      <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white border border-[#2a2a2a] shadow-2xl backdrop-blur-sm relative overflow-hidden">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                              <span className="text-black font-bold text-lg">Q</span>
                            </div>
                            <span className="text-white/70 text-sm font-medium">Quint</span>
                          </div>
                          
                          <div className="prose prose-invert max-w-none">
                            <div className="text-white/90 leading-relaxed text-[15px]">
                              {msg.citations ? 
                                renderMessageWithCitations(msg.content, msg.citations) : 
                                msg.content
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Bottom border accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Premium Translucent Input */}
            <div className="mt-8 flex items-end gap-3 relative">
              <div className="flex-1 relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for anything"
                  className="w-full bg-transparent text-white placeholder-white/50 p-4 pr-12 rounded-2xl focus:outline-none resize-none min-h-[56px] max-h-[300px] leading-relaxed"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="absolute right-3 bottom-3 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced PDF Viewer Popup */}
          <div className={`h-full flex flex-col bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out transform ${
            showSidebar ? 'w-1/3 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 pointer-events-none'
          }`}>
            {/* Enhanced PDF Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">{documents[activeDoc]?.title}</h2>
                  <p className="text-sm text-gray-500">PDF • {documents[activeDoc]?.pages} pages</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors">
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors">
                  <Maximize2 className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* PDF Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-white/30 backdrop-blur-sm">
              <div className="prose prose-neutral max-w-none text-gray-900">
                {documents[activeDoc]?.content.split('\n').map((para, idx) => (
                  para.trim() && (
                    <p key={idx} className="mb-4 last:mb-0 text-sm leading-relaxed text-gray-800">
                      {para}
                    </p>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show PDF button when sidebar is closed */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed right-6 top-6 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default QuintApp;
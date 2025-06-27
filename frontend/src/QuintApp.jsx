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
      content: 'Artificial Intelligence (AI) is revolutionizing the healthcare industry, particularly in the realm of medical diagnostics. By leveraging advanced algorithms, machine learning, and deep learning technologies, AI is enhancing the accuracy, speed, and efficiency of diagnosing diseases¹. This transformation is enabling healthcare providers to detect conditions earlier, reduce human error, and personalize patient care, ultimately improving outcomes and saving lives².',
      citations: [
        { id: 1, docId: 'doc1', page: 15, text: 'AI is enhancing the accuracy, speed, and efficiency of diagnosing diseases' },
        { id: 2, docId: 'doc1', page: 23, text: 'improving outcomes and saving lives' }
      ]
    }
  ]);
  const [activeDoc, setActiveDoc] = useState('doc1');
  const [showSidebar, setShowSidebar] = useState(true);
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
      const newHeight = Math.min(textarea.scrollHeight, 300); // Increased max height
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => adjustTextareaHeight(), [message]);

  const renderMessageWithCitations = (content, citations = []) => {
    let result = content;
    citations.forEach((citation, index) => {
      const citationNumber = index + 1;
      const regex = new RegExp(citation.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, `${citation.text}<sup className="citation" data-citation="${citationNumber}">${citationNumber}</sup>`);
    });
    return <div dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const handleCitationClick = (citationNumber, citations) => {
    const citation = citations[citationNumber - 1];
    if (citation) setActiveDoc(citation.docId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Collapsible Sidebar */}
      <div className={`bg-[#181818] border-r border-[#232323] transition-all duration-300 ${isNavCollapsed ? 'w-12' : 'w-16 sm:w-20'} flex flex-col items-center py-4 gap-4 relative`}>
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
          <button className="p-2 rounded hover:bg-[#232323] transition-colors">
            <Share className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Chat and PDF viewer */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col justify-end px-8 py-6 overflow-y-auto">
            <div className="space-y-4">
              {/* System message */}
              <div className="flex items-center gap-2 text-sm text-[#bdbdbd]">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-5 h-5 bg-[#232323] rounded-full flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="7" />
                    </svg>
                  </span>
                  <span>o3-mini, Claude 3.7 and Gemini 2.0 Flash</span>
                </span>
                <span>have been added to the chat</span>
              </div>
              
              {/* Example chat messages */}
              <div className="flex items-center gap-2 text-sm text-white">
                <span className="inline-block w-5 h-5 bg-[#232323] rounded-full flex items-center justify-center">👋</span>
                <span>Hey there</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white">
                <span className="inline-block w-5 h-5 bg-[#232323] rounded-full flex items-center justify-center">👋</span>
                <span>Hello everyone</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white">
                <span className="inline-block w-5 h-5 bg-[#232323] rounded-full flex items-center justify-center">💬</span>
                <span>Hi John <span className="text-[#bdbdbd]">How can we help?</span></span>
              </div>
              
              {/* User message */}
              <div className="bg-[#181818] rounded-lg p-4 text-white max-w-xl">
                Hi. Can you do a research and write a detailed research paper for me? The topic is "The role of AI in enhancing the accuracy of medical diagnostics"
              </div>
              
              {/* Assistant message */}
              <div className="bg-[#232323] rounded-lg p-4 text-white max-w-xl">
                Sounds interesting. <span className="font-semibold">Gemini 2.0 Flash</span> can you start with the possible research architecture list?
              </div>
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
          {showSidebar && (
            <div className="fixed right-6 top-6 bottom-6 w-[540px] flex flex-col bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden z-50">
              {/* Enhanced PDF Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 leading-tight">{documents[activeDoc].title}</h2>
                    <p className="text-sm text-gray-500">PDF • {documents[activeDoc].pages} pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
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
                  {documents[activeDoc].content.split('\n').map((para, idx) => (
                    para.trim() && (
                      <p key={idx} className="mb-4 last:mb-0 text-sm leading-relaxed text-gray-800">
                        {para}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
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
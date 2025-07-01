import React, { useState, useRef, useEffect } from 'react';
import { Send, FolderOpen, Plus, X, Share, Download, RotateCcw, Maximize2, ChevronLeft, ChevronRight, Upload, MessageSquare, FileText, Search, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { useDropzone } from 'react-dropzone';
import { queryDocuments, indexFolder, watchFolder, stopWatchingFolder, listWatchedFolders, listDocuments, getStats, checkHealth } from './lib/api';
import { open } from '@tauri-apps/plugin-dialog';
import PDFHighlighterViewer from "./components/PDFHighlighterViewer";
import logo from './assets/logo.png';

const QuintApp = () => {
  // Document management state
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [healthStatus, setHealthStatus] = useState({ backend: false });
  const [watchedFolders, setWatchedFolders] = useState([]);
  const [folderToWatch, setFolderToWatch] = useState('');
  const [isWatchingFolder, setIsWatchingFolder] = useState(false);
  const [showDocumentsPanel, setShowDocumentsPanel] = useState(false);
  
  // Chat interface state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'user',
      content: 'Can you do a research and write a detailed research paper for me? The topic is "Steve Jobs: The Visionary Behind Apple\'s Revolutionary Impact on Technology and Business"'
    },
    {
      id: 2,
      type: 'assistant',
      content: 'Steve Jobs was a visionary entrepreneur who revolutionized multiple industries[1]. His leadership at Apple transformed the company from near bankruptcy to becoming the world\'s most valuable corporation[2].',
      citations: [
        { id: 1, filename: 'SteveJobsBio.pdf', page: 8 },
        { id: 2, filename: 'AppleHistory.pdf', page: 15 }
      ]
    }
  ]);
  const [activeDoc, setActiveDoc] = useState('doc1');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const folderInputRef = useRef(null);

  // Steve Jobs research document
  const steveJobsDoc = {
    doc1: {
      title: 'Steve Jobs: The Visionary Behind Apple\'s Revolution',
      type: 'PDF',
      pages: 52,
      content: `Steve Jobs: The Visionary Behind Apple's Revolutionary Impact on Technology and Business\n\nSteve Jobs, the co-founder of Apple Inc., stands as one of the most influential figures in the history of technology and business. His visionary approach to product design, marketing, and corporate leadership transformed Apple from a struggling computer company into a global technology empire that revolutionized multiple industries. Jobs' legacy extends far beyond the products he created; it encompasses a philosophy of innovation, design excellence, and user experience that continues to influence technology companies worldwide.\n\nThe Early Years and Apple's Foundation\n\nBorn in 1955 in San Francisco, Steve Jobs was adopted by Paul and Clara Jobs, who raised him in Mountain View, California. From an early age, Jobs demonstrated an interest in electronics and innovation. His partnership with Steve Wozniak, whom he met through a mutual friend, would become the foundation of Apple Computer Company, founded in 1976 in Jobs' parents' garage. The company's first product, the Apple I, was a modest success, but it was the Apple II that truly launched the personal computer revolution. Released in 1977, the Apple II became one of the first mass-produced personal computers, selling over 6 million units and establishing Apple as a major player in the emerging computer industry.\n\nJobs' vision extended beyond just creating functional computers; he understood that technology needed to be accessible, beautiful, and intuitive. This philosophy was evident in the design of the Apple II, which featured a sleek plastic case and integrated keyboard—a departure from the industrial-looking computers of the time. Jobs' attention to detail and insistence on quality would become hallmarks of his leadership style and Apple's product philosophy.\n\nThe Macintosh Revolution and Design Philosophy\n\nIn 1984, Apple introduced the Macintosh, a computer that would revolutionize personal computing through its graphical user interface and mouse-driven navigation. The Macintosh represented Jobs' belief that technology should be accessible to everyone, not just computer experts. The famous "1984" Super Bowl commercial, directed by Ridley Scott, positioned the Macintosh as a tool for creative individuals to break free from the constraints of traditional computing.\n\nJobs' design philosophy was heavily influenced by his appreciation for simplicity and elegance. He often spoke about the importance of making products that were not only functional but also beautiful and intuitive to use. This approach, which he later termed "design thinking," became central to Apple's product development process. Jobs believed that great design was not just about aesthetics but about creating products that users could love and integrate seamlessly into their lives.\n\nThe NeXT Years and Return to Apple\n\nAfter being ousted from Apple in 1985, Jobs founded NeXT Computer, a company focused on creating high-end workstations for the education and business markets. Although NeXT never achieved significant commercial success, the company's technology and operating system would later become the foundation for Apple's macOS. During this period, Jobs also acquired Pixar Animation Studios, which would go on to revolutionize the animation industry with films like "Toy Story" and "Finding Nemo."\n\nJobs' return to Apple in 1997 marked the beginning of one of the most remarkable corporate turnarounds in business history. Apple was on the verge of bankruptcy, with declining market share and a confusing product lineup. Jobs immediately began implementing his vision for the company, focusing on simplicity, innovation, and design excellence. He streamlined the product line, eliminated unprofitable projects, and began developing the products that would define Apple's resurgence.\n\nThe iPod and Digital Music Revolution\n\nIn 2001, Apple introduced the iPod, a portable digital music player that would revolutionize the music industry. The iPod's success was not just due to its technical capabilities but to Jobs' understanding of the entire user experience. He recognized that the success of a digital music player depended not just on the hardware but on the software and services that supported it. This led to the development of iTunes, a digital music management system that made it easy for users to organize and purchase music.\n\nThe iPod's impact extended far beyond Apple's bottom line; it fundamentally changed how people consumed music. The device's intuitive interface and seamless integration with iTunes made digital music accessible to mainstream consumers, paving the way for the streaming music services that dominate the industry today. The iPod's success also demonstrated Jobs' ability to identify and capitalize on emerging market opportunities.\n\nThe iPhone and Mobile Computing Revolution\n\nIn 2007, Jobs introduced the iPhone, a device that would revolutionize not just the mobile phone industry but the entire technology landscape. The iPhone combined a phone, music player, and internet device into a single, intuitive device that could fit in your pocket. Jobs' presentation of the iPhone at Macworld 2007 is considered one of the most significant product launches in technology history.\n\nThe iPhone's success was built on several key innovations: a multi-touch interface that made mobile computing intuitive, the App Store that created a new ecosystem for software development, and a design philosophy that prioritized user experience over technical specifications. The iPhone's impact extended beyond Apple, influencing the design and functionality of virtually every smartphone that followed.\n\nJobs' leadership during the iPhone's development demonstrated his ability to push his team to achieve seemingly impossible goals. He was known for his demanding standards and his ability to inspire his team to create products that exceeded expectations. The iPhone's success cemented Apple's position as a leading technology company and demonstrated Jobs' vision for the future of mobile computing.\n\nDesign Excellence and User Experience\n\nThroughout his career, Jobs emphasized the importance of design excellence and user experience. He believed that great products were the result of the intersection of technology and the liberal arts, combining technical innovation with artistic sensibility. This philosophy was evident in every Apple product, from the original Macintosh to the iPhone and iPad.\n\nJobs' attention to detail was legendary. He would spend hours reviewing product designs, often rejecting prototypes that didn't meet his exacting standards. He understood that the success of a product depended not just on its technical capabilities but on how it made users feel. This focus on emotional connection and user experience became a defining characteristic of Apple's products and a key factor in the company's success.\n\nThe iPad and Post-PC Era\n\nIn 2010, Jobs introduced the iPad, a device that would create a new category of computing devices and accelerate the transition to what Jobs called the "post-PC era." The iPad was designed to be more intimate and personal than a computer, with a touch interface that made it accessible to users of all ages and technical abilities.\n\nThe iPad's success demonstrated Jobs' ability to identify and create new market opportunities. While many critics initially dismissed the iPad as unnecessary, Jobs understood that there was a market for a device that was more powerful than a smartphone but more portable and accessible than a laptop. The iPad's success has influenced the design of tablets from other manufacturers and has created new opportunities for software developers and content creators.\n\nLeadership Style and Corporate Culture\n\nJobs' leadership style was characterized by his vision, passion, and demanding standards. He was known for his ability to inspire his team to achieve extraordinary results, often pushing them beyond what they thought was possible. His famous "reality distortion field" was not just a personality quirk but a leadership tool that helped him motivate his team to achieve seemingly impossible goals.\n\nJobs' approach to corporate culture emphasized innovation, excellence, and secrecy. He believed that great products were the result of small, focused teams working in an environment that encouraged creativity and risk-taking. Apple's culture under Jobs was characterized by intense focus, high standards, and a commitment to creating products that would delight users.\n\nLegacy and Impact\n\nSteve Jobs passed away in 2011, but his impact on technology and business continues to be felt today. His vision for Apple transformed the company into one of the most valuable corporations in the world, with a market capitalization that exceeded $2 trillion in 2020. More importantly, Jobs' influence extends beyond Apple to the entire technology industry.\n\nJobs' legacy includes not just the products he created but the philosophy and approach to innovation that he developed. His emphasis on design excellence, user experience, and the intersection of technology and the liberal arts has influenced countless companies and entrepreneurs. The success of companies like Tesla, Airbnb, and Uber can be traced in part to the lessons they learned from Apple's approach to product development and user experience.\n\nJobs' impact on the technology industry is perhaps best illustrated by the fact that virtually every smartphone, tablet, and laptop today incorporates design elements and user interface concepts that were pioneered by Apple under his leadership. His vision for the future of computing, which emphasized mobility, simplicity, and user experience, has become the standard for the entire industry.\n\nConclusion\n\nSteve Jobs' legacy as a visionary entrepreneur and technology leader is secure. His ability to identify emerging opportunities, his commitment to design excellence, and his understanding of user experience transformed Apple and influenced the entire technology industry. Jobs' philosophy of combining technical innovation with artistic sensibility, his focus on creating products that users could love, and his ability to inspire his team to achieve extraordinary results continue to serve as a model for entrepreneurs and business leaders worldwide.\n\nThe products that Jobs created—the Macintosh, iPod, iPhone, and iPad—have fundamentally changed how we live, work, and communicate. His vision for the future of technology, which emphasized mobility, simplicity, and user experience, has become the standard for the entire industry. Jobs' legacy extends far beyond the products he created; it encompasses a philosophy of innovation and excellence that continues to influence technology companies and entrepreneurs around the world.`
    }
  };

  // Check health status
  useEffect(() => {
    checkHealthStatus();
    const interval = setInterval(checkHealthStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load documents and watched folders
  useEffect(() => {
    loadDocuments();
    loadWatchedFolders();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const checkHealthStatus = async () => {
    try {
      const healthData = await checkHealth();
      setHealthStatus({
        backend: healthData.status === 'healthy',
        documents_count: healthData.stats?.total_documents || 0,
        watched_folders: healthData.stats?.watched_folders || 0
      });
    } catch (error) {
      setHealthStatus({ backend: false, documents_count: 0, watched_folders: 0 });
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadWatchedFolders = async () => {
    try {
      const data = await listWatchedFolders();
      setWatchedFolders(data.folders || []);
    } catch (error) {
      console.error('Failed to load watched folders:', error);
    }
  };

  // Robust folder selection using Tauri's native dialog
  const handleSelectFolder = async () => {
    try {
      setIsWatchingFolder(true);
      
      // Use Tauri's native folder dialog
      const selected = await open({
        multiple: false,
        directory: true,
        title: 'Select Folder to Watch'
      });
      
      if (selected) {
        const folderPath = Array.isArray(selected) ? selected[0] : selected;
        console.log('Selected folder path:', folderPath);
        
        // Start watching the folder
        const result = await watchFolder(folderPath);
        console.log('Watch folder result:', result);
        
        setShowFolderModal(false);
        await loadWatchedFolders();
        await loadDocuments();
        await checkHealthStatus();
      }
    } catch (error) {
      console.error('Failed to select or watch folder:', error);
      alert(`Failed to select folder: ${error.message}`);
    } finally {
      setIsWatchingFolder(false);
    }
  };

  const handleWatchFolder = async () => {
    if (!folderToWatch.trim()) return;
    
    setIsWatchingFolder(true);
    try {
      await watchFolder(folderToWatch);
      setFolderToWatch('');
      setShowFolderModal(false);
      await loadWatchedFolders();
      await loadDocuments();
      await checkHealthStatus();
    } catch (error) {
      console.error('Failed to watch folder:', error);
      alert(`Failed to watch folder: ${error.message}`);
    } finally {
      setIsWatchingFolder(false);
    }
  };

  const handleStopWatchingFolder = async (folderPath) => {
    try {
      await stopWatchingFolder(folderPath);
      await loadWatchedFolders();
      await loadDocuments();
      await checkHealthStatus();
    } catch (error) {
      console.error('Failed to stop watching folder:', error);
      alert(`Failed to stop watching folder: ${error.message}`);
    }
  };

  const handleIndexFolder = async (folderPath) => {
    setIsUploading(true);
    try {
      await indexFolder(folderPath);
      await loadDocuments();
      await checkHealthStatus();
    } catch (error) {
      console.error('Failed to index folder:', error);
      alert(`Failed to index folder: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await queryDocuments(query);
      
      const assistantMessage = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      setQuery('');
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await queryDocuments(query);
      setAnswer(result.answer);
      setCitations(result.sources || []);
    } catch (error) {
      console.error('Query failed:', error);
      setAnswer(`Error: ${error.message}`);
      setCitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-3 h-3 text-red-400" />;
      case 'txt':
        return <FileText className="w-3 h-3 text-blue-400" />;
      case 'docx':
        return <FileText className="w-3 h-3 text-green-400" />;
      case 'pptx':
        return <FileText className="w-3 h-3 text-orange-400" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      try {
        // For now, we'll just show the files being processed
        console.log('Files dropped:', acceptedFiles);
        // In a real implementation, you'd upload these files
        await loadDocuments();
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  });

  // Group documents by folder
  const documentsByFolder = documents.reduce((acc, doc) => {
    const folderPath = doc.folder_path || 'Unknown Folder';
    if (!acc[folderPath]) {
      acc[folderPath] = [];
    }
    acc[folderPath].push(doc);
    return acc;
  }, {});

  // Chat interface functions
  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage = { id: messages.length + 1, type: 'user', content: message.trim() };
      setMessages(prev => [...prev, userMessage]);
      const currentMessage = message.trim();
      setMessage('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Show loading state
      const loadingMessage = { id: messages.length + 2, type: 'assistant', content: 'Thinking...', isLoading: true };
      setMessages(prev => [...prev, loadingMessage]);

      try {
        // Call the API to get response
        const result = await queryDocuments(currentMessage);
        
        // Remove loading message and add real response
        setMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          return [...withoutLoading, {
            id: messages.length + 2,
            type: 'assistant',
            content: result.answer || 'Sorry, I couldn\'t generate a response.',
            citations: result.sources || []
          }];
        });
      } catch (error) {
        console.error('Chat API error:', error);
        // Remove loading message and add error response
        setMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          return [...withoutLoading, {
            id: messages.length + 2,
            type: 'assistant',
            content: `Error: ${error.message || 'Failed to get response from the AI.'}`,
            isError: true
          }];
        });
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

  const [activeCitationHighlight, setActiveCitationHighlight] = useState(null);

  const getFileUrlForDoc = (docId) => {
    // Find the document by id
    const doc = documents.find(d => d.id === docId);
    if (!doc) return null;
    // Use the new backend endpoint that serves by filename (robust, URL-encoded)
    return `http://localhost:8000/documents/by-filename/${encodeURIComponent(doc.filename)}`;
  };

  const getTextContentForDoc = (docId) => {
    const doc = documents.find(d => d.id === docId);
    return doc?.textContent || "";
  };

  const Tooltip = ({ children, text }) => (
    <div className="relative flex flex-col items-center group">
      {children}
      <div className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
        <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg rounded-md">
        {text}
      </span>
        <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
      </div>
    </div>
  );

  // Improved normalization for robust filename matching (inspired by open-source tools)
  function normalizeFilename(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/&/g, ' ') // replace ampersands with space
      .replace(/[^a-z0-9.\-]+/g, ' ') // keep only alphanumerics, dot, dash
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();
  }

  // --- ROBUST CITATION RENDERING ---
  const renderMessageContent = (content) => {
    if (!content) return null;

    const citationRegex = /\[([^\]|]+)\|page (\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // Build a map of unique citations to their sequential numbers
    const citationNumberMap = {};
    let nextCitationNumber = 1;
    const tempRegex = /\[([^\]|]+)\|page (\d+)\]/g;
    while ((match = tempRegex.exec(content)) !== null) {
        const citationKey = `${match[1]}|${match[2]}`;
        if (!citationNumberMap[citationKey]) {
            citationNumberMap[citationKey] = nextCitationNumber++;
        }
    }

    // Reset regex for the main parsing loop
    citationRegex.lastIndex = 0;

    // Split the content into text and citation parts
    while ((match = citationRegex.exec(content)) !== null) {
      // Add the text part before the citation
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      const filename = match[1];
      const page = match[2];
      const citationKey = `${filename}|${page}`;
      const number = citationNumberMap[citationKey];

      // Add the citation object
      parts.push({
        isCitation: true,
        filename,
        page,
        number,
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last citation
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // Render the parts into React components
    return parts.map((part, index) => {
      if (part.isCitation) {
        // Try to extract the cited text (sentence) before the citation marker
        let citedText = '';
        if (typeof parts[index - 1] === 'string') {
          // Get the last sentence or phrase before the citation
          const prevText = parts[index - 1];
          // Use regex to get the last sentence or up to 200 chars before the citation
          const match = prevText.match(/([^.?!\n]{0,200}[.?!])?$/);
          citedText = match ? match[0].trim() : prevText.trim();
        }
        // Fallback: if still empty, grab up to 200 chars before the citation in the whole content
        if (!citedText) {
          const citationPos = content.indexOf(`[${part.filename}|page ${part.page}]`);
          if (citationPos > 0) {
            const windowStart = Math.max(0, citationPos - 200);
            citedText = content.substring(windowStart, citationPos).trim();
          }
        }
        // Final fallback: if still empty, use a default text
        if (!citedText) {
          citedText = 'Cited content from page ' + part.page;
        }
        return (
          <sup
            key={index}
            onClick={() => handleCitationClick(part.filename, part.page, citedText)}
            style={{ cursor: 'pointer', textDecoration: 'underline', color: '#93c5fd' }}
          >
            <Tooltip text={`${part.filename} | Page ${part.page}`}>
              [{part.number || '?'}]
            </Tooltip>
          </sup>
        );
      }
      // It's just a string
      return <span key={index}>{part}</span>;
    });
  };

  const handleCitationClick = (filename, page, citedText = '') => {
    const normalized = (s) => s ? s.trim().toLowerCase() : '';
    const citationBase = normalizeFilename(filename.split(/[\\/]/).pop());
    const doc = documents.find(d => {
      const docBase = normalizeFilename(d.filename.split(/[\\/]/).pop());
      return normalized(docBase) === normalized(citationBase);
    });
    if (doc) {
      setPdfViewerKey(prev => prev + 1);
      setActiveDoc(doc.id);
      setActiveCitationHighlight({
        page: Number(page),
        text: citedText,
        position: { pageNumber: Number(page) },
      });
      setShowSidebar(true);
    } else {
      alert(`Document not found for citation: ${filename}`);
    }
  };

  // Add a unique key for PDFHighlighterViewer based on doc and page
  const [pdfViewerKey, setPdfViewerKey] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-row overflow-hidden min-h-0 min-w-0">
        {/* Collapsible Sidebar */}
        <div className={`bg-[#181818] border-r border-[#232323] transition-all duration-300 ease-in-out ${isNavCollapsed ? 'w-12' : 'w-16 sm:w-20'} flex flex-col items-center py-4 gap-4 relative min-h-0 min-w-0`}>
          {/* Sidebar top icon */}
          <div className="flex flex-col items-center py-2">
            <img src={logo} alt="Quint Logo" className="h-10 w-10 rounded" />
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
              <button 
                onClick={() => setShowFolderModal(true)}
                className="p-2 rounded hover:bg-[#232323] transition-colors"
                title="Add Folder"
              >
                <FolderOpen className="w-5 h-5 text-white" />
              </button>
              <button 
                onClick={() => setShowDocumentsPanel(!showDocumentsPanel)}
                className="p-2 rounded hover:bg-[#232323] transition-colors"
                title="Show Documents"
              >
                <FileText className="w-5 h-5 text-white" />
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
        <div className="flex-1 flex flex-col bg-black min-h-0 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-[#232323] bg-black">
            <h1 className="text-xl font-semibold text-white">LLM research papers</h1>
            
            {/* Health Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${healthStatus.backend ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-white/70">Backend</span>
              </div>
              <div className="text-sm text-white/70">
                {healthStatus.documents_count || 0} documents
              </div>
              <div className="text-sm text-white/70">
                {healthStatus.watched_folders || 0} watched folders
              </div>
            </div>
          </div>

          {/* Chat and PDF viewer */}
          <div className="flex flex-1 overflow-hidden min-h-0 min-w-0">
            {/* Chat Area */}
            <div
              className={`flex flex-col justify-end px-8 py-4 transition-all duration-500 ease-in-out custom-scrollbar min-h-0 min-w-0 ${showSidebar ? 'w-2/3' : 'w-full'}`}
              style={{ overflowY: 'auto' }}
            >
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-center'}`}>
                    {msg.type === 'user' ? (
                      <div className="bg-[#181818] max-w-2xl rounded-xl p-4 text-white border border-[#232323]">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full max-w-4xl">
                        <div className={`bg-[#1a1a1a] rounded-2xl p-8 text-white border border-[#2a2a2a] shadow-2xl backdrop-blur-sm relative overflow-hidden ${msg.isError ? 'border-red-500/50' : ''}`}>
                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
                          
                          {/* Content */}
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                <span className="text-black font-bold text-lg">Q</span>
                              </div>
                              <span className="text-white/70 text-sm font-medium">Quint</span>
                              {msg.isLoading && (
                                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                              )}
                              {msg.isError && (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            
                            <div className="prose prose-invert max-w-none">
                              <div className="text-white/90 leading-relaxed text-[15px]">
                                {msg.isLoading ? (
                                  <div className="flex items-center space-x-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Thinking...</span>
                                  </div>
                                ) : (
                                  renderMessageContent(msg.content)
                                )}
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
                <div ref={chatEndRef} />
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

            {/* Enhanced PDF Viewer Popup - only render when open */}
            {showSidebar && (
              <div
                className={
                  `transition-all duration-500 ease-in-out transform w-1/3 max-w-[600px] min-w-[320px] h-full`
                }
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '1.5rem',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
                  overflow: 'auto',
                }}
              >
                {/* Enhanced PDF Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 leading-tight">{steveJobsDoc[activeDoc]?.title}</h2>
                      <p className="text-sm text-gray-500">PDF • {steveJobsDoc[activeDoc]?.pages} pages</p>
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
                
                {/* PDF or TXT Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 bg-white/30 backdrop-blur-sm min-h-0 min-w-0">
                  {activeDoc && documents.find(doc => doc.id === activeDoc)?.filename.endsWith('.pdf') && (
                    <PDFHighlighterViewer
                      key={pdfViewerKey}
                      fileUrl={getFileUrlForDoc(activeDoc)}
                      highlight={activeCitationHighlight}
                    />
                  )}
                  {activeDoc && documents.find(doc => doc.id === activeDoc)?.filename.endsWith('.txt') && (
                    <div className="prose prose-neutral max-w-none text-gray-900 p-6">
                      <pre style={{ whiteSpace: "pre-wrap" }}>
                        {getTextContentForDoc(activeDoc)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
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

      {/* Folder Selection Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Select Folder to Watch</h2>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-8">
                <FolderOpen className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="text-white/70 mb-6">
                  Select a folder to watch for new documents. Files will be automatically indexed when added to the folder.
                </p>
                <Button
                  onClick={handleSelectFolder}
                  disabled={isWatchingFolder}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
                >
                  {isWatchingFolder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Adding Folder...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Choose Folder
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowFolderModal(false)}
                  variant="outline"
                  className="border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
                >
                  Cancel
                </Button>
              </div>
            </div>
            
            {/* Debug Info */}
            <div className="mt-4 p-3 bg-[#2a2a2a] rounded-lg">
              <p className="text-xs text-white/50 mb-1">Debug Info:</p>
              <p className="text-xs text-white/30">Backend: {healthStatus.backend ? 'Connected' : 'Disconnected'}</p>
              <p className="text-xs text-white/30">Watched Folders: {watchedFolders.length}</p>
              <p className="text-xs text-white/30">Documents: {documents.length}</p>
            </div>
            
            {/* Watched Folders List */}
            {watchedFolders.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white/70 mb-3">Currently Watching</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {watchedFolders.map((folder, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border border-[#3a3a3a] bg-[#2a2a2a]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {folder.path}
                        </p>
                        <p className="text-xs text-white/50">
                          {folder.file_count} files • {folder.status}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopWatchingFolder(folder.path)}
                        className="ml-2 border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents Panel - Only show when button is pressed */}
      {showDocumentsPanel && (
        <div className="fixed left-20 top-20 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl max-h-96 overflow-hidden">
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Folders Selected</h3>
              <p className="text-sm text-white/50">{watchedFolders.length} folders • {documents.length} files indexed</p>
            </div>
            <button
              onClick={() => setShowDocumentsPanel(false)}
              className="p-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {watchedFolders.length === 0 ? (
              <div className="p-4 text-center">
                <FolderOpen className="w-8 h-8 mx-auto text-white/30 mb-2" />
                <p className="text-sm text-white/50">No folders selected</p>
                <p className="text-xs text-white/30 mt-1">Click the folder icon to add folders</p>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {watchedFolders.map((folder, folderIndex) => (
                  <div key={folderIndex} className="space-y-2">
                    {/* Folder Header */}
                    <div className="flex items-center justify-between p-2 rounded bg-[#2a2a2a]">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {folder.path.split('\\').pop() || folder.path}
                          </p>
                          <p className="text-xs text-white/50">
                            {folder.file_count} files • {folder.status}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopWatchingFolder(folder.path)}
                        className="border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Documents in this folder */}
                    <div className="ml-4 space-y-1">
                      {documents
                        .filter(doc => doc.source_folder === folder.path)
                        .map((doc) => (
                          <div key={doc.id} className="flex items-center space-x-3 p-2 rounded hover:bg-[#2a2a2a] transition-colors">
                            {getFileIcon(doc.filename)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">
                                {doc.filename}
                              </p>
                              <p className="text-xs text-white/30">
                                {formatFileSize(doc.file_size)}
                              </p>
                            </div>
                          </div>
                        ))}
                      
                      {/* Show message if no documents in this folder */}
                      {documents.filter(doc => doc.source_folder === folder.path).length === 0 && (
                        <div className="p-2 text-center">
                          <p className="text-xs text-white/30">No documents indexed yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuintApp;
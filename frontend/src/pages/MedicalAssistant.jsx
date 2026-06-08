import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';

const renderMarkdown = (text) => {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  escaped = escaped.replace(/^### (.*?)$/gm, '<h4 class="text-base font-bold text-primary dark:text-secondary mt-3 mb-1">$1</h4>');
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>');
  escaped = escaped.replace(/^\s*[\-\*]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-primary dark:text-secondary select-none">•</span><span class="flex-1">$1</span></div>');
  
  escaped = escaped.split('\n').map(line => {
    if (line.includes('flex items-start') || line.includes('h4') || line.trim() === '') {
      return line;
    }
    return line + '<br />';
  }).join('\n');
  
  escaped = escaped.replace(/⚠️\s*(.*?)(?:<br \/>|$)/g, '<div class="my-2 p-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-red-800 dark:text-red-300 text-sm flex items-start gap-2"><span class="material-symbols-outlined text-base shrink-0 text-red-500 mt-0.5">warning</span><span class="flex-1">$1</span></div>');
  
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-1 text-sm md:text-base" />;
};

const hasStructuredSections = (text) => {
  if (!text) return false;
  return (
    text.includes('1. POSSIBLE CONDITION') || 
    text.includes('2. SEVERITY LEVEL') || 
    text.includes('3. SUGGESTED MEDICINES')
  );
};

const parseStructuredResponse = (text) => {
  const sections = {
    condition: '',
    severity: '',
    medicines: '',
    tips: '',
    doctor: '',
    emergency: ''
  };

  const extractSection = (headerName) => {
    const escapedHeader = headerName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`###\\s*(?:\\d+\\.\\s*)?${escapedHeader}[\\r\\n]+([\\s\\S]*?)(?=(?:###|$))`, 'i');
    const match = text.match(regex);
    if (match) {
      const content = match[1].trim();
      return content === 'N/A' || content === 'N/A.' ? '' : content;
    }
    return '';
  };

  sections.condition = extractSection('POSSIBLE CONDITION');
  sections.severity = extractSection('SEVERITY LEVEL');
  sections.medicines = extractSection('SUGGESTED MEDICINES');
  sections.tips = extractSection('QUICK CARE TIPS');
  sections.doctor = extractSection('DOCTOR VISIT INDICATOR');
  sections.emergency = extractSection('EMERGENCY ALERT');

  return sections;
};

const StructuredResponseCard = ({ text }) => {
  const sections = parseStructuredResponse(text);
  
  let severityColor = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
  let severityPulse = '';
  if (sections.severity.toLowerCase().includes('mild') || sections.severity.includes('🟢')) {
    severityColor = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400';
  } else if (sections.severity.toLowerCase().includes('moderate') || sections.severity.includes('🟡')) {
    severityColor = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400';
  } else if (sections.severity.toLowerCase().includes('high risk') || sections.severity.includes('🔴') || sections.severity.toLowerCase().includes('high')) {
    severityColor = 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400';
    severityPulse = 'animate-pulse';
  }

  const medicinesList = [];
  if (sections.medicines && sections.medicines !== 'No medication suggested.' && sections.medicines !== 'No medication suggested') {
    const parts = sections.medicines.split('💊').map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      const lines = part.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const name = lines[0];
        const purpose = lines.slice(1).join(' ').replace(/used for:/i, '').trim();
        medicinesList.push({ name, purpose });
      }
    });
  }

  const tipsList = [];
  if (sections.tips) {
    const lines = sections.tips.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      const cleaned = line.replace(/^[✓\-\*\s]+/, '').trim();
      if (cleaned) {
        tipsList.push(cleaned);
      }
    });
  }

  return (
    <div className="space-y-3 w-full text-slate-800 dark:text-slate-100 max-w-full">
      {sections.condition && (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Possible Condition</div>
          <p className="text-sm font-semibold leading-relaxed">{sections.condition}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.severity && (
          <div className={`border rounded-2xl p-3.5 shadow-sm flex flex-col justify-between ${severityColor} ${severityPulse}`}>
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-85 font-bold mb-1">Severity Level</div>
              <div className="text-base font-extrabold flex items-center gap-1.5 mt-1">
                {sections.severity}
              </div>
            </div>
            <div className="text-[10px] opacity-75 mt-1.5">
              Assess urgency and follow clinical instructions.
            </div>
          </div>
        )}

        {medicinesList.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Suggested Medicines</div>
            <div className="space-y-2">
              {medicinesList.map((med, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-primary select-none mt-0.5">pill</span>
                  <div className="text-xs">
                    <span className="font-bold text-primary dark:text-secondary">{med.name}</span>
                    {med.purpose && (
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Used for: {med.purpose}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          sections.medicines && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex items-center justify-center text-slate-400 text-xs gap-1.5">
               <span className="material-symbols-outlined text-sm text-slate-450 select-none">inbox</span> No medications suggested.
            </div>
          )
        )}
      </div>

      {tipsList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Quick Care Tips</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {tipsList.map((tip, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                 <span className="material-symbols-outlined text-xs text-emerald-500 font-bold select-none">check</span>
                <span className="text-slate-700 dark:text-slate-200">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.doctor && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-2xl p-3 text-blue-900 dark:text-blue-300 text-xs shadow-sm">
          <div className="font-bold mb-0.5 flex items-center gap-1.5 text-blue-800 dark:text-blue-400">
            <span className="material-symbols-outlined text-xs text-blue-500">stethoscope</span> Doctor Recommendation
          </div>
          <p className="leading-relaxed">{sections.doctor}</p>
        </div>
      )}

      {sections.emergency && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-3.5 text-red-950 dark:text-red-300 text-xs shadow-md">
          <div className="font-extrabold mb-1 flex items-center gap-1.5 text-red-700 dark:text-red-400">
            <span className="material-symbols-outlined text-xs text-red-500 animate-pulse">emergency</span> EMERGENCY ALERT
          </div>
          <p className="leading-relaxed font-semibold">{sections.emergency}</p>
        </div>
      )}
    </div>
  );
};

export default function MedicalAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConvoId, setCurrentConvoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const chatEndRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchConversations();
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I am your Arogya Raksha AI Medical Assistant. I can analyze your symptoms, suggest disease checks, explain medications, and provide care guidelines.\n\nDescribe how you are feeling or ask a health-related question to get started.",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await api.get('/medical/history');
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err.message);
    }
  };

  const loadConversation = async (id) => {
    setLoading(true);
    setHistoryOpen(false);
    try {
      const res = await api.get(`/medical/history/${id}`);
      setCurrentConvoId(res.data._id);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load conversation details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : inputText;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/medical/chat', {
        query: userMsg.content,
        conversationId: currentConvoId
      });

      if (res.data.isEmergency) {
        alert('EMERGENCY DETECTED: Redirecting you to the Emergency Help module immediately!');
        navigate('/emergency');
        return;
      }

      const assistantMsg = {
        role: 'assistant',
        content: res.data.response,
        urgencyLevel: res.data.urgencyLevel,
        disclaimer: res.data.disclaimer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (res.data.conversationId && !currentConvoId) {
        setCurrentConvoId(res.data.conversationId);
        fetchConversations();
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again later.', timestamp: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    setListening(true);
    rec.start();

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
  };

  const startNewChat = () => {
    setCurrentConvoId(null);
    setHistoryOpen(false);
    setMessages([
      {
        role: 'assistant',
        content: "New chat started. Ask me any medical or health questions.",
        timestamp: new Date()
      }
    ]);
  };

  const suggestionChips = [
    { text: "Remedy for stomach acidity", query: "Can you provide some natural home remedies for treating stomach acidity and indigestion?" },
    { text: "Persistent tension headache", query: "I have a persistent tension headache since morning. What are the common causes and self-care steps?" },
    { text: "Explain Paracetamol limits", query: "What is the standard dosage limit and side-effects of Paracetamol / Acetaminophen?" },
    { text: "Diet plan for high blood sugar", query: "What kind of daily diet plan and food restrictions are recommended for a pre-diabetic patient?" }
  ];

  if (isMobile) {
    // Mobile ChatGPT Assistant Layout (following medical_assistant/code.html from mobile.zip)
    return (
      <div className="w-full flex h-[calc(100vh-144px)] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden relative transition-all">
        
        {/* Sidebar History Drawer Overlay */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col justify-between transform transition-transform duration-300 ${historyOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-sm uppercase text-slate-400 tracking-wider">Consultations</span>
              <button onClick={() => setHistoryOpen(false)} className="text-lg font-bold">✕</button>
            </div>
            <button 
              onClick={startNewChat}
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-xl mb-4 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-xs">add</span> New Consultation
            </button>
            <div className="flex-grow overflow-y-auto space-y-1.5 pr-1">
              {conversations.length > 0 ? (
                conversations.map((convo) => (
                  <button 
                    key={convo._id}
                    onClick={() => loadConversation(convo._id)}
                    className={`w-full p-3 rounded-xl cursor-pointer text-left text-xs transition-all truncate flex items-center gap-1.5 ${currentConvoId === convo._id ? 'bg-primary/10 text-primary font-bold dark:text-secondary dark:bg-secondary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-650'}`}
                  >
                    <span className="material-symbols-outlined text-xs">chat</span>
                    <span className="truncate">{convo.conversationTitle}</span>
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center mt-6">No previous conversations.</p>
              )}
            </div>
          </div>
        </aside>

        {historyOpen && (
          <div onClick={() => setHistoryOpen(false)} className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" />
        )}

        {/* Messaging Board */}
        <div className="flex-grow flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
          
          {/* Mobile Chat Header */}
          <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-150 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setHistoryOpen(true)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">menu</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-primary">smart_toy</span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm">Arogya AI Assistant</h3>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Active Now</p>
              </div>
            </div>
            <button 
              onClick={startNewChat}
              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-bold"
            >
              New
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isStructured = hasStructuredSections(msg.content);
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[85%] leading-relaxed ${
                      isUser
                        ? 'p-3.5 rounded-2xl rounded-tr-none bg-primary text-white font-medium shadow-md text-sm whitespace-pre-line'
                        : isStructured
                          ? 'w-full bg-transparent p-0 border-none shadow-none'
                          : 'p-3.5 rounded-2xl rounded-tl-none bg-white border border-slate-150 dark:bg-slate-900 dark:border-slate-800 text-slate-850 shadow-sm text-sm whitespace-pre-line'
                    }`}
                  >
                    {isUser ? msg.content : isStructured ? <StructuredResponseCard text={msg.content} /> : renderMarkdown(msg.content)}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1.5">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5 max-w-[80%] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">●</div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-white border dark:bg-slate-900 dark:border-slate-800 flex-grow space-y-2 shadow-sm">
                  <div className="h-2 bg-slate-250 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-2 bg-slate-250 dark:bg-slate-800 rounded w-5/6"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {messages.length <= 1 && !loading && (
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/10 border-t border-slate-150">
              <div className="grid grid-cols-1 gap-1.5">
                {suggestionChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip.query)}
                    className="p-2.5 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary rounded-xl text-[11px] font-semibold flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xs">search</span>
                    <span className="truncate">{chip.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer and Input */}
          <div className="bg-alert-bg p-3 border-t border-slate-150 text-[10px] text-red-800 flex gap-2 items-center">
            <span className="material-symbols-outlined text-xs text-red-650">warning</span>
            <p className="leading-snug">
              <strong>Disclaimer:</strong> This AI assistant provides info only. Call 112 for critical health emergencies.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150">
            <form onSubmit={handleFormSubmit} className="flex gap-2 items-center">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-grow p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-xs"
                placeholder="Describe your symptoms..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={startSpeechRecognition}
                className={`p-3 rounded-xl border transition-all flex items-center justify-center ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 border-slate-200'}`}
              >
                <span className="material-symbols-outlined text-sm">mic</span>
              </button>
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="bg-primary text-white font-bold p-3 rounded-xl text-xs disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // Desktop View (Original rich MedicalAssistant with Sidebar history)
  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row gap-gutter h-[calc(100vh-64px)] transition-colors">
      
      {/* Sidebar: History */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col border border-outline-variant/30 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-800/70 p-4 h-48 lg:h-full overflow-hidden shadow-sm">
        <button 
          onClick={startNewChat}
          className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl mb-4 transition-all"
        >
          + New Consultation
        </button>
        <h4 className="text-label-sm uppercase tracking-wider text-outline mb-2">Previous Chats</h4>
        <div className="flex-grow overflow-y-auto space-y-2">
          {conversations.map((convo) => (
            <div 
              key={convo._id}
              onClick={() => loadConversation(convo._id)}
              className={`p-3 rounded-xl cursor-pointer text-left text-label-md transition-all truncate ${currentConvoId === convo._id ? 'bg-primary/10 text-primary font-bold dark:text-secondary dark:bg-secondary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              {convo.conversationTitle}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col border border-outline-variant/30 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-800/70 overflow-hidden shadow-md h-[calc(100%-192px)] lg:h-full">
        {/* Chat Header */}
        <div className="bg-primary text-white p-4 flex justify-between items-center dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <div>
              <h3 className="font-bold text-lg">AI Medical Assistant</h3>
              <p className="text-[10px] opacity-80">RAG Clinical Knowledge Base Active</p>
            </div>
          </div>
        </div>

        {/* Message bubbles */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[75%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'p-4 rounded-2xl bg-primary text-white dark:bg-secondary dark:text-slate-900 font-medium whitespace-pre-line'
                    : hasStructuredSections(msg.content)
                      ? 'w-full bg-transparent border-none shadow-none p-0'
                      : 'p-4 rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 border border-outline-variant/20 shadow-sm whitespace-pre-line'
                }`}
              >
                {msg.role === 'user'
                  ? msg.content
                  : hasStructuredSections(msg.content)
                    ? <StructuredResponseCard text={msg.content} />
                    : renderMarkdown(msg.content)}
                
                {msg.role === 'assistant' && msg.urgencyLevel && !hasStructuredSections(msg.content) && (
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-outline-variant/30 pt-2 text-[10px] text-outline font-bold uppercase">
                    <span>Severity: {msg.urgencyLevel}</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-outline mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-outline">
              <div className="animate-bounce">●</div>
              <div className="animate-bounce [animation-delay:0.2s]">●</div>
              <div className="animate-bounce [animation-delay:0.4s]">●</div>
              <span className="text-label-sm italic ml-1">Analyzing medical context...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Disclaimer footer banner */}
        <div className="bg-amber-50 border-t border-b border-amber-100 p-2 text-center text-[10px] text-amber-800 dark:bg-slate-900 dark:border-slate-800 dark:text-amber-400 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[10px] text-amber-500 align-middle">warning</span> Arogya Raksha provides educational health information only. Call emergency services in critical cases.
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-outline-variant/30 flex gap-2">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow p-3 rounded-xl border border-outline-variant bg-white dark:bg-slate-800 focus:border-primary outline-none text-label-md"
            placeholder="Type your symptoms or health queries here..."
            disabled={loading}
          />
          <button
            type="button"
            onClick={startSpeechRecognition}
            className={`p-3 rounded-xl border border-outline-variant hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xl flex items-center justify-center ${listening ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : ''}`}
            title="Speech to text input"
          >
            <span className="material-symbols-outlined text-base">mic</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:opacity-90 dark:bg-secondary dark:text-slate-900 text-white font-bold px-6 rounded-xl transition-all shadow-md"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}

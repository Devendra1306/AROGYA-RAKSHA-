import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, VolumeX, Plus, Menu, X, MessageSquare, Activity, AlertCircle } from 'lucide-react';
import AIDoctorAvatar from '../components/AIDoctorAvatar';
import SEO from '../components/SEO';

// ── Markdown & Structured Renderers ────────────────────────────────────────

const renderMarkdown = (text) => {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  escaped = escaped.replace(/^### (.*?)$/gm, '<h4 class="text-base font-black text-[#0052CC] dark:text-[#10B981] mt-5 mb-2">$1</h4>');
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>');
  escaped = escaped.replace(/^\s*[\-\*]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-2"><span class="text-[#0052CC] dark:text-[#10B981] mt-1">•</span><span class="flex-1 text-[13px]">$1</span></div>');
  
  escaped = escaped.split('\n').map(line => {
    if (line.includes('flex items-start') || line.includes('h4') || line.trim() === '') {
      return line;
    }
    return line + '<br />';
  }).join('\n');
  
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-2 text-[14px] leading-relaxed" />;
};

export default function MedicalAssistant() {
  const navigate = useNavigate();
  
  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConvoId, setCurrentConvoId] = useState(null);
  
  // UI State
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);

  // Avatar & Voice State
  const [avatarState, setAvatarState] = useState('idle'); // idle, listening, typing, speaking
  const [avatarMode, setAvatarMode] = useState('physician'); // physician, nutrition, medicine, emergency, remedy
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchConversations();
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I am your Arogya AI Healthcare Assistant. I can analyze symptoms, provide diet plans, check medicines, or guide you in an emergency. How can I help you today?",
        timestamp: new Date()
      }
    ]);

    // Setup Speech Recognition (STT)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setAvatarState('listening');
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          handleSend(finalTranscript);
        } else {
          setInputText(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setAvatarState('idle');
      };

      recognitionRef.current.onend = () => {
        if (avatarState !== 'typing' && avatarState !== 'speaking') {
           setAvatarState('idle');
        }
      };
    }

    // Setup Text-to-Speech (TTS)
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── API Functions ────────────────────────────────────────────────────────

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await api.get('/medical/history');
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat history');
    }
  };

  const loadConversation = async (id) => {
    setAvatarState('typing');
    setSidebarOpen(false);
    try {
      const res = await api.get(`/medical/history/${id}`);
      setCurrentConvoId(res.data._id);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load conversation details');
    } finally {
      setAvatarState('idle');
    }
  };

  const startNewChat = () => {
    setCurrentConvoId(null);
    setSidebarOpen(false);
    setMessages([{
      role: 'assistant',
      content: "New session started. How can I assist you?",
      timestamp: new Date()
    }]);
  };

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : inputText;
    if (!text.trim()) return;

    if (avatarState === 'listening') {
      recognitionRef.current?.stop();
    }

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAvatarState('typing');

    try {
      // Determine mode based on keywords
      const lowerText = text.toLowerCase();
      if (lowerText.includes('diet') || lowerText.includes('food') || lowerText.includes('calorie')) setAvatarMode('nutrition');
      else if (lowerText.includes('medicine') || lowerText.includes('pill') || lowerText.includes('drug')) setAvatarMode('medicine');
      else if (lowerText.includes('emergency') || lowerText.includes('pain') || lowerText.includes('bleeding')) setAvatarMode('emergency');
      else setAvatarMode('physician');

      const res = await api.post('/medical/chat', {
        query: userMsg.content,
        conversationId: currentConvoId
      });

      if (res.data.isEmergency) {
        setAvatarState('idle');
        navigate('/emergency');
        return;
      }

      const assistantMsg = {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      setAvatarState('idle');
      
      // Auto-speak if it was a voice query or if AutoSpeak is globally enabled
      if (autoSpeak && ttsSupported) {
        speakResponse(res.data.response);
      }

      if (res.data.conversationId && !currentConvoId) {
        setCurrentConvoId(res.data.conversationId);
        fetchConversations();
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() }]);
      setAvatarState('idle');
    }
  };

  // ── Voice Functions ──────────────────────────────────────────────────────

  const toggleListening = () => {
    if (!speechSupported) return alert('Voice input is not supported in your browser.');
    if (avatarState === 'listening') {
      recognitionRef.current?.stop();
    } else {
      setInputText('');
      recognitionRef.current?.start();
    }
  };

  const speakResponse = (text) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    
    // Strip markdown for speaking
    const cleanText = text.replace(/#|\*|_/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setAvatarState('speaking');
    utterance.onend = () => setAvatarState('idle');
    utterance.onerror = () => setAvatarState('idle');
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setAvatarState('idle');
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      <SEO
        title="AI Medical Assistant | Smart Healthcare Guidance | Arogya Raksha AI"
        description="Engage with our AI Medical Assistant for smart healthcare guidance, symptom analysis, and instant medical insights customized for you."
        keywords="Medical Assistant, AI Doctor, Symptom Checker, Healthcare AI, Smart Health"
        canonical="https://arogyarakshaa.vercel.app/medical-assistant"
        schema={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Arogya Raksha AI Medical Assistant",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "All"
        }}
      />
      
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass-card dark:bg-slate-900/90 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col transform transition-transform duration-300 shadow-2xl lg:shadow-none ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer magnetic-button" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052CC] to-blue-700 flex items-center justify-center shadow-[0_4px_12px_rgba(0,82,204,0.3)] dark:shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 dark:text-white leading-none">Arogya AI</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#0052CC] dark:text-[#10B981] mt-1">Medical Assistant</span>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg dark:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-[#0052CC] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 magnetic-button"
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 px-2">Recent History</p>
          {conversations.map((convo) => (
            <button 
              key={convo._id}
              onClick={() => loadConversation(convo._id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                currentConvoId === convo._id 
                  ? 'bg-[#0052CC]/10 dark:bg-[#10B981]/15 text-[#0052CC] dark:text-[#10B981] font-bold border border-[#0052CC]/20 dark:border-[#10B981]/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <MessageSquare className="w-[18px] h-[18px] shrink-0" />
              <span className="text-[13px] truncate">{convo.conversationTitle}</span>
            </button>
          ))}
        </div>
      </aside>

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Chat Area ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative h-full">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="font-black text-slate-800 dark:text-white text-[15px]">Medical Assistant</h2>
              <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" /> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2 cursor-pointer group" onClick={() => setAutoSpeak(!autoSpeak)}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] hidden sm:inline group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">Auto-Speak</span>
              <button 
                className={`w-10 h-5 rounded-full relative transition-colors shadow-inner ${autoSpeak ? 'bg-[#0052CC] dark:bg-[#10B981]' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${autoSpeak ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <button onClick={() => navigate('/emergency')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors magnetic-button">
              <AlertCircle className="w-4 h-4" /> SOS
            </button>
          </div>
        </header>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide flex flex-col gap-6 relative">
          
          {/* AI Doctor Avatar */}
          <div className="w-full flex justify-center pb-6 pt-2">
            <AIDoctorAvatar state={avatarState} mode={avatarMode} />
          </div>

          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-32">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                    
                    <div className={`p-5 rounded-3xl ${
                      isUser 
                        ? 'bg-gradient-to-br from-[#0052CC] to-blue-700 text-white rounded-br-sm shadow-[0_8px_20px_rgba(0,82,204,0.2)]' 
                        : 'glass-card dark:bg-slate-800/80 rounded-tl-sm shadow-sm premium-hover'
                    }`}>
                      {isUser ? (
                        <p className="text-[14px] font-medium">{msg.content}</p>
                      ) : (
                        <div className="text-slate-700 dark:text-slate-300">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}
                    </div>

                    {/* Actions / Metadata */}
                    <div className="flex items-center gap-3 mt-2 px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isUser && ttsSupported && (
                        <button 
                          onClick={() => avatarState === 'speaking' ? stopSpeaking() : speakResponse(msg.content)}
                          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors ${
                            avatarState === 'speaking'
                              ? 'text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
                              : 'text-[#0052CC] hover:text-blue-700 bg-[#0052CC]/5 dark:bg-[#10B981]/10 dark:text-[#10B981] border border-[#0052CC]/10 dark:border-[#10B981]/20'
                          }`}
                        >
                          {avatarState === 'speaking' ? (
                            <><VolumeX className="w-3.5 h-3.5" /> Stop Reading</>
                          ) : (
                            <><Volume2 className="w-3.5 h-3.5" /> Read Aloud</>
                          )}
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 inset-x-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 p-4 pb-safe">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            
            {/* Quick Action Chips */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-1 pl-1">
                {['My throat hurts', 'Diet for diabetes', 'Check my meds', 'I need a doctor'].map(chip => (
                  <button key={chip} onClick={() => setInputText(chip)} className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-[#0052CC] hover:text-white dark:hover:bg-[#10B981] transition-colors border border-slate-200 dark:border-slate-700 magnetic-button">
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3 w-full">
              <button 
                onClick={toggleListening}
                className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 transition-all magnetic-button ${
                  avatarState === 'listening' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse' 
                    : 'glass-card dark:bg-slate-800 text-slate-500 hover:text-[#0052CC] dark:hover:text-[#10B981]'
                }`}
              >
                {avatarState === 'listening' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex-1 glass-card dark:bg-slate-950/80 rounded-[24px] p-2 flex items-end focus-within:border-[#0052CC]/50 dark:focus-within:border-[#10B981]/50 focus-within:ring-4 focus-within:ring-[#0052CC]/10 dark:focus-within:ring-[#10B981]/10 transition-all shadow-sm"
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSend();
                    }
                  }}
                  placeholder={avatarState === 'listening' ? "Listening..." : "Type your symptoms or health query..."}
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-3 px-4 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                  rows={1}
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || avatarState === 'typing'}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0052CC] to-blue-700 dark:from-[#10B981] dark:to-emerald-600 hover:scale-105 disabled:opacity-50 text-white flex items-center justify-center shrink-0 mb-0.5 mr-0.5 transition-all shadow-[0_4px_12px_rgba(0,82,204,0.3)] dark:shadow-[0_4px_12px_rgba(16,185,129,0.3)] magnetic-button"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, VolumeX, Plus, Menu, X, MessageSquare, Activity, AlertCircle, Trash2, Sparkles, Bot } from 'lucide-react';
import AIDoctorAvatar from '../components/AIDoctorAvatar';
import SEO from '../components/SEO';

// ── Markdown Renderer ────────────────────────────────────────────────────────

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
    if (line.includes('flex items-start') || line.includes('h4') || line.trim() === '') return line;
    return line + '<br />';
  }).join('\n');
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-2 text-[14px] leading-relaxed" />;
};

// ── Typing Indicator ─────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 px-5 py-4">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-[#0052CC] dark:bg-[#10B981]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

export default function MedicalAssistant() {
  const navigate = useNavigate();

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConvoId, setCurrentConvoId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // UI State
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // tracks which convo is being deleted
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // shows confirm popup
  const chatEndRef = useRef(null);

  // Avatar & Voice State
  const [avatarState, setAvatarState] = useState('idle');
  const [avatarMode, setAvatarMode] = useState('physician');
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
    setMessages([{
      role: 'assistant',
      content: "Hello! I am your Arogya AI Healthcare Assistant. I can analyze symptoms, provide diet plans, check medicines, or guide you in an emergency. How can I help you today?",
      timestamp: new Date()
    }]);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onstart = () => setAvatarState('listening');
      recognitionRef.current.onresult = (event) => {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (final) handleSend(final);
        else setInputText(interim);
      };
      recognitionRef.current.onerror = () => setAvatarState('idle');
      recognitionRef.current.onend = () => {
        if (avatarState !== 'typing' && avatarState !== 'speaking') setAvatarState('idle');
      };
    }
    if ('speechSynthesis' in window) setTtsSupported(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    setConfirmDeleteId(null);
    try {
      const res = await api.get(`/medical/history/${id}`);
      setCurrentConvoId(res.data._id);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load conversation');
    } finally {
      setAvatarState('idle');
    }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.delete(`/medical/history/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentConvoId === id) {
        setCurrentConvoId(null);
        setMessages([{
          role: 'assistant',
          content: "Hello! I am your Arogya AI Healthcare Assistant. How can I help you today?",
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error('Failed to delete conversation');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const startNewChat = () => {
    setCurrentConvoId(null);
    setSidebarOpen(false);
    setConfirmDeleteId(null);
    setMessages([{
      role: 'assistant',
      content: "New session started. How can I assist you?",
      timestamp: new Date()
    }]);
  };

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : inputText;
    if (!text.trim()) return;

    if (avatarState === 'listening') recognitionRef.current?.stop();

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAvatarState('typing');
    setIsTyping(true);

    try {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('diet') || lowerText.includes('food') || lowerText.includes('calorie')) setAvatarMode('nutrition');
      else if (lowerText.includes('medicine') || lowerText.includes('pill') || lowerText.includes('drug')) setAvatarMode('medicine');
      else if (lowerText.includes('emergency') || lowerText.includes('pain') || lowerText.includes('bleeding')) setAvatarMode('emergency');
      else setAvatarMode('physician');

      const res = await api.post('/medical/chat', {
        query: userMsg.content,
        conversationId: currentConvoId
      });

      setIsTyping(false);

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

      if (autoSpeak && ttsSupported) speakResponse(res.data.response);

      if (res.data.conversationId && !currentConvoId) {
        setCurrentConvoId(res.data.conversationId);
        fetchConversations();
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() }]);
      setAvatarState('idle');
    }
  };

  const toggleListening = () => {
    if (!speechSupported) return alert('Voice input is not supported in your browser.');
    if (avatarState === 'listening') recognitionRef.current?.stop();
    else { setInputText(''); recognitionRef.current?.start(); }
  };

  const speakResponse = (text) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/#|\*|_/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setAvatarState('speaking');
    utterance.onend = () => setAvatarState('idle');
    utterance.onerror = () => setAvatarState('idle');
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setAvatarState('idle'); };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0f1a] font-sans overflow-hidden">
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

      {/* ── Premium Sidebar ──────────────────────────────────────────────── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] flex flex-col transform transition-transform duration-300 ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
        bg-white dark:bg-[#0d1117] border-r border-slate-200/60 dark:border-slate-800/60 shadow-2xl lg:shadow-none`}>

        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0052CC] to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-black text-[13px] text-slate-900 dark:text-white leading-none">Arogya AI</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#0052CC] dark:text-[#10B981] mt-0.5">Medical Assistant</p>
              </div>
            </div>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0052CC] to-violet-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-95 transition-all active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 font-medium">No conversations yet.<br />Start a new chat!</p>
            </div>
          ) : (
            <>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 pb-2">Recent History</p>
              {conversations.map((convo) => {
                const isActive = currentConvoId === convo._id;
                const isConfirming = confirmDeleteId === convo._id;
                return (
                  <div
                    key={convo._id}
                    className={`group relative flex items-center rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0052CC]/10 dark:bg-[#10B981]/10 border border-[#0052CC]/20 dark:border-[#10B981]/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    {/* Convo item */}
                    <button
                      onClick={() => !isConfirming && loadConversation(convo._id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 p-2.5 text-left"
                    >
                      <MessageSquare className={`w-[15px] h-[15px] shrink-0 ${isActive ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400'}`} />
                      <span className={`text-[12.5px] truncate font-medium ${isActive ? 'text-[#0052CC] dark:text-[#10B981] font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {convo.conversationTitle}
                      </span>
                    </button>

                    {/* Delete button — shown on hover */}
                    {!isConfirming ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(convo._id); }}
                        className="opacity-0 group-hover:opacity-100 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all mr-1.5"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      /* Confirm delete inline */
                      <div className="flex items-center gap-1 mr-1.5 shrink-0">
                        <button
                          onClick={(e) => deleteConversation(convo._id, e)}
                          disabled={deletingId === convo._id}
                          className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black hover:bg-red-600 transition-colors disabled:opacity-50"
                          title="Confirm delete"
                        >
                          {deletingId === convo._id ? '...' : 'Del'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                          className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">AI Online</p>
            <Sparkles className="w-3 h-3 text-emerald-500 ml-auto" />
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Chat Area ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative h-full min-w-0">

        {/* Header */}
        <header className="h-[60px] border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-xl flex items-center justify-between px-5 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-sm">Medical Assistant</h2>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                Online · Powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-speak toggle */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAutoSpeak(!autoSpeak)}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Auto-Speak</span>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${autoSpeak ? 'bg-[#0052CC] dark:bg-[#10B981]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform shadow-sm ${autoSpeak ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
              </div>
            </div>

            {/* Emergency button */}
            <button
              onClick={() => navigate('/emergency')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-wider border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              SOS
            </button>
          </div>
        </header>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5 relative">

          {/* AI Doctor Avatar */}
          <div className="w-full flex justify-center pb-4 pt-2">
            <AIDoctorAvatar state={avatarState} mode={avatarMode} />
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full pb-36">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[88%] md:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                      {/* Avatar dot */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052CC] to-violet-600 flex items-center justify-center flex-shrink-0 mb-6 shadow-md shadow-blue-500/20">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        {/* Bubble */}
                        <div className={`px-5 py-4 rounded-2xl ${
                          isUser
                            ? 'bg-gradient-to-br from-[#0052CC] to-violet-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20'
                            : 'bg-white dark:bg-[#141b2d] border border-slate-200/60 dark:border-slate-700/60 rounded-tl-sm shadow-sm'
                        }`}>
                          {isUser ? (
                            <p className="text-[14px] font-medium leading-relaxed">{msg.content}</p>
                          ) : (
                            <div className="text-slate-700 dark:text-slate-300">
                              {renderMarkdown(msg.content)}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2.5 mt-1.5 px-1">
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isUser && ttsSupported && (
                            <button
                              onClick={() => avatarState === 'speaking' ? stopSpeaking() : speakResponse(msg.content)}
                              className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors ${
                                avatarState === 'speaking'
                                  ? 'text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
                                  : 'text-[#0052CC] dark:text-[#10B981] bg-[#0052CC]/5 dark:bg-[#10B981]/10 border border-[#0052CC]/10 dark:border-[#10B981]/20'
                              }`}
                            >
                              {avatarState === 'speaking' ? <><VolumeX className="w-3 h-3" />Stop</> : <><Volume2 className="w-3 h-3" />Read</>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-end gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052CC] to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-[#141b2d] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl rounded-tl-sm shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ── Input Area ────────────────────────────────────────────────── */}
        <div className="absolute bottom-0 inset-x-0 bg-white/90 dark:bg-[#0d1117]/95 backdrop-blur-2xl border-t border-slate-200/60 dark:border-slate-800/60 p-4 pb-safe">
          <div className="max-w-3xl mx-auto flex flex-col gap-2.5">

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {['My throat hurts', 'Diet for diabetes', 'Check my meds', 'I need a doctor'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setInputText(chip)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-[#0052CC] hover:text-white dark:hover:bg-[#10B981] dark:hover:text-white transition-all border border-slate-200/60 dark:border-slate-700/60 active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2.5 w-full">
              {/* Mic button */}
              <button
                onClick={toggleListening}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                  avatarState === 'listening'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#0052CC] dark:hover:text-[#10B981] hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {avatarState === 'listening' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Text input form */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex-1 flex items-end bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 focus-within:border-[#0052CC]/50 dark:focus-within:border-[#10B981]/50 focus-within:ring-2 focus-within:ring-[#0052CC]/10 dark:focus-within:ring-[#10B981]/10 transition-all"
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder={avatarState === 'listening' ? "Listening..." : "Type your symptoms or health query..."}
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[48px] py-3.5 px-4 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || avatarState === 'typing'}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-violet-600 dark:from-[#10B981] dark:to-emerald-600 hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center shrink-0 mb-1 mr-1 transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none active:scale-90"
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

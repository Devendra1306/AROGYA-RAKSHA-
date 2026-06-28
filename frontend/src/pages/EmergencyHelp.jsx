import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, AlertTriangle, Search, Plus, PhoneCall, HeartPulse, Brain, Flame, Activity, Droplet, UserPlus, X, Stethoscope } from 'lucide-react';
import SEO from '../components/SEO';

// Icon mapper for categories
const getCategoryIcon = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('heart') || lower.includes('cardiac')) return <HeartPulse className="w-8 h-8 text-rose-500" />;
  if (lower.includes('stroke') || lower.includes('brain') || lower.includes('head')) return <Brain className="w-8 h-8 text-blue-500" />;
  if (lower.includes('burn')) return <Flame className="w-8 h-8 text-orange-500" />;
  if (lower.includes('bleed')) return <Droplet className="w-8 h-8 text-red-500" />;
  if (lower.includes('breath') || lower.includes('chok')) return <Activity className="w-8 h-8 text-emerald-500" />;
  return <AlertTriangle className="w-8 h-8 text-slate-500" />;
};

const getCategoryColor = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('heart') || lower.includes('cardiac')) return 'bg-rose-500/10 border-rose-500/20';
  if (lower.includes('stroke') || lower.includes('brain') || lower.includes('head')) return 'bg-blue-500/10 border-blue-500/20';
  if (lower.includes('burn')) return 'bg-orange-500/10 border-orange-500/20';
  if (lower.includes('bleed')) return 'bg-red-500/10 border-red-500/20';
  if (lower.includes('breath') || lower.includes('chok')) return 'bg-emerald-500/10 border-emerald-500/20';
  return 'bg-slate-500/10 border-slate-500/20';
};

const getSeverityBadge = (severity) => {
  const s = severity?.toLowerCase() || '';
  if (s === 'critical') return <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">Critical</span>;
  if (s === 'urgent' || s === 'high') return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Urgent</span>;
  return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Monitor</span>;
};

export default function EmergencyHelp() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  useEffect(() => {
    fetchCategories();
    fetchContacts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/emergency/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch emergency categories');
    }
  };

  const fetchContacts = async () => {
    try {
      if (localStorage.getItem('token')) {
        const res = await api.get('/emergency/emergency-contact');
        setContacts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch emergency contacts');
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setAiResult(null);
    setSelectedGuide(null);

    try {
      const res = await api.post('/emergency/analyze', { query: searchQuery });
      setAiResult(res.data);
    } catch (err) {
      console.error('AI symptom analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuide = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/emergency/details/${id}`);
      setSelectedGuide(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to fetch guide details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    try {
      const res = await api.post('/emergency/emergency-contact', newContact);
      setContacts([...contacts, res.data.contact]);
      setNewContact({ name: '', phone: '', relationship: '' });
      setShowAddContact(false);
    } catch (err) {
      alert('Failed to save emergency contact.');
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.symptoms?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 md:pb-8">
      <SEO title="Emergency Help | Arogya Raksha" />
      
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 h-[72px] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white text-[16px] leading-tight">Emergency</h1>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" /> Immediate Response
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/medical-assistant')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[12px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors magnetic-button">
          Exit SOS
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 md:mt-10 space-y-8">
        
        {/* ── Quick Call Action Hero ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="tel:108" className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl shadow-red-500/20 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <h2 className="text-sm font-black opacity-90 uppercase tracking-widest mb-1">Medical Emergency</h2>
              <p className="text-4xl font-black">108</p>
            </div>
            <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-red-500 transition-colors">
              <PhoneCall className="w-8 h-8" />
            </div>
          </a>

          <a href="tel:100" className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <h2 className="text-sm font-black opacity-90 uppercase tracking-widest mb-1">Police Assistance</h2>
              <p className="text-4xl font-black">100</p>
            </div>
            <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <Phone className="w-8 h-8" />
            </div>
          </a>
        </section>

        {/* ── AI Symptom Search ── */}
        <section>
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search symptoms (e.g. severe chest pain, deep cut...)"
              className="w-full glass-card dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 pl-14 pr-32 text-[14px] text-slate-900 dark:text-white font-medium shadow-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all premium-hover"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="absolute inset-y-1.5 right-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-6 rounded-xl transition-colors flex items-center gap-2 magnetic-button shadow-md"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Analyze'}
            </button>
          </form>
        </section>

        {/* ── Dynamic Content Area (AI Result or Selected Guide) ── */}
        <AnimatePresence mode="wait">
          {(aiResult || selectedGuide) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 md:p-8 premium-hover border-red-200/50 dark:border-red-900/30 shadow-xl shadow-red-500/5"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  {getSeverityBadge(
                    aiResult 
                      ? (typeof aiResult === 'object' ? (aiResult.severity || aiResult.urgencyLevel) : 'Monitor') 
                      : selectedGuide.severity
                  )}
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                    {aiResult 
                      ? (typeof aiResult === 'object' ? (aiResult.condition || aiResult.possibleEmergency) : 'AI Analysis Result') 
                      : selectedGuide.title
                    }
                  </h2>
                </div>
                <button onClick={() => { setAiResult(null); setSelectedGuide(null); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {aiResult ? (
                <div className="space-y-6">
                  {/* Response Text */}
                  <div className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                    {typeof aiResult === 'string' ? aiResult : (aiResult.response || aiResult.immediateAction)}
                  </div>
                  
                  {/* Steps (if object) */}
                  {typeof aiResult === 'object' && (aiResult.immediateActions || aiResult.steps) && (
                    <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl p-5 border border-red-100 dark:border-red-500/10">
                      <h3 className="font-bold text-red-800 dark:text-red-400 mb-3 uppercase tracking-widest text-xs">First Aid Steps</h3>
                      <ol className="space-y-3">
                        {(aiResult.immediateActions || aiResult.steps).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-200 dark:bg-red-500/20 text-red-700 dark:text-red-400 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                            <span className="mt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Warnings (if object) */}
                  {typeof aiResult === 'object' && aiResult.warnings && aiResult.warnings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <h3 className="w-full font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-widest text-xs">Do Not:</h3>
                      {aiResult.warnings.map((warn, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                          {warn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedGuide.symptoms && (
                    <div className="flex flex-wrap gap-2">
                      {selectedGuide.symptoms.map((sym, i) => (
                        <span key={i} className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-200 dark:border-red-500/20">{sym}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-500" /> Immediate Actions
                      </h3>
                      <ul className="space-y-3">
                        {selectedGuide.steps?.map((act, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /> {act}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-500/5 rounded-2xl p-5 border border-rose-200 dark:border-rose-500/10">
                      <h3 className="font-bold text-rose-900 dark:text-rose-400 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" /> What NOT to do
                      </h3>
                      <ul className="space-y-3">
                        {selectedGuide.warnings?.map((act, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" /> {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Category Grid ── */}
        {!aiResult && !selectedGuide && (
          <section>
            <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Emergency Guides</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCategories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => handleSelectGuide(cat._id)}
                  className="glass-card dark:bg-slate-900/80 p-5 rounded-3xl flex flex-col items-center justify-center text-center gap-3 transition-all hover:border-red-300 dark:hover:border-red-500/50 hover:-translate-y-1 group premium-hover"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${getCategoryColor(cat.title)} group-hover:scale-110 transition-transform`}>
                    {getCategoryIcon(cat.title)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[14px]">{cat.title}</h4>
                    <div className="mt-2">{getSeverityBadge(cat.severity)}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Emergency Contacts ── */}
        <section className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 md:p-8 premium-hover">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em]">My Emergency Contacts</h3>
            <button 
              onClick={() => setShowAddContact(!showAddContact)}
              className="w-10 h-10 bg-[#0052CC]/10 dark:bg-[#0052CC]/20 text-[#0052CC] dark:text-blue-400 rounded-full flex items-center justify-center hover:bg-[#0052CC]/20 transition-colors magnetic-button"
            >
              {showAddContact ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showAddContact && (
              <motion.form
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddContact}
                className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden"
              >
                <input type="text" placeholder="Name" required value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-[14px] font-medium" />
                <input type="tel" placeholder="Phone Number" required value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-[14px] font-medium" />
                <input type="text" placeholder="Relation (e.g. Brother)" value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] text-[14px] font-medium" />
                <button type="submit" className="sm:col-span-3 bg-[#0052CC] hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md magnetic-button">
                  Save Contact
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {contacts.map((contact, idx) => (
              <a 
                key={idx}
                href={`tel:${contact.phone}`}
                className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-[#0052CC]/30 transition-colors group premium-hover"
              >
                <div className="w-12 h-12 rounded-full bg-[#0052CC]/10 text-[#0052CC] font-black flex items-center justify-center text-sm border border-[#0052CC]/20 shrink-0">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-slate-900 dark:text-white text-[14px] truncate">{contact.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{contact.relationship} • {contact.phone}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-[#10B981] group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
              </a>
            ))}
            {contacts.length === 0 && !showAddContact && (
              <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-3xl flex flex-col items-center">
                <UserPlus className="w-8 h-8 mb-3 opacity-50" />
                <p className="font-medium text-[14px]">No emergency contacts added.</p>
                <button onClick={() => setShowAddContact(true)} className="mt-2 text-[12px] font-bold text-[#0052CC] hover:underline">Add one now</button>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

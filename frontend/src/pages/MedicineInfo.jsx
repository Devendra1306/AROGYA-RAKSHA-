import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import SEO from '../components/SEO';

const renderCompareMarkdown = (text) => {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  escaped = escaped.replace(/^### (.*?)$/gm, '<h5 class="text-sm font-bold text-primary dark:text-secondary mt-3 mb-1">$1</h5>');
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  escaped = escaped.replace(/^\s*[\-\*]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-primary dark:text-secondary select-none">•</span><span class="flex-1">$1</span></div>');
  
  escaped = escaped.split('\n').map(line => {
    if (line.includes('flex items-start') || line.includes('h5') || line.trim() === '') {
      return line;
    }
    return line + '<br />';
  }).join('\n');
  
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-1 text-xs leading-relaxed" />;
};

export default function MedicineInfo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedMeds, setSavedMeds] = useState([]);

  // Accordion open states for medicine details
  const [expandedSections, setExpandedSections] = useState({
    uses: true,
    dosage: false,
    sideEffects: false,
    precautions: false,
    interactions: false
  });

  // Compare Tool state
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [compareError, setCompareError] = useState('');

  // AI Chat state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    // Load recent searches & saved medicines
    const searches = JSON.parse(localStorage.getItem('recent_med_searches') || '[]');
    setRecentSearches(searches);

    const saved = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
    setSavedMeds(saved);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        triggerSearch();
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const triggerSearch = async () => {
    try {
      const res = await api.get(`/medicine/search?q=${searchQuery}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveToRecent = (medName) => {
    let updated = [medName, ...recentSearches.filter(s => s !== medName)];
    updated = updated.slice(0, 5); // limit to 5
    setRecentSearches(updated);
    localStorage.setItem('recent_med_searches', JSON.stringify(updated));
  };

  const handleSelectMed = async (id, name) => {
    setLoading(true);
    setSearchQuery('');
    setSuggestions([]);
    setComparison(null);
    saveToRecent(name);
    try {
      const res = await api.get(`/medicine/${id}`);
      setSelectedMed(res.data);
      // Reset expanded sections
      setExpandedSections({
        uses: true,
        dosage: false,
        sideEffects: false,
        precautions: false,
        interactions: false
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRagLookup = async (name) => {
    setLoading(true);
    setSearchQuery('');
    setSuggestions([]);
    setComparison(null);
    saveToRecent(name);
    try {
      const res = await api.get(`/medicine/rag-lookup?q=${encodeURIComponent(name)}`);
      setSelectedMed(res.data);
      setExpandedSections({
        uses: true,
        dosage: false,
        sideEffects: false,
        precautions: false,
        interactions: false
      });
    } catch (err) {
      console.error(err);
      alert('RAG Medicine search failed. Please verify that the name matches a valid drug.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!med1 || !med2) return;
    setLoading(true);
    setCompareError('');
    setSelectedMed(null);
    try {
      const res = await api.post('/medicine/compare', { med1, med2 });
      setComparison(res.data);
    } catch (err) {
      setCompareError(err.response?.data?.error || 'Failed to compare medicines. The AI service may be timing out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuestion || !selectedMed) return;
    setChatLoading(true);
    setChatAnswer('');
    try {
      const res = await api.post('/medicine/ask', {
        medicineName: selectedMed.medicineName,
        question: chatQuestion
      });
      setChatAnswer(res.data.answer);
    } catch (err) {
      alert('AI assistant request failed.');
    } finally {
      setChatLoading(false);
    }
  };

  const toggleSaveMedicine = () => {
    if (!selectedMed) return;
    const isBookmarked = savedMeds.some(m => m.medicineName === selectedMed.medicineName);
    let updated;
    if (isBookmarked) {
      updated = savedMeds.filter(m => m.medicineName !== selectedMed.medicineName);
    } else {
      updated = [...savedMeds, {
        medicineName: selectedMed.medicineName,
        genericName: selectedMed.genericName,
        category: selectedMed.category
      }];
    }
    setSavedMeds(updated);
    localStorage.setItem('saved_medicines', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_med_searches');
  };

  const isBookmarked = selectedMed && savedMeds.some(m => m.medicineName === selectedMed.medicineName);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      <SEO 
        title="Medicine Information | Dosage | Uses | Side Effects | Arogya Raksha AI"
        description="Search for medicines to check dosages, uses, side effects, and drug interactions using our comprehensive medical database."
        keywords="Medicine Search, Drug Database, Pharmacy, Side Effects, Drug Interactions, Arogya Raksha"
        canonical="https://arogyarakshaa.vercel.app/medicine-info"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Medicine Information & Drug Database",
          "url": "https://arogyarakshaa.vercel.app/medicine-info"
        }}
      />
      
      {/* Header Panel */}
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-primary dark:text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-primary animate-pulse">pill</span> Medicines
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Explore dosage guidelines, side effects, and drug safety reviews.</p>
      </header>

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Search Bar and Detailed Lookups */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Autocomplete Search Bar Container */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim().length > 1) handleRagLookup(searchQuery.trim());
            }}
            className="relative group"
          >
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim().length > 1) {
                  e.preventDefault();
                  setSuggestions([]);
                  handleRagLookup(searchQuery.trim());
                }
              }}
              className="w-full p-5 pl-14 pr-14 rounded-2xl glass-card dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-sm outline-none text-base md:text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-[#0052CC]/50 focus:ring-4 focus:ring-[#0052CC]/10 dark:focus:border-[#10B981]/50 dark:focus:ring-[#10B981]/10 transition-all premium-hover"
              placeholder="Search medicines (e.g. Paracetamol, Cetirizine)..."
            />
            <span className="absolute left-5 top-5 text-[22px] text-slate-400 select-none material-symbols-outlined group-focus-within:text-[#0052CC] dark:group-focus-within:text-[#10B981] transition-colors">search</span>
            
            {/* Search / Submit button */}
            {searchQuery.trim().length > 1 && (
              <button
                type="submit"
                title="Search"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-[#0052CC] dark:bg-[#10B981] text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
            
            {/* Search autocomplete suggestion list */}
            {(suggestions.length > 0 || searchQuery.length > 1) && (
              <div className="absolute top-[72px] left-0 w-full glass-card dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl z-30 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
                {suggestions.map((s) => (
                  <button 
                    key={s._id}
                    type="button"
                    // Use onMouseDown instead of onClick so it fires BEFORE the input blur
                    // which would otherwise close the dropdown before the click registers
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectMed(s._id, s.medicineName);
                    }}
                    className="w-full text-left p-4 hover:bg-[#0052CC]/5 dark:hover:bg-[#10B981]/5 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 text-sm flex justify-between items-center transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{s.medicineName}</span>
                      <span className="text-[11px] text-slate-500 ml-2 font-medium">({s.genericName})</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{s.category}</span>
                  </button>
                ))}
                <button 
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleRagLookup(searchQuery);
                  }}
                  className="w-full text-left p-4 hover:bg-[#0052CC]/5 dark:hover:bg-[#10B981]/5 cursor-pointer text-[#0052CC] dark:text-[#10B981] font-bold text-sm flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 bg-[#0052CC]/[0.02] dark:bg-[#10B981]/[0.02] transition-colors"
                >
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">science</span> Ask AI about "{searchQuery}"</span>
                  <span className="text-[9px] bg-[#0052CC] text-white dark:bg-[#10B981] px-2.5 py-1 rounded shadow-sm font-extrabold uppercase tracking-widest">Gemini</span>
                </button>
              </div>
            )}
          </form>

          {/* Recent Searches Chips */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl">
              <span className="text-[9px] text-slate-450 uppercase font-extrabold pl-1.5 select-none">Recent:</span>
              <div className="flex flex-wrap gap-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRagLookup(term)}
                    className="text-[10px] bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-primary px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
              <button 
                onClick={clearRecentSearches}
                className="text-[9px] text-red-500 hover:underline pl-2 font-bold"
              >
                Clear
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-[#0052CC] dark:border-t-[#10B981] rounded-full animate-spin"></div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Analyzing Drug Guidelines...</p>
            </div>
          )}

          {/* Empty State */}
          {!selectedMed && !loading && !comparison && (
            <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-5 text-[#0052CC] dark:text-[#10B981] shadow-inner">
                <span className="material-symbols-outlined text-4xl">medical_information</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Search our Medical Database</h3>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">Enter a medicine name above to check dosages, side effects, and potential drug interactions instantly.</p>
            </div>
          )}

          {/* ── Premium Medicine Profile Card ─────────────────────────────────── */}
          {selectedMed && (
            <div className="rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-xl bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Hero Header */}
              <div className="relative bg-gradient-to-br from-[#0052CC] via-[#1a6ef5] to-[#0041a8] dark:from-[#064e3b] dark:via-[#065f46] dark:to-[#047857] p-6 pb-8 overflow-hidden">
                {/* Ambient glow circles */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-white/80 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pill</span>
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.25em]">{selectedMed.category || 'MEDICATION'}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight truncate">{selectedMed.medicineName}</h2>
                    {selectedMed.genericName && (
                      <p className="text-sm text-white/70 font-medium mt-1">Generic: <span className="text-white/90 font-semibold">{selectedMed.genericName}</span></p>
                    )}
                  </div>
                  <button
                    onClick={toggleSaveMedicine}
                    className={`ml-4 flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2 ${
                      isBookmarked
                        ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-500/30'
                        : 'bg-white/15 border-white/20 hover:bg-white/25 backdrop-blur-sm'
                    }`}
                    title={isBookmarked ? 'Remove from saved' : 'Save medicine'}
                  >
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: `'FILL' ${isBookmarked ? 1 : 0}` }}>star</span>
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-4">

                {/* ── Uses & Indications */}
                {selectedMed.uses?.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 dark:bg-blue-950/30">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                      </div>
                      <h3 className="text-[12px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider">Uses & Indications</h3>
                    </div>
                    <div className="px-4 py-3 bg-white dark:bg-slate-900/60 space-y-2">
                      {selectedMed.uses.map((use, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{use}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Dosage */}
                {selectedMed.dosage && (
                  <div className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
                      </div>
                      <h3 className="text-[12px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Dosage Guidelines</h3>
                    </div>
                    <div className="px-4 py-3 bg-white dark:bg-slate-900/60">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedMed.dosage}</p>
                    </div>
                  </div>
                )}

                {/* ── Side Effects */}
                {selectedMed.sideEffects?.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-red-100 dark:border-red-900/40">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/30">
                      <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      </div>
                      <h3 className="text-[12px] font-black text-red-700 dark:text-red-300 uppercase tracking-wider">Possible Side Effects</h3>
                    </div>
                    <div className="px-4 py-3 bg-white dark:bg-slate-900/60">
                      <div className="flex flex-wrap gap-2">
                        {selectedMed.sideEffects.map((side, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-[11px] font-semibold text-red-700 dark:text-red-300">
                            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                            {side}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Precautions */}
                {selectedMed.precautions?.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-amber-100 dark:border-amber-900/40">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-950/30">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>do_not_touch</span>
                      </div>
                      <h3 className="text-[12px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Precautions & Warnings</h3>
                    </div>
                    <div className="px-4 py-3 bg-white dark:bg-slate-900/60 space-y-2">
                      {selectedMed.precautions.map((prec, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-amber-500 text-[14px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{prec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Drug Interactions */}
                {selectedMed.interactions?.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-violet-100 dark:border-violet-900/40">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-50 dark:bg-violet-950/30">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-violet-600 dark:text-violet-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                      </div>
                      <h3 className="text-[12px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-wider">Drug Interactions</h3>
                    </div>
                    <div className="px-4 py-3 bg-white dark:bg-slate-900/60 space-y-2">
                      {selectedMed.interactions.map((inter, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{inter}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Storage Info */}
                {selectedMed.storageInfo && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-slate-400 text-[20px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Storage Information</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedMed.storageInfo}</p>
                    </div>
                  </div>
                )}

                {/* ── Ask AI Helper */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950">
                    <span className="material-symbols-outlined text-[#10B981] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    <h3 className="text-[12px] font-black text-white uppercase tracking-wider">Ask AI Medicine Helper</h3>
                    <span className="ml-auto text-[9px] bg-[#10B981] text-white px-2 py-0.5 rounded font-extrabold tracking-widest">GEMINI</span>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900">
                    <form onSubmit={handleAskSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={chatQuestion}
                        onChange={(e) => setChatQuestion(e.target.value)}
                        className="flex-grow p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-base md:text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] focus:ring-2 focus:ring-[#0052CC]/10 transition-all"
                        placeholder={`e.g. Can I take ${selectedMed.medicineName} with milk?`}
                      />
                      <button type="submit" className="bg-slate-900 dark:bg-[#10B981] text-white font-bold px-4 rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all flex-shrink-0">
                        Ask
                      </button>
                    </form>
                    {chatLoading && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-4 h-4 border-2 border-slate-200 border-t-[#10B981] rounded-full animate-spin" />
                        <p className="text-slate-400 italic text-xs animate-pulse">Consulting clinical manuals...</p>
                      </div>
                    )}
                    {chatAnswer && (
                      <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                        {renderCompareMarkdown(chatAnswer)}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Comparison Page Results Display */}
          {comparison && (
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800 shadow-md space-y-5">
              <h3 className="font-extrabold text-base mb-2 text-center text-primary dark:text-secondary">Medicine Comparison</h3>
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                {/* Medicine 1 */}
                <div className="border-r border-slate-150 dark:border-slate-800 pr-3 space-y-3">
                  <h4 className="text-base font-extrabold text-primary dark:text-secondary">{comparison.medicine1.medicineName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generic: {comparison.medicine1.genericName}</p>
                  <div>
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Uses:</span>
                    <p className="text-xs mt-0.5 leading-snug">{comparison.medicine1.uses?.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide text-red-500">Side Effects:</span>
                    <p className="text-xs mt-0.5 leading-snug text-red-650 dark:text-red-400">{comparison.medicine1.sideEffects?.join(', ')}</p>
                  </div>
                </div>
                {/* Medicine 2 */}
                <div className="pl-3 space-y-3">
                  <h4 className="text-base font-extrabold text-primary dark:text-secondary">{comparison.medicine2.medicineName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generic: {comparison.medicine2.genericName}</p>
                  <div>
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Uses:</span>
                    <p className="text-xs mt-0.5 leading-snug">{comparison.medicine2.uses?.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide text-red-500">Side Effects:</span>
                    <p className="text-xs mt-0.5 leading-snug text-red-650 dark:text-red-400">{comparison.medicine2.sideEffects?.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Potency & Clinical Analysis */}
              {comparison.comparisonText && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-primary dark:text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">balance</span> Potency & Clinical Suitability Analysis
                  </h4>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl leading-relaxed">
                    {renderCompareMarkdown(comparison.comparisonText)}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Scanner & Compare Tools */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Comparison Tool Form Card */}
          <div className="glass-card rounded-3xl p-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-sm premium-hover">
            <h3 className="text-[15px] font-black mb-5 text-slate-800 dark:text-white">Compare Medications</h3>
            
            {compareError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
                <p className="text-xs text-red-650 dark:text-red-400 font-medium leading-relaxed">{compareError}</p>
              </div>
            )}

            <form onSubmit={handleCompareSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 pl-1">First Medicine Name</label>
                <input 
                  type="text" 
                  value={med1}
                  onChange={(e) => setMed1(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base md:text-sm font-medium focus:border-[#0052CC] dark:focus:border-[#10B981] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all"
                  placeholder="Paracetamol"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 pl-1">Second Medicine Name</label>
                <input 
                  type="text" 
                  value={med2}
                  onChange={(e) => setMed2(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base md:text-sm font-medium focus:border-[#0052CC] dark:focus:border-[#10B981] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all"
                  placeholder="Cetirizine"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md magnetic-button hover:shadow-lg mt-2">
                Run Comparison
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

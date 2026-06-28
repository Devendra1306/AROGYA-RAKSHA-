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
    setSelectedMed(null);
    try {
      const res = await api.post('/medicine/compare', { med1, med2 });
      setComparison(res.data);
    } catch (err) {
      alert('Failed to compare medicines.');
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
        title="Medicine Information | Dosage | Uses | Side Effects | Arogya Raksha"
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
          <div className="relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-5 pl-14 rounded-2xl glass-card dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-sm outline-none text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-[#0052CC]/50 focus:ring-4 focus:ring-[#0052CC]/10 dark:focus:border-[#10B981]/50 dark:focus:ring-[#10B981]/10 transition-all premium-hover"
              placeholder="Search medicines (e.g. Paracetamol, Cetirizine)..."
            />
            <span className="absolute left-5 top-5 text-[22px] text-slate-400 select-none material-symbols-outlined group-focus-within:text-[#0052CC] dark:group-focus-within:text-[#10B981] transition-colors">search</span>
            
            {/* Search autocomplete suggestion list */}
            {(suggestions.length > 0 || searchQuery.length > 1) && (
              <div className="absolute top-[72px] left-0 w-full glass-card dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl z-30 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
                {suggestions.map((s) => (
                  <button 
                    key={s._id}
                    onClick={() => handleSelectMed(s._id, s.medicineName)}
                    className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 text-sm flex justify-between items-center transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{s.medicineName}</span>
                      <span className="text-[11px] text-slate-500 ml-2 font-medium">({s.genericName})</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{s.category}</span>
                  </button>
                ))}
                <button 
                  onClick={() => handleRagLookup(searchQuery)}
                  className="w-full text-left p-4 hover:bg-[#0052CC]/5 dark:hover:bg-[#10B981]/5 cursor-pointer text-[#0052CC] dark:text-[#10B981] font-bold text-sm flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 bg-[#0052CC]/[0.02] dark:bg-[#10B981]/[0.02] transition-colors"
                >
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">science</span> Ask AI about "{searchQuery}"</span>
                  <span className="text-[9px] bg-[#0052CC] text-white dark:bg-[#10B981] px-2.5 py-1 rounded shadow-sm font-extrabold uppercase tracking-widest">Gemini</span>
                </button>
              </div>
            )}
          </div>

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

          {/* High Fidelity Collapsible Medicine Details Panel */}
          {selectedMed && (
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              
              {/* Header card details */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-primary dark:text-secondary">{selectedMed.medicineName}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Active Generic ingredient: {selectedMed.genericName}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-3 py-1 rounded-full font-bold text-[10px]">
                    {selectedMed.category}
                  </span>
                  
                  {/* Bookmark star */}
                  <button 
                    onClick={toggleSaveMedicine}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 border transition-all ${isBookmarked ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-250 dark:border-slate-700 text-slate-450 hover:bg-slate-50'}`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">{isBookmarked ? 'star' : 'star_border'}</span>
                      {isBookmarked ? 'Saved' : 'Save'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Collapsible Section 1: Uses */}
              <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('uses')}
                  className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-left"
                >
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-slate-550">assignment</span> Uses & Indications</span>
                  <span>{expandedSections.uses ? '▼' : '▶'}</span>
                </button>
                {expandedSections.uses && (
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-650 dark:text-slate-200">
                      {selectedMed.uses?.map((use, idx) => (
                        <li key={idx} className="leading-relaxed">{use}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Collapsible Section 2: Dosage */}
              {selectedMed.dosage && (
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleSection('dosage')}
                    className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-left"
                  >
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-slate-550">restaurant</span> Dosage Considerations</span>
                    <span>{expandedSections.dosage ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.dosage && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-200">{selectedMed.dosage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Section 3: Side Effects */}
              {selectedMed.sideEffects && (
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleSection('sideEffects')}
                    className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-left text-red-600 dark:text-red-400"
                  >
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-red-500">warning</span> Possible Side Effects</span>
                    <span>{expandedSections.sideEffects ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.sideEffects && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                      <ul className="list-disc list-inside space-y-1.5 text-xs text-red-700 dark:text-red-300">
                        {selectedMed.sideEffects.map((side, idx) => (
                          <li key={idx} className="leading-relaxed">{side}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Section 4: Precautions & Warnings */}
              {selectedMed.precautions && (
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleSection('precautions')}
                    className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-left text-amber-600"
                  >
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-amber-500">block</span> Precautions & Warnings</span>
                    <span>{expandedSections.precautions ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.precautions && (
                    <div className="p-4 bg-amber-50/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                      <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-900 dark:text-amber-300">
                        {selectedMed.precautions?.map((prec, idx) => (
                          <li key={idx} className="leading-relaxed">{prec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Section 5: Drug Interactions */}
              {selectedMed.interactions && (
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleSection('interactions')}
                    className="w-full flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-left"
                  >
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-slate-550">link</span> Drug Interactions</span>
                    <span>{expandedSections.interactions ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.interactions && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                      <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-650 dark:text-slate-200">
                        {selectedMed.interactions.map((inter, idx) => (
                          <li key={idx} className="leading-relaxed">{inter}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Storage details panel */}
              {selectedMed.storageInfo && (
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-slate-400">inventory_2</span> Storage & Manufacturer Details
                  </span>
                  <p className="italic text-slate-600 dark:text-slate-350">{selectedMed.storageInfo}</p>
                </div>
              )}

              {/* Ask AI Medicine Helper */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-5 mt-2">
                <h3 className="font-extrabold text-sm mb-2">Ask Medicine Helper</h3>
                <form onSubmit={handleAskSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    className="flex-grow p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-xs" 
                    placeholder={`e.g. Can I take ${selectedMed.medicineName} with milk?`}
                  />
                  <button type="submit" className="bg-primary hover:opacity-95 text-white font-bold px-4 rounded-xl text-xs">
                    Ask
                  </button>
                </form>
                {chatLoading && <p className="text-slate-400 italic text-[10px] mt-1.5 animate-pulse">Consulting clinical manuals...</p>}
                {chatAnswer && (
                  <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs border border-slate-100 dark:border-slate-800 leading-relaxed font-medium">
                    {renderCompareMarkdown(chatAnswer)}
                  </div>
                )}
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
            <form onSubmit={handleCompareSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 pl-1">First Medicine Name</label>
                <input 
                  type="text" 
                  value={med1}
                  onChange={(e) => setMed1(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium focus:border-[#0052CC] dark:focus:border-[#10B981] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all"
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
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium focus:border-[#0052CC] dark:focus:border-[#10B981] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all"
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

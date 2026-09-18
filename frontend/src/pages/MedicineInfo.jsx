import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import SEO from '../components/SEO';

const renderMarkdown = (text) => {
  if (!text) return null;
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(/^### (.*?)$/gm, '<h5 class="text-xs font-bold text-primary dark:text-secondary uppercase tracking-wider mt-3 mb-1">$1</h5>');
  escaped = escaped.replace(/^## (.*?)$/gm, '<h4 class="text-sm font-bold text-slate-800 dark:text-white mt-3 mb-1">$1</h4>');
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  escaped = escaped.replace(/^\s*[\-\*]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-primary dark:text-secondary select-none font-bold">•</span><span class="flex-1">$1</span></div>');

  escaped = escaped.split('\n').map(line => {
    if (line.includes('flex items-start') || line.includes('<h') || line.trim() === '') {
      return line;
    }
    return line + '<br />';
  }).join('\n');

  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300" />;
};

export default function MedicineInfo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [noResults, setNoResults] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Selected Medicine State
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedMeds, setSavedMeds] = useState([]);

  // Multi-Medicine Interaction Checker State
  const [interactionMeds, setInteractionMeds] = useState([]);
  const [newMedInput, setNewMedInput] = useState('');
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionResults, setInteractionResults] = useState(null);
  const [interactionError, setInteractionError] = useState('');

  // Comparison Tool State
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');

  // AI Assistant State
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatIsEmergency, setChatIsEmergency] = useState(false);
  const [chatError, setChatError] = useState('');

  const searchContainerRef = useRef(null);

  // Load recent & saved medicines from local storage
  useEffect(() => {
    const searches = JSON.parse(localStorage.getItem('recent_med_searches') || '[]');
    setRecentSearches(searches);

    const saved = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
    setSavedMeds(saved);

    // If URL contains a ?med= query parameter, automatically look it up
    const queryParam = searchParams.get('med');
    if (queryParam) {
      handleLookupByName(queryParam);
    }
  }, []);

  // Sync interaction medicines list whenever selectedMed changes
  useEffect(() => {
    if (selectedMed && selectedMed.medicineName) {
      setInteractionMeds(prev => {
        if (!prev.includes(selectedMed.medicineName)) {
          return [selectedMed.medicineName, ...prev.filter(m => m !== selectedMed.medicineName)].slice(0, 4);
        }
        return prev;
      });
      setMed1(selectedMed.medicineName);
    }
  }, [selectedMed]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (searchQuery.trim().length <= 1) {
      setSuggestions([]);
      setNoResults(false);
      setIsDropdownOpen(false);
      setActiveSuggestionIdx(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const res = await api.get(`/medicine/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const list = Array.isArray(res.data) ? res.data : [];
        setSuggestions(list);
        setNoResults(list.length === 0);
        setIsDropdownOpen(true);
        setActiveSuggestionIdx(-1);
      } catch (err) {
        console.error('Search error:', err);
        setSearchError('Unable to search medical database. Check network connection.');
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const saveToRecent = (medName) => {
    if (!medName) return;
    const clean = medName.trim();
    let updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())];
    updated = updated.slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_med_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_med_searches');
  };

  const handleSelectMed = async (id, name) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    setLoadError('');
    setLoading(true);
    setComparison(null);
    setChatAnswer('');
    saveToRecent(name);

    try {
      const res = await api.get(`/medicine/${id}`);
      setSelectedMed(res.data);
      setSearchParams({ med: res.data.medicineName });
    } catch (err) {
      console.warn('ID lookup failed, trying name lookup fallback:', err.message);
      try {
        const res = await api.get(`/medicine/rag-lookup?q=${encodeURIComponent(name)}`);
        setSelectedMed(res.data);
        setSearchParams({ med: res.data.medicineName });
      } catch (ragErr) {
        setLoadError(`Unable to retrieve details for "${name}". Please verify the medicine name or try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLookupByName = async (name) => {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    setIsDropdownOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    setLoadError('');
    setLoading(true);
    setComparison(null);
    setChatAnswer('');
    saveToRecent(cleanName);

    try {
      const res = await api.get(`/medicine/rag-lookup?q=${encodeURIComponent(cleanName)}`);
      setSelectedMed(res.data);
      setSearchParams({ med: res.data.medicineName });
    } catch (err) {
      setLoadError(`Unable to retrieve details for "${cleanName}". Please check the spelling or search by the generic active ingredient.`);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e) => {
    if (!isDropdownOpen && e.key === 'ArrowDown' && suggestions.length > 0) {
      setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < suggestions.length) {
        const item = suggestions[activeSuggestionIdx];
        handleSelectMed(item._id, item.medicineName);
      } else if (searchQuery.trim().length > 1) {
        handleLookupByName(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setActiveSuggestionIdx(-1);
    }
  };

  // Bookmark / Save Medicine
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

  const isBookmarked = selectedMed && savedMeds.some(m => m.medicineName === selectedMed.medicineName);

  // Multi-Medicine Interaction Checker handlers
  const handleAddInteractionMed = (e) => {
    e.preventDefault();
    const clean = newMedInput.trim();
    if (!clean) return;
    if (!interactionMeds.some(m => m.toLowerCase() === clean.toLowerCase())) {
      setInteractionMeds([...interactionMeds, clean]);
    }
    setNewMedInput('');
  };

  const handleRemoveInteractionMed = (nameToRemove) => {
    setInteractionMeds(interactionMeds.filter(m => m !== nameToRemove));
    setInteractionResults(null);
  };

  const handleRunInteractionCheck = async () => {
    if (interactionMeds.length < 2) {
      setInteractionError('Please add at least two medicines to evaluate drug interactions.');
      return;
    }
    setCheckingInteractions(true);
    setInteractionError('');
    setInteractionResults(null);

    try {
      const res = await api.post('/medicine/check-interactions', { medicines: interactionMeds });
      setInteractionResults(res.data);
    } catch (err) {
      setInteractionError('Interaction analysis service is currently busy. Please try again.');
    } finally {
      setCheckingInteractions(false);
    }
  };

  // Medicine Comparison Tool handlers
  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!med1.trim() || !med2.trim()) {
      setCompareError('Please enter two medicine names to run comparison.');
      return;
    }
    setCompareLoading(true);
    setCompareError('');
    setComparison(null);

    try {
      const res = await api.post('/medicine/compare', {
        med1: med1.trim(),
        med2: med2.trim()
      });
      setComparison(res.data);
    } catch (err) {
      setCompareError(err.response?.data?.error || 'Unable to compare medications. Please check medicine names and try again.');
    } finally {
      setCompareLoading(false);
    }
  };

  // AI Assistant Ask Handlers
  const handleAskSubmit = async (e, customPrompt) => {
    if (e) e.preventDefault();
    const q = customPrompt || chatQuestion;
    if (!q || !selectedMed) return;

    setChatLoading(true);
    setChatAnswer('');
    setChatError('');
    setChatIsEmergency(false);

    try {
      const res = await api.post('/medicine/ask', {
        medicineName: selectedMed.medicineName,
        question: q
      });
      setChatAnswer(res.data.answer);
      setChatIsEmergency(!!res.data.isEmergency);
    } catch (err) {
      setChatError('AI medical helper is currently unavailable. Please consult your physician or pharmacist.');
    } finally {
      setChatLoading(false);
    }
  };

  const samplePrompts = [
    'What is this medicine used for?',
    'What are the common side effects?',
    'Can this medicine interact with other medicines?',
    'What precautions should I know?',
    'Explain this medicine in simple language.'
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-100 transition-colors">
      <SEO 
        title={selectedMed ? `${selectedMed.medicineName} (${selectedMed.genericName}) — Uses, Side Effects & Interactions | Arogya Raksha` : "Medicines & Drug Reference | Uses, Safety & Interactions | Arogya Raksha"}
        description="Search clinical medicine profiles, active ingredients, indications, side effects, drug-drug interaction checker, and safe dosage guidelines."
        keywords="Medicine Search, Drug Interactions, Active Pharmaceutical Ingredient, Side Effects, OpenFDA, Arogya Raksha"
        canonical="https://arogyarakshaa.vercel.app/medicine-info"
      />

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Page Header & Trust Banner ─────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-secondary/15 flex items-center justify-center text-primary dark:text-secondary">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Medicines & Drug Reference
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified clinical indications, side effects, precautions, and multi-drug interaction analysis.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              OpenFDA & Clinical AI Refined
            </span>
          </div>
        </header>

        {/* ── Section 1: Search Component ─────────────────────────────────── */}
        <section aria-label="Medicine Search" className="space-y-3">
          <div ref={searchContainerRef} className="relative w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim().length > 1) {
                  handleLookupByName(searchQuery.trim());
                }
              }}
              className="relative flex items-center"
              role="search"
            >
              <span className="absolute left-4.5 text-slate-400 dark:text-slate-500 pointer-events-none select-none material-symbols-outlined text-[24px]">
                search
              </span>

              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0 || (searchQuery.trim().length > 1 && noResults)) {
                    setIsDropdownOpen(true);
                  }
                }}
                className="w-full py-4.5 pl-13 pr-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm outline-none text-base md:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:focus:border-secondary dark:focus:ring-secondary/10 transition-all"
                placeholder="Search by brand name or generic active ingredient (e.g. Glimepiride, Paracetamol, Lipitor)..."
                aria-label="Search medicines by brand or generic ingredient"
                aria-autocomplete="list"
                aria-expanded={isDropdownOpen}
              />

              <div className="absolute right-3 flex items-center gap-2">
                {searching && (
                  <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-primary dark:border-t-secondary rounded-full animate-spin"></div>
                )}
                {searchQuery.trim().length > 1 && (
                  <button
                    type="submit"
                    className="h-10 px-4 flex items-center gap-1.5 rounded-xl bg-primary dark:bg-secondary text-white font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all"
                  >
                    <span>Search</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {isDropdownOpen && (
              <div 
                role="listbox" 
                className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto"
              >
                {suggestions.map((item, idx) => {
                  const isFda = String(item._id).startsWith('fda_');
                  const isHighlighted = idx === activeSuggestionIdx;
                  return (
                    <div
                      key={item._id || idx}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setActiveSuggestionIdx(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectMed(item._id, item.medicineName);
                      }}
                      className={`p-3.5 px-4 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isHighlighted 
                          ? 'bg-primary/8 dark:bg-secondary/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                          isFda 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {isFda ? 'FDA' : 'CLINICAL'}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.medicineName}
                          </span>
                          {item.genericName && item.genericName !== 'Unknown Generic' && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                              • {item.genericName}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.category && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md flex-shrink-0">
                          {item.category.length > 24 ? item.category.slice(0, 24) + '…' : item.category}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Direct AI / RAG query prompt */}
                {searchQuery.trim().length > 1 && (
                  <div
                    role="option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleLookupByName(searchQuery.trim());
                    }}
                    className="p-3.5 px-4 bg-slate-50/80 dark:bg-slate-900 cursor-pointer flex items-center justify-between text-primary dark:text-secondary font-bold text-xs hover:bg-primary/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">science</span>
                      Query clinical AI model for "{searchQuery}"
                    </span>
                    <span className="text-[10px] uppercase tracking-wider bg-primary/10 dark:bg-secondary/15 px-2 py-0.5 rounded">
                      Refine with AI
                    </span>
                  </div>
                )}

                {/* Empty State when no results matched */}
                {noResults && !searching && (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">search_off</span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No exact matches found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try searching by generic active ingredient (e.g. Cetirizine, Paracetamol, Atorvastatin) or check spelling.
                    </p>
                  </div>
                )}

                {searchError && (
                  <div className="p-3.5 px-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {searchError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Secondary Recent Searches Bar */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Recent:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleLookupByName(term)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:border-primary dark:hover:border-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-[11px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-semibold ml-1 cursor-pointer transition-colors"
                title="Clear recent searches"
              >
                Clear
              </button>
            </div>
          )}
        </section>

        {/* Global Loading Spinner / Skeleton */}
        {loading && (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-slate-200 dark:border-slate-800 border-t-primary dark:border-t-secondary rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">
              Retrieving OpenFDA clinical label & refining with Gemini...
            </p>
          </div>
        )}

        {/* Global Lookup Error */}
        {loadError && !loading && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 mt-0.5">error</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Lookup Error</h4>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">{loadError}</p>
            </div>
            <button 
              onClick={() => setLoadError('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Initial Empty State (when no med is selected and not loading) */}
        {!selectedMed && !loading && !comparison && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 text-center border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-secondary/15 flex items-center justify-center text-primary dark:text-secondary mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">clinical_notes</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Search Any Medicine to View Verified Clinical Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
              Access authentic FDA label summaries, generic active ingredients, side effect classifications, contraindications, and multi-drug interaction safety checks.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-xs font-semibold text-slate-400">Popular lookups:</span>
              {['Glimepiride', 'Atorvastatin', 'Cetirizine', 'Paracetamol', 'Metformin'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleLookupByName(item)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-secondary/15 dark:hover:text-secondary transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Two-Column Desktop Layout (Left ~68%, Right ~32%) ──────────────── */}
        {selectedMed && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT COLUMN: Core Clinical Hierarchy (~68%) ────────────────── */}
            <div className="lg:col-span-8 space-y-6">

              {/* 1. Medicine Overview Header */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary via-[#005FE8] to-[#0047B3] dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 sm:p-8 text-white relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 text-white/80">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pill</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{selectedMed.category || 'Therapeutic Agent'}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {selectedMed.medicineName}
                      </h2>
                      {selectedMed.genericName && (
                        <p className="text-sm text-white/85 font-medium mt-1">
                          Generic / Active Ingredient: <span className="text-white font-bold underline decoration-white/30">{selectedMed.genericName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSaveMedicine}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isBookmarked 
                            ? 'bg-amber-400 text-slate-900 shadow-md' 
                            : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm'
                        }`}
                        title={isBookmarked ? 'Saved to bookmarks' : 'Save medicine'}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${isBookmarked ? 1 : 0}` }}>star</span>
                        <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/15 text-xs">
                    {selectedMed.genericName && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-white font-medium flex items-center gap-1">
                        <span className="text-white/70">API:</span> {selectedMed.genericName}
                      </span>
                    )}
                    {selectedMed.category && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-white font-medium flex items-center gap-1">
                        <span className="text-white/70">Class:</span> {selectedMed.category}
                      </span>
                    )}
                    {selectedMed.route && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-white font-medium flex items-center gap-1">
                        <span className="text-white/70">Route:</span> {selectedMed.route}
                      </span>
                    )}
                    {selectedMed.prescriptionStatus && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">prescriptions</span>
                        {selectedMed.prescriptionStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Source & Verification Metadata Bar */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-secondary text-[16px]">verified</span>
                    <span>Information source: <strong>{selectedMed.source || 'U.S. FDA Drug Label Database & Verified Clinical Manuals'}</strong></span>
                  </div>
                  {selectedMed.lastUpdated && (
                    <span>Last updated: <strong>{selectedMed.lastUpdated}</strong></span>
                  )}
                </div>
              </div>

              {/* 2. Safe Dosage Information Block (Requirement 3: NO unsafe dosage instruction) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary dark:text-secondary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
                  <span>Dosage & Administration Guidelines</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase">
                    Reference Only
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Dosage and duration depend on the specific condition, patient age, body weight, kidney/liver status, and concurrent medications. Follow the prescription or official product label provided by your physician or pharmacist. Consult a qualified healthcare professional if you are unsure.
                  </p>
                  {selectedMed.dosage && (
                    <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                      <span className="font-bold text-slate-900 dark:text-white">Published Clinical Reference Guideline: </span>
                      <span>{selectedMed.dosage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Uses & Indications (Requirement 4) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary dark:text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                  <span>Approved & Common Clinical Indications</span>
                </div>

                {selectedMed.uses && selectedMed.uses.length > 0 ? (
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {selectedMed.uses.map((use, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-secondary mt-2 flex-shrink-0"></span>
                        <span className="leading-relaxed">{use}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Verified indication information is currently unavailable.
                  </p>
                )}
              </div>

              {/* 4. Side Effects: Common vs Serious (Requirement 5) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <span>Side Effects & Adverse Reactions</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Tiered Safety Profile</span>
                </div>

                {/* Common / Mild Side Effects */}
                <div>
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Common / Mild Effects
                  </h4>
                  {selectedMed.sideEffects && selectedMed.sideEffects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMed.sideEffects.map((effect, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-medium"
                        >
                          {effect}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No common side effects documented in current summary.</p>
                  )}
                </div>

                {/* Serious Reactions Requiring Urgent Attention */}
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
                    <span className="material-symbols-outlined text-sm">emergency</span>
                    <span>Serious Reactions Requiring Urgent Medical Attention</span>
                  </div>
                  <p className="text-xs text-red-700/90 dark:text-red-300 leading-relaxed">
                    Stop taking and seek immediate emergency evaluation if you experience symptoms such as facial/throat swelling, difficulty breathing or wheezing, severe skin rash or blistering, chest tightness, severe dizziness, or signs of liver distress (yellowing of eyes/skin).
                  </p>
                  <p className="text-[11px] font-bold text-red-800 dark:text-red-300">
                    Seek urgent medical attention for severe or unexpected reactions (Dial 108 / 112 or visit the nearest emergency hospital).
                  </p>
                </div>
              </div>

              {/* 5. Precautions & Clinical Warnings (Requirement 6) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_maybe</span>
                  <span>Precautions & Safety Warnings</span>
                </div>

                {selectedMed.precautions && selectedMed.precautions.length > 0 ? (
                  <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {selectedMed.precautions.map((prec, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850">
                        <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0">info</span>
                        <p className="leading-relaxed">{prec}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No special warnings recorded for this item.</p>
                )}

                {selectedMed.contraindications && selectedMed.contraindications.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <h5 className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Known Contraindications
                    </h5>
                    <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {selectedMed.contraindications.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 6. "Who Should Be Careful?" Section (Requirement 8) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
                    <span>Who Should Be Careful?</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Pre-administration Advisory</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white mb-1">
                      <span className="material-symbols-outlined text-sm text-indigo-500">pregnant_woman</span>
                      <span>Pregnancy & Planning</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      May require additional medical advice. Potential fetal considerations depend on the trimester and clinical necessity.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white mb-1">
                      <span className="material-symbols-outlined text-sm text-indigo-500">child_friendly</span>
                      <span>Breastfeeding</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Consult a physician regarding transmission into breast milk and safer therapeutic alternatives.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white mb-1">
                      <span className="material-symbols-outlined text-sm text-indigo-500">vital_signs</span>
                      <span>Kidney / Liver Conditions</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Altered organ clearance may necessitate dose adjustments or routine biochemical monitoring.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white mb-1">
                      <span className="material-symbols-outlined text-sm text-indigo-500">elderly</span>
                      <span>Children & Older Adults</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Pediatric formulations and geriatric sensitivity require strict physician-calculated dosing schedules.
                    </p>
                  </div>
                </div>
              </div>

              {/* 7. Drug Interactions & Multi-Medicine Interaction Checker (Requirement 7) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-violet-600 dark:text-violet-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>sync_problem</span>
                    <span>Drug Interactions & Concurrent Safety</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Multi-Drug Analysis</span>
                </div>

                {/* Documented interactions for current medicine */}
                {selectedMed.interactions && selectedMed.interactions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Primary Known Interacting Substances:
                    </h4>
                    <div className="space-y-1.5">
                      {selectedMed.interactions.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 text-xs text-slate-700 dark:text-slate-300">
                          <span className="material-symbols-outlined text-violet-500 text-sm mt-0.5">link</span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-Medicine Interaction Checker Tool */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Check Another Medicine for Interactions
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Add any other prescriptions, OTC drugs, or supplements to analyze clinical interaction risk.
                    </p>
                  </div>

                  {/* Medicine Tags Container */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Current Medicines In Checklist ({interactionMeds.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {interactionMeds.map((med, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {med}
                          <button
                            type="button"
                            onClick={() => handleRemoveInteractionMed(med)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                            title={`Remove ${med}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={handleAddInteractionMed} className="flex gap-2 pt-1">
                      <input 
                        type="text"
                        value={newMedInput}
                        onChange={(e) => setNewMedInput(e.target.value)}
                        placeholder="Add another medicine (e.g. Warfarin, Aspirin)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-primary dark:focus:border-secondary"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        + Add Medicine
                      </button>
                    </form>
                  </div>

                  {/* Run Check Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={interactionMeds.length < 2 || checkingInteractions}
                      onClick={handleRunInteractionCheck}
                      className="px-5 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {checkingInteractions ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Analyzing Clinical Pharmacokinetics...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">security</span>
                          <span>Check Interactions</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {interactionMeds.length < 2 ? 'Requires at least 2 medications' : 'Ready to evaluate'}
                    </span>
                  </div>

                  {interactionError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400">
                      {interactionError}
                    </div>
                  )}

                  {/* Interaction Results Display */}
                  {interactionResults && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                          Interaction Evaluation Report
                        </h5>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          interactionResults.hasInteractions
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {interactionResults.hasInteractions ? 'Interactions Identified' : 'No Critical Interactions'}
                        </span>
                      </div>

                      {interactionResults.summary && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {interactionResults.summary}
                        </p>
                      )}

                      {interactionResults.interactions?.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {interactionResults.interactions.map((item, i) => (
                            <div key={i} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">{item.pair}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  item.severity === 'Major' 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                                    : (item.severity === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300')
                                }`}>
                                  {item.severity} Severity
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
                              {item.action && (
                                <p className="text-[11px] text-primary dark:text-secondary font-semibold pt-0.5">
                                  Action: {item.action}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Required Disclaimer */}
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800 leading-normal">
                        {interactionResults.disclaimer || 'The absence of a displayed interaction does not mean no interaction exists. Always verify all concurrent medications, supplements, and herbal products with your doctor or pharmacist.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Ask Arogya AI About This Medicine (Requirement 10: Moved closer to details) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Ask Arogya AI about this medicine
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Get simple explanations about uses, precautions, side effects, and interactions.
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-primary/10 dark:bg-secondary/15 text-primary dark:text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:inline">
                    Clinical AI
                  </span>
                </div>

                {/* Clickable Sample Prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {samplePrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setChatQuestion(prompt);
                        handleAskSubmit(null, prompt);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-secondary/15 dark:hover:text-secondary text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <form onSubmit={(e) => handleAskSubmit(e)} className="flex gap-2">
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder={`Ask anything about ${selectedMed.medicineName} (e.g. Can I take it with food?)...`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-primary dark:focus:border-secondary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatQuestion.trim()}
                    className="px-4 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0 cursor-pointer"
                  >
                    {chatLoading ? 'Consulting...' : 'Ask AI'}
                  </button>
                </form>

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse pt-1">
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-primary dark:border-t-secondary rounded-full animate-spin"></div>
                    <span>Consulting verified clinical pharmacology manuals...</span>
                  </div>
                )}

                {chatError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{chatError}</p>
                )}

                {chatAnswer && (
                  <div className={`p-4 rounded-xl border leading-relaxed space-y-2 animate-in fade-in duration-200 ${
                    chatIsEmergency 
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60' 
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                  }`}>
                    {renderMarkdown(chatAnswer)}
                    <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800 italic">
                      AI-generated explanation based on available medicine information. Educational only — not individualized clinical diagnosis.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* ── RIGHT COLUMN: Quick Facts, Compare, Saved & Safety (~32%) ──── */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

              {/* 1. Quick Medicine Facts Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary dark:text-secondary text-xl">fact_check</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Quick Clinical Facts
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Name</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedMed.medicineName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Ingredient</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedMed.genericName || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pharmacological Class</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedMed.category || 'General Therapeutic'}</span>
                  </div>

                  {selectedMed.storageInfo && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Storage Conditions</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-snug">{selectedMed.storageInfo}</span>
                    </div>
                  )}

                  {selectedMed.brandNames?.length > 1 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Common Brand Equivalents</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-snug">
                        {selectedMed.brandNames.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Compare Medications Tool (Requirement 9) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary dark:text-secondary text-xl">compare_arrows</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Compare Medications
                  </h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Compare two medicines side-by-side to understand clinical differences, active ingredients, and safety indications.
                </p>

                {compareError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400">
                    {compareError}
                  </div>
                )}

                <form onSubmit={handleCompareSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Medicine 1
                    </label>
                    <input 
                      type="text"
                      value={med1}
                      onChange={(e) => setMed1(e.target.value)}
                      placeholder="e.g. Glimepiride"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-primary dark:focus:border-secondary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Medicine 2
                    </label>
                    <input 
                      type="text"
                      value={med2}
                      onChange={(e) => setMed2(e.target.value)}
                      placeholder="e.g. Metformin"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-primary dark:focus:border-secondary"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={compareLoading || !med1.trim() || !med2.trim()}
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {compareLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                        <span>Comparing Profiles...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">balance</span>
                        <span>Run Factual Comparison</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* 3. Saved Medicines Quick Access */}
              {savedMeds.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      Saved Medicines ({savedMeds.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                    {savedMeds.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleLookupByName(item.medicineName)}
                        className="py-2 flex items-center justify-between cursor-pointer hover:text-primary transition-colors text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.medicineName}</span>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ── Comparison Results Overlay/Card (Requirement 9) ────────────────── */}
        {comparison && !loading && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-secondary">balance</span>
                  Clinical Comparison: {comparison.medicine1?.medicineName} vs {comparison.medicine2?.medicineName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Factual side-by-side pharmacological comparison.
                </p>
              </div>
              <button 
                onClick={() => setComparison(null)}
                className="self-start sm:self-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-semibold cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

            {/* Side-by-Side (Desktop) / Stacked (Mobile) Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
              
              {/* Medicine A Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="border-b border-slate-200/70 dark:border-slate-800 pb-2">
                  <h4 className="text-base font-black text-primary dark:text-secondary">
                    {comparison.medicine1?.medicineName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Active Ingredient: <strong>{comparison.medicine1?.genericName}</strong>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Therapeutic Class</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{comparison.medicine1?.category}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Common Indications</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">
                    {comparison.medicine1?.uses?.join(', ') || 'Consult doctor for approved uses'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Common Side Effects</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">
                    {comparison.medicine1?.sideEffects?.join(', ') || 'Refer to package leaflet'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Major Precautions</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">
                    {comparison.medicine1?.precautions?.join(', ') || 'Follow clinical guidance'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference Dosage (Not Individualized)</span>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    {comparison.medicine1?.dosage || 'Follow physician prescription'}
                  </p>
                </div>
              </div>

              {/* Medicine B Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="border-b border-slate-200/70 dark:border-slate-800 pb-2">
                  <h4 className="text-base font-black text-primary dark:text-secondary">
                    {comparison.medicine2?.medicineName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Active Ingredient: <strong>{comparison.medicine2?.genericName}</strong>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Therapeutic Class</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{comparison.medicine2?.category}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Common Indications</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">
                    {comparison.medicine2?.uses?.join(', ') || 'Consult doctor for approved uses'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Common Side Effects</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">
                    {comparison.medicine2?.sideEffects?.join(', ') || 'Refer to package leaflet'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Major Precautions</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">
                    {comparison.medicine2?.precautions?.join(', ') || 'Follow clinical guidance'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference Dosage (Not Individualized)</span>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    {comparison.medicine2?.dosage || 'Follow physician prescription'}
                  </p>
                </div>
              </div>

            </div>

            {/* Objective Comparative Analysis Text */}
            {comparison.comparisonText && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary dark:text-secondary text-base">analytics</span>
                  Objective Comparative Pharmacological Analysis
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {renderMarkdown(comparison.comparisonText)}
                </div>
              </div>
            )}

            {/* Required Disclaimer for Comparison */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-200">
              <strong>Clinical Selection Notice:</strong> Which medicine is appropriate depends on the individual's condition and medical history. Consult a healthcare professional.
            </div>
          </div>
        )}

        {/* ── Section 11: Medical Safety Notice (Requirement 11) ───────────────── */}
        <footer className="mt-12 p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm text-amber-500">health_and_safety</span>
            <span>Medical Information Only</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Arogya Raksha provides educational healthcare information and does not replace professional medical diagnosis, prescription, or treatment. Always follow your doctor's or pharmacist's advice. If you suspect an acute adverse drug event or overdose, seek emergency care immediately.
          </p>
        </footer>

      </div>
    </div>
  );
}

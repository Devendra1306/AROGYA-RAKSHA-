import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

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
  
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-1 text-label-md" />;
};

export default function MedicineInfo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compare Tool state
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [comparison, setComparison] = useState(null);

  // AI Chat state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);



  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        triggerSearch();
      } else {
        setSuggestions([]);
      }
    }, 400); // 400ms debounce delay

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

  const handleSelectMed = async (id) => {
    setLoading(true);
    setSearchQuery('');
    setSuggestions([]);
    setComparison(null);
    try {
      const res = await api.get(`/medicine/${id}`);
      setSelectedMed(res.data);
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
    try {
      const res = await api.get(`/medicine/rag-lookup?q=${encodeURIComponent(name)}`);
      setSelectedMed(res.data);
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



  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <header className="mb-stack-md">
        <h1 className="text-3xl font-bold text-primary dark:text-secondary">💊 Medicine Info</h1>
        <p className="text-on-surface-variant dark:text-slate-300">Trusted search portal for medication details, dosage guidance, and warnings.</p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Left Column - Search & details */}
        <div className="lg:col-span-8 space-y-gutter">
          
          {/* Autocomplete Search Bar */}
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 rounded-2xl border border-outline-variant bg-white dark:bg-slate-800 shadow-md outline-none text-label-md focus:border-primary"
              placeholder="Search medicines by name or generic category (e.g. Paracetamol)..."
            />
            {(suggestions.length > 0 || searchQuery.length > 1) && (
              <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-800 border border-outline-variant/35 rounded-2xl shadow-xl z-20 overflow-hidden">
                {suggestions.map((s) => (
                  <div 
                    key={s._id}
                    onClick={() => handleSelectMed(s._id)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-outline-variant/10 text-label-md"
                  >
                    <span className="font-bold">{s.medicineName}</span> ({s.genericName}) — <span className="text-outline text-xs">{s.category}</span>
                  </div>
                ))}
                <div 
                  onClick={() => handleRagLookup(searchQuery)}
                  className="p-4 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-primary dark:text-secondary font-bold text-label-md flex items-center justify-between border-t border-outline-variant/10"
                >
                  <span>🔍 Run AI / RAG query for "{searchQuery}"</span>
                  <span className="text-[10px] bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary px-2.5 py-1 rounded-full font-bold">Powered by Gemini</span>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Details Card */}
          {selectedMed && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md space-y-6">
              
              <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary dark:text-secondary">{selectedMed.medicineName}</h2>
                  <p className="text-label-md text-on-surface-variant dark:text-slate-300 mt-1">Generic Name: {selectedMed.genericName}</p>
                </div>
                <div className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4 py-1.5 rounded-full font-bold text-label-sm">
                  {selectedMed.category}
                </div>
              </div>

              {/* Uses */}
              <div>
                <h4 className="font-bold text-lg mb-2">Uses & Indications</h4>
                <ul className="list-disc list-inside space-y-1 text-label-md">
                  {selectedMed.uses?.map((use, idx) => (
                    <li key={idx}>{use}</li>
                  ))}
                </ul>
              </div>

              {/* Dosage */}
              {selectedMed.dosage && (
                <div>
                  <h4 className="font-bold text-lg mb-1">Dosage Considerations</h4>
                  <p className="text-label-md leading-relaxed">{selectedMed.dosage}</p>
                </div>
              )}

              {/* Side effects */}
              {selectedMed.sideEffects && (
                <div>
                  <h4 className="font-bold text-lg mb-2 text-red-600">Possible Side Effects</h4>
                  <ul className="list-disc list-inside space-y-1 text-label-md">
                    {selectedMed.sideEffects.map((side, idx) => (
                      <li key={idx}>{side}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warning Banner */}
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100/50 p-4 rounded-xl text-red-800 dark:text-red-300 text-label-md">
                <h4 className="font-bold mb-1">⚠️ Clinical Precautions & Warnings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedMed.precautions?.map((prec, idx) => (
                    <li key={idx}>{prec}</li>
                  ))}
                </ul>
              </div>

              {/* Interactions */}
              {selectedMed.interactions && (
                <div>
                  <h4 className="font-bold text-lg mb-2">Drug Interactions</h4>
                  <ul className="list-disc list-inside space-y-1 text-label-md">
                    {selectedMed.interactions.map((inter, idx) => (
                      <li key={idx}>{inter}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Storage & Manufacturer Info */}
              {selectedMed.storageInfo && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-outline-variant/20 text-label-md">
                  <h4 className="font-bold mb-1">📦 Storage & Manufacturer Details:</h4>
                  <p className="italic text-on-surface-variant dark:text-slate-300">{selectedMed.storageInfo}</p>
                </div>
              )}

              {/* AI query box specific for this medicine */}
              <div className="border-t border-outline-variant/30 pt-6">
                <h3 className="font-bold text-lg mb-3">Ask Medicine Assistant</h3>
                <form onSubmit={handleAskSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    className="flex-grow p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 outline-none text-label-md" 
                    placeholder={`Ask a question (e.g. Can I take ${selectedMed.medicineName} on an empty stomach?)...`}
                  />
                  <button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-6 rounded-xl text-label-sm">
                    Ask AI
                  </button>
                </form>
                {chatLoading && <p className="text-outline italic text-label-sm mt-2">Checking guidelines...</p>}
                {chatAnswer && (
                  <div className="mt-3 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-label-md border leading-relaxed">
                    {chatAnswer}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Comparison Page display */}
          {comparison && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md space-y-6 animate-fadeIn">
              <h3 className="font-bold text-xl mb-6 text-center text-primary dark:text-secondary">Medicine Comparison</h3>
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-outline-variant/20">
                {/* Medicine 1 */}
                <div className="border-r border-outline-variant/30 pr-4 space-y-4">
                  <h4 className="text-2xl font-extrabold text-primary dark:text-secondary">{comparison.medicine1.medicineName}</h4>
                  <p className="text-label-md text-outline">Generic: {comparison.medicine1.genericName}</p>
                  <div>
                    <span className="font-bold text-label-sm uppercase text-outline">Uses:</span>
                    <p className="text-label-md mt-1">{comparison.medicine1.uses?.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-bold text-label-sm uppercase text-outline">Side Effects:</span>
                    <p className="text-label-md mt-1">{comparison.medicine1.sideEffects?.join(', ')}</p>
                  </div>
                </div>
                {/* Medicine 2 */}
                <div className="pl-4 space-y-4">
                  <h4 className="text-2xl font-extrabold text-primary dark:text-secondary">{comparison.medicine2.medicineName}</h4>
                  <p className="text-label-md text-outline">Generic: {comparison.medicine2.genericName}</p>
                  <div>
                    <span className="font-bold text-label-sm uppercase text-outline">Uses:</span>
                    <p className="text-label-md mt-1">{comparison.medicine2.uses?.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-bold text-label-sm uppercase text-outline">Side Effects:</span>
                    <p className="text-label-md mt-1">{comparison.medicine2.sideEffects?.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Potency & Clinical Analysis */}
              {comparison.comparisonText && (
                <div className="space-y-3">
                  <h4 className="font-bold text-lg text-primary dark:text-secondary flex items-center gap-2">
                    ⚖️ Potency & Clinical Suitability Analysis
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-outline-variant/30 rounded-xl leading-relaxed">
                    {renderCompareMarkdown(comparison.comparisonText)}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column - Scanner & Compare tools */}
        <div className="lg:col-span-4 space-y-gutter">
          


          {/* Comparison Tool Form */}
          <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
            <h3 className="text-lg font-bold mb-4">Compare Medications</h3>
            <form onSubmit={handleCompareSubmit} className="space-y-4">
              <div>
                <label className="block text-label-sm text-outline mb-1">First Medicine Name</label>
                <input 
                  type="text" 
                  value={med1}
                  onChange={(e) => setMed1(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900"
                  placeholder="Paracetamol"
                  required
                />
              </div>
              <div>
                <label className="block text-label-sm text-outline mb-1">Second Medicine Name</label>
                <input 
                  type="text" 
                  value={med2}
                  onChange={(e) => setMed2(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900"
                  placeholder="Cetirizine"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all">
                Run Comparison
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

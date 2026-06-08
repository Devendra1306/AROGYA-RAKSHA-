import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

// Render AI markdown responses with proper structure
const renderMarkdown = (text) => {
  if (!text) return null;
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  escaped = escaped.replace(/^### (.*?)$/gm, '<h4 class="text-base font-bold text-primary dark:text-secondary mt-3 mb-1.5">$1</h4>');
  escaped = escaped.replace(/^## (.*?)$/gm, '<h3 class="text-base font-bold text-primary dark:text-secondary mt-3 mb-1.5">$1</h3>');
  escaped = escaped.replace(/^# (.*?)$/gm, '<h2 class="text-lg font-bold text-primary dark:text-secondary mt-3 mb-1.5">$1</h2>');
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  escaped = escaped.replace(/^\s*[-*]\s+(.*?)$/gm, '<div class="flex items-start gap-1.5 my-1 text-xs"><span class="text-emerald-500 font-bold select-none">•</span><span class="flex-1">$1</span></div>');
  escaped = escaped.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<div class="flex items-start gap-1.5 my-1 text-xs"><span class="text-primary dark:text-secondary font-bold min-w-[15px]">$1.</span><span class="flex-1">$2</span></div>');
  escaped = escaped.replace(/(⚠️.*?)(?:<br \/?>|$)/g, '<div class="my-1.5 p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl text-amber-800 dark:text-amber-300 text-xs">$1</div>');
  
  escaped = escaped.split('\n').map(line => {
    if (line.includes('flex items-start') || line.includes('<h') || line.includes('⚠️') || line.trim() === '') {
      return line;
    }
    return line ? line + '<br />' : '<br />';
  }).join('\n');
  
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-1 text-xs leading-relaxed" />;
};

export default function HomeRemedies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularConditions, setPopularConditions] = useState([]);
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [loading, setLoading] = useState(false);

  // Remedy Bookmark state
  const [savedRemedies, setSavedRemedies] = useState([]);

  // Step state for active remedy preparation steps (maps index to active step)
  const [activeRemedySteps, setActiveRemedySteps] = useState({});

  // Kitchen ingredients state
  const [kitchenIngredients, setKitchenIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [kitchenSuggestions, setKitchenSuggestions] = useState('');
  const [kitchenLoading, setKitchenLoading] = useState(false);

  useEffect(() => {
    fetchPopular();
    const saved = JSON.parse(localStorage.getItem('saved_remedies') || '[]');
    setSavedRemedies(saved);
  }, []);

  const fetchPopular = async () => {
    try {
      const res = await api.get('/remedies/popular');
      setPopularConditions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setSelectedRemedy(null);
    setKitchenSuggestions('');
    try {
      const res = await api.post('/remedies/search', { query: searchQuery });
      setSelectedRemedy(res.data);
      setActiveRemedySteps({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRemedy = async (condition) => {
    setLoading(true);
    setSearchQuery('');
    setKitchenSuggestions('');
    try {
      const res = await api.post('/remedies/search', { query: condition });
      setSelectedRemedy(res.data);
      setActiveRemedySteps({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (!ingredientInput.trim()) return;
    if (!kitchenIngredients.includes(ingredientInput.trim())) {
      setKitchenIngredients([...kitchenIngredients, ingredientInput.trim()]);
    }
    setIngredientInput('');
  };

  const handleRemoveIngredient = (ing) => {
    setKitchenIngredients(kitchenIngredients.filter(i => i !== ing));
  };

  const handleKitchenSubmit = async () => {
    if (kitchenIngredients.length === 0) return;
    setKitchenLoading(true);
    setKitchenSuggestions('');
    setSelectedRemedy(null);
    try {
      const res = await api.post('/remedies/ingredients', { ingredients: kitchenIngredients });
      setKitchenSuggestions(res.data.suggestions);
    } catch (err) {
      alert('Kitchen remedies check failed.');
    } finally {
      setKitchenLoading(false);
    }
  };

  const toggleSaveRemedy = (remName, ingredients) => {
    if (!selectedRemedy) return;
    const isBookmarked = savedRemedies.some(r => r.name === remName);
    let updated;
    if (isBookmarked) {
      updated = savedRemedies.filter(r => r.name !== remName);
    } else {
      updated = [...savedRemedies, {
        condition: selectedRemedy.condition,
        name: remName,
        ingredients: ingredients || []
      }];
    }
    setSavedRemedies(updated);
    localStorage.setItem('saved_remedies', JSON.stringify(updated));
  };

  const nextPreparationStep = (remedyIdx, maxSteps) => {
    const currentStep = activeRemedySteps[remedyIdx] || 0;
    if (currentStep < maxSteps - 1) {
      setActiveRemedySteps({
        ...activeRemedySteps,
        [remedyIdx]: currentStep + 1
      });
    }
  };

  const prevPreparationStep = (remedyIdx) => {
    const currentStep = activeRemedySteps[remedyIdx] || 0;
    if (currentStep > 0) {
      setActiveRemedySteps({
        ...activeRemedySteps,
        [remedyIdx]: currentStep - 1
      });
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-6 text-slate-800 dark:text-slate-100 transition-colors animate-fade-in">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-primary dark:text-secondary flex items-center gap-2">
          🌱 Home Remedies
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Explore natural preparation guides and AI kitchen ingredients matchers.</p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Search Results & Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md outline-none text-xs focus:border-primary transition-all"
              placeholder="Describe symptom (e.g. sore throat, acidity, bloat)..."
            />
            <button type="submit" className="bg-primary hover:opacity-95 text-white px-5 rounded-2xl font-bold text-xs shadow-sm">
              Search
            </button>
          </form>

          {loading && (
            <div className="flex flex-col justify-center items-center py-20 gap-2">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Matching Care Guides...</p>
            </div>
          )}

          {/* Remedy Details Display */}
          {selectedRemedy && (
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-primary dark:text-secondary">{selectedRemedy.condition} Care Plan</h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Potential causes: {selectedRemedy.causes?.join(', ')}</p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                  🟢 Mild Symptom
                </span>
              </div>

              {/* Remedies list */}
              <div className="space-y-5">
                {selectedRemedy.remedies?.map((rem, idx) => {
                  const maxSteps = rem.steps?.length || 0;
                  const activeStep = activeRemedySteps[idx] || 0;
                  const isSaved = savedRemedies.some(r => r.name === rem.name);

                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-3.5">
                      
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-extrabold text-primary dark:text-secondary">{rem.name}</h4>
                        <button 
                          onClick={() => toggleSaveRemedy(rem.name, rem.ingredients)}
                          className={`text-[10px] px-2.5 py-1 rounded-xl font-bold border transition-all ${isSaved ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-250 dark:border-slate-700 text-slate-450 hover:bg-white'}`}
                        >
                          {isSaved ? '★ Saved' : '☆ Save'}
                        </button>
                      </div>

                      <div className="text-xs">
                        <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Ingredients</span>
                        <p className="font-semibold text-slate-650 dark:text-slate-200 mt-0.5">{rem.ingredients?.join(', ')}</p>
                      </div>

                      {/* Step-by-Step Swipe Instruction Card */}
                      {maxSteps > 0 && (
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-750 shadow-inner space-y-3">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                            <span>Preparation Steps</span>
                            <span>Step {activeStep + 1} of {maxSteps}</span>
                          </div>
                          
                          {/* Large readable step text */}
                          <div className="py-2 min-h-12 flex items-center">
                            <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-white">
                              <span className="text-primary dark:text-secondary font-black mr-1.5">{activeStep + 1}.</span>
                              {rem.steps[activeStep]}
                            </p>
                          </div>

                          {/* Swipe Navigation Buttons */}
                          <div className="flex justify-between gap-2 border-t border-slate-100 dark:border-slate-700 pt-2.5">
                            <button
                              type="button"
                              onClick={() => prevPreparationStep(idx)}
                              disabled={activeStep === 0}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold disabled:opacity-40"
                            >
                              ◀ Previous
                            </button>
                            <button
                              type="button"
                              onClick={() => nextPreparationStep(idx, maxSteps)}
                              disabled={activeStep === maxSteps - 1}
                              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold disabled:opacity-40"
                            >
                              Next Step ▶
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-150/40 text-[10px] text-slate-400 font-bold">
                        <div>⏱ Relief: <span className="text-slate-650 dark:text-slate-250 font-normal">{rem.reliefTime}</span></div>
                        <div>🥄 Intake: <span className="text-slate-650 dark:text-slate-250 font-normal">{rem.usageInstructions}</span></div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Warning flags */}
              <div className="bg-amber-50 dark:bg-slate-900 border border-amber-250/20 p-4 rounded-xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed font-semibold">
                <h4 className="font-bold text-amber-600 mb-1">⚠️ Medical Warnings & Safe-Use Indicators:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRemedy.warnings?.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* Kitchen Remedies Suggestions display */}
          {kitchenSuggestions && (
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <span className="text-xl">🌿</span>
                <div>
                  <h3 className="text-sm font-extrabold text-primary dark:text-secondary">AI Kitchen Remedy Plan</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Matched from your pantry</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl leading-relaxed">
                {renderMarkdown(kitchenSuggestions)}
              </div>
            </div>
          )}

          {/* Popular Symptom Search Grid */}
          <div>
            <h3 className="font-extrabold text-sm mb-3">Popular Symptoms</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {popularConditions.map((pop) => (
                <button
                  key={pop._id}
                  onClick={() => handleSelectRemedy(pop.condition)}
                  className="bg-white dark:bg-slate-800 hover:border-primary border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  {pop.condition}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Kitchen ingredient matcher */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Kitchen pantry remedies checker */}
          <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-md">
            <h3 className="text-sm font-extrabold mb-1">Kitchen Pantry</h3>
            <p className="text-[10px] text-slate-450 font-semibold mb-3">Check matched remedies based on items you have.</p>

            <form onSubmit={handleAddIngredient} className="flex gap-1.5 mb-3.5">
              <input 
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                className="flex-grow p-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                placeholder="e.g. Honey, Ginger..."
              />
              <button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3.5 rounded-xl text-xs">
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {kitchenIngredients.map((ing) => (
                <button 
                  key={ing}
                  onClick={() => handleRemoveIngredient(ing)}
                  className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {ing} ✕
                </button>
              ))}
            </div>

            <button 
              onClick={handleKitchenSubmit}
              disabled={kitchenLoading || kitchenIngredients.length === 0}
              className="w-full bg-primary hover:opacity-95 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm disabled:opacity-40"
            >
              {kitchenLoading ? 'Matching...' : '🔍 Match Pantry remedies'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

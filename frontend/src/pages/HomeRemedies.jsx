import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

// Render AI markdown responses with proper structure
const renderMarkdown = (text) => {
  if (!text) return null;
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headers
  escaped = escaped.replace(/^### (.*?)$/gm, '<h4 class="text-base font-bold text-primary dark:text-secondary mt-4 mb-2">$1</h4>');
  escaped = escaped.replace(/^## (.*?)$/gm, '<h3 class="text-lg font-bold text-primary dark:text-secondary mt-4 mb-2">$1</h3>');
  escaped = escaped.replace(/^# (.*?)$/gm, '<h2 class="text-xl font-bold text-primary dark:text-secondary mt-4 mb-2">$1</h2>');
  
  // Bold
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-800 dark:text-white">$1</strong>');
  
  // Bullets
  escaped = escaped.replace(/^\s*[-*]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-emerald-500 select-none font-bold">•</span><span class="flex-1">$1</span></div>');
  
  // Numbered lines (convert to styled items)
  escaped = escaped.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-primary dark:text-secondary font-bold min-w-[20px]">$1.</span><span class="flex-1">$2</span></div>');

  // Warning lines
  escaped = escaped.replace(/(⚠️.*?)(?:<br \/?>|$)/g, '<div class="my-2 p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl text-amber-800 dark:text-amber-300 text-sm">$1</div>');
  
  // Paragraph breaks
  escaped = escaped.split('\n').map(line => {
    if (line.includes('flex items-start') || line.includes('<h') || line.includes('⚠️') || line.trim() === '') {
      return line;
    }
    return line ? line + '<br />' : '<br />';
  }).join('\n');
  
  return <div dangerouslySetInnerHTML={{ __html: escaped }} className="space-y-1 text-sm md:text-base leading-relaxed" />;
};

export default function HomeRemedies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularConditions, setPopularConditions] = useState([]);
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [loading, setLoading] = useState(false);

  // Kitchen ingredients state
  const [kitchenIngredients, setKitchenIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [kitchenSuggestions, setKitchenSuggestions] = useState('');
  const [kitchenLoading, setKitchenLoading] = useState(false);

  useEffect(() => {
    fetchPopular();
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

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <header className="mb-stack-md">
        <h1 className="text-3xl font-bold text-primary dark:text-secondary">🏠 Home Remedies</h1>
        <p className="text-on-surface-variant dark:text-slate-300">Natural remedies and self-care recommendations for everyday minor concerns.</p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Left Column - Search & details */}
        <div className="lg:col-span-8 space-y-gutter">
          
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow p-4 rounded-2xl border border-outline-variant bg-white dark:bg-slate-800 shadow-md outline-none text-label-md focus:border-primary"
              placeholder="Describe your health issue (e.g. sore throat, acidity)..."
            />
            <button type="submit" className="bg-primary hover:opacity-90 dark:bg-secondary dark:text-slate-900 text-white px-8 rounded-2xl font-bold shadow-md transition-all">
              Search
            </button>
          </form>

          {loading && (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Remedy Details Display */}
          {selectedRemedy && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md space-y-6 animate-fade-in">
              <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary dark:text-secondary">{selectedRemedy.condition} Care Plan</h2>
                  <p className="text-label-sm text-outline mt-1">Causes: {selectedRemedy.causes?.join(', ')}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1 rounded-full text-label-sm font-bold">
                  🟢 Mild Symptom
                </span>
              </div>

              {/* Remedies list */}
              <div className="space-y-6">
                {selectedRemedy.remedies?.map((rem, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl space-y-3 border border-outline-variant/20 shadow-sm">
                    <h4 className="text-lg font-bold text-primary dark:text-secondary">{rem.name}</h4>
                    <div>
                      <span className="font-bold text-label-sm uppercase text-outline">Ingredients:</span>
                      <p className="text-label-md mt-1">{rem.ingredients?.join(', ')}</p>
                    </div>
                    <div>
                      <span className="font-bold text-label-sm uppercase text-outline">Preparation Steps:</span>
                      <ol className="list-decimal list-inside space-y-1 text-label-md mt-1">
                        {rem.steps?.map((step, sidx) => (
                          <li key={sidx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex justify-between text-label-sm text-outline pt-2 border-t border-outline-variant/20">
                      <span>Instructions: {rem.usageInstructions}</span>
                      <span>Relief: {rem.reliefTime}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning flags */}
              <div className="bg-amber-50 dark:bg-slate-900 border border-amber-200/50 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-label-md">
                <h4 className="font-bold mb-1">⚠️ Medical Warning:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRemedy.warnings?.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* Kitchen Remedies display */}
          {kitchenSuggestions && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl">🌿</div>
                <div>
                  <h3 className="text-xl font-bold text-primary dark:text-secondary">AI Kitchen Remedy Plan</h3>
                  <p className="text-label-sm text-outline">Personalized from your available ingredients</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-outline-variant/20 rounded-xl">
                {renderMarkdown(kitchenSuggestions)}
              </div>
            </div>
          )}

          {/* Popular searches grid */}
          <div>
            <h3 className="text-xl font-bold mb-4 font-headline-md">Popular Symptoms</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
              {popularConditions.map((pop) => (
                <button
                  key={pop._id}
                  onClick={() => handleSelectRemedy(pop.condition)}
                  className="glass-card rounded-xl p-4 bg-white dark:bg-slate-800 border text-center hover:border-primary shadow-sm hover:shadow-md transition-all font-bold text-label-md"
                >
                  {pop.condition}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Kitchen check ingredients */}
        <div className="lg:col-span-4 space-y-gutter">
          
          {/* Kitchen remedies checker */}
          <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
            <h3 className="text-lg font-bold mb-2">Kitchen Remedies</h3>
            <p className="text-label-sm text-outline mb-4">Enter ingredients you have to match prep-recipes.</p>

            <form onSubmit={handleAddIngredient} className="flex gap-2 mb-4">
              <input 
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                className="flex-grow p-2.5 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 outline-none text-label-md"
                placeholder="Honey, Lemon, Ginger..."
              />
              <button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 rounded-xl text-label-sm">
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mb-4">
              {kitchenIngredients.map((ing) => (
                <span 
                  key={ing}
                  onClick={() => handleRemoveIngredient(ing)}
                  className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {ing} ✕
                </span>
              ))}
            </div>

            <button 
              onClick={handleKitchenSubmit}
              disabled={kitchenLoading || kitchenIngredients.length === 0}
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-md"
            >
              {kitchenLoading ? 'Searching...' : '🔍 Search Kitchen remedies'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

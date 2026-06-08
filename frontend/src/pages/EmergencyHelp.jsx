import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';

// Helper to render clinical icons for emergency category cards
const getCategoryIcon = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('heart') || lower.includes('cardiac')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shadow-inner">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('stroke') || lower.includes('brain') || lower.includes('head')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shadow-inner">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9.663 17h4.673M12 3v1m6.364 1.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('choking') || lower.includes('breath') || lower.includes('airway')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shadow-inner">
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5h18M3 12h18M3 19h18" />
        </svg>
      </div>
    );
  }
  if (lower.includes('burn')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shadow-inner">
        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('bleed')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shadow-inner">
        <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
    );
  }
  // Default general clinical icon
  return (
    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center shadow-inner">
      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
  );
};

// Helper for severity badges
const getSeverityBadge = (severity) => {
  const s = severity?.toLowerCase() || '';
  if (s === 'critical') {
    return (
      <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
        Critical
      </span>
    );
  }
  if (s === 'urgent' || s === 'high') {
    return (
      <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
        Urgent
      </span>
    );
  }
  return (
    <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
      Monitor
    </span>
  );
};

export default function EmergencyHelp() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [listening, setListening] = useState(false);

  // Contacts circles
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  // Hospitals list
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchContacts();
    fetchNearbyHospitals();
    detectLocation();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/emergency/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch emergency categories:', err.message);
    }
  };

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await api.get('/emergency/emergency-contact');
        setContacts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err.message);
    }
  };

  const fetchNearbyHospitals = async () => {
    try {
      // Default coordinates (Secunderabad) if location is not detected yet
      const lat = location?.lat || 17.4399;
      const lng = location?.lng || 78.4983;
      const res = await api.get(`/hospitals/nearby?lat=${lat}&lng=${lng}&category=hospitals`);
      setHospitals(res.data.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch nearby hospitals:', err.message);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          // Re-fetch hospitals using updated coordinates
          api.get(`/hospitals/nearby?lat=${coords.lat}&lng=${coords.lng}&category=hospitals`)
            .then(res => setHospitals(res.data.slice(0, 3)))
            .catch(err => console.warn(err));
        },
        (err) => console.warn('Geolocation access denied.')
      );
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setAiResult(null);
    setSelectedGuide(null);

    try {
      const res = await api.post('/emergency/analyze', { query: searchQuery });
      setAiResult(res.data);
    } catch (err) {
      console.error('AI symptom analysis failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuide = async (id) => {
    setLoading(true);
    setAiResult(null);
    try {
      const res = await api.get(`/emergency/details/${id}`);
      setSelectedGuide(res.data);
    } catch (err) {
      console.error('Failed to fetch guide details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = async () => {
    if (!location) {
      alert('Unable to detect GPS coordinates. Please enable device location settings.');
      return;
    }
    setSharing(true);
    try {
      await api.post('/emergency/share-location', {
        latitude: location.lat,
        longitude: location.lng,
        emergencyType: selectedGuide?.title || searchQuery || 'SOS General Alert'
      });
      alert('🚨 SOS Alert with GPS coordinates broadcasted to your emergency circle successfully!');
    } catch (err) {
      alert('SOS broadcast failed. Please try dialing emergency contacts directly.');
    } finally {
      setSharing(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    try {
      const res = await api.post('/emergency/emergency-contact', {
        name: newContactName,
        phone: newContactPhone,
        relationship: newContactRelation
      });
      setContacts([...contacts, res.data.contact]);
      setNewContactName('');
      setNewContactPhone('');
      setNewContactRelation('');
      setShowAddContact(false);
    } catch (err) {
      alert('Failed to save emergency contact.');
    }
  };

  // Voice Speech-to-Text Mode
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your emergency description.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setListening(true);
    rec.start();

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setSearchQuery(text);
      setListening(false);
      
      // Auto-submit voice query
      setLoading(true);
      api.post('/emergency/analyze', { query: text })
        .then(res => setAiResult(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
  };

  // Extract initials from name for avatar circles
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Red Clinical Emergency Disclaimer Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 rounded-2xl mb-8 flex items-center justify-between shadow-lg border-l-8 border-red-800 animate-fade-in">
        <div className="flex items-center gap-4">
          <span className="text-4xl select-none">⚠️</span>
          <div>
            <h4 className="font-bold text-lg tracking-wide uppercase">Clinical Emergency Help Disclaimer</h4>
            <p className="text-sm opacity-90 font-light mt-1">
              Guidance is for informational purposes only. In life-threatening situations, call emergency services immediately or visit the nearest ER.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Left Column - Symptoms search & guides (8 spans) */}
        <div className="lg:col-span-8 space-y-gutter">
          
          {/* Quick Action SOS Cards (Mockup Style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
            
            {/* Call 112 */}
            <a 
              href="tel:112" 
              className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex flex-col justify-between p-5 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-36"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold tracking-wide">Call 112</span>
            </a>

            {/* Find Nearest ER (scrolls to ER list) */}
            <button 
              onClick={() => {
                document.getElementById('closest-er-facilities')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-br from-primary to-primary-dark text-white flex flex-col justify-between p-5 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-36 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10.5V20a2 2 0 01-2 2H7a2 2 0 01-2-2v-9.5M12 4v16m-8-8h16" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold tracking-wide">Find Nearest ER</span>
            </button>

            {/* Share Location */}
            <button 
              onClick={handleShareLocation} 
              disabled={sharing}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex flex-col justify-between p-5 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-36 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                {sharing && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
              </div>
              <span className="text-xl font-bold tracking-wide">{sharing ? 'Sharing...' : 'Share Location'}</span>
            </button>

            {/* SOS Circle Toggle */}
            <button 
              onClick={() => setShowAddContact(!showAddContact)} 
              className="bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white flex flex-col justify-between p-5 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-36 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold tracking-wide">SOS Circle</span>
            </button>

          </div>

          {/* AI Emergency Assistant Widget */}
          <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary dark:text-secondary">
              <svg className="w-6 h-6 text-primary dark:text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Emergency Assistant
            </h3>
            
            <form onSubmit={handleSearch} className="flex gap-2 items-center">
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  placeholder="Describe the emergency (e.g. sweating, chest pain)..."
                />
              </div>
              <button 
                type="button" 
                onClick={startSpeechRecognition}
                className={`px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-slate-700/60 dark:border-slate-600 font-bold transition-all text-sm text-primary dark:text-secondary flex items-center gap-2 hover:bg-blue-100 ${listening ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : ''}`}
                title="Voice input mode"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {listening ? 'Listening...' : 'Speak'}
              </button>
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-md"
              >
                Analyze
              </button>
            </form>

            <div className="flex items-center gap-2 mt-4 text-xs text-outline">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Analyzed results prioritize clinical safety protocols.</span>
            </div>
          </div>

          {/* Inline Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {/* AI Search Result Display */}
          {aiResult && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h3 className="text-xl font-bold text-red-600">{aiResult.possibleEmergency || 'AI Symptoms Assessment'}</h3>
                <span className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {aiResult.urgencyLevel || 'Critical'}
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="whitespace-pre-line leading-relaxed text-sm md:text-base text-slate-700 dark:text-slate-200">
                  {aiResult.response}
                </p>
              </div>
              
              {aiResult.immediateActions && (
                <div className="space-y-3">
                  <h4 className="font-bold text-red-600 text-sm md:text-base flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Immediate Steps to Take:
                  </h4>
                  <ol className="grid grid-cols-1 gap-2">
                    {aiResult.immediateActions.map((step, idx) => (
                      <li key={idx} className="flex gap-3 items-start p-3 bg-red-50/40 dark:bg-red-950/10 border-l-4 border-red-500 rounded-r-xl text-sm">
                        <span className="font-bold text-red-600">{idx + 1}.</span>
                        <span className="text-slate-700 dark:text-slate-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Quick Access Categories Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-wide">Emergency Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div 
                  key={cat._id}
                  onClick={() => handleSelectGuide(cat._id)}
                  className="glass-card rounded-2xl p-5 bg-white/90 dark:bg-slate-800/90 border border-outline-variant/30 hover:border-red-400 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start">
                    {getCategoryIcon(cat.title)}
                    {getSeverityBadge(cat.severity)}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{cat.title}</h4>
                    <p className="text-xs text-outline mt-1 font-light line-clamp-2">
                      {cat.symptoms?.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Right Column - Contacts & hospitals (4 spans) */}
        <div className="lg:col-span-4 space-y-gutter">
          
          {/* SOS Circle Widget */}
          <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                SOS Circle
              </h3>
              <button 
                onClick={() => setShowAddContact(!showAddContact)} 
                className="text-primary hover:text-primary-dark text-xs font-bold uppercase tracking-wider"
              >
                {showAddContact ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {/* Add Contact Form Inline */}
            {showAddContact && (
              <form onSubmit={handleAddContact} className="mb-5 p-4 border border-outline-variant/30 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Contact Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g. John Doe" 
                    value={newContactName} 
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-outline-variant outline-none dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="E.g. +91 98765 43210" 
                    value={newContactPhone} 
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-outline-variant outline-none dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Relationship</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Mother / Doctor" 
                    value={newContactRelation} 
                    onChange={(e) => setNewContactRelation(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-outline-variant outline-none dark:bg-slate-800"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm"
                >
                  Save SOS Contact
                </button>
              </form>
            )}

            {/* SOS Contacts List */}
            <div className="space-y-3">
              {contacts.length > 0 ? (
                contacts.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner select-none">
                        {getInitials(c.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{c.name}</h4>
                        <p className="text-[10px] text-outline uppercase tracking-wider mt-0.5">{c.relationship || 'Emergency Contact'}</p>
                      </div>
                    </div>
                    
                    <a 
                      href={`tel:${c.phone}`} 
                      className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm"
                      title={`Call ${c.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-outline-variant/40 rounded-xl">
                  <p className="text-on-surface-variant dark:text-slate-400 text-xs italic">No emergency contacts saved.</p>
                </div>
              )}
            </div>
          </div>

          {/* Closest ER Facilities Card */}
          <div 
            id="closest-er-facilities"
            className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 shadow-md scroll-mt-24"
          >
            <h3 className="text-lg font-bold mb-4 pb-2 border-b border-outline-variant/20 flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Closest ER Facilities
            </h3>
            
            <div className="space-y-4">
              {hospitals.length > 0 ? (
                hospitals.map((h) => (
                  <div key={h._id} className="pb-3 border-b border-outline-variant/20 last:border-b-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex-1 pr-2">{h.name}</h4>
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        OPEN
                      </span>
                    </div>
                    <p className="text-[10px] text-outline">{h.address}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                        ★ {h.rating} • {h.distance} km
                      </span>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(h.name + ' ' + h.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-50 dark:bg-slate-700/60 border border-outline-variant/40 hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1 rounded-full text-[9px] font-bold text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-outline-variant/40 rounded-xl">
                  <p className="text-on-surface-variant dark:text-slate-400 text-xs italic">Loading ER facilities...</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Category Detail Modal Dialog */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-outline-variant/30 space-y-5 animate-scale-up max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="text-xl font-bold text-red-600">{selectedGuide.title} Instructions</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getSeverityBadge(selectedGuide.severity)}
                  <span className="text-[10px] text-outline">First-Aid Guide</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-bold text-base"
                title="Close guide"
              >
                ✕
              </button>
            </div>

            {/* Symptoms indicators */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-outline flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Symptom Indicators:
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-xs">
                {selectedGuide.symptoms?.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                    <span className="text-slate-700 dark:text-slate-300 font-light">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* First-Aid Guidance */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-outline flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                First-Aid Step-by-Step Guidance:
              </h4>
              <ol className="space-y-3">
                {selectedGuide.steps?.map((step, idx) => (
                  <li key={idx} className="flex gap-3 items-start p-3 bg-emerald-50/30 dark:bg-emerald-950/10 border-l-4 border-emerald-500 rounded-r-2xl text-xs md:text-sm">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{idx + 1}.</span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Do NOT Warnings */}
            {selectedGuide.warnings && (
              <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 p-4 rounded-2xl text-xs space-y-2">
                <h4 className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4.5 h-4.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Critical Warnings (Do NOT):
                </h4>
                <ul className="space-y-1.5">
                  {selectedGuide.warnings.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-red-800 dark:text-red-300 font-light">
                      <span className="text-red-500 select-none">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Footer Button */}
            <div className="pt-2">
              <button 
                onClick={() => setSelectedGuide(null)} 
                className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold py-3 rounded-2xl text-xs tracking-wider uppercase transition-colors shadow-sm"
              >
                Close Instructions
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

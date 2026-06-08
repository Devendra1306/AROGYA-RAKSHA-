import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

export default function HealthcareDirectory() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState('');

  // Selected place details states for Modal
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  
  // Fetch from directory endpoint
  const fetchDirectory = async (query = '', cat = 'All') => {
    setLoading(true);
    setError('');
    try {
      let url = '/hospitals/nearby';
      const params = [];
      if (query.trim()) {
        params.push(`search=${encodeURIComponent(query.trim())}`);
      }
      if (cat !== 'All') {
        params.push(`category=${encodeURIComponent(cat)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await api.get(url);
      setFacilities(res.data);
    } catch (err) {
      console.error('Directory fetch failed:', err);
      setError('Failed to load healthcare directory. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when query or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDirectory(searchQuery, selectedCategory);
    }, 350); // Debounce typing

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleOpenDetails = async (placeId) => {
    setSelectedPlaceId(placeId);
    setDetailsLoading(true);
    setDetailsError('');
    setSelectedDetails(null);
    try {
      const res = await api.get(`/hospitals/${placeId}`);
      setSelectedDetails(res.data);
    } catch (err) {
      console.error('Details fetch failed:', err);
      setDetailsError('Failed to load detailed profile. Please check server connection.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPlaceId(null);
    setSelectedDetails(null);
    setDetailsError('');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-sm text-slate-800 dark:text-slate-100 transition-colors animate-fadeIn pt-24 pb-20">
      
      {/* Directory Hero Title */}
      <section className="space-y-4 mb-8">
        <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4 py-1.5 rounded-full text-label-sm font-extrabold uppercase inline-block">
          🏥 Nearby Healthcare
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Find Healthcare & Clinical Facilities
        </h1>
        <p className="text-sm text-outline dark:text-slate-400 max-w-2xl leading-relaxed">
          Search live hospitals, clinics, doctor specializations, diagnostics laboratories, and pharmacies. Browse detailed services, departments, timings, and verified reviews without location tracking.
        </p>
      </section>

      {/* Search Bar & Category Filters */}
      <section className="space-y-4 mb-8">
        {/* Text Search Box */}
        <div className="relative w-full max-w-3xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Search by location, hospital name, clinic type, or doctor specialization (e.g. Tadepalligudem, Cardiologist)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary text-xs shadow-sm text-slate-800 dark:text-white transition-all outline-none"
          />
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Hospitals', 'Clinics', 'Pharmacies', 'Diagnostic Centers'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all duration-200 active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-primary text-white border-primary dark:bg-secondary dark:text-slate-900 dark:border-secondary'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 text-slate-650 dark:text-slate-300'
              }`}
            >
              {cat === 'All' ? '🌐 All Categories' : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Results Bento Grid */}
      <section className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-650 dark:text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
            <span className="text-xs font-bold text-outline">Querying Google Places Index...</span>
          </div>
        ) : facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {facilities.map(f => (
              <div 
                key={f._id} 
                className="glass-card bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-350 dark:hover:border-slate-600 transition-all duration-300 cursor-pointer"
                onClick={() => handleOpenDetails(f.place_id)}
              >
                <div>
                  {/* Card Banner Image */}
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 relative shadow-sm bg-slate-100 dark:bg-slate-900">
                    <img 
                      src={f.image} 
                      alt={f.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                      loading="lazy"
                    />
                    {f.isOpen !== null && (
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase shadow-sm ${
                        f.isOpen 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {f.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                  </div>

                  {/* Category & Badge */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase">
                      {f.category}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold">
                      ID: {f.place_id}
                    </span>
                  </div>

                  {/* Facility Name */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                    {f.name}
                  </h3>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-3">
                    <span>★ {f.rating ? f.rating.toFixed(1) : '0.0'}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal">({f.reviewCount || 0} reviews)</span>
                  </div>

                  {/* Address */}
                  <p className="text-xs text-on-surface-variant dark:text-slate-350 leading-relaxed mb-4 font-light">
                    📍 {f.address}
                  </p>

                  {/* Core Services badges */}
                  {f.services && f.services.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Core Services</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {f.services.map(s => (
                          <span 
                            key={s} 
                            className="bg-slate-100 dark:bg-slate-700 text-slate-650 dark:text-slate-200 px-2 py-0.5 rounded-lg text-[9px] font-bold"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialized Departments badges */}
                  {f.departments && f.departments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Departments</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {f.departments.map(d => (
                          <span 
                            key={d} 
                            className="bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg text-[9px] font-extrabold"
                          >
                            🩺 {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contacts & Actions */}
                <div className="pt-4 border-t border-slate-150 dark:border-slate-700/60 grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(f.place_id);
                    }}
                    className="bg-primary hover:opacity-95 text-white font-bold py-3 rounded-2xl text-[10px] text-center flex items-center justify-center gap-1.5 shadow transition-all duration-200"
                  >
                    🔍 View Profile
                  </button>
                  <a 
                    href={f.website !== 'N/A' ? f.website : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ' ' + f.address)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-2xl text-[10px] text-center flex items-center justify-center gap-1.5 transition-all duration-200"
                  >
                    🌐 Visit Website
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-3">
            <span className="text-3xl block">🔍</span>
            <p className="text-xs text-outline dark:text-slate-400 font-medium italic">
              No hospitals found for this search.
            </p>
            <p className="text-[10px] text-slate-400">
              Try searching a name like "Apollo", or locations like "Tadepalligudem", "Hyderabad", "Vijayawada".
            </p>
          </div>
        )}
      </section>

      {/* Dynamic Detail Modal */}
      {(selectedPlaceId || detailsLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 space-y-5 animate-scaleUp max-h-[85vh] overflow-y-auto relative text-slate-800 dark:text-slate-100">
            
            {/* Close button */}
            <button 
              onClick={handleCloseDetails}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-805 dark:hover:text-slate-200 transition-colors font-bold text-sm z-10"
              title="Close Profile"
            >
              ✕
            </button>

            {detailsLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                <span className="text-xs font-bold text-outline">Fetching Facility Profile...</span>
              </div>
            )}

            {detailsError && (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-red-500 font-bold">⚠️ {detailsError}</p>
                <button 
                  onClick={handleCloseDetails} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            )}

            {selectedDetails && (
              <div className="space-y-6">
                
                {/* Modal Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase">
                      {selectedDetails.category}
                    </span>
                    {selectedDetails.isOpen !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        selectedDetails.isOpen ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {selectedDetails.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight pr-6">
                    {selectedDetails.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-amber-500">
                    <span>★ {selectedDetails.rating ? selectedDetails.rating.toFixed(1) : '0.0'}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal">({selectedDetails.reviewCount || 0} reviews)</span>
                  </div>
                </div>

                {/* Photo Gallery Grid */}
                {selectedDetails.photos && selectedDetails.photos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facility Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedDetails.photos.map((p, idx) => (
                        <div key={idx} className="h-24 rounded-xl overflow-hidden shadow-sm">
                          <img 
                            src={p} 
                            alt={`Facility photo ${idx + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onClick={() => window.open(p, '_blank')}
                            style={{ cursor: 'zoom-in' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info Grid (Address, Contact, Timings) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">📍 Address</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedDetails.address}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">📞 Contact</h4>
                      <p className="text-xs text-slate-750 dark:text-slate-300 font-bold">
                        {selectedDetails.phone}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">🕒 Working Hours</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                        {selectedDetails.openingHours}
                      </p>
                    </div>
                    {selectedDetails.website !== 'N/A' && (
                      <div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">🌐 Website</h4>
                        <a 
                          href={selectedDetails.website} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-primary dark:text-secondary font-bold hover:underline break-all"
                        >
                          {selectedDetails.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties and Departments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDetails.services && selectedDetails.services.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDetails.services.map(s => (
                          <span key={s} className="bg-slate-100 dark:bg-slate-700 text-slate-750 dark:text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDetails.departments && selectedDetails.departments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDetails.departments.map(d => (
                          <span key={d} className="bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-extrabold">
                            🩺 {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient Reviews */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Reviews</h4>
                  <div className="space-y-3">
                    {selectedDetails.reviews && selectedDetails.reviews.length > 0 ? (
                      selectedDetails.reviews.map((r, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{r.author}</span>
                            <span className="text-slate-400">{r.date}</span>
                          </div>
                          <div className="text-[10px] text-amber-500 font-bold">★ {r.rating}.0</div>
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-light">
                            "{r.text}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-450 italic font-light">No patient reviews logged for this facility.</p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                  <a 
                    href={`tel:${selectedDetails.phone}`} 
                    className="bg-primary hover:opacity-95 text-white font-bold py-3 rounded-2xl text-xs text-center flex items-center justify-center gap-1.5 shadow transition-all duration-200"
                  >
                    📞 Call: {selectedDetails.phone}
                  </a>
                  <a 
                    href={selectedDetails.website !== 'N/A' ? selectedDetails.website : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDetails.name + ' ' + selectedDetails.address)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-2xl text-xs text-center flex items-center justify-center gap-1.5 transition-all duration-200"
                  >
                    🌐 Visit Website
                  </a>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const emergencyQuick = [
    { title: 'Heart Attack', desc: 'Chest pressure, numbness, sweating.', icon: 'cardiology', color: 'text-red-500' },
    { title: 'Stroke', desc: 'Face drooping, speech slurring.', icon: 'psychology', color: 'text-blue-500' },
    { title: 'Choking', desc: 'Inability to breathe, talk or speak.', icon: 'airwave', color: 'text-emerald-500' },
    { title: 'Burns', desc: 'Cool running water, sterilize area.', icon: 'local_fire_department', color: 'text-orange-500' },
    { title: 'Poisoning', desc: 'Save package container, airway check.', icon: 'skull', color: 'text-purple-500' },
    { title: 'Bleeding', desc: 'Direct firm continuous pressure.', icon: 'bloodtype', color: 'text-rose-500' }
  ];

  const services = [
    { title: 'Emergency Help', desc: 'First aid instructions & emergency maps.', icon: 'emergency', path: '/emergency', color: 'text-red-500' },
    { title: 'Medical Assistant', desc: 'Clinical symptom checks & disease lookups.', icon: 'smart_toy', path: '/medical-assistant', color: 'text-primary' },
    { title: 'Health Assessment', desc: 'Daily health score & vitals tracking.', icon: 'analytics', path: '/health-assessment', color: 'text-secondary' },
    { title: 'Diet Planner', desc: 'Calorie needs macro splits & groceries.', icon: 'restaurant', path: '/diet-planner', color: 'text-emerald-500' }
  ];

  const faqs = [
    { q: 'Is Arogya Raksha free?', a: 'Yes, basic emergency assistance and general AI medical checks are available free of cost.' },
    { q: 'Is medical guidance accurate?', a: 'Arogya Raksha utilizes Gemini AI integrated with WHO/CDC clinical guidelines for verification.' },
    { q: 'How does Health Assessment work?', a: 'It calculates a weighted score out of 100 based on your vitals, sleep, hydration, and medical logs.' },
    { q: 'Can I trust medicine information?', a: 'Our medicine DB is synced to official drug catalogs, but always consult a doctor before starting medications.' }
  ];

  if (isMobile) {
    // Clean, mobile-optimized Landing Page without heavy animations/gradients/emojis
    return (
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-16 font-body-md">
        <SEO 
          title="Arogya Raksha | Your AI Healthcare Companion"
          description="Arogya Raksha provides emergency guides, health assessment scoring, custom diet plans, medicine databases, and clinical voice assistant guidance."
          keywords="healthcare app, medical assistant, emergency health, diet planner"
          schema={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Arogya Raksha",
            "url": "https://arogyaraksha.com"
          }}
        />
        {/* Clean Hero Section */}
        <section className="px-4 pt-10 pb-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-full mb-4 text-[10px] font-bold uppercase tracking-wider">
            <span>Your AI Healthcare Companion</span>
          </div>
          <h1 className="text-2xl font-extrabold text-primary dark:text-secondary mb-2.5 leading-tight tracking-tight">
            Comprehensive Care,<br/>Instant Guidance.
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 mb-6 max-w-xs mx-auto leading-relaxed">
            Access emergency guides, health assessment scoring, custom diet plans, medicine databases, and clinical voice assistant guidance.
          </p>
          <div className="flex flex-col w-full gap-2 px-2">
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary text-white py-3 rounded-xl font-bold text-xs shadow-sm active:scale-98 transition-all"
            >
              Sign In to Your Account
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-750 dark:text-slate-200 py-3 rounded-xl font-bold text-xs shadow-xs active:scale-98 transition-all"
            >
              Create Free Account
            </button>
          </div>
        </section>

        {/* Emergency Quick Access (Minimal Grid) */}
        <section className="bg-red-50/40 dark:bg-red-950/10 py-6 px-4 border-t border-b border-red-150/20">
          <div className="text-center mb-5">
            <h2 className="text-base font-extrabold text-red-650">Emergency Quick Access</h2>
            <p className="text-[9px] text-slate-400 mt-0.5">First-aid instructions for critical health situations.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Heart Attack', desc: 'Chest pressure, numbness.', icon: 'cardiology', color: 'text-red-500' },
              { title: 'Stroke', desc: 'Face drooping, slurring.', icon: 'psychology', color: 'text-blue-500' },
              { title: 'Choking', desc: 'Inability to breathe.', icon: 'airwave', color: 'text-emerald-500' },
              { title: 'Burns', desc: 'Cool water, sterilize.', icon: 'local_fire_department', color: 'text-orange-500' },
              { title: 'Poisoning', desc: 'Check airways.', icon: 'skull', color: 'text-purple-500' },
              { title: 'Bleeding', desc: 'Direct firm pressure.', icon: 'bloodtype', color: 'text-rose-500' }
            ].map((eq, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/emergency')}
                className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xs cursor-pointer hover:border-red-400 active:scale-98 transition-all"
              >
                <span className={`material-symbols-outlined text-lg block mb-1.5 ${eq.color}`}>{eq.icon}</span>
                <h3 className="font-bold text-[11px] text-primary dark:text-secondary mb-0.5">{eq.title}</h3>
                <p className="text-[9px] leading-tight text-slate-400">{eq.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Healthcare Services (Modern List) */}
        <section className="py-6 px-4 bg-white dark:bg-slate-900">
          <div className="text-center mb-5">
            <h2 className="text-base font-extrabold text-primary dark:text-secondary">Our Healthcare Services</h2>
            <p className="text-[9px] text-slate-400 mt-0.5">Comprehensive health management pipelines at your fingertips.</p>
          </div>
          
          <div className="space-y-3">
            {[
              { title: "Emergency Help", desc: "Immediate first-aid instructions and clinical guidelines.", icon: "emergency", path: "/emergency", color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
              { title: "Medical Assistant", desc: "Clinical symptom checks & disease lookups powered by AI.", icon: "smart_toy", path: "/medical-assistant", color: "text-primary bg-slate-50 dark:bg-slate-800" },
              { title: "Health Assessment", desc: "Calibrate your daily score & track vitals details.", icon: "analytics", path: "/health-assessment", color: "text-secondary bg-slate-50 dark:bg-slate-800" },
              { title: "Diet Planner", desc: "Calorie-needs macro splits & grocery check list.", icon: "restaurant", path: "/diet-planner", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
              { title: "Medicine Info", desc: "Verify interactions, dosages, and drug safety warnings.", icon: "pill", path: "/medicine-info", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
              { title: "Home Remedies", desc: "Kitchen remedies matching and traditional healing steps.", icon: "eco", path: "/home-remedies", color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
              { title: "Nearby Healthcare", desc: "Search hospitals, clinics, and doctors in your area.", icon: "local_hospital", path: "/nearby", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" }
            ].map((s, i) => (
              <div 
                key={i}
                onClick={() => navigate(s.path)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 cursor-pointer active:scale-98 transition-all"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-xs text-primary dark:text-secondary truncate">{s.title}</h4>
                  <p className="text-[9px] leading-tight text-slate-400 truncate">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works (Vertical Timeline) */}
        <section className="py-6 px-4 bg-primary text-white">
          <div className="text-center mb-5">
            <h2 className="text-base font-extrabold text-white">How Arogya Raksha Works</h2>
            <p className="text-[9px] opacity-80 mt-0.5">Simple steps to smarter health management.</p>
          </div>
          <div className="relative space-y-4 pl-3 max-w-xs mx-auto">
            <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-white/20"></div>
            {[
              { step: "1", title: "Create Account", desc: "Secure register and password hashing to keep data private." },
              { step: "2", title: "Complete Profile", desc: "Input vitals, medical conditions and goals for personalization." },
              { step: "3", title: "Retrieve Advice", desc: "AI reviews profile and medical database context for guidance." },
              { step: "4", title: "Improve Well-being", desc: "Follow roadmaps, trackers, and diet plans to hit goals." }
            ].map((t, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center font-bold text-[10px] shrink-0 z-10">
                  {t.step}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">{t.title}</h4>
                  <p className="text-[9px] opacity-75 leading-tight">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-6 px-4">
          <h2 className="text-base font-extrabold text-primary text-center mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2.5 max-w-xs mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-150 overflow-hidden shadow-xs">
                <button 
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left font-bold text-[11px] text-primary dark:text-secondary outline-none"
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-xs">{activeFaq === i ? 'expand_less' : 'expand_more'}</span>
                </button>
                {activeFaq === i && (
                  <div className="px-3 pb-3 text-[9px] leading-relaxed text-slate-500 dark:text-slate-450 border-t border-slate-50 dark:border-slate-700/50 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Desktop View (Original rich LandingPage)
  return (
    <div className="bg-surface dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      <SEO 
        title="Arogya Raksha | Your AI Healthcare Companion"
        description="Arogya Raksha provides emergency guides, health assessment scoring, custom diet plans, medicine databases, and clinical voice assistant guidance."
        keywords="healthcare app, medical assistant, emergency health, diet planner"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Arogya Raksha",
          "url": "https://arogyaraksha.com"
        }}
      />
      {/* Hero Section */}
      <section className="px-margin-desktop py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-gutter max-w-[1280px] mx-auto">
        <div className="flex-1 space-y-6">
          <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4 py-1.5 rounded-full text-label-sm font-extrabold uppercase">
            Your AI-Powered Healthcare Companion
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
            Comprehensive Care, Instant Guidance.
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-lg leading-relaxed">
            Get instant emergency guides, personalized health insights, nutrition plans, medicine details, and clinical support — all in one dashboard.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/emergency')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center gap-2 text-label-md"
            >
              Emergency Help
            </button>
            <button 
              onClick={() => navigate('/medical-assistant')}
              className="border border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-8 py-4 rounded-2xl transition-all text-label-md"
            >
              Get Medical Guidance
            </button>
          </div>
        </div>
        <div className="flex-1 hidden lg:block opacity-80">
          <svg viewBox="0 0 500 400" className="w-full h-auto">
            <rect x="50" y="50" width="400" height="300" rx="20" fill="white" className="dark:fill-slate-800" stroke="#e2e8f0" strokeWidth="2" />
            <circle cx="120" cy="130" r="40" fill="#0052cc" fillOpacity="0.1" />
            <circle cx="120" cy="130" r="25" fill="#0052cc" />
            <text x="120" y="135" fill="white" textAnchor="middle" fontWeight="bold">82</text>
            <rect x="200" y="100" width="200" height="15" rx="5" fill="#e2e8f0" />
            <rect x="200" y="100" width="140" height="15" rx="5" fill="#10b981" />
            <rect x="200" y="130" width="200" height="15" rx="5" fill="#e2e8f0" />
            <rect x="200" y="130" width="160" height="15" rx="5" fill="#0052cc" />
            <path d="M80 250 C 150 200, 250 320, 420 230" fill="none" stroke="#0052cc" strokeWidth="4" />
          </svg>
        </div>
      </section>

      {/* Emergency Quick Access */}
      <section className="bg-red-50 dark:bg-red-950/20 py-16 border-t border-b border-red-100/50">
        <div className="max-w-[1280px] mx-auto px-margin-desktop text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-2">Emergency Quick Access</h2>
          <p className="text-outline text-label-md mb-8">One-click immediate first-aid guidance for critical health threats.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-base">
            {emergencyQuick.map((e) => (
              <div 
                key={e.title}
                onClick={() => navigate('/emergency')}
                className="glass-card rounded-2xl p-5 bg-white hover:border-red-500 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 transition-all text-center"
              >
                <span className={`material-symbols-outlined text-3xl block mb-2 ${e.color}`}>{e.icon}</span>
                <h4 className="font-bold text-label-md">{e.title}</h4>
                <p className="text-[9px] text-outline mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 max-w-[1280px] mx-auto px-margin-desktop">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Our Healthcare Services</h2>
          <p className="text-outline text-label-md mt-2">Comprehensive health management pipelines at your fingertips.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {services.map((s) => (
            <div 
              key={s.title}
              onClick={() => navigate(s.path)}
              className="glass-card rounded-2xl p-6 bg-white dark:bg-slate-800 border hover:border-primary cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className={`material-symbols-outlined text-3xl block mb-3 ${s.color}`}>{s.icon}</span>
                <h3 className="font-bold text-lg">{s.title}</h3>
                <p className="text-label-md text-on-surface-variant dark:text-slate-400 mt-2">{s.desc}</p>
              </div>
              <span className="text-primary dark:text-secondary font-bold text-label-sm mt-4 block">
                Learn More →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline How It Works */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20 border-t border-b">
        <div className="max-w-[1280px] mx-auto px-margin-desktop text-center">
          <h2 className="text-3xl font-bold mb-12">How Arogya Raksha Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter relative">
            {[
              { step: '1', title: 'Create Account', desc: 'Secure register and password hashing.' },
              { step: '2', title: 'Complete Profile', desc: 'Input vitals, medical conditions and goals.' },
              { step: '3', title: 'Retrieve Recommendations', desc: 'AI reviews profile and database context.' },
              { step: '4', title: 'Improve Well-being', desc: 'Follow roadmaps, trackers, and diet plans.' }
            ].map(t => (
              <div key={t.step} className="space-y-4">
                <span className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mx-auto text-lg">
                  {t.step}
                </span>
                <h4 className="font-bold text-lg">{t.title}</h4>
                <p className="text-label-md text-on-surface-variant dark:text-slate-400 max-w-[200px] mx-auto">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 max-w-[800px] mx-auto px-margin-desktop">
        <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm"
            >
              <button 
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-label-md flex justify-between items-center"
              >
                <span>{faq.q}</span>
                <span>{activeFaq === idx ? '▲' : '▼'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-label-md text-on-surface-variant dark:text-slate-300 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

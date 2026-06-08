import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    { title: 'Heart Attack', desc: 'Chest pressure, numbness, sweating.', icon: '❤️' },
    { title: 'Stroke', desc: 'Face drooping, speech slurring.', icon: '🧠' },
    { title: 'Choking', desc: 'Inability to breathe, talk or speak.', icon: '🌬️' },
    { title: 'Burns', desc: 'Cool running water, sterilize area.', icon: '🔥' },
    { title: 'Poisoning', desc: 'Save package container, airway check.', icon: '🧪' },
    { title: 'Bleeding', desc: 'Direct firm continuous pressure.', icon: '🩸' }
  ];

  const services = [
    { title: 'Emergency Help', desc: 'First aid instructions & emergency maps.', icon: '🚨', path: '/emergency' },
    { title: 'Medical Assistant', desc: 'Clinical symptom checks & disease lookups.', icon: '🤖', path: '/medical-assistant' },
    { title: 'Health Assessment', desc: 'Daily health score & vitals tracking.', icon: '📊', path: '/health-assessment' },
    { title: 'Diet Planner', desc: 'Calorie needs macro splits & groceries.', icon: '🥗', path: '/diet-planner' }
  ];

  const faqs = [
    { q: 'Is Arogya Raksha free?', a: 'Yes, basic emergency assistance and general AI medical checks are available free of cost.' },
    { q: 'Is medical guidance accurate?', a: 'Arogya Raksha utilizes Gemini AI integrated with WHO/CDC clinical guidelines for verification.' },
    { q: 'How does Health Assessment work?', a: 'It calculates a weighted score out of 100 based on your vitals, sleep, hydration, and medical logs.' },
    { q: 'Can I trust medicine information?', a: 'Our medicine DB is synced to official drug catalogs, but always consult a doctor before starting medications.' }
  ];

  if (isMobile) {
    // Mobile View following mobile.zip (arogya_raksha_mobile_home/code.html)
    return (
      <div className="bg-background text-on-surface pb-6 animate-fade-in font-body-md">
        {/* Hero Section */}
        <section className="px-4 pt-8 pb-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-full mb-5 text-[10px] font-bold uppercase tracking-wider">
            <span>✨</span>
            <span>Your AI Healthcare Companion</span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary mb-3 leading-tight tracking-tight">
            Comprehensive Care,<br/>Instant Guidance.
          </h1>
          <p className="text-xs text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
            Get instant emergency guides, personalized health insights, nutrition plans, medicine details, and clinical support — all in one dashboard.
          </p>
          <div className="flex flex-col w-full gap-2.5 px-2">
            <button 
              onClick={() => navigate('/emergency')}
              className="bg-emergency-red text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
            >
              <span>🚨</span> Emergency Help
            </button>
            <button 
              onClick={() => navigate('/medical-assistant')}
              className="bg-white border border-primary text-primary py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-xs"
            >
              <span>🩺</span> Get Medical Guidance
            </button>
          </div>
        </section>

        {/* Emergency Quick Access (Bento Grid Inspired) */}
        <section className="bg-alert-bg py-8 px-4 border-t border-b border-red-100/30">
          <div className="text-center mb-6">
            <h2 className="text-lg font-extrabold text-emergency-red">Emergency Quick Access</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">One-click immediate first-aid guidance for critical health threats.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {emergencyQuick.map((eq, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/emergency')}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs active:scale-98 transition-transform cursor-pointer"
              >
                <span className="text-2xl block mb-2">{eq.icon}</span>
                <h3 className="font-bold text-xs text-primary dark:text-secondary mb-0.5">{eq.title}</h3>
                <p className="text-[9px] leading-tight text-slate-400">{eq.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Healthcare Services (Modern List) */}
        <section className="py-8 px-4 bg-white dark:bg-slate-900">
          <div className="text-center mb-6">
            <h2 className="text-lg font-extrabold text-primary dark:text-secondary">Our Healthcare Services</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Comprehensive health management pipelines at your fingertips.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { title: "Emergency Help", desc: "Immediate first-aid instructions and clinical guidelines.", icon: "🚨", path: "/emergency" },
              { title: "Medical Assistant", desc: "Clinical symptom checks & disease lookups powered by AI.", icon: "🤖", path: "/medical-assistant" },
              { title: "Health Assessment", desc: "Calibrate your daily score & track vitals details.", icon: "📊", path: "/health-assessment" },
              { title: "Diet Planner", desc: "Calorie-needs macro splits & grocery check list.", icon: "🥗", path: "/diet-planner" },
              { title: "Medicine Info", desc: "Verify interactions, dosages, and drug safety warnings.", icon: "💊", path: "/medicine-info" },
              { title: "Home Remedies", desc: "Kitchen remedies matching and traditional healing steps.", icon: "🌿", path: "/home-remedies" },
              { title: "Nearby Healthcare", desc: "Search hospitals, clinics, and doctors in your area.", icon: "🏥", path: "/nearby" }
            ].map((s, i) => (
              <div 
                key={i}
                onClick={() => navigate(s.path)}
                className="flex gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 cursor-pointer active:scale-98 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-secondary/15 flex items-center justify-center text-xl shrink-0">
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-primary dark:text-secondary mb-0.5">{s.title}</h4>
                  <p className="text-[10px] leading-tight text-slate-550 dark:text-slate-350">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works (Vertical Timeline) */}
        <section className="py-8 px-4 bg-primary text-white">
          <div className="text-center mb-6">
            <h2 className="text-lg font-extrabold text-white">How Arogya Raksha Works</h2>
            <p className="text-[10px] opacity-80 mt-0.5">Simple steps to smarter health management.</p>
          </div>
          <div className="relative space-y-6 pl-4 max-w-xs mx-auto">
            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-white/20"></div>
            {[
              { step: "1", title: "Create Account", desc: "Secure register and password hashing to keep data private." },
              { step: "2", title: "Complete Profile", desc: "Input vitals, medical conditions and goals for personalization." },
              { step: "3", title: "Retrieve Advice", desc: "AI reviews profile and medical database context for guidance." },
              { step: "4", title: "Improve Well-being", desc: "Follow roadmaps, trackers, and diet plans to hit goals." }
            ].map((t, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-bold text-xs shrink-0 z-10">
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
        <section className="py-8 px-4">
          <h2 className="text-lg font-extrabold text-primary text-center mb-5">Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-xs mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-150 overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs text-primary dark:text-secondary outline-none"
                >
                  <span>{faq.q}</span>
                  <span>{activeFaq === i ? '▲' : '▼'}</span>
                </button>
                {activeFaq === i && (
                  <div className="px-3.5 pb-3 text-[10px] leading-relaxed text-slate-500 dark:text-slate-350">
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
      
      {/* Hero Section */}
      <section className="px-margin-desktop py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-gutter max-w-[1280px] mx-auto">
        <div className="flex-1 space-y-6">
          <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4 py-1.5 rounded-full text-label-sm font-extrabold uppercase">
            🩺 Your AI-Powered Healthcare Companion
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
              🚨 Emergency Help
            </button>
            <button 
              onClick={() => navigate('/medical-assistant')}
              className="border border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-8 py-4 rounded-2xl transition-all text-label-md"
            >
              🩺 Get Medical Guidance
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
                <span className="text-3xl block mb-2">{e.icon}</span>
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
                <span className="text-3xl block mb-3">{s.icon}</span>
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

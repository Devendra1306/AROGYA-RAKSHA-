import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const emergencyQuick = [
    { title: 'Heart Attack', desc: 'Chest pressure, numbness', icon: '❤️' },
    { title: 'Stroke', desc: 'Face drooping, speech slurred', icon: '🧠' },
    { title: 'Choking', desc: 'Inability to speak, blue lips', icon: '喉' },
    { title: 'Burns', desc: 'Cool water dressing, sterilize', icon: '🔥' },
    { title: 'Poisoning', desc: 'Save container, isolate airway', icon: '🧪' },
    { title: 'Severe Bleeding', desc: 'Direct firm continuous pressure', icon: '🩸' }
  ];

  const services = [
    { title: 'Emergency Help', desc: 'Immediate first-aid directions & GPS alerts.', icon: '🚨', path: '/emergency' },
    { title: 'Medical Assistant', desc: 'Clinical symptom checks & disease lookups.', icon: '🩺', path: '/medical-assistant' },
    { title: 'Health Assessment', desc: 'Calibrate your daily score & track vitals.', icon: '📊', path: '/health-assessment' },
    { title: 'Diet Planner', desc: 'Calorie-needs macros rings & grocery list.', icon: '🥗', path: '/diet-planner' },
    { title: 'Medicine Info', desc: 'Verify interactions, dosages, warnings.', icon: '💊', path: '/medicine-info' },
    { title: 'Home Remedies', desc: 'Kitchen remedies matching for minor concerns.', icon: '🏠', path: '/home-remedies' }
  ];

  const faqs = [
    { q: 'Is Arogya Raksha free?', a: 'Yes! The basic emergency and symptom check helper is completely free.' },
    { q: 'Is medical guidance accurate?', a: 'Arogya Raksha utilizes Gemini AI integrated with WHO/CDC clinical guidelines for verification.' },
    { q: 'How does Health Assessment work?', a: 'It calculates a weighted score out of 100 based on your vitals, sleep, hydration, and medical logs.' },
    { q: 'Can I trust medicine information?', a: 'Our medicine DB is synced to official drug catalogs, but always consult a doctor before starting medications.' }
  ];

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
          {/* Svg Healthcare Dashboard elements */}
          <svg viewBox="0 0 500 400" className="w-full h-auto">
            <rect x="50" y="50" width="400" height="300" rx="20" fill="white" className="dark:fill-slate-800" stroke="#e2e8f0" strokeWidth="2 shadow" />
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

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-margin-desktop border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-gutter text-center md:text-left">
          <div>
            <h3 className="text-white font-bold text-xl">🚨 Arogya Raksha</h3>
            <p className="text-xs opacity-75 mt-1">Empowering communities through AI precision & safe medical disclaimers.</p>
          </div>
          <div className="flex gap-gutter text-xs font-semibold">
            <span className="cursor-pointer hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white">Terms of Use</span>
            <span className="cursor-pointer hover:text-white">Contact Center</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

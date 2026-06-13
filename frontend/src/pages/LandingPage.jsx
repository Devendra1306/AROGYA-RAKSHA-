import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Interactive Hero States
  const [activeTab, setActiveTab] = useState('vitals');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', text: 'I feel a bit dizzy and have a minor headache.' },
    { role: 'assistant', text: 'This could be due to dehydration. Try drinking a warm cup of ginger tea, resting in a quiet, dark room, and ensuring you have had enough water today.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Vitals simulation values
  const [simulatedVitals, setSimulatedVitals] = useState({
    heartRate: 72,
    bloodPressure: '120/80',
    hydration: 65,
    sleep: 7.2
  });

  // Animated health score counter
  const healthScoreRef = useRef(null);

  useEffect(() => {
    // 1. GSAP Entrance Animations for Hero Copy
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".gsap-badge", { opacity: 0, scale: 0.8, y: -20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6 })
      .fromTo(".gsap-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
      .fromTo(".gsap-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .fromTo(".gsap-buttons", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.6")
      .fromTo(".gsap-dashboard", { opacity: 0, scale: 0.95, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 1 }, "-=0.6");

    // 2. Animating the Health Score Gauge count up
    const scoreVal = { val: 0 };
    gsap.to(scoreVal, {
      val: 84,
      duration: 2,
      delay: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        if (healthScoreRef.current) {
          healthScoreRef.current.innerText = Math.round(scoreVal.val);
        }
      }
    });

    // 3. Vitals random fluctuation simulation
    const interval = setInterval(() => {
      setSimulatedVitals(prev => ({
        ...prev,
        heartRate: Math.floor(70 + Math.random() * 6),
        hydration: Math.min(100, Math.max(30, prev.hydration + (Math.random() > 0.5 ? 1 : -1)))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let reply = "Based on typical clinical logs, I recommend monitoring your symptoms closely, staying hydrated, and consulting a physician if symptoms persist.";
      if (userMsg.toLowerCase().includes('cough') || userMsg.toLowerCase().includes('cold')) {
        reply = "For cold & cough, a warm ginger turmeric tea with honey is highly effective to soothe your throat. Make sure to rest and avoid cold drinks.";
      } else if (userMsg.toLowerCase().includes('burn')) {
        reply = "Cool the burn immediately under running water for 10-20 minutes. Do not apply ice, butter, or oil. Cover with a clean wrap.";
      } else if (userMsg.toLowerCase().includes('diet') || userMsg.toLowerCase().includes('eat')) {
        reply = "Try incorporating more leafy greens, lean proteins, and complex carbohydrates. Keep your calorie intake close to your BMR targets.";
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  const emergencyQuick = [
    { title: 'Heart Attack', desc: 'Chest pressure, numbness, sweating.', icon: 'cardiology', color: 'text-red-500 bg-red-500/10 border-red-500/20 hover:shadow-red-500/10' },
    { title: 'Stroke', desc: 'Face drooping, speech slurring.', icon: 'psychology', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20 hover:shadow-blue-500/10' },
    { title: 'Choking', desc: 'Inability to breathe or speak.', icon: 'airwave', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:shadow-emerald-500/10' },
    { title: 'Burns', desc: 'Cool running water, sterilize area.', icon: 'local_fire_department', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20 hover:shadow-orange-500/10' },
    { title: 'Poisoning', desc: 'Save package container, airway check.', icon: 'skull', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20 hover:shadow-purple-500/10' },
    { title: 'Bleeding', desc: 'Direct firm continuous pressure.', icon: 'bloodtype', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:shadow-rose-500/10' }
  ];

  const services = [
    { title: 'Emergency Help', desc: 'Instant first aid instructions, guidelines, and hospital navigation routes.', icon: 'emergency', path: '/emergency', gradient: 'from-red-500 to-rose-600', iconColor: 'text-red-500' },
    { title: 'Medical Assistant', desc: 'Conversational symptom assessments and disease lookup, powered by WHO-guidelines-tuned AI.', icon: 'smart_toy', path: '/medical-assistant', gradient: 'from-blue-500 to-indigo-600', iconColor: 'text-blue-500' },
    { title: 'Health Assessment', desc: 'Log vitals, sleep, hydration, and medical history to calculate your daily Health Score.', icon: 'analytics', path: '/health-assessment', gradient: 'from-violet-500 to-purple-600', iconColor: 'text-violet-500' },
    { title: 'Diet Planner', desc: 'Personalized nutritional recommendations, macro splits, and customized grocery check lists.', icon: 'restaurant', path: '/diet-planner', gradient: 'from-emerald-500 to-teal-600', iconColor: 'text-emerald-500' },
    { title: 'Medicine Database', desc: 'Verify safe dosages, side effects, precautions, and dangerous drug interactions.', icon: 'pill', path: '/medicine-info', gradient: 'from-sky-500 to-cyan-600', iconColor: 'text-sky-500' },
    { title: 'Home Remedies', desc: 'Traditional healing remedies made from everyday kitchen ingredients matching your condition.', icon: 'eco', path: '/home-remedies', gradient: 'from-amber-500 to-orange-600', iconColor: 'text-amber-500' },
    { title: 'Nearby Hospitals', desc: 'Instantly pinpoint local medical emergency resources, clinics, and doctors nearby.', icon: 'local_hospital', path: '/nearby', gradient: 'from-blue-600 to-sky-700', iconColor: 'text-blue-600' },
    { title: 'Clinical Dashboard', desc: 'An overview of your health metrics and diagnostic records saved securely in MongoDB.', icon: 'space_dashboard', path: '/dashboard', gradient: 'from-teal-600 to-emerald-700', iconColor: 'text-teal-650' }
  ];

  const faqs = [
    { q: 'Is Arogya Raksha free?', a: 'Yes, basic emergency guides, first-aid advice, and medical lookups are entirely free for all users.' },
    { q: 'Is the AI medical guidance safe?', a: 'Our Medical Assistant utilizes advanced Gemini models tuned to WHO and CDC guidelines. While it provides accurate information, it does not replace a doctor—always consult a physician for serious medical conditions.' },
    { q: 'How does the Health Score work?', a: 'It calculates a weighted score out of 100 dynamically using your inputted age, weight, height, hydration levels, physical activity, sleep cycles, and documented pre-existing medical risks.' },
    { q: 'Is my data secure?', a: 'Yes! We store all personal records, health assessments, and history securely in encrypted MongoDB databases. We never sell or share your clinical details.' }
  ];

  return (
    <div className="bg-[#f8f9ff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen overflow-x-hidden relative">
      <SEO 
        title="Arogya Raksha | Premium AI Healthcare Assistant"
        description="Access AI-powered diagnostic recommendations, personalized health tracking, interactive diet logs, smart medicine guidelines, and instant first-aid guides."
        keywords="healthcare dashboard, AI diagnosis companion, health score calculator, home remedy database"
      />

      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-15%] w-[45%] h-[45%] bg-purple-400/15 dark:bg-purple-600/5 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-[110px] pointer-events-none z-0"></div>

      {/* Hero Section */}
      <section className="relative px-margin-mobile lg:px-margin-desktop pt-10 pb-20 lg:pt-16 lg:pb-28 max-w-[1400px] mx-auto z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Hero Copy Column */}
          <div className="flex-1 space-y-7 text-center lg:text-left">
            <div className="gsap-badge inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 dark:bg-secondary/15 text-primary dark:text-secondary rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary dark:bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary dark:bg-secondary"></span>
              </span>
              Premium AI Health Companion
            </div>
            
            <h1 className="gsap-title text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              Comprehensive Care, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-secondary bg-clip-text text-transparent drop-shadow-sm">
                Instant AI Guidance.
              </span>
            </h1>
            
            <p className="gsap-desc text-slate-600 dark:text-slate-350 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Empower your well-being with immediate emergency guides, personal health trackers, custom nutrition engines, and clinical AI symptom checks stored securely in MongoDB.
            </p>
            
            <div className="gsap-buttons flex flex-wrap gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => navigate('/emergency')}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-lg">emergency</span>
                Emergency SOS Help
              </button>
              
              <button 
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold px-8 py-4 rounded-2xl shadow-md hover:shadow-slate-300/30 active:scale-95 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-lg">space_dashboard</span>
                {user ? 'Enter Dashboard' : 'Get Started Free'}
              </button>
            </div>
          </div>

          {/* Interactive Mockup Column */}
          <div className="flex-1 w-full max-w-2xl gsap-dashboard">
            <div className="glass-card rounded-[2.5rem] bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              
              {/* Header inside Mockup */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-650 flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined text-lg">health_metrics</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-primary dark:text-secondary">Health Hub</h3>
                    <p className="text-[10px] text-slate-400">Live Clinical Sandbox</p>
                  </div>
                </div>
                
                {/* Mockup Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                  {['vitals', 'ai-chat'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                      {tab === 'vitals' ? 'Vitals Board' : 'AI Assistant'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mockup Content Views */}
              <div className="min-h-[260px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activeTab === 'vitals' ? (
                    <motion.div
                      key="vitals"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {/* Health Score Gauge */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl flex flex-col items-center justify-center text-center shadow-xs">
                        <div className="relative flex items-center justify-center w-28 h-28 mb-3">
                          {/* Circular progress bar SVG */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="46" stroke="#e2e8f0" strokeWidth="8" fill="transparent" className="dark:stroke-slate-800" />
                            <circle cx="56" cy="56" r="46" stroke="url(#healthScoreGrad)" strokeWidth="8" fill="transparent" strokeDasharray={289} strokeDashoffset={289 - (289 * 84) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                            <defs>
                              <linearGradient id="healthScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0052cc" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span ref={healthScoreRef} className="text-3xl font-black text-slate-800 dark:text-white">0</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                          </div>
                        </div>
                        <h4 className="font-extrabold text-xs">Vitals Score: Optimal</h4>
                      </div>

                      {/* Small Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                          <span className="material-symbols-outlined text-rose-500 text-lg">favorite</span>
                          <div className="mt-2">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Heart Rate</p>
                            <h5 className="text-sm font-black text-slate-800 dark:text-white">{simulatedVitals.heartRate} bpm</h5>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                          <span className="material-symbols-outlined text-blue-500 text-lg">water_drop</span>
                          <div className="mt-2">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Hydration</p>
                            <h5 className="text-sm font-black text-slate-800 dark:text-white">{simulatedVitals.hydration}%</h5>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                          <span className="material-symbols-outlined text-emerald-500 text-lg">speed</span>
                          <div className="mt-2">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Pressure</p>
                            <h5 className="text-sm font-black text-slate-800 dark:text-white">{simulatedVitals.bloodPressure}</h5>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                          <span className="material-symbols-outlined text-violet-500 text-lg">bedtime</span>
                          <div className="mt-2">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Sleep</p>
                            <h5 className="text-sm font-black text-slate-800 dark:text-white">{simulatedVitals.sleep} hrs</h5>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col h-[260px] bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-inner"
                    >
                      {/* Chat Messages Log */}
                      <div className="flex-grow overflow-y-auto space-y-3.5 pr-1 text-xs">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] px-4 py-2.5 rounded-2xl leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 rounded-bl-none shadow-xs'}`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-none border border-slate-200/50 dark:border-slate-700/50 flex gap-1 items-center">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input Field */}
                      <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type symptom (e.g. cold, burn)..."
                          className="flex-grow bg-white dark:bg-slate-850 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 outline-none text-xs focus:border-primary transition-all dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isTyping}
                          className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all shadow-md"
                        >
                          <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Emergency Quick Access Section */}
      <section className="bg-red-50/50 dark:bg-red-950/10 py-20 border-t border-b border-red-100/30 relative">
        <div className="max-w-[1400px] mx-auto px-margin-mobile lg:px-margin-desktop z-10 relative">
          
          <div className="text-center mb-12 max-w-xl mx-auto">
            <span className="text-red-500 font-extrabold text-xs uppercase tracking-widest bg-red-100 dark:bg-red-950/40 px-4 py-1.5 rounded-full border border-red-200/20">
              Critical First-Aid
            </span>
            <h2 className="text-3xl font-black text-red-600 dark:text-red-400 mt-4 mb-2">Emergency Quick Guides</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Get step-by-step guidance for life-threatening scenarios instantly.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {emergencyQuick.map((eq, i) => (
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                key={eq.title}
                onClick={() => navigate('/emergency')}
                className={`glass-card rounded-2xl p-5 bg-white dark:bg-slate-900 border cursor-pointer hover:border-red-500 shadow-sm transition-all text-center flex flex-col items-center justify-center`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${eq.color.split(' ')[1]} ${eq.color.split(' ')[0]}`}>
                  <span className="material-symbols-outlined text-2xl">{eq.icon}</span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-1.5">{eq.title}</h4>
                <p className="text-[10px] text-slate-400 leading-normal">{eq.desc}</p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-24 max-w-[1400px] mx-auto px-margin-mobile lg:px-margin-desktop relative">
        
        <div className="text-center mb-16 max-w-xl mx-auto">
          <span className="text-primary dark:text-secondary font-extrabold text-xs uppercase tracking-widest bg-primary/10 dark:bg-secondary/15 px-4 py-1.5 rounded-full border border-primary/20">
            Our Offerings
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 mb-3">Our Healthcare Services</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Comprehensive modules designed to safeguard your physiological and cognitive wellness.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, idx) => (
            <motion.div
              whileHover={{ y: -8, shadow: "0px 20px 40px rgba(0,0,0,0.08)" }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              key={s.title}
              onClick={() => navigate(s.path)}
              className="glass-card rounded-[2rem] p-7 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 cursor-pointer flex flex-col justify-between min-h-[260px] relative overflow-hidden group"
            >
              {/* Animated Color Splash on Hover */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-5 group-hover:scale-[3] rounded-full blur-xl transition-all duration-700 ease-out`}></div>
              
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center ${s.iconColor} border border-slate-100 dark:border-slate-800 shadow-xs mb-5`}>
                  <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
              
              <div className="mt-6 flex items-center gap-1.5 font-bold text-xs text-primary dark:text-secondary group-hover:translate-x-1.5 transition-all">
                Access Feature
                <span className="material-symbols-outlined text-xs select-none">arrow_forward</span>
              </div>
            </motion.div>
          ))}
        </div>
        
      </section>

      {/* How It Works (Visual Timeline) */}
      <section className="bg-slate-100/50 dark:bg-slate-900/40 py-24 border-t border-b border-slate-200/30">
        <div className="max-w-[1400px] mx-auto px-margin-mobile lg:px-margin-desktop text-center">
          
          <div className="mb-16 max-w-xl mx-auto">
            <span className="text-primary dark:text-secondary font-extrabold text-xs uppercase tracking-widest bg-primary/10 dark:bg-secondary/15 px-4 py-1.5 rounded-full border border-primary/20">
              Workflow Guide
            </span>
            <h2 className="text-3xl font-black mt-4 mb-3">How Arogya Raksha Works</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">A four-step pathway designed to optimize your health metrics seamlessly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Connection line for larger screens */}
            <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-gradient-to-r from-primary/30 to-secondary/30 z-0"></div>

            {[
              { step: '01', title: 'Register Account', desc: 'Secure encryption to safeguard all clinical user profiles.', icon: 'lock_open' },
              { step: '02', title: 'Log Health Vitals', desc: 'Document key medical logs, sleep patterns, and allergens.', icon: 'monitor_heart' },
              { step: '03', title: 'Consult Clinical AI', desc: 'Verify symptoms with a WHO/CDC-tuned medical guide.', icon: 'clinical_notes' },
              { step: '04', title: 'Hit Wellness Goals', desc: 'Track daily habits, dynamic nutrition macro splits, and advice.', icon: 'emoji_events' }
            ].map((t, idx) => (
              <div key={t.step} className="space-y-4 relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 flex items-center justify-center shadow-lg relative group">
                  <div className="absolute inset-1 rounded-full border border-dashed border-primary/35 group-hover:rotate-180 transition-all duration-1000"></div>
                  <span className="material-symbols-outlined text-2xl text-primary dark:text-secondary">{t.icon}</span>
                  <span className="absolute -bottom-2 right-0 bg-primary dark:bg-secondary text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    {t.step}
                  </span>
                </div>
                
                <h4 className="font-extrabold text-base text-slate-800 dark:text-white pt-2">{t.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] mx-auto leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 max-w-[850px] mx-auto px-margin-mobile lg:px-margin-desktop">
        
        <div className="text-center mb-16">
          <span className="text-primary dark:text-secondary font-extrabold text-xs uppercase tracking-widest bg-primary/10 dark:bg-secondary/15 px-4 py-1.5 rounded-full border border-primary/20">
            Common Inquiries
          </span>
          <h2 className="text-3xl font-black mt-4 mb-3">Frequently Asked Questions</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Everything you need to know about Arogya Raksha's features.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all"
            >
              <button 
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-extrabold text-sm text-slate-800 dark:text-white flex justify-between items-center outline-none select-none"
              >
                <span>{faq.q}</span>
                <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-primary dark:text-secondary' : 'text-slate-400'}`}>
                  expand_more
                </span>
              </button>
              
              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-650 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
      </section>
    </div>
  );
}

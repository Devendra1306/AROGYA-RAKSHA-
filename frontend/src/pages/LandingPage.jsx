import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  HeartPulse, ShieldPlus, Stethoscope, Brain, Pill, Salad,
  Siren, Home, Activity, Zap, Star,
  ArrowRight, Check, ChevronDown, BarChart3,
  MessageCircle, Shield, Lock, Clock,
  ShieldCheck, Server, Globe2, Award
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─── Reusable fade-up section wrapper ────────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const Counter = ({ target, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(target.replace(/\D/g, ''));
    const duration = 2000;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// ─── Pill badge ───────────────────────────────────────────────────────────────
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border ${className}`}>
    {children}
  </span>
);

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ children, color = 'text-violet-500 bg-violet-500/10 border-violet-500/20' }) => (
  <Badge className={color}>{children}</Badge>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navbar state - removed (using global App.jsx navbar)
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your Arogya Raksha AI. How can I help you today?' }
  ]);
  const [chatTyping, setChatTyping] = useState(false);
  
  // Auto-demo chat sequence
  useEffect(() => {
    const scenarios = [
      { q: 'I have a headache and feel tired.', a: 'Possible causes include dehydration or stress. Try 2 glasses of water and rest in a dark room. Consult a doctor if it persists.' },
      { q: 'Suggest a healthy diet plan.', a: 'Aim for a balanced diet rich in whole grains, proteins (dal/paneer/chicken), and fresh vegetables. Stay hydrated!' },
      { q: 'What are first aid steps for a minor burn?', a: 'Cool the burn under running water for 10-20 mins. Do NOT apply ice or butter. Cover with a sterile dressing.' }
    ];
    let active = true;
    let scenarioIdx = 0;

    const runSequence = async () => {
      while (active) {
        const { q, a } = scenarios[scenarioIdx];
        
        // 1. Type the user question
        setChatInput('');
        for (let i = 0; i <= q.length; i++) {
          if (!active) return;
          setChatInput(q.slice(0, i));
          await new Promise(r => setTimeout(r, 40));
        }
        
        // 2. Send the question
        await new Promise(r => setTimeout(r, 500));
        if (!active) return;
        setChatInput('');
        setChatMessages([{ role: 'ai', text: 'Hello! I\'m your Arogya Raksha AI. How can I help you today?' }, { role: 'user', text: q }]);
        setChatTyping(true);
        
        // 3. AI types
        await new Promise(r => setTimeout(r, 1500));
        if (!active) return;
        setChatTyping(false);
        setChatMessages([{ role: 'ai', text: 'Hello! I\'m your Arogya Raksha AI. How can I help you today?' }, { role: 'user', text: q }, { role: 'ai', text: a }]);
        
        // 4. Wait before next scenario
        await new Promise(r => setTimeout(r, 4000));
        if (!active) return;
        
        // Reset
        setChatMessages([{ role: 'ai', text: 'Hello! I\'m your Arogya Raksha AI. How can I help you today?' }]);
        scenarioIdx = (scenarioIdx + 1) % scenarios.length;
      }
    };
    
    runSequence();
    return () => { active = false; };
  }, []);
  const chatEndRef = useRef(null);
  const chatContainer1Ref = useRef(null); // mini chat in hero card
  const chatContainer2Ref = useRef(null); // full chat in AI section

  // Health score ref for GSAP
  const healthScoreRef = useRef(null);
  const heroRef = useRef(null);

  // Vitals simulation
  const [vitals, setVitals] = useState({ hr: 72, hydration: 68, sleep: 7.4, bp: '118/78' });

  // Testimonial carousel
  const [testIdx, setTestIdx] = useState(0);
  const testimonials = [
    { name: 'Priya Sharma', role: 'Software Engineer, Bangalore', rating: 5, text: 'The AI diet planner completely transformed my eating habits. Lost 8kg in 3 months with personalized Indian meal plans!', verified: true },
    { name: 'Dr. Amit Patel', role: 'General Physician, Mumbai', rating: 5, text: 'I recommend Arogya Raksha to my patients for daily health tracking. The health assessment module is surprisingly accurate.', verified: true },
    { name: 'Riya Verma', role: 'Student, Delhi', rating: 5, text: 'The emergency guidance section helped me handle my dad\'s chest pain correctly before the ambulance arrived. Life-saving app.', verified: true },
    { name: 'Kiran Reddy', role: 'Fitness Trainer, Hyderabad', rating: 5, text: 'Best health companion I\'ve used. The medicine information database is thorough and the AI chat is genuinely helpful.', verified: true },
    { name: 'Vikram Singh', role: 'Startup Founder, Pune', rating: 5, text: 'The instant response time for medicine side effects and dosage is incredible. It feels like having a doctor in your pocket.', verified: true },
  ];


  useEffect(() => {
    // Scroll to top AFTER all other effects via rAF so nothing overrides it
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    // Also prevent browser scroll restoration
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('.hero-badge', { opacity: 0, y: -20, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 })
      .fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.4')
      .fromTo('.hero-desc', { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.6')
      .fromTo('.hero-ctas', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
      .fromTo('.hero-mockup', { opacity: 0, scale: 0.92, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1.1 }, '-=0.7');

    // Health score counter
    const scoreVal = { val: 0 };
    gsap.to(scoreVal, {
      val: 87, duration: 2.5, delay: 1, ease: 'power2.out',
      onUpdate: () => { if (healthScoreRef.current) healthScoreRef.current.textContent = Math.round(scoreVal.val); }
    });

    // Vitals fluctuation
    const iv = setInterval(() => {
      setVitals(p => ({
        ...p,
        hr: Math.floor(68 + Math.random() * 8),
        hydration: Math.min(100, Math.max(40, p.hydration + (Math.random() > 0.5 ? 1 : -1))),
      }));
    }, 3500);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
      ScrollTrigger.killAll();
    };
  }, []);

  // Auto-advance testimonial
  useEffect(() => {
    const t = setInterval(() => setTestIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Chat scroll — scroll only the CHAT CONTAINER, never the whole page
  useEffect(() => {
    if (chatContainer1Ref.current) {
      chatContainer1Ref.current.scrollTop = chatContainer1Ref.current.scrollHeight;
    }
    if (chatContainer2Ref.current) {
      chatContainer2Ref.current.scrollTop = chatContainer2Ref.current.scrollHeight;
    }
  }, [chatMessages, chatTyping]);

  // AI replies
  const chatReplies = {
    default: 'Based on your symptoms, I recommend staying hydrated, resting, and monitoring closely. Consult a physician if symptoms worsen.',
    cold: 'For cold & cough: warm ginger-turmeric tea with honey, steam inhalation, and adequate rest. Avoid cold drinks.',
    headache: 'Headaches can result from dehydration, stress, or poor sleep. Try 2 glasses of water and a 20-minute rest in a dark room.',
    diet: 'A balanced Indian diet rich in dal, sabzi, whole grains, and seasonal fruits is ideal. Aim for 5 small meals daily.',
    fever: 'For fever: stay hydrated, use a damp cloth on the forehead, and take paracetamol if above 38.5°C. Seek care if above 40°C.',
    burn: 'Cool the burn under running water for 10–20 mins. Do NOT use ice, butter, or oil. Cover with a sterile dressing.',
  };

  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatTyping) return;
    const msg = chatInput.trim();
    setChatMessages(p => [...p, { role: 'user', text: msg }]);
    setChatInput('');
    setChatTyping(true);
    setTimeout(() => {
      const lc = msg.toLowerCase();
      const reply = lc.includes('cold') || lc.includes('cough') ? chatReplies.cold
        : lc.includes('head') ? chatReplies.headache
        : lc.includes('diet') || lc.includes('food') ? chatReplies.diet
        : lc.includes('fever') ? chatReplies.fever
        : lc.includes('burn') ? chatReplies.burn
        : chatReplies.default;
      setChatMessages(p => [...p, { role: 'ai', text: reply }]);
      setChatTyping(false);
    }, 1400);
  };

  // ─── Nav links (for scroll links only) ────────────────────────────────────

  // ─── Bento cards ────────────────────────────────────────────────────────────
  const bentoCards = [
    { title: 'Medical Assistant', desc: 'Receive trusted AI-powered healthcare guidance in seconds.', icon: Stethoscope, color: 'from-violet-500 to-purple-700', path: '/medical-assistant', size: 'col-span-2 row-span-2', emoji: '🩺' },
    { title: 'Diet Planner', desc: 'Achieve your fitness goals with AI-tailored nutrition plans.', icon: Salad, color: 'from-emerald-400 to-teal-600', path: '/diet-planner', size: 'col-span-2 row-span-1', emoji: '🥗' },
    { title: 'Health Assessment', desc: 'Track and optimize your overall health score continuously.', icon: Activity, color: 'from-blue-400 to-indigo-600', path: '/health-assessment', size: 'col-span-1 row-span-1', emoji: '📊' },
    { title: 'Medicine Search', desc: 'Understand medicines, dosage, and side effects instantly.', icon: Pill, color: 'from-sky-400 to-cyan-600', path: '/medicine-info', size: 'col-span-1 row-span-1', emoji: '💊' },
    { title: 'Home Remedies', desc: 'Discover safe, natural cures from traditional wisdom.', icon: Home, color: 'from-amber-400 to-orange-600', path: '/home-remedies', size: 'col-span-1 row-span-1', emoji: '🏠' },
    { title: 'Emergency Support', desc: 'Get instant first-aid steps when every second counts.', icon: Siren, color: 'from-red-500 to-rose-700', path: '/emergency', size: 'col-span-1 row-span-1', emoji: '🚨' },
  ];

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { value: '100000', prefix: '', suffix: '+', label: 'Health Queries', icon: MessageCircle },
    { value: '50000', prefix: '', suffix: '+', label: 'Assessments', icon: Shield },
    { value: '20000', prefix: '', suffix: '+', label: 'Diet Plans', icon: Salad },
    { value: '99', prefix: '', suffix: '.9%', label: 'Platform Uptime', icon: Server },
  ];

  // ─── Trust features ─────────────────────────────────────────────────────────
  const trustFeatures = [
    { icon: Lock, title: 'Secure Health Data', desc: 'End-to-end encrypted. Your data is never sold or shared.', color: 'text-violet-500 bg-violet-500/10' },
    { icon: Brain, title: 'AI Powered Guidance', desc: 'Gemini AI tuned with WHO & CDC clinical guidelines.', color: 'text-blue-500 bg-blue-500/10' },
    { icon: Zap, title: 'Instant Recommendations', desc: 'Real-time analysis with sub-second response time.', color: 'text-amber-500 bg-amber-500/10' },
    { icon: BarChart3, title: 'Personalized Insights', desc: 'Adapts to your unique health profile over time.', color: 'text-emerald-500 bg-emerald-500/10' },
  ];

  // ─── How it works ────────────────────────────────────────────────────────────
  const steps = [
    { n: '01', title: 'Create Profile', desc: 'Add your age, gender, weight, height, and health goals.', icon: '👤' },
    { n: '02', title: 'Get Personalized Insights', desc: 'Our AI analyzes your full health profile instantly.', icon: '🧠' },
    { n: '03', title: 'Improve Your Health', desc: 'Follow tailored recommendations and track your progress.', icon: '📈' },
  ];

  // ─── Comparison data ─────────────────────────────────────────────────────────
  const comparison = [
    { feature: 'Availability', traditional: '9am–5pm', us: '24/7 AI' },
    { feature: 'Response Speed', traditional: 'Hours / Days', us: 'Instant' },
    { feature: 'Personalization', traditional: 'Generic', us: 'AI-tailored' },
    { feature: 'Cost', traditional: '₹500–₹2000+', us: 'Free' },
    { feature: 'Emergency Help', traditional: 'Clinic only', us: 'Instant Guides' },
  ];

  return (
    <div className="bg-[#f6f7ff] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 min-h-screen overflow-x-hidden relative font-sans">
      <SEO
        title="Arogya Raksha | AI Healthcare Platform | Medical Assistant | Diet Planner"
        description="Discover Arogya Raksha, the ultimate AI healthcare platform. Access an intelligent medical assistant, personalized diet planner, and health assessment tools."
        keywords="AI Healthcare, Medical Assistant, Health Assessment, Diet Planner, Medicine Search, Health Tips, Emergency Guide, Healthcare AI"
        canonical="https://arogyarakshaa.vercel.app/"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Arogya Raksha",
          "url": "https://arogyarakshaa.vercel.app",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://arogyarakshaa.vercel.app/medicine-info?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION (Fullscreen with Video Background)
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
        />
        {/* Premium Glow & Gradient Mesh */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-violet-900/10 via-transparent to-emerald-900/10 mix-blend-multiply" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-400/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
        
        {/* Glass Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        />

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-[1300px] mx-auto px-4 sm:px-8 pt-20 lg:pt-0">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-16">

            {/* ── Hero Copy (Left) ─────────────────────────────────────────────── */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 text-violet-700 border border-violet-600/20 rounded-full text-[11px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-600 opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600" />
              </span>
              AI HEALTHCARE PLATFORM
            </div>

            {/* Heading */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-[4rem] font-black leading-[1.05] tracking-tight text-slate-900 drop-shadow-sm">
              Your Personal{' '}
              <span className="inline-flex items-center gap-2 align-middle">
                <HeartPulse className="w-10 h-10 lg:w-12 lg:h-12 text-rose-500 animate-pulse drop-shadow-md" />
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                AI Healthcare
              </span>{' '}
              <span className="inline-flex items-center gap-2 align-middle">
                <ShieldPlus className="w-9 h-9 lg:w-11 lg:h-11 text-emerald-500 drop-shadow-md" />
              </span>
              <br />
              Assistant{' '}
              <span className="inline-flex items-center gap-2 align-middle">
                <Stethoscope className="w-9 h-9 lg:w-11 lg:h-11 text-blue-500 drop-shadow-md" />
              </span>
            </h1>

            {/* Subheading */}
            <p className="hero-desc text-base sm:text-lg text-slate-700 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
              Get instant medical guidance, personalized diet plans, medicine information, health assessments, and emergency support through one intelligent healthcare platform.
            </p>

            {/* CTAs */}
            <div className="hero-ctas flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                className="group flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(124,58,237,0.4)] text-sm transition-all"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-white/80 text-slate-800 border border-slate-200/60 font-bold px-8 py-4 rounded-2xl shadow-lg text-sm hover:bg-white transition-all backdrop-blur-md"
              >
                Explore Platform <ChevronDown className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Mini trust row */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
              {['AI-Powered', 'Privacy First', '24/7 Available', 'Free to Use'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Hero Mockup (Right) ───────────────────────────────────────────── */}
          <div className="hero-mockup flex-1 w-full max-w-[560px]">
            <div className="relative">
              {/* Floating cards around mockup */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -left-6 bg-white/90 rounded-2xl px-3 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center gap-2 text-xs font-bold z-10 backdrop-blur-md"
              >
                <span className="w-7 h-7 bg-rose-100 rounded-xl flex items-center justify-center">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                </span>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Heart Rate</p>
                  <p className="text-rose-600 font-bold">{vitals.hr} bpm</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute -bottom-4 -right-4 bg-white/90 rounded-2xl px-3 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center gap-2 text-xs font-bold z-10 backdrop-blur-md"
              >
                <span className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-500" />
                </span>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Health Score</p>
                  <p className="text-emerald-600 font-bold">87 / 100</p>
                </div>
              </motion.div>

              {/* Main glass card */}
              <div className="bg-white/90 backdrop-blur-3xl border border-white/40 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_40px_100px_rgba(0,0,0,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-800">Health Dashboard</p>
                      <p className="text-[10px] text-violet-500 font-semibold">Live Demo</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>

                {/* Health Score Ring */}
                <div className="flex items-center gap-6 mb-5">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="7" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="url(#grad1)" strokeWidth="7" fill="transparent"
                        strokeDasharray={251} strokeDashoffset={251 - (251 * 87) / 100} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span ref={healthScoreRef} className="text-2xl font-black text-slate-800">0</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Score</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { label: 'Heart Rate', val: `${vitals.hr} bpm`, pct: 72, color: '#ef4444' },
                      { label: 'Hydration', val: `${vitals.hydration}%`, pct: vitals.hydration, color: '#3b82f6' },
                      { label: 'Sleep Quality', val: `${vitals.sleep}h`, pct: 80, color: '#8b5cf6' },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-slate-500">{m.label}</span>
                          <span className="text-[10px] font-black text-slate-700">{m.val}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: m.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Chat Preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="w-5 h-5 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Brain className="w-3 h-3 text-violet-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-wider">AI Medical Assistant</span>
                  </div>
                  <div className="max-h-[140px] overflow-y-auto space-y-2 mb-2.5 pr-1" ref={chatContainer1Ref}>
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] px-3 py-2 rounded-xl text-[10px] leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white px-3 py-2 rounded-xl rounded-bl-none border border-slate-100 flex gap-1">
                          {[0, 0.2, 0.4].map((d, i) => (
                            <span key={i} className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleChatSend} className="flex gap-1.5">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask about symptoms..."
                      className="flex-1 text-[10px] px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-violet-400"
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatTyping}
                      className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center disabled:opacity-40 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TRUST STRIP (Premium Glass Badges)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full border-y border-white/40 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden py-6 mt-[-1px]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-8 flex flex-wrap justify-center lg:justify-between items-center gap-6 lg:gap-10">
          {[
            { icon: ShieldCheck, text: "WHO-Inspired Guidelines" },
            { icon: Lock, text: "Privacy First" },
            { icon: Brain, text: "AI Powered" },
            { icon: Server, text: "Secure Authentication" },
            { icon: Globe2, text: "OpenFDA Powered" },
            { icon: Clock, text: "24/7 Availability" },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2.5 group cursor-default"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 group-hover:border-violet-200 dark:group-hover:border-violet-700 transition-colors">
                <item.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </section>



      {/* ═══════════════════════════════════════════════════════════════════
          BENTO GRID
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-8 max-w-[1300px] mx-auto relative z-10">
        <FadeUp className="text-center mb-14">
          <SectionLabel color="text-blue-500 bg-blue-500/10 border-blue-500/20">Health Modules</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 mb-3 text-slate-900 dark:text-white">
            Complete Healthcare Ecosystem
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            Six intelligent modules working together to protect and optimize your health.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] gap-5">
          {bentoCards.map((card, i) => {
            const isLarge = card.size.includes('col-span-2') && card.size.includes('row-span-2');
            const isWide = card.size.includes('col-span-2') && !card.size.includes('row-span-2');
            return (
              <FadeUp key={card.title} delay={i * 0.08}
                className={`${isLarge ? 'sm:col-span-2 sm:row-span-2' : isWide ? 'sm:col-span-2' : ''}`}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(card.path)}
                  className="h-full relative overflow-hidden rounded-[2rem] cursor-pointer group border border-slate-200/50 dark:border-slate-700/40 shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl"
                >
                  {/* Subtle Gradient Glow Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />
                  
                  {/* Animated Border Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]`} style={{ padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

                  <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                    <div>
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md mb-5`}
                      >
                        <card.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className={`font-black text-slate-900 dark:text-white mb-2 tracking-tight ${isLarge ? 'text-3xl' : 'text-xl'}`}>{card.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-[280px]">{card.desc}</p>
                    </div>
                    {isLarge && (
                      <div className="mt-6 flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-400 group-hover:gap-4 transition-all">
                        Open Module <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                    <motion.div 
                      className="absolute bottom-5 right-5 text-4xl opacity-5 group-hover:opacity-20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 select-none pointer-events-none"
                    >
                      {card.emoji}
                    </motion.div>
                  </div>
                </motion.div>
              </FadeUp>
            );
          })}
        </div>
      </section>



      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE AI CHAT SHOWCASE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-8 max-w-[1300px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeUp>
            <SectionLabel color="text-violet-500 bg-violet-500/10 border-violet-500/20">AI Assistant</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black mt-4 mb-5 text-slate-900 dark:text-white">
              Your 24/7 Medical<br />AI Companion
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Describe your symptoms in natural language and get instant, clinically-informed guidance. Our AI is tuned with WHO and CDC guidelines.
            </p>
            <div className="space-y-4">
              {['Symptom Analysis', 'Medicine Information', 'Diet Guidance', 'Emergency First Aid'].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-violet-500" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{f}</span>
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/medical-assistant')}
              className="mt-8 flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-violet-500/25 text-sm"
            >
              Try Medical Assistant <ArrowRight className="w-4 h-4" />
            </motion.button>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-[2rem] p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-slate-800 dark:text-white">Medical Assistant</p>
                  <p className="text-[10px] text-emerald-500 font-bold">● Online</p>
                </div>
              </div>
              <div className="h-[280px] overflow-y-auto space-y-3 mb-4 pr-1" ref={chatContainer2Ref}>
                {chatMessages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                    }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {chatTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700 flex gap-1 items-center">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSend} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your symptom (e.g. cold, headache)..."
                  className="flex-1 text-sm px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-400 dark:text-white"
                />
                <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!chatInput.trim() || chatTyping}
                  className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0 shadow-lg transition-all">
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>
            </div>
          </FadeUp>
        </div>
      </section>



      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-8 max-w-[1300px] mx-auto relative z-10">
        <FadeUp className="text-center mb-14">
          <SectionLabel color="text-amber-500 bg-amber-500/10 border-amber-500/20">Testimonials</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 mb-3 text-slate-900 dark:text-white tracking-tight">
            Loved by Our Users
          </h2>
        </FadeUp>
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={testIdx}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/40 dark:border-slate-700/50 rounded-[2.5rem] p-10 lg:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] text-center overflow-hidden relative"
            >
              {/* Premium Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-amber-400/20 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="flex justify-center mb-8 gap-1">
                {Array(testimonials[testIdx].rating).fill(0).map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-sm" />
                ))}
              </div>
              <p className="text-xl lg:text-3xl text-slate-800 dark:text-slate-100 font-medium leading-snug mb-10 tracking-tight">
                "{testimonials[testIdx].text}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {testimonials[testIdx].name[0]}
                </div>
                <div className="text-left">
                  <p className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    {testimonials[testIdx].name}
                    {testimonials[testIdx].verified && (
                      <Award className="w-4 h-4 text-emerald-500" />
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{testimonials[testIdx].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i} onClick={() => setTestIdx(i)}
                className={`h-2 rounded-full transition-all duration-500 ${i === testIdx ? 'bg-violet-600 w-8' : 'bg-slate-200 dark:bg-slate-700 w-2 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TRUST INDICATORS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-8 max-w-[1300px] mx-auto relative z-10 border-t border-slate-200/50 dark:border-slate-800/50 mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/50 dark:divide-slate-800/50">
          {stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.1} className="text-center px-4">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-violet-500">
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                <Counter target={s.value} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PREMIUM CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-8 max-w-[1300px] mx-auto relative z-10">
        <FadeUp>
          <div className="relative overflow-hidden rounded-[3rem] text-center px-8 py-24 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.1) 50%, rgba(16,185,129,0.1) 100%)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}>
            {/* Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-violet-500/20 rounded-full blur-[100px]" />
            </div>
            
            <div className="relative z-10">
              <Badge className="text-violet-600 dark:text-violet-400 border-violet-300/40 bg-white/50 dark:bg-violet-500/10 mb-8 backdrop-blur-md">🚀 Get Started Today</Badge>
              <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                Take Control Of Your<br />
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                  Health Today
                </span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                Everything you need for smarter healthcare in one intelligent platform. Free to start, powerful for life. Join thousands of users optimizing their wellbeing.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(user ? '/dashboard' : '/signup')}
                  className="w-full sm:w-auto flex justify-center items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black px-12 py-5 rounded-2xl shadow-[0_20px_40px_-10px_rgba(124,58,237,0.5)] text-lg transition-all"
                >
                  Start Free <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/medical-assistant')}
                  className="w-full sm:w-auto flex justify-center items-center gap-2.5 bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold px-12 py-5 rounded-2xl text-lg backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all shadow-lg"
                >
                  Explore Features
                </motion.button>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

    </div>
  );
}

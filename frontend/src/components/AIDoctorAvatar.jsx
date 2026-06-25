import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Stethoscope, Utensils, Pill, AlertTriangle, Leaf } from 'lucide-react';

const modes = {
  physician: { icon: Stethoscope, color: 'text-violet-500', bg: 'bg-violet-500', glow: 'shadow-violet-500/50' },
  nutrition: { icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
  medicine: { icon: Pill, color: 'text-sky-500', bg: 'bg-sky-500', glow: 'shadow-sky-500/50' },
  emergency: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/50' },
  remedy: { icon: Leaf, color: 'text-orange-500', bg: 'bg-orange-500', glow: 'shadow-orange-500/50' }
};

export default function AIDoctorAvatar({ state = 'idle', mode = 'physician' }) {
  const currentMode = modes[mode] || modes.physician;
  const Icon = currentMode.icon;

  // Animation variants based on state
  const variants = {
    idle: {
      scale: [1, 1.02, 1],
      y: [0, -5, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    listening: {
      scale: [1, 1.05, 1],
      boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px var(--glow-color)", "0px 0px 0px rgba(0,0,0,0)"],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    speaking: {
      scale: [1, 1.05, 1.02, 1.08, 1],
      rotate: [0, -2, 2, -1, 0],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
    },
    typing: {
      y: [0, -3, 0],
      transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const getStatusText = () => {
    switch(state) {
      case 'listening': return 'Listening...';
      case 'speaking': return 'Speaking...';
      case 'typing': return 'Analyzing...';
      default: return 'Online';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative">
        {/* Pulse rings for listening/speaking */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <motion.div 
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className={`absolute inset-0 rounded-full ${currentMode.bg} opacity-20`}
            />
            <motion.div 
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
              className={`absolute inset-0 rounded-full ${currentMode.bg} opacity-20`}
            />
          </>
        )}

        <motion.div 
          style={{ '--glow-color': currentMode.bg.replace('bg-', '') }} // Rough proxy for glow color
          variants={variants}
          animate={state}
          className={`relative w-24 h-24 rounded-3xl bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-xl flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 z-10 ${state === 'listening' ? currentMode.glow : ''}`}
        >
          <div className={`w-16 h-16 rounded-2xl ${currentMode.bg}/10 flex items-center justify-center backdrop-blur-sm`}>
            <Icon className={`w-8 h-8 ${currentMode.color}`} />
          </div>

          {/* Activity indicator dot */}
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
            state === 'idle' ? 'bg-emerald-500' : 
            state === 'listening' ? 'bg-red-500 animate-pulse' : 
            'bg-blue-500'
          }`} />
        </motion.div>
      </div>

      {/* Status indicator */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-slate-800/50 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
          {state === 'typing' && (
            <div className="flex gap-1 items-center mr-1">
              <span className={`w-1.5 h-1.5 rounded-full ${currentMode.bg} animate-bounce`} style={{ animationDelay: '0s' }} />
              <span className={`w-1.5 h-1.5 rounded-full ${currentMode.bg} animate-bounce`} style={{ animationDelay: '0.2s' }} />
              <span className={`w-1.5 h-1.5 rounded-full ${currentMode.bg} animate-bounce`} style={{ animationDelay: '0.4s' }} />
            </div>
          )}
          {state === 'speaking' && <Activity className={`w-3.5 h-3.5 ${currentMode.color} animate-pulse`} />}
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
}

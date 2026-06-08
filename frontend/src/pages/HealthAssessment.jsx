import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HealthAssessment() {
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLatestAssessment();
    fetchHistory();
  }, []);

  const fetchLatestAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assessment/latest');
      setLatestAssessment(res.data);
    } catch (err) {
      console.warn('No health assessment generated yet.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/assessment/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load assessment history:', err.message);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/assessment/generate');
      setLatestAssessment(res.data);
      // Reload history
      const resHistory = await api.get('/assessment/history');
      setHistory(resHistory.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate assessment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get('/auth/profile/export-pdf');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "Arogya_Raksha_Health_Report.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export report.');
    }
  };

  // Convert scores to percentage for circular gauge stroke
  const radius = 70;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = latestAssessment 
    ? strokeDasharray - (latestAssessment.healthScore / 100) * strokeDasharray 
    : strokeDasharray;

  // Chart data formatting
  const chartData = history.map(h => ({
    date: new Date(h.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: h.healthScore
  }));

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <header className="mb-stack-md flex flex-col md:flex-row justify-between items-start md:items-end gap-base">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-secondary">📊 Health Assessment</h1>
          <p className="text-on-surface-variant dark:text-slate-300">Understand your overall wellness metrics and risks.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="border border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-label-md font-bold transition-all"
          >
            📥 Export report
          </button>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:opacity-90 dark:bg-secondary dark:text-slate-900 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-md"
          >
            {loading ? 'Analyzing...' : 'Retake Assessment'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-2xl">
          {error}
        </div>
      )}

      {loading && !latestAssessment ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : latestAssessment ? (
        <div className="space-y-gutter">
          
          {/* Top Row: Score circle & Line Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Score Ring Card */}
            <div className="lg:col-span-4 glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md flex flex-col items-center justify-center text-center">
              <h3 className="font-bold text-lg mb-6">Current Health Score</h3>
              
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" fill="transparent" r={radius} stroke="#eff4ff" strokeWidth="12"></circle>
                  <circle 
                    cx="80" 
                    cy="80" 
                    fill="transparent" 
                    r={radius} 
                    stroke="#0052cc" 
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700"
                  ></circle>
                </svg>
                <div className="absolute text-center">
                  <p className="text-4xl font-extrabold text-primary dark:text-secondary">{latestAssessment.healthScore}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Score</p>
                </div>
              </div>

              <div className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4 py-1.5 rounded-full font-bold text-label-md">
                {latestAssessment.healthScore >= 90 ? 'Excellent' : latestAssessment.healthScore >= 75 ? 'Good' : 'Moderate'}
              </div>
            </div>

            {/* Recharts Trends */}
            <div className="lg:col-span-8 glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
              <h3 className="font-bold text-lg mb-4">Health Score Trend History</h3>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#0052cc" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-outline">
                    Perform assessments periodically to view historical score trends.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* AI Health Analysis Narrative */}
          {latestAssessment.analysisText && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border-l-4 border-l-secondary shadow-sm">
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-bold">AI Clinical Analysis</span>
              <p className="mt-3 text-label-md leading-relaxed whitespace-pre-line font-medium text-slate-700 dark:text-slate-300">
                "{latestAssessment.analysisText}"
              </p>
            </div>
          )}

          {/* Breakdown cards */}
          <div>
            <h3 className="text-xl font-bold mb-4">Wellness Factors Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-base">
              {[
                { name: '🏃 Physical', val: latestAssessment.activityScore, color: 'text-primary' },
                { name: '🥗 Nutrition', val: latestAssessment.nutritionScore, color: 'text-emerald-500' },
                { name: '😴 Sleep', val: latestAssessment.sleepScore, color: 'text-indigo-500' },
                { name: '💧 Hydration', val: latestAssessment.hydrationScore, color: 'text-blue-500' },
                { name: '🧠 Stress', val: latestAssessment.stressScore, color: 'text-orange-500' }
              ].map(f => (
                <div key={f.name} className="glass-card rounded-xl p-4 bg-white dark:bg-slate-800 text-center shadow-sm">
                  <span className="text-label-sm text-outline">{f.name}</span>
                  <p className={`text-2xl font-extrabold mt-2 ${f.color}`}>{f.val}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            
            {/* Risk Factors */}
            <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
              <h3 className="text-lg font-bold mb-4">Active Risk Flags</h3>
              <div className="space-y-4">
                {latestAssessment.riskFactors?.length > 0 ? (
                  latestAssessment.riskFactors.map((risk, idx) => (
                    <div key={idx} className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100/30 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-red-700 dark:text-red-300">{risk.name}</h4>
                        <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-[8px] font-bold uppercase">{risk.level}</span>
                      </div>
                      <p className="text-label-sm text-on-surface-variant dark:text-slate-300">{risk.description}</p>
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">✓ Advice: {risk.advice}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface-variant dark:text-slate-400 italic text-label-md">No risk factors identified. Maintain your habits!</p>
                )}
              </div>
            </div>

            {/* Improvement Roadmap */}
            <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
              <h3 className="text-lg font-bold mb-4">Health Improvement Roadmap</h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="font-bold text-label-md">Next 7 Days (Hydration focus)</h4>
                    <p className="text-label-sm text-on-surface-variant dark:text-slate-400">Increase pure water intake to 3L daily. Log items in Tracker.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="font-bold text-label-md">Next 30 Days (Activity focus)</h4>
                    <p className="text-label-sm text-on-surface-variant dark:text-slate-400">Maintain exercise frequency of at least 3 days a week. Complete assessments weekly.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="font-bold text-label-md">Next 90 Days (Transformation target)</h4>
                    <p className="text-label-sm text-on-surface-variant dark:text-slate-400">Improve BMI towards normal range and sustain stable sleep scores.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 bg-white/70 dark:bg-slate-800/70 shadow-md text-center max-w-md mx-auto mt-12">
          <p className="text-3xl">📊</p>
          <h3 className="font-bold text-xl mt-4">Generate Your Health Report</h3>
          <p className="text-on-surface-variant dark:text-slate-300 text-label-md mt-2 mb-6">
            Arogya Raksha can evaluate your habits, conditions, and vitals to calibrate a detailed health scorecard.
          </p>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:opacity-90 dark:bg-secondary dark:text-slate-900 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md"
          >
            {loading ? 'Analyzing Vitals...' : 'Start Assessment'}
          </button>
        </div>
      )}
    </div>
  );
}

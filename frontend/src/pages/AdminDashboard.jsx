import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status flags
  const [sysStatus, setSysStatus] = useState({
    server: 'Online',
    database: 'Online',
    aiService: 'Online',
    maps: 'Online'
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resKpi, resCharts, resUsers] = await Promise.all([
        api.get('/admin/kpis'),
        api.get('/admin/charts'),
        api.get('/admin/users')
      ]);
      setKpis(resKpi.data);
      setCharts(resCharts.data);
      setUsers(resUsers.data);
    } catch (err) {
      console.error('Failed to load admin panel data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/suspend`);
      alert('User suspended successfully.');
      fetchAdminData();
    } catch (err) {
      alert('Failed to suspend user.');
    }
  };

  const COLORS = ['#0052cc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <header className="mb-stack-md flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-secondary">🛡️ Executive Admin Dashboard</h1>
          <p className="text-on-surface-variant dark:text-slate-300">Track platform usage metrics, user demographics, and AI gateway operations.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="border border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl text-label-md font-bold transition-all"
        >
          🔄 Refresh Analytics
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-gutter">
          
          {/* KPIs Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm">
              <span className="text-outline text-xs uppercase font-bold">Total Enrolled</span>
              <h3 className="text-3xl font-extrabold mt-2 text-primary dark:text-secondary">{kpis?.totalUsers}</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm">
              <span className="text-outline text-xs uppercase font-bold">Active Today</span>
              <h3 className="text-3xl font-extrabold mt-2 text-emerald-500">{kpis?.activeUsersToday}</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm">
              <span className="text-outline text-xs uppercase font-bold">SOS Requests</span>
              <h3 className="text-3xl font-extrabold mt-2 text-red-500">{kpis?.emergencyRequestsToday}</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm">
              <span className="text-outline text-xs uppercase font-bold">AI Queries</span>
              <h3 className="text-3xl font-extrabold mt-2 text-indigo-500">{kpis?.medicalAssistantQueries}</h3>
            </div>
          </div>

          {/* System Health Indicators */}
          <div className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
            <span className="font-bold text-label-md">System Node Health Status:</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span> Server: {sysStatus.server}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Database: {sysStatus.database}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> AI gateway: {sysStatus.aiService}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Maps API: {sysStatus.maps}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            
            {/* Chart 1: Registration Trend */}
            <div className="glass-card rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-md">
              <h3 className="font-bold text-lg mb-4">Registration Analytics Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.registrationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="registrations" stroke="#0052cc" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: API usage volume */}
            <div className="glass-card rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-md">
              <h3 className="font-bold text-lg mb-4">AI Token Gateway Usage</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.apiTokenUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tokens" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* User Management Table */}
          <div className="glass-card rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-md overflow-hidden">
            <h3 className="font-bold text-lg mb-4">User Directory Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-label-md border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/35 bg-slate-50 dark:bg-slate-900 text-outline text-xs uppercase">
                    <th className="p-3">User Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Mobile No.</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-outline-variant/10 hover:bg-slate-50/50">
                      <td className="p-3 font-bold">{u.firstName} {u.lastName}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.mobile}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'Admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isSuspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleSuspend(u._id)}
                          disabled={u.isSuspended}
                          className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

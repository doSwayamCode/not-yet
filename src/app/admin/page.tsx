'use client';

import React, { useEffect, useState } from 'react';
import { useAppUser } from '@/lib/auth-wrapper';
import { ShieldCheck, Users, BookOpen, AlertTriangle, MessageSquare, ShieldAlert, BarChart3, Database, Mail, HardDrive, RefreshCw, FileDown, Check, Trash2 } from 'lucide-react';

interface LogItem {
  _id: string;
  userId?: string;
  username?: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'danger';
  createdAt: string;
}

interface CostMetric {
  usedKb?: string;
  limitKb?: string;
  commandsToday?: number;
  limitDaily?: number;
  usedMb?: string;
  limitMb?: string;
  sentThisMonth?: number;
  limitMonthly?: number;
  percentage: string;
  cost: number;
}

interface AdminData {
  stats: {
    totalUsers: number;
    totalJourneys: number;
    flaggedJourneys: number;
    flaggedComments: number;
  };
  costDashboard: {
    mongodb: CostMetric;
    redis: CostMetric;
    cloudinary: CostMetric;
    resend: CostMetric;
    estimatedMonthlyBill: number;
    currency: string;
  };
  flaggedJourneysList: any[];
  flaggedCommentsList: any[];
  recentLogs: LogItem[];
}

export default function AdminDashboard() {
  const { isSignedIn, user, isMock } = useAppUser();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'moderation' | 'costs' | 'logs' | 'exports'>('moderation');

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Access denied. Administrator privileges required.');
      }
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unauthorized access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  const handleModerate = async (targetType: 'journey' | 'comment', targetId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, action }),
      });
      const resData = await res.json();
      if (resData.success) {
        // Refresh dashboard data
        fetchAdminData();
      } else {
        alert(resData.error || 'Failed to resolve moderation step.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Client-Side CSV Exporter
  const handleExportCSV = (type: 'rejections' | 'logs') => {
    if (!data) return;

    let csvContent = '';
    let fileName = '';

    if (type === 'rejections') {
      csvContent = 'data:text/csv;charset=utf-8,ID,User,Title,Goal,Category,Reading Time,Created At\n';
      // Combine flagged list or mock lists
      const list = data.flaggedJourneysList || [];
      list.forEach((item) => {
        csvContent += `"${item._id}","${item.author?.username}","${item.title.replace(/"/g, '""')}","${item.goal.replace(/"/g, '""')}","${item.category}",${item.readingTime},"${item.createdAt}"\n`;
      });
      fileName = 'notyet_flagged_journeys_export.csv';
    } else if (type === 'logs') {
      csvContent = 'data:text/csv;charset=utf-8,ID,User,Action,Severity,Details,Timestamp\n';
      data.recentLogs.forEach((log) => {
        csvContent += `"${log._id}","${log.username || 'system'}","${log.action}","${log.severity}","${log.details.replace(/"/g, '""')}","${log.createdAt}"\n`;
      });
      fileName = 'notyet_system_activity_logs.csv';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'danger') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (sev === 'warning') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  // Guard: Not signed in or not admin
  const isAuthorized = isSignedIn && (user?.role === 'admin' || user?.username === 'admin_director');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-400">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider font-mono">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#050505]">
        <div className="max-w-md w-full bg-[#0F0F0F] border border-neutral-900 rounded-xl p-8 text-center glow-red">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">ACCESS DENIED</h2>
          <p className="text-xs text-neutral-500 mb-6">
            Administrator permissions are required to view the SaaS control panel. 
          </p>
          <div className="text-[10px] text-amber-500 bg-neutral-950 p-4 rounded font-mono border border-neutral-900 text-left">
            💡 <strong>Mock Mode instructions:</strong> Click the "Switch User/Log In" button in the bottom right drawer and select the <strong>Devika Sharma (Admin)</strong> profile to access this dashboard.
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-rose-500 p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto" />
          <p className="text-sm font-semibold">{error || 'Data fetching failure.'}</p>
          <button onClick={fetchAdminData} className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white">Retry Connection</button>
        </div>
      </div>
    );
  }

  const { stats, costDashboard } = data;

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Title bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
              SaaS CONTROL PANEL
            </h1>
            <p className="text-xs text-neutral-500 mt-1">Manage content flags, inspect system event logs, and review cloud resources.</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 text-xs bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Dashboard
          </button>
        </div>

        {/* Overview Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Registrations', val: stats.totalUsers, icon: Users, color: 'text-blue-400' },
            { label: 'Journeys Shared', val: stats.totalJourneys, icon: BookOpen, color: 'text-amber-500' },
            { label: 'Flagged Journeys', val: stats.flaggedJourneys, icon: AlertTriangle, color: 'text-rose-500' },
            { label: 'Flagged Comments', val: stats.flaggedComments, icon: MessageSquare, color: 'text-rose-400' },
          ].map((widget, idx) => (
            <div key={idx} className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">{widget.label}</span>
                <span className="text-2xl font-black font-mono">{widget.val}</span>
              </div>
              <widget.icon className={`w-8 h-8 ${widget.color} opacity-40`} />
            </div>
          ))}
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-900 overflow-x-auto gap-2">
          {[
            { key: 'moderation', label: `Moderation Queue (${stats.flaggedJourneys + stats.flaggedComments})` },
            { key: 'costs', label: 'Admin Cost Dashboard' },
            { key: 'logs', label: 'System Audit Logs' },
            { key: 'exports', label: 'Data Exports' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: MODERATION QUEUE */}
        {activeTab === 'moderation' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Flagged Journeys */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Flagged Journeys ({data.flaggedJourneysList?.length || 0})</h2>
              
              {data.flaggedJourneysList?.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-900 rounded-xl italic">
                  No journeys flagged for review.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.flaggedJourneysList.map((j) => (
                    <div key={j._id} className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-neutral-500">ID: {j._id}</span>
                          <span className="text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-semibold uppercase">Flagged</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1.5">{j.title}</h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">{j.whatHappened}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleModerate('journey', j._id, 'approve')}
                          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold px-3 py-1.5 rounded transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleModerate('journey', j._id, 'reject')}
                          className="flex items-center gap-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold px-3 py-1.5 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Archive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Flagged Comments */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Flagged Comments ({data.flaggedCommentsList?.length || 0})</h2>
              
              {data.flaggedCommentsList?.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-900 rounded-xl italic">
                  No comments flagged for review.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.flaggedCommentsList.map((c) => (
                    <div key={c._id} className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-neutral-500">ID: {c._id}</span>
                          <span className="text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-semibold uppercase">Flagged</span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-2 italic">"{c.content}"</p>
                        <span className="text-[10px] text-neutral-500 block mt-1">Author: @{c.author?.username}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleModerate('comment', c._id, 'approve')}
                          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold px-3 py-1.5 rounded transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleModerate('comment', c._id, 'reject')}
                          className="flex items-center gap-1 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold px-3 py-1.5 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COST DASHBOARD */}
        {activeTab === 'costs' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0F0F0F] border border-neutral-900 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 glow-amber">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Monthly Infrastructure Bill
                </h3>
                <p className="text-xs text-neutral-400">Estimated current expenditure on active free tiers.</p>
              </div>
              <div className="text-center md:text-right">
                <span className="text-4xl font-black text-emerald-400 font-mono">₹{costDashboard.estimatedMonthlyBill.toFixed(2)}</span>
                <span className="text-[10px] block text-neutral-500 uppercase tracking-widest font-mono mt-1">₹0.00 / FREE TIERS ACTIVE</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* MongoDB Atlas Free Limit */}
              <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Database className="w-4 h-4 text-cyan-400" />
                    MONGODB ATLAS STORAGE
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{costDashboard.mongodb.percentage}%</span>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                    <div className="h-full bg-cyan-500" style={{ width: `${costDashboard.mongodb.percentage}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Used: {costDashboard.mongodb.usedKb} KB</span>
                    <span>Limit: {costDashboard.mongodb.limitKb} KB (512MB)</span>
                  </div>
                </div>
              </div>

              {/* System Cache Quota */}
              <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    SYSTEM CACHE OPERATIONS
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{costDashboard.redis.percentage}%</span>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                    <div className="h-full bg-emerald-500" style={{ width: `${costDashboard.redis.percentage}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Operations Today: {costDashboard.redis.commandsToday} ops</span>
                    <span>Limit: {costDashboard.redis.limitDaily} ops</span>
                  </div>
                </div>
              </div>

              {/* Cloudinary Media Storage */}
              <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    CLOUDINARY IMAGE STORAGE
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{costDashboard.cloudinary.percentage}%</span>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                    <div className="h-full bg-indigo-500" style={{ width: `${costDashboard.cloudinary.percentage}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Used: {costDashboard.cloudinary.usedMb} MB</span>
                    <span>Limit: 25.00 GB (25,600 MB)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">Recent Activity Logs</h3>
              <span className="text-[10px] font-mono text-neutral-500">Showing last 50 transactions</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-500 uppercase text-[9px] tracking-wider border-b border-neutral-900">
                    <th className="p-3.5 pl-5">Timestamp</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5 pr-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 font-sans">
                  {data.recentLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-neutral-950/40 transition">
                      <td className="p-3.5 pl-5 text-[10px] font-mono text-neutral-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3.5 text-neutral-300 font-bold">@{log.username || 'system'}</td>
                      <td className="p-3.5"><span className="font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-900/60 text-neutral-300">{log.action}</span></td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-neutral-400">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DATA EXPORTS */}
        {activeTab === 'exports' && (
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Data Export Center</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Download local database files as CSV/Excel directly to your machine.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-lg space-y-3">
                <div className="text-xs font-bold text-white">Flagged Journeys Records</div>
                <p className="text-[10px] text-neutral-500">Exports all journeys currently in the moderation queue as a CSV spreadsheet.</p>
                <button
                  onClick={() => handleExportCSV('rejections')}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition text-amber-500"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-lg space-y-3">
                <div className="text-xs font-bold text-white">System Activity Logs</div>
                <p className="text-[10px] text-neutral-500">Exports the active history trace (up to 50 entries) of audit events.</p>
                <button
                  onClick={() => handleExportCSV('logs')}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition text-amber-500"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

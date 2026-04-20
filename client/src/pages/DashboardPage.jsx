// src/pages/DashboardPage.jsx – Main dashboard with analytics
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, TrendingUp, UserX,
  Flame, Sun, Snowflake, BarChart2, ArrowRight, RefreshCw
} from 'lucide-react';
import { analyticsApi, leadsApi } from '../utils/api.js';
import { StatCard, Spinner, Badge } from '../components/UI/index.jsx';
import { TAG_ICONS, STATUS_LABELS, formatRelative, getInitials, getAvatarColor } from '../utils/helpers.js';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const [analyticsData, leadsData] = await Promise.all([
        analyticsApi.get(),
        leadsApi.getAll()
      ]);
      setStats(analyticsData);
      setRecentLeads(leadsData.slice(-5).reverse());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={24} className="text-emerald-500" />
        <span className="text-sm text-zinc-500">Loading dashboard...</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Your lead conversion overview</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={stats?.totalLeads || 0} icon={Users} color="emerald" />
        <StatCard label="Conversations" value={stats?.totalMessages || 0} icon={MessageSquare} color="blue" />
        <StatCard label="Conversion Rate" value={`${stats?.conversionRate || 0}%`} icon={TrendingUp} color="violet" />
        <StatCard label="Lost Leads" value={stats?.statusCounts?.lost || 0} icon={UserX} color="red" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Status breakdown */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <BarChart2 size={14} className="text-emerald-500" />
            Pipeline Status
          </h2>
          <div className="space-y-3">
            {[
              { key: 'new', label: 'New', color: 'bg-zinc-500', textColor: 'text-zinc-400' },
              { key: 'talking', label: 'In Conversation', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
              { key: 'converted', label: 'Converted', color: 'bg-violet-500', textColor: 'text-violet-400' },
              { key: 'lost', label: 'Lost', color: 'bg-red-500', textColor: 'text-red-400' }
            ].map(({ key, label, color, textColor }) => {
              const count = stats?.statusCounts?.[key] || 0;
              const total = stats?.totalLeads || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={textColor}>{label}</span>
                    <span className="text-zinc-400 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Temperature */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Lead Temperature</h2>
          <div className="space-y-4">
            {[
              { key: 'hot', label: 'Hot Leads', icon: '🔥', color: 'text-red-400', bar: 'bg-red-500' },
              { key: 'warm', label: 'Warm Leads', icon: '☀️', color: 'text-amber-400', bar: 'bg-amber-500' },
              { key: 'cold', label: 'Cold Leads', icon: '🧊', color: 'text-blue-400', bar: 'bg-blue-500' }
            ].map(({ key, label, icon, color, bar }) => {
              const count = stats?.tagCounts?.[key] || 0;
              const total = stats?.totalLeads || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={color}>{label}</span>
                      <span className="text-zinc-400">{count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-day chart */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Leads — Last 7 Days</h2>
          <div className="flex items-end gap-2 h-24">
            {(stats?.last7Days || []).map((day, i) => {
              const max = Math.max(...(stats?.last7Days || []).map(d => d.count), 1);
              const h = Math.max((day.count / max) * 100, day.count > 0 ? 15 : 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${day.count > 0 ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-600">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Recent Leads</h2>
          <button onClick={() => navigate('/leads')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {recentLeads.length === 0 ? (
            <div className="py-10 text-center text-zinc-600 text-sm">No leads yet. Add your first lead!</div>
          ) : recentLeads.map(lead => (
            <div
              key={lead.id}
              onClick={() => navigate(`/chat/${lead.id}`)}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 cursor-pointer transition-colors"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${getAvatarColor(lead.name)}`}>
                {getInitials(lead.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200 truncate">{lead.name}</span>
                  <span className="text-xs">{TAG_ICONS[lead.tag]}</span>
                </div>
                <div className="text-xs text-zinc-500 truncate">{lead.interest}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge className={`status-${lead.status} mb-1`}>{STATUS_LABELS[lead.status]}</Badge>
                <div className="text-xs text-zinc-600">{formatRelative(lead.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

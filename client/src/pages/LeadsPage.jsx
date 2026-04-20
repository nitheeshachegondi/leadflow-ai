// src/pages/LeadsPage.jsx – Lead management with add form and list
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MessageSquare, Trash2, Tag,
  ChevronDown, Users, Filter
} from 'lucide-react';
import { leadsApi } from '../utils/api.js';
import {
  Modal, Badge, EmptyState, Spinner, Toast, useToast
} from '../components/UI/index.jsx';
import {
  STATUS_LABELS, TAG_ICONS, TAG_COLORS, STATUS_COLORS,
  formatRelative, getInitials, getAvatarColor
} from '../utils/helpers.js';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', interest: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await leadsApi.getAll();
      setLeads(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      showToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeads(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.interest) return;
    setSubmitting(true);
    try {
      await leadsApi.create(form);
      showToast(`Lead "${form.name}" added! AI greeting sent 🎉`);
      setForm({ name: '', phone: '', interest: '' });
      setAddOpen(false);
      loadLeads();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add lead', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await leadsApi.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      setDeleteId(null);
      showToast('Lead deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  }

  async function handleStatusChange(id, status) {
    await leadsApi.updateStatus(id, status);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function handleTagChange(id, tag) {
    await leadsApi.updateTag(id, tag);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, tag } : l));
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) || l.interest.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchTag = filterTag === 'all' || l.tag === filterTag;
    return matchSearch && matchStatus && matchTag;
  });

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Leads</h1>
          <p className="text-sm text-zinc-500">{leads.length} total leads</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary sm:ml-auto">
          <Plus size={14} />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="input pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-auto min-w-36"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="talking">Talking</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <select
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          className="input w-auto min-w-36"
        >
          <option value="all">All Tags</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">☀️ Warm</option>
          <option value="cold">🧊 Cold</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={20} className="text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads found"
            description="Add your first lead to start the AI conversation"
            action={
              <button onClick={() => setAddOpen(true)} className="btn-primary">
                <Plus size={14} /> Add First Lead
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Lead</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Interest</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Tag</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Added</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${getAvatarColor(lead.name)}`}>
                          {getInitials(lead.name)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{lead.name}</div>
                          <div className="text-xs text-zinc-500 font-mono">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-zinc-400 max-w-xs truncate">{lead.interest}</td>
                    <td className="px-3 py-3.5">
                      <select
                        value={lead.tag}
                        onChange={e => handleTagChange(lead.id, e.target.value)}
                        className="bg-transparent text-xs border-none outline-none cursor-pointer"
                      >
                        <option value="hot">🔥 Hot</option>
                        <option value="warm">☀️ Warm</option>
                        <option value="cold">🧊 Cold</option>
                      </select>
                    </td>
                    <td className="px-3 py-3.5">
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border bg-transparent cursor-pointer outline-none ${STATUS_COLORS[lead.status]}`}
                      >
                        <option value="new">New</option>
                        <option value="talking">Talking</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-zinc-500">{formatRelative(lead.createdAt)}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/chat/${lead.id}`)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                          title="Open chat"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(lead.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Delete lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Lead">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Phone Number *</label>
            <input
              className="input"
              placeholder="e.g. +91 98765 43210"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Interest / Source *</label>
            <input
              className="input"
              placeholder="e.g. Instagram ad, Weight loss program, Flat in Banjara Hills"
              value={form.interest}
              onChange={e => setForm(p => ({ ...p, interest: e.target.value }))}
              required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? <><Spinner size={14} /> Adding...</> : <><Plus size={14} /> Add Lead</>}
            </button>
          </div>
          <p className="text-xs text-zinc-500 text-center">AI will auto-send a greeting message</p>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Lead">
        <p className="text-sm text-zinc-400 mb-5">Are you sure? This will delete the lead and all their messages permanently.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => handleDelete(deleteId)} className="btn-primary flex-1 justify-center bg-red-500 hover:bg-red-400">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => {}} />}
    </div>
  );
}

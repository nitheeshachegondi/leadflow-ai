// src/pages/AdminPage.jsx – Admin settings panel
import { useState, useEffect } from 'react';
import {
  Save, Plus, Trash2, Settings, MessageSquare,
  Briefcase, Sliders, HelpCircle, CheckCircle
} from 'lucide-react';
import { adminApi } from '../utils/api.js';
import { Spinner, Toast, useToast } from '../components/UI/index.jsx';
import { BUSINESS_TYPES, AI_TONES } from '../utils/helpers.js';

export default function AdminPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [addingFaq, setAddingFaq] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    adminApi.getSettings()
      .then(setSettings)
      .catch(() => showToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      showToast('Settings saved successfully ✓');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFaq() {
    if (!newFaq.question || !newFaq.answer) return;
    setAddingFaq(true);
    try {
      const result = await adminApi.addFaq(newFaq.question, newFaq.answer);
      setSettings(prev => ({ ...prev, faqs: result.data }));
      setNewFaq({ question: '', answer: '' });
      showToast('FAQ added');
    } catch {
      showToast('Failed to add FAQ', 'error');
    } finally {
      setAddingFaq(false);
    }
  }

  async function handleDeleteFaq(index) {
    try {
      const result = await adminApi.deleteFaq(index);
      setSettings(prev => ({ ...prev, faqs: result.data }));
      showToast('FAQ deleted');
    } catch {
      showToast('Failed to delete FAQ', 'error');
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size={20} className="text-emerald-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500">Configure your AI sales agent</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Spinner size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Business Info */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Briefcase size={15} className="text-emerald-500" />
          Business Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Business Name</label>
            <input
              className="input"
              value={settings?.businessName || ''}
              onChange={e => setSettings(p => ({ ...p, businessName: e.target.value }))}
              placeholder="e.g. FitLife Gym"
            />
          </div>
          <div>
            <label className="label">Business Type</label>
            <select
              className="input"
              value={settings?.businessType || 'coaching'}
              onChange={e => setSettings(p => ({ ...p, businessType: e.target.value }))}
            >
              {BUSINESS_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Sliders size={15} className="text-emerald-500" />
          AI Agent Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">AI Conversation Tone</label>
            <select
              className="input"
              value={settings?.aiTone || 'friendly'}
              onChange={e => setSettings(p => ({ ...p, aiTone: e.target.value }))}
            >
              {AI_TONES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Follow-up Delay (minutes)</label>
            <input
              type="number"
              className="input"
              value={settings?.followUpDelay || 30}
              min={5}
              max={1440}
              onChange={e => setSettings(p => ({ ...p, followUpDelay: parseInt(e.target.value) }))}
            />
            <p className="text-xs text-zinc-600 mt-1">
              Auto follow-up if no reply after {settings?.followUpDelay || 30} min
            </p>
          </div>
        </div>

        {/* Tone Preview */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
          <div className="text-xs text-zinc-500 mb-2">📝 AI Prompt Preview</div>
          <div className="text-xs text-zinc-400 leading-relaxed">
            AI will act as a <span className="text-emerald-400 font-medium">{settings?.aiTone || 'friendly'}</span> sales assistant
            for <span className="text-emerald-400 font-medium">{settings?.businessName || 'your business'}</span>,
            specialized in <span className="text-emerald-400 font-medium">
              {BUSINESS_TYPES.find(t => t.value === settings?.businessType)?.label || 'coaching'}
            </span>.
            It will ask about budget, requirements, and timeline to qualify leads.
          </div>
        </div>
      </div>

      {/* FAQ Management */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <HelpCircle size={15} className="text-emerald-500" />
          FAQ Answers
          <span className="text-xs text-zinc-500 font-normal">— AI uses these to answer common questions</span>
        </h2>

        {/* Existing FAQs */}
        <div className="space-y-2">
          {(settings?.faqs || []).map((faq, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-emerald-400 mb-1">Q: {faq.question}</div>
                  <div className="text-xs text-zinc-400">A: {faq.answer}</div>
                </div>
                <button
                  onClick={() => handleDeleteFaq(i)}
                  className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {(settings?.faqs || []).length === 0 && (
            <div className="text-xs text-zinc-600 py-3 text-center">No FAQs added yet</div>
          )}
        </div>

        {/* Add FAQ */}
        <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 space-y-3">
          <div className="text-xs font-medium text-zinc-400">Add New FAQ</div>
          <input
            className="input text-xs"
            placeholder="Question (e.g. What are your timings?)"
            value={newFaq.question}
            onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))}
          />
          <textarea
            className="input text-xs resize-none"
            rows={2}
            placeholder="Answer (e.g. We are available 9 AM to 6 PM...)"
            value={newFaq.answer}
            onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))}
          />
          <button
            onClick={handleAddFaq}
            disabled={addingFaq || !newFaq.question || !newFaq.answer}
            className="btn-secondary text-xs"
          >
            {addingFaq ? <Spinner size={12} /> : <Plus size={12} />}
            Add FAQ
          </button>
        </div>
      </div>

      {/* WhatsApp Integration Info */}
      <div className="card p-5 border-amber-500/20">
        <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
          <MessageSquare size={15} />
          Future: Real WhatsApp Integration
        </h2>
        <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
          <p>To connect real WhatsApp, you can use one of these approaches:</p>
          <ul className="space-y-1.5 ml-3">
            <li className="flex gap-2"><span className="text-emerald-500">1.</span><span><strong className="text-zinc-300">Twilio WhatsApp API</strong> — Paid, but easiest. Get a WhatsApp sandbox number and webhook URL pointing to <code className="text-emerald-400 bg-zinc-800 px-1 rounded">/api/chat/webhook</code></span></li>
            <li className="flex gap-2"><span className="text-emerald-500">2.</span><span><strong className="text-zinc-300">Meta WhatsApp Cloud API</strong> — Free tier. Create a Meta Business account, verify your number, and set webhook to receive messages.</span></li>
            <li className="flex gap-2"><span className="text-emerald-500">3.</span><span><strong className="text-zinc-300">whatsapp-web.js</strong> — Open source, scan QR to link your existing number. No approval needed.</span></li>
          </ul>
          <p className="text-zinc-500 pt-1">The backend AI logic is already webhook-ready. Only the transport layer needs to be added.</p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => {}} />}
    </div>
  );
}

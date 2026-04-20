// src/pages/ChatPage.jsx – WhatsApp-style chat interface
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, Bell, ChevronLeft, MoreVertical,
  MessageSquare, Phone, Check, CheckCheck
} from 'lucide-react';
import { leadsApi, chatApi } from '../utils/api.js';
import { Spinner, Badge, EmptyState } from '../components/UI/index.jsx';
import {
  TAG_ICONS, STATUS_LABELS, STATUS_COLORS,
  formatTime, formatMessageDate, getInitials, getAvatarColor
} from '../utils/helpers.js';

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs flex-shrink-0">
        🤖
      </div>
      <div className="relative bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, leadName }) {
  const isAI = msg.role === 'assistant';
  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs flex-shrink-0">
          🤖
        </div>
      )}
      <div className={`max-w-[75%] group ${isAI ? '' : ''}`}>
        {msg.isFollowUp && (
          <div className={`text-xs mb-1 followup-badge ${isAI ? '' : 'text-right'}`}>
            📩 Follow-up
          </div>
        )}
        <div className={`
          relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isAI
            ? 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
            : 'bg-emerald-500 text-black rounded-tr-sm'
          }
        `}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isAI ? '' : 'flex-row-reverse'}`}>
          <span className="text-xs text-zinc-600">{formatTime(msg.timestamp)}</span>
          {!isAI && <CheckCheck size={12} className="text-emerald-400" />}
        </div>
      </div>
    </div>
  );
}

// ─── Lead Sidebar Item ────────────────────────────────────────────────────────
function LeadItem({ lead, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-zinc-800/50 border-l-2 border-transparent'
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${getAvatarColor(lead.name)}`}>
        {getInitials(lead.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-200 truncate">{lead.name}</span>
          <span className="text-xs">{TAG_ICONS[lead.tag]}</span>
        </div>
        <div className="text-xs text-zinc-500 truncate">{lead.interest}</div>
      </div>
      {lead.status === 'talking' && (
        <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [followingUp, setFollowingUp] = useState(false);
  const [search, setSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load all leads
  async function loadLeads() {
    try {
      const data = await leadsApi.getAll();
      setLeads(data.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
    } catch {}
  }

  // Load messages for a lead
  async function loadMessages(id) {
    if (!id) return;
    setLoadingMsgs(true);
    try {
      const data = await chatApi.getMessages(id);
      setMessages(data.data || []);
      setActiveLead(data.lead);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }

  useEffect(() => { loadLeads(); }, []);

  useEffect(() => {
    if (leadId) {
      loadMessages(leadId);
      if (window.innerWidth < 768) setShowSidebar(false);
    }
  }, [leadId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Group messages by date
  function groupMessagesByDate(msgs) {
    const groups = {};
    msgs.forEach(msg => {
      const dateKey = formatMessageDate(msg.timestamp);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || !leadId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    setTyping(true);

    // Optimistically add user message
    const tempMsg = {
      id: 'temp-' + Date.now(),
      leadId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const data = await chatApi.sendMessage(leadId, text);
      setMessages(prev => {
        const without = prev.filter(m => m.id !== tempMsg.id);
        return [...without, data.userMessage, data.aiMessage];
      });
      // Update lead tag if changed
      if (data.leadTag && activeLead) {
        setActiveLead(prev => ({ ...prev, tag: data.leadTag }));
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, tag: data.leadTag } : l));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
      setTyping(false);
      inputRef.current?.focus();
    }
  }

  async function handleFollowUp() {
    if (!leadId || followingUp) return;
    setFollowingUp(true);
    try {
      const data = await chatApi.sendFollowUp(leadId);
      setMessages(prev => [...prev, data.message]);
    } catch {}
    finally { setFollowingUp(false); }
  }

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search)
  );
  const grouped = groupMessagesByDate(messages);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Lead List Sidebar */}
      <div className={`
        flex-shrink-0 w-72 border-r border-zinc-800 flex flex-col bg-zinc-900
        ${showSidebar ? 'flex' : 'hidden md:flex'}
        ${leadId ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="px-4 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-sm text-zinc-200 mb-3">Conversations</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="input text-xs"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-xs px-4">
              No conversations yet.<br />Add leads to start chatting.
            </div>
          ) : filteredLeads.map(lead => (
            <LeadItem
              key={lead.id}
              lead={lead}
              isActive={lead.id === leadId}
              onClick={() => navigate(`/chat/${lead.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {!leadId ? (
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <EmptyState
            icon={MessageSquare}
            title="Select a conversation"
            description="Choose a lead from the left to view or continue their WhatsApp conversation"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <button
              onClick={() => { setShowSidebar(true); navigate('/chat'); }}
              className="md:hidden text-zinc-400 hover:text-zinc-200 mr-1"
            >
              <ChevronLeft size={20} />
            </button>
            {activeLead && (
              <>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${getAvatarColor(activeLead.name)}`}>
                  {getInitials(activeLead.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-200">{activeLead.name}</span>
                    <span className="text-sm">{TAG_ICONS[activeLead.tag]}</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">{activeLead.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`status-${activeLead.status} hidden sm:flex`}>
                    {STATUS_LABELS[activeLead.status]}
                  </Badge>
                  <button
                    onClick={handleFollowUp}
                    disabled={followingUp}
                    title="Send follow-up message"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    {followingUp ? <Spinner size={12} /> : <Bell size={13} />}
                    <span className="hidden sm:inline">Follow Up</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          >
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <Spinner size={20} className="text-emerald-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                No messages yet
              </div>
            ) : (
              Object.entries(grouped).map(([date, msgs]) => (
                <div key={date} className="space-y-2">
                  {/* Date separator */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-xs text-zinc-600 px-2 bg-zinc-950">{date}</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                  {msgs.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} leadName={activeLead?.name} />
                  ))}
                </div>
              ))
            )}
            {typing && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="flex items-end gap-3 px-4 py-3 border-t border-zinc-800 bg-zinc-900">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="input resize-none leading-relaxed"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary px-3 py-2.5 flex-shrink-0"
            >
              {sending ? <Spinner size={16} /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

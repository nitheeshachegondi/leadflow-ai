// src/components/UI/index.jsx – Shared UI primitives

import { Loader2 } from 'lucide-react';

// Spinner
export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

// Badge
export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={20} className="text-zinc-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon: Icon, color = 'emerald', sub }) {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    violet: 'bg-violet-500/10 text-violet-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
    zinc: 'bg-zinc-700/50 text-zinc-400'
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative card w-full max-w-md animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-sm text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Toast notification (simple)
export function Toast({ message, type = 'success', onClose }) {
  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-slide-up shadow-xl ${colors[type]}`}>
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100">×</button>
    </div>
  );
}

// useToast hook
import { useState, useCallback } from 'react';
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, showToast };
}

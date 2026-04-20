// src/utils/helpers.js – Shared helper functions
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function formatTime(dateStr) {
  const date = new Date(dateStr);
  return format(date, 'h:mm a');
}

export function formatMessageDate(dateStr) {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatRelative(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export const STATUS_LABELS = {
  new: 'New',
  talking: 'In Conversation',
  converted: 'Converted',
  lost: 'Lost'
};

export const TAG_COLORS = {
  hot: 'tag-hot',
  warm: 'tag-warm',
  cold: 'tag-cold'
};

export const STATUS_COLORS = {
  new: 'status-new',
  talking: 'status-talking',
  converted: 'status-converted',
  lost: 'status-lost'
};

export const TAG_ICONS = {
  hot: '🔥',
  warm: '☀️',
  cold: '🧊'
};

export const BUSINESS_TYPES = [
  { value: 'gym', label: '💪 Gym & Fitness' },
  { value: 'real_estate', label: '🏠 Real Estate' },
  { value: 'coaching', label: '🎯 Coaching & Mentorship' },
  { value: 'ecommerce', label: '🛍️ E-commerce' },
  { value: 'education', label: '📚 Education & Courses' },
  { value: 'healthcare', label: '🏥 Healthcare & Wellness' }
];

export const AI_TONES = [
  { value: 'friendly', label: '😊 Friendly & Warm' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'energetic', label: '⚡ Energetic & Bold' },
  { value: 'empathetic', label: '💙 Empathetic & Caring' }
];

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name) {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500'
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

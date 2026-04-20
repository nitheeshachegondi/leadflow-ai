// routes/analytics.js – Analytics and reporting
const express = require('express');
const router = express.Router();
const db = require('../middleware/db');

router.get('/', (req, res) => {
  const leads = db.get('leads').value();
  const messages = db.get('messages').value();

  // Status breakdown
  const statusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    talking: leads.filter(l => l.status === 'talking').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length
  };

  // Tag breakdown
  const tagCounts = {
    hot: leads.filter(l => l.tag === 'hot').length,
    warm: leads.filter(l => l.tag === 'warm').length,
    cold: leads.filter(l => l.tag === 'cold').length
  };

  // Conversion rate
  const conversionRate = leads.length > 0
    ? Math.round((statusCounts.converted / leads.length) * 100)
    : 0;

  // Leads by day (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = leads.filter(l => l.createdAt.startsWith(dateStr)).length;
    last7Days.push({
      date: dateStr,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count
    });
  }

  // Average messages per lead
  const avgMessages = leads.length > 0
    ? Math.round(messages.length / leads.length)
    : 0;

  // Most active leads (by message count)
  const topLeads = leads
    .sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0))
    .slice(0, 5)
    .map(l => ({ id: l.id, name: l.name, messageCount: l.messageCount || 0, tag: l.tag }));

  res.json({
    success: true,
    data: {
      totalLeads: leads.length,
      totalMessages: messages.length,
      statusCounts,
      tagCounts,
      conversionRate,
      last7Days,
      avgMessages,
      topLeads
    }
  });
});

module.exports = router;

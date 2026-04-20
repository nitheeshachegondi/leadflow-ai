// routes/chat.js – Chat and AI conversation endpoints
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../middleware/db');
const {
  generateAIResponse,
  generateFollowUp,
  analyzeLeadTemperature
} = require('../middleware/aiService');

// GET messages for a lead
router.get('/:leadId/messages', (req, res) => {
  const { leadId } = req.params;
  const lead = db.get('leads').find({ id: leadId }).value();
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

  const messages = db.get('messages')
    .filter({ leadId })
    .value()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json({ success: true, data: messages, lead });
});

// POST send user message and get AI reply
router.post('/:leadId/send', async (req, res) => {
  const { leadId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required' });
  }

  const lead = db.get('leads').find({ id: leadId }).value();
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

  const settings = db.get('settings').value();

  // Save user message
  const userMessage = {
    id: uuidv4(),
    leadId,
    role: 'user',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    isFollowUp: false
  };
  db.get('messages').push(userMessage).write();

  // Get conversation history for context
  const history = db.get('messages')
    .filter({ leadId })
    .value()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-15) // Keep last 15 messages for context
    .map(m => ({ role: m.role, content: m.content }));

  // Generate AI response
  const aiText = await generateAIResponse(settings, lead, history.slice(0, -1), content);

  // Small simulated delay for realism (300-800ms)
  await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

  const aiMessage = {
    id: uuidv4(),
    leadId,
    role: 'assistant',
    content: aiText,
    timestamp: new Date().toISOString(),
    isFollowUp: false
  };
  db.get('messages').push(aiMessage).write();

  // Update lead metadata
  const allMessages = db.get('messages').filter({ leadId }).value();
  const newTag = analyzeLeadTemperature(allMessages);

  db.get('leads').find({ id: leadId }).assign({
    status: 'talking',
    tag: newTag,
    lastMessageAt: new Date().toISOString(),
    messageCount: allMessages.length,
    followUpSent: false, // Reset follow-up flag on new message
    updatedAt: new Date().toISOString()
  }).write();

  res.json({
    success: true,
    userMessage,
    aiMessage,
    leadTag: newTag
  });
});

// POST trigger follow-up for a lead
router.post('/:leadId/followup', async (req, res) => {
  const { leadId } = req.params;
  const lead = db.get('leads').find({ id: leadId }).value();

  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  if (lead.status === 'converted' || lead.status === 'lost') {
    return res.status(400).json({ success: false, message: 'Cannot follow up on closed leads' });
  }

  const settings = db.get('settings').value();
  const history = db.get('messages').filter({ leadId }).value();
  const followUpText = await generateFollowUp(settings, lead, history);

  const followUpMessage = {
    id: uuidv4(),
    leadId,
    role: 'assistant',
    content: followUpText,
    timestamp: new Date().toISOString(),
    isFollowUp: true
  };

  db.get('messages').push(followUpMessage).write();
  db.get('leads').find({ id: leadId }).assign({
    followUpSent: true,
    lastMessageAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }).write();

  res.json({ success: true, message: followUpMessage });
});

// GET check for leads needing follow-up (called by a scheduler/cron)
router.get('/followup/check', (req, res) => {
  const settings = db.get('settings').value();
  const followUpDelayMs = (settings.followUpDelay || 30) * 60 * 1000;
  const now = Date.now();

  const leads = db.get('leads').value();
  const needsFollowUp = leads.filter(lead => {
    if (lead.status !== 'talking') return false;
    if (lead.followUpSent) return false;
    const lastMsg = new Date(lead.lastMessageAt).getTime();
    return (now - lastMsg) >= followUpDelayMs;
  });

  res.json({ success: true, data: needsFollowUp, count: needsFollowUp.length });
});

module.exports = router;

// routes/leads.js – Lead management endpoints
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../middleware/db');
const { generateGreeting, analyzeLeadTemperature } = require('../middleware/aiService');

// GET all leads
router.get('/', (req, res) => {
  const leads = db.get('leads').value();
  res.json({ success: true, data: leads });
});

// GET single lead
router.get('/:id', (req, res) => {
  const lead = db.get('leads').find({ id: req.params.id }).value();
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
});

// POST create new lead
router.post('/', async (req, res) => {
  const { name, phone, interest } = req.body;

  if (!name || !phone || !interest) {
    return res.status(400).json({ success: false, message: 'Name, phone, and interest are required' });
  }

  // Check for duplicate phone
  const existing = db.get('leads').find({ phone }).value();
  if (existing) {
    return res.status(409).json({ success: false, message: 'A lead with this phone number already exists' });
  }

  const newLead = {
    id: uuidv4(),
    name: name.trim(),
    phone: phone.trim(),
    interest: interest.trim(),
    status: 'new',         // new | talking | converted | lost
    tag: 'warm',           // hot | warm | cold
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    followUpSent: false,
    messageCount: 0
  };

  db.get('leads').push(newLead).write();

  // Auto-generate greeting message
  const settings = db.get('settings').value();
  const greeting = await generateGreeting(settings, newLead);

  // Save greeting as first AI message
  const greetingMessage = {
    id: uuidv4(),
    leadId: newLead.id,
    role: 'assistant',
    content: greeting,
    timestamp: new Date().toISOString(),
    isFollowUp: false
  };

  db.get('messages').push(greetingMessage).write();

  // Update message count on lead
  db.get('leads').find({ id: newLead.id }).assign({
    messageCount: 1,
    status: 'talking'
  }).write();

  console.log(`✅ New lead added: ${newLead.name} (${newLead.phone})`);

  res.status(201).json({
    success: true,
    data: newLead,
    greeting: greetingMessage
  });
});

// PATCH update lead status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'talking', 'converted', 'lost'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  db.get('leads').find({ id: req.params.id })
    .assign({ status, updatedAt: new Date().toISOString() })
    .write();

  res.json({ success: true, message: 'Status updated' });
});

// PATCH update lead tag
router.patch('/:id/tag', (req, res) => {
  const { tag } = req.body;
  const validTags = ['hot', 'warm', 'cold'];

  if (!validTags.includes(tag)) {
    return res.status(400).json({ success: false, message: 'Invalid tag' });
  }

  db.get('leads').find({ id: req.params.id })
    .assign({ tag, updatedAt: new Date().toISOString() })
    .write();

  res.json({ success: true, message: 'Tag updated' });
});

// DELETE lead
router.delete('/:id', (req, res) => {
  const lead = db.get('leads').find({ id: req.params.id }).value();
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

  db.get('leads').remove({ id: req.params.id }).write();
  db.get('messages').remove({ leadId: req.params.id }).write();

  res.json({ success: true, message: 'Lead deleted' });
});

module.exports = router;

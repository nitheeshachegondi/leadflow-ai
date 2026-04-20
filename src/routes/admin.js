// routes/admin.js – Admin settings and configuration
const express = require('express');
const router = express.Router();
const db = require('../middleware/db');

// GET current settings
router.get('/settings', (req, res) => {
  const settings = db.get('settings').value();
  res.json({ success: true, data: settings });
});

// PUT update settings
router.put('/settings', (req, res) => {
  const { businessName, businessType, aiTone, followUpDelay, faqs } = req.body;

  const updates = {};
  if (businessName) updates.businessName = businessName;
  if (businessType) updates.businessType = businessType;
  if (aiTone) updates.aiTone = aiTone;
  if (typeof followUpDelay === 'number') updates.followUpDelay = followUpDelay;
  if (Array.isArray(faqs)) updates.faqs = faqs;

  db.get('settings').assign(updates).write();

  res.json({ success: true, data: db.get('settings').value() });
});

// POST add FAQ
router.post('/faq', (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, message: 'Question and answer are required' });
  }

  const faqs = db.get('settings.faqs').value() || [];
  faqs.push({ question, answer });
  db.get('settings').assign({ faqs }).write();

  res.json({ success: true, data: faqs });
});

// DELETE FAQ by index
router.delete('/faq/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const faqs = db.get('settings.faqs').value() || [];

  if (index < 0 || index >= faqs.length) {
    return res.status(400).json({ success: false, message: 'Invalid FAQ index' });
  }

  faqs.splice(index, 1);
  db.get('settings').assign({ faqs }).write();

  res.json({ success: true, data: faqs });
});

module.exports = router;

// db.js – JSON file-based database using lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '../../data/db.json'));
const db = low(adapter);

// Set default structure
db.defaults({
  leads: [],
  messages: [],
  settings: {
    businessName: 'My Business',
    businessType: 'coaching',
    aiTone: 'friendly',
    followUpDelay: 30, // minutes
    faqs: [
      { question: 'What are your timings?', answer: 'We are available 9 AM to 6 PM, Monday to Saturday.' },
      { question: 'What is the pricing?', answer: 'Our pricing starts from ₹999/month. We have flexible plans to suit your budget.' }
    ]
  }
}).write();

module.exports = db;

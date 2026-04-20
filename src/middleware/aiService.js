// aiService.js – Groq AI integration for sales conversations
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE'
});

/**
 * Build a dynamic system prompt based on business settings and lead context.
 */
function buildSystemPrompt(settings, lead, conversationHistory) {
  const { businessType, businessName, aiTone, faqs } = settings;

  const toneGuide = {
    friendly: 'warm, conversational, and approachable — like a trusted friend',
    professional: 'polished, confident, and business-like — like a senior consultant',
    energetic: 'enthusiastic, motivating, and high-energy — like an excited coach',
    empathetic: 'caring, understanding, and patient — like a helpful advisor'
  };

  const businessContexts = {
    gym: 'fitness center and gym memberships. You help people achieve their health and fitness goals.',
    real_estate: 'real estate properties. You help clients find their dream home or investment property.',
    coaching: 'coaching and mentorship programs. You help people level up their skills and career.',
    ecommerce: 'e-commerce products and services. You help customers find the right products.',
    education: 'educational courses and training. You help learners find the right program.',
    healthcare: 'healthcare and wellness services. You connect patients with the right care.'
  };

  const faqText = faqs && faqs.length > 0
    ? `\nFAQ ANSWERS (use these when relevant):\n${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';

  // Determine what qualifying info we still need
  const hasBudget = conversationHistory.some(m =>
    m.role === 'user' && /budget|spend|cost|price|afford|₹|\$|rupee/i.test(m.content)
  );
  const hasRequirement = conversationHistory.some(m =>
    m.role === 'user' && /need|want|looking|require|interest|goal/i.test(m.content)
  );
  const hasTimeline = conversationHistory.some(m =>
    m.role === 'user' && /when|start|soon|month|week|urgent|timeline|ready/i.test(m.content)
  );

  const qualifyingStatus = `
QUALIFYING QUESTIONS STATUS:
- Budget: ${hasBudget ? '✅ Collected' : '❌ Still needed'}
- Requirement/Goal: ${hasRequirement ? '✅ Collected' : '❌ Still needed'}
- Timeline: ${hasTimeline ? '✅ Collected' : '❌ Still needed'}
${!hasBudget || !hasRequirement || !hasTimeline ? 'PRIORITY: Naturally weave in the missing qualifying questions in your next response.' : 'All key info collected — focus on closing or scheduling a call.'}
`;

  return `You are an expert AI sales assistant for "${businessName}", specializing in ${businessContexts[businessType] || businessContexts.coaching}

YOUR PERSONALITY & TONE:
You are ${toneGuide[aiTone] || toneGuide.friendly}. You are conversational and never sound like a bot. You use natural language, occasional emojis (but not too many), and you genuinely care about helping the lead.

YOUR SALES MISSION:
1. Build rapport quickly — acknowledge the lead by name when possible
2. Understand their pain points and goals through smart, natural questions
3. Present solutions that match their specific needs
4. Create gentle urgency without being pushy
5. Guide them toward a clear next step (call, demo, enrollment, visit)

CONVERSATION RULES:
- Keep responses concise (2-4 sentences max unless explaining something complex)
- Ask only ONE question at a time — never bombard with multiple questions
- Use the lead's name naturally in conversation
- If they share a concern or objection, empathize first, then address it
- Never make up prices — say you'll share detailed pricing on a call
- If they ask something in your FAQ, give that answer directly
- When all 3 qualifying questions are answered, suggest a specific next step
- Use WhatsApp-style casual but professional language

LEAD INFO:
Name: ${lead.name}
Phone: ${lead.phone}
Initial Interest: ${lead.interest}
Lead Temperature: ${lead.tag || 'new'}
${qualifyingStatus}
${faqText}

IMPORTANT: You are responding via WhatsApp chat. Be human. Be helpful. Close the deal.`;
}

/**
 * Generate AI response using Groq
 */
async function generateAIResponse(settings, lead, conversationHistory, userMessage) {
  try {
    const systemPrompt = buildSystemPrompt(settings, lead, conversationHistory);

    // Build messages array for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192', // Free tier Groq model
      messages,
      max_tokens: 300,
      temperature: 0.75, // Slightly creative but still focused
      top_p: 0.9
    });

    return completion.choices[0]?.message?.content || "Thanks for reaching out! Let me get back to you shortly.";
  } catch (error) {
    console.error('Groq API Error:', error.message);

    // Fallback responses when API is unavailable
    const fallbacks = [
      `Hi ${lead.name}! Thanks for your interest. Could you tell me a bit more about what you're looking for?`,
      `Great to hear from you! To help you better, what's your budget range for this?`,
      `Thanks! When are you looking to get started? That'll help me suggest the best option for you.`,
      `Perfect! Let me match you with the right solution. Can we schedule a quick 10-minute call?`
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

/**
 * Generate initial greeting when a new lead is added
 */
async function generateGreeting(settings, lead) {
  const greetings = {
    gym: `Hi ${lead.name}! 💪 Welcome! I'm here to help you kick-start your fitness journey. What are your main fitness goals right now?`,
    real_estate: `Hello ${lead.name}! 🏠 Thanks for your interest. Are you looking to buy, rent, or invest in a property?`,
    coaching: `Hey ${lead.name}! 🎯 So excited you reached out! What specific area are you looking to level up in?`,
    ecommerce: `Hi ${lead.name}! 🛍️ Thanks for connecting! What product or solution are you looking for today?`,
    education: `Hello ${lead.name}! 📚 Great to have you here! What skill or subject are you looking to master?`,
    healthcare: `Hi ${lead.name}! 🌟 Thanks for reaching out to ${settings.businessName}. How can we help you today?`
  };

  return greetings[settings.businessType] || greetings.coaching;
}

/**
 * Generate follow-up message when lead goes silent
 */
async function generateFollowUp(settings, lead, conversationHistory) {
  const followUps = [
    `Hey ${lead.name}! 👋 Just checking in — did you get a chance to think about what we discussed? Happy to answer any questions!`,
    `Hi ${lead.name}! We have a limited-time offer available that I think would be perfect for you. Want me to share the details? 🎁`,
    `Hey there ${lead.name}! Don't want you to miss out — spots are filling up fast. Shall we get you started this week? 🚀`,
    `Hi ${lead.name}! Quick question — is there anything specific holding you back? I'd love to help find the right fit for you 😊`
  ];

  return followUps[Math.floor(Math.random() * followUps.length)];
}

/**
 * Analyze lead temperature based on conversation
 */
function analyzeLeadTemperature(messages) {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');

  const hotSignals = ['ready', 'yes', 'interested', 'when can', 'how do i', 'sign up', 'join', 'book', 'schedule', 'call me', 'start'];
  const coldSignals = ['no', 'not interested', 'expensive', 'too much', 'maybe later', 'not now', 'busy'];
  const warmSignals = ['maybe', 'thinking', 'considering', 'tell me more', 'how much', 'what about', 'can you'];

  let hotScore = hotSignals.filter(s => userMessages.includes(s)).length;
  let coldScore = coldSignals.filter(s => userMessages.includes(s)).length;
  let warmScore = warmSignals.filter(s => userMessages.includes(s)).length;

  if (hotScore >= 2 || (hotScore >= 1 && coldScore === 0)) return 'hot';
  if (coldScore >= 2) return 'cold';
  if (warmScore >= 1 || hotScore >= 1) return 'warm';
  return 'warm'; // Default for engaged leads
}

module.exports = {
  generateAIResponse,
  generateGreeting,
  generateFollowUp,
  analyzeLeadTemperature
};

// LeadFlow AI – Unified Express + Vite Server
require('dotenv').config();

const express = require('express');
const path = require('path');

const leadsRouter = require('./src/routes/leads');
const chatRouter = require('./src/routes/chat');
const adminRouter = require('./src/routes/admin');
const analyticsRouter = require('./src/routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Routes
app.use('/api/leads', leadsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (!isProd) {
    // Vite dev middleware — same port, full HMR + CSS
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(__dirname, 'client'),
      server: { middlewareMode: true },
      appType: 'spa',
      configFile: path.resolve(__dirname, 'vite.config.js')
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built frontend
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 LeadFlow AI running on http://localhost:${PORT}\n`);
  });
}

startServer();

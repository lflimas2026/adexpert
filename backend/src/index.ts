import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { campaigns, recommendations, alerts, earnings, actionLogs, insights, connectedAccounts, aiConfigs, preferences, user } from './data/mock';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());
app.use(express.text());

const PORT = 3001;

// Auth
app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'mock_token', user });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const totalSpending = campaigns.reduce((sum, c) => sum + c.metrics.cost, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.metrics.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics.conversions || 0), 0);
  const avgRoas = totalSpending > 0 ? (campaigns.reduce((sum, c) => sum + (c.metrics.roas * c.metrics.cost), 0) / totalSpending) : 0;

  const active = campaigns.filter(c => c.status === 'active').length;
  const paused = campaigns.filter(c => c.status === 'paused').length;
  const critical = campaigns.filter(c => c.metrics.roas < 1).length;
  const warning = campaigns.filter(c => c.metrics.roas >= 1 && c.metrics.roas < 1.5).length;

  const platformComparison = ['meta', 'google', 'tiktok'].map(p => {
    const pc = campaigns.filter(c => c.platform === p && c.status === 'active');
    const spend = pc.reduce((s, c) => s + c.metrics.cost, 0);
    const conv = pc.reduce((s, c) => s + (c.metrics.conversions || 0), 0);
    const roas = spend > 0 ? pc.reduce((s, c) => s + c.metrics.roas * c.metrics.cost, 0) / spend : 0;
    const cpa = conv > 0 ? spend / conv : 0;
    return { platform: p === 'meta' ? 'Meta Ads' : p === 'google' ? 'Google Ads' : 'TikTok', spend, roas: +roas.toFixed(1), cpa: +cpa.toFixed(0) };
  });

  res.json({
    summary: { spending: totalSpending, clicks: totalClicks, conversions: totalConversions, roas: +avgRoas.toFixed(1) },
    status: { active, paused, critical, warning, total: campaigns.length },
    topRecommendations: recommendations.filter(r => r.status === 'pending').slice(0, 3),
    alerts,
    platformComparison,
    earnings
  });
});

// Campaigns
app.get('/api/campaigns', (req, res) => {
  const { platform } = req.query;
  let result = campaigns;
  if (platform && platform !== 'all') result = result.filter(c => c.platform === platform);
  res.json(result);
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  res.json(campaign);
});

// Recommendations
app.get('/api/recommendations', (req, res) => {
  const { status, campaign_id } = req.query;
  let result = recommendations;
  if (status) result = result.filter(r => r.status === status);
  if (campaign_id) result = result.filter(r => r.campaign_id === campaign_id);
  res.json(result);
});

app.post('/api/recommendations/:id/respond', (req, res) => {
  const rec = recommendations.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  rec.status = req.body.status;
  res.json(rec);
});

// Integrations
app.get('/api/integrations', (req, res) => {
  res.json({ accounts: connectedAccounts, aiConfigs, preferences });
});

app.post('/api/integrations/connect/:platform', (req, res) => {
  res.json({ success: true, message: `Conectando ${req.params.platform}...` });
});

app.post('/api/integrations/ai/:provider/connect', (req, res) => {
  const config = aiConfigs.find(c => c.provider === req.params.provider);
  if (config) {
    config.status = 'active';
    config.selected_model = req.body.model || 'claude-sonnet-4-6';
  }
  res.json({ success: true, config });
});

app.post('/api/integrations/preferences', (req, res) => {
  Object.assign(preferences, req.body);
  res.json(preferences);
});

// Insights & History
app.get('/api/insights', (req, res) => {
  res.json(insights);
});

app.get('/api/action-logs', (req, res) => {
  res.json(actionLogs);
});

// Earnings
app.get('/api/earnings', (req, res) => {
  res.json(earnings);
});

// Simple File-Based Documentation Operations (Local Express Mock)
const txtFilePath = path.join(__dirname, '..', '..', 'docs', 'app-docs.txt');
const backupsFilePath = path.join(__dirname, 'data', 'docs_backup.json');

const readTxtDocs = () => {
  try {
    if (!fs.existsSync(txtFilePath)) {
      const docsDir = path.dirname(txtFilePath);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      fs.writeFileSync(txtFilePath, '# Documentação', 'utf-8');
    }
    return fs.readFileSync(txtFilePath, 'utf-8');
  } catch (err) {
    console.error('Error reading txt doc:', err);
    return '';
  }
};

const saveTxtDocs = (content: string) => {
  try {
    const docsDir = path.dirname(txtFilePath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(txtFilePath, content, 'utf-8');
    
    // Backup emulation
    let backups: any[] = [];
    if (fs.existsSync(backupsFilePath)) {
      try {
        backups = JSON.parse(fs.readFileSync(backupsFilePath, 'utf-8'));
      } catch {}
    }
    backups.push({
      id: `backup-${Date.now()}`,
      content,
      created_at: new Date().toISOString()
    });
    fs.writeFileSync(backupsFilePath, JSON.stringify(backups, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing txt doc/backup:', err);
    return false;
  }
};

app.get('/docs/app-docs.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(readTxtDocs());
});

app.post('/api/docs/save', (req, res) => {
  const content = typeof req.body === 'string' ? req.body : req.body.content;
  if (content === undefined || content.length === 0) {
    return res.status(400).json({ error: 'Conteúdo vazio' });
  }
  const success = saveTxtDocs(content);
  if (success) {
    res.json({ success: true, message: 'Documentação salva' });
  } else {
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});


// Chat
const chatContext = `Você é o AdExpert, um consultor de tráfego pago IA 24/7. 
Você analisa campanhas de Meta Ads, Google Ads e TikTok Ads e dá recomendações.
Sempre responda em português brasileiro, de forma amigável e profissional.
Use dados reais quando disponíveis.`;

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const responses: Record<string, string> = {
    "sim": "Ótimo! Vamos às recomendações:\n\n1️⃣ **Meta Ads - Verão 2024** 🟢\nROAS 2.5x estável há 10 dias. Sugiro aumentar o budget em 50% para capturar mais vendas. Impacto estimado: +R$ 480/dia.\n\n2️⃣ **Google Search - Genérico** 🟡\nA keyword 'comprar online' em broad match gastou R$ 75 com zero conversões. Sugiro pausar e realocar esse budget.\n\n3️⃣ **TikTok - Teste A** 🔴\nROAS 0.6x com CPM alto. Prejuízo de R$ 200/dia. Recomendo pausar e reformular o criativo.\n\nQuer implementar alguma delas agora?",
    "default": "Analisei suas campanhas e notei alguns padrões interessantes:\n\n📊 **Meta Ads**: Stories tem ROAS 2.9x - melhor placement!\n📊 **Google Ads**: Quality Score subiu para 7/10 👍\n📊 **TikTok**: Vídeo A tem 2.8% CTR - bem acima da média\n\nTem alguma campanha específica ou métrica que gostaria de analisar?"
  };
  const reply = responses[message.toLowerCase().trim()] || responses.default;
  setTimeout(() => res.json({ reply }), 500);
});

// WebSocket
wss.on('connection', (ws) => {
  console.log('Client connected');
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'alert',
      data: alerts[Math.floor(Math.random() * alerts.length)]
    }));
  }, 30000);
  ws.on('close', () => clearInterval(interval));
});

server.listen(PORT, () => {
  console.log(`AdExpert Backend running on http://localhost:${PORT}`);
});

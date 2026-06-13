import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { campaigns, recommendations, alerts, earnings, actionLogs, insights, connectedAccounts, aiConfigs, preferences, user } from './data/mock';
import { initializeGemini, isGeminiConfigured, chat as geminiChat, analyzeCampaigns } from './services/gemini';
import * as metaAds from './services/meta-ads';
import * as googleAds from './services/google-ads';
import * as tiktokAds from './services/tiktok-ads';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());
app.use(express.text());

const PORT = 3001;

initializeGemini(process.env.GEMINI_API_KEY);
if (process.env.META_ADS_ACCESS_TOKEN) metaAds.configureMeta(process.env.META_ADS_ACCESS_TOKEN, process.env.META_ADS_ACCOUNT_ID || '');
if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
  googleAds.configureGoogleAds({
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
  });
}
if (process.env.TIKTOK_ADS_ACCESS_TOKEN) {
  tiktokAds.configureTikTok({
    accessToken: process.env.TIKTOK_ADS_ACCESS_TOKEN,
    advertiserId: process.env.TIKTOK_ADS_ADVERTISER_ID,
    appId: process.env.TIKTOK_ADS_APP_ID,
    secret: process.env.TIKTOK_ADS_SECRET,
  });
}

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
app.get('/api/campaigns', async (req, res) => {
  const { platform, archived, includeArchived } = req.query;

  if (platform === 'meta' && metaAds.isMetaConfigured()) {
    const realCampaigns = await metaAds.getCampaigns();
    if (realCampaigns) return res.json(realCampaigns);
  }
  if (platform === 'google' && googleAds.isGoogleAdsConfigured()) {
    const realCampaigns = await googleAds.getCampaigns();
    if (realCampaigns) return res.json(realCampaigns);
  }
  if (platform === 'tiktok' && tiktokAds.isTikTokConfigured()) {
    const realCampaigns = await tiktokAds.getCampaigns();
    if (realCampaigns) return res.json(realCampaigns);
  }

  let result = [...campaigns];
  if (platform && platform !== 'all') result = result.filter(c => c.platform === platform);

  // Filtro de arquivadas
  if (includeArchived === 'true') {
    // Retorna todas (arquivadas + ativas) - usado pela IA
  } else if (archived === 'true') {
    result = result.filter(c => c.arquivada === true);
  } else if (archived === 'false' || !archived) {
    result = result.filter(c => !c.arquivada);
  }

  res.json(result);
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  res.json(campaign);
});

app.put('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name', 'status', 'budget_daily', 'target_cpa', 'objective', 'start_date', 'end_date'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      (campaign as any)[key] = req.body[key];
    }
  }
  campaign.last_updated = new Date().toISOString();
  res.json(campaign);
});

app.post('/api/campaigns/:id/archive', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  campaign.arquivada = true;
  campaign.last_updated = new Date().toISOString();
  res.json({ success: true, campaign });
});

app.post('/api/campaigns/:id/unarchive', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  campaign.arquivada = false;
  campaign.last_updated = new Date().toISOString();
  res.json({ success: true, campaign });
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
  res.json({
    accounts: connectedAccounts.map(acc => ({
      ...acc,
      api_configured: acc.platform === 'meta' ? metaAds.isMetaConfigured()
        : acc.platform === 'google' ? googleAds.isGoogleAdsConfigured()
        : acc.platform === 'tiktok' ? tiktokAds.isTikTokConfigured()
        : false,
    })),
    aiConfigs: aiConfigs.map(cfg => ({
      ...cfg,
      api_configured: cfg.provider === 'gemini' ? isGeminiConfigured() : false,
    })),
    preferences,
  });
});

app.post('/api/integrations/connect/:platform', async (req, res) => {
  const { platform } = req.params;
  const { accessToken, accountId } = req.body;

  if (platform === 'meta' && accessToken && accountId) {
    metaAds.configureMeta(accessToken, accountId);
    const account = connectedAccounts.find(a => a.platform === 'meta');
    if (account) {
      account.is_active = true;
      account.sync_status = 'active';
      account.last_synced = new Date().toISOString();
    }
    return res.json({ success: true, message: 'Meta Ads conectado com sucesso!' });
  }

  if (platform === 'tiktok' && accessToken) {
    tiktokAds.configureTikTok({ accessToken, advertiserId: accountId || req.body.advertiserId });
    const account = connectedAccounts.find(a => a.platform === 'tiktok');
    if (account) {
      account.is_active = true;
      account.sync_status = 'active';
      account.last_synced = new Date().toISOString();
    }
    return res.json({ success: true, message: 'TikTok Ads conectado com sucesso!' });
  }

  res.json({ success: true, message: `Conectando ${platform}...` });
});

app.post('/api/integrations/ai/:provider/connect', (req, res) => {
  const config = aiConfigs.find(c => c.provider === req.params.provider);
  if (config) {
    config.status = 'active';
    config.selected_model = req.body.model || 'gemini-2.5-flash';
    if (req.params.provider === 'gemini' && req.body.apiKey) {
      initializeGemini(req.body.apiKey);
    }
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

// Chat com Gemini
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.json({ reply: 'Olá! Como posso ajudar com suas campanhas hoje?' });
  }

  if (isGeminiConfigured()) {
    try {
      const messages = [
        ...(history || []),
        { role: 'user', content: message }
      ];
      const reply = await geminiChat(messages);
      return res.json({ reply });
    } catch (err: any) {
      console.error('[Chat] Erro com Gemini, usando fallback:', err.message, err.stack);
    }
  }

  const responses: Record<string, string> = {
    "sim": "Ótimo! Vamos às recomendações:\n\n1️⃣ **Meta Ads - Verão 2024** 🟢\nROAS 2.5x estável há 10 dias. Sugiro aumentar o budget em 50% para capturar mais vendas. Impacto estimado: +R$ 480/dia.\n\n2️⃣ **Google Search - Genérico** 🟡\nA keyword 'comprar online' em broad match gastou R$ 75 com zero conversões. Sugiro pausar e realocar esse budget.\n\n3️⃣ **TikTok - Teste A** 🔴\nROAS 0.6x com CPM alto. Prejuízo de R$ 200/dia. Recomendo pausar e reformular o criativo.\n\nQuer implementar alguma delas agora?",
    "default": "Analisei suas campanhas e notei alguns padrões interessantes:\n\n📊 **Meta Ads**: Stories tem ROAS 2.9x - melhor placement!\n📊 **Google Ads**: Quality Score subiu para 7/10 👍\n📊 **TikTok**: Vídeo A tem 2.8% CTR - bem acima da média\n\nTem alguma campanha específica ou métrica que gostaria de analisar?"
  };
  const reply = responses[message.toLowerCase().trim()] || responses.default;
  setTimeout(() => res.json({ reply }), 500);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
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
  console.log(`[APIs] Gemini: ${isGeminiConfigured() ? '✅ Configurado' : '❌ Não configurado (use .env)'}`);
  console.log(`[APIs] Meta Ads: ${metaAds.isMetaConfigured() ? '✅ Configurado' : '❌ Não configurado (use .env)'}`);
  console.log(`[APIs] Google Ads: ${googleAds.isGoogleAdsConfigured() ? '✅ Configurado' : '❌ Não configurado (use .env)'}`);
  console.log(`[APIs] TikTok Ads: ${tiktokAds.isTikTokConfigured() ? '✅ Configurado' : '❌ Não configurado (use .env)'}`);
});

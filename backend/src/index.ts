import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import { campaigns, recommendations, alerts, earnings, actionLogs, insights, connectedAccounts, aiConfigs, preferences, user } from './data/mock';
const localCampaigns: any[] = [];
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
  const anyRealApi = metaAds.isMetaConfigured() || googleAds.isGoogleAdsConfigured() || tiktokAds.isTikTokConfigured();
  const mockIds = new Set(['c1','c2','c3','c4','c5','c6']);
  const dataCampaigns = anyRealApi ? campaigns.filter((c: { id: string }) => !mockIds.has(c.id)) : campaigns;

  const totalSpending = dataCampaigns.reduce((sum, c) => sum + c.metrics.cost, 0);
  const totalClicks = dataCampaigns.reduce((sum, c) => sum + c.metrics.clicks, 0);
  const totalConversions = dataCampaigns.reduce((sum, c) => sum + (c.metrics.conversions || 0), 0);
  const avgRoas = totalSpending > 0 ? (dataCampaigns.reduce((sum, c) => sum + (c.metrics.roas * c.metrics.cost), 0) / totalSpending) : 0;

  const active = dataCampaigns.filter(c => c.status === 'active').length;
  const paused = dataCampaigns.filter(c => c.status === 'paused').length;
  const critical = dataCampaigns.filter(c => c.metrics.roas < 1).length;
  const warning = dataCampaigns.filter(c => c.metrics.roas >= 1 && c.metrics.roas < 1.5).length;

  const platformComparison = ['meta', 'google', 'tiktok'].map(p => {
    const pc = dataCampaigns.filter(c => c.platform === p && c.status === 'active');
    const spend = pc.reduce((s, c) => s + c.metrics.cost, 0);
    const conv = pc.reduce((s, c) => s + (c.metrics.conversions || 0), 0);
    const roas = spend > 0 ? pc.reduce((s, c) => s + c.metrics.roas * c.metrics.cost, 0) / spend : 0;
    const cpa = conv > 0 ? spend / conv : 0;
    return { platform: p === 'meta' ? 'Meta Ads' : p === 'google' ? 'Google Ads' : 'TikTok', spend, roas: +roas.toFixed(1), cpa: +cpa.toFixed(0) };
  });

  res.json({
    summary: { spending: totalSpending, clicks: totalClicks, conversions: totalConversions, roas: +avgRoas.toFixed(1) },
    status: { active, paused, critical, warning, total: dataCampaigns.length },
    topRecommendations: anyRealApi ? [] : recommendations.filter(r => r.status === 'pending').slice(0, 3),
    alerts: anyRealApi ? [] : alerts,
    platformComparison,
    earnings: anyRealApi ? { total_spending: 0, estimated_savings: 0, actual_savings: 0, extra_revenue: 0, roi_improvement: 0, history: [] } : earnings
  });
});

// Campaigns
app.get('/api/campaigns', async (req, res) => {
  const { platform, archived, includeArchived } = req.query;

  const mockIds = new Set(['c1','c2','c3','c4','c5','c6']);

  if (platform === 'meta' && metaAds.isMetaConfigured()) {
    const realCampaigns = await metaAds.getCampaigns();
    if (realCampaigns) return res.json(realCampaigns);
    return res.json(campaigns.filter((c: any) => !mockIds.has(c.id)));
  }
  if (platform === 'google' && googleAds.isGoogleAdsConfigured()) {
    const realCampaigns = await googleAds.getCampaigns();
    if (realCampaigns) return res.json(realCampaigns);
    return res.json(campaigns.filter((c: any) => !mockIds.has(c.id)));
  }
  if (platform === 'tiktok' && tiktokAds.isTikTokConfigured()) {
    const realCampaigns = await tiktokAds.getCampaigns();
    if (realCampaigns) return res.json(realCampaigns);
    return res.json(campaigns.filter((c: any) => !mockIds.has(c.id)));
  }

  let result = [...campaigns];
  if (platform && platform !== 'all') result = result.filter(c => c.platform === platform);

  if (includeArchived === 'true') {
  } else if (archived === 'true') {
    result = result.filter(c => c.arquivada === true);
  } else if (archived === 'false' || !archived) {
    result = result.filter(c => !c.arquivada);
  }

  const anyRealApi = metaAds.isMetaConfigured() || googleAds.isGoogleAdsConfigured() || tiktokAds.isTikTokConfigured();
  if (anyRealApi) {
    result = result.filter((c: any) => !mockIds.has(c.id));
  }

  res.json(result);
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  res.json(campaign);
});

app.post('/api/campaigns', (req, res) => {
  const body = req.body;
  const now = new Date().toISOString();
  const newCampaign: any = {
    id: `c${Date.now()}`,
    user_id: 'u1',
    platform: body.platform || 'meta',
    external_campaign_id: null,
    name: body.name || 'Nova Campanha',
    objective: body.objective || 'vendas',
    status: 'active',
    budget_daily: Number(body.budget_daily) || 50,
    start_date: body.start_date || now.split('T')[0],
    end_date: body.end_date || undefined,
    target_cpa: body.target_cpa ? Number(body.target_cpa) : undefined,
    last_updated: now,
    metrics: { clicks: 0, impressions: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, cost: 0, roas: 0 },
    arquivada: false,
    creatives: [],
    audiences: [],
    placements: [],
    schedule: [],
    keywords: [],
  };
  campaigns.unshift(newCampaign);
  localCampaigns.unshift(newCampaign);
  res.json(newCampaign);
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
    accounts: connectedAccounts.map(acc => {
      const configured = acc.platform === 'meta' ? metaAds.isMetaConfigured()
        : acc.platform === 'google' ? googleAds.isGoogleAdsConfigured()
        : acc.platform === 'tiktok' ? tiktokAds.isTikTokConfigured()
        : false;
      return {
        ...acc,
        is_active: configured,
        sync_status: configured ? 'active' : 'disconnected',
        api_configured: configured,
      };
    }),
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

// Campaign Wizard - AI Analysis
app.post('/api/campaigns/analyze', async (req, res) => {
  const { description, niche, price, margin, target_location, creatives: crs } = req.body;

  const hasVideo = crs?.some((c: any) => c.type === 'video');
  const hasImage = crs?.some((c: any) => c.type === 'image');
  const locations = target_location?.length ? target_location.join(', ') : 'Brasil';
  const productPrice = price || 120;
  const productMargin = margin || 40;
  const cacIdeal = Math.round(productPrice * (productMargin / 100) * 0.25);

  const objectiveConfidence = description.toLowerCase().includes('vender') || description.toLowerCase().includes('comprar') || description.toLowerCase().includes('venda') ? 95 : 85;
  const audienceSize = (target_location?.length || 3) * 800;

  const result = {
    objective: {
      value: 'conversions',
      confidence: objectiveConfidence,
      reason: `Você tem preço claro (R$ ${productPrice}) e quer vendas diretas. Conversões é o objetivo mais eficiente.`
    },
    audience: {
      demographics: `Público em ${locations}`,
      size: `${audienceSize}K pessoas`,
      confidence: 88,
      reason: `Baseado no seu nicho (${niche || 'geral'}) e localização (${locations}), este é seu público ideal.`
    },
    creative: {
      name: hasVideo ? (crs?.find((c: any) => c.type === 'video')?.name || 'Vídeo') : (crs?.[0]?.name || 'Imagem'),
      ctr: hasVideo ? '2.4%' : '1.8%',
      confidence: 95,
      reason: hasVideo
        ? 'Video tem 40% mais CTR que imagem. Formato vertical perfeito para Stories/Reels.'
        : 'Imagem limpa com bom enquadramento. Considere adicionar vídeo para melhor performance.'
    },
    budget: {
      daily: `R$ 50-100`,
      duration: '7 dias',
      confidence: 87,
      reason: `Com CAC ideal R$ ${cacIdeal}, começar com R$ 50/dia permite testar + iterar rápido.`,
      roi: '+175-310%'
    },
    name_suggestions: [
      `${niche?.split(' ')[0] || 'Produto'}-Conv-Jul24`,
      `Verao-Conversao-${target_location?.[0]?.split(' ')[0] || 'BR'}`,
      `Premium-${niche?.replace(/\s+/g, '-') || 'Product'}-Sales-July`
    ]
  };

  setTimeout(() => res.json(result), 2000);
});

// Campaign Wizard - Publish
app.post('/api/campaigns/publish', (req, res) => {
  const body = req.body;
  const now = new Date().toISOString();
  const newCampaign: any = {
    id: `c${Date.now()}`,
    user_id: 'u1',
    platform: 'meta',
    external_campaign_id: null,
    name: body.name || 'Nova Campanha Wizard',
    objective: body.objective || 'CONVERSIONS',
    status: 'active',
    budget_daily: Number(body.budget_daily) || 50,
    start_date: now.split('T')[0],
    end_date: body.duration ? new Date(Date.now() + body.duration * 86400000).toISOString().split('T')[0] : undefined,
    target_cpa: body.cac_ideal || undefined,
    last_updated: now,
    metrics: { clicks: 0, impressions: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, cost: 0, roas: 0 },
    arquivada: false,
    audience: body.audience || {},
    placements: body.placement || [],
    creatives: body.creatives ? [body.creatives.primary, ...body.creatives.secondary].filter(Boolean).map((name: string) => ({ id: name, name })) : [],
    schedule: [],
    keywords: [],
    copy: body.copy || '',
    ab_test_enabled: !!body.ab_test_enabled,
    auto_scale_enabled: !!body.auto_scale_enabled,
  };
  campaigns.unshift(newCampaign);
  localCampaigns.unshift(newCampaign);

  setTimeout(() => res.json({ success: true, campaign: newCampaign }), 1500);
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

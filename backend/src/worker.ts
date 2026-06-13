import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { campaigns, recommendations, alerts, earnings, actionLogs, insights, connectedAccounts, aiConfigs, preferences, user } from './data/mock';
import { initializeGemini, isGeminiConfigured, chat as geminiChat } from './services/gemini';
import * as metaAds from './services/meta-ads';
import * as googleAds from './services/google-ads';
import * as tiktokAds from './services/tiktok-ads';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  META_ADS_ACCESS_TOKEN?: string;
  META_ADS_ACCOUNT_ID?: string;
  GOOGLE_ADS_DEVELOPER_TOKEN?: string;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_ADS_CUSTOMER_ID?: string;
  TIKTOK_ADS_ACCESS_TOKEN?: string;
  TIKTOK_ADS_ADVERTISER_ID?: string;
  TIKTOK_ADS_APP_ID?: string;
  TIKTOK_ADS_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({ origin: '*', credentials: true }));

// Inicialização das APIs (executada em cada requisição Cloudflare)
function initApis(c: any) {
  const env = c.env as Bindings;
  if (env.GEMINI_API_KEY) initializeGemini(env.GEMINI_API_KEY);
  if (env.META_ADS_ACCESS_TOKEN) metaAds.configureMeta(env.META_ADS_ACCESS_TOKEN, env.META_ADS_ACCOUNT_ID || '');
  if (env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    googleAds.configureGoogleAds({
      developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
      clientId: env.GOOGLE_ADS_CLIENT_ID,
      clientSecret: env.GOOGLE_ADS_CLIENT_SECRET,
      refreshToken: env.GOOGLE_ADS_REFRESH_TOKEN,
      customerId: env.GOOGLE_ADS_CUSTOMER_ID,
    });
  }
  if (env.TIKTOK_ADS_ACCESS_TOKEN) {
    tiktokAds.configureTikTok({
      accessToken: env.TIKTOK_ADS_ACCESS_TOKEN,
      advertiserId: env.TIKTOK_ADS_ADVERTISER_ID,
      appId: env.TIKTOK_ADS_APP_ID,
      secret: env.TIKTOK_ADS_SECRET,
    });
  }
}

app.get('/api/dashboard', c => {
  const totalSpending = campaigns.reduce((s, cam) => s + cam.metrics.cost, 0);
  const totalClicks = campaigns.reduce((s, cam) => s + cam.metrics.clicks, 0);
  const totalConversions = campaigns.reduce((s, cam) => s + (cam.metrics.conversions || 0), 0);
  const avgRoas = totalSpending > 0 ? campaigns.reduce((s, cam) => s + cam.metrics.roas * cam.metrics.cost, 0) / totalSpending : 0;
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
  return c.json({ summary: { spending: totalSpending, clicks: totalClicks, conversions: totalConversions, roas: +avgRoas.toFixed(1) }, status: { active, paused, critical, warning, total: campaigns.length }, topRecommendations: recommendations.filter(r => r.status === 'pending').slice(0, 3), alerts, platformComparison, earnings });
});

app.get('/api/campaigns', async c => {
  const platform = c.req.query('platform');
  initApis(c);

  if (platform === 'meta' && metaAds.isMetaConfigured()) {
    const realCampaigns = await metaAds.getCampaigns();
    if (realCampaigns) return c.json(realCampaigns);
  }
  if (platform === 'google' && googleAds.isGoogleAdsConfigured()) {
    const realCampaigns = await googleAds.getCampaigns();
    if (realCampaigns) return c.json(realCampaigns);
  }
  if (platform === 'tiktok' && tiktokAds.isTikTokConfigured()) {
    const realCampaigns = await tiktokAds.getCampaigns();
    if (realCampaigns) return c.json(realCampaigns);
  }

  let result = [...campaigns];
  if (platform && platform !== 'all') result = result.filter(cam => cam.platform === platform);

  const archived = c.req.query('archived');
  const includeArchived = c.req.query('includeArchived');
  if (includeArchived === 'true') {
    // Retorna todas
  } else if (archived === 'true') {
    result = result.filter(c => c.arquivada === true);
  } else if (archived === 'false' || !archived) {
    result = result.filter(c => !c.arquivada);
  }

  return c.json(result);
});

app.get('/api/campaigns/:id', c => {
  const cam = campaigns.find(cam => cam.id === c.req.param('id'));
  if (!cam) return c.json({ error: 'Not found' }, 404);
  return c.json(cam);
});

app.put('/api/campaigns/:id', async c => {
  const cam = campaigns.find(cam => cam.id === c.req.param('id'));
  if (!cam) return c.json({ error: 'Not found' }, 404);
  const body = await c.req.json();
  const allowed = ['name', 'status', 'budget_daily', 'target_cpa', 'objective', 'start_date', 'end_date'];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      (cam as any)[key] = body[key];
    }
  }
  cam.last_updated = new Date().toISOString();
  return c.json(cam);
});

app.post('/api/campaigns/:id/archive', c => {
  const cam = campaigns.find(cam => cam.id === c.req.param('id'));
  if (!cam) return c.json({ error: 'Not found' }, 404);
  cam.arquivada = true;
  cam.last_updated = new Date().toISOString();
  return c.json({ success: true, campaign: cam });
});

app.post('/api/campaigns/:id/unarchive', c => {
  const cam = campaigns.find(cam => cam.id === c.req.param('id'));
  if (!cam) return c.json({ error: 'Not found' }, 404);
  cam.arquivada = false;
  cam.last_updated = new Date().toISOString();
  return c.json({ success: true, campaign: cam });
});

app.get('/api/recommendations', c => {
  const status = c.req.query('status');
  const campaignId = c.req.query('campaign_id');
  let result = recommendations;
  if (status) result = result.filter(r => r.status === status);
  if (campaignId) result = result.filter(r => r.campaign_id === campaignId);
  return c.json(result);
});

app.post('/api/recommendations/:id/respond', async c => {
  const rec = recommendations.find(r => r.id === c.req.param('id'));
  if (!rec) return c.json({ error: 'Not found' }, 404);
  const body = await c.req.json();
  rec.status = body.status;
  return c.json(rec);
});

app.get('/api/integrations', c => {
  initApis(c);
  return c.json({
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

app.post('/api/integrations/connect/:platform', async c => {
  const { platform } = c.req.param();
  const body = await c.req.json();
  const { accessToken, accountId } = body;

  if (platform === 'meta' && accessToken && accountId) {
    metaAds.configureMeta(accessToken, accountId);
    const account = connectedAccounts.find(a => a.platform === 'meta');
    if (account) {
      account.is_active = true;
      account.sync_status = 'active';
      account.last_synced = new Date().toISOString();
    }
    return c.json({ success: true, message: 'Meta Ads conectado com sucesso!' });
  }

  if (platform === 'tiktok' && accessToken) {
    tiktokAds.configureTikTok({ accessToken, advertiserId: accountId || body.advertiserId });
    const account = connectedAccounts.find(a => a.platform === 'tiktok');
    if (account) {
      account.is_active = true;
      account.sync_status = 'active';
      account.last_synced = new Date().toISOString();
    }
    return c.json({ success: true, message: 'TikTok Ads conectado com sucesso!' });
  }

  return c.json({ success: true, message: `Conectando ${platform}...` });
});

app.post('/api/integrations/ai/:provider/connect', async c => {
  const config = aiConfigs.find(cfg => cfg.provider === c.req.param('provider'));
  if (config) {
    config.status = 'active';
    const body = await c.req.json();
    config.selected_model = body.model || 'gemini-2.5-flash';
    if (c.req.param('provider') === 'gemini' && body.apiKey) {
      initializeGemini(body.apiKey);
    }
  }
  return c.json({ success: true, config });
});

app.post('/api/integrations/preferences', async c => {
  const body = await c.req.json();
  Object.assign(preferences, body);
  return c.json(preferences);
});

app.get('/api/insights', c => c.json(insights));
app.get('/api/action-logs', c => c.json(actionLogs));
app.get('/api/earnings', c => c.json(earnings));

app.post('/api/chat', async c => {
  const { message, history } = await c.req.json();

  if (!message) {
    return c.json({ reply: 'Olá! Como posso ajudar com suas campanhas hoje?' });
  }

  initApis(c);

  if (isGeminiConfigured()) {
    try {
      const messages = [
        ...(history || []),
        { role: 'user', content: message }
      ];
      const reply = await geminiChat(messages);
      return c.json({ reply });
    } catch (err: any) {
      console.error('[Chat] Erro com Gemini, usando fallback:', err.message);
    }
  }

  const lower = (message || '').toLowerCase().trim();
  const defaultReply = 'Analisei suas campanhas e notei padrões interessantes!\n\n📊 **Meta Ads**: Stories tem ROAS 2.9x - melhor placement!\n📊 **Google Ads**: Quality Score subiu para 7/10\n📊 **TikTok**: Vídeo A tem 2.8% CTR\n\nTem alguma campanha específica que gostaria de analisar?';
  const replies: Record<string, string> = {
    sim: 'Ótimo! Vamos às recomendações:\n\n1️⃣ Meta Ads - ROAS 2.5x → Aumentar budget 50% (+R$ 480/dia)\n2️⃣ Google - Keyword "comprar online" → Pausar (-R$ 75/dia)\n3️⃣ TikTok - ROAS 0.6x → Pausar campanha (-R$ 200/dia)\n\nQuer implementar alguma?',
    oi: 'Olá! 👋 Sou seu consultor de tráfego pago 24/7. Como posso ajudar?',
    'bom dia': 'Bom dia! ☀️ Suas campanhas estão rodando bem. Meta em 2.1x, mas TikTok precisa de atenção.',
    'obrigado': 'Por nada! Estou aqui 24/7 para otimizar seus anúncios enquanto você dorme 🚀',
  };
  return c.json({ reply: replies[lower] || defaultReply });
});

app.get('/api/health', c => c.json({ status: 'ok', version: '1.0.0' }));

// Docs Editor Endpoints (D1 SQLite Backup)
app.get('/docs/app-docs.txt', async c => {
  try {
    const doc = await c.env.DB.prepare('SELECT content FROM docs_backup ORDER BY created_at DESC LIMIT 1').first<{ content: string }>();
    if (!doc) {
      return c.text('Documentação não encontrada', 404);
    }
    return c.text(doc.content, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (err) {
    return c.text('Erro ao carregar docs', 500);
  }
});

app.post('/api/docs/save', async c => {
  try {
    const content = await c.req.text();
    if (!content || content.length === 0) {
      return c.json({ error: 'Conteúdo vazio' }, 400);
    }
    await c.env.DB.prepare(`
      INSERT INTO docs_backup (content, created_at)
      VALUES (?, datetime('now'))
    `).bind(content).run();
    return c.json({ success: true, message: 'Documentação salva' });
  } catch (err: any) {
    return c.json({ error: 'Erro ao salvar' }, 500);
  }
});

export default app;

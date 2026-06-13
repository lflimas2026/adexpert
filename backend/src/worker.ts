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

// Helpers de persistência D1 para campanhas
function parseCampaign(row: any) {
  return {
    ...row,
    arquivada: row.arquivada === 1 || row.arquivada === true,
    metrics: typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics,
    creatives: typeof row.creatives === 'string' ? JSON.parse(row.creatives) : row.creatives,
    audiences: typeof row.audiences === 'string' ? JSON.parse(row.audiences) : row.audiences,
    placements: typeof row.placements === 'string' ? JSON.parse(row.placements) : row.placements,
    schedule: typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule,
    keywords: typeof row.keywords === 'string' ? JSON.parse(row.keywords) : row.keywords,
  };
}

async function getD1Campaigns(db: D1Database, filters?: { platform?: string; archived?: string; includeArchived?: string }): Promise<any[]> {
  let sql = 'SELECT * FROM campaigns WHERE user_id = ?';
  const params: any[] = ['u1'];

  if (filters?.platform && filters.platform !== 'all') {
    sql += ' AND platform = ?';
    params.push(filters.platform);
  }
  if (filters?.includeArchived !== 'true') {
    if (filters?.archived === 'true') {
      sql += ' AND arquivada = 1';
    } else {
      sql += ' AND (arquivada = 0 OR arquivada IS NULL)';
    }
  }
  sql += ' ORDER BY last_updated DESC';

  const { results } = await db.prepare(sql).bind(...params).all();
  return (results || []).map(parseCampaign);
}

async function getD1Campaign(db: D1Database, id: string): Promise<any | null> {
  const row = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return row ? parseCampaign(row) : null;
}

async function createD1Campaign(db: D1Database, data: any): Promise<any> {
  const now = new Date().toISOString();
  const campaign = {
    id: `c${Date.now()}`,
    user_id: 'u1',
    platform: data.platform || 'meta',
    external_campaign_id: null,
    name: data.name || 'Nova Campanha',
    objective: data.objective || 'vendas',
    status: 'active',
    budget_daily: Number(data.budget_daily) || 50,
    start_date: data.start_date || now.split('T')[0],
    end_date: data.end_date || null,
    target_cpa: data.target_cpa ? Number(data.target_cpa) : null,
    last_updated: now,
    arquivada: 0,
    metrics: JSON.stringify({ clicks: 0, impressions: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, cost: 0, roas: 0 }),
    creatives: '[]',
    audiences: '[]',
    placements: '[]',
    schedule: '[]',
    keywords: '[]',
  };

  await db.prepare(`
    INSERT INTO campaigns (id, user_id, platform, external_campaign_id, name, objective, status, budget_daily, start_date, end_date, target_cpa, last_updated, arquivada, metrics, creatives, audiences, placements, schedule, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    campaign.id, campaign.user_id, campaign.platform, campaign.external_campaign_id,
    campaign.name, campaign.objective, campaign.status, campaign.budget_daily,
    campaign.start_date, campaign.end_date, campaign.target_cpa, campaign.last_updated,
    campaign.arquivada, campaign.metrics, campaign.creatives, campaign.audiences,
    campaign.placements, campaign.schedule, campaign.keywords
  ).run();

  return parseCampaign(campaign);
}

async function updateD1Campaign(db: D1Database, id: string, data: any): Promise<any | null> {
  const allowed = ['name', 'status', 'budget_daily', 'target_cpa', 'objective', 'start_date', 'end_date', 'platform'];
  const sets: string[] = [];
  const params: any[] = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(key === 'budget_daily' || key === 'target_cpa' ? Number(data[key]) : data[key]);
    }
  }

  if (sets.length === 0) return getD1Campaign(db, id);

  const now = new Date().toISOString();
  sets.push('last_updated = ?');
  params.push(now);
  params.push(id);

  await db.prepare(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
  return getD1Campaign(db, id);
}

async function archiveD1Campaign(db: D1Database, id: string, arquivada: boolean): Promise<any | null> {
  const now = new Date().toISOString();
  await db.prepare('UPDATE campaigns SET arquivada = ?, last_updated = ? WHERE id = ?').bind(arquivada ? 1 : 0, now, id).run();
  return getD1Campaign(db, id);
}

app.get('/api/dashboard', async c => {
  initApis(c);
  const anyRealApi = metaAds.isMetaConfigured() || googleAds.isGoogleAdsConfigured() || tiktokAds.isTikTokConfigured();
  const mockIds = new Set(['c1','c2','c3','c4','c5','c6']);

  let dataCampaigns: any[];
  if (anyRealApi) {
    try {
      dataCampaigns = await getD1Campaigns(c.env.DB, { includeArchived: 'true' });
    } catch {
      dataCampaigns = campaigns.filter(c => !mockIds.has(c.id));
    }
  } else {
    dataCampaigns = campaigns;
  }

  const totalSpending = dataCampaigns.reduce((s, cam) => s + cam.metrics.cost, 0);
  const totalClicks = dataCampaigns.reduce((s, cam) => s + cam.metrics.clicks, 0);
  const totalConversions = dataCampaigns.reduce((s, cam) => s + (cam.metrics.conversions || 0), 0);
  const avgRoas = totalSpending > 0 ? dataCampaigns.reduce((s, cam) => s + cam.metrics.roas * cam.metrics.cost, 0) / totalSpending : 0;
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
  return c.json({
    summary: { spending: totalSpending, clicks: totalClicks, conversions: totalConversions, roas: +avgRoas.toFixed(1) },
    status: { active, paused, critical, warning, total: dataCampaigns.length },
    topRecommendations: anyRealApi ? [] : recommendations.filter(r => r.status === 'pending').slice(0, 3),
    alerts: anyRealApi ? [] : alerts,
    platformComparison,
    earnings: anyRealApi ? { total_spending: 0, estimated_savings: 0, actual_savings: 0, extra_revenue: 0, roi_improvement: 0, history: [] } : earnings
  });
});

app.get('/api/campaigns', async c => {
  const platform = c.req.query('platform');
  initApis(c);

  const mockIds = new Set(['c1','c2','c3','c4','c5','c6']);

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

  try {
    const dbCampaigns = await getD1Campaigns(c.env.DB, {
      platform: platform || undefined,
      archived: c.req.query('archived') || undefined,
      includeArchived: c.req.query('includeArchived') || undefined,
    });
    if (dbCampaigns.length > 0) return c.json(dbCampaigns);
  } catch (err) {
    console.error('[D1] Erro ao buscar campanhas:', err);
  }

  let result = [...campaigns];
  if (platform && platform !== 'all') result = result.filter(cam => cam.platform === platform);

  const archived = c.req.query('archived');
  const includeArchived = c.req.query('includeArchived');
  if (includeArchived === 'true') {
  } else if (archived === 'true') {
    result = result.filter(c => c.arquivada === true);
  } else if (archived === 'false' || !archived) {
    result = result.filter(c => !c.arquivada);
  }

  const anyRealApi = metaAds.isMetaConfigured() || googleAds.isGoogleAdsConfigured() || tiktokAds.isTikTokConfigured();
  if (anyRealApi) {
    result = result.filter(c => !mockIds.has(c.id));
  }

  return c.json(result);
});

app.get('/api/campaigns/:id', async c => {
  const id = c.req.param('id');
  try {
    const dbCamp = await getD1Campaign(c.env.DB, id);
    if (dbCamp) return c.json(dbCamp);
  } catch (err) {
    console.error('[D1] Erro ao buscar campanha:', err);
  }
  const cam = campaigns.find(cam => cam.id === id);
  if (!cam) return c.json({ error: 'Not found' }, 404);
  return c.json(cam);
});

app.post('/api/campaigns', async c => {
  const body = await c.req.json();
  try {
    const newCampaign = await createD1Campaign(c.env.DB, body);
    campaigns.unshift(newCampaign);
    return c.json(newCampaign);
  } catch (err) {
    console.error('[D1] Erro ao criar campanha:', err);
    const now = new Date().toISOString();
    const fallback: any = {
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
    campaigns.unshift(fallback);
    return c.json(fallback);
  }
});

app.put('/api/campaigns/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const updated = await updateD1Campaign(c.env.DB, id, body);
    if (updated) return c.json(updated);
  } catch (err) {
    console.error('[D1] Erro ao atualizar campanha:', err);
  }
  const cam = campaigns.find(cam => cam.id === id);
  if (!cam) return c.json({ error: 'Not found' }, 404);
  const allowed = ['name', 'status', 'budget_daily', 'target_cpa', 'objective', 'start_date', 'end_date'];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      (cam as any)[key] = body[key];
    }
  }
  cam.last_updated = new Date().toISOString();
  return c.json(cam);
});

app.post('/api/campaigns/:id/archive', async c => {
  const id = c.req.param('id');
  try {
    const archived = await archiveD1Campaign(c.env.DB, id, true);
    if (archived) return c.json({ success: true, campaign: archived });
  } catch (err) {
    console.error('[D1] Erro ao arquivar campanha:', err);
  }
  const cam = campaigns.find(cam => cam.id === id);
  if (!cam) return c.json({ error: 'Not found' }, 404);
  cam.arquivada = true;
  cam.last_updated = new Date().toISOString();
  return c.json({ success: true, campaign: cam });
});

app.post('/api/campaigns/:id/unarchive', async c => {
  const id = c.req.param('id');
  try {
    const archived = await archiveD1Campaign(c.env.DB, id, false);
    if (archived) return c.json({ success: true, campaign: archived });
  } catch (err) {
    console.error('[D1] Erro ao desarquivar campanha:', err);
  }
  const cam = campaigns.find(cam => cam.id === id);
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

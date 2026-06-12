import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { campaigns, recommendations, alerts, earnings, actionLogs, insights, connectedAccounts, aiConfigs, preferences, user } from './data/mock';

const app = new Hono();

app.use('/*', cors({ origin: '*', credentials: true }));

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

app.get('/api/campaigns', c => {
  const platform = c.req.query('platform');
  let result = campaigns;
  if (platform && platform !== 'all') result = result.filter(cam => cam.platform === platform);
  return c.json(result);
});

app.get('/api/campaigns/:id', c => {
  const cam = campaigns.find(cam => cam.id === c.req.param('id'));
  if (!cam) return c.json({ error: 'Not found' }, 404);
  return c.json(cam);
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

app.get('/api/integrations', c => c.json({ accounts: connectedAccounts, aiConfigs, preferences }));

app.post('/api/integrations/connect/:platform', c => c.json({ success: true, message: `Conectando ${c.req.param('platform')}...` }));

app.post('/api/integrations/ai/:provider/connect', async c => {
  const config = aiConfigs.find(cfg => cfg.provider === c.req.param('provider'));
  if (config) {
    config.status = 'active';
    const body = await c.req.json();
    config.selected_model = body.model || 'claude-sonnet-4-6';
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
  const { message } = await c.req.json();
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

export default app;

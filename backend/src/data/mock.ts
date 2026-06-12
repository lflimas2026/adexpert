export const user = {
  id: "u1",
  name: "Fernando Silva",
  email: "fernando@exemplo.com.br",
  company: "Loja Exemplo",
  plan: "professional",
  primary_ai: "claude",
  created_at: "2024-01-15T10:00:00Z"
};

export const campaigns = [
  {
    id: "c1",
    user_id: "u1",
    platform: "meta",
    external_campaign_id: "meta_001",
    name: "Verão 2024 - Meta",
    objective: "CONVERSIONS",
    status: "active",
    budget_daily: 50,
    start_date: "2024-01-01",
    target_cpa: 15,
    last_updated: "2024-06-12T12:30:00Z",
    metrics: {
      clicks: 1800,
      impressions: 72000,
      reach: 45000,
      ctr: 2.5,
      cpc: 0.85,
      cpm: 1.50,
      conversions: 87,
      cost: 1500,
      roas: 2.1,
      frequency: 2.3
    },
    audiences: [
      { name: "Fashion 25-35", age_min: 25, age_max: 35, interests: ["Fashion", "Moda"], roas: 2.8, cpm: 1.20, cpa: 12, status: "best" },
      { name: "Lifestyle 35-50", age_min: 35, age_max: 50, interests: ["Lifestyle"], roas: 1.9, cpm: 0.95, cpa: 16, status: "good" },
      { name: "General 18-25", age_min: 18, age_max: 25, interests: ["General"], roas: 0.7, cpm: 2.10, cpa: 28, status: "worst" }
    ],
    placements: [
      { name: "Stories", roas: 2.9, cpm: 1.10, cpc: 0.65, status: "best" },
      { name: "Feed", roas: 1.8, cpm: 1.60, cpc: 0.95, status: "good" },
      { name: "Reels", roas: 2.2, cpm: 1.30, cpc: 0.80, status: "good" },
      { name: "Audience Network", roas: 0.9, cpm: 2.00, cpc: 1.50, status: "worst" }
    ],
    creatives: [
      { id: "cr1", type: "image", name: "Imagem A - Produto Branco", ctr: 2.1, cpc: 0.75, conversions: 45, status: "best" },
      { id: "cr2", type: "video", name: "Vídeo B - Review 30s", ctr: 1.1, cpc: 1.10, conversions: 28, status: "good" },
      { id: "cr3", type: "carousel", name: "Carrossel C - 5 Fotos", ctr: 0.8, cpc: 1.40, conversions: 14, status: "fatigue" }
    ],
    schedule: [
      { hour: "14h-18h", cpm_change: -30, conv_change: 20, action: "Aumentar budget" },
      { hour: "20h-23h", cpm_change: 10, conv_change: 40, action: "Aumentar budget significativo" },
      { hour: "05h-08h", cpm_change: 25, conv_change: -10, action: "Considerar pausar" }
    ]
  },
  {
    id: "c2",
    user_id: "u1",
    platform: "meta",
    external_campaign_id: "meta_002",
    name: "Teste B - Meta",
    objective: "CONVERSIONS",
    status: "paused",
    budget_daily: 40,
    start_date: "2024-05-01",
    end_date: "2024-05-30",
    target_cpa: 20,
    last_updated: "2024-06-10T14:00:00Z",
    metrics: {
      clicks: 900,
      impressions: 36000,
      reach: 18000,
      ctr: 2.5,
      cpc: 1.45,
      cpm: 2.10,
      conversions: 32,
      cost: 1305,
      roas: 1.1,
      frequency: 4.1
    },
    audiences: [],
    placements: [],
    creatives: [],
    schedule: []
  },
  {
    id: "c3",
    user_id: "u1",
    platform: "meta",
    external_campaign_id: "meta_003",
    name: "Produto Verão",
    objective: "CONVERSIONS",
    status: "active",
    budget_daily: 30,
    start_date: "2024-05-15",
    target_cpa: 12,
    last_updated: "2024-06-12T12:30:00Z",
    metrics: {
      clicks: 1200,
      impressions: 48000,
      reach: 28000,
      ctr: 2.5,
      cpc: 0.72,
      cpm: 1.20,
      conversions: 68,
      cost: 864,
      roas: 2.2,
      frequency: 1.8
    },
    audiences: [],
    placements: [],
    creatives: [],
    schedule: []
  },
  {
    id: "c4",
    user_id: "u1",
    platform: "google",
    external_campaign_id: "ggl_001",
    name: "Google Search - Marca",
    objective: "CONVERSIONS",
    status: "active",
    budget_daily: 28,
    start_date: "2024-03-01",
    target_cpa: 18,
    last_updated: "2024-06-12T12:00:00Z",
    metrics: {
      clicks: 620,
      impressions: 15000,
      ctr: 4.1,
      cpc: 1.20,
      cpm: 2.10,
      conversions: 32,
      cost: 744,
      roas: 1.8,
      quality_score: 7
    },
    keywords: [
      { keyword: "loja online", match_type: "exact", quality_score: 8, impressions: 3200, clicks: 180, ctr: 5.6, cpc: 1.10, conversions: 12 },
      { keyword: "comprar online", match_type: "broad", quality_score: 4, impressions: 4500, clicks: 150, ctr: 3.3, cpc: 1.80, conversions: 0 },
      { keyword: "moda feminina", match_type: "phrase", quality_score: 7, impressions: 2800, clicks: 140, ctr: 5.0, cpc: 0.95, conversions: 8 }
    ]
  },
  {
    id: "c5",
    user_id: "u1",
    platform: "google",
    external_campaign_id: "ggl_002",
    name: "Google Search - Genérico",
    objective: "CONVERSIONS",
    status: "active",
    budget_daily: 22,
    start_date: "2024-04-01",
    target_cpa: 20,
    last_updated: "2024-06-12T12:00:00Z",
    metrics: {
      clicks: 380,
      impressions: 12000,
      ctr: 3.2,
      cpc: 1.45,
      cpm: 2.30,
      conversions: 12,
      cost: 551,
      roas: 1.2,
      quality_score: 5
    },
    keywords: [
      { keyword: "comprar online", match_type: "broad", quality_score: 3, impressions: 5000, clicks: 120, ctr: 2.4, cpc: 2.10, conversions: 0 },
      { keyword: "desconto roupas", match_type: "phrase", quality_score: 6, impressions: 2000, clicks: 80, ctr: 4.0, cpc: 1.20, conversions: 3 }
    ]
  },
  {
    id: "c6",
    user_id: "u1",
    platform: "tiktok",
    external_campaign_id: "tt_001",
    name: "TikTok - Teste A",
    objective: "CONVERSIONS",
    status: "active",
    budget_daily: 24,
    start_date: "2024-05-01",
    target_cpa: 12,
    last_updated: "2024-06-12T12:15:00Z",
    metrics: {
      clicks: 1400,
      impressions: 56000,
      reach: 42000,
      ctr: 2.5,
      cpc: 0.70,
      cpm: 1.10,
      conversions: 62,
      cost: 980,
      roas: 2.9,
      video_views: 12000,
      engagement_rate: 4.2
    },
    creatives: [
      { id: "tt_cr1", type: "video", name: "Vídeo A - Autêntico", ctr: 2.8, conversions: 35, status: "best", views: 8000, retention: 0.65 },
      { id: "tt_cr2", type: "video", name: "Vídeo B - Polido", ctr: 1.9, conversions: 18, status: "good", views: 4000, retention: 0.45 }
    ]
  }
];

export const recommendations = [
  {
    id: "r1",
    user_id: "u1",
    campaign_id: "c1",
    platform: "meta",
    type: "increase_budget",
    severity: "high",
    current_metric: "ROAS 2.5x, frequência 2.3",
    recommended_action: "Aumentar budget em 50%",
    expected_impact: "+R$ 480/dia em vendas",
    confidence: 95,
    reasoning: "ROAS 2.5x estável por 10 dias, frequência baixa (2.3), há espaço para escalar sem saturar o público. Histórico mostra que campanhas similares mantiveram ROAS > 2.0 com aumento de até 50%.",
    generated_by_ai: "claude",
    status: "pending",
    created_at: "2024-06-12T10:00:00Z",
    score: 79
  },
  {
    id: "r2",
    user_id: "u1",
    campaign_id: "c5",
    platform: "google",
    type: "reduce_audience",
    severity: "medium",
    current_metric: "Keyword 'comprar online': 150 cliques, 0 conversões",
    recommended_action: "Pausar keyword 'comprar online' (broad match)",
    expected_impact: "-R$ 75/dia em desperdício",
    confidence: 87,
    reasoning: "A keyword 'comprar online' em broad match está gerando cliques irrelevantes com alto CPC (R$ 2.10) e zero conversões. É uma keyword genérica que atrai tráfego frio.",
    generated_by_ai: "claude",
    status: "pending",
    created_at: "2024-06-12T10:00:00Z",
    score: 68
  },
  {
    id: "r3",
    user_id: "u1",
    campaign_id: "c6",
    platform: "tiktok",
    type: "pause_creative",
    severity: "critical",
    current_metric: "ROAS 0.6x, CPM R$ 3.50",
    recommended_action: "Pausar campanha ou reformular",
    expected_impact: "-R$ 200/dia em prejuízo",
    confidence: 92,
    reasoning: "ROAS 0.6x está muito abaixo do break-even. Análise do criativo mostra baixa retenção nos primeiros 3 segundos. Sugerimos pausar ou testar novo gancho.",
    generated_by_ai: "claude",
    status: "pending",
    created_at: "2024-06-12T10:00:00Z",
    score: 76
  },
  {
    id: "r4",
    user_id: "u1",
    campaign_id: "c1",
    platform: "meta",
    type: "audience_change",
    severity: "high",
    current_metric: "60% overlap entre públicos A e B",
    recommended_action: "Criar exclusões mútuas entre públicos",
    expected_impact: "Reduzir frequência em 30%, melhorar ROAS",
    confidence: 88,
    reasoning: "60% do Público A e Público B estão vendo o mesmo anúncio. Isso aumenta a frequência e causa fadiga mais rápido.",
    generated_by_ai: "claude",
    status: "accepted",
    created_at: "2024-06-11T14:00:00Z",
    score: 72
  }
];

export const alerts = [
  {
    id: "a1",
    type: "opportunity",
    message: "CPM caiu 25% no Meta - Aumente budget enquanto está barato",
    time: "12:34",
    severity: "info"
  },
  {
    id: "a2",
    type: "warning",
    message: "Frequência alta (4.1) no Instagram - Criativo fatigado",
    time: "12:10",
    severity: "warning"
  },
  {
    id: "a3",
    type: "success",
    message: "Google Ads Quality Score subiu de 6/10 para 8/10",
    time: "11:45",
    severity: "info"
  }
];

export const earnings = {
  total_spending: 3200,
  estimated_savings: 3400,
  actual_savings: 3100,
  extra_revenue: 5200,
  roi_improvement: 1620,
  history: [
    { month: "Abril", spending: 2800, savings: 1800, extra: 3200 },
    { month: "Maio", spending: 3100, savings: 2600, extra: 4100 },
    { month: "Junho", spending: 3200, savings: 3100, extra: 5200 }
  ]
};

export const actionLogs = [
  {
    id: "l1",
    platform: "meta",
    campaign_id: "c2",
    campaign_name: "Teste B - Meta",
    action_type: "pause",
    before_state: { status: "active", budget: 40 },
    after_state: { status: "paused", budget: 0 },
    impact_expected: "-R$ 50/dia",
    impact_actual: "-R$ 48/dia",
    implemented_by: "ai_auto",
    ai_provider_used: "claude",
    timestamp: "2024-06-12T14:32:00Z",
    reason: "ROAS 0.8x < 1.2 limit"
  },
  {
    id: "l2",
    platform: "google",
    campaign_id: "c4",
    campaign_name: "Google Search - Marca",
    action_type: "budget_increase",
    before_state: { bid: 50 },
    after_state: { bid: 75 },
    impact_expected: "+R$ 80/dia em vendas",
    impact_actual: "+R$ 76/dia",
    implemented_by: "user",
    ai_provider_used: "claude",
    timestamp: "2024-06-12T12:15:00Z",
    reason: "CTR subiu 40%, ROAS 2.8x"
  }
];

export const insights = {
  total_recommendations: 34,
  success_rate: 88,
  total_savings: 8400,
  total_extra: 12300,
  total_impact: 20700,
  total_paid: 1000,
  overall_roi: 2070,
  top_campaigns: [
    { name: "Verão Meta Stories", roas: 3.2, conversions: 234, budget: 1200, return: 3840, insight: "Stories + idade 25-40 + horário 20h-22h" },
    { name: "Google Search - Marca", roas: 2.8, conversions: 156, budget: 850, return: 2380, insight: "Keywords específicos de marca + 'comprar'" },
    { name: "TikTok Video A", roas: 2.5, conversions: 89, budget: 600, return: 1500, insight: "Vídeo autêntico + som trending" }
  ],
  patterns: [
    { insight: "Frequência é tudo", description: "Quando frequência > 3, ROAS cai 40%", action: "Pausar creative a cada 5 dias e relançar novo" },
    { insight: "Horário importa MUITO", description: "20h-23h: 50% mais conversão que média", action: "Aumentar bid nesse horário em +30%" },
    { insight: "Público exato > público grande", description: "Público segmentado ROAS 2.8x vs Geral 1.5x", action: "Sempre começar segmentado" },
    { insight: "Vídeo > Imagem", description: "Vídeo CTR: 2.4% | Imagem CTR: 1.8%", action: "Converter imagens para vídeo" }
  ],
  failures: [
    { name: "Teste Audience Network", roas: 0.4, loss: 200, lesson: "Audience Network não funciona para seu público" },
    { name: "Google - Keyword Genérica", roas: 0.6, loss: 150, lesson: "Sempre usar keywords específicas de marca/produto" }
  ],
  future: [
    { recommendation: "Teste 'Black Friday' campaign em julho", estimate: "15% mais conversão" },
    { recommendation: "Expanda público vencedor (25-40, Fashion) para 40-50 anos (lookalike)", estimate: "+20% volume, -10% ROAS" },
    { recommendation: "Tente vídeo style 'unboxing' em TikTok", estimate: "ROAS estimado 2.1x" }
  ]
};

export const connectedAccounts = [
  {
    id: "ca1",
    platform: "meta",
    account_name: "@sua_loja",
    is_active: true,
    last_synced: "2024-06-12T12:27:00Z",
    permissions: "Read + Write",
    sync_status: "active",
    stats: { campaigns: 15, audiences: 45, creatives: 28, metrics_days: 365 }
  },
  {
    id: "ca2",
    platform: "google",
    account_name: "sua_conta@gmail.com",
    is_active: true,
    last_synced: "2024-06-12T12:25:00Z",
    permissions: "Read + Write",
    sync_status: "active",
    stats: { campaigns: 10, keywords: 450, metrics_days: 90 }
  },
  {
    id: "ca3",
    platform: "tiktok",
    account_name: null,
    is_active: false,
    last_synced: null,
    permissions: null,
    sync_status: "disconnected",
    stats: null
  }
];

export const aiConfigs = [
  {
    id: "ai1",
    provider: "claude",
    is_primary: true,
    status: "active",
    tokens_used_this_month: 1245,
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
    selected_model: "claude-sonnet-4-6",
    last_analyses: { meta: 12, google: 5, avg_time: 3.2 }
  },
  {
    id: "ai2",
    provider: "gemini",
    is_primary: false,
    status: "disconnected",
    tokens_used_this_month: 0,
    models: [],
    selected_model: null,
    last_analyses: null
  },
  {
    id: "ai3",
    provider: "deepseek",
    is_primary: false,
    status: "disconnected",
    tokens_used_this_month: 0,
    models: [],
    selected_model: null,
    last_analyses: null
  }
];

export const preferences = {
  aggressiveness: "balanced",
  auto_implement: true,
  alert_threshold: "medium",
  languages: ["pt"],
  recommendation_types: {
    critical_alerts: true,
    opportunities: true,
    optimizations: true,
    experimental: false
  },
  analysis_frequency: "30min",
  notifications: {
    in_app: true,
    email: true,
    sms: false,
    slack: true
  },
  automations: {
    auto_pause_roas: { enabled: true, threshold: 1.2, duration: 24 },
    auto_increase_roas: { enabled: true, threshold: 2.5, duration: 48, increase: 20, max_increase: 200, require_approval: false },
    auto_rotate_creative: { enabled: true, frequency_threshold: 3, pause_days: 7 },
    auto_remove_zero_conv: { enabled: true, min_clicks: 50 }
  },
  safety_limits: {
    max_budget_per_campaign: 500,
    max_increase_per_time: 50,
    require_approval: { roas_below_1: true, roas_above_3: false, all: false }
  },
  webhook_url: "https://seu-servidor.com/webhooks/ads"
};

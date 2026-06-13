const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

let accessToken: string | null = null;
let advertiserId: string | null = null;
let appId: string | null = null;
let secret: string | null = null;

export function isTikTokConfigured(): boolean {
  return !!(accessToken && advertiserId
    && accessToken !== 'seu_token_aqui'
    && advertiserId !== 'seu_advertiser_id');
}

export function configureTikTok(cfg: {
  accessToken?: string | null;
  advertiserId?: string | null;
  appId?: string | null;
  secret?: string | null;
}): void {
  if (cfg.accessToken !== undefined) accessToken = cfg.accessToken;
  if (cfg.advertiserId !== undefined) advertiserId = cfg.advertiserId;
  if (cfg.appId !== undefined) appId = cfg.appId;
  if (cfg.secret !== undefined) secret = cfg.secret;
}

export function getTikTokConfig() {
  return { accessToken, advertiserId, appId, secret };
}

async function tiktokFetch<T>(endpoint: string, body: Record<string, any> = {}): Promise<T | null> {
  if (!accessToken) return null;

  try {
    const res = await fetch(`${TIKTOK_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        ...body,
      }),
    });

    if (!res.ok) {
      console.error('[TikTok Ads] Erro na API:', await res.text());
      return null;
    }

    const resData = await res.json() as any;
    if (resData.code !== 0) {
      console.error('[TikTok Ads] Erro:', resData.message);
      return null;
    }

    return resData.data as T;
  } catch (err) {
    console.error('[TikTok Ads] Erro de conexão:', err);
    return null;
  }
}

export async function getCampaigns() {
  const data = await tiktokFetch<any>('/campaign/get/', {
    filtering: {},
    page_size: 50,
    page: 1,
  });

  if (!data?.list) return null;

  return data.list.map((c: any) => ({
    id: c.campaign_id,
    name: c.campaign_name,
    status: c.primary_status === 'CAMPAIGN_STATUS_DELIVERY_OK' ? 'active'
      : c.primary_status === 'CAMPAIGN_STATUS_PAUSE' ? 'paused'
      : c.primary_status?.toLowerCase().replace('campaign_status_', ''),
    objective: c.objective_type,
    daily_budget: c.daily_budget_amount ? parseFloat(c.daily_budget_amount) : 0,
    budget_mode: c.budget_mode,
  }));
}

export async function getAdGroups() {
  const data = await tiktokFetch<any>('/adgroup/get/', {
    filtering: {},
    page_size: 50,
    page: 1,
  });

  return data?.list || null;
}

export async function getAds() {
  const data = await tiktokFetch<any>('/ad/get/', {
    filtering: {},
    page_size: 50,
    page: 1,
  });

  return data?.list || null;
}

export async function getInsights(dateStart?: string, dateEnd?: string) {
  const data = await tiktokFetch<any>('/report/integrated/get/', {
    report_type: 'BASIC',
    data_level: 'CAMPAIGN',
    dimensions: ['campaign_id', 'campaign_name', 'stat_time_day'],
    metrics: [
      'impressions', 'clicks', 'cost', 'ctr', 'cpc',
      'cpm', 'conversion', 'conversion_rate', 'conversion_cost',
      'reach', 'video_views_3s', 'video_watched_2s',
      'engagement_rate',
    ],
    start_date: dateStart || getDefaultDate(30),
    end_date: dateEnd || getDefaultDate(0),
    page_size: 50,
    page: 1,
  });

  return data;
}

function getDefaultDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

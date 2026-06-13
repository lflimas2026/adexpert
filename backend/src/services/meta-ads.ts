const META_API_BASE = 'https://graph.facebook.com/v21.0';

let accessToken: string | null = null;
let adAccountId: string | null = null;

export function isMetaConfigured(): boolean {
  return !!(accessToken && adAccountId);
}

export function configureMeta(token: string, accountId: string): void {
  accessToken = token;
  adAccountId = accountId;
}

export function getMetaConfig() {
  return { accessToken, adAccountId };
}

async function metaFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!accessToken) return null;

  const url = new URL(`${META_API_BASE}${endpoint}`);
  url.searchParams.set('access_token', accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Meta Ads] Erro na API:', err);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('[Meta Ads] Erro de conexão:', err);
    return null;
  }
}

export async function getCampaigns() {
  if (!adAccountId) return null;

  const data = await metaFetch<any>(`/${adAccountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
    limit: '50',
  });

  if (!data?.data) return null;

  return data.data.map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status === 'ACTIVE' ? 'active' : c.status === 'PAUSED' ? 'paused' : c.status?.toLowerCase(),
    objective: c.objective,
    daily_budget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : 0,
    start_time: c.start_time,
  }));
}

export async function getCampaignInsights(campaignId?: string, datePreset: string = 'last_30d') {
  if (!adAccountId) return null;

  const id = campaignId || adAccountId;
  const data = await metaFetch<any>(`/${id}/insights`, {
    fields: 'campaign_name,impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,conversions,actions',
    date_preset: datePreset,
    level: campaignId ? 'campaign' : 'account',
  });

  return data;
}

export async function getAdAccounts() {
  const data = await metaFetch<any>('/me/adaccounts', {
    fields: 'id,name,account_status,business_name,currency',
  });
  return data?.data || null;
}

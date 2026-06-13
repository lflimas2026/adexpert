const META_API_BASE = 'https://graph.facebook.com/v21.0';

function getConfig() {
  return {
    accessToken: process.env.META_ADS_ACCESS_TOKEN || null,
    adAccountId: process.env.META_ADS_ACCOUNT_ID || null,
  };
}

let runtimeConfig: { accessToken: string | null; adAccountId: string | null } | null = null;

function useConfig() {
  return runtimeConfig || getConfig();
}

export function isMetaConfigured(): boolean {
  const cfg = useConfig();
  return !!(cfg.accessToken && cfg.adAccountId);
}

export function configureMeta(accessToken: string, adAccountId: string): void {
  runtimeConfig = { accessToken, adAccountId };
}

export function getMetaConfig() {
  return { ...useConfig() };
}

async function metaFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const cfg = useConfig();
  if (!cfg.accessToken) return null;

  const url = new URL(`${META_API_BASE}${endpoint}`);
  url.searchParams.set('access_token', cfg.accessToken);
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
  const cfg = useConfig();
  if (!cfg.adAccountId) return null;

  const data = await metaFetch<any>(`/${cfg.adAccountId}/campaigns`, {
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
  const cfg = useConfig();
  if (!cfg.adAccountId) return null;

  const id = campaignId || cfg.adAccountId;
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

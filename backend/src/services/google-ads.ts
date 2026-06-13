const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v18';

interface GoogleAdsConfig {
  developerToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  refreshToken: string | null;
  customerId: string | null;
  loginCustomerId: string | null;
}

function getDefaultConfig(): GoogleAdsConfig {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || null,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || null,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || null,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || null,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || null,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || null,
  };
}

let config: GoogleAdsConfig = getDefaultConfig();
let accessToken: string | null = null;

function useConfig() {
  if (!config.developerToken) config = getDefaultConfig();
  return config;
}

export function isGoogleAdsConfigured(): boolean {
  const cfg = useConfig();
  return !!(cfg.developerToken && cfg.customerId && cfg.refreshToken
    && cfg.developerToken !== 'seu_dev_token_aqui'
    && cfg.customerId !== '1234567890');
}

export function configureGoogleAds(cfg: Partial<GoogleAdsConfig>): void {
  config = { ...config, ...cfg };
}

async function refreshAccessToken(): Promise<string | null> {
  const cfg = useConfig();
  if (!cfg.clientId || !cfg.clientSecret || !cfg.refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: cfg.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      console.error('[Google Ads] Erro ao renovar token:', await res.text());
      return null;
    }

    const data = await res.json() as any;
    accessToken = data.access_token;
    return accessToken;
  } catch (err) {
    console.error('[Google Ads] Erro de conexão OAuth:', err);
    return null;
  }
}

async function googleAdsFetch(query: string): Promise<any> {
  const cfg = useConfig();
  if (!cfg.developerToken || !cfg.customerId) return null;

  if (!accessToken) {
    const token = await refreshAccessToken();
    if (!token) return null;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': cfg.developerToken,
    'login-customer-id': cfg.loginCustomerId || cfg.customerId,
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(
      `${GOOGLE_ADS_API_BASE}/customers/${cfg.customerId}/googleAds:search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    if (res.status === 401) {
      const token = await refreshAccessToken();
      if (!token) return null;
      headers['Authorization'] = `Bearer ${token}`;
      const retryRes = await fetch(
        `${GOOGLE_ADS_API_BASE}/customers/${cfg.customerId}/googleAds:search`,
        { method: 'POST', headers, body: JSON.stringify({ query }) }
      );
      if (!retryRes.ok) return null;
      return retryRes.json();
    }

    if (!res.ok) {
      console.error('[Google Ads] Erro na API:', await res.text());
      return null;
    }

    return res.json();
  } catch (err) {
    console.error('[Google Ads] Erro de conexão:', err);
    return null;
  }
}

export async function getCampaigns() {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.start_date,
      campaign.end_date,
      campaign.budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name
  `;

  const data = await googleAdsFetch(query) as any;
  if (!data?.results) return null;

  return data.results.map((r: any) => ({
    id: r.campaign.id,
    name: r.campaign.name,
    status: r.campaign.status?.toLowerCase(),
    channel_type: r.campaign.advertising_channel_type,
    daily_budget: r.campaign.budget?.amount_micros
      ? parseFloat(r.campaign.budget.amount_micros) / 1_000_000
      : 0,
    start_date: r.campaign.start_date,
  }));
}

export async function getCampaignMetrics(campaignId?: string) {
  const condition = campaignId
    ? `WHERE campaign.id = ${campaignId}`
    : 'WHERE segments.date DURING LAST_30_DAYS';

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.conversions_value,
      metrics.all_conversions,
      segments.date
    ${condition}
    ORDER BY segments.date DESC
  `;

  return googleAdsFetch(query);
}

export async function getKeywords() {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.quality_info.quality_score,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_micros
    FROM keyword_view
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.impressions DESC
  `;

  return googleAdsFetch(query);
}

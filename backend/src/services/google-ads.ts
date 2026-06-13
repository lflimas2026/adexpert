const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v18';

let developerToken: string | null = null;
let clientId: string | null = null;
let clientSecret: string | null = null;
let refreshToken: string | null = null;
let customerId: string | null = null;
let loginCustomerId: string | null = null;
let accessToken: string | null = null;

export function isGoogleAdsConfigured(): boolean {
  return !!(developerToken && customerId && refreshToken
    && developerToken !== 'seu_dev_token_aqui'
    && customerId !== '1234567890');
}

export function configureGoogleAds(cfg: {
  developerToken?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
  customerId?: string | null;
  loginCustomerId?: string | null;
}): void {
  if (cfg.developerToken !== undefined) developerToken = cfg.developerToken;
  if (cfg.clientId !== undefined) clientId = cfg.clientId;
  if (cfg.clientSecret !== undefined) clientSecret = cfg.clientSecret;
  if (cfg.refreshToken !== undefined) refreshToken = cfg.refreshToken;
  if (cfg.customerId !== undefined) customerId = cfg.customerId;
  if (cfg.loginCustomerId !== undefined) loginCustomerId = cfg.loginCustomerId;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
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
  if (!developerToken || !customerId) return null;

  if (!accessToken) {
    const token = await refreshAccessToken();
    if (!token) return null;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'login-customer-id': loginCustomerId || customerId,
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(
      `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`,
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
        `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`,
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

const BASE = 'http://localhost:3001';

async function fetchAPI(endpoint: string) {
  const res = await fetch(`${BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postAPI(endpoint: string, body: any) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

export const api = {
  getDashboard: () => fetchAPI('/api/dashboard'),
  getCampaigns: (platform?: string) => fetchAPI(`/api/campaigns${platform ? `?platform=${platform}` : ''}`),
  getCampaign: (id: string) => fetchAPI(`/api/campaigns/${id}`),
  getRecommendations: (params?: { status?: string; campaign_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.campaign_id) q.set('campaign_id', params.campaign_id);
    return fetchAPI(`/api/recommendations${q.toString() ? `?${q}` : ''}`);
  },
  respondRecommendation: (id: string, status: string) => postAPI(`/api/recommendations/${id}/respond`, { status }),
  getIntegrations: () => fetchAPI('/api/integrations'),
  connectPlatform: (platform: string) => postAPI(`/api/integrations/connect/${platform}`, {}),
  connectAI: (provider: string, model?: string) => postAPI(`/api/integrations/ai/${provider}/connect`, { model }),
  updatePreferences: (prefs: any) => postAPI('/api/integrations/preferences', prefs),
  getInsights: () => fetchAPI('/api/insights'),
  getActionLogs: () => fetchAPI('/api/action-logs'),
  getEarnings: () => fetchAPI('/api/earnings'),
  chat: (message: string) => postAPI('/api/chat', { message }),
};

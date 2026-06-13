const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TIMEOUT = 4000;

async function fetchAPI<T>(endpoint: string, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${endpoint}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

async function postAPI<T>(endpoint: string, body: any, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

async function putAPI<T>(endpoint: string, body: any, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

async function deleteAPI<T>(endpoint: string, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'DELETE', signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

import { DashboardData, Campaign, Recommendation, Insights, ActionLog, Earnings, Documentation } from '../types';

const emptyDashboard: DashboardData = {
  summary: { spending: 0, clicks: 0, conversions: 0, roas: 0 },
  status: { active: 0, paused: 0, critical: 0, warning: 0, total: 0 },
  topRecommendations: [], alerts: [], platformComparison: [], earnings: { total_spending: 0, estimated_savings: 0, actual_savings: 0, extra_revenue: 0, roi_improvement: 0, history: [] }
};

export const api = {
  getDashboard: () => fetchAPI<DashboardData>('/api/dashboard', emptyDashboard),
  getCampaigns: (platform?: string) => fetchAPI<Campaign[]>(`/api/campaigns${platform ? `?platform=${platform}` : ''}`, []),
  getCampaign: (id: string) => fetchAPI<Campaign | null>(`/api/campaigns/${id}`, null),
  getRecommendations: (params?: { status?: string; campaign_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.campaign_id) q.set('campaign_id', params.campaign_id);
    return fetchAPI<Recommendation[]>(`/api/recommendations${q.toString() ? `?${q}` : ''}`, []);
  },
  respondRecommendation: (id: string, status: string) => postAPI<Recommendation | null>(`/api/recommendations/${id}/respond`, { status }, null),
  getIntegrations: () => fetchAPI<any>('/api/integrations', { accounts: [], aiConfigs: [], preferences: {} }),
  connectPlatform: (platform: string) => postAPI<any>(`/api/integrations/connect/${platform}`, {}, {}),
  connectAI: (provider: string, model?: string) => postAPI<any>(`/api/integrations/ai/${provider}/connect`, { model }, {}),
  updatePreferences: (prefs: any) => postAPI<any>('/api/integrations/preferences', prefs, prefs),
  getInsights: () => fetchAPI<Insights | null>('/api/insights', null),
  getActionLogs: () => fetchAPI<ActionLog[]>('/api/action-logs', []),
  getEarnings: () => fetchAPI<Earnings | null>('/api/earnings', null),
  chat: (message: string) => postAPI<{ reply: string }>('/api/chat', { message }, { reply: '' }),
  getDocs: () => fetchAPI<Documentation>('/api/docs', { content: '' }),
  saveDocs: (content: string) => postAPI<{ success: boolean }>('/api/docs/save', { content }, { success: false }),
};


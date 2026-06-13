export interface User { id: string; name: string; email: string; company: string; plan: string; primary_ai: string; created_at: string; }
export interface CampaignMetrics { clicks: number; impressions: number; reach?: number; ctr: number; cpc: number; cpm: number; conversions: number; cost: number; roas: number; frequency?: number; quality_score?: number; }
export interface Campaign { id: string; user_id: string; platform: string; name: string; objective: string; status: string; budget_daily: number; start_date: string; end_date?: string; target_cpa?: number; metrics: CampaignMetrics; audiences?: any[]; placements?: any[]; creatives?: any[]; schedule?: any[]; keywords?: any[]; }
export interface Recommendation { id: string; campaign_id: string; platform: string; type: string; severity: string; current_metric: string; recommended_action: string; expected_impact: string; confidence: number; reasoning: string; generated_by_ai: string; status: string; score: number; created_at: string; }
export interface Alert { id: string; type: string; message: string; time: string; severity: string; }
export interface Earnings { total_spending: number; estimated_savings: number; actual_savings: number; extra_revenue: number; roi_improvement: number; history: { month: string; spending: number; savings: number; extra: number }[]; }
export interface ActionLog { id: string; platform: string; campaign_name: string; action_type: string; before_state: any; after_state: any; impact_expected: string; impact_actual: string; implemented_by: string; timestamp: string; reason: string; }
export interface Insights { total_recommendations: number; success_rate: number; total_savings: number; total_extra: number; total_impact: number; total_paid: number; overall_roi: number; top_campaigns: any[]; patterns: any[]; failures: any[]; future: any[]; }
export interface DashboardData { summary: { spending: number; clicks: number; conversions: number; roas: number }; status: { active: number; paused: number; critical: number; warning: number; total: number }; topRecommendations: Recommendation[]; alerts: Alert[]; platformComparison: { platform: string; spend: number; roas: number; cpa: number }[]; earnings: Earnings; }
export interface Documentation {
  content: string;
}


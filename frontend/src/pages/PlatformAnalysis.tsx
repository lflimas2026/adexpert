import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, Target, TrendingUp, Eye, Clock, Play, Pause, AlertTriangle, CheckCircle2, ThumbsUp, Star, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { Campaign } from '../types';
import StatCard from '../components/StatCard';

const platformNames: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads' };
const platformColors: Record<string, string> = { meta: 'text-blue-400', google: 'text-amber-400', tiktok: 'text-purple-400' };

export default function PlatformAnalysis() {
  const { platform } = useParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    api.getCampaigns(platform).then(d => { setCampaigns(d); setLoaded(true); });
  }, [platform]);

  if (!loaded) return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Carregando...</div>;

  const totalSpend = campaigns.reduce((s, c) => s + c.metrics.cost, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0);
  const totalConv = campaigns.reduce((s, c) => s + (c.metrics.conversions || 0), 0);
  const avgRoas = totalSpend > 0 ? campaigns.reduce((s, c) => s + c.metrics.roas * c.metrics.cost, 0) / totalSpend : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className={`text-xl font-bold ${platformColors[platform || 'meta']}`}>{platformNames[platform || 'meta']}</h2>
        <span className="text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-1 rounded-md">Análise Completa</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Gasto" value={`R$ ${totalSpend}`} icon={<DollarSign size={18} />} />
        <StatCard label="Cliques" value={totalClicks.toLocaleString()} icon={<Target size={18} />} />
        <StatCard label="Conversões" value={totalConv} icon={<TrendingUp size={18} />} />
        <StatCard label="ROAS Médio" value={`${avgRoas.toFixed(1)}x`} icon={<Eye size={18} />} />
      </div>

      <div className="space-y-4">
        {campaigns.map(campaign => {
          const isBest = campaign.metrics.roas >= 2;
          const isWorst = campaign.metrics.roas < 1.2;
          return (
            <div key={campaign.id} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className={`border rounded-xl p-5 ${isWorst ? 'border-l-4 border-l-red-500' : isBest ? 'border-l-4 border-l-emerald-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--text)]">{campaign.name}</h3>
                  <span className={`badge ${campaign.status === 'active' ? 'status-active' : 'status-paused'}`}>
                    {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                  </span>
                  {isBest && <Star size={14} className="text-emerald-400" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span>Budget: R$ {campaign.budget_daily}/dia</span>
                  <span>Gasto: R$ {campaign.metrics.cost}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-4">
                <div><p className="text-xs text-[var(--text-secondary)]">ROAS</p><p className={`text-lg font-bold ${isBest ? 'text-emerald-400' : isWorst ? 'text-red-400' : 'text-[var(--text)]'}`}>{campaign.metrics.roas}x</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">CPC</p><p className="text-lg font-bold text-[var(--text)]">R$ {campaign.metrics.cpc}</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">CPM</p><p className="text-lg font-bold text-[var(--text)]">R$ {campaign.metrics.cpm}</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">CTR</p><p className="text-lg font-bold text-[var(--text)]">{campaign.metrics.ctr}%</p></div>
                {campaign.metrics.frequency && <div><p className="text-xs text-[var(--text-secondary)]">Frequência</p><p className={`text-lg font-bold ${(campaign.metrics.frequency || 0) > 3 ? 'text-red-400' : 'text-emerald-400'}`}>{campaign.metrics.frequency}</p></div>}
                {campaign.metrics.quality_score && <div><p className="text-xs text-[var(--text-secondary)]">QS</p><p className="text-lg font-bold text-[var(--text)]">{campaign.metrics.quality_score}/10</p></div>}
              </div>

              {campaign.audiences && campaign.audiences.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--text)] mb-2">PÚBLICOS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {campaign.audiences.map((aud: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg ${aud.status === 'best' ? 'bg-emerald-500/5 border border-emerald-500/10' : aud.status === 'worst' ? 'bg-red-500/5 border border-red-500/10' : 'bg-white/5'}`}>
                        <p className="text-sm font-medium text-[var(--text)]">{aud.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">ROAS {aud.roas}x | CPA R$ {aud.cpa}</p>
                        {aud.status === 'best' && <span className="text-xs text-emerald-400">⭐ Melhor!</span>}
                        {aud.status === 'worst' && <span className="text-xs text-red-400">❌ Pior</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-xs text-amber-400">⚠️ Overlap detectado: 60% dos públicos compartilham mesma audiência</p>
                  </div>
                </div>
              )}

              {campaign.placements && campaign.placements.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--text)] mb-2">PLACEMENTS</p>
                  <div className="grid grid-cols-4 gap-2">
                    {campaign.placements.map((pl: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg ${pl.status === 'best' ? 'bg-emerald-500/5 border border-emerald-500/10' : pl.status === 'worst' ? 'bg-red-500/5 border border-red-500/10' : 'bg-white/5'}`}>
                        <p className="text-sm font-medium text-[var(--text)]">{pl.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">ROAS {pl.roas}x</p>
                        {pl.status === 'best' && <span className="text-xs text-emerald-400">🥇 Melhor</span>}
                        {pl.status === 'worst' && <span className="text-xs text-red-400">❌ Pior</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaign.creatives && campaign.creatives.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[var(--text)] mb-2">CRIATIVOS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {campaign.creatives.map((cr: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg ${cr.status === 'best' ? 'bg-emerald-500/5 border border-emerald-500/10' : cr.status === 'fatigue' ? 'bg-red-500/5 border border-red-500/10' : 'bg-white/5'}`}>
                        <p className="text-sm font-medium text-[var(--text)]">{cr.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">CTR {cr.ctr}% | CPC R$ {cr.cpc}</p>
                        {cr.status === 'fatigue' && <span className="text-xs text-red-400">Creative fatigue ❌</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaign.schedule && campaign.schedule.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text)] mb-2">HORÁRIOS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {campaign.schedule.map((sh: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5">
                        <p className="text-sm font-medium text-[var(--text)]">{sh.hour}</p>
                        <p className="text-xs text-[var(--text-secondary)]">CPM {sh.cpm_change > 0 ? '+' : ''}{sh.cpm_change}% | Conv {sh.conv_change}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaign.keywords && campaign.keywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text)] mb-2">KEYWORDS</p>
                  <div className="space-y-1">
                    {campaign.keywords.map((kw: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text)]">{kw.keyword}</span>
                          <span className={`badge ${kw.match_type === 'exact' ? 'bg-primary-500/10 text-primary-400' : kw.match_type === 'phrase' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{kw.match_type}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                          <span>QS: {kw.quality_score}/10</span>
                          <span>CTR: {kw.ctr}%</span>
                          <span>Conv: {kw.conversions}</span>
                          {kw.conversions === 0 && <span className="text-red-400">❌</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors">Ver detalhes</button>
                {isBest && <button className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-white/5 transition-colors">Aumentar Budget</button>}
                {isWorst && <button className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors">Pausar Campanha</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

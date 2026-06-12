import { useEffect, useState } from 'react';
import { DollarSign, MousePointerClick, Target, TrendingUp, AlertTriangle, Info, CheckCircle2, Zap, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import StatCard from '../components/StatCard';
import RecommendationCard from '../components/RecommendationCard';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Gasto Total" value={`R$ ${data.summary.spending.toLocaleString()}`} change="+12% vs período anterior" icon={<DollarSign size={18} />} trend="up" />
        <StatCard label="Cliques" value={data.summary.clicks.toLocaleString()} change="-5% vs período anterior" icon={<MousePointerClick size={18} />} trend="down" />
        <StatCard label="Conversões" value={data.summary.conversions} change="+8% vs período anterior" icon={<Target size={18} />} trend="up" />
        <StatCard label="ROAS Médio" value={`${data.summary.roas}x`} change="+0.2x vs período anterior" icon={<TrendingUp size={18} />} trend="up" />
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Campanhas por Status</h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
            <p className="text-2xl font-bold text-emerald-400">{data.status.active}</p>
            <p className="text-xs text-[var(--text-secondary)]">Ativas</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
            <p className="text-2xl font-bold text-amber-400">{data.status.warning}</p>
            <p className="text-xs text-[var(--text-secondary)]">Alertas</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-400">{data.status.critical}</p>
            <p className="text-xs text-[var(--text-secondary)]">Críticas</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-500/5 border border-gray-500/10 text-center">
            <p className="text-2xl font-bold text-[var(--text-secondary)]">{data.status.paused}</p>
            <p className="text-xs text-[var(--text-secondary)]">Pausadas</p>
          </div>
          <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/10 text-center">
            <p className="text-2xl font-bold text-primary-400">{data.status.total}</p>
            <p className="text-xs text-[var(--text-secondary)]">Total</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Top Recomendações da IA</h3>
        <div className="grid grid-cols-3 gap-4">
          {data.topRecommendations.map(rec => (
            <RecommendationCard key={rec.id} rec={rec} onRespond={(id, status) => setData(prev => prev ? { ...prev, topRecommendations: prev.topRecommendations.filter(r => r.id !== id) } : prev)} />
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Alertas em Tempo Real</h3>
        <div className="space-y-2">
          {data.alerts.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              {a.severity === 'warning' ? <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" /> : a.severity === 'info' && a.type === 'opportunity' ? <Info size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)]">{a.message}</p>
              </div>
              <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Comparação entre Plataformas</h3>
          <div className="space-y-3">
            {data.platformComparison.map(p => (
              <div key={p.platform} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--text)]">{p.platform}</span>
                  <span className="text-sm font-bold text-primary-400">ROAS {p.roas}x</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Gasto: R$ {p.spend}</span>
                  <span>CPA: R$ {p.cpa}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs text-amber-400 font-medium">💡 Recomendação: Tire 20% do Google, coloque em TikTok</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">ROAS estimado: de 2.2x para 2.5x = +R$ 600/dia</p>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Economias Acumuladas</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5">
              <span className="text-sm text-[var(--text)]">Economizado este mês</span>
              <span className="text-sm font-bold text-emerald-400">R$ {data.earnings.actual_savings.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5">
              <span className="text-sm text-[var(--text)]">Ganho extra este mês</span>
              <span className="text-sm font-bold text-emerald-400">R$ {data.earnings.extra_revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-500/5">
              <span className="text-sm text-[var(--text)]">Retorno total</span>
              <span className="text-sm font-bold text-primary-400">{data.earnings.roi_improvement}% 🚀</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

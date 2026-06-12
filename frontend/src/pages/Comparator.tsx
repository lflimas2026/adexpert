import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';

export default function Comparator() {
  const [comparison, setComparison] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);

  useEffect(() => {
    api.getDashboard().then(d => setComparison(d.platformComparison));
    api.getEarnings().then(setEarnings);
  }, []);

  const platformColors: Record<string, string> = { 'Meta Ads': 'text-blue-400 bg-blue-500/10', 'Google Ads': 'text-amber-400 bg-amber-500/10', 'TikTok': 'text-purple-400 bg-purple-500/10' };
  const barColors: Record<string, string> = { 'Meta Ads': 'bg-blue-500', 'Google Ads': 'bg-amber-500', 'TikTok': 'bg-purple-500' };
  const maxRoas = Math.max(...comparison.map(p => p.roas), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text)]">Comparador: Meta vs Google vs TikTok</h2>

      <div className="grid grid-cols-3 gap-4">
        {comparison.map(p => (
          <StatCard
            key={p.platform}
            label={p.platform}
            value={`ROAS ${p.roas}x`}
            icon={<BarChart3 size={18} />}
          />
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">ROAS por Plataforma</h3>
        <div className="space-y-4">
          {comparison.map(p => (
            <div key={p.platform}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${platformColors[p.platform]?.split(' ')[0] || 'text-[var(--text)]'}`}>{p.platform}</span>
                <span className={`text-sm font-bold ${p.roas >= maxRoas ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                  {p.roas}x {p.roas >= maxRoas ? '⭐ Melhor' : ''}
                </span>
              </div>
              <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColors[p.platform] || 'bg-primary-500'}`} style={{ width: `${(p.roas / maxRoas) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Tabela Comparativa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--text-secondary)] text-xs border-b border-[var(--border)]">
                <th className="text-left py-2 px-3">Métrica</th>
                {comparison.map(p => <th key={p.platform} className={`text-right py-2 px-3 ${platformColors[p.platform]?.split(' ')[0] || ''}`}>{p.platform}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 px-3 text-[var(--text)]">ROAS</td>
                {comparison.map(p => <td key={p.platform} className={`text-right py-2 px-3 font-medium ${p.roas >= maxRoas ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>{p.roas}x</td>)}
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 px-3 text-[var(--text)]">CPA</td>
                {comparison.map(p => <td key={p.platform} className="text-right py-2 px-3 text-[var(--text)]">R$ {p.cpa}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-3 text-[var(--text)]">Gasto</td>
                {comparison.map(p => <td key={p.platform} className="text-right py-2 px-3 text-[var(--text)]">R$ {p.spend}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Análise de Redistribuição</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Cenário Atual</p>
            <div className="space-y-2">
              {comparison.map(p => {
                const ret = p.spend * p.roas;
                return (
                  <div key={p.platform} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/5">
                    <span className="text-[var(--text)]">{p.platform}</span>
                    <div className="text-right">
                      <p className="text-[var(--text)]">R$ {p.spend} → R$ {ret.toFixed(0)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Sugestão: Tire 30% do Google, coloque em TikTok</p>
            <div className="space-y-2">
              {comparison.map(p => {
                let spend = p.spend;
                if (p.platform === 'Google Ads') spend *= 0.7;
                if (p.platform === 'TikTok') spend += comparison.find(x => x.platform === 'Google Ads')?.spend * 0.3 || 0;
                const ret = spend * p.roas;
                return (
                  <div key={p.platform} className="flex items-center justify-between text-sm p-2 rounded-lg bg-emerald-500/5">
                    <span className="text-[var(--text)]">{p.platform}</span>
                    <div className="text-right">
                      <p className="text-[var(--text)]">R$ {spend.toFixed(0)} → R$ {ret.toFixed(0)}</p>
                    </div>
                  </div>
                );
              })}
              <div className="p-2 rounded-lg bg-primary-500/10 text-center text-xs text-primary-400">
                Ganho estimado: +R$ 264/mês (+4%) apenas redistribuindo!
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">Implementar Redistribuição</button>
          <button className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-white/5 transition-colors">Simular Outro</button>
        </div>
      </div>
    </div>
  );
}

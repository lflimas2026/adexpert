import { useEffect, useState } from 'react';
import { TrendingUp, Target, Lightbulb, AlertTriangle, Star, ArrowRight, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function History() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getInsights().then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text)]">Histórico & Insights Acumulados</h2>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Estatísticas desde o início</h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <p className="text-2xl font-bold text-primary-400">{data.total_recommendations}</p>
            <p className="text-xs text-[var(--text-secondary)]">Recomendações</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{data.success_rate}%</p>
            <p className="text-xs text-[var(--text-secondary)]">Taxa de Sucesso</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">R$ {data.total_savings.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-secondary)]">Economias</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">R$ {data.total_extra.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-secondary)]">Ganho Extra</p>
          </div>
          <div className="p-3 rounded-lg bg-primary-500/5 text-center">
            <p className="text-2xl font-bold text-primary-400">{data.overall_roi}% 🚀</p>
            <p className="text-xs text-[var(--text-secondary)]">ROI Total</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Campanhas que mais funcionaram 🏆</h3>
        <div className="space-y-3">
          {data.top_campaigns.map((c: any, i: number) => (
            <div key={i} className="p-4 rounded-lg bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                  <h4 className="font-semibold text-[var(--text)]">{c.name}</h4>
                </div>
                <span className="text-sm font-bold text-emerald-400">ROAS {c.roas}x</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-[var(--text-secondary)] mb-2">
                <span>Conversões: {c.conversions}</span>
                <span>Budget: R$ {c.budget}</span>
                <span>Retorno: R$ {c.return}</span>
              </div>
              <p className="text-xs text-primary-400">🔑 Segredo: {c.insight}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2"><Lightbulb size={16} className="text-amber-400" /> Padrões Descobertos</h3>
          <div className="space-y-3">
            {data.patterns.map((p: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-amber-400">🔍 Insight {i + 1}</span>
                </div>
                <p className="text-sm font-medium text-[var(--text)] mb-1">{p.insight}</p>
                <p className="text-xs text-[var(--text-secondary)] mb-1">{p.description}</p>
                <p className="text-xs text-primary-400">→ {p.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" /> Campanhas com Problema</h3>
          <div className="space-y-3">
            {data.failures.map((f: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-[var(--text)]">❌ {f.name}</p>
                  <span className="text-xs text-red-400">Perdeu R$ {f.loss}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">ROAS: {f.roas}x</p>
                <p className="text-xs text-amber-400 mt-1">📘 Aprendizado: {f.lesson}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2"><Zap size={16} className="text-primary-400" /> Recomendações Futuras</h3>
        <div className="space-y-3">
          {data.future.map((f: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-400">{i + 1}.</span>
                <span className="text-sm text-[var(--text)]">{f.recommendation}</span>
              </div>
              <span className="text-xs text-emerald-400">{f.estimate}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">Implementar Sugestões</button>
        </div>
      </div>
    </div>
  );
}

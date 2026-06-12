import { useState } from 'react';
import { Recommendation } from '../types';
import { api } from '../services/api';

interface Props {
  rec: Recommendation;
  onRespond: (id: string, status: string) => void;
}

const severityColors: Record<string, string> = { high: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20', critical: 'bg-red-500/10 text-red-400 border-red-500/20' };
const severityLabels: Record<string, string> = { high: 'OPORTUNIDADE', medium: 'ATENÇÃO', critical: 'CRÍTICO' };
const severityIcons: Record<string, string> = { high: '🟢', medium: '🟡', critical: '🔴' };

export default function RecommendationCard({ rec, onRespond }: Props) {
  const [loading, setLoading] = useState(false);

  const handle = async (status: string) => {
    setLoading(true);
    await api.respondRecommendation(rec.id, status);
    onRespond(rec.id, status);
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className={`border rounded-xl p-4 border-l-4 ${severityColors[rec.severity].split(' ').slice(1, 2).join(' ')}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`badge ${severityColors[rec.severity]} border`}>
          {severityIcons[rec.severity]} {severityLabels[rec.severity]} (Confiança: {rec.confidence}%)
        </span>
        <span className="text-xs text-[var(--text-secondary)]">{rec.generated_by_ai === 'claude' ? 'Claude' : rec.generated_by_ai}</span>
      </div>
      <p className="font-semibold text-sm text-[var(--text)] mb-1">{rec.recommended_action}</p>
      <p className="text-xs text-[var(--text-secondary)] mb-1">{rec.current_metric}</p>
      <p className="text-sm text-primary-400 font-medium mb-2">{rec.expected_impact}</p>
      <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{rec.reasoning}</p>
      {rec.status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => handle('accepted')} disabled={loading} className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors disabled:opacity-50">
            {rec.severity === 'critical' ? 'Implementar Agora' : 'Aceitar'}
          </button>
          <button onClick={() => handle('rejected')} disabled={loading} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-white/5 transition-colors disabled:opacity-50">
            Rejeitar
          </button>
          <button className="px-3 py-1.5 rounded-lg text-primary-400 text-xs hover:bg-primary-500/10 transition-colors">Ver detalhes</button>
        </div>
      )}
    </div>
  );
}

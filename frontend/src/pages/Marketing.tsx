import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Archive, Plus, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Campaign } from '../types';

const platformLabel: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads' };
const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-yellow-500/10 text-yellow-400',
  finished: 'bg-blue-500/10 text-blue-400',
};

export default function Marketing() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedFilter, setArchivedFilter] = useState('false');

  useEffect(() => {
    setLoading(true);
    api.getCampaigns({ archived: archivedFilter }).then(data => {
      setCampaigns(data);
      setLoading(false);
    });
  }, [archivedFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text)]">Campanhas de Marketing</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => api.getCampaigns({ archived: archivedFilter }).then(setCampaigns)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors">
            <RefreshCw size={18} />
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
            <Plus size={16} /> Nova Campanha
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--text-secondary)]">Mostrar:</span>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {[
            { value: 'false', label: 'Ativas' },
            { value: 'true', label: 'Arquivadas' },
            { value: 'all', label: 'Todas' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setArchivedFilter(opt.value === 'all' ? 'all' : opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                archivedFilter === opt.value || (archivedFilter === 'all' && opt.value === 'all')
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-12 text-center">
          <p className="text-[var(--text-secondary)]">Nenhuma campanha encontrada.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] text-xs uppercase">
                <th className="text-left px-5 py-3 font-medium">Nome</th>
                <th className="text-left px-5 py-3 font-medium">Plataforma</th>
                <th className="text-right px-5 py-3 font-medium">Budget</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Conversões</th>
                <th className="text-right px-5 py-3 font-medium">ROI</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const roi = c.metrics.cost > 0 ? ((c.metrics.roas - 1) * 100).toFixed(0) : '0';
                return (
                  <tr key={c.id} className={`border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors ${c.arquivada ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[var(--text)] font-medium ${c.arquivada ? 'line-through' : ''}`}>{c.name}</span>
                        {c.arquivada && <span className="badge bg-gray-500/10 text-gray-400 text-[10px]">Arquivada</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{platformLabel[c.platform] || c.platform}</td>
                    <td className="px-5 py-4 text-right text-[var(--text)]">R$ {c.budget_daily}/dia</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`badge ${statusColor[c.status] || 'bg-gray-500/10 text-gray-400'}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-[var(--text)]">{c.metrics.conversions}</td>
                    <td className={`px-5 py-4 text-right font-medium ${Number(roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi}%</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/marketing/${c.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-medium hover:bg-primary-500/20 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Archive, Copy, Trash2, RotateCcw, Bot, Loader2, Save, X } from 'lucide-react';
import { api } from '../services/api';
import { Campaign } from '../types';

const platformLabel: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads' };
const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-yellow-500/10 text-yellow-400',
  finished: 'bg-blue-500/10 text-blue-400',
};

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', status: '', budget_daily: 0, target_cpa: 0, objective: '', start_date: '', end_date: '',
  });

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    api.getCampaign(campaignId).then(data => {
      if (data) {
        setCampaign(data);
        setEditForm({
          name: data.name,
          status: data.status,
          budget_daily: data.budget_daily,
          target_cpa: data.target_cpa || 0,
          objective: data.objective,
          start_date: data.start_date,
          end_date: data.end_date || '',
        });
      }
      setLoading(false);
    });
  }, [campaignId]);

  const handleArchive = async () => {
    if (!campaign) return;
    const res = await api.archiveCampaign(campaign.id);
    if (res?.success) {
      setCampaign({ ...campaign, arquivada: true });
      setConfirmArchive(false);
    }
  };

  const handleUnarchive = async () => {
    if (!campaign) return;
    const res = await api.unarchiveCampaign(campaign.id);
    if (res?.success) {
      setCampaign({ ...campaign, arquivada: false });
    }
  };

  const handleSave = async () => {
    if (!campaign) return;
    const updated = await api.updateCampaign(campaign.id, editForm);
    if (updated) {
      setCampaign(updated);
      setEditing(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!campaign) return;
    setAiLoading(true);
    setAiAnalysis(null);
    const allCampaigns = await api.getCampaigns({ includeArchived: 'true' });
    const campaignData = JSON.stringify({
      selected: campaign,
      all: allCampaigns,
    }, null, 2);
    const res = await api.chat(`Analise esta campanha especifica e de recomendações. Aqui estao os dados: ${campaignData}`);
    setAiAnalysis(res.reply || 'Erro ao analisar. Tente novamente.');
    setAiLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Carregando...</div>;
  }

  if (!campaign) {
    return (
      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-12 text-center">
        <p className="text-[var(--text-secondary)] mb-4">Campanha não encontrada.</p>
        <button onClick={() => navigate('/marketing')} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium">Voltar para Lista</button>
      </div>
    );
  }

  const roi = campaign.metrics.cost > 0 ? ((campaign.metrics.roas - 1) * 100).toFixed(1) : '0';
  const cpm = campaign.metrics.impressions > 0 ? (campaign.metrics.cost / campaign.metrics.impressions * 1000).toFixed(2) : '0';
  const cpc = campaign.metrics.clicks > 0 ? (campaign.metrics.cost / campaign.metrics.clicks).toFixed(2) : '0';
  const cac = campaign.metrics.conversions > 0 ? (campaign.metrics.cost / campaign.metrics.conversions).toFixed(2) : '0';
  const convRate = campaign.metrics.impressions > 0 ? (campaign.metrics.conversions / campaign.metrics.impressions * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/marketing')} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold text-[var(--text)] ${campaign.arquivada ? 'line-through opacity-60' : ''}`}>{campaign.name}</h2>
              <span className={`badge ${statusColor[campaign.status] || 'bg-gray-500/10 text-gray-400'}`}>{campaign.status}</span>
              {campaign.arquivada && <span className="badge bg-gray-500/10 text-gray-400">Arquivada</span>}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{platformLabel[campaign.platform] || campaign.platform} • {campaign.objective}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <Edit3 size={14} /> {editing ? 'Cancelar' : 'Editar'}
          </button>
          {campaign.arquivada ? (
            <button onClick={handleUnarchive} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-emerald-400 text-xs hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5">
              <RotateCcw size={14} /> Desarquivar
            </button>
          ) : (
            <button onClick={() => setConfirmArchive(true)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-yellow-400 text-xs hover:bg-yellow-500/10 transition-colors flex items-center gap-1.5">
              <Archive size={14} /> Arquivar
            </button>
          )}
          <button className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <Copy size={14} /> Duplicar
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-red-400 text-xs hover:bg-red-500/10 transition-colors flex items-center gap-1.5">
            <Trash2 size={14} /> Deletar
          </button>
        </div>
      </div>

      {/* Confirm Archive Dialog */}
      {confirmArchive && (
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-[var(--text)]">Tem certeza? Dados serão mantidos, a campanha ficará oculta da lista principal.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmArchive(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs">Cancelar</button>
            <button onClick={handleArchive} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">Arquivar</button>
          </div>
        </div>
      )}

      {/* Info + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Informações</h3>
          {editing ? (
            <div className="space-y-3">
              <div><label className="text-xs text-[var(--text-secondary)]">Nome</label><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[var(--text-secondary)]">Status</label><select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1"><option value="active">Ativa</option><option value="paused">Pausada</option><option value="finished">Finalizada</option></select></div>
                <div><label className="text-xs text-[var(--text-secondary)]">Budget (R$/dia)</label><input type="number" value={editForm.budget_daily} onChange={e => setEditForm({ ...editForm, budget_daily: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[var(--text-secondary)]">Objetivo</label><input value={editForm.objective} onChange={e => setEditForm({ ...editForm, objective: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1" /></div>
                <div><label className="text-xs text-[var(--text-secondary)]">CPA Alvo (R$)</label><input type="number" value={editForm.target_cpa} onChange={e => setEditForm({ ...editForm, target_cpa: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[var(--text-secondary)]">Data Início</label><input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1" /></div>
                <div><label className="text-xs text-[var(--text-secondary)]">Data Fim</label><input type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-[var(--text)] mt-1" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-xs font-medium flex items-center gap-1.5"><Save size={14} /> Salvar</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-center gap-1.5"><X size={14} /> Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Plataforma', value: platformLabel[campaign.platform] || campaign.platform },
                { label: 'Objetivo', value: campaign.objective },
                { label: 'Período', value: `${campaign.start_date} ${campaign.end_date ? `à ${campaign.end_date}` : '(em andamento)'}` },
                { label: 'Budget', value: `R$ ${campaign.budget_daily}/dia` },
                { label: 'CPA Alvo', value: campaign.target_cpa ? `R$ ${campaign.target_cpa}` : '-' },
                { label: 'Início', value: campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('pt-BR') : '-' },
              ].map(info => (
                <div key={info.label} className="flex justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-[var(--text-secondary)]">{info.label}</span>
                  <span className="text-sm text-[var(--text)] font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Métricas</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Impressões', value: campaign.metrics.impressions.toLocaleString() },
              { label: 'Cliques', value: campaign.metrics.clicks.toLocaleString() },
              { label: 'CTR', value: `${campaign.metrics.ctr}%` },
              { label: 'Conversões', value: campaign.metrics.conversions.toLocaleString() },
              { label: 'Taxa de Conv.', value: `${convRate}%` },
              { label: 'Gasto Total', value: `R$ ${campaign.metrics.cost.toFixed(2)}` },
              { label: 'ROI', value: `${roi}%`, highlight: Number(roi) >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'CPM', value: `R$ ${cpm}` },
              { label: 'CPC', value: `R$ ${cpc}` },
              { label: 'CAC', value: `R$ ${cac}` },
              { label: 'ROAS', value: `${campaign.metrics.roas}x` },
              { label: 'Alcance', value: campaign.metrics.reach ? campaign.metrics.reach.toLocaleString() : '-' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-[var(--text-secondary)]">{m.label}</p>
                <p className={`text-lg font-bold ${m.highlight || 'text-[var(--text)]'}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Bot size={18} className="text-blue-400" /> IA Analisa Esta Campanha
          </h3>
          <button
            onClick={handleAiAnalyze}
            disabled={aiLoading}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
            {aiLoading ? 'Analisando...' : 'Analisar com IA'}
          </button>
        </div>
        {aiAnalysis ? (
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Clique em "Analisar com IA" para obter recomendações específicas para esta campanha, considerando também campanhas arquivadas para comparação.</p>
        )}
      </div>
    </div>
  );
}

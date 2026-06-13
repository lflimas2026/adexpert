import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Bot, KeyRound } from 'lucide-react';
import { api } from '../services/api';

const platformIcons: Record<string, string> = { meta: '📱', google: '🔍', tiktok: '🎵' };

export default function Integrations() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getIntegrations().then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text)]">Integrações & Configurações de IA</h2>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text)]">Plataformas de Anúncios</h3>
        {data.accounts.map((acc: any) => (
          <div key={acc.id} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platformIcons[acc.platform] || '🔗'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[var(--text)]">{acc.platform === 'meta' ? 'Meta Ads' : acc.platform === 'google' ? 'Google Ads' : 'TikTok Ads'}</h4>
                    {acc.is_active ? <span className="badge bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> Conectado</span> : <span className="badge bg-red-500/10 text-red-400 flex items-center gap-1"><XCircle size={10} /> Desconectado</span>}
                      {acc.api_configured && <span className="badge bg-blue-500/10 text-blue-400 flex items-center gap-1"><KeyRound size={10} /> API Key configurada</span>}
                  </div>
                  {acc.account_name && <p className="text-xs text-[var(--text-secondary)] mt-0.5">Conta: {acc.account_name}</p>}
                  {acc.is_active && <p className="text-xs text-[var(--text-secondary)]">Permissões: {acc.permissions} | Última sincronização: {acc.last_synced ? new Date(acc.last_synced).toLocaleTimeString('pt-BR') : '-'}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                {acc.is_active ? (
                  <>
                    <button className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-white/5 transition-colors">Reconectar</button>
                    <button className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-red-400 text-xs hover:bg-red-500/10 transition-colors">Desconectar</button>
                  </>
                ) : (
                  <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors">Conectar Agora</button>
                )}
              </div>
            </div>
            {acc.stats && (
              <div className="mt-4 flex gap-4 text-xs text-[var(--text-secondary)]">
                <span>📊 {acc.stats.campaigns} campanhas</span>
                <span>📊 {acc.stats.audiences || acc.stats.keywords} {acc.stats.audiences ? 'públicos' : 'keywords'}</span>
                {acc.stats.creatives && <span>📊 {acc.stats.creatives} criativos</span>}
                <span>📊 Métricas: {acc.stats.metrics_days} dias</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Configurações de IA</h3>
        <div className="space-y-3">
          {data.aiConfigs.map((ai: any) => (
            <div key={ai.id} className={`p-4 rounded-lg ${ai.is_primary ? 'border border-primary-500/20 bg-primary-500/5' : 'bg-white/5'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Bot size={24} className={ai.provider === 'gemini' ? 'text-blue-400' : ai.provider === 'claude' ? 'text-amber-400' : 'text-emerald-400'} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[var(--text)] capitalize">{ai.provider} {ai.provider === 'gemini' ? '(Google)' : ai.provider === 'claude' ? '(Anthropic)' : ''}</h4>
                      {ai.is_primary && <span className="badge bg-primary-500/10 text-primary-400">Principal</span>}
                      <span className={`badge ${ai.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{ai.status === 'active' ? 'Ativo' : 'Desconectado'}</span>
                      {ai.api_configured && <span className="badge bg-blue-500/10 text-blue-400 flex items-center gap-1"><KeyRound size={10} /> API Key configurada</span>}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {ai.provider === 'gemini' && '"Análise multimodal rápida e integração nativa com Google Cloud"'}
                      {ai.provider === 'claude' && '"Excelente análise estratégica e explicações detalhadas"'}
                      {ai.provider === 'deepseek' && '"Eficiente e rápido para análises de volume alto"'}
                    </p>
                  </div>
                </div>
                {ai.status === 'active' ? (
                  <div className="text-right text-xs text-[var(--text-secondary)]">
                    <p>{ai.tokens_used_this_month} requisições este mês</p>
                    {ai.last_analyses && <p>Tempo médio: {ai.last_analyses.avg_time}s</p>}
                  </div>
                ) : (
                  <button className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors">Conectar</button>
                )}
              </div>
              {ai.status === 'active' && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">Modelo:</span>
                  <select className="text-xs bg-white/5 border border-[var(--border)] rounded-lg px-2 py-1 text-[var(--text)]">
                    {ai.models?.map((m: string) => <option key={m} selected={m === ai.selected_model}>{m}</option>)}
                  </select>
                  <button className="px-3 py-1 rounded-lg bg-white/5 text-xs text-[var(--text-secondary)] hover:bg-white/10 transition-colors">Testar Conexão</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Preferências de Análise</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text)] mb-2">Aggressiveness (Quão ousado é o conselheiro)</p>
            <div className="space-y-2">
              {[
                { value: 'conservative', label: 'Conservative (95% confiança)', desc: 'Só recomenda mudanças muito seguras' },
                { value: 'balanced', label: 'Balanced (80% confiança)', desc: 'Recomenda mudanças bem fundamentadas' },
                { value: 'aggressive', label: 'Aggressive (60% confiança)', desc: 'Testa coisas novas rapidamente' }
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input type="radio" name="aggressiveness" defaultChecked={data.preferences.aggressiveness === opt.value} className="text-primary-500" />
                  <div>
                    <p className="text-sm text-[var(--text)]">{opt.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <input type="checkbox" defaultChecked={data.preferences.auto_implement} className="rounded text-primary-500" />
            <div>
              <p className="text-sm text-[var(--text)]">Autorizar IA a implementar mudanças automaticamente</p>
              <p className="text-xs text-[var(--text-secondary)]">Você receberá alerta antes + confirmação</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-[var(--text)] mb-2">Tipo de Recomendações</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'critical_alerts', label: 'Alertas críticos (ROAS < 1)' },
                { key: 'opportunities', label: 'Oportunidades (ROAS > 3)' },
                { key: 'optimizations', label: 'Otimizações menores (eficiência)' },
                { key: 'experimental', label: 'Testes experimentais' }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" defaultChecked={(data.preferences.recommendation_types || {})[opt.key]} className="rounded text-primary-500" />
                  <span className="text-sm text-[var(--text)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-[var(--text)]">Frequência de Análise</span>
            <select className="text-sm bg-white/5 border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--text)]">
              <option selected>A cada 30 minutos</option>
              <option>A cada 1 hora</option>
              <option>A cada 6 horas</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <span className="text-sm text-[var(--text)]">Webhook (para seu servidor)</span>
            <input type="text" defaultValue={data.preferences.webhook_url} className="text-sm bg-white/5 border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--text)] w-72" />
          </div>
        </div>
      </div>
    </div>
  );
}

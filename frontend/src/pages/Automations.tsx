import { useEffect, useState } from 'react';
import { Zap, PauseCircle, TrendingUp, RefreshCw, Trash2, Shield, Bell, Clock, History } from 'lucide-react';
import { api } from '../services/api';

export default function Automations() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getActionLogs().then(setLogs);
  }, []);

  const automationRules = [
    { icon: <PauseCircle size={18} />, title: 'Auto-pause se ROAS < 1.2 por 24h', desc: 'Critério: ROAS consistentemente baixo. Ação: Pausa automaticamente.', enabled: true },
    { icon: <TrendingUp size={18} />, title: 'Auto-increase se ROAS > 2.5 por 48h', desc: 'Aumento: +20% do budget diário. Máx: R$ 200/dia.', enabled: true },
    { icon: <RefreshCw size={18} />, title: 'Auto-rotate creative se frequência > 3', desc: 'Pausa criativo por 7 dias. Evita creative fatigue.', enabled: true },
    { icon: <Trash2 size={18} />, title: 'Auto-remove zero-conversion audiences', desc: 'Se público tem > 50 cliques e 0 conversões, remove automaticamente.', enabled: true },
  ];

  const alertTypes = [
    { label: 'ROAS cai mais de 20% em 2h', enabled: true },
    { label: 'Frequência ultrapassa 4', enabled: true },
    { label: 'CPM sobe mais de 30% vs semana anterior', enabled: true },
    { label: 'Conversão zera por 3h', enabled: true },
    { label: 'CTR baixo (< 0.8%)', enabled: false },
    { label: 'Budget previsto dura menos de 3 dias', enabled: false },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text)]">Automações Inteligentes</h2>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Pausar/Aumentar Orçamento</h3>
        <div className="space-y-3">
          {automationRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 flex-shrink-0">{rule.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text)]">{rule.title}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={rule.enabled} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2"><Shield size={16} className="text-primary-400" /> Limites de Segurança</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm text-[var(--text)]">Budget máximo por campanha/dia</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">R$</span>
                <input type="number" defaultValue={500} className="w-20 text-sm bg-white/5 border border-[var(--border)] rounded-lg px-2 py-1 text-[var(--text)]" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm text-[var(--text)]">Máximo de aumento por vez</span>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={50} className="w-20 text-sm bg-white/5 border border-[var(--border)] rounded-lg px-2 py-1 text-[var(--text)]" />
                <span className="text-xs text-[var(--text-secondary)]">%</span>
              </div>
            </div>
            <div className="space-y-2 p-3 rounded-lg bg-white/5">
              <p className="text-sm text-[var(--text)] mb-2">Exigir aprovação antes de implementar:</p>
              <label className="flex items-center gap-2 text-sm text-[var(--text)]"><input type="checkbox" defaultChecked className="rounded text-primary-500" /> Quando ROAS &lt; 1 (pausar)</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text)]"><input type="checkbox" className="rounded text-primary-500" /> Quando ROAS &gt; 3 (aumentar)</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text)]"><input type="checkbox" className="rounded text-primary-500" /> Tudo (mais seguro, mas mais lento)</label>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2"><Bell size={16} className="text-amber-400" /> Alertas Customizados</h3>
          <div className="space-y-2">
            {alertTypes.map((alert, i) => (
              <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <input type="checkbox" defaultChecked={alert.enabled} className="rounded text-primary-500" />
                <span className="text-sm text-[var(--text)]">{alert.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white/5">
            <p className="text-sm text-[var(--text)] mb-2">Método de Notificação</p>
            <div className="space-y-1">
              {['Push in-app', 'Email', 'SMS (apenas críticos)', 'Slack / Discord webhook'].map((m, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input type="checkbox" defaultChecked={i !== 2} className="rounded text-primary-500" />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2"><History size={16} className="text-primary-400" /> Audit Log (Histórico de Ações)</h3>
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="p-3 rounded-lg bg-white/5 text-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                  <span className={`badge ${log.implemented_by === 'ai_auto' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary-500/10 text-primary-400'}`}>
                    {log.implemented_by === 'ai_auto' ? 'Auto' : 'Manual'}
                  </span>
                  <span className="badge bg-white/10 text-[var(--text-secondary)]">{log.action_type === 'pause' ? 'Pause' : '↑Bid'}</span>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">{log.campaign_name}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{log.reason}</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-emerald-400">{log.impact_expected}</span>
                <span className="text-[var(--text-secondary)]">| Impacto real: {log.impact_actual}</span>
                <button className="text-primary-400 hover:underline">Desfazer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

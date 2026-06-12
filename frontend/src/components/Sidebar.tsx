import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, PieChart, Settings, MessageSquare, History, Bot, Zap } from 'lucide-react';

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plataforma/meta', icon: BarChart3, label: 'Meta Ads' },
  { to: '/plataforma/google', icon: BarChart3, label: 'Google Ads' },
  { to: '/plataforma/tiktok', icon: BarChart3, label: 'TikTok Ads' },
  { to: '/comparador', icon: PieChart, label: 'Comparador' },
  { to: '/integracoes', icon: Settings, label: 'Integrações & IA' },
  { to: '/automacoes', icon: Zap, label: 'Automações' },
  { to: '/chat', icon: MessageSquare, label: 'Chat Expert' },
  { to: '/historico', icon: History, label: 'Histórico' },
];

export default function Sidebar() {
  return (
    <aside style={{ background: 'var(--sidebar)' }} className="fixed left-0 top-0 h-screen w-64 border-r border-[var(--border)] z-50 flex flex-col">
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm">A</div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text)]">AdExpert</h1>
            <p className="text-[10px] text-[var(--text-secondary)]">Consultor IA 24/7</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text)]'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Bot size={14} />
          <span>Claude Sonnet ativo</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto" />
        </div>
      </div>
    </aside>
  );
}

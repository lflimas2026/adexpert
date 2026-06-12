import { Sun, Moon, Bell, User, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="fixed top-0 left-64 right-0 h-16 border-b flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">AdExpert Dashboard</h2>
        <span className="text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-1 rounded-md">última atualização: há 5 min</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors"><RefreshCw size={18} /></button>
        <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
            <User size={16} />
          </div>
          <div className="text-sm">
            <p className="text-[var(--text)] font-medium">Fernando</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Profissional</p>
          </div>
        </div>
      </div>
    </header>
  );
}

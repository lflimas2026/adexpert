import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  change?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ label, value, change, icon, trend }: Props) {
  const trendColors = { up: 'text-emerald-400', down: 'text-red-400', neutral: 'text-[var(--text-secondary)]' };
  return (
    <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-4 card-gradient">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
      {change && <p className={`text-xs mt-1 ${trend ? trendColors[trend] : 'text-[var(--text-secondary)]'}`}>{change}</p>}
    </div>
  );
}

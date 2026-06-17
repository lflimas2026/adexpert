import { Bot } from 'lucide-react';

interface AICoachBoxProps {
  message: string;
  confidence?: number;
}

export default function AICoachBox({ message, confidence }: AICoachBoxProps) {
  return (
    <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary-400">IA Coach</span>
            {confidence && (
              <span className="text-[10px] text-[var(--text-secondary)] bg-white/5 px-1.5 py-0.5 rounded">
                {confidence}% confiança
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text)] leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}

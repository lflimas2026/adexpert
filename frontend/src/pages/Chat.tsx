import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Oi! Sou seu consultor de tráfego pago. Analisei suas campanhas e tenho 3 recomendações importantes. Quer ouvir?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const res = await api.chat(userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={20} className="text-amber-400" />
        <h2 className="text-lg font-bold text-[var(--text)]">Chat com Expert (IA Consultant)</h2>
        <span className="text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-1 rounded-md">Powered by Gemini 2.5 Flash</span>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="flex-1 border rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary-500/20 text-primary-400'}`}>
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[75%] rounded-xl p-3 text-sm leading-relaxed ${
                msg.role === 'assistant' ? 'bg-white/5 text-[var(--text)]' : 'bg-primary-500/20 text-primary-100'
              }`}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={line.startsWith('#') ? 'font-bold mt-2 first:mt-0' : ''}>
                    {line.startsWith('#') ? line.replace(/^#+\s*/, '') : line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Bot size={16} /></div>
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm text-[var(--text-secondary)]">Analisando...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ borderColor: 'var(--border)' }} className="border-t p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Digite sua pergunta sobre campanhas..."
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-secondary)] outline-none focus:border-primary-500/50 transition-colors"
            />
            <button onClick={send} disabled={loading || !input.trim()} className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

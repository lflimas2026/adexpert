import { useState, useEffect } from 'react';
import { AlertCircle, Save, RefreshCw } from 'lucide-react';

export default function DocsEditor() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar arquivo ao abrir
  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/docs/app-docs.txt');
      if (!response.ok) throw new Error('Não foi possível carregar');
      const text = await response.text();
      setContent(text);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar documentação' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/docs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Documentação salva com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erro ao salvar documentação' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] gap-2">
        <RefreshCw className="animate-spin text-primary-500" size={18} />
        Carregando...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-[var(--text)]">📚 Editor de Documentação</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Edite a documentação do projeto aqui. Este arquivo será lido por qualquer IA que trabalhar no projeto.
        </p>
      </div>

      <div 
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        className="border rounded-xl p-4 flex gap-2 items-start"
      >
        <AlertCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text)]">Dica:</strong> Atualize este arquivo sempre que implementar features, novos endpoints ou mudanças relevantes.
        </p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-[550px] p-4 bg-white/5 border border-[var(--border)] rounded-xl font-mono text-xs text-[var(--text)] focus:outline-none focus:border-primary-500/50 leading-relaxed resize-none scrollbar-thin"
        placeholder="Documentação do projeto..."
      />

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Documentação'}
        </button>
        
        <button
          onClick={loadDocs}
          className="px-5 py-2.5 border border-[var(--border)] hover:bg-white/5 text-[var(--text)] rounded-xl text-xs font-semibold transition-all active:scale-95"
        >
          Recarregar
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

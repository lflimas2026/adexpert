import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Upload, Image, X, Search, Bot, Loader2, CheckCircle2, Target, Users, Palette, DollarSign, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useCampaignWizard } from '../context/CampaignWizardContext';
import { CreativeFile } from '../types';
import AICoachBox from '../components/AICoachBox';

const BRAZILIAN_STATES = [
  'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Distrito Federal',
  'Paraná', 'Santa Catarina', 'Rio Grande do Sul', 'Bahia',
  'Pernambuco', 'Ceará', 'Goiás', 'Espírito Santo'
];

export default function CampaignNew() {
  const navigate = useNavigate();
  const { campaignData, updateCampaignData, creatives, addCreative, removeCreative, setAiRecommendations, aiRecommendations } = useCampaignWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockQuery, setStockQuery] = useState('');
  const [stockImages, setStockImages] = useState<{ id: string; url: string; name: string }[]>([]);
  const [searchingStock, setSearchingStock] = useState(false);

  const handleDescriptionChange = (val: string) => updateCampaignData({ description: val });
  const handleNicheChange = (val: string) => updateCampaignData({ niche: val });
  const handlePriceChange = (val: number) => {
    const data: Partial<typeof campaignData> = { price: val };
    if (val > 0 && campaignData.margin > 0) {
      data.cac_ideal = Math.round(val * (campaignData.margin / 100) * 0.25);
    }
    updateCampaignData(data);
  };
  const handleMarginChange = (val: number) => {
    const data: Partial<typeof campaignData> = { margin: val };
    if (campaignData.price > 0 && val > 0) {
      data.cac_ideal = Math.round(campaignData.price * (val / 100) * 0.25);
    }
    updateCampaignData(data);
  };

  const toggleLocation = (loc: string) => {
    const curr = campaignData.target_location;
    const next = curr.includes(loc) ? curr.filter(l => l !== loc) : [...curr, loc];
    updateCampaignData({ target_location: next });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !campaignData.target_audience.includes(t)) {
      updateCampaignData({ target_audience: [...campaignData.target_audience, t] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) =>
    updateCampaignData({ target_audience: campaignData.target_audience.filter(t => t !== tag) });

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - creatives.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        if (isVideo) {
          addCreative({
            id: `cr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: file.name,
            type: 'video',
            dimensions: '1080x1920',
            size: (file.size / (1024 * 1024)).toFixed(1) + 'MB',
            file,
            preview,
          });
        } else {
          const img = document.createElement('img');
          img.onload = () => {
            addCreative({
              id: `cr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              name: file.name,
              type: 'image',
              dimensions: `${img.width}x${img.height}`,
              size: (file.size / (1024 * 1024)).toFixed(1) + 'MB',
              file,
              preview,
            });
          };
          img.src = preview;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const searchStockPhotos = async () => {
    if (!stockQuery.trim()) return;
    setSearchingStock(true);
    await new Promise(r => setTimeout(r, 800));
    const results = [
      { id: 's1', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', name: 'Camiseta branca modelo' },
      { id: 's2', url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', name: 'Camiseta azul modelo' },
      { id: 's3', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400', name: 'Camiseta estilo casual' },
      { id: 's4', url: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400', name: 'Moda masculina' },
      { id: 's5', url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400', name: 'Roupa premium' },
      { id: 's6', url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400', name: 'Produto em destaque' },
    ];
    setStockImages(results);
    setSearchingStock(false);
  };

  const addStockImage = (item: { id: string; url: string; name: string }) => {
    if (creatives.length >= 5) return;
    addCreative({
      id: `stock_${item.id}_${Date.now()}`,
      name: item.name,
      type: 'image',
      dimensions: '1200x628',
      size: '~250KB',
      file: new File([], item.name),
      preview: item.url,
    });
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalyzeProgress(0);
    const interval = setInterval(() => {
      setAnalyzeProgress(p => Math.min(p + 10, 90));
    }, 500);
    try {
      const result = await api.analyzeCampaign({
        description: campaignData.description,
        niche: campaignData.niche,
        price: campaignData.price,
        margin: campaignData.margin,
        target_location: campaignData.target_location,
        creatives: creatives.map(c => ({ name: c.name, type: c.type, dimensions: c.dimensions })),
      });
      setAnalyzeProgress(100);
      await new Promise(r => setTimeout(r, 500));
      setAiRecommendations(result);
      setAnalysisDone(true);
    } catch {
      setAnalyzeProgress(100);
      await new Promise(r => setTimeout(r, 500));
      const fallback = {
        objective: { value: 'conversions', confidence: 92, reason: `Você tem preço claro (R$ ${campaignData.price || 'XXX'}) e quer vendas diretas. Conversões é o objetivo mais eficiente.` },
        audience: { demographics: `Homens 25-45 em ${campaignData.target_location.slice(0, 2).join(', ') || 'São Paulo, Rio de Janeiro'}`, size: '2.4M pessoas', confidence: 88, reason: 'Baseado no seu nicho e localização, este é seu público ideal.' },
        creative: { name: creatives.find(c => c.type === 'video')?.name || creatives[0]?.name || 'criativo_principal', ctr: creatives.some(c => c.type === 'video') ? '2.4%' : '1.8%', confidence: 95, reason: `${creatives.some(c => c.type === 'video') ? 'Video tem 40% mais CTR que imagem. Formato vertical perfeito para Stories/Reels.' : 'Imagem limpa com bom enquadramento.'}` },
        budget: { daily: 'R$ 50-100', duration: '7 dias', confidence: 87, reason: `Com CAC ideal R$ ${campaignData.cac_ideal || '30'}, começar com R$ 50/dia permite testar + iterar rápido.`, roi: '+175-310%' },
        name_suggestions: ['Campanha-Conv-Jul24', 'Verao-Conversao-Masculino', 'Premium-Tshirt-Sales-July'],
      };
      setAiRecommendations(fallback);
      setAnalysisDone(true);
    }
    clearInterval(interval);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <Target size={20} className="text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">Criar Nova Campanha - Análise Inicial</h2>
          <p className="text-sm text-[var(--text-secondary)]">Passo 1 de 3: Descreva sua campanha</p>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
          <Sparkles size={16} className="text-primary-400" />
          Descrição da Campanha
        </h3>

        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">O que você quer vender/promover? *</label>
          <textarea
            value={campaignData.description}
            onChange={e => handleDescriptionChange(e.target.value)}
            placeholder="Ex: Vender camisetas premium masculinas 100% algodão. Foco em público de SP e RJ, idade 25-45, que valorizam qualidade..."
            className="w-full h-28 px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500 resize-none transition-colors"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--text-secondary)]">Mínimo 50 caracteres</span>
            <span className={`text-[10px] ${campaignData.description.length < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{campaignData.description.length}/50</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Nicho/Categoria</label>
            <input
              value={campaignData.niche}
              onChange={e => handleNicheChange(e.target.value)}
              placeholder="Ex: Moda Masculina"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Preço do produto (R$)</label>
            <input
              type="number"
              value={campaignData.price || ''}
              onChange={e => handlePriceChange(Number(e.target.value))}
              placeholder="120"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Margem de lucro (%)</label>
            <input
              type="number"
              value={campaignData.margin || ''}
              onChange={e => handleMarginChange(Number(e.target.value))}
              placeholder="40"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
            />
            {campaignData.margin > 0 && campaignData.price > 0 && (
              <p className="text-[10px] text-primary-400 mt-1">Com margem de {campaignData.margin}%, CAC ideal: R$ {campaignData.cac_ideal}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Localização alvo</label>
            <div className="relative">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {campaignData.target_location.map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 text-[10px] font-medium">
                    {loc}
                    <button onClick={() => toggleLocation(loc)} className="hover:text-white"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <select
                onChange={e => { if (e.target.value) { toggleLocation(e.target.value); e.target.value = ''; } }}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
              >
                <option value="">Selecione estados...</option>
                {BRAZILIAN_STATES.map(s => (
                  <option key={s} value={s} disabled={campaignData.target_location.includes(s)}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Público específico (tags de interesse)</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {campaignData.target_audience.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-medium">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="Digite um interesse e pressione Enter"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
            />
            <button onClick={addTag} className="px-3 py-2 rounded-lg bg-primary-500/10 text-primary-400 text-sm hover:bg-primary-500/20 transition-colors">Adicionar</button>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
          <Image size={16} className="text-primary-400" />
          Upload de Criativos
          <span className="text-[10px] text-[var(--text-secondary)] font-normal ml-auto">{creatives.length}/5 criativos</span>
        </h3>

        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
          style={{ minHeight: '200px' }}
        >
          <Upload size={32} className="mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Arraste seus arquivos aqui ou clique para selecionar</p>
          <p className="text-[10px] text-[var(--text-secondary)]">JPG, PNG, MP4, MOV · Máx 50MB por arquivo · Máx 5 criativos</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,video/mp4,video/quicktime"
            onChange={e => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
            <Upload size={14} /> + Adicionar Criativo
          </button>
          <button onClick={() => setShowStockModal(true)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
            <Search size={14} /> Stock Photo
          </button>
        </div>

        {creatives.length > 0 && (
          <div className="space-y-2">
            {creatives.map(cr => (
              <div key={cr.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[var(--border)]">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {cr.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-primary-500/10">
                      <span className="text-[10px] text-primary-400">▶</span>
                    </div>
                  ) : (
                    <img src={cr.preview} alt={cr.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text)] truncate">{cr.name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                    <span>{cr.type === 'image' ? 'Imagem' : 'Vídeo'}</span>
                    <span>{cr.dimensions}</span>
                    <span>{cr.size}</span>
                  </div>
                </div>
                <button onClick={() => removeCreative(cr.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
          <Bot size={16} className="text-primary-400" />
          Análise com IA
        </h3>

        {!analysisDone && (
          <button
            onClick={runAnalysis}
            disabled={analyzing || campaignData.description.length < 50}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <><Loader2 size={18} className="animate-spin" /> Analisando...</>
            ) : (
              <><Bot size={18} /> 🚀 Analisar com IA</>
            )}
          </button>
        )}

        {analyzing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text)]">
              <Loader2 size={16} className="animate-spin text-primary-400" />
              <span>🤖 Analisando seus criativos...</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">⏳ Isso leva ~5-10 segundos</p>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-300"
                style={{ width: `${analyzeProgress}%` }}
              />
            </div>
          </div>
        )}

        {analysisDone && aiRecommendations && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Análise Concluída!</span>
            </div>

            <AICoachBox
              message={`Analisei sua campanha para ${campaignData.description.split('.')[0] || 'seu produto'}. Baseado nos dados fornecidos, aqui estão minhas recomendações iniciais com confiança acima de 85%.`}
              confidence={92}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-primary-400" />
                  <span className="text-xs font-semibold text-[var(--text)]">Objetivo: {aiRecommendations.objective.value.toUpperCase()}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${aiRecommendations.objective.confidence >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {aiRecommendations.objective.confidence}% confiança
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{aiRecommendations.objective.reason}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-primary-400" />
                  <span className="text-xs font-semibold text-[var(--text)]">Público: {aiRecommendations.audience.demographics}</span>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">{aiRecommendations.audience.size}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${aiRecommendations.audience.confidence >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {aiRecommendations.audience.confidence}% confiança
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{aiRecommendations.audience.reason}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Palette size={16} className="text-primary-400" />
                  <span className="text-xs font-semibold text-[var(--text)]">Principal: {aiRecommendations.creative.name}</span>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">CTR Estimado: {aiRecommendations.creative.ctr}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${aiRecommendations.creative.confidence >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {aiRecommendations.creative.confidence}% confiança
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{aiRecommendations.creative.reason}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-primary-400" />
                  <span className="text-xs font-semibold text-[var(--text)]">Orçamento: {aiRecommendations.budget.daily}/dia</span>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">Duração: {aiRecommendations.budget.duration}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${aiRecommendations.budget.confidence >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {aiRecommendations.budget.confidence}% confiança
                </span>
                <p className="text-xs text-emerald-400 mt-1 font-medium">ROI Estimado: {aiRecommendations.budget.roi}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{aiRecommendations.budget.reason}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/app/campaign/wizard/1')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-all"
              >
                ➜ Próximo: Configurar Campanha no Wizard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStockModal(false)}>
          <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6 w-full max-w-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text)]">Stock Photos</h3>
              <button onClick={() => setShowStockModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]"><X size={18} /></button>
            </div>
            <div className="flex gap-2">
              <input
                value={stockQuery}
                onChange={e => setStockQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStockPhotos()}
                placeholder="Pesquisar imagens..."
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
              />
              <button onClick={searchStockPhotos} disabled={searchingStock} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
                {searchingStock ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {stockImages.map(item => (
                <div key={item.id} className="relative group rounded-lg overflow-hidden bg-white/5 border border-[var(--border)]">
                  <img src={item.url} alt={item.name} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { addStockImage(item); setShowStockModal(false); }}
                      disabled={creatives.length >= 5}
                      className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      + Usar
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] p-1.5 truncate">{item.name}</p>
                </div>
              ))}
              {!searchingStock && stockImages.length === 0 && (
                <p className="col-span-3 text-center text-sm text-[var(--text-secondary)] py-8">Pesquise por imagens de stock</p>
              )}
              {searchingStock && (
                <div className="col-span-3 flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

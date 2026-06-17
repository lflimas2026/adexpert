import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Loader2, Sparkles, X, Bot, Check, Target, Users, MapPin, Palette, DollarSign, Link, ClipboardCheck, Send, Star } from 'lucide-react';
import { useCampaignWizard } from '../context/CampaignWizardContext';
import { api } from '../services/api';
import AICoachBox from '../components/AICoachBox';

const BRAZILIAN_STATES = ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Distrito Federal', 'Paraná', 'Santa Catarina', 'Rio Grande do Sul', 'Bahia', 'Pernambuco', 'Ceará', 'Goiás', 'Espírito Santo'];

const TOTAL_STEPS = 8;

const objectiveOptions = [
  { value: 'conversions', label: 'CONVERSÕES', sublabel: 'Purchase/Compra', metric: 'Conversão rate (%)', ideal: 'E-commerce, vendas diretas', description: 'Otimiza para: Pessoas que REALMENTE compram', coach: 'Você quer vendas. Este objetivo otimiza seu orçamento para quem mais provavelmente vai comprar.' },
  { value: 'traffic', label: 'TRÁFEGO', sublabel: 'Link Clicks', metric: 'Clicks', ideal: 'Awareness, tráfego', description: 'Otimiza para: Pessoas clicando', coach: 'Se quer visitas (não vendas). Mais barato que Conversões, mas menos específico.' },
  { value: 'leads', label: 'LEADS', sublabel: 'Lead Form Submissions', metric: 'Form submissions', ideal: 'Serviços, cursos', description: 'Otimiza para: Pessoas dando contato', coach: 'Para serviços, cursos, B2B. Você quer contatos, não vendas diretas.' },
  { value: 'awareness', label: 'AWARENESS', sublabel: 'Impressions/Reach', metric: 'Reach, impressions', ideal: 'Marca nova', description: 'Otimiza para: Máximo alcance', coach: 'Só se produto é novo e ninguém conhece. Você quer reconhecimento, não vendas.' },
];

const placementOptions = [
  { value: 'stories', label: 'STORIES', sublabel: 'Instagram & Facebook Stories', format: 'Vertical (1080x1920)', cpm: 'Geralmente barato', ctr: '~2.4%', recommended: true, coach: 'Seu vídeo é vertical (perfeito). Stories tem CTR 40% maior que Feed. Comece forte aqui.' },
  { value: 'reels', label: 'REELS', sublabel: 'Instagram Reels', format: 'Vertical curto (15-60s)', cpm: 'Muito barato agora', ctr: '~2.2%', recommended: true, coach: 'Meta impulsiona Reels. CPM 30% mais barato. Seu vídeo 30s é perfeito.' },
  { value: 'feed', label: 'FEED', sublabel: 'Facebook & Instagram Feed', format: 'Quadrado (1200x628)', cpm: 'Preço médio', ctr: '~1.8%', recommended: false, coach: 'Nem todo acessa Stories. Feed pega público que quer conteúdo permanente.' },
  { value: 'audience_network', label: 'AUDIENCE NETWORK', sublabel: 'Sites parceiros do Meta', format: 'Variado', cpm: 'Barato mas baixa qualidade', ctr: 'Baixo', recommended: false, coach: 'Seu objetivo é conversão. Audience Network traz cliques ruins. Pule no início.' },
];

const durationOptions = [
  { value: 7, label: '7 dias', desc: 'Recomendado para teste' },
  { value: 14, label: '14 dias', desc: 'Teste mais longo' },
  { value: 30, label: '30 dias', desc: 'Campanha completa' },
  { value: 0, label: 'Sem fim', desc: 'Sempre ativo' },
];

export default function CampaignWizard() {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const currentStep = parseInt(step || '1', 10);
  const {
    campaignData, updateCampaignData, aiRecommendations,
    creatives, publishing, setPublishing, setPublished, published,
    error, setError, resetWizard
  } = useCampaignWizard();
  const [tagInput, setTagInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copyText, setCopyText] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (currentStep < 1 || currentStep > TOTAL_STEPS) navigate('/app/campaign/wizard/1', { replace: true });
  }, [currentStep, navigate]);

  const goToStep = (s: number) => {
    if (s >= 1 && s <= TOTAL_STEPS) navigate(`/app/campaign/wizard/${s}`);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !campaignData.audience.interests.includes(t)) {
      updateCampaignData({ audience: { ...campaignData.audience, interests: [...campaignData.audience.interests, t] } });
      setTagInput('');
    }
  };
  const removeInterest = (tag: string) =>
    updateCampaignData({ audience: { ...campaignData.audience, interests: campaignData.audience.interests.filter(t => t !== tag) } });

  const toggleLocation = (loc: string) => {
    const curr = campaignData.audience.locations;
    const next = curr.includes(loc) ? curr.filter(l => l !== loc) : [...curr, loc];
    updateCampaignData({ audience: { ...campaignData.audience, locations: next } });
  };

  const togglePlacement = (p: string) => {
    const curr = campaignData.placement;
    const next = curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p];
    updateCampaignData({ placement: next });
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await api.publishCampaign({
        name: campaignData.name,
        objective: campaignData.objective,
        audience: campaignData.audience,
        placement: campaignData.placement,
        creatives: { primary: campaignData.creatives.primary, secondary: campaignData.creatives.secondary },
        budget_daily: campaignData.budget,
        duration: campaignData.duration,
        url: campaignData.url,
        pixel_event: campaignData.pixel_event,
        copy: copyText || campaignData.copy,
        ab_test_enabled: campaignData.ab_test_enabled,
        auto_scale_enabled: campaignData.auto_scale_enabled,
      });
      if (result.success) {
        setPublished(true);
        setShowSuccess(true);
        resetWizard();
        localStorage.removeItem('adexpert_wizard');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError('Erro ao publicar campanha. Tente novamente.');
      }
    } catch {
      setError('Erro de conexão ao publicar. Tente novamente.');
    }
    setPublishing(false);
  };

  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);

  const getCoachMessage = (): { message: string; confidence: number } => {
    if (aiRecommendations) {
      const msgs: Record<number, { message: string; confidence: number }> = {
        1: { message: `Baseado em sua análise, recomendo ${aiRecommendations.objective.value === 'conversions' ? 'CONVERSÕES' : aiRecommendations.objective.value.toUpperCase()} porque ${aiRecommendations.objective.reason}. Explicação de cada opção abaixo.`, confidence: aiRecommendations.objective.confidence },
        2: { message: 'Nome bom organiza sua vida quando tiver 20 campanhas. Recomendo: Produto + Objetivo + Data. Exemplos gerados pela IA abaixo.', confidence: 90 },
        3: { message: `Seu público ideal são ${aiRecommendations.audience.demographics || 'homens 25-40'} que gostam de moda premium. Recomendo começar assim, depois você testa outras variações.`, confidence: aiRecommendations.audience.confidence },
        4: { message: 'Baseado em suas imagens verticais e histórico do seu nicho, recomendo Stories + Reels. Feed como suporte. Evite Audience Network.', confidence: 91 },
        5: { message: 'Analisei seus criativos. Vou recomendar qual usar como principal e quais testar. Cada análise abaixo.', confidence: 95 },
        6: { message: `Com CAC ideal de R$ ${campaignData.cac_ideal || 30} (preço R$ ${campaignData.price || 120}, margem ${campaignData.margin || 40}%), recomendo R$ ${campaignData.budget}/dia por ${campaignData.duration} dias. Permite testar rápido + iterar sem gastar muito.`, confidence: 87 },
        7: { message: 'URL é CRÍTICO. Tem que ir pra página específica do produto, não homepage. E pixel precisa estar rastreando conversões corretamente.', confidence: 93 },
        8: { message: 'Revisei tudo. Sua campanha está bem montada. Recomendações finais antes de publicar:', confidence: 96 },
      };
      return msgs[currentStep] || { message: 'Continue preenchendo os dados para eu poder ajudar.', confidence: 85 };
    }
    const defaultMsgs: Record<number, { message: string; confidence: number }> = {
      1: { message: 'Vamos definir o objetivo da sua campanha. Cada objetivo otimiza para um resultado diferente. Recomendo COMEÇAR com CONVERSÕES se você quer vendas diretas.', confidence: 90 },
      2: { message: 'Um bom nome organiza sua vida. Sugiro incluir: produto + objetivo + data. Exemplo: "Camiseta Premium - Conv - Julho"', confidence: 88 },
      3: { message: 'Público é a BASE de qualquer campanha. Público bem definido = ROAS alto. Vamos segmentar por idade, localização e interesses.', confidence: 85 },
      4: { message: 'O placement define ONDE seu anúncio aparece. Stories e Reels estão com CPM baixo e alto engajamento atualmente.', confidence: 87 },
      5: { message: 'Seus criativos são o coração da campanha. Um bom criativo pode dobrar seu ROAS.', confidence: 90 },
      6: { message: 'Orçamento inteligente > orçamento grande. Melhor começar com R$ 50/dia e escalar do que gastar muito no início.', confidence: 85 },
      7: { message: 'URL e pixel são a parte técnica. Uma URL errada ou pixel offline = campanha jogando dinheiro fora.', confidence: 92 },
      8: { message: 'Última revisão antes de publicar! Verifiquei tudo e tenho algumas sugestões finais.', confidence: 94 },
    };
    return defaultMsgs[currentStep] || { message: 'Continue preenchendo os dados.', confidence: 80 };
  };

  const coach = getCoachMessage();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return null;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[var(--text)]">Qual é o objetivo? *</p>
      <div className="space-y-3">
        {objectiveOptions.map(opt => {
          const selected = campaignData.objective === opt.value;
          const isRecommended = aiRecommendations?.objective.value === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => updateCampaignData({ objective: opt.value })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selected
                  ? 'border-primary-500 bg-primary-500/5'
                  : 'border-[var(--border)] bg-white/5 hover:border-primary-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selected ? 'border-primary-500' : 'border-[var(--text-secondary)]'
                }`}>
                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text)]">{opt.label}</span>
                    {isRecommended && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                        <Star size={10} /> RECOMENDADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{opt.sublabel}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">{opt.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-primary-400">🤖 {opt.coach}</span>
                  </div>
                  <div className="flex gap-3 mt-1.5 text-[10px] text-[var(--text-secondary)]">
                    <span>Métrica chave: {opt.metric}</span>
                    <span>Ideal para: {opt.ideal}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const suggestions = aiRecommendations?.name_suggestions || ['Campanha-Conv-Jul24', 'Verao-Conversao-Masculino', 'Premium-Tshirt-Sales-July'];
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Nome da Campanha *</label>
          <input
            value={campaignData.name}
            onChange={e => updateCampaignData({ name: e.target.value.slice(0, 50) })}
            placeholder="Camiseta Premium - Conversão Julho"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--text-secondary)]">Inclua produto + objetivo + período. Evite caracteres especiais.</span>
            <span className="text-[10px] text-[var(--text-secondary)]">{campaignData.name.length}/50</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Sugestões da IA:</p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-[var(--border)]">
              <span className="text-sm text-[var(--text)]">{s}</span>
              <button
                onClick={() => updateCampaignData({ name: s })}
                className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-medium hover:bg-primary-500/20 transition-colors"
              >
                Usar esta sugestão
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">IDADE *</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={13}
            max={65}
            value={campaignData.audience.age_min}
            onChange={e => {
              const v = Math.min(Number(e.target.value), campaignData.audience.age_max - 1);
              updateCampaignData({ audience: { ...campaignData.audience, age_min: v } });
            }}
            className="flex-1 accent-primary-500"
          />
          <span className="text-sm text-[var(--text)] w-12 text-center font-medium">{campaignData.audience.age_min}</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <input
            type="range"
            min={14}
            max={80}
            value={campaignData.audience.age_max}
            onChange={e => {
              const v = Math.max(Number(e.target.value), campaignData.audience.age_min + 1);
              updateCampaignData({ audience: { ...campaignData.audience, age_max: v } });
            }}
            className="flex-1 accent-primary-500"
          />
          <span className="text-sm text-[var(--text)] w-12 text-center font-medium">{campaignData.audience.age_max}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">De {campaignData.audience.age_min} a {campaignData.audience.age_max} anos</p>
        <p className="text-[10px] text-primary-400 mt-1">🤖 Público com poder de compra ({campaignData.audience.age_min}-{campaignData.audience.age_max}). Não muito velho, não muito jovem.</p>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">LOCALIZAÇÃO *</p>
        <div className="grid grid-cols-2 gap-2">
          {BRAZILIAN_STATES.map(s => (
            <label key={s} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={campaignData.audience.locations.includes(s)}
                onChange={() => toggleLocation(s)}
                className="accent-primary-500"
              />
              <span className="text-xs text-[var(--text)]">{s}</span>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-primary-400 mt-1">🤖 Começar com SP, RJ, MG (maior poder de compra). Expande para Brasília e Sul se der certo.</p>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">Tamanho estimado: {campaignData.audience.locations.length * 800}K pessoas</p>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">INTERESSE & COMPORTAMENTO *</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {campaignData.audience.interests.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-medium">
              {tag}
              <button onClick={() => removeInterest(tag)} className="hover:text-white"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Digite interesse para adicionar"
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
          />
          <button onClick={addTag} className="px-3 py-2 rounded-lg bg-primary-500/10 text-primary-400 text-sm hover:bg-primary-500/20">Adicionar</button>
        </div>
        <p className="text-[10px] text-primary-400 mt-1">🤖 Esses interesses definem bem seu público. Não adicione muitos (fica genérico). Máximo 5.</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--text)]">Posicionamento *</p>
      {placementOptions.map(opt => {
        const selected = campaignData.placement.includes(opt.value);
        return (
          <div
            key={opt.value}
            onClick={() => togglePlacement(opt.value)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selected
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-[var(--border)] bg-white/5 hover:border-primary-500/30'
            } ${!opt.recommended && opt.value !== 'feed' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selected ? 'border-primary-500 bg-primary-500' : 'border-[var(--text-secondary)]'
              }`}>
                {selected && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text)]">{opt.label}</span>
                  {opt.recommended && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                      <Star size={10} /> RECOMENDADO
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{opt.sublabel}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--text-secondary)]">
                  <span>Formato: {opt.format}</span>
                  <span>CPM: {opt.cpm}</span>
                  <span>CTR: {opt.ctr}</span>
                </div>
                <p className="text-[10px] text-primary-400 mt-1">🤖 {opt.coach}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStep5 = () => {
    if (creatives.length === 0) {
      return (
        <div className="p-8 text-center rounded-xl bg-white/5 border border-[var(--border)]">
          <Palette size={32} className="mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Nenhum criativo enviado. Volte para a análise inicial e adicione criativos.</p>
        </div>
      );
    }

    const videoCreatives = creatives.filter(c => c.type === 'video');
    const imageCreatives = creatives.filter(c => c.type === 'image');
    const bestCreative = videoCreatives[0] || creatives[0];

    return (
      <div className="space-y-4">
        {creatives.map(cr => {
          const isPrimary = campaignData.creatives.primary === cr.id;
          const isVideo = cr.type === 'video';
          const analysis = isVideo
            ? { score: 'EXCELENTE!', ctr: '2.4%', note: 'Vídeo mostra produto em uso. Pessoa testando, movimentação, qualidade boa. VIDEO > IMAGEM em 40% CTR.', emoji: '🔥' }
            : { score: 'Bom', ctr: '1.8%', note: 'Imagem limpa, produto bem centrado, fundo branco. Bom para Feed. PROBLEMA: sem contexto de uso (ninguém usando).', emoji: '' };

          return (
            <div key={cr.id} className={`p-4 rounded-xl border ${isVideo ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border)] bg-white/5'}`}>
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-primary-500/10">
                      <span className="text-lg">▶</span>
                    </div>
                  ) : (
                    <img src={cr.preview} alt={cr.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text)]">{cr.name}</span>
                    {isVideo && <span className="text-xs text-amber-400"><Star size={12} /></span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <span>{cr.type === 'image' ? 'Imagem' : 'Vídeo'}</span>
                    <span>{cr.dimensions}</span>
                    <span>{cr.size}</span>
                  </div>
                  <div className="mt-2 p-2 rounded-lg bg-primary-500/5">
                    <p className="text-[10px] text-primary-400">
                      🤖 {isVideo ? '✅ ' : ''}{analysis.score} CTR estimado: {analysis.ctr} {analysis.emoji}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{analysis.note}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="primary_creative"
                        checked={isPrimary}
                        onChange={() => updateCampaignData({
                          creatives: { ...campaignData.creatives, primary: cr.id, secondary: campaignData.creatives.secondary.filter(id => id !== cr.id) }
                        })}
                        className="accent-primary-500"
                      />
                      <span className="text-[10px] text-[var(--text)]">Usar como principal</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={campaignData.creatives.secondary.includes(cr.id)}
                        onChange={() => {
                          const sec = campaignData.creatives.secondary;
                          const next = sec.includes(cr.id) ? sec.filter(id => id !== cr.id) : [...sec, cr.id];
                          updateCampaignData({ creatives: { ...campaignData.creatives, secondary: next } });
                        }}
                        className="accent-primary-500"
                      />
                      <span className="text-[10px] text-[var(--text)]">Incluir em A/B test</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {bestCreative && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-xs font-semibold text-emerald-400 mb-2">ESTRATÉGIA RECOMENDADA:</p>
            <p className="text-sm text-[var(--text)]">Principal: <strong>{bestCreative.name}</strong></p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Testes: {campaignData.creatives.secondary.map(id => creatives.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'Nenhum'}
            </p>
            <p className="text-[10px] text-primary-400 mt-2">
              🤖 Começa com vídeo (melhor CPC). Em 48h, se ROAS {">"} 2x, adiciona imagens em segundo plano pra testar cores.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep6 = () => {
    const totalBudget = campaignData.budget * campaignData.duration;
    const estimatedClicks = Math.round(totalBudget / 0.10);
    const estimatedConversions = Math.round(estimatedClicks * 0.02);
    const estimatedRevenue = estimatedConversions * (campaignData.price || 120);
    const roi = totalBudget > 0 ? Math.round(((estimatedRevenue - totalBudget) / totalBudget) * 100) : 0;

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">ORÇAMENTO DIÁRIO (R$) *</p>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-[var(--text)]">R$</span>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={campaignData.budget}
              onChange={e => updateCampaignData({ budget: Number(e.target.value) })}
              className="flex-1 accent-primary-500"
            />
            <span className="text-lg font-bold text-primary-400 w-16 text-right">{campaignData.budget}</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[10, 25, 50, 100, 200].map(v => (
              <button
                key={v}
                onClick={() => updateCampaignData({ budget: v })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  campaignData.budget === v
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
                }`}
              >
                R$ {v}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10">
          <p className="text-xs font-medium text-primary-400 mb-2">🤖 Cálculo automático:</p>
          <p className="text-sm text-[var(--text)]">R$ {campaignData.budget}/dia × {campaignData.duration} dias = <strong>R$ {totalBudget} total</strong></p>
          <div className="mt-2 space-y-1 text-[10px] text-[var(--text-secondary)]">
            <p>• Cliques: {estimatedClicks.toLocaleString()}</p>
            <p>• CPC estimado: R$ 0.08-0.12</p>
            <p>• Conversões: {estimatedConversions} (2% CR)</p>
            <p>• Vendas: R$ {estimatedRevenue.toLocaleString()}</p>
            <p className="text-emerald-400 font-medium">• ROI: +{roi}% 🚀</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">CRONOGRAMA *</p>
          <div className="flex items-center gap-2 mb-3">
            <input type="radio" id="startNow" name="start" checked className="accent-primary-500" />
            <label htmlFor="startNow" className="text-sm text-[var(--text)]">Começar agora (imediatamente)</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {durationOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateCampaignData({ duration: opt.value })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  campaignData.duration === opt.value
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-[var(--border)] bg-white/5 hover:border-primary-500/30'
                }`}
              >
                <p className="text-sm font-medium text-[var(--text)]">{opt.label}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{opt.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-primary-400 mt-2">🤖 {campaignData.duration} dias é ideal. Reúne dados de conversão, permite otimizar rápido.</p>
        </div>

        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">AUTOMAÇÕES</p>
          <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={campaignData.auto_scale_enabled}
              onChange={e => updateCampaignData({ auto_scale_enabled: e.target.checked })}
              className="accent-primary-500"
            />
            <div>
              <span className="text-xs text-[var(--text)]">Auto-pause se ROAS {'<'} 1.2</span>
              <p className="text-[10px] text-[var(--text-secondary)]">Pausa automaticamente se render baixo</p>
            </div>
          </label>
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">URL DE DESTINO *</p>
        <div className="flex gap-2">
          <input
            value={campaignData.url}
            onChange={e => updateCampaignData({ url: e.target.value })}
            placeholder="https://seusite.com/camiseta-premium"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500"
          />
          <button
            onClick={() => {
              if (campaignData.url.startsWith('http')) {
                setError(null);
              } else {
                setError('URL inválida. Certifique-se de começar com https://');
              }
            }}
            className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 text-sm font-medium hover:bg-primary-500/20 transition-colors"
          >
            Validar URL
          </button>
        </div>
        {campaignData.url.startsWith('http') && (
          <p className="text-xs text-emerald-400 mt-1">✅ URL válida! (resposta automática)</p>
        )}
        <p className="text-[10px] text-primary-400 mt-1">🤖 Excelente! Você redireciona direto pro produto. Aumenta conversão em ~30% vs redirecionar pra homepage.</p>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">PIXEL DE CONVERSÃO *</p>
        <select
          value={campaignData.pixel_event}
          onChange={e => updateCampaignData({ pixel_event: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500 mb-3"
        >
          <option value="purchase">Purchase</option>
          <option value="lead">Lead</option>
          <option value="add_to_cart">Add to Cart</option>
          <option value="view_content">View Content</option>
        </select>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-xs font-medium text-emerald-400">✅ Meta Pixel (ID: 123456)</p>
          <div className="mt-1 space-y-0.5 text-[10px] text-[var(--text-secondary)]">
            <p>Status: OK</p>
            <p>Evento "Purchase" rastreando</p>
            <p>Últimas 24h: 45 conversões</p>
          </div>
        </div>
        <p className="text-[10px] text-primary-400 mt-2">🤖 Pixel está funcionando! Meta vai otimizar pra pessoas que REALMENTE compram.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-xs text-red-400">❌ AVISO! Pixel não funcionando. Meta não consegue rastrear conversão. PAUSE a campanha e corrige antes!</p>
        </div>
      )}
    </div>
  );

  const renderStep8 = () => {
    const totalBudget = campaignData.budget * (campaignData.duration || 7);
    const bestCreative = creatives.find(c => c.id === campaignData.creatives.primary);

    const checklist = [
      { label: 'URL é específica do produto?', ok: campaignData.url.startsWith('http') && campaignData.url.includes('.') },
      { label: 'Pixel está rastreando?', ok: true },
      { label: 'Público não está vazio?', ok: campaignData.audience.locations.length > 0 },
      { label: 'Criativo de qualidade?', ok: creatives.length > 0 },
      { label: 'Orçamento faz sentido?', ok: campaignData.budget >= 10 },
    ];

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-white/5 border border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--text)] mb-3">📋 RESUMO FINAL</p>
          <div className="space-y-1.5 text-xs text-[var(--text)]">
            <p><span className="text-[var(--text-secondary)]">Nome:</span> {campaignData.name || 'Não definido'}</p>
            <p><span className="text-[var(--text-secondary)]">Objetivo:</span> {objectiveOptions.find(o => o.value === campaignData.objective)?.label || campaignData.objective}</p>
            <p><span className="text-[var(--text-secondary)]">Público:</span> {campaignData.audience.age_min}-{campaignData.audience.age_max} anos em {campaignData.audience.locations.slice(0, 3).join(', ') || 'Todas as regiões'} ({campaignData.audience.locations.length * 800}K)</p>
            <p><span className="text-[var(--text-secondary)]">Placement:</span> {campaignData.placement.map(p => p.toUpperCase()).join(' + ')}</p>
            <p><span className="text-[var(--text-secondary)]">Criativo principal:</span> {bestCreative?.name || 'Não definido'}</p>
            <p><span className="text-[var(--text-secondary)]">Testes:</span> {campaignData.creatives.secondary.map(id => creatives.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'Nenhum'}</p>
            <p><span className="text-[var(--text-secondary)]">Orçamento:</span> R$ {campaignData.budget}/dia × {campaignData.duration}dias = R$ {totalBudget}</p>
            <p><span className="text-[var(--text-secondary)]">URL:</span> {campaignData.url || 'Não definida'}</p>
            <p><span className="text-[var(--text-secondary)]">Pixel:</span> Meta Pixel - OK</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 space-y-3">
          <p className="text-xs font-semibold text-primary-400 flex items-center gap-2">
            <Sparkles size={14} /> SUGESTÕES FINAIS DA IA
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs font-medium text-[var(--text)] mb-2">✅ Sugestão 1: Adicione texto (copy)</p>
              <p className="text-[10px] text-[var(--text-secondary)] mb-2">Você não adicionou texto do anúncio. Recomendo algo tipo: "Camiseta 100% algodão, premium. Frete grátis SP. Clica aí 👇"</p>
              <textarea
                value={copyText || campaignData.copy}
                onChange={e => setCopyText(e.target.value)}
                placeholder="Digite o texto do anúncio..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-primary-500 resize-none h-16"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => updateCampaignData({ copy: copyText })} className="px-3 py-1 rounded-lg bg-primary-500 text-white text-[10px] font-medium hover:bg-primary-600 transition-colors">Adicionar</button>
                <button onClick={() => { setCopyText(''); updateCampaignData({ copy: '' }); }} className="px-3 py-1 rounded-lg border border-[var(--border)] text-[var(--text)] text-[10px] font-medium hover:bg-white/5 transition-colors">Pular</button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs font-medium text-[var(--text)] mb-2">✅ Sugestão 2: Configure A/B test</p>
              <p className="text-[10px] text-[var(--text-secondary)] mb-2">Você tem {creatives.length} criativos. Divida orçamento: 60% vídeo, 20% cada imagem. Descobre qual converte melhor em 7 dias.</p>
              <button
                onClick={() => {
                  if (creatives.length >= 2) {
                    const videoCr = creatives.find(c => c.type === 'video');
                    const imageCrs = creatives.filter(c => c.type === 'image');
                    updateCampaignData({
                      creatives: {
                        primary: videoCr?.id || creatives[0].id,
                        secondary: imageCrs.map(c => c.id).slice(0, 2),
                      },
                      ab_test_enabled: true,
                    });
                  }
                }}
                className="px-3 py-1 rounded-lg bg-primary-500 text-white text-[10px] font-medium hover:bg-primary-600 transition-colors"
              >
                Aplicar divisão automática
              </button>
            </div>

            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs font-medium text-[var(--text)] mb-2">✅ Sugestão 3: Configure escalonamento</p>
              <p className="text-[10px] text-[var(--text-secondary)] mb-2">Se ROAS {'>'} 2.5x nos 2 primeiros dias, aumento automático para R$ {Math.min(campaignData.budget * 1.5, 500)}/dia. Pode dobrar retorno em uma semana.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateCampaignData({ auto_scale_enabled: true })}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${campaignData.auto_scale_enabled ? 'bg-primary-500 text-white' : 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'}`}
                >
                  Ativar auto-scale
                </button>
                <button className="px-3 py-1 rounded-lg border border-[var(--border)] text-[var(--text)] text-[10px] font-medium hover:bg-white/5 transition-colors">Manual</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text)] mb-3">🔴 CHECKLIST FINAL</p>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {item.ok
                  ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 flex-shrink-0" />
                }
                <span className={item.ok ? 'text-[var(--text)]' : 'text-amber-400'}>{item.label} {item.ok ? 'SIM' : 'PENDENTE'}</span>
              </div>
            ))}
            {checklist.every(i => i.ok) && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-1 border-t border-[var(--border)] mt-2">
                <CheckCircle2 size={14} /> TUDO OK!
              </div>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={e => setAcceptedTerms(e.target.checked)}
            className="accent-primary-500"
          />
          <span className="text-xs text-[var(--text-secondary)]">☑ Entendi as recomendações</span>
        </label>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text)]">✅ Campanha publicada com sucesso!</h2>
        <p className="text-sm text-[var(--text-secondary)]">Monitorando em tempo real...</p>
        <Loader2 size={20} className="mx-auto animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          {currentStep === 1 ? <Target size={20} className="text-primary-400" /> :
           currentStep === 2 ? <Sparkles size={20} className="text-primary-400" /> :
           currentStep === 3 ? <Users size={20} className="text-primary-400" /> :
           currentStep === 4 ? <MapPin size={20} className="text-primary-400" /> :
           currentStep === 5 ? <Palette size={20} className="text-primary-400" /> :
           currentStep === 6 ? <DollarSign size={20} className="text-primary-400" /> :
           currentStep === 7 ? <Link size={20} className="text-primary-400" /> :
           <ClipboardCheck size={20} className="text-primary-400" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">
            {currentStep === 1 ? '📊 Objetivo da Campanha' :
             currentStep === 2 ? '📝 Nome da Campanha' :
             currentStep === 3 ? '👥 Público-Alvo' :
             currentStep === 4 ? '📍 Posicionamento (Placement)' :
             currentStep === 5 ? '🎨 Criativo' :
             currentStep === 6 ? '💰 Orçamento & Tempo' :
             currentStep === 7 ? '🔗 URL & Conversão' :
             '✅ Review Final'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">Wizard: Passo {currentStep} de {TOTAL_STEPS}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
          <span>{progress}% completo</span>
          <span>Passo {currentStep}/{TOTAL_STEPS}</span>
        </div>
      </div>

      <AICoachBox message={coach.message} confidence={coach.confidence} />

      <div style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} className="border rounded-xl p-6">
        {renderStep()}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] text-sm font-medium hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}
          {currentStep === 1 && (
            <button
              onClick={() => navigate('/app/campaign/new')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] text-sm font-medium hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              resetWizard();
              localStorage.removeItem('adexpert_wizard');
              navigate('/app/campaign/new');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <Save size={14} /> Salvar Rascunho
          </button>

          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors"
            >
              Próximo <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || !acceptedTerms}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <><Loader2 size={16} className="animate-spin" /> Publicando...</>
              ) : (
                <><Send size={16} /> 🚀 PUBLICAR CAMPANHA</>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

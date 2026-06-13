import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;
let apiKey: string | null = null;

export function isGeminiConfigured(): boolean {
  return !!apiKey;
}

export function initializeGemini(key?: string): boolean {
  apiKey = key || process.env.GEMINI_API_KEY || null;
  if (!apiKey) return false;

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    model = genAI.getGenerativeModel({ model: modelName });
    return true;
  } catch (err) {
    console.error('[Gemini] Erro ao inicializar:', err);
    genAI = null;
    model = null;
    return false;
  }
}

export async function chat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  if (!model) {
    if (!initializeGemini()) {
      throw new Error('Gemini não configurado. Configure GEMINI_API_KEY no .env');
    }
  }

  if (!model) return 'Erro: Gemini não foi inicializado. Verifique sua chave de API.'

  try {
    const systemInstruction = `Você é o AdExpert, um consultor de tráfego pago IA 24/7 especialista em Meta Ads, Google Ads e TikTok Ads.

Regras:
- SEMPRE responda em português brasileiro, de forma amigável e profissional.
- Use dados reais quando disponíveis.
- Seja direto e acionável nas recomendações.
- Formate respostas com emojis e markdown simples.
- Quando o usuário disser "sim" ou confirmar, dê recomendações específicas de campanhas.
- Quando o usuário disser "oi" ou "bom dia", cumprimente e pergunte como pode ajudar.
- Quando o usuário agradecer, responda educadamente.

Contexto das campanhas do usuário:
- Meta Ads: Campanha "Verão 2024" com ROAS 2.1x, campanha "Produto Verão" com ROAS 2.2x
- Google Ads: Campanha "Google Search - Marca" com ROAS 1.8x, "Google Search - Genérico" com ROAS 1.2x
- TikTok Ads: Campanha "TikTok - Teste A" com ROAS 2.9x`;

    const chatSession = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      systemInstruction: { parts: [{ text: systemInstruction }] },
    });

    const lastMessage = messages[messages.length - 1]?.content || 'Olá';
    const result = await chatSession.sendMessage(lastMessage);
    return result.response.text();
  } catch (err: any) {
    console.error('[Gemini] Erro no chat:', err);
    throw err;
  }
}

export async function analyzeCampaigns(campaignData: string): Promise<string> {
  if (!model) {
    if (!initializeGemini()) {
      throw new Error('Gemini não configurado');
    }
  }

  if (!model) return 'Erro: Gemini não foi inicializado.'

  try {
    const prompt = `Analise os dados das seguintes campanhas de anúncios e forneça recomendações acionáveis:

${campaignData}

Formato de resposta esperado:
1. Resumo geral (2-3 frases)
2. Principais problemas encontrados (bullet points)
3. Recomendações prioritárias (ordenadas por impacto)
4. Oportunidades rápidas

Responda em português brasileiro.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err: any) {
    console.error('[Gemini] Erro na análise:', err);
    throw err;
  }
}

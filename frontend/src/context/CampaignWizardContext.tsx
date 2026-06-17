import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CampaignWizardData, AIAnalysisResult, CreativeFile } from '../types';

interface CampaignWizardState {
  campaignData: CampaignWizardData;
  aiRecommendations: AIAnalysisResult | null;
  creatives: CreativeFile[];
  currentStep: number;
  publishing: boolean;
  published: boolean;
  error: string | null;
}

interface CampaignWizardContextType extends CampaignWizardState {
  updateCampaignData: (data: Partial<CampaignWizardData>) => void;
  setAiRecommendations: (recs: AIAnalysisResult) => void;
  addCreative: (file: CreativeFile) => void;
  removeCreative: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setPublishing: (v: boolean) => void;
  setPublished: (v: boolean) => void;
  setError: (err: string | null) => void;
  resetWizard: () => void;
}

const defaultCampaignData: CampaignWizardData = {
  description: '',
  objective: 'conversions',
  name: '',
  audience: { age_min: 25, age_max: 45, locations: [], interests: [] },
  placement: ['stories', 'reels'],
  creatives: { primary: '', secondary: [] },
  budget: 50,
  duration: 7,
  url: '',
  pixel_event: 'purchase',
  niche: '',
  price: 0,
  margin: 0,
  cac_ideal: 0,
  target_location: [],
  target_audience: [],
  copy: '',
  ab_test_enabled: false,
  auto_scale_enabled: false,
};

const initialState: CampaignWizardState = {
  campaignData: defaultCampaignData,
  aiRecommendations: null,
  creatives: [],
  currentStep: 1,
  publishing: false,
  published: false,
  error: null,
};

function loadState(): CampaignWizardState {
  try {
    const saved = localStorage.getItem('adexpert_wizard');
    if (saved) return JSON.parse(saved);
  } catch {}
  return initialState;
}

const CampaignWizardContext = createContext<CampaignWizardContextType | null>(null);

export function CampaignWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampaignWizardState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem('adexpert_wizard', JSON.stringify(state));
    } catch {}
  }, [state]);

  const updateCampaignData = (data: Partial<CampaignWizardData>) =>
    setState(s => ({ ...s, campaignData: { ...s.campaignData, ...data } }));

  const setAiRecommendations = (recs: AIAnalysisResult) =>
    setState(s => ({ ...s, aiRecommendations: recs }));

  const addCreative = (file: CreativeFile) =>
    setState(s => ({ ...s, creatives: [...s.creatives, file] }));

  const removeCreative = (id: string) =>
    setState(s => ({ ...s, creatives: s.creatives.filter(c => c.id !== id) }));

  const setCurrentStep = (step: number) =>
    setState(s => ({ ...s, currentStep: step }));

  const setPublishing = (v: boolean) =>
    setState(s => ({ ...s, publishing: v }));

  const setPublished = (v: boolean) =>
    setState(s => ({ ...s, published: v }));

  const setError = (err: string | null) =>
    setState(s => ({ ...s, error: err }));

  const resetWizard = () =>
    setState(initialState);

  return (
    <CampaignWizardContext.Provider value={{ ...state, updateCampaignData, setAiRecommendations, addCreative, removeCreative, setCurrentStep, setPublishing, setPublished, setError, resetWizard }}>
      {children}
    </CampaignWizardContext.Provider>
  );
}

export function useCampaignWizard() {
  const ctx = useContext(CampaignWizardContext);
  if (!ctx) throw new Error('useCampaignWizard must be used within CampaignWizardProvider');
  return ctx;
}

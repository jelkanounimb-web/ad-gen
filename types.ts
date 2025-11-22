export enum InputType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  URL = 'URL',
}

export interface CampaignStrategy {
  targetAudience: string;
  toneOfVoice: string;
  usp: string; // Unique Selling Proposition
  visualStyle: string;
}

export interface AdCopy {
  headline: string;
  hook: string;
  body: string;
  cta: string;
}

export interface CreativeAssets {
  imagePrompt: string;
  videoScript: string;
}

export interface CampaignResult {
  strategy: CampaignStrategy;
  adCopy: AdCopy;
  creative: CreativeAssets;
  keywords: string[];
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: CampaignResult | null;
}


export enum InputType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  URL = 'URL',
}

export type TargetLanguage = 'English' | 'Français' | 'العربية' | 'Darija (Morocco)';

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

export interface AdVariant {
  angle: string; // e.g. "Direct Response", "Storytelling"
  headline: string;
  primaryText: string;
  platforms: string[]; // e.g. ["Meta", "TikTok"]
}

export interface CreativeAssets {
  imagePrompt: string;
  videoScript: string;
}

export interface SocialPrompts {
  instagramStory: string;
  tikTok: string;
  youTubeShort: string;
}

export interface CampaignResult {
  strategy: CampaignStrategy;
  adCopy: AdCopy;
  creative: CreativeAssets;
  keywords: string[];
  language: TargetLanguage;
}

export interface LandingPageContent {
  hero: { headline: string; subheadline: string; cta: string; };
  trust: { title: string; logos: string[] };
  problem: { title: string; items: { title: string; desc: string }[] };
  solution: { title: string; items: { title: string; desc: string }[] };
  howItWorks: { title: string; steps: { title: string; desc: string }[] };
  socialProof: { title: string; testimonials: { name: string; role: string; text: string }[] };
  pricing: { title: string; price: string; period: string; features: string[]; cta: string };
  faq: { title: string; items: { question: string; answer: string }[] };
  footer: { copyright: string; links: string[] };
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: CampaignResult | null;
  landingPage: LandingPageContent | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputSummary: string;
  inputType: InputType;
  result: CampaignResult;
  landingPage?: LandingPageContent;
}

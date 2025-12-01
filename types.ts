export interface ArticleData {
  title: string;
  excerpt: string; // Sapo
  content: string;
}

export interface SeoResult {
  title: string;
  description: string;
  keywords: string;
}

export interface ProofreadResult {
  original: string;
  correctedHtml: string; // Contains the HTML with red spans
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AnalysisState {
  status: AnalysisStatus;
  seo: SeoResult | null;
  proofread: ProofreadResult | null;
  error: string | null;
  elapsedTime?: number; // Added to store the time taken
}

export interface UserSettings {
  apiKey?: string; // Optional user provided key
  modelName: string;
  seoSystemInstruction: string;
  proofreadSystemInstruction: string;
}
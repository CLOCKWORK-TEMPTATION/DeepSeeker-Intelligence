export interface ResearchResult {
  scratchpad: string;
  report: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ResearchState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: ResearchResult | null;
  error: string | null;
  groundingSourceUrls: string[];
}

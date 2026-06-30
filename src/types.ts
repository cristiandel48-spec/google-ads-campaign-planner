export interface Product {
  id: string;
  name: string;
  supplierCost: number;
  stock: number;
  suggestedSellPrice: number;
  benefit: string;
  imageAlt: string;
}

export interface AdsStructure {
  primaryTexts: string[]; // Meta "Texto principal" — up to ~125 chars to avoid "see more" truncation
  headlines: string[]; // Meta ad headline — max 40 chars
  descriptions: string[]; // Meta link description — max 30 chars
  audienceInterests: string[]; // Detailed targeting interests/behaviors
  audienceLookalikeIdeas: string[]; // Lookalike / custom audience source ideas
  placements: string[]; // Recommended placements (Feed, Reels, Stories, etc.)
  landingPageHeadline: string;
  landingPageSubheadline: string;
  landingPageBullets: string[];
  marketingReasoning: string;
  error?: boolean;
  fallback?: boolean;
  message?: string;
}

export interface CampaignMetrics {
  sellingPrice: number;
  dailyBudget: number;
  cpc: number;
  conversionRate: number; // in %
}

export interface OptimizationTask {
  id: string;
  day: string;
  title: string;
  description: string;
  checked: boolean;
  phase: "week1" | "week2";
}

export interface MetaCampaignMetric {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number; // in account currency, already converted from cents
  spend: number;
  reach: number;
  impressions: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpm: number;
  results: number; // conversions / leads / purchases depending on objective
  costPerResult: number;
  purchaseValue: number;
  roas: number;
}

export interface MetaAdsSuggestion {
  id: string;
  campaignId: string;
  campaignName: string;
  type: "pause" | "increase_budget" | "decrease_budget" | "refresh_creative" | "reduce_frequency";
  severity: "critical" | "warning" | "opportunity";
  reason: string;
  spendAffecting: boolean;
  suggestedDailyBudget?: number;
}

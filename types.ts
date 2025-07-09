


export enum MarketAnalysisTier {
  ECONOMIC_SNAPSHOT = "Tier A: Economic Snapshot",
  COMPETITIVE_LANDSCAPE = "Tier B: Competitive Landscape",
  INVESTMENT_DEEP_DIVE = "Tier C: Investment Deep-Dive",
}

export enum PartnerFindingTier {
  PARTNERSHIP_BLUEPRINT = "Tier 1: Partnership Blueprint",
  TRANSFORMATION_SIMULATOR = "Tier 2: Transformation Simulator",
  VALUATION_RISK = "Tier 4: Valuation & Risk Assessment",
}

export type ReportTier = MarketAnalysisTier | PartnerFindingTier;

export type UserType = 'government' | 'non-government';

export interface TierDetail {
  tier: ReportTier;
  brief: string;
  fullDescription: string;
  cost: string;
  pageCount: string;
  keyDeliverables: (string | { subItem: string })[];
  idealFor: string;
}

// Base parameters common to all reports
interface BaseReportParameters {
  userName: string;
  userType: UserType;
  userDepartment: string; // This will hold either the department or organization name
  userCountry: string;
  customObjective: string;
  industry: string;
  region: string;
}

// Parameters specific to Market Analysis reports
interface MarketAnalysisParameters extends BaseReportParameters {
  analysisMode: 'analysis';
  tier: MarketAnalysisTier;
}

// Parameters specific to Partner Finding reports
interface PartnerFindingParameters extends BaseReportParameters {
  analysisMode: 'matchmaking';
  tier: PartnerFindingTier;
  companySize: string;
  keyTechnologies: string[];
  targetMarket: string[];
}

export type ReportParameters = MarketAnalysisParameters | PartnerFindingParameters;


export interface LetterRequest {
  reportParameters: PartnerFindingParameters;
  reportContent: string;
}

// --- Nexus Symbiosis™ Types ---
export interface SymbiosisContext {
  topic: string; 
  originalContent: string;
  reportParameters?: ReportParameters;
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

// --- Live Opportunities & Analysis Types ---
export interface LiveOpportunityItem {
  project_name: string;
  country: string;
  sector: string;
  value: string;
  summary: string;
  source_url: string;
  ai_feasibility_score: number;
  ai_risk_assessment: string;
}

export type View = 'profile' | 'manual' | 'opportunities' | 'report' | 'compliance';
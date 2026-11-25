// =====================================================================
// TradeMind AI - Analysis & AI Recommendation Types
// =====================================================================

import { Timeframe } from './market';
import { TechnicalIndicatorSet } from './indicators';
import { MarketStructureSnapshot } from './structure';

export type TradingDecision = 'LONG' | 'SHORT' | 'NO TRADE';
export type SetupStatus = 'CONFIRMED' | 'DEVELOPING' | 'NO_TRADE';

export interface ScorePillarBreakdown {
  trendAlignment: number; // 0.0 to 2.0
  marketStructure: number; // 0.0 to 2.0
  momentum: number; // 0.0 to 2.0
  volumeAndVolatility: number; // 0.0 to 2.0
  entryConfirmation: number; // 0.0 to 2.0
  totalScore: number; // 0.0 to 10.0
  interpretation: 'Strong technical alignment' | 'Moderate alignment; additional confirmation needed' | 'Weak setup; generally NO TRADE';
  pillarComments: {
    trend: string;
    structure: string;
    momentum: string;
    volume: string;
    entry: string;
  };
}

export interface MultiTimeframeSummary {
  fourHour: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    emaAlignment: string;
    majorKeyLevels: string;
    macroSummary: string;
  };
  oneHour: {
    structure: string;
    lastEvent: string; // e.g., 'Bullish BOS confirmed at 94,200'
    liquidityContext: string;
    alignmentWithHTF: boolean;
  };
  fifteenMinute: {
    setupType: string; // e.g., 'Retest of 15M Bullish Order Block'
    pullbackStatus: string;
    fvgContext: string;
    momentumState: string;
  };
  fiveMinute: {
    triggerCandle: string;
    rejectionDetected: boolean;
    confirmationState: string;
    invalidationPrice: number;
  };
}

export interface FundamentalDataSummary {
  marketType: 'crypto' | 'forex';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'HIGH_VOLATILITY_RISK';
  headlineEvents: Array<{
    source: string;
    headline: string;
    publishedAt: string;
    relevance: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  }>;
  forexSpecific?: {
    centralBankStance: string;
    interestRateDifferential: string;
    upcomingHighImpactNews: string[];
  };
  cryptoSpecific?: {
    fundingRate: number; // e.g. 0.01%
    openInterestTrend: 'RISING' | 'FALLING' | 'FLAT';
    derivativesSentiment: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'BALANCED';
    etfFlowSentiment?: 'NET_INFLOW' | 'NET_OUTFLOW' | 'NEUTRAL';
  };
  dataAvailable: boolean;
  unavailableNotice?: string;
}

export interface TradeLevels {
  entryPrice: number;
  entryZone: {
    min: number;
    max: number;
  };
  stopLossPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3?: number;
  riskRewardTP1: number; // Must be >= 2.0 for confirmed trade
  riskRewardTP2: number;
  riskRewardTP3?: number;
  stopLossDistancePipsOrPoints: number;
  stopLossReasoning: string;
  takeProfitReasoning: string;
}

export interface AIAnalysisResult {
  id: string;
  instrumentSymbol: string;
  analysisTimestamp: number;
  dataTimestamp: number;
  dataSources: string[];
  marketCondition: 'TRENDING' | 'RANGING' | 'VOLATILITY_EXPANSION' | 'CHOPPY';
  decision: TradingDecision;
  setupStatus: SetupStatus;
  technicalScore: number;
  scoreBreakdown: ScorePillarBreakdown;
  multiTimeframe: MultiTimeframeSummary;
  fundamental: FundamentalDataSummary;
  levels?: TradeLevels;
  primaryReasons: string[];
  riskFactors: string[];
  invalidationConditions: string[];
  preEntryRequirements: string[];
  alternativeScenario: string;
  detailedReasoning: string;
  isAiGenerated: boolean;
  modelUsed: string;
}

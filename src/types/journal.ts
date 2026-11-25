// =====================================================================
// TradeMind AI - Trading Journal & Performance Types
// =====================================================================

import { TradingDecision } from './analysis';
import { MarketType } from './market';

export type JournalEntryType = 'hypothetical_analysis' | 'user_executed_trade';

export type TradeOutcome = 'OPEN' | 'WON' | 'LOST' | 'BREAKEVEN' | 'CANCELLED' | 'INVALIDATED';

export interface JournalEntry {
  id: string;
  userId?: string;
  tradePlanId?: string;
  instrumentSymbol: string;
  marketType: MarketType;
  entryType: JournalEntryType;
  direction: 'LONG' | 'SHORT';
  plannedEntry: number;
  plannedStopLoss: number;
  plannedTakeProfit: number;
  actualEntry?: number;
  actualExit?: number;
  positionSize?: number;
  riskAmount?: number;
  status: TradeOutcome;
  outcomeR?: number; // e.g. +2.0 R, -1.0 R, 0.0 R
  netPnl?: number;
  technicalScore?: number;
  reasonsForEntry: string[];
  notes?: string;
  tags?: string[];
  screenshotUrl?: string;
  isSampleData?: boolean; // Strictly identifies initial seeded sample records
  createdAt: number;
  closedAt?: number;
}

export interface PerformanceAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRatePct: number;
  averageR: number;
  profitFactor: number;
  expectancyR: number;
  maxDrawdownPct: number;
  longWinRatePct: number;
  shortWinRatePct: number;
  cryptoWinRatePct: number;
  forexWinRatePct: number;
  totalRGained: number;
  equityCurve: Array<{ date: string; cumulativeR: number }>;
  rDistribution: Array<{ rBin: string; count: number }>;
}

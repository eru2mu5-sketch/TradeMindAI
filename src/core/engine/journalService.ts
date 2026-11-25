// =====================================================================
// TradeMind AI - Trading Journal & Performance Engine
// Computes Win Rate, Average R, Profit Factor, Expectancy, Max Drawdown.
// Explicitly tags and distinguishes sample demonstration records from actual records.
// =====================================================================

import { JournalEntry, PerformanceAnalytics, TradeOutcome } from '../../types/journal';
import { AIAnalysisResult } from '../../types/analysis';
import { Instrument } from '../../types/market';

export class JournalService {
  private entries: JournalEntry[] = [];

  constructor(initialEntries?: JournalEntry[]) {
    if (initialEntries && initialEntries.length > 0) {
      this.entries = [...initialEntries];
    } else {
      this.seedInitialJournal();
    }
  }

  /**
   * Seeds sample historical journal records clearly labelled as sample data
   */
  private seedInitialJournal(): void {
    const now = Date.now();
    const dayMs = 86400000;

    this.entries = [
      {
        id: 'sample_jnl_001',
        instrumentSymbol: 'BTC/USDT',
        marketType: 'crypto',
        entryType: 'hypothetical_analysis',
        direction: 'LONG',
        plannedEntry: 93200,
        plannedStopLoss: 92400,
        plannedTakeProfit: 95000,
        actualEntry: 93250,
        actualExit: 95000,
        positionSize: 0.15,
        riskAmount: 120,
        status: 'WON',
        outcomeR: 2.25,
        netPnl: 270,
        technicalScore: 8.8,
        reasonsForEntry: ['4H Bullish EMA Stack', '15M Order Block Retest', 'Liquidity Sweep'],
        notes: 'SAMPLE RECORD: Clean execution off 15M Demand Zone. Exited at TP1 target.',
        isSampleData: true,
        createdAt: now - dayMs * 5,
        closedAt: now - dayMs * 4,
      },
      {
        id: 'sample_jnl_002',
        instrumentSymbol: 'EUR/USD',
        marketType: 'forex',
        entryType: 'hypothetical_analysis',
        direction: 'SHORT',
        plannedEntry: 1.088,
        plannedStopLoss: 1.091,
        plannedTakeProfit: 1.082,
        actualEntry: 1.0878,
        actualExit: 1.082,
        positionSize: 0.5,
        riskAmount: 150,
        status: 'WON',
        outcomeR: 2.07,
        netPnl: 310,
        technicalScore: 8.2,
        reasonsForEntry: ['1H Bearish CHoCH', 'Bearish FVG Mitigation', 'ECB Dovish Bias'],
        notes: 'SAMPLE RECORD: Price tapped FVG CE and melted straight to TP1.',
        isSampleData: true,
        createdAt: now - dayMs * 4,
        closedAt: now - dayMs * 3,
      },
      {
        id: 'sample_jnl_003',
        instrumentSymbol: 'ETH/USDT',
        marketType: 'crypto',
        entryType: 'hypothetical_analysis',
        direction: 'LONG',
        plannedEntry: 3450,
        plannedStopLoss: 3400,
        plannedTakeProfit: 3560,
        actualEntry: 3452,
        actualExit: 3398,
        positionSize: 2.5,
        riskAmount: 125,
        status: 'LOST',
        outcomeR: -1.0,
        netPnl: -125,
        technicalScore: 6.8,
        reasonsForEntry: ['15M Bullish BOS', 'StochRSI Oversold'],
        notes: 'SAMPLE RECORD: Structural invalidation triggered after sudden BTC dominance spike.',
        isSampleData: true,
        createdAt: now - dayMs * 3,
        closedAt: now - dayMs * 2,
      },
      {
        id: 'sample_jnl_004',
        instrumentSymbol: 'GBP/USD',
        marketType: 'forex',
        entryType: 'hypothetical_analysis',
        direction: 'LONG',
        plannedEntry: 1.289,
        plannedStopLoss: 1.285,
        plannedTakeProfit: 1.298,
        actualEntry: 1.2892,
        actualExit: 1.2975,
        positionSize: 0.75,
        riskAmount: 300,
        status: 'WON',
        outcomeR: 2.25,
        netPnl: 675,
        technicalScore: 8.5,
        reasonsForEntry: ['London Session Open Liquidity Sweep', 'Bullish Rejection Candle'],
        notes: 'SAMPLE RECORD: Swept Asian session low, closed back inside with long wick pin bar.',
        isSampleData: true,
        createdAt: now - dayMs * 2,
        closedAt: now - dayMs * 1,
      },
      {
        id: 'sample_jnl_005',
        instrumentSymbol: 'SOL/USDT',
        marketType: 'crypto',
        entryType: 'user_executed_trade',
        direction: 'SHORT',
        plannedEntry: 242.0,
        plannedStopLoss: 248.0,
        plannedTakeProfit: 230.0,
        actualEntry: 241.8,
        actualExit: 230.0,
        positionSize: 15.0,
        riskAmount: 90,
        status: 'WON',
        outcomeR: 2.0,
        netPnl: 180,
        technicalScore: 8.0,
        reasonsForEntry: ['Bearish RSI Divergence on 1H', 'Equal Highs Liquidity Pool Swept'],
        notes: 'SAMPLE RECORD: Simulated user trade following TradeMind alert.',
        isSampleData: true,
        createdAt: now - dayMs,
        closedAt: now - dayMs / 2,
      },
    ];
  }

  /**
   * Adds a live AI Analysis result directly into the journal as a live verified record
   */
  public saveAnalysisToJournal(
    analysis: AIAnalysisResult,
    instrument: Instrument,
    entryType: 'hypothetical_analysis' | 'user_executed_trade' = 'hypothetical_analysis'
  ): JournalEntry {
    if (!analysis.levels || analysis.decision === 'NO TRADE') {
      throw new Error('Cannot create journal trade from a NO TRADE analysis');
    }

    const newEntry: JournalEntry = {
      id: `jnl_live_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      instrumentSymbol: analysis.instrumentSymbol,
      marketType: instrument.marketType,
      entryType,
      direction: analysis.decision as 'LONG' | 'SHORT',
      plannedEntry: analysis.levels.entryPrice,
      plannedStopLoss: analysis.levels.stopLossPrice,
      plannedTakeProfit: analysis.levels.takeProfit1,
      status: 'OPEN',
      technicalScore: analysis.technicalScore,
      reasonsForEntry: analysis.primaryReasons,
      notes: analysis.detailedReasoning,
      isSampleData: false, // Live user saved record
      createdAt: Date.now(),
    };

    this.entries.unshift(newEntry);
    return newEntry;
  }

  /**
   * Retrieves all journal entries with optional filtering
   */
  public getEntries(filter?: {
    instrumentSymbol?: string;
    marketType?: 'crypto' | 'forex';
    status?: TradeOutcome;
    direction?: 'LONG' | 'SHORT';
    entryType?: 'hypothetical_analysis' | 'user_executed_trade';
    excludeSampleData?: boolean;
  }): JournalEntry[] {
    let result = [...this.entries];

    if (filter?.excludeSampleData) {
      result = result.filter((e) => !e.isSampleData);
    }
    if (filter?.instrumentSymbol) {
      result = result.filter((e) => e.instrumentSymbol === filter.instrumentSymbol);
    }
    if (filter?.marketType) {
      result = result.filter((e) => e.marketType === filter.marketType);
    }
    if (filter?.status) {
      result = result.filter((e) => e.status === filter.status);
    }
    if (filter?.direction) {
      result = result.filter((e) => e.direction === filter.direction);
    }
    if (filter?.entryType) {
      result = result.filter((e) => e.entryType === filter.entryType);
    }

    return result;
  }

  /**
   * Closes or updates a trade outcome
   */
  public updateTradeOutcome(
    id: string,
    outcome: {
      status: TradeOutcome;
      actualExit?: number;
      outcomeR?: number;
      netPnl?: number;
      notes?: string;
    }
  ): JournalEntry | undefined {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) return undefined;

    entry.status = outcome.status;
    if (outcome.actualExit !== undefined) entry.actualExit = outcome.actualExit;
    if (outcome.outcomeR !== undefined) entry.outcomeR = outcome.outcomeR;
    if (outcome.netPnl !== undefined) entry.netPnl = outcome.netPnl;
    if (outcome.notes) entry.notes = outcome.notes;
    entry.closedAt = Date.now();

    return entry;
  }

  /**
   * Computes comprehensive quantitative performance analytics
   */
  public calculatePerformanceAnalytics(
    entryTypeFilter?: 'hypothetical_analysis' | 'user_executed_trade'
  ): PerformanceAnalytics {
    let pool = this.entries;
    if (entryTypeFilter) {
      pool = pool.filter((e) => e.entryType === entryTypeFilter);
    }

    const closedTrades = pool.filter((e) => e.status === 'WON' || e.status === 'LOST' || e.status === 'BREAKEVEN');
    const totalTrades = closedTrades.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRatePct: 0,
        averageR: 0,
        profitFactor: 0,
        expectancyR: 0,
        maxDrawdownPct: 0,
        longWinRatePct: 0,
        shortWinRatePct: 0,
        cryptoWinRatePct: 0,
        forexWinRatePct: 0,
        totalRGained: 0,
        equityCurve: [],
        rDistribution: [],
      };
    }

    const winningTrades = closedTrades.filter((e) => e.status === 'WON');
    const losingTrades = closedTrades.filter((e) => e.status === 'LOST');
    const breakevenTrades = closedTrades.filter((e) => e.status === 'BREAKEVEN');

    const winRatePct = Number(((winningTrades.length / totalTrades) * 100).toFixed(1));

    let totalRGained = 0;
    let grossWinR = 0;
    let grossLossR = 0;

    for (const t of closedTrades) {
      const r = t.outcomeR || 0;
      totalRGained += r;
      if (r > 0) grossWinR += r;
      if (r < 0) grossLossR += Math.abs(r);
    }

    const averageR = Number((totalRGained / totalTrades).toFixed(2));
    const profitFactor = grossLossR === 0 ? Number(grossWinR.toFixed(2)) : Number((grossWinR / grossLossR).toFixed(2));

    const winRateFrac = winningTrades.length / totalTrades;
    const lossRateFrac = losingTrades.length / totalTrades;
    const avgWinR = winningTrades.length > 0 ? grossWinR / winningTrades.length : 0;
    const avgLossR = losingTrades.length > 0 ? grossLossR / losingTrades.length : 0;
    const expectancyR = Number((winRateFrac * avgWinR - lossRateFrac * avgLossR).toFixed(2));

    const longTrades = closedTrades.filter((e) => e.direction === 'LONG');
    const longWins = longTrades.filter((e) => e.status === 'WON');
    const longWinRatePct = longTrades.length > 0 ? Number(((longWins.length / longTrades.length) * 100).toFixed(1)) : 0;

    const shortTrades = closedTrades.filter((e) => e.direction === 'SHORT');
    const shortWins = shortTrades.filter((e) => e.status === 'WON');
    const shortWinRatePct = shortTrades.length > 0 ? Number(((shortWins.length / shortTrades.length) * 100).toFixed(1)) : 0;

    const cryptoTrades = closedTrades.filter((e) => e.marketType === 'crypto');
    const cryptoWins = cryptoTrades.filter((e) => e.status === 'WON');
    const cryptoWinRatePct = cryptoTrades.length > 0 ? Number(((cryptoWins.length / cryptoTrades.length) * 100).toFixed(1)) : 0;

    const forexTrades = closedTrades.filter((e) => e.marketType === 'forex');
    const forexWins = forexTrades.filter((e) => e.status === 'WON');
    const forexWinRatePct = forexTrades.length > 0 ? Number(((forexWins.length / forexTrades.length) * 100).toFixed(1)) : 0;

    const sortedChronological = [...closedTrades].sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));
    let cumR = 0;
    let peakR = 0;
    let maxDrawdownR = 0;

    const equityCurve: Array<{ date: string; cumulativeR: number }> = [];

    for (const t of sortedChronological) {
      cumR += t.outcomeR || 0;
      if (cumR > peakR) peakR = cumR;
      const dd = peakR - cumR;
      if (dd > maxDrawdownR) maxDrawdownR = dd;

      const dateStr = new Date(t.closedAt || t.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      equityCurve.push({ date: dateStr, cumulativeR: Number(cumR.toFixed(2)) });
    }

    const maxDrawdownPct = peakR > 0 ? Number(((maxDrawdownR / peakR) * 100).toFixed(1)) : 0;

    const bins: Record<string, number> = {
      '<-1.5R': 0,
      '-1.0R': 0,
      '0.0R': 0,
      '+1.0R to +2.0R': 0,
      '>+2.0R': 0,
    };

    for (const t of closedTrades) {
      const r = t.outcomeR || 0;
      if (r < -1.2) bins['<-1.5R']++;
      else if (r <= -0.8) bins['-1.0R']++;
      else if (r >= -0.2 && r <= 0.2) bins['0.0R']++;
      else if (r > 0.2 && r < 2.0) bins['+1.0R to +2.0R']++;
      else bins['>+2.0R']++;
    }

    const rDistribution = Object.entries(bins).map(([rBin, count]) => ({ rBin, count }));

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      winRatePct,
      averageR,
      profitFactor,
      expectancyR,
      maxDrawdownPct,
      longWinRatePct,
      shortWinRatePct,
      cryptoWinRatePct,
      forexWinRatePct,
      totalRGained: Number(totalRGained.toFixed(2)),
      equityCurve,
      rDistribution,
    };
  }
}

export const journalService = new JournalService();

// =====================================================================
// TradeMind AI - Trade Planner Test Suite
// Verifies Structural Entry, Stop Loss, TP1/TP2/TP3, and R:R >= 2.0 Guard
// =====================================================================

import { generateTradePlan } from '../src/core/engine/tradePlanner';
import { Instrument } from '../src/types/market';
import { MarketStructureSnapshot } from '../src/types/structure';
import { TechnicalIndicatorSet } from '../src/types/indicators';

export function runTradePlannerTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      errors.push(testName);
      console.error(`  ✗ ${testName}`);
    }
  }

  console.log('\n--- Running Trade Level & Risk/Reward Engine Tests ---');

  const btcInstrument: Instrument = {
    id: 'inst_btc_usdt',
    symbol: 'BTC/USDT',
    displayName: 'Bitcoin',
    marketType: 'crypto',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    pipOrTickSize: 0.1,
    lotOrContractSize: 1.0,
    isActive: true,
    precision: 2,
  };

  const mockIndicators: TechnicalIndicatorSet = {
    ema20: 94000,
    ema50: 93500,
    ema200: 91000,
    rsi14: 55,
    macd: { macd: 250, signal: 180, histogram: 70 },
    stochRsi: { k: 60, d: 50 },
    vwap: 93800,
    atr14: 600, // ATR = $600
    bollingerBands: { upper: 96000, middle: 94000, lower: 92000, bandwidth: 4.25, percentB: 0.6 },
    volume24h: 30000,
    volumeSma20: 25000,
    volumeRatio: 1.2,
    momentumScore: 45,
    annualizedVolatility: 48,
    candleVolatilityPct: 0.63,
  };

  const mockStructure: MarketStructureSnapshot = {
    timeframe: '15m',
    trendStructure: 'HIGHER_HIGHS_AND_LOWS',
    recentSwingHighs: [{ index: 10, timestamp: 1000, price: 95500, type: 'SWING_HIGH', isWickPenetrated: false, isConfirmedBreak: false }],
    recentSwingLows: [{ index: 5, timestamp: 800, price: 93500, type: 'SWING_LOW', isWickPenetrated: false, isConfirmedBreak: false }],
    activeSupportLevels: [{ price: 93500, type: 'SUPPORT', touches: 2, strength: 'STRONG', lastTestedTimestamp: 800 }],
    activeResistanceLevels: [{ price: 97000, type: 'RESISTANCE', touches: 1, strength: 'MODERATE', lastTestedTimestamp: 1000 }],
    supplyZones: [],
    demandZones: [{ top: 94200, bottom: 93800, type: 'DEMAND', timeframe: '15m', isMitigated: false, touchCount: 1 }],
    recentSweeps: [],
    equalHighsLows: [],
    openFairValueGaps: [{ candle1Index: 1, candle2Index: 2, candle3Index: 3, gapTop: 94200, gapBottom: 93800, type: 'BULLISH_FVG', isFilled: false, isPartiallyMitigated: false, midpointConsequentEncroachment: 94000 }],
    activeOrderBlocks: [],
    recentRejections: [],
    detectedDivergences: [],
  };

  const currentCandle = {
    timestamp: 2000,
    open: 94500,
    high: 94700,
    low: 94400,
    close: 94600,
    volume: 150,
  };

  // 1. Long Trade Level Generation Test
  const longPlan = generateTradePlan({
    instrument: btcInstrument,
    direction: 'LONG',
    currentCandle,
    structure: mockStructure,
    indicators: mockIndicators,
    minRiskReward: 2.0,
  });

  assert(longPlan.decision === 'LONG', 'Generates confirmed LONG decision');
  assert(longPlan.levels !== undefined, 'Returns structured trade levels');
  if (longPlan.levels) {
    assert(longPlan.levels.stopLossPrice < longPlan.levels.entryPrice, 'Stop Loss is strictly below Entry Price');
    assert(longPlan.levels.takeProfit1 > longPlan.levels.entryPrice, 'TP1 is strictly above Entry Price');
    assert(longPlan.levels.takeProfit2 > longPlan.levels.takeProfit1, 'TP2 is strictly above TP1');
    assert(longPlan.levels.riskRewardTP1 >= 2.0, `TP1 Risk/Reward (${longPlan.levels.riskRewardTP1}) meets minimum 2.0`);
    assert(longPlan.levels.riskRewardTP2 >= 3.0, `TP2 Risk/Reward (${longPlan.levels.riskRewardTP2}) meets 3.0`);
    assert(longPlan.levels.stopLossReasoning.length > 0, 'Includes explicit stop loss structural reasoning');
    assert(longPlan.levels.takeProfitReasoning.length > 0, 'Includes explicit take profit reasoning');
  }

  // 2. Short Trade Level Generation Test
  const shortPlan = generateTradePlan({
    instrument: btcInstrument,
    direction: 'SHORT',
    currentCandle,
    structure: {
      ...mockStructure,
      trendStructure: 'LOWER_HIGHS_AND_LOWS',
      supplyZones: [{ top: 95500, bottom: 95000, type: 'SUPPLY', timeframe: '15m', isMitigated: false, touchCount: 1 }],
      demandZones: [],
    },
    indicators: mockIndicators,
    minRiskReward: 2.0,
  });

  assert(shortPlan.decision === 'SHORT', 'Generates confirmed SHORT decision');
  if (shortPlan.levels) {
    assert(shortPlan.levels.stopLossPrice > shortPlan.levels.entryPrice, 'For SHORT, Stop Loss is strictly above Entry Price');
    assert(shortPlan.levels.takeProfit1 < shortPlan.levels.entryPrice, 'For SHORT, TP1 is strictly below Entry Price');
    assert(shortPlan.levels.riskRewardTP1 >= 2.0, `SHORT TP1 Risk/Reward meets minimum 2.0`);
  }

  return { passed, failed, errors };
}

if (typeof require !== 'undefined' && require.main === module) {
  const result = runTradePlannerTests();
  console.log(`\nTrade Planner Tests Complete: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}

// =====================================================================
// TradeMind AI - Multi-Timeframe Alignment Engine (4H, 1H, 15M, 5M)
// Evaluates macro direction, structural shifts, setups, and triggers.
// =====================================================================

import { Candle, Timeframe } from '../../types/market';
import { MultiTimeframeSummary } from '../../types/analysis';
import { calculateTechnicalIndicators } from './technicalIndicators';
import { analyzeMarketStructure } from './marketStructure';

export interface MultiTimeframeCandleMap {
  fourHour: Candle[];
  oneHour: Candle[];
  fifteenMinute: Candle[];
  fiveMinute: Candle[];
}

/**
 * Analyzes all 4 required timeframes and synthesizes a multi-timeframe summary
 */
export function analyzeMultiTimeframe(candlesMap: MultiTimeframeCandleMap): MultiTimeframeSummary {
  const { fourHour, oneHour, fifteenMinute, fiveMinute } = candlesMap;

  // 1. 4H Analysis (Overall direction, Major S/R, EMA Structure)
  const ind4H = calculateTechnicalIndicators(fourHour);
  const struct4H = analyzeMarketStructure(fourHour, '4h', ind4H.atr14);

  const is4hBullish = ind4H.ema20 > ind4H.ema50 && ind4H.ema50 > ind4H.ema200;
  const is4hBearish = ind4H.ema20 < ind4H.ema50 && ind4H.ema50 < ind4H.ema200;
  const trend4H = is4hBullish ? 'BULLISH' : is4hBearish ? 'BEARISH' : 'NEUTRAL';

  const majorRes = struct4H.activeResistanceLevels[0]?.price.toFixed(2) || 'None';
  const majorSup = struct4H.activeSupportLevels[0]?.price.toFixed(2) || 'None';

  const fourHourSummary = {
    trend: trend4H as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
    emaAlignment: is4hBullish
      ? 'Bullish EMA Stack (EMA 20 > 50 > 200)'
      : is4hBearish
      ? 'Bearish EMA Stack (EMA 20 < 50 < 200)'
      : 'Mixed / Compressed EMAs (Rangebound)',
    majorKeyLevels: `Resistance: ${majorRes} | Support: ${majorSup}`,
    macroSummary: `4H Macro trend is ${trend4H}. ATR: ${ind4H.atr14.toFixed(2)}, RSI 14: ${ind4H.rsi14}.`,
  };

  // 2. 1H Analysis (Structure, BOS, CHoCH, Liquidity, Trend Alignment)
  const ind1H = calculateTechnicalIndicators(oneHour);
  const struct1H = analyzeMarketStructure(oneHour, '1h', ind1H.atr14);

  let lastEvent1H = 'Market in consolidation range';
  if (struct1H.lastCHoCH) {
    lastEvent1H = `Confirmed ${struct1H.lastCHoCH.newDirection} CHoCH at ${struct1H.lastCHoCH.pivotPrice}`;
  } else if (struct1H.lastBOS) {
    lastEvent1H = `Confirmed ${struct1H.lastBOS.breakType} at ${struct1H.lastBOS.brokenLevel}`;
  }

  const isAlignedWith4H =
    (trend4H === 'BULLISH' && struct1H.trendStructure === 'HIGHER_HIGHS_AND_LOWS') ||
    (trend4H === 'BEARISH' && struct1H.trendStructure === 'LOWER_HIGHS_AND_LOWS');

  const liquidityContext1H =
    struct1H.equalHighsLows.length > 0
      ? `Equal Highs/Lows pool detected at ${struct1H.equalHighsLows[0].price}`
      : struct1H.recentSweeps.length > 0
      ? `Recent liquidity sweep at ${struct1H.recentSweeps[0].sweepExtreme}`
      : 'Clean liquidity profile without major resting pools';

  const oneHourSummary = {
    structure: struct1H.trendStructure,
    lastEvent: lastEvent1H,
    liquidityContext: liquidityContext1H,
    alignmentWithHTF: isAlignedWith4H,
  };

  // 3. 15M Analysis (Trading Setup, Pullbacks, FVG/Order Block Context)
  const ind15M = calculateTechnicalIndicators(fifteenMinute);
  const struct15M = analyzeMarketStructure(fifteenMinute, '15m', ind15M.atr14);

  const activeOb = struct15M.activeOrderBlocks[0];
  const activeFvg = struct15M.openFairValueGaps[0];

  const setupType15M = activeOb
    ? `Retest of 15M ${activeOb.type} (${activeOb.zoneBottom} - ${activeOb.zoneTop})`
    : activeFvg
    ? `Fair Value Gap mitigation (${activeFvg.gapBottom} - ${activeFvg.gapTop})`
    : 'Mid-range structure continuation';

  const fifteenMinuteSummary = {
    setupType: setupType15M,
    pullbackStatus:
      ind15M.rsi14 < 40
        ? 'Deep oversold pullback'
        : ind15M.rsi14 > 60
        ? 'Extended bullish impulse'
        : 'Controlled equilibrium pullback',
    fvgContext: struct15M.openFairValueGaps.length > 0 ? `${struct15M.openFairValueGaps.length} active FVGs open` : 'No open imbalances',
    momentumState: `MACD hist: ${ind15M.macd.histogram > 0 ? '+' : ''}${ind15M.macd.histogram}, StochRSI K: ${ind15M.stochRsi.k}`,
  };

  // 4. 5M Analysis (Entry Trigger, Confirmation Candle, Rejection, Invalidation)
  const ind5M = calculateTechnicalIndicators(fiveMinute);
  const struct5M = analyzeMarketStructure(fiveMinute, '5m', ind5M.atr14);

  const lastRejection = struct5M.recentRejections[struct5M.recentRejections.length - 1];
  const lastCandle5M = fiveMinute[fiveMinute.length - 1];

  const fiveMinuteSummary = {
    triggerCandle: lastRejection
      ? `Confirmed ${lastRejection.type} with ${(lastRejection.wickRatio * 100).toFixed(0)}% wick rejection`
      : 'Standard continuation candle; awaiting decisive rejection or engulfing confirmation',
    rejectionDetected: !!lastRejection,
    confirmationState:
      struct5M.recentSweeps.length > 0
        ? 'Liquidity sweep confirmed on LTF'
        : 'Price trading inside structural range',
    invalidationPrice:
      struct5M.recentSwingLows.length > 0
        ? struct5M.recentSwingLows[struct5M.recentSwingLows.length - 1].price
        : lastCandle5M.low,
  };

  return {
    fourHour: fourHourSummary,
    oneHour: oneHourSummary,
    fifteenMinute: fifteenMinuteSummary,
    fiveMinute: fiveMinuteSummary,
  };
}

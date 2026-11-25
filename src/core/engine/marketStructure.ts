// =====================================================================
// TradeMind AI - Market Structure Analysis Engine
// Analyzes price action, swing pivots, BOS/CHoCH, liquidity sweeps,
// FVG, Order Blocks, Support/Resistance, and Divergences.
// Strictly separates wick penetration from confirmed structural breaks.
// =====================================================================

import { Candle } from '../../types/market';
import {
  BreakOfStructure,
  ChangeOfCharacter,
  DivergenceEvent,
  EqualHighLow,
  FairValueGap,
  LiquiditySweep,
  MarketStructureSnapshot,
  OrderBlock,
  RejectionCandle,
  SupportResistanceLevel,
  SupplyDemandZone,
  SwingPoint,
  TrendStructure,
} from '../../types/structure';
import { calculateRSI } from './technicalIndicators';

/**
 * Detects swing highs and swing lows using a symmetric lookback window
 */
export function detectSwingPoints(candles: Candle[], windowSize: number = 3): SwingPoint[] {
  const points: SwingPoint[] = [];
  if (candles.length < windowSize * 2 + 1) return points;

  for (let i = windowSize; i < candles.length - windowSize; i++) {
    const current = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= windowSize; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high > current.high) {
        isSwingHigh = false;
      }
      if (candles[i - j].low <= current.low || candles[i + j].low < current.low) {
        isSwingLow = false;
      }
    }

    if (isSwingHigh) {
      points.push({
        index: i,
        timestamp: current.timestamp,
        price: current.high,
        type: 'SWING_HIGH',
        isWickPenetrated: false,
        isConfirmedBreak: false,
      });
    }

    if (isSwingLow) {
      points.push({
        index: i,
        timestamp: current.timestamp,
        price: current.low,
        type: 'SWING_LOW',
        isWickPenetrated: false,
        isConfirmedBreak: false,
      });
    }
  }

  return points;
}

/**
 * Identifies Equal Highs (EQH) and Equal Lows (EQL)
 * Liquidity pools formed when swing extremes match within tolerance (e.g., 0.15%)
 */
export function detectEqualHighsLows(
  swingPoints: SwingPoint[],
  tolerancePct: number = 0.15
): EqualHighLow[] {
  const results: EqualHighLow[] = [];
  const highs = swingPoints.filter((p) => p.type === 'SWING_HIGH');
  const lows = swingPoints.filter((p) => p.type === 'SWING_LOW');

  // Check Equal Highs
  for (let i = 0; i < highs.length; i++) {
    const cluster = [highs[i]];
    for (let j = i + 1; j < highs.length; j++) {
      const diffPct = (Math.abs(highs[i].price - highs[j].price) / highs[i].price) * 100;
      if (diffPct <= tolerancePct) {
        cluster.push(highs[j]);
      }
    }
    if (cluster.length >= 2) {
      const avgPrice = cluster.reduce((sum, p) => sum + p.price, 0) / cluster.length;
      results.push({
        type: 'EQUAL_HIGHS',
        price: Number(avgPrice.toFixed(6)),
        pointCount: cluster.length,
        tolerancePct,
        timestamps: cluster.map((p) => p.timestamp),
      });
      i += cluster.length - 1;
    }
  }

  // Check Equal Lows
  for (let i = 0; i < lows.length; i++) {
    const cluster = [lows[i]];
    for (let j = i + 1; j < lows.length; j++) {
      const diffPct = (Math.abs(lows[i].price - lows[j].price) / lows[i].price) * 100;
      if (diffPct <= tolerancePct) {
        cluster.push(lows[j]);
      }
    }
    if (cluster.length >= 2) {
      const avgPrice = cluster.reduce((sum, p) => sum + p.price, 0) / cluster.length;
      results.push({
        type: 'EQUAL_LOWS',
        price: Number(avgPrice.toFixed(6)),
        pointCount: cluster.length,
        tolerancePct,
        timestamps: cluster.map((p) => p.timestamp),
      });
      i += cluster.length - 1;
    }
  }

  return results;
}

/**
 * Distinguishes wick penetration from confirmed structural break (BOS)
 * and detects Change of Character (CHoCH).
 */
export function analyzeStructuralBreaks(
  candles: Candle[],
  swingPoints: SwingPoint[]
): {
  trend: TrendStructure;
  lastBOS?: BreakOfStructure;
  lastCHoCH?: ChangeOfCharacter;
} {
  const highs = swingPoints.filter((p) => p.type === 'SWING_HIGH');
  const lows = swingPoints.filter((p) => p.type === 'SWING_LOW');

  let trend: TrendStructure = 'RANGING';
  let lastBOS: BreakOfStructure | undefined;
  let lastCHoCH: ChangeOfCharacter | undefined;

  if (highs.length >= 2 && lows.length >= 2) {
    const recentHigh2 = highs[highs.length - 1];
    const recentHigh1 = highs[highs.length - 2];
    const recentLow2 = lows[lows.length - 1];
    const recentLow1 = lows[lows.length - 2];

    const isHigherHigh = recentHigh2.price > recentHigh1.price;
    const isHigherLow = recentLow2.price > recentLow1.price;
    const isLowerHigh = recentHigh2.price < recentHigh1.price;
    const isLowerLow = recentLow2.price < recentLow1.price;

    if (isHigherHigh && isHigherLow) {
      trend = 'HIGHER_HIGHS_AND_LOWS';
    } else if (isLowerHigh && isLowerLow) {
      trend = 'LOWER_HIGHS_AND_LOWS';
    }
  }

  // Check recent candle closes for confirmed breaks
  const lookbackStart = Math.max(0, candles.length - 30);
  for (let i = lookbackStart; i < candles.length; i++) {
    const c = candles[i];

    // Check Bullish BOS (Close above recent swing high)
    for (const sh of highs) {
      if (c.timestamp > sh.timestamp) {
        if (c.close > sh.price) {
          sh.isConfirmedBreak = true;
          lastBOS = {
            timestamp: c.timestamp,
            brokenLevel: sh.price,
            breakType: 'BOS_BULLISH',
            confirmationPrice: c.close,
            isConfirmedByClose: true,
            candleIndex: i,
          };
        } else if (c.high > sh.price) {
          sh.isWickPenetrated = true;
        }
      }
    }

    // Check Bearish BOS (Close below recent swing low)
    for (const sl of lows) {
      if (c.timestamp > sl.timestamp) {
        if (c.close < sl.price) {
          sl.isConfirmedBreak = true;
          lastBOS = {
            timestamp: c.timestamp,
            brokenLevel: sl.price,
            breakType: 'BOS_BEARISH',
            confirmationPrice: c.close,
            isConfirmedByClose: true,
            candleIndex: i,
          };
        } else if (c.low < sl.price) {
          sl.isWickPenetrated = true;
        }
      }
    }
  }

  // Detect CHoCH:
  // In an uptrend, breaking the most recent higher low by candle close
  // In a downtrend, breaking the most recent lower high by candle close
  if (trend === 'HIGHER_HIGHS_AND_LOWS' && lows.length >= 1) {
    const keyLow = lows[lows.length - 1];
    const latestCandle = candles[candles.length - 1];
    if (latestCandle.close < keyLow.price) {
      lastCHoCH = {
        timestamp: latestCandle.timestamp,
        previousTrend: 'BULLISH',
        newDirection: 'BEARISH',
        pivotPrice: keyLow.price,
        isConfirmedByClose: true,
        candleIndex: candles.length - 1,
      };
    }
  } else if (trend === 'LOWER_HIGHS_AND_LOWS' && highs.length >= 1) {
    const keyHigh = highs[highs.length - 1];
    const latestCandle = candles[candles.length - 1];
    if (latestCandle.close > keyHigh.price) {
      lastCHoCH = {
        timestamp: latestCandle.timestamp,
        previousTrend: 'BEARISH',
        newDirection: 'BULLISH',
        pivotPrice: keyHigh.price,
        isConfirmedByClose: true,
        candleIndex: candles.length - 1,
      };
    }
  }

  return { trend, lastBOS, lastCHoCH };
}

/**
 * Detects Fair Value Gaps (FVG)
 * Bullish FVG: Candle 1 High < Candle 3 Low (imbalance on Candle 2)
 * Bearish FVG: Candle 1 Low > Candle 3 High
 */
export function detectFairValueGaps(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  if (candles.length < 3) return fvgs;

  const currentPrice = candles[candles.length - 1].close;

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG
    if (c3.low > c1.high) {
      const gapBottom = c1.high;
      const gapTop = c3.low;
      const midpoint = gapBottom + (gapTop - gapBottom) * 0.5;

      // Check if subsequent candles have filled the gap
      let isFilled = false;
      let isPartiallyMitigated = false;
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].low <= gapBottom) {
          isFilled = true;
          break;
        } else if (candles[j].low <= midpoint) {
          isPartiallyMitigated = true;
        }
      }

      if (!isFilled) {
        fvgs.push({
          candle1Index: i - 2,
          candle2Index: i - 1,
          candle3Index: i,
          gapTop: Number(gapTop.toFixed(6)),
          gapBottom: Number(gapBottom.toFixed(6)),
          type: 'BULLISH_FVG',
          isFilled: false,
          isPartiallyMitigated,
          midpointConsequentEncroachment: Number(midpoint.toFixed(6)),
        });
      }
    }

    // Bearish FVG
    if (c3.high < c1.low) {
      const gapTop = c1.low;
      const gapBottom = c3.high;
      const midpoint = gapBottom + (gapTop - gapBottom) * 0.5;

      let isFilled = false;
      let isPartiallyMitigated = false;
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].high >= gapTop) {
          isFilled = true;
          break;
        } else if (candles[j].high >= midpoint) {
          isPartiallyMitigated = true;
        }
      }

      if (!isFilled) {
        fvgs.push({
          candle1Index: i - 2,
          candle2Index: i - 1,
          candle3Index: i,
          gapTop: Number(gapTop.toFixed(6)),
          gapBottom: Number(gapBottom.toFixed(6)),
          type: 'BEARISH_FVG',
          isFilled: false,
          isPartiallyMitigated,
          midpointConsequentEncroachment: Number(midpoint.toFixed(6)),
        });
      }
    }
  }

  // Keep most recent unmitigated FVGs
  return fvgs.slice(-10);
}

/**
 * Detects Order Blocks
 * Bullish Order Block: The last bearish candle before an aggressive upward displacement
 * Bearish Order Block: The last bullish candle before an aggressive downward displacement
 */
export function detectOrderBlocks(candles: Candle[], atr: number): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  if (candles.length < 5 || atr <= 0) return blocks;

  for (let i = 2; i < candles.length - 2; i++) {
    const current = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    const displacementUp = next1.close - next1.open > atr * 1.2 && next2.close > next1.close;
    const displacementDown = next1.open - next1.close > atr * 1.2 && next2.close < next1.close;

    // Bullish OB: current candle was bearish, followed by strong upward impulse
    if (current.close < current.open && displacementUp) {
      const zoneTop = Math.max(current.open, current.high);
      const zoneBottom = current.low;

      // Check if subsequent price mitigated the block
      let isMitigated = false;
      for (let k = i + 3; k < candles.length; k++) {
        if (candles[k].low < zoneBottom) {
          isMitigated = true;
          break;
        }
      }

      if (!isMitigated) {
        blocks.push({
          candleIndex: i,
          timestamp: current.timestamp,
          type: 'BULLISH_OB',
          zoneTop: Number(zoneTop.toFixed(6)),
          zoneBottom: Number(zoneBottom.toFixed(6)),
          isMitigated: false,
          volumeStrength: current.volume,
        });
      }
    }

    // Bearish OB: current candle was bullish, followed by strong downward impulse
    if (current.close > current.open && displacementDown) {
      const zoneTop = current.high;
      const zoneBottom = Math.min(current.open, current.low);

      let isMitigated = false;
      for (let k = i + 3; k < candles.length; k++) {
        if (candles[k].high > zoneTop) {
          isMitigated = true;
          break;
        }
      }

      if (!isMitigated) {
        blocks.push({
          candleIndex: i,
          timestamp: current.timestamp,
          type: 'BEARISH_OB',
          zoneTop: Number(zoneTop.toFixed(6)),
          zoneBottom: Number(zoneBottom.toFixed(6)),
          isMitigated: false,
          volumeStrength: current.volume,
        });
      }
    }
  }

  return blocks.slice(-6);
}

/**
 * Detects Liquidity Sweeps
 * Wick breaches swing level, but candle body closes back inside the range with large rejection wick
 */
export function detectLiquiditySweeps(
  candles: Candle[],
  swingPoints: SwingPoint[]
): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];
  const lookback = Math.min(candles.length, 30);
  const recentCandles = candles.slice(-lookback);

  for (const c of recentCandles) {
    const range = c.high - c.low;
    if (range === 0) continue;

    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;

    // Check Bearish Sweep (Swept swing high liquidity and rejected down)
    for (const sh of swingPoints.filter((p) => p.type === 'SWING_HIGH')) {
      if (c.timestamp > sh.timestamp && c.high > sh.price && c.close < sh.price) {
        const wickRatio = upperWick / range;
        if (wickRatio >= 0.4) {
          sweeps.push({
            timestamp: c.timestamp,
            targetPrice: sh.price,
            sweepExtreme: c.high,
            direction: 'BEARISH_SWEEP',
            rejectionClose: c.close,
            rejectionWickRatio: Number(wickRatio.toFixed(2)),
          });
        }
      }
    }

    // Check Bullish Sweep (Swept swing low liquidity and rejected up)
    for (const sl of swingPoints.filter((p) => p.type === 'SWING_LOW')) {
      if (c.timestamp > sl.timestamp && c.low < sl.price && c.close > sl.price) {
        const wickRatio = lowerWick / range;
        if (wickRatio >= 0.4) {
          sweeps.push({
            timestamp: c.timestamp,
            targetPrice: sl.price,
            sweepExtreme: c.low,
            direction: 'BULLISH_SWEEP',
            rejectionClose: c.close,
            rejectionWickRatio: Number(wickRatio.toFixed(2)),
          });
        }
      }
    }
  }

  return sweeps.slice(-5);
}

/**
 * Detects Rejection Candles (Pin bars, Hammers, Shooting Stars)
 */
export function detectRejectionCandles(candles: Candle[]): RejectionCandle[] {
  const rejections: RejectionCandle[] = [];
  const lookback = Math.min(candles.length, 15);

  for (let i = candles.length - lookback; i < candles.length; i++) {
    const c = candles[i];
    const totalRange = c.high - c.low;
    if (totalRange === 0) continue;

    const body = Math.abs(c.close - c.open);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;

    const upperWickRatio = upperWick / totalRange;
    const lowerWickRatio = lowerWick / totalRange;
    const bodyRatio = body / totalRange;

    // Bullish pin bar / Hammer
    if (lowerWickRatio >= 0.55 && bodyRatio <= 0.35) {
      rejections.push({
        timestamp: c.timestamp,
        candleIndex: i,
        type: 'BULLISH_PINBAR',
        wickRatio: Number(lowerWickRatio.toFixed(2)),
        bodyRatio: Number(bodyRatio.toFixed(2)),
      });
    }

    // Bearish pin bar / Shooting star
    if (upperWickRatio >= 0.55 && bodyRatio <= 0.35) {
      rejections.push({
        timestamp: c.timestamp,
        candleIndex: i,
        type: 'BEARISH_PINBAR',
        wickRatio: Number(upperWickRatio.toFixed(2)),
        bodyRatio: Number(bodyRatio.toFixed(2)),
      });
    }
  }

  return rejections;
}

/**
 * Detects Support and Resistance levels from pivot clusters
 */
export function detectSupportResistanceLevels(
  swingPoints: SwingPoint[],
  currentPrice: number
): {
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
} {
  const supports: SupportResistanceLevel[] = [];
  const resistances: SupportResistanceLevel[] = [];

  const highs = swingPoints.filter((p) => p.type === 'SWING_HIGH');
  const lows = swingPoints.filter((p) => p.type === 'SWING_LOW');

  for (const h of highs) {
    if (h.price > currentPrice) {
      resistances.push({
        price: h.price,
        type: 'RESISTANCE',
        touches: 1,
        strength: 'MODERATE',
        lastTestedTimestamp: h.timestamp,
      });
    }
  }

  for (const l of lows) {
    if (l.price < currentPrice) {
      supports.push({
        price: l.price,
        type: 'SUPPORT',
        touches: 1,
        strength: 'MODERATE',
        lastTestedTimestamp: l.timestamp,
      });
    }
  }

  return {
    supports: supports.slice(-5).reverse(),
    resistances: resistances.slice(-5),
  };
}

/**
 * Detects Bullish and Bearish RSI Divergences
 */
export function detectDivergences(
  candles: Candle[],
  swingPoints: SwingPoint[]
): DivergenceEvent[] {
  const divergences: DivergenceEvent[] = [];
  const closes = candles.map((c) => c.close);
  const rsi = calculateRSI(closes, 14);

  if (rsi.length === 0 || swingPoints.length < 4) return divergences;

  const lows = swingPoints.filter((p) => p.type === 'SWING_LOW');
  const highs = swingPoints.filter((p) => p.type === 'SWING_HIGH');

  // Bullish Divergence: Price lower low, RSI higher low
  if (lows.length >= 2) {
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];
    const rsi1Index = l1.index - (candles.length - rsi.length);
    const rsi2Index = l2.index - (candles.length - rsi.length);

    if (rsi1Index >= 0 && rsi2Index < rsi.length && rsi2Index > rsi1Index) {
      const rsi1 = rsi[rsi1Index];
      const rsi2 = rsi[rsi2Index];

      if (l2.price < l1.price && rsi2 > rsi1 && rsi2 < 45) {
        divergences.push({
          type: 'REGULAR_BULLISH',
          indicator: 'RSI',
          pricePointA: l1.price,
          pricePointB: l2.price,
          indicatorPointA: Number(rsi1.toFixed(2)),
          indicatorPointB: Number(rsi2.toFixed(2)),
          timestamp: l2.timestamp,
        });
      }
    }
  }

  // Bearish Divergence: Price higher high, RSI lower high
  if (highs.length >= 2) {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const rsi1Index = h1.index - (candles.length - rsi.length);
    const rsi2Index = h2.index - (candles.length - rsi.length);

    if (rsi1Index >= 0 && rsi2Index < rsi.length && rsi2Index > rsi1Index) {
      const rsi1 = rsi[rsi1Index];
      const rsi2 = rsi[rsi2Index];

      if (h2.price > h1.price && rsi2 < rsi1 && rsi2 > 55) {
        divergences.push({
          type: 'REGULAR_BEARISH',
          indicator: 'RSI',
          pricePointA: h1.price,
          pricePointB: h2.price,
          indicatorPointA: Number(rsi1.toFixed(2)),
          indicatorPointB: Number(rsi2.toFixed(2)),
          timestamp: h2.timestamp,
        });
      }
    }
  }

  return divergences;
}

/**
 * Aggregates complete Market Structure snapshot for a timeframe
 */
export function analyzeMarketStructure(
  candles: Candle[],
  timeframe: string,
  atr: number
): MarketStructureSnapshot {
  if (candles.length === 0) {
    throw new Error(`Cannot analyze market structure on empty candle dataset for ${timeframe}`);
  }

  const currentPrice = candles[candles.length - 1].close;
  const swingPoints = detectSwingPoints(candles, 3);
  const recentHighs = swingPoints.filter((p) => p.type === 'SWING_HIGH').slice(-5);
  const recentLows = swingPoints.filter((p) => p.type === 'SWING_LOW').slice(-5);

  const { trend, lastBOS, lastCHoCH } = analyzeStructuralBreaks(candles, swingPoints);
  const equalHighsLows = detectEqualHighsLows(swingPoints);
  const openFairValueGaps = detectFairValueGaps(candles);
  const activeOrderBlocks = detectOrderBlocks(candles, atr);
  const recentSweeps = detectLiquiditySweeps(candles, swingPoints);
  const recentRejections = detectRejectionCandles(candles);
  const { supports, resistances } = detectSupportResistanceLevels(swingPoints, currentPrice);
  const detectedDivergences = detectDivergences(candles, swingPoints);

  // Supply and demand zones derived from unmitigated Order Blocks
  const supplyZones: SupplyDemandZone[] = activeOrderBlocks
    .filter((ob) => ob.type === 'BEARISH_OB')
    .map((ob) => ({
      top: ob.zoneTop,
      bottom: ob.zoneBottom,
      type: 'SUPPLY',
      timeframe,
      isMitigated: ob.isMitigated,
      touchCount: 1,
    }));

  const demandZones: SupplyDemandZone[] = activeOrderBlocks
    .filter((ob) => ob.type === 'BULLISH_OB')
    .map((ob) => ({
      top: ob.zoneTop,
      bottom: ob.zoneBottom,
      type: 'DEMAND',
      timeframe,
      isMitigated: ob.isMitigated,
      touchCount: 1,
    }));

  return {
    timeframe,
    trendStructure: trend,
    recentSwingHighs: recentHighs,
    recentSwingLows: recentLows,
    lastBOS,
    lastCHoCH,
    activeSupportLevels: supports,
    activeResistanceLevels: resistances,
    supplyZones,
    demandZones,
    recentSweeps,
    equalHighsLows,
    openFairValueGaps,
    activeOrderBlocks,
    recentRejections,
    detectedDivergences,
  };
}

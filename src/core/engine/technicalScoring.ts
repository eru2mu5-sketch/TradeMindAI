// =====================================================================
// TradeMind AI - Technical Scoring Engine
// Heuristic score from 0.0 to 10.0 across 5 distinct pillars (0-2 pts each).
// Strict quant interpretation: alignment score, NOT win probability.
// =====================================================================

import { ScorePillarBreakdown } from '../../types/analysis';
import { TechnicalIndicatorSet } from '../../types/indicators';
import { MarketStructureSnapshot } from '../../types/structure';

interface ScoringInputs {
  indicators: TechnicalIndicatorSet;
  structure: MarketStructureSnapshot;
  htfTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  proposedDirection: 'LONG' | 'SHORT';
}

/**
 * Calculates the heuristic 0-10 technical score across 5 pillars
 */
export function calculateTechnicalScore(inputs: ScoringInputs): ScorePillarBreakdown {
  const { indicators, structure, htfTrend, proposedDirection } = inputs;

  let trendScore = 0;
  let structureScore = 0;
  let momentumScore = 0;
  let volumeScore = 0;
  let entryScore = 0;

  const trendComments: string[] = [];
  const structureComments: string[] = [];
  const momentumComments: string[] = [];
  const volumeComments: string[] = [];
  const entryComments: string[] = [];

  // -------------------------------------------------------------
  // PILLAR 1: Trend Alignment (0 - 2.0 points)
  // -------------------------------------------------------------
  const isEmaBullish = indicators.ema20 > indicators.ema50 && indicators.ema50 > indicators.ema200;
  const isEmaBearish = indicators.ema20 < indicators.ema50 && indicators.ema50 < indicators.ema200;

  if (proposedDirection === 'LONG') {
    if (htfTrend === 'BULLISH') {
      trendScore += 1.0;
      trendComments.push('HTF 4H trend aligns with bullish bias (+1.0)');
    } else {
      trendComments.push('HTF 4H trend is counter-trend or neutral');
    }

    if (isEmaBullish) {
      trendScore += 1.0;
      trendComments.push('EMA 20/50/200 in perfect bullish stack (+1.0)');
    } else if (indicators.ema20 > indicators.ema50) {
      trendScore += 0.5;
      trendComments.push('EMA 20 above EMA 50 (+0.5)');
    }
  } else {
    // SHORT
    if (htfTrend === 'BEARISH') {
      trendScore += 1.0;
      trendComments.push('HTF 4H trend aligns with bearish bias (+1.0)');
    } else {
      trendComments.push('HTF 4H trend is counter-trend or neutral');
    }

    if (isEmaBearish) {
      trendScore += 1.0;
      trendComments.push('EMA 20/50/200 in perfect bearish stack (+1.0)');
    } else if (indicators.ema20 < indicators.ema50) {
      trendScore += 0.5;
      trendComments.push('EMA 20 below EMA 50 (+0.5)');
    }
  }
  trendScore = Math.min(2.0, trendScore);

  // -------------------------------------------------------------
  // PILLAR 2: Market Structure (0 - 2.0 points)
  // -------------------------------------------------------------
  if (proposedDirection === 'LONG') {
    if (structure.trendStructure === 'HIGHER_HIGHS_AND_LOWS') {
      structureScore += 0.8;
      structureComments.push('Higher highs and higher lows established (+0.8)');
    }
    if (structure.lastBOS && structure.lastBOS.breakType === 'BOS_BULLISH' && structure.lastBOS.isConfirmedByClose) {
      structureScore += 0.7;
      structureComments.push('Confirmed Bullish Break of Structure (BOS) (+0.7)');
    } else if (structure.lastCHoCH && structure.lastCHoCH.newDirection === 'BULLISH') {
      structureScore += 0.7;
      structureComments.push('Confirmed Bullish Change of Character (CHoCH) (+0.7)');
    }
    if (structure.demandZones.length > 0 || structure.openFairValueGaps.some((f) => f.type === 'BULLISH_FVG')) {
      structureScore += 0.5;
      structureComments.push('Trading from active Demand Zone / Bullish FVG (+0.5)');
    }
  } else {
    // SHORT
    if (structure.trendStructure === 'LOWER_HIGHS_AND_LOWS') {
      structureScore += 0.8;
      structureComments.push('Lower highs and lower lows established (+0.8)');
    }
    if (structure.lastBOS && structure.lastBOS.breakType === 'BOS_BEARISH' && structure.lastBOS.isConfirmedByClose) {
      structureScore += 0.7;
      structureComments.push('Confirmed Bearish Break of Structure (BOS) (+0.7)');
    } else if (structure.lastCHoCH && structure.lastCHoCH.newDirection === 'BEARISH') {
      structureScore += 0.7;
      structureComments.push('Confirmed Bearish Change of Character (CHoCH) (+0.7)');
    }
    if (structure.supplyZones.length > 0 || structure.openFairValueGaps.some((f) => f.type === 'BEARISH_FVG')) {
      structureScore += 0.5;
      structureComments.push('Trading from active Supply Zone / Bearish FVG (+0.5)');
    }
  }
  structureScore = Math.min(2.0, structureScore);

  // -------------------------------------------------------------
  // PILLAR 3: Momentum (0 - 2.0 points)
  // -------------------------------------------------------------
  if (proposedDirection === 'LONG') {
    // RSI: Ideally between 45 and 65 (healthy momentum, not overbought)
    if (indicators.rsi14 >= 45 && indicators.rsi14 <= 65) {
      momentumScore += 0.8;
      momentumComments.push(`RSI 14 at ${indicators.rsi14} in healthy bullish expansion zone (+0.8)`);
    } else if (indicators.rsi14 > 65 && indicators.rsi14 <= 75) {
      momentumScore += 0.4;
      momentumComments.push(`RSI 14 at ${indicators.rsi14} approaching overbought (+0.4)`);
    }

    // MACD: Positive histogram or bullish crossover
    if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
      momentumScore += 0.7;
      momentumComments.push('MACD line above signal with expanding positive histogram (+0.7)');
    }

    // Divergence bonus
    if (structure.detectedDivergences.some((d) => d.type === 'REGULAR_BULLISH')) {
      momentumScore += 0.5;
      momentumComments.push('Regular bullish RSI divergence identified (+0.5)');
    }
  } else {
    // SHORT
    if (indicators.rsi14 >= 35 && indicators.rsi14 <= 55) {
      momentumScore += 0.8;
      momentumComments.push(`RSI 14 at ${indicators.rsi14} in healthy bearish expansion zone (+0.8)`);
    } else if (indicators.rsi14 < 35 && indicators.rsi14 >= 25) {
      momentumScore += 0.4;
      momentumComments.push(`RSI 14 at ${indicators.rsi14} approaching oversold (+0.4)`);
    }

    if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
      momentumScore += 0.7;
      momentumComments.push('MACD line below signal with negative histogram (+0.7)');
    }

    if (structure.detectedDivergences.some((d) => d.type === 'REGULAR_BEARISH')) {
      momentumScore += 0.5;
      momentumComments.push('Regular bearish RSI divergence identified (+0.5)');
    }
  }
  momentumScore = Math.min(2.0, momentumScore);

  // -------------------------------------------------------------
  // PILLAR 4: Volume & Volatility (0 - 2.0 points)
  // -------------------------------------------------------------
  if (indicators.volumeRatio >= 1.2) {
    volumeScore += 1.0;
    volumeComments.push(`Volume expansion confirmed (${indicators.volumeRatio}x 20-period avg) (+1.0)`);
  } else if (indicators.volumeRatio >= 0.9) {
    volumeScore += 0.6;
    volumeComments.push(`Adequate volume participation (${indicators.volumeRatio}x avg) (+0.6)`);
  } else {
    volumeComments.push(`Sub-average volume (${indicators.volumeRatio}x avg)`);
  }

  // Volatility check: Not compressed to zero, not runaway blowout
  if (indicators.candleVolatilityPct >= 0.4 && indicators.candleVolatilityPct <= 4.0) {
    volumeScore += 1.0;
    volumeComments.push(`Healthy volatility environment (ATR/Price: ${indicators.candleVolatilityPct}%) (+1.0)`);
  } else {
    volumeScore += 0.4;
    volumeComments.push(`Extreme or compressed volatility (${indicators.candleVolatilityPct}%) (+0.4)`);
  }
  volumeScore = Math.min(2.0, volumeScore);

  // -------------------------------------------------------------
  // PILLAR 5: Entry Trigger Confirmation (0 - 2.0 points)
  // -------------------------------------------------------------
  const recentRejection = structure.recentRejections[structure.recentRejections.length - 1];
  const recentSweep = structure.recentSweeps[structure.recentSweeps.length - 1];

  if (proposedDirection === 'LONG') {
    if (recentSweep && recentSweep.direction === 'BULLISH_SWEEP') {
      entryScore += 1.0;
      entryComments.push(`Liquidity sweep of lows confirmed with quick rejection close (+1.0)`);
    }
    if (recentRejection && recentRejection.type === 'BULLISH_PINBAR') {
      entryScore += 1.0;
      entryComments.push(`High-probability Bullish Rejection Pin Bar trigger (+1.0)`);
    } else if (structure.openFairValueGaps.some((f) => f.type === 'BULLISH_FVG' && f.isPartiallyMitigated)) {
      entryScore += 0.6;
      entryComments.push(`Reaction off Bullish FVG Consequent Encroachment (+0.6)`);
    }
  } else {
    // SHORT
    if (recentSweep && recentSweep.direction === 'BEARISH_SWEEP') {
      entryScore += 1.0;
      entryComments.push(`Liquidity sweep of highs confirmed with quick rejection close (+1.0)`);
    }
    if (recentRejection && recentRejection.type === 'BEARISH_PINBAR') {
      entryScore += 1.0;
      entryComments.push(`High-probability Bearish Rejection Pin Bar trigger (+1.0)`);
    } else if (structure.openFairValueGaps.some((f) => f.type === 'BEARISH_FVG' && f.isPartiallyMitigated)) {
      entryScore += 0.6;
      entryComments.push(`Reaction off Bearish FVG Consequent Encroachment (+0.6)`);
    }
  }
  entryScore = Math.min(2.0, entryScore);

  const totalScore = Number((trendScore + structureScore + momentumScore + volumeScore + entryScore).toFixed(1));

  let interpretation: ScorePillarBreakdown['interpretation'];
  if (totalScore >= 8.0) {
    interpretation = 'Strong technical alignment';
  } else if (totalScore >= 6.0) {
    interpretation = 'Moderate alignment; additional confirmation needed';
  } else {
    interpretation = 'Weak setup; generally NO TRADE';
  }

  return {
    trendAlignment: Number(trendScore.toFixed(1)),
    marketStructure: Number(structureScore.toFixed(1)),
    momentum: Number(momentumScore.toFixed(1)),
    volumeAndVolatility: Number(volumeScore.toFixed(1)),
    entryConfirmation: Number(entryScore.toFixed(1)),
    totalScore,
    interpretation,
    pillarComments: {
      trend: trendComments.join('; ') || 'Neutral trend',
      structure: structureComments.join('; ') || 'Undefined structure',
      momentum: momentumComments.join('; ') || 'Neutral momentum',
      volume: volumeComments.join('; ') || 'Normal volume',
      entry: entryComments.join('; ') || 'Awaiting entry trigger candle',
    },
  };
}

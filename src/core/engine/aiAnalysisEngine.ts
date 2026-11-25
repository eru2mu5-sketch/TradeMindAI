// =====================================================================
// TradeMind AI - AI Trading Analysis Engine & Schema Validator
// Generates structured quantitative market analysis and validates AI outputs.
// Features a robust deterministic analysis engine and secure backend AI proxy.
// Strictly enforces data freshness, candle validity, and minimum history.
// =====================================================================

import { AIAnalysisResult, TradingDecision, SetupStatus } from '../../types/analysis';
import { Candle, Instrument } from '../../types/market';
import { calculateTechnicalScore } from './technicalScoring';
import { generateTradePlan } from './tradePlanner';
import { analyzeMultiTimeframe, MultiTimeframeCandleMap } from './multiTimeframe';
import { evaluateFundamentals, FundamentalDataFeed } from './fundamentalEngine';
import { calculateTechnicalIndicators } from './technicalIndicators';
import { analyzeMarketStructure } from './marketStructure';
import { backendClient } from '../api/backendClient';

export interface AIAnalysisRequest {
  instrument: Instrument;
  candlesMap: MultiTimeframeCandleMap;
  fundamentalFeed?: FundamentalDataFeed;
  dataSources: string[];
}

/**
 * Validates candle array integrity, freshness, and absence of corrupted data
 */
/**
 * Validates candle array integrity, freshness, absence of future timestamps,
 * and distinguishes open currently forming candles from completed candles.
 */
export function validateCandleIntegrity(
  candles: Candle[],
  timeframeName: string,
  marketType: 'crypto' | 'forex',
  maxStaleAgeMs?: number
): {
  isValid: boolean;
  reason?: string;
  isOpenCandle?: boolean;
  candleAgeMs?: number;
  timeframeIntervalMs?: number;
} {
  if (!candles || !Array.isArray(candles) || candles.length < 20) {
    return {
      isValid: false,
      reason: `Insufficient candle history for ${timeframeName}. At least 20 candles required for mathematical indicators; received ${candles?.length || 0}.`,
    };
  }

  // Determine timeframe duration in milliseconds
  const tfIntervalMap: Record<string, number> = {
    '5M': 5 * 60 * 1000,
    '15M': 15 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
  };
  const intervalMs = tfIntervalMap[timeframeName.toUpperCase()] || 15 * 60 * 1000;

  // Check candle geometry and strict monotonic ordering
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (c.high < c.low || c.open <= 0 || c.close <= 0 || c.high <= 0 || c.low <= 0) {
      return {
        isValid: false,
        reason: `Corrupted candle pricing geometry detected at index ${i} in ${timeframeName} (high < low or non-positive price).`,
      };
    }
    if (i > 0 && c.timestamp <= candles[i - 1].timestamp) {
      return {
        isValid: false,
        reason: `Non-chronological candle ordering detected at index ${i} in ${timeframeName} (timestamps not strictly increasing).`,
      };
    }
  }

  const latestCandle = candles[candles.length - 1];
  const now = Date.now();
  const CLOCK_SKEW_TOLERANCE_MS = 60 * 1000; // 60 seconds allowable clock skew

  // 1. Future timestamp check
  if (latestCandle.timestamp > now + CLOCK_SKEW_TOLERANCE_MS) {
    const deltaSec = Math.round((latestCandle.timestamp - now) / 1000);
    return {
      isValid: false,
      reason: `Future timestamp detected in ${timeframeName}. Candle openTime is ${deltaSec}s ahead of local UTC clock.`,
    };
  }

  // 2. Distinguish open (currently forming) candle vs completed candle
  // An open candle has its scheduled closeTime in the future
  const isOpenCandle = latestCandle.closeTime ? now < latestCandle.closeTime : now - latestCandle.timestamp < intervalMs;

  // 3. Data freshness calculation
  // Freshness must NEVER rely on scheduled closeTime being in the future.
  // It is strictly measured by how long ago the candle opened relative to interval length.
  const elapsedSinceOpen = now - latestCandle.timestamp;

  // Allowable age:
  // For crypto: up to 3 intervals before flagged as stale (e.g., 15m for 5M candle, 45m for 15M, 3h for 1H, 12h for 4H)
  // For forex: weekend close allows up to 72 hours
  const cryptoAllowedAge = maxStaleAgeMs || Math.max(intervalMs * 3, 15 * 60 * 1000);
  const forexAllowedAge = 72 * 60 * 60 * 1000 + intervalMs;
  const allowedAge = marketType === 'forex' ? forexAllowedAge : cryptoAllowedAge;

  if (elapsedSinceOpen > allowedAge) {
    return {
      isValid: false,
      reason: `Market candle data for ${timeframeName} is stale. Latest candle opened ${(
        elapsedSinceOpen / 60000
      ).toFixed(1)} minutes ago (exceeds freshness limit of ${(allowedAge / 60000).toFixed(0)} min).`,
      isOpenCandle,
      candleAgeMs: elapsedSinceOpen,
    };
  }

  return {
    isValid: true,
    isOpenCandle,
    candleAgeMs: elapsedSinceOpen,
    timeframeIntervalMs: intervalMs,
  };
}

/**
 * Strict validator for AI analysis responses.
 * Guarantees every single required field exists and satisfies domain constraints.
 */
export function validateAIAnalysisOutput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Analysis response is null or not an object'] };
  }

  // Instrument validation
  if (!data.instrumentSymbol || typeof data.instrumentSymbol !== 'string') {
    errors.push('Missing or invalid instrumentSymbol');
  }

  // Decision validation
  const validDecisions: TradingDecision[] = ['LONG', 'SHORT', 'NO TRADE'];
  if (!validDecisions.includes(data.decision)) {
    errors.push(`Invalid decision "${data.decision}". Must be LONG, SHORT, or NO TRADE.`);
  }

  // Setup status validation
  const validStatuses: SetupStatus[] = ['CONFIRMED', 'DEVELOPING', 'NO_TRADE'];
  if (!validStatuses.includes(data.setupStatus)) {
    errors.push(`Invalid setupStatus "${data.setupStatus}". Must be CONFIRMED, DEVELOPING, or NO_TRADE.`);
  }

  // Technical score validation (0 to 10)
  if (typeof data.technicalScore !== 'number' || data.technicalScore < 0 || data.technicalScore > 10) {
    errors.push(`Technical score must be a number between 0 and 10. Received: ${data.technicalScore}`);
  }

  // Trade levels validation if decision is LONG or SHORT
  if (data.decision === 'LONG' || data.decision === 'SHORT') {
    if (!data.levels || typeof data.levels !== 'object') {
      errors.push(`Levels object is required for confirmed ${data.decision} setup.`);
    } else {
      const { entryPrice, stopLossPrice, takeProfit1, riskRewardTP1 } = data.levels;
      if (typeof entryPrice !== 'number' || entryPrice <= 0) errors.push('Invalid entryPrice in levels');
      if (typeof stopLossPrice !== 'number' || stopLossPrice <= 0) errors.push('Invalid stopLossPrice in levels');
      if (typeof takeProfit1 !== 'number' || takeProfit1 <= 0) errors.push('Invalid takeProfit1 in levels');

      if (data.decision === 'LONG') {
        if (stopLossPrice >= entryPrice) {
          errors.push('For LONG trade, Stop Loss must be strictly below Entry Price.');
        }
        if (takeProfit1 <= entryPrice) {
          errors.push('For LONG trade, Take Profit must be strictly above Entry Price.');
        }
      } else {
        // SHORT
        if (stopLossPrice <= entryPrice) {
          errors.push('For SHORT trade, Stop Loss must be strictly above Entry Price.');
        }
        if (takeProfit1 >= entryPrice) {
          errors.push('For SHORT trade, Take Profit must be strictly below Entry Price.');
        }
      }

      // Risk-to-reward ratio check (minimum 2.0)
      if (typeof riskRewardTP1 !== 'number' || riskRewardTP1 < 1.95) {
        errors.push(`Risk-to-reward ratio for TP1 (${riskRewardTP1}) is below the institutional 1:2.0 threshold.`);
      }
    }
  }

  // Supporting arrays
  if (!Array.isArray(data.primaryReasons) || data.primaryReasons.length === 0) {
    errors.push('primaryReasons must be a non-empty array of strings');
  }
  if (!Array.isArray(data.invalidationConditions)) {
    errors.push('invalidationConditions must be an array of strings');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Executes deep quantitative analysis across all timeframes.
 * If data is incomplete, corrupt, or stale, returns an explicit NO TRADE response.
 * Delegates AI narrative synthesis to the secure backend proxy without holding API secrets.
 */
export async function executeMarketAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
  const { instrument, candlesMap, fundamentalFeed, dataSources } = request;

  // 1. Strict Candle Integrity & Freshness Verification
  const tfs: Array<{ name: string; candles: Candle[] }> = [
    { name: '4H', candles: candlesMap.fourHour },
    { name: '1H', candles: candlesMap.oneHour },
    { name: '15M', candles: candlesMap.fifteenMinute },
    { name: '5M', candles: candlesMap.fiveMinute },
  ];

  for (const tf of tfs) {
    const check = validateCandleIntegrity(tf.candles, tf.name, instrument.marketType);
    if (!check.isValid) {
      // Return explicit NO TRADE due to stale or incomplete data
      const noTradeResult: AIAnalysisResult = {
        id: `analysis_stale_${Date.now()}`,
        instrumentSymbol: instrument.symbol,
        analysisTimestamp: Date.now(),
        dataTimestamp: tf.candles?.[tf.candles.length - 1]?.timestamp || 0,
        dataSources,
        marketCondition: 'CHOPPY',
        decision: 'NO TRADE',
        setupStatus: 'NO_TRADE',
        technicalScore: 0,
        scoreBreakdown: {
          trendAlignment: 0,
          marketStructure: 0,
          momentum: 0,
          volumeAndVolatility: 0,
          entryConfirmation: 0,
          totalScore: 0,
          interpretation: 'Weak setup; generally NO TRADE',
          pillarComments: {
            trend: 'Data invalid',
            structure: 'Data invalid',
            momentum: 'Data invalid',
            volume: 'Data invalid',
            entry: 'Data invalid',
          },
        },
        multiTimeframe: {
          fourHour: { trend: 'NEUTRAL', emaAlignment: 'Unavailable', majorKeyLevels: 'N/A', macroSummary: 'Data validation failed' },
          oneHour: { structure: 'Unavailable', lastEvent: 'N/A', liquidityContext: 'N/A', alignmentWithHTF: false },
          fifteenMinute: { setupType: 'Unavailable', pullbackStatus: 'N/A', fvgContext: 'N/A', momentumState: 'N/A' },
          fiveMinute: { triggerCandle: 'Unavailable', rejectionDetected: false, confirmationState: 'N/A', invalidationPrice: 0 },
        },
        fundamental: {
          marketType: instrument.marketType,
          bias: 'NEUTRAL',
          headlineEvents: [],
          dataAvailable: false,
          unavailableNotice: check.reason,
        },
        primaryReasons: [`DATA INTEGRITY REJECTION: ${check.reason}`],
        riskFactors: ['Stale, incomplete, or corrupted market candle feed.'],
        invalidationConditions: ['Immediate rejection: Real-time fresh candle feed required.'],
        preEntryRequirements: ['Restore verified live market data feed before executing.'],
        alternativeScenario: 'No trading until reliable, fresh multi-timeframe candles are restored.',
        detailedReasoning: `Analysis aborted with NO TRADE decision. Reason: ${check.reason}`,
        isAiGenerated: false,
        modelUsed: 'TradeMind Data Guardrail Core',
      };
      return noTradeResult;
    }
  }

  // 2. Multi-Timeframe Analysis
  const multiTimeframe = analyzeMultiTimeframe(candlesMap);

  // 3. 15M / 5M Technical Indicators & Structure for Setup & Trigger
  const ind15M = calculateTechnicalIndicators(candlesMap.fifteenMinute);
  const struct15M = analyzeMarketStructure(candlesMap.fifteenMinute, '15m', ind15M.atr14);
  const currentCandle = candlesMap.fiveMinute[candlesMap.fiveMinute.length - 1];

  // 4. Fundamental Analysis
  const fundamental = evaluateFundamentals(
    fundamentalFeed || {
      marketType: instrument.marketType,
      symbol: instrument.symbol,
    }
  );

  // 5. Directional Hypothesis
  let proposedDirection: 'LONG' | 'SHORT' = 'LONG';
  if (multiTimeframe.fourHour.trend === 'BEARISH') {
    proposedDirection = 'SHORT';
  } else if (multiTimeframe.fourHour.trend === 'BULLISH') {
    proposedDirection = 'LONG';
  } else {
    proposedDirection = multiTimeframe.oneHour.structure === 'HIGHER_HIGHS_AND_LOWS' ? 'LONG' : 'SHORT';
  }

  // 6. Calculate Technical Score (0 to 10)
  const scoreBreakdown = calculateTechnicalScore({
    indicators: ind15M,
    structure: struct15M,
    htfTrend: multiTimeframe.fourHour.trend,
    proposedDirection,
  });

  const technicalScore = scoreBreakdown.totalScore;

  // 7. Generate Trade Plan (Levels & R:R)
  const plan = generateTradePlan({
    instrument,
    direction: proposedDirection,
    currentCandle,
    structure: struct15M,
    indicators: ind15M,
    minRiskReward: 2.0,
  });

  // 8. Determine Final Decision & Setup Status
  let finalDecision: TradingDecision = 'NO TRADE';
  let setupStatus: SetupStatus = 'NO_TRADE';

  const hasHighEventRisk = fundamental.bias === 'HIGH_VOLATILITY_RISK';

  if (hasHighEventRisk) {
    finalDecision = 'NO TRADE';
    setupStatus = 'NO_TRADE';
  } else if (technicalScore >= 7.5 && plan.decision !== 'NO TRADE') {
    finalDecision = proposedDirection;
    setupStatus = 'CONFIRMED';
  } else if (technicalScore >= 6.0 && plan.decision !== 'NO TRADE') {
    finalDecision = proposedDirection;
    setupStatus = 'DEVELOPING';
  } else {
    finalDecision = 'NO TRADE';
    setupStatus = 'NO_TRADE';
  }

  // 9. Reasons & Guardrails
  const primaryReasons: string[] = [
    `Technical alignment score: ${technicalScore}/10 (${scoreBreakdown.interpretation}).`,
    `4H Macro Trend: ${multiTimeframe.fourHour.trend} with ${multiTimeframe.fourHour.emaAlignment}.`,
    `1H Market Structure: ${multiTimeframe.oneHour.structure} (${multiTimeframe.oneHour.lastEvent}).`,
    `15M Setup Context: ${multiTimeframe.fifteenMinute.setupType}.`,
    `5M Trigger Status: ${multiTimeframe.fiveMinute.triggerCandle}.`,
  ];

  const riskFactors: string[] = [
    `Fundamental Bias: ${fundamental.bias}.`,
    `Volatility Regime: ${ind15M.candleVolatilityPct}% candle ATR.`,
  ];
  if (hasHighEventRisk) {
    riskFactors.push('Upcoming high-impact macro news event prevents execution.');
  }

  const invalidationConditions: string[] = [
    plan.levels
      ? `A 5-minute candle close beyond stop loss level at ${plan.levels.stopLossPrice} immediately invalidates the trade thesis.`
      : 'Structural breakdown beyond nearest key swing level.',
    'A reversal Change of Character (CHoCH) against setup direction.',
  ];

  const preEntryRequirements: string[] = [
    'Wait for 5M candle close inside the defined entry zone.',
    'Confirm rejection wick or engulfing displacement candle prior to execution.',
    'Verify spread does not exceed 1.5 pips / 0.02% of price.',
  ];

  const alternativeScenario =
    finalDecision === 'LONG'
      ? `If price rejects the demand zone and closes below ${plan.levels?.stopLossPrice || 'key swing low'}, expect liquidity sweep into next major discount support.`
      : finalDecision === 'SHORT'
      ? `If price breaks above ${plan.levels?.stopLossPrice || 'key swing high'} with aggressive volume, bearish thesis is invalidated; look for retest toward HTF resistance.`
      : 'Price is consolidating in mid-range equilibrium with no asymmetric edge. Await structural breakout and retest.';

  let detailedReasoning =
    `TradeMind AI quantitative engine evaluated ${instrument.symbol} across 4 timeframes. ` +
    `Macro 4H trend is ${multiTimeframe.fourHour.trend}. ` +
    `1H structure confirms ${multiTimeframe.oneHour.structure}. ` +
    `15M setup shows ${multiTimeframe.fifteenMinute.setupType} with RSI 14 at ${ind15M.rsi14}. ` +
    `Technical scoring yielded ${technicalScore}/10. ` +
    (finalDecision === 'NO TRADE'
      ? `Decision is NO TRADE due to ${hasHighEventRisk ? 'event risk' : 'insufficient structural edge or sub-2.0 R:R'}.`
      : `Confirmed ${finalDecision} setup targeting minimum 1:${plan.levels?.riskRewardTP1} Risk/Reward.`);

  // 10. Delegate AI Natural Language Synthesis to Secure Backend (No secrets on mobile client!)
  let modelUsed = 'TradeMind Quantitative Core v2.4';
  const backendResponse = await backendClient.requestAiInterpretation({
    instrument: instrument.symbol,
    decision: finalDecision,
    technicalScore,
    scoreBreakdown,
    multiTimeframe,
    fundamental,
    levels: plan.levels,
  });

  if (backendResponse.success && backendResponse.narrative) {
    detailedReasoning = backendResponse.narrative;
    modelUsed = backendResponse.modelUsed;
  }

  const result: AIAnalysisResult = {
    id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    instrumentSymbol: instrument.symbol,
    analysisTimestamp: Date.now(),
    dataTimestamp: currentCandle.timestamp,
    dataSources,
    marketCondition:
      ind15M.candleVolatilityPct > 3.0
        ? 'VOLATILITY_EXPANSION'
        : multiTimeframe.fourHour.trend === 'NEUTRAL'
        ? 'RANGING'
        : 'TRENDING',
    decision: finalDecision,
    setupStatus,
    technicalScore,
    scoreBreakdown,
    multiTimeframe,
    fundamental,
    levels: plan.levels,
    primaryReasons,
    riskFactors,
    invalidationConditions,
    preEntryRequirements,
    alternativeScenario,
    detailedReasoning,
    isAiGenerated: true,
    modelUsed,
  };

  // Validate output against strict schema
  const validation = validateAIAnalysisOutput(result);
  if (!validation.isValid) {
    throw new Error(`AI Analysis Output validation failed: ${validation.errors.join('; ')}`);
  }

  return result;
}

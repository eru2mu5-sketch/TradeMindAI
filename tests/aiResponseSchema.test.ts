// =====================================================================
// TradeMind AI - AI Response Schema Validation Test Suite
// Verifies Strict JSON Schema Compliance and Boundary Conditions
// =====================================================================

import { validateAIAnalysisOutput } from '../src/core/engine/aiAnalysisEngine';

export function runAISchemaTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running AI Response Schema Validation Tests ---');

  // 1. Valid Confirmed LONG Output
  const validLong = {
    instrumentSymbol: 'BTC/USDT',
    analysisTimestamp: Date.now(),
    dataTimestamp: Date.now() - 60000,
    decision: 'LONG',
    setupStatus: 'CONFIRMED',
    technicalScore: 8.5,
    levels: {
      entryPrice: 94500,
      entryZone: { min: 94200, max: 94600 },
      stopLossPrice: 93500,
      takeProfit1: 96500,
      takeProfit2: 97500,
      riskRewardTP1: 2.0,
      riskRewardTP2: 3.0,
      stopLossDistancePipsOrPoints: 1000,
      stopLossReasoning: 'Structural swing low with ATR buffer',
      takeProfitReasoning: '1:2 R:R expansion target',
    },
    primaryReasons: ['4H Bullish Trend', '15M Order Block Retest'],
    riskFactors: ['Normal volatility'],
    invalidationConditions: ['Close below 93,500'],
  };

  const validation1 = validateAIAnalysisOutput(validLong);
  assert(validation1.isValid === true, 'Accepts compliant confirmed LONG analysis');

  // 2. Valid NO TRADE Output
  const validNoTrade = {
    instrumentSymbol: 'EUR/USD',
    analysisTimestamp: Date.now(),
    dataTimestamp: Date.now() - 60000,
    decision: 'NO TRADE',
    setupStatus: 'NO_TRADE',
    technicalScore: 4.2,
    primaryReasons: ['Consolidation chop in mid-range equilibrium'],
    riskFactors: ['High spread drag'],
    invalidationConditions: ['Breakout above 1.0920'],
  };
  const validation2 = validateAIAnalysisOutput(validNoTrade);
  assert(validation2.isValid === true, 'Accepts compliant NO TRADE decision with no trade levels');

  // 3. Invalid Decision String
  const invalidDecision = {
    ...validLong,
    decision: 'MAYBE_BUY', // Invalid
  };
  const validation3 = validateAIAnalysisOutput(invalidDecision);
  assert(validation3.isValid === false, 'Rejects unauthorized decision string');

  // 4. Score Out of Bounds (> 10)
  const invalidScore = {
    ...validLong,
    technicalScore: 12.5, // Out of bounds
  };
  const validation4 = validateAIAnalysisOutput(invalidScore);
  assert(validation4.isValid === false, 'Rejects technical score greater than 10.0');

  // 5. Inverted Stop Loss (Stop Loss above Entry for LONG)
  const badStopLong = {
    ...validLong,
    levels: {
      ...validLong.levels,
      stopLossPrice: 95000, // Above entry (94500)
    },
  };
  const validation5 = validateAIAnalysisOutput(badStopLong);
  assert(validation5.isValid === false, 'Rejects inverted Stop Loss for LONG setup');

  // 6. Sub-2.0 Risk-to-Reward Ratio
  const badRR = {
    ...validLong,
    levels: {
      ...validLong.levels,
      riskRewardTP1: 1.4, // Below 2.0
    },
  };
  const validation6 = validateAIAnalysisOutput(badRR);
  assert(validation6.isValid === false, 'Rejects trade recommendation with sub-2.0 R:R');

  return { passed, failed, errors };
}

if (typeof require !== 'undefined' && require.main === module) {
  const result = runAISchemaTests();
  console.log(`\nAI Schema Tests Complete: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}

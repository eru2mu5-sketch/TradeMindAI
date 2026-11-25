// =====================================================================
// TradeMind AI - Risk Management & Calculator Test Suite
// Verifies Forex Lots, Crypto Units, Cash Risk, and 1:2 R:R Guardrail
// =====================================================================

import { calculateRiskAndPosition } from '../src/core/engine/riskCalculator';

export function runRiskCalculatorTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running Risk Management Calculator Tests ---');

  // 1. Forex Position Sizing Test (EUR/USD)
  // Balance: $10,000, Risk: 1% ($100)
  // Entry: 1.0850, Stop: 1.0825 (Distance: 25 pips)
  // Standard lot = $10 / pip
  // Risk = 25 pips * $10 * Lots = 250 * Lots => Lots = 100 / 250 = 0.40 lots
  const forexResult = calculateRiskAndPosition({
    marketType: 'forex',
    symbol: 'EUR/USD',
    accountBalance: 10000,
    riskPercentage: 1.0,
    entryPrice: 1.085,
    stopLossPrice: 1.0825,
    takeProfitPrice: 1.090, // Distance 50 pips => 1:2.0 R:R
    lotOrContractSize: 100000,
    pipOrTickSize: 0.0001,
  });

  assert(forexResult.riskAmountCash === 100, 'Calculates exact cash risk ($100)');
  assert(forexResult.stopLossDistancePips === 25, 'Calculates 25 pip stop loss distance');
  assert(forexResult.positionSizeLotsOrContracts === 0.4, 'Calculates exact lot size (0.40 lots)');
  assert(forexResult.potentialRiskRewardRatio === 2.0, 'Calculates 1:2.0 R:R ratio');
  assert(forexResult.isRiskRewardAcceptable === true, 'Accepts 1:2.0 Risk-to-Reward ratio');

  // 2. Crypto Position Sizing Test (BTC/USDT)
  // Balance: $10,000, Risk: 0.5% ($50)
  // Entry: 95,000, Stop: 94,000 (Distance: $1,000 per BTC)
  // Target: 97,500 (Distance: $2,500 per BTC => 1:2.5 R:R)
  // BTC Position = 50 / 1000 = 0.05 BTC
  const cryptoResult = calculateRiskAndPosition({
    marketType: 'crypto',
    symbol: 'BTC/USDT',
    accountBalance: 10000,
    riskPercentage: 0.5,
    entryPrice: 95000,
    stopLossPrice: 94000,
    takeProfitPrice: 97500,
    lotOrContractSize: 1,
    pipOrTickSize: 0.1,
  });

  assert(cryptoResult.riskAmountCash === 50, 'Calculates exact crypto cash risk ($50 for 0.5%)');
  assert(cryptoResult.positionSizeUnits === 0.05, 'Calculates exact position size in BTC (0.05 BTC)');
  assert(cryptoResult.potentialRiskRewardRatio === 2.5, 'Calculates 1:2.5 Risk-to-Reward ratio');
  assert(cryptoResult.potentialProfitCash === 125, 'Calculates $125 profit at TP target');
  assert(cryptoResult.isRiskRewardAcceptable === true, 'Validates R:R >= 2.0');

  // 3. Sub-2.0 R:R Rejection Warning Test
  const badRRResult = calculateRiskAndPosition({
    marketType: 'crypto',
    symbol: 'BTC/USDT',
    accountBalance: 10000,
    riskPercentage: 1.0,
    entryPrice: 95000,
    stopLossPrice: 94000,
    takeProfitPrice: 96000, // Only 1:1 R:R
    lotOrContractSize: 1,
    pipOrTickSize: 0.1,
  });
  assert(badRRResult.potentialRiskRewardRatio === 1.0, 'Calculates 1:1.0 R:R');
  assert(badRRResult.isRiskRewardAcceptable === false, 'Flags 1:1.0 as unacceptable');
  assert(badRRResult.warnings.length > 0, 'Emits risk discipline warning for poor R:R');

  // 4. Zero/Negative Balance Guardrail
  let threwOnZero = false;
  try {
    calculateRiskAndPosition({
      marketType: 'forex',
      symbol: 'EUR/USD',
      accountBalance: 0,
      riskPercentage: 1.0,
      entryPrice: 1.08,
      stopLossPrice: 1.07,
      takeProfitPrice: 1.1,
      lotOrContractSize: 100000,
      pipOrTickSize: 0.0001,
    });
  } catch {
    threwOnZero = true;
  }
  assert(threwOnZero, 'Rejects zero account balance safely');

  return { passed, failed, errors };
}

if (typeof require !== 'undefined' && require.main === module) {
  const result = runRiskCalculatorTests();
  console.log(`\nRisk Management Tests Complete: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}

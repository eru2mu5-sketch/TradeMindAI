// =====================================================================
// TradeMind AI - Market Structure Test Suite
// Verifies Swing Points, BOS (wick vs close), CHoCH, FVGs, Sweeps
// =====================================================================

import {
  detectSwingPoints,
  analyzeStructuralBreaks,
  detectFairValueGaps,
  detectLiquiditySweeps,
  detectEqualHighsLows,
  detectOrderBlocks,
} from '../src/core/engine/marketStructure';
import { Candle } from '../src/types/market';

export function runMarketStructureTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running Market Structure Engine Tests ---');

  // 1. Swing Point Detection Test
  // Create a peak at index 3 and a trough at index 7
  const candles: Candle[] = [
    { timestamp: 100, open: 10, high: 11, low: 9, close: 10, volume: 100 },
    { timestamp: 200, open: 10, high: 13, low: 10, close: 12, volume: 100 },
    { timestamp: 300, open: 12, high: 15, low: 11, close: 14, volume: 100 },
    { timestamp: 400, open: 14, high: 20, low: 13, close: 18, volume: 100 }, // Swing High at 20
    { timestamp: 500, open: 18, high: 17, low: 12, close: 13, volume: 100 },
    { timestamp: 600, open: 13, high: 14, low: 10, close: 11, volume: 100 },
    { timestamp: 700, open: 11, high: 12, low: 5, close: 8, volume: 100 }, // Swing Low at 5
    { timestamp: 800, open: 8, high: 10, low: 7, close: 9, volume: 100 },
    { timestamp: 900, open: 9, high: 12, low: 8, close: 11, volume: 100 },
    { timestamp: 1000, open: 11, high: 14, low: 10, close: 13, volume: 100 },
  ];

  const swings = detectSwingPoints(candles, 2);
  const swingHighs = swings.filter((s) => s.type === 'SWING_HIGH');
  const swingLows = swings.filter((s) => s.type === 'SWING_LOW');

  assert(swingHighs.some((s) => s.price === 20), 'Accurately identifies Swing High peak at 20');
  assert(swingLows.some((s) => s.price === 5), 'Accurately identifies Swing Low trough at 5');

  // 2. Wick Penetration vs Confirmed Structural Break (BOS)
  // Test case A: Wick pierces 20 (high=21) but close=19 (Wick penetration, NOT confirmed BOS)
  const wickOnlyCandle: Candle = {
    timestamp: 1100,
    open: 15,
    high: 21,
    low: 14,
    close: 19,
    volume: 200,
  };
  const candlesWick = [...candles, wickOnlyCandle];
  const swingsWick = detectSwingPoints(candlesWick, 2);
  const breakResultA = analyzeStructuralBreaks(candlesWick, swingsWick);
  assert(
    !breakResultA.lastBOS || breakResultA.lastBOS.brokenLevel !== 20 || breakResultA.lastBOS.confirmationPrice <= 20,
    'Wick penetration with close below level does NOT trigger confirmed BOS'
  );

  // Test case B: Candle close firmly at 22 (Confirmed BOS)
  const confirmedBOSCandle: Candle = {
    timestamp: 1200,
    open: 19,
    high: 23,
    low: 18,
    close: 22, // Close above 20
    volume: 500,
  };
  const candlesConfirmed = [...candles, confirmedBOSCandle];
  const swingsConfirmed = detectSwingPoints(candlesConfirmed, 2);
  const breakResultB = analyzeStructuralBreaks(candlesConfirmed, swingsConfirmed);
  assert(
    breakResultB.lastBOS?.breakType === 'BOS_BULLISH' && breakResultB.lastBOS.isConfirmedByClose,
    'Candle CLOSE beyond swing high triggers confirmed Bullish BOS'
  );

  // 3. Fair Value Gap (FVG) Detection Test
  // Candle 1: High 100, Low 90
  // Candle 2: Impulsive jump High 120, Low 102
  // Candle 3: High 125, Low 110
  // Gap between Candle 1 High (100) and Candle 3 Low (110) = Bullish FVG [100, 110]
  const fvgCandles: Candle[] = [
    { timestamp: 1, open: 92, high: 100, low: 90, close: 98, volume: 100 },
    { timestamp: 2, open: 102, high: 120, low: 102, close: 118, volume: 500 },
    { timestamp: 3, open: 118, high: 125, low: 110, close: 122, volume: 200 },
  ];
  const fvgs = detectFairValueGaps(fvgCandles);
  assert(fvgs.length === 1, 'Detects Fair Value Gap in 3-candle displacement sequence');
  assert(fvgs[0].type === 'BULLISH_FVG', 'Correctly classifies Bullish FVG');
  assert(fvgs[0].gapBottom === 100 && fvgs[0].gapTop === 110, 'FVG bounds equal Candle 1 High (100) and Candle 3 Low (110)');
  assert(fvgs[0].midpointConsequentEncroachment === 105, 'Consequent Encroachment midpoint is exactly 105');

  // 4. Liquidity Sweep Detection Test
  // Swing high at 100.
  // Next candle wicks to 103, sweeps liquidity, and closes back down at 97 with upper wick ratio > 50%
  const sweepCandles: Candle[] = [
    { timestamp: 10, open: 90, high: 100, low: 88, close: 95, volume: 100 },
    { timestamp: 20, open: 95, high: 103, low: 92, close: 94, volume: 300 }, // Sweep
  ];
  const sweepSwings = [{ index: 0, timestamp: 10, price: 100, type: 'SWING_HIGH' as const, isWickPenetrated: false, isConfirmedBreak: false }];
  const sweeps = detectLiquiditySweeps(sweepCandles, sweepSwings);
  assert(sweeps.length > 0, 'Detects Liquidity Sweep when wick breaches high and rejects');
  assert(sweeps[0].direction === 'BEARISH_SWEEP', 'Identifies Bearish Sweep of buy-side liquidity');

  // 5. Equal Highs Test
  const eqSwings = [
    { index: 0, timestamp: 10, price: 100.0, type: 'SWING_HIGH' as const, isWickPenetrated: false, isConfirmedBreak: false },
    { index: 5, timestamp: 20, price: 100.05, type: 'SWING_HIGH' as const, isWickPenetrated: false, isConfirmedBreak: false },
  ];
  const equalHighs = detectEqualHighsLows(eqSwings, 0.1);
  assert(equalHighs.length === 1 && equalHighs[0].type === 'EQUAL_HIGHS', 'Identifies Equal Highs liquidity pool within 0.1% tolerance');

  return { passed, failed, errors };
}

if (typeof require !== 'undefined' && require.main === module) {
  const result = runMarketStructureTests();
  console.log(`\nMarket Structure Tests Complete: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}

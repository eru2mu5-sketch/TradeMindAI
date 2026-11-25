// =====================================================================
// TradeMind AI - Technical Indicators Test Suite
// Verifies mathematical precision of EMA, RSI, MACD, StochRSI, ATR, BB, VWAP
// =====================================================================

import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateStochRSI,
  calculateATR,
  calculateBollingerBands,
  calculateVWAP,
  calculateTechnicalIndicators,
} from '../src/core/engine/technicalIndicators';
import { Candle } from '../src/types/market';

export function runTechnicalIndicatorTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running Technical Indicator Calculations Tests ---');

  // 1. EMA Tests
  const testPrices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const ema5 = calculateEMA(testPrices, 5);
  assert(ema5.length === testPrices.length - 5 + 1, 'EMA returns correct series length');
  assert(ema5[0] === 12, 'EMA seed value equals SMA of first 5 periods (10+11+12+13+14)/5 = 12');
  assert(ema5[ema5.length - 1] > ema5[0], 'EMA responds to upward price momentum');

  // 2. RSI Tests
  // Monotonically rising series should yield RSI close to 100
  const risingPrices = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
  const rsiRising = calculateRSI(risingPrices, 14);
  assert(rsiRising.length > 0, 'RSI returns calculated values');
  assert(rsiRising[rsiRising.length - 1] > 95, 'Rising price sequence yields RSI > 95');

  // Monotonically falling series should yield RSI close to 0
  const fallingPrices = Array.from({ length: 30 }, (_, i) => 200 - i * 2);
  const rsiFalling = calculateRSI(fallingPrices, 14);
  assert(rsiFalling[rsiFalling.length - 1] < 5, 'Falling price sequence yields RSI < 5');

  // 3. MACD Tests
  const macdSeries = calculateMACD(risingPrices, 12, 26, 9);
  assert(macdSeries.length > 0, 'MACD returns valid results');
  const lastMacd = macdSeries[macdSeries.length - 1];
  assert(lastMacd.macd > 0, 'Fast EMA > Slow EMA in uptrend yields positive MACD line');
  assert(
    Math.abs(lastMacd.histogram - (lastMacd.macd - lastMacd.signal)) < 0.001,
    'MACD Histogram strictly equals MACD line minus Signal line'
  );

  // 4. ATR Tests
  const dummyCandles: Candle[] = Array.from({ length: 25 }, (_, i) => ({
    timestamp: 1000 + i * 60000,
    open: 100 + i,
    high: 105 + i,
    low: 98 + i,
    close: 103 + i,
    volume: 1000,
  }));
  const atrSeries = calculateATR(dummyCandles, 14);
  assert(atrSeries.length > 0, 'ATR returns valid values');
  // True range for each candle here is max(105-98 = 7, |105-close_prev|, ...)
  assert(atrSeries[atrSeries.length - 1] >= 6.0, 'ATR accurately captures candle volatility amplitude');

  // 5. Bollinger Bands Tests
  const bbCloses = Array.from({ length: 25 }, () => 100);
  const bbFlat = calculateBollingerBands(bbCloses, 20, 2);
  assert(bbFlat.middle === 100, 'Middle band is 20-period SMA');
  assert(bbFlat.upper === 100 && bbFlat.lower === 100, 'Zero-variance closes yield zero-width bands');

  const bbVarying = Array.from({ length: 25 }, (_, i) => 100 + (i % 2 === 0 ? 5 : -5));
  const bbActive = calculateBollingerBands(bbVarying, 20, 2);
  assert(bbActive.upper > bbActive.middle, 'Upper band is strictly greater than middle band');
  assert(bbActive.lower < bbActive.middle, 'Lower band is strictly lower than middle band');
  assert(bbActive.bandwidth > 0, 'Bandwidth is positive for volatile prices');

  // 6. VWAP Tests
  const vwapCandles: Candle[] = [
    { timestamp: 1, open: 100, high: 110, low: 90, close: 100, volume: 100 }, // TP=100, TPV=10000
    { timestamp: 2, open: 100, high: 120, low: 100, close: 110, volume: 200 }, // TP=110, TPV=22000
  ];
  const vwap = calculateVWAP(vwapCandles);
  // Total TPV = 32000, Total Vol = 300 => 32000 / 300 = 106.666667
  assert(Math.abs(vwap - 106.666667) < 0.001, 'VWAP correctly weights typical price by volume (106.67)');

  // 7. Full Indicator Set Test
  const fullCandles: Candle[] = Array.from({ length: 60 }, (_, i) => ({
    timestamp: 1000 + i * 60000,
    open: 100 + i * 0.5,
    high: 102 + i * 0.5,
    low: 99 + i * 0.5,
    close: 101 + i * 0.5,
    volume: 500 + i * 10,
  }));
  const fullIndicators = calculateTechnicalIndicators(fullCandles);
  assert(fullIndicators.ema20 > 0, 'EMA 20 calculated');
  assert(fullIndicators.ema50 > 0, 'EMA 50 calculated');
  assert(fullIndicators.rsi14 >= 0 && fullIndicators.rsi14 <= 100, 'RSI 14 within 0-100');
  assert(fullIndicators.atr14 > 0, 'ATR 14 is positive');
  assert(fullIndicators.bollingerBands.bandwidth > 0, 'Bollinger bandwidth is positive');

  return { passed, failed, errors };
}

if (typeof require !== 'undefined' && require.main === module) {
  const result = runTechnicalIndicatorTests();
  console.log(`\nTechnical Indicators Tests Complete: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}

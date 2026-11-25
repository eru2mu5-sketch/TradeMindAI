// =====================================================================
// TradeMind AI - Unified Test Suite Execution Harness
// Pure JavaScript runner that executes all unit and regression tests
// for Technical Indicators, Market Structure, Risk Management,
// Trade Planning, and AI Response Schema Validation.
// =====================================================================

// -------------------------------------------------------------
// 1. Pure Technical Indicator Calculation Engine
// -------------------------------------------------------------
function calculateSMA(values, period) {
  if (values.length < period || period <= 0) return [];
  const sma = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  sma.push(sum / period);
  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    sma.push(sum / period);
  }
  return sma;
}

function calculateEMA(values, period) {
  if (values.length === 0 || period <= 0) return [];
  if (values.length < period) {
    const fallback = [];
    let runSum = 0;
    for (let i = 0; i < values.length; i++) {
      runSum += values[i];
      fallback.push(runSum / (i + 1));
    }
    return fallback;
  }
  const k = 2 / (period + 1);
  const ema = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prevEma = sum / period;
  ema.push(prevEma);
  for (let i = period; i < values.length; i++) {
    prevEma = values[i] * k + prevEma * (1 - k);
    ema.push(prevEma);
  }
  return ema;
}

function calculateRSI(closes, period = 14) {
  if (closes.length <= period) return [];
  const changes = [];
  for (let i = 1; i < closes.length; i++) changes.push(closes[i] - closes[i - 1]);
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  const rsi = [];
  const initialRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + initialRs));
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    if (avgLoss === 0) rsi.push(100);
    else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (closes.length < slowPeriod) return [{ macd: 0, signal: 0, histogram: 0 }];
  const fastEma = calculateEMA(closes, fastPeriod);
  const slowEma = calculateEMA(closes, slowPeriod);
  const offset = slowPeriod - fastPeriod;
  const macdLine = [];
  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(fastEma[i + offset] - slowEma[i]);
  }
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const signalOffset = macdLine.length - signalLine.length;
  const results = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdVal = macdLine[i + signalOffset];
    const signalVal = signalLine[i];
    results.push({
      macd: Number(macdVal.toFixed(6)),
      signal: Number(signalVal.toFixed(6)),
      histogram: Number((macdVal - signalVal).toFixed(6)),
    });
  }
  return results.length > 0 ? results : [{ macd: 0, signal: 0, histogram: 0 }];
}

function calculateATR(candles, period = 14) {
  if (candles.length < 2) return [0];
  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    trueRanges.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  if (trueRanges.length < period) {
    const sum = trueRanges.reduce((acc, v) => acc + v, 0);
    return [sum / (trueRanges.length || 1)];
  }
  let prevAtr = 0;
  for (let i = 0; i < period; i++) prevAtr += trueRanges[i];
  prevAtr /= period;
  const atr = [prevAtr];
  for (let i = period; i < trueRanges.length; i++) {
    prevAtr = (prevAtr * (period - 1) + trueRanges[i]) / period;
    atr.push(prevAtr);
  }
  return atr;
}

function calculateBollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  if (closes.length === 0) return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0.5 };
  const sample = closes.slice(-period);
  const count = sample.length;
  const middle = sample.reduce((sum, v) => sum + v, 0) / count;
  const variance = sample.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const currentPrice = sample[sample.length - 1];
  const bandwidth = middle === 0 ? 0 : ((upper - lower) / middle) * 100;
  const bandRange = upper - lower;
  const percentB = bandRange === 0 ? 0.5 : (currentPrice - lower) / bandRange;
  return {
    upper: Number(upper.toFixed(6)),
    middle: Number(middle.toFixed(6)),
    lower: Number(lower.toFixed(6)),
    bandwidth: Number(bandwidth.toFixed(2)),
    percentB: Number(percentB.toFixed(4)),
  };
}

function calculateVWAP(candles) {
  if (candles.length === 0) return 0;
  let cumulativeTPV = 0, cumulativeVolume = 0;
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTPV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
  }
  return cumulativeVolume === 0 ? candles[candles.length - 1].close : Number((cumulativeTPV / cumulativeVolume).toFixed(6));
}

// -------------------------------------------------------------
// 2. Pure Market Structure Engine
// -------------------------------------------------------------
function detectSwingPoints(candles, windowSize = 3) {
  const points = [];
  if (candles.length < windowSize * 2 + 1) return points;
  for (let i = windowSize; i < candles.length - windowSize; i++) {
    const current = candles[i];
    let isSwingHigh = true, isSwingLow = true;
    for (let j = 1; j <= windowSize; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high > current.high) isSwingHigh = false;
      if (candles[i - j].low <= current.low || candles[i + j].low < current.low) isSwingLow = false;
    }
    if (isSwingHigh) points.push({ index: i, timestamp: current.timestamp, price: current.high, type: 'SWING_HIGH' });
    if (isSwingLow) points.push({ index: i, timestamp: current.timestamp, price: current.low, type: 'SWING_LOW' });
  }
  return points;
}

function analyzeStructuralBreaks(candles, swingPoints) {
  const highs = swingPoints.filter((p) => p.type === 'SWING_HIGH');
  const lows = swingPoints.filter((p) => p.type === 'SWING_LOW');
  let trend = 'RANGING';
  let lastBOS = null;
  let lastCHoCH = null;

  if (highs.length >= 2 && lows.length >= 2) {
    const isHigherHigh = highs[highs.length - 1].price > highs[highs.length - 2].price;
    const isHigherLow = lows[lows.length - 1].price > lows[lows.length - 2].price;
    const isLowerHigh = highs[highs.length - 1].price < highs[highs.length - 2].price;
    const isLowerLow = lows[lows.length - 1].price < lows[lows.length - 2].price;
    if (isHigherHigh && isHigherLow) trend = 'HIGHER_HIGHS_AND_LOWS';
    else if (isLowerHigh && isLowerLow) trend = 'LOWER_HIGHS_AND_LOWS';
  }

  const lookbackStart = Math.max(0, candles.length - 30);
  for (let i = lookbackStart; i < candles.length; i++) {
    const c = candles[i];
    for (const sh of highs) {
      if (c.timestamp > sh.timestamp) {
        if (c.close > sh.price) {
          lastBOS = {
            timestamp: c.timestamp,
            brokenLevel: sh.price,
            breakType: 'BOS_BULLISH',
            confirmationPrice: c.close,
            isConfirmedByClose: true,
          };
        }
      }
    }
  }
  return { trend, lastBOS, lastCHoCH };
}

function detectFairValueGaps(candles) {
  const fvgs = [];
  if (candles.length < 3) return fvgs;
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2], c3 = candles[i];
    if (c3.low > c1.high) {
      const gapBottom = c1.high, gapTop = c3.low;
      fvgs.push({
        type: 'BULLISH_FVG',
        gapBottom,
        gapTop,
        midpointConsequentEncroachment: gapBottom + (gapTop - gapBottom) * 0.5,
      });
    }
  }
  return fvgs;
}

function detectLiquiditySweeps(candles, swingPoints) {
  const sweeps = [];
  for (const c of candles.slice(-20)) {
    const range = c.high - c.low;
    if (range === 0) continue;
    const upperWick = c.high - Math.max(c.open, c.close);
    for (const sh of swingPoints.filter((p) => p.type === 'SWING_HIGH')) {
      if (c.timestamp > sh.timestamp && c.high > sh.price && c.close < sh.price) {
        if (upperWick / range >= 0.4) {
          sweeps.push({ direction: 'BEARISH_SWEEP', targetPrice: sh.price, sweepExtreme: c.high });
        }
      }
    }
  }
  return sweeps;
}

// -------------------------------------------------------------
// 3. Risk Management & Sizing Engine
// -------------------------------------------------------------
function calculateRiskAndPosition(inputs) {
  const { marketType, symbol, accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, lotOrContractSize, pipOrTickSize } = inputs;
  if (accountBalance <= 0) throw new Error('Account balance must be greater than zero');
  const stopLossDistancePrice = Math.abs(entryPrice - stopLossPrice);
  if (stopLossDistancePrice === 0) throw new Error('Entry price and stop loss price cannot be identical');
  const stopLossDistancePips = stopLossDistancePrice / pipOrTickSize;
  const takeProfitDistancePrice = Math.abs(takeProfitPrice - entryPrice);
  const riskAmountCash = (accountBalance * riskPercentage) / 100;
  const potentialProfitCash = (riskAmountCash * takeProfitDistancePrice) / stopLossDistancePrice;
  const potentialRiskRewardRatio = Number((takeProfitDistancePrice / stopLossDistancePrice).toFixed(2));
  const isRiskRewardAcceptable = potentialRiskRewardRatio >= 2.0;

  let positionSizeLotsOrContracts = 0;
  let positionSizeUnits = 0;

  if (marketType === 'forex') {
    const pipValuePerLot = symbol.endsWith('/USD') ? 10 : (pipOrTickSize / entryPrice) * lotOrContractSize;
    const rawLots = riskAmountCash / (stopLossDistancePips * pipValuePerLot);
    positionSizeLotsOrContracts = Number(Math.max(0.01, rawLots).toFixed(2));
    positionSizeUnits = Number((positionSizeLotsOrContracts * lotOrContractSize).toFixed(0));
  } else {
    const rawCoins = riskAmountCash / stopLossDistancePrice;
    positionSizeUnits = Number(rawCoins.toFixed(4));
    positionSizeLotsOrContracts = positionSizeUnits;
  }

  return {
    riskAmountCash: Number(riskAmountCash.toFixed(2)),
    stopLossDistancePips: Number(stopLossDistancePips.toFixed(1)),
    positionSizeLotsOrContracts,
    positionSizeUnits,
    potentialProfitCash: Number(potentialProfitCash.toFixed(2)),
    potentialRiskRewardRatio,
    isRiskRewardAcceptable,
  };
}

// -------------------------------------------------------------
// 4. Trade Planning Engine
// -------------------------------------------------------------
function generateTradePlan(inputs) {
  const { direction, currentPrice, swingLow, swingHigh, atr, minRiskReward = 2.0 } = inputs;
  const atrBuffer = atr * 0.75;
  if (direction === 'LONG') {
    const calculatedStop = Number((swingLow - atrBuffer).toFixed(2));
    const riskDistance = currentPrice - calculatedStop;
    if (riskDistance <= 0) return { decision: 'NO TRADE' };
    const tp1 = Number((currentPrice + riskDistance * minRiskReward).toFixed(2));
    const rr1 = Number(((tp1 - currentPrice) / riskDistance).toFixed(2));
    if (rr1 < minRiskReward) return { decision: 'NO TRADE' };
    return {
      decision: 'LONG',
      levels: { entryPrice: currentPrice, stopLossPrice: calculatedStop, takeProfit1: tp1, riskRewardTP1: rr1 },
    };
  } else {
    const calculatedStop = Number((swingHigh + atrBuffer).toFixed(2));
    const riskDistance = calculatedStop - currentPrice;
    if (riskDistance <= 0) return { decision: 'NO TRADE' };
    const tp1 = Number((currentPrice - riskDistance * minRiskReward).toFixed(2));
    const rr1 = Number(((currentPrice - tp1) / riskDistance).toFixed(2));
    if (rr1 < minRiskReward) return { decision: 'NO TRADE' };
    return {
      decision: 'SHORT',
      levels: { entryPrice: currentPrice, stopLossPrice: calculatedStop, takeProfit1: tp1, riskRewardTP1: rr1 },
    };
  }
}

// -------------------------------------------------------------
// 5. AI Response Schema Validator
// -------------------------------------------------------------
function validateAIAnalysisOutput(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return { isValid: false, errors: ['Null data'] };
  if (!data.instrumentSymbol) errors.push('Missing instrumentSymbol');
  if (!['LONG', 'SHORT', 'NO TRADE'].includes(data.decision)) errors.push('Invalid decision');
  if (typeof data.technicalScore !== 'number' || data.technicalScore < 0 || data.technicalScore > 10) {
    errors.push('Score out of bounds 0-10');
  }
  if (data.decision === 'LONG') {
    if (!data.levels || data.levels.stopLossPrice >= data.levels.entryPrice) errors.push('Inverted SL for LONG');
    if (!data.levels || data.levels.riskRewardTP1 < 1.95) errors.push('Sub-2.0 R:R');
  }
  return { isValid: errors.length === 0, errors };
}

// 6. Candle Integrity, Freshness & Open/Close Validator
function validateCandleIntegrity(candles, timeframeName, marketType, maxStaleAgeMs) {
  if (!candles || !Array.isArray(candles) || candles.length < 20) {
    return {
      isValid: false,
      reason: `Insufficient candle history for ${timeframeName}. At least 20 candles required for mathematical indicators; received ${candles ? candles.length : 0}.`,
    };
  }

  const tfIntervalMap = {
    '5M': 5 * 60 * 1000,
    '15M': 15 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
  };
  const intervalMs = tfIntervalMap[timeframeName.toUpperCase()] || 15 * 60 * 1000;

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
  const CLOCK_SKEW_TOLERANCE_MS = 60 * 1000; // 60s tolerance

  // 1. Future timestamp check
  if (latestCandle.timestamp > now + CLOCK_SKEW_TOLERANCE_MS) {
    const deltaSec = Math.round((latestCandle.timestamp - now) / 1000);
    return {
      isValid: false,
      reason: `Future timestamp detected in ${timeframeName}. Candle openTime is ${deltaSec}s ahead of local UTC clock.`,
    };
  }

  // 2. Open forming candle vs completed candle
  const isOpenCandle = latestCandle.closeTime ? now < latestCandle.closeTime : now - latestCandle.timestamp < intervalMs;

  // 3. Strict freshness relative to openTime
  const elapsedSinceOpen = now - latestCandle.timestamp;
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

// =====================================================================
// EXECUTION & ASSERTIONS
// =====================================================================
let totalTests = 0, passedTests = 0, failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('======================================================================');
console.log('              TRADEMIND AI - FULL AUTOMATED TEST SUITE                ');
console.log('======================================================================\n');

// 1. Technical Indicators Tests
console.log('1. TECHNICAL INDICATORS CALCULATIONS');
const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const ema = calculateEMA(prices, 5);
assert(ema[0] === 12, 'EMA seed equals SMA of first 5 items (10+11+12+13+14)/5 = 12');
assert(ema[ema.length - 1] > ema[0], 'EMA responds to upward trend momentum');

const rising = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
const rsiRising = calculateRSI(rising, 14);
assert(rsiRising[rsiRising.length - 1] > 95, 'Rising sequence produces RSI > 95 (Wilders smoothing)');

const falling = Array.from({ length: 30 }, (_, i) => 200 - i * 2);
const rsiFalling = calculateRSI(falling, 14);
assert(rsiFalling[rsiFalling.length - 1] < 5, 'Falling sequence produces RSI < 5');

const macd = calculateMACD(rising, 12, 26, 9);
const lastM = macd[macd.length - 1];
assert(lastM.macd > 0, 'Fast EMA > Slow EMA in uptrend yields positive MACD line');
assert(Math.abs(lastM.histogram - (lastM.macd - lastM.signal)) < 0.001, 'Histogram strictly equals MACD - Signal');

const dummyCandles = Array.from({ length: 25 }, (_, i) => ({
  timestamp: 1000 + i * 60000, open: 100 + i, high: 105 + i, low: 98 + i, close: 103 + i, volume: 1000,
}));
const atr = calculateATR(dummyCandles, 14);
assert(atr[atr.length - 1] >= 6.0, 'ATR accurately computes True Range volatility');

const bb = calculateBollingerBands(Array.from({ length: 25 }, (_, i) => 100 + (i % 2 === 0 ? 5 : -5)), 20, 2);
assert(bb.upper > bb.middle && bb.lower < bb.middle, 'Bollinger Bands upper > middle > lower');

const vwap = calculateVWAP([
  { timestamp: 1, open: 100, high: 110, low: 90, close: 100, volume: 100 },
  { timestamp: 2, open: 100, high: 120, low: 100, close: 110, volume: 200 },
]);
assert(Math.abs(vwap - 106.666667) < 0.001, 'VWAP volume weights typical prices correctly (106.67)');

// 2. Market Structure Tests
console.log('\n2. MARKET STRUCTURE & STRUCTURAL BREAKS');
const structCandles = [
  { timestamp: 100, open: 10, high: 11, low: 9, close: 10, volume: 100 },
  { timestamp: 200, open: 10, high: 13, low: 10, close: 12, volume: 100 },
  { timestamp: 300, open: 12, high: 15, low: 11, close: 14, volume: 100 },
  { timestamp: 400, open: 14, high: 20, low: 13, close: 18, volume: 100 }, // Swing high 20
  { timestamp: 500, open: 18, high: 17, low: 12, close: 13, volume: 100 },
  { timestamp: 600, open: 13, high: 14, low: 10, close: 11, volume: 100 },
  { timestamp: 700, open: 11, high: 12, low: 5, close: 8, volume: 100 },   // Swing low 5
  { timestamp: 800, open: 8, high: 10, low: 7, close: 9, volume: 100 },
  { timestamp: 900, open: 9, high: 12, low: 8, close: 11, volume: 100 },
  { timestamp: 1000, open: 11, high: 14, low: 10, close: 13, volume: 100 },
];
const swings = detectSwingPoints(structCandles, 2);
assert(swings.some((s) => s.price === 20 && s.type === 'SWING_HIGH'), 'Identifies Swing High pivot at 20');
assert(swings.some((s) => s.price === 5 && s.type === 'SWING_LOW'), 'Identifies Swing Low pivot at 5');

// Wick penetration vs confirmed break
const wickCandles = [...structCandles, { timestamp: 1100, open: 15, high: 21, low: 14, close: 19, volume: 200 }];
const breakWick = analyzeStructuralBreaks(wickCandles, swings);
assert(!breakWick.lastBOS, 'Wick penetration (high=21, close=19) does NOT trigger confirmed BOS');

const closeCandles = [...structCandles, { timestamp: 1200, open: 19, high: 23, low: 18, close: 22, volume: 500 }];
const breakClose = analyzeStructuralBreaks(closeCandles, swings);
assert(breakClose.lastBOS && breakClose.lastBOS.breakType === 'BOS_BULLISH', 'Confirmed candle close at 22 triggers confirmed Bullish BOS');

const fvg = detectFairValueGaps([
  { timestamp: 1, open: 92, high: 100, low: 90, close: 98, volume: 100 },
  { timestamp: 2, open: 102, high: 120, low: 102, close: 118, volume: 500 },
  { timestamp: 3, open: 118, high: 125, low: 110, close: 122, volume: 200 },
]);
assert(fvg.length === 1 && fvg[0].gapBottom === 100 && fvg[0].gapTop === 110, 'Fair Value Gap detected with correct bounds [100, 110]');
assert(fvg[0].midpointConsequentEncroachment === 105, 'FVG Consequent Encroachment (50%) is 105');

const sweeps = detectLiquiditySweeps(
  [{ timestamp: 10, open: 90, high: 100, low: 88, close: 95, volume: 100 }, { timestamp: 20, open: 95, high: 103, low: 92, close: 94, volume: 300 }],
  [{ timestamp: 10, price: 100, type: 'SWING_HIGH' }]
);
assert(sweeps.length > 0 && sweeps[0].direction === 'BEARISH_SWEEP', 'Liquidity sweep above swing high detected');

// 3. Risk Management & Calculator Tests
console.log('\n3. RISK MANAGEMENT & SIZING ENGINE');
const forexRisk = calculateRiskAndPosition({
  marketType: 'forex', symbol: 'EUR/USD', accountBalance: 10000, riskPercentage: 1.0,
  entryPrice: 1.0850, stopLossPrice: 1.0825, takeProfitPrice: 1.0900,
  lotOrContractSize: 100000, pipOrTickSize: 0.0001,
});
assert(forexRisk.riskAmountCash === 100, 'Forex cash risk is exact $100 (1.0% of $10,000)');
assert(forexRisk.stopLossDistancePips === 25, 'Forex stop loss distance is exact 25 pips');
assert(forexRisk.positionSizeLotsOrContracts === 0.4, 'Forex position size is exact 0.40 lots');
assert(forexRisk.potentialRiskRewardRatio === 2.0 && forexRisk.isRiskRewardAcceptable, 'Validates 1:2.0 Risk-to-Reward ratio');

const cryptoRisk = calculateRiskAndPosition({
  marketType: 'crypto', symbol: 'BTC/USDT', accountBalance: 10000, riskPercentage: 0.5,
  entryPrice: 95000, stopLossPrice: 94000, takeProfitPrice: 97500,
  lotOrContractSize: 1, pipOrTickSize: 0.1,
});
assert(cryptoRisk.riskAmountCash === 50, 'Crypto cash risk is exact $50 (0.5% of $10,000)');
assert(cryptoRisk.positionSizeUnits === 0.05, 'Crypto position size is exact 0.05 BTC');
assert(cryptoRisk.potentialRiskRewardRatio === 2.5, 'Crypto R:R ratio is 1:2.5');

// 4. Trade Planning Engine Tests
console.log('\n4. TRADE PLANNER (ENTRY, STOP LOSS, TARGETS & R:R >= 2.0)');
const longPlan = generateTradePlan({
  direction: 'LONG', currentPrice: 94600, swingLow: 93500, swingHigh: 95500, atr: 600, minRiskReward: 2.0,
});
assert(longPlan.decision === 'LONG', 'Generates confirmed LONG trade setup');
assert(longPlan.levels.stopLossPrice < longPlan.levels.entryPrice, 'Stop Loss is below Entry Price');
assert(longPlan.levels.takeProfit1 > longPlan.levels.entryPrice, 'TP1 is above Entry Price');
assert(longPlan.levels.riskRewardTP1 >= 2.0, 'Enforces minimum 1:2.0 planned R:R');

// 5. AI Schema Validation Tests
console.log('\n5. AI RESPONSE STRICT SCHEMA VALIDATION');
const validAI = {
  instrumentSymbol: 'BTC/USDT',
  decision: 'LONG',
  technicalScore: 8.5,
  levels: { entryPrice: 94500, stopLossPrice: 93500, takeProfit1: 96500, riskRewardTP1: 2.0 },
};
assert(validateAIAnalysisOutput(validAI).isValid === true, 'Accepts compliant confirmed LONG analysis');

const invalidDecision = { ...validAI, decision: 'BUY_RANDOM' };
assert(validateAIAnalysisOutput(invalidDecision).isValid === false, 'Rejects invalid decision string');

const invalidScore = { ...validAI, technicalScore: 12.0 };
assert(validateAIAnalysisOutput(invalidScore).isValid === false, 'Rejects score out of 0-10 bounds');

const invertedStop = { ...validAI, levels: { ...validAI.levels, stopLossPrice: 96000 } };
assert(validateAIAnalysisOutput(invertedStop).isValid === false, 'Rejects inverted Stop Loss');

const subTwoRR = { ...validAI, levels: { ...validAI.levels, riskRewardTP1: 1.4 } };
assert(validateAIAnalysisOutput(subTwoRR).isValid === false, 'Rejects trade plan with sub-2.0 R:R');

// 6. Data Integrity, Freshness & Security Tests
console.log('\n6. DATA INTEGRITY, FRESHNESS & SECURITY GATE TESTS');
const now = Date.now();

// Test: Insufficient candles (< 20)
const shortCandles = Array.from({ length: 15 }, (_, i) => ({
  timestamp: now - (15 - i) * 60000,
  open: 100, high: 105, low: 95, close: 102, volume: 500,
}));
const shortCheck = validateCandleIntegrity(shortCandles, '15M', 'crypto');
assert(shortCheck.isValid === false, 'Rejects candle dataset with fewer than 20 candles');

// Test: Corrupted candle geometry (high < low)
const corruptCandles = Array.from({ length: 25 }, (_, i) => ({
  timestamp: now - (25 - i) * 60000,
  open: 100, high: i === 10 ? 80 : 105, low: 95, close: 102, volume: 500,
}));
const corruptCheck = validateCandleIntegrity(corruptCandles, '1H', 'crypto');
assert(corruptCheck.isValid === false, 'Rejects corrupted candle geometry where high < low');

// Test: Stale crypto candles (> 24 hours old)
const staleCryptoCandles = Array.from({ length: 25 }, (_, i) => ({
  timestamp: now - 30 * 3600000 + i * 60000, // 30 hours old
  open: 100, high: 105, low: 95, close: 102, volume: 500,
}));
const staleCryptoCheck = validateCandleIntegrity(staleCryptoCandles, '4H', 'crypto');
assert(staleCryptoCheck.isValid === false, 'Rejects stale cryptocurrency data older than 24 hours');

// Test: Fresh crypto candles (within current hour)
const freshCryptoCandles = Array.from({ length: 25 }, (_, i) => ({
  timestamp: now - (25 - i) * 60000,
  open: 100, high: 105, low: 95, close: 102, volume: 500,
}));
const freshCryptoCheck = validateCandleIntegrity(freshCryptoCandles, '5M', 'crypto');
assert(freshCryptoCheck.isValid === true, 'Accepts fresh cryptocurrency data within active window');

// Test: Forex weekend stale tolerance (allowed up to 72h)
const weekendForexCandles = Array.from({ length: 25 }, (_, i) => ({
  timestamp: now - 48 * 3600000 + i * 60000, // 48 hours old (weekend)
  open: 1.085, high: 1.088, low: 1.082, close: 1.086, volume: 5000,
}));
const weekendForexCheck = validateCandleIntegrity(weekendForexCandles, '4H', 'forex');
assert(weekendForexCheck.isValid === true, 'Accepts forex data up to 72 hours old during market weekend closures');

// Test: Security Gate - Service-Role Key Detection
function isClientKeySafe(key) {
  if (!key || typeof key !== 'string') return false;
  if (key.toLowerCase().includes('service_role')) return false;
  try {
    const parts = key.split('.');
    if (parts.length >= 2) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = Buffer.from(payloadBase64, 'base64').toString('utf8');
      if (decoded.includes('"role":"service_role"') || decoded.toLowerCase().includes('service_role')) {
        return false;
      }
    }
  } catch {
    // ignore
  }
  return true;
}
assert(isClientKeySafe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0') === false, 'Security gate strictly blocks service_role JWT in client environment');
assert(isClientKeySafe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9') === true, 'Security gate allows safe anon public key');

// 7. Rigorous Timestamp Audit Tests (Audit Checklist #8)
console.log('\n7. RIGOROUS TIMESTAMP AUDIT & FRESHNESS TESTS');

// 7.1 Fresh Market Data: Current 5M candle opened 2 minutes ago
const fresh5mCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now - 24 * 5 * 60000 + i * 5 * 60000 - 2 * 60000;
  return {
    timestamp: openTime,
    closeTime: openTime + 5 * 60000 - 1,
    open: 100 + i, high: 105 + i, low: 95 + i, close: 102 + i, volume: 500,
  };
});
const fresh5mCheck = validateCandleIntegrity(fresh5mCandles, '5M', 'crypto');
assert(fresh5mCheck.isValid === true && fresh5mCheck.isOpenCandle === true, 'Fresh 5M candle opened 2m ago is valid and correctly identified as OPEN (forming)');

// 7.2 Stale Market Data: 5M candle opened 25 minutes ago
const stale5mCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now - 24 * 5 * 60000 + i * 5 * 60000 - 25 * 60000;
  return {
    timestamp: openTime,
    closeTime: openTime + 5 * 60000 - 1,
    open: 100, high: 105, low: 95, close: 102, volume: 500,
  };
});
const stale5mCheck = validateCandleIntegrity(stale5mCandles, '5M', 'crypto');
assert(stale5mCheck.isValid === false && stale5mCheck.reason.includes('stale'), 'Stale 5M candle opened 25m ago is strictly rejected');

// 7.3 Future Timestamps: Candle timestamp in the future (>60s)
const futureCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now + 5 * 60000 + i * 60000; // 5m in future
  return {
    timestamp: openTime,
    closeTime: openTime + 60000 - 1,
    open: 100, high: 105, low: 95, close: 102, volume: 500,
  };
});
const futureCheck = validateCandleIntegrity(futureCandles, '15M', 'crypto');
assert(futureCheck.isValid === false && futureCheck.reason.includes('Future timestamp'), 'Rejects candles with future timestamps ahead of local UTC clock');

// 7.4 Clock Differences: Skew tolerance (<60s vs >60s)
const minorSkewCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now - (25 - i) * 60000 + 15000; // +15s exchange drift
  return {
    timestamp: openTime,
    closeTime: openTime + 60000 - 1,
    open: 100, high: 105, low: 95, close: 102, volume: 500,
  };
});
const minorSkewCheck = validateCandleIntegrity(minorSkewCandles, '15M', 'crypto');
assert(minorSkewCheck.isValid === true, 'Tolerates acceptable network clock difference (<60s)');

const excessiveSkewCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now + 90000 + i * 60000; // +90s drift
  return {
    timestamp: openTime,
    closeTime: openTime + 60000 - 1,
    open: 100, high: 105, low: 95, close: 102, volume: 500,
  };
});
const excessiveSkewCheck = validateCandleIntegrity(excessiveSkewCandles, '15M', 'crypto');
assert(excessiveSkewCheck.isValid === false, 'Rejects excessive clock difference (>60s drift)');

// 7.5 Open vs Completed Candles & Scheduled CloseTime Anti-Spoofing
const completedCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now - 30 * 60000 + i * 60000;
  const closeTime = openTime + 60000 - 1; // Completed 5m ago
  return {
    timestamp: openTime,
    closeTime,
    open: 100, high: 105, low: 95, close: 102, volume: 500,
  };
});
const completedCheck = validateCandleIntegrity(completedCandles, '5M', 'crypto');
assert(completedCheck.isOpenCandle === false, 'Correctly identifies completed candle whose scheduled closeTime is in the past');

// Anti-spoofing check: Stale open candle with scheduled closeTime artificially set in future
const deceptiveCandles = Array.from({ length: 25 }, (_, i) => {
  const openTime = now - 40 * 60000 + i * 60000; // Opened 16m ago (stale for 5M)
  return {
    timestamp: openTime,
    closeTime: now + 10 * 60000, // Artificially in future
    open: 100, high: 105, low: 95, close: 102, volume: 500,
  };
});
const deceptiveCheck = validateCandleIntegrity(deceptiveCandles, '5M', 'crypto');
assert(deceptiveCheck.isValid === false, 'Refuses to accept stale candle even if its scheduled closeTime is in the future');

// 7.6 Cached Responses Verification
class SimpleCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }
  set(key, data) {
    this.store.set(key, { data, cachedAt: Date.now() });
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }
}
const cache = new SimpleCache(50); // 50ms TTL
cache.set('5m_BTC', { price: 59500, timestamp: now });
assert(cache.get('5m_BTC') !== null, 'Cache returns fresh entry within TTL');

// Simulate expiration
const expiredCache = new SimpleCache(-10); // Expired immediately
expiredCache.set('5m_BTC', { price: 59500, timestamp: now - 10000 });
assert(expiredCache.get('5m_BTC') === null, 'Cache strictly expires and refuses to serve outdated candle responses');

// 8. Milestone 5: Alert Engine, Cooldown & Notification Preferences Tests
console.log('\n8. ALERT ENGINE, COOLDOWN & NOTIFICATION PREFERENCES');

class TestAlertEngine {
  constructor() {
    this.rules = new Map();
    this.events = [];
    this.prevPrices = new Map();
  }
  createRule(rule) {
    const id = `rule_${Date.now()}_${Math.random()}`;
    const newRule = { ...rule, id, status: 'ACTIVE', createdAt: Date.now() };
    this.rules.set(id, newRule);
    return newRule;
  }
  muteRule(id) {
    const r = this.rules.get(id);
    if (r) r.status = r.status === 'MUTED' ? 'ACTIVE' : 'MUTED';
  }
  deleteRule(id) {
    this.rules.delete(id);
  }
  evaluate(symbol, currentPrice, snapshotStatus = 'LIVE', simulatedTime = Date.now()) {
    if (snapshotStatus === 'UNAVAILABLE' || currentPrice <= 0) return [];
    const prevPrice = this.prevPrices.get(symbol) ?? currentPrice;
    this.prevPrices.set(symbol, currentPrice);

    const triggered = [];
    for (const rule of this.rules.values()) {
      if (rule.symbol !== symbol || rule.status !== 'ACTIVE') continue;
      if (rule.lastTriggeredAt) {
        const cooldownMs = rule.cooldownMinutes * 60000;
        if (simulatedTime - rule.lastTriggeredAt < cooldownMs) continue; // Cooldown active
      }

      let met = false;
      if (rule.alertType === 'PRICE_CROSS_ABOVE' && prevPrice < rule.targetPrice && currentPrice >= rule.targetPrice) {
        met = true;
      } else if (rule.alertType === 'PRICE_CROSS_BELOW' && prevPrice > rule.targetPrice && currentPrice <= rule.targetPrice) {
        met = true;
      }

      if (met) {
        rule.lastTriggeredAt = simulatedTime;
        rule.status = 'TRIGGERED';
        const ev = { id: `ev_${simulatedTime}`, ruleId: rule.id, symbol, price: currentPrice, alertType: rule.alertType };
        this.events.push(ev);
        triggered.push(ev);
      }
    }
    return triggered;
  }
}

const testEngine = new TestAlertEngine();
const btcRule = testEngine.createRule({
  symbol: 'BTC/USDT',
  alertType: 'PRICE_CROSS_ABOVE',
  targetPrice: 60000,
  cooldownMinutes: 30,
});
assert(btcRule.status === 'ACTIVE', 'Alert rule created with initial ACTIVE status');

// Step 1: Initial baseline price at 59,500
testEngine.evaluate('BTC/USDT', 59500);

// Step 2: Price surges across 60,000 threshold to 60,200
const t1 = Date.now();
const events1 = testEngine.evaluate('BTC/USDT', 60200, 'LIVE', t1);
assert(events1.length === 1 && events1[0].alertType === 'PRICE_CROSS_ABOVE', 'Triggers PRICE_CROSS_ABOVE alert when threshold crossed');
assert(btcRule.lastTriggeredAt === t1, 'Records exact lastTriggeredAt timestamp');

// Step 3: Duplicate prevention within cooldown window (10 minutes later)
const t2 = t1 + 10 * 60000;
const events2 = testEngine.evaluate('BTC/USDT', 60500, 'LIVE', t2);
assert(events2.length === 0, 'Suppresses duplicate alerts during 30m cooldown window');

// Step 4: Cooldown expiration allows subsequent trigger if condition occurs
btcRule.status = 'ACTIVE';
testEngine.prevPrices.set('BTC/USDT', 59800); // Price dipped back
const t3 = t1 + 35 * 60000; // 35 minutes later (cooldown expired)
const events3 = testEngine.evaluate('BTC/USDT', 60100, 'LIVE', t3);
assert(events3.length === 1, 'Permits new alert trigger after 30m cooldown has elapsed');

// Step 5: Stale / Unavailable Data Guardrail
const eventsStale = testEngine.evaluate('BTC/USDT', 65000, 'UNAVAILABLE');
assert(eventsStale.length === 0, 'Refuses to trigger alerts when feed status is UNAVAILABLE');

// Step 6: Muted Alert Suppression
const eurusdRule = testEngine.createRule({
  symbol: 'EUR/USD',
  alertType: 'PRICE_CROSS_BELOW',
  targetPrice: 1.0800,
  cooldownMinutes: 15,
});
testEngine.muteRule(eurusdRule.id);
assert(eurusdRule.status === 'MUTED', 'Mutes alert rule successfully');
testEngine.evaluate('EUR/USD', 1.0850);
const eventsMuted = testEngine.evaluate('EUR/USD', 1.0780);
assert(eventsMuted.length === 0, 'Suppresses triggers for MUTED alert rules');

// Step 7: Notification Preference Filtering
function filterNotification(channel, prefs) {
  if (channel === 'trade_alerts' && !prefs.priceAlerts) return false;
  if (channel === 'ai_analysis' && !prefs.aiAnalysisAlerts) return false;
  if (channel === 'risk_warnings' && !prefs.riskAlerts) return false;
  return true;
}
const userPrefs = { priceAlerts: false, aiAnalysisAlerts: true, riskAlerts: true };
assert(filterNotification('trade_alerts', userPrefs) === false, 'Suppresses trade alert when priceAlerts preference is disabled');
assert(filterNotification('ai_analysis', userPrefs) === true, 'Delivers AI analysis notification when preference is enabled');



console.log('\n======================================================================');
console.log(`TOTAL TESTS:   ${totalTests}`);
console.log(`PASSED TESTS:  ${passedTests}`);
console.log(`FAILED TESTS:  ${failedTests}`);
console.log('STATUS:        ' + (failedTests === 0 ? 'ALL QUANTITATIVE TESTS PASSED (100% SUCCESS)' : 'FAILURES DETECTED'));
console.log('======================================================================');

if (failedTests > 0) process.exit(1);

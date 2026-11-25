// =====================================================================
// TradeMind AI - Technical Indicator Calculation Engine
// Rigorous, pure mathematical calculations for financial candles.
// =====================================================================

import { Candle } from '../../types/market';
import {
  BollingerBandsResult,
  MACDResult,
  StochRSIResult,
  TechnicalIndicatorSet,
} from '../../types/indicators';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(values: number[], period: number): number[] {
  if (values.length < period || period <= 0) return [];
  const sma: number[] = [];
  let sum = 0;

  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  sma.push(sum / period);

  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    sma.push(sum / period);
  }

  return sma;
}

/**
 * Calculates Exponential Moving Average (EMA)
 * Multiplier = 2 / (period + 1)
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0 || period <= 0) return [];
  if (values.length < period) {
    // If fewer values than period, return progressive averages
    const fallback: number[] = [];
    let runSum = 0;
    for (let i = 0; i < values.length; i++) {
      runSum += values[i];
      fallback.push(runSum / (i + 1));
    }
    return fallback;
  }

  const k = 2 / (period + 1);
  const ema: number[] = [];

  // Seed with SMA of the first `period` elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let prevEma = sum / period;
  ema.push(prevEma);

  for (let i = period; i < values.length; i++) {
    prevEma = values[i] * k + prevEma * (1 - k);
    ema.push(prevEma);
  }

  return ema;
}

/**
 * Calculates Relative Strength Index (RSI 14) using Wilder's smoothing
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length <= period) return [];

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  const rsi: number[] = [];
  const initialRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + initialRs));

  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * Standard: Fast=12, Slow=26, Signal=9
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  if (closes.length < slowPeriod) {
    return [{ macd: 0, signal: 0, histogram: 0 }];
  }

  const fastEma = calculateEMA(closes, fastPeriod);
  const slowEma = calculateEMA(closes, slowPeriod);

  // Align fastEma with slowEma
  const offset = slowPeriod - fastPeriod;
  const macdLine: number[] = [];

  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(fastEma[i + offset] - slowEma[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const signalOffset = macdLine.length - signalLine.length;

  const results: MACDResult[] = [];
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

/**
 * Calculates Stochastic RSI (14, 14, 3, 3)
 */
export function calculateStochRSI(
  closes: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kSmooth: number = 3,
  dSmooth: number = 3
): StochRSIResult {
  const rsiSeries = calculateRSI(closes, rsiPeriod);
  if (rsiSeries.length < stochPeriod) {
    return { k: 50, d: 50 };
  }

  const rawStoch: number[] = [];
  for (let i = stochPeriod - 1; i < rsiSeries.length; i++) {
    let minRsi = Infinity;
    let maxRsi = -Infinity;
    for (let j = i - stochPeriod + 1; j <= i; j++) {
      if (rsiSeries[j] < minRsi) minRsi = rsiSeries[j];
      if (rsiSeries[j] > maxRsi) maxRsi = rsiSeries[j];
    }
    const range = maxRsi - minRsi;
    const stochVal = range === 0 ? 50 : ((rsiSeries[i] - minRsi) / range) * 100;
    rawStoch.push(stochVal);
  }

  const kSeries = calculateSMA(rawStoch, kSmooth);
  const dSeries = calculateSMA(kSeries, dSmooth);

  const k = kSeries.length > 0 ? kSeries[kSeries.length - 1] : 50;
  const d = dSeries.length > 0 ? dSeries[dSeries.length - 1] : 50;

  return {
    k: Number(k.toFixed(2)),
    d: Number(d.toFixed(2)),
  };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < 2) return [0];

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    const sum = trueRanges.reduce((acc, v) => acc + v, 0);
    return [sum / (trueRanges.length || 1)];
  }

  // Wilder's smoothing for ATR
  let prevAtr = 0;
  for (let i = 0; i < period; i++) {
    prevAtr += trueRanges[i];
  }
  prevAtr /= period;

  const atr: number[] = [prevAtr];
  for (let i = period; i < trueRanges.length; i++) {
    prevAtr = (prevAtr * (period - 1) + trueRanges[i]) / period;
    atr.push(prevAtr);
  }

  return atr;
}

/**
 * Calculates Bollinger Bands (period=20, stdDev=2)
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsResult {
  if (closes.length === 0) {
    return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0.5 };
  }

  const sample = closes.slice(-period);
  const count = sample.length;
  const middle = sample.reduce((sum, v) => sum + v, 0) / count;

  const variance =
    sample.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / count;
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

/**
 * Calculates Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;

  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTPV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
  }

  if (cumulativeVolume === 0) {
    return candles[candles.length - 1].close;
  }

  return Number((cumulativeTPV / cumulativeVolume).toFixed(6));
}

/**
 * Calculates Momentum and Volatility metrics
 */
export function calculateMomentumAndVolatility(
  candles: Candle[],
  atr: number
): {
  momentumScore: number;
  annualizedVolatility: number;
  candleVolatilityPct: number;
} {
  if (candles.length < 2) {
    return { momentumScore: 0, annualizedVolatility: 0, candleVolatilityPct: 0 };
  }

  const currentClose = candles[candles.length - 1].close;
  const lookback = Math.min(candles.length - 1, 14);
  const priorClose = candles[candles.length - 1 - lookback].close;

  // Rate of Change (ROC)
  const roc = priorClose === 0 ? 0 : ((currentClose - priorClose) / priorClose) * 100;
  const momentumScore = Math.max(-100, Math.min(100, Number((roc * 10).toFixed(2))));

  // Candle volatility = ATR / currentClose * 100
  const candleVolatilityPct = currentClose === 0 ? 0 : Number(((atr / currentClose) * 100).toFixed(2));

  // Annualized volatility from log returns
  const logReturns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    if (candles[i - 1].close > 0 && candles[i].close > 0) {
      logReturns.push(Math.log(candles[i].close / candles[i - 1].close));
    }
  }

  let annualizedVolatility = 0;
  if (logReturns.length > 1) {
    const meanReturn = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;
    const varReturn =
      logReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
      (logReturns.length - 1);
    const dailyStdDev = Math.sqrt(varReturn);
    // Crypto 365 days, Forex 252 days; normalizing with 365
    annualizedVolatility = Number((dailyStdDev * Math.sqrt(365) * 100).toFixed(2));
  }

  return { momentumScore, annualizedVolatility, candleVolatilityPct };
}

/**
 * Aggregates all indicators for a given set of candles
 */
export function calculateTechnicalIndicators(candles: Candle[]): TechnicalIndicatorSet {
  if (!candles || candles.length === 0) {
    throw new Error('Cannot calculate technical indicators on empty candle dataset');
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const currentCandle = candles[candles.length - 1];

  // Moving averages
  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const ema200Series = calculateEMA(closes, 200);

  const ema20 = ema20Series.length > 0 ? ema20Series[ema20Series.length - 1] : currentCandle.close;
  const ema50 = ema50Series.length > 0 ? ema50Series[ema50Series.length - 1] : currentCandle.close;
  const ema200 = ema200Series.length > 0 ? ema200Series[ema200Series.length - 1] : currentCandle.close;

  // Oscillators
  const rsiSeries = calculateRSI(closes, 14);
  const rsi14 = rsiSeries.length > 0 ? Number(rsiSeries[rsiSeries.length - 1].toFixed(2)) : 50;

  const macdResults = calculateMACD(closes, 12, 26, 9);
  const macd = macdResults[macdResults.length - 1];

  const stochRsi = calculateStochRSI(closes, 14, 14, 3, 3);

  // Volatility & Volume
  const atrSeries = calculateATR(candles, 14);
  const atr14 = atrSeries.length > 0 ? Number(atrSeries[atrSeries.length - 1].toFixed(6)) : 0;

  const vwap = calculateVWAP(candles);
  const bollingerBands = calculateBollingerBands(closes, 20, 2);

  const volumeSmaSeries = calculateSMA(volumes, 20);
  const volumeSma20 = volumeSmaSeries.length > 0 ? volumeSmaSeries[volumeSmaSeries.length - 1] : currentCandle.volume;
  const volumeRatio = volumeSma20 === 0 ? 1 : Number((currentCandle.volume / volumeSma20).toFixed(2));

  const totalVolume = volumes.reduce((sum, v) => sum + v, 0);

  const { momentumScore, annualizedVolatility, candleVolatilityPct } =
    calculateMomentumAndVolatility(candles, atr14);

  return {
    ema20: Number(ema20.toFixed(6)),
    ema50: Number(ema50.toFixed(6)),
    ema200: Number(ema200.toFixed(6)),
    rsi14,
    macd,
    stochRsi,
    vwap,
    atr14,
    bollingerBands,
    volume24h: Number(totalVolume.toFixed(2)),
    volumeSma20: Number(volumeSma20.toFixed(2)),
    volumeRatio,
    momentumScore,
    annualizedVolatility,
    candleVolatilityPct,
  };
}

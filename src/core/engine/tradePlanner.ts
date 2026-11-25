// =====================================================================
// TradeMind AI - Entry, Stop Loss & Take Profit Target Engine
// Calculates exact price levels using Market Structure, Swings, and ATR.
// Strictly enforces a minimum 1:2.0 Risk-to-Reward ratio.
// Returns NO TRADE when an acceptable structural R:R cannot be formed.
// =====================================================================

import { TradeLevels } from '../../types/analysis';
import { Candle, Instrument } from '../../types/market';
import { MarketStructureSnapshot } from '../../types/structure';
import { TechnicalIndicatorSet } from '../../types/indicators';

interface PlanTradeInputs {
  instrument: Instrument;
  direction: 'LONG' | 'SHORT';
  currentCandle: Candle;
  structure: MarketStructureSnapshot;
  indicators: TechnicalIndicatorSet;
  minRiskReward?: number; // Defaults to 2.0
}

export interface TradePlanOutput {
  decision: 'LONG' | 'SHORT' | 'NO TRADE';
  setupStatus: 'CONFIRMED' | 'DEVELOPING' | 'NO_TRADE';
  levels?: TradeLevels;
  rejectionReason?: string;
}

/**
 * Calculates structural trade levels with ATR buffer and minimum 1:2 R:R constraint
 */
export function generateTradePlan(inputs: PlanTradeInputs): TradePlanOutput {
  const {
    instrument,
    direction,
    currentCandle,
    structure,
    indicators,
    minRiskReward = 2.0,
  } = inputs;

  const currentPrice = currentCandle.close;
  const atr = indicators.atr14 > 0 ? indicators.atr14 : currentPrice * 0.005; // Fallback to 0.5%
  const atrBuffer = atr * 0.75; // 0.75 ATR buffer beyond structural pivot

  if (direction === 'LONG') {
    // -------------------------------------------------------------
    // LONG TRADE LEVEL PLANNING
    // -------------------------------------------------------------
    // 1. Entry Zone: Current price down to the nearest demand zone / order block / CE of FVG
    let entryPrice = currentPrice;
    let entryMin = currentPrice;
    let entryMax = currentPrice;

    const unmitigatedDemand = structure.demandZones[0];
    const bullishFvg = structure.openFairValueGaps.find((f) => f.type === 'BULLISH_FVG');

    if (unmitigatedDemand && unmitigatedDemand.top <= currentPrice) {
      entryMin = unmitigatedDemand.bottom;
      entryMax = unmitigatedDemand.top;
      entryPrice = Number(((entryMin + entryMax) / 2).toFixed(instrument.precision));
    } else if (bullishFvg && bullishFvg.gapTop <= currentPrice) {
      entryMin = bullishFvg.gapBottom;
      entryMax = bullishFvg.gapTop;
      entryPrice = bullishFvg.midpointConsequentEncroachment;
    } else {
      entryMin = Number((currentPrice - atr * 0.25).toFixed(instrument.precision));
      entryMax = Number((currentPrice + atr * 0.1).toFixed(instrument.precision));
    }

    // 2. Stop Loss: Below the recent Swing Low or Demand Zone bottom + ATR buffer
    const recentLows = structure.recentSwingLows;
    let structuralPivotLow: number;

    if (recentLows.length > 0) {
      // Find the lowest swing low below entry price
      const lowsBelow = recentLows.filter((l) => l.price < entryPrice);
      structuralPivotLow =
        lowsBelow.length > 0
          ? lowsBelow[lowsBelow.length - 1].price
          : recentLows[recentLows.length - 1].price;
    } else {
      structuralPivotLow = currentCandle.low - atr * 1.0;
    }

    const calculatedStopLoss = Number(
      (structuralPivotLow - atrBuffer).toFixed(instrument.precision)
    );

    // Invalidation check: Stop loss must be strictly below entry price
    const riskDistance = entryPrice - calculatedStopLoss;
    if (riskDistance <= 0) {
      return {
        decision: 'NO TRADE',
        setupStatus: 'NO_TRADE',
        rejectionReason: 'Invalid geometry: Stop Loss is above or equal to Entry Price',
      };
    }

    // 3. Take Profit Targets: Minimum 1:2 R:R at TP1, 1:3 at TP2
    const target1Price = Number((entryPrice + riskDistance * minRiskReward).toFixed(instrument.precision));
    const target2Price = Number((entryPrice + riskDistance * 3.0).toFixed(instrument.precision));

    // Optional TP3: Next major resistance or 1:4 R:R
    const nextResistance = structure.activeResistanceLevels.find((r) => r.price > target2Price);
    const target3Price = nextResistance
      ? nextResistance.price
      : Number((entryPrice + riskDistance * 4.0).toFixed(instrument.precision));

    const rr1 = Number((((target1Price - entryPrice) / riskDistance)).toFixed(2));
    const rr2 = Number((((target2Price - entryPrice) / riskDistance)).toFixed(2));
    const rr3 = Number((((target3Price - entryPrice) / riskDistance)).toFixed(2));

    if (rr1 < minRiskReward) {
      return {
        decision: 'NO TRADE',
        setupStatus: 'NO_TRADE',
        rejectionReason: `Planned R:R ratio (${rr1}) is below required minimum threshold (${minRiskReward})`,
      };
    }

    const stopDistancePips = Number((riskDistance / instrument.pipOrTickSize).toFixed(1));

    return {
      decision: 'LONG',
      setupStatus: 'CONFIRMED',
      levels: {
        entryPrice,
        entryZone: { min: entryMin, max: entryMax },
        stopLossPrice: calculatedStopLoss,
        takeProfit1: target1Price,
        takeProfit2: target2Price,
        takeProfit3: target3Price,
        riskRewardTP1: rr1,
        riskRewardTP2: rr2,
        riskRewardTP3: rr3,
        stopLossDistancePipsOrPoints: stopDistancePips,
        stopLossReasoning: `Placed below structural swing low (${structuralPivotLow}) with a 0.75x ATR buffer (${atrBuffer.toFixed(instrument.precision)}) to prevent premature sweep invalidation.`,
        takeProfitReasoning: `TP1 targets 1:${rr1} R:R minimum expansion; TP2 targets 1:${rr2} R:R; TP3 targets HTF liquidity pool / 1:${rr3} R:R.`,
      },
    };
  } else {
    // -------------------------------------------------------------
    // SHORT TRADE LEVEL PLANNING
    // -------------------------------------------------------------
    let entryPrice = currentPrice;
    let entryMin = currentPrice;
    let entryMax = currentPrice;

    const unmitigatedSupply = structure.supplyZones[0];
    const bearishFvg = structure.openFairValueGaps.find((f) => f.type === 'BEARISH_FVG');

    if (unmitigatedSupply && unmitigatedSupply.bottom >= currentPrice) {
      entryMin = unmitigatedSupply.bottom;
      entryMax = unmitigatedSupply.top;
      entryPrice = Number(((entryMin + entryMax) / 2).toFixed(instrument.precision));
    } else if (bearishFvg && bearishFvg.gapBottom >= currentPrice) {
      entryMin = bearishFvg.gapBottom;
      entryMax = bearishFvg.gapTop;
      entryPrice = bearishFvg.midpointConsequentEncroachment;
    } else {
      entryMin = Number((currentPrice - atr * 0.1).toFixed(instrument.precision));
      entryMax = Number((currentPrice + atr * 0.25).toFixed(instrument.precision));
    }

    const recentHighs = structure.recentSwingHighs;
    let structuralPivotHigh: number;

    if (recentHighs.length > 0) {
      const highsAbove = recentHighs.filter((h) => h.price > entryPrice);
      structuralPivotHigh =
        highsAbove.length > 0
          ? highsAbove[highsAbove.length - 1].price
          : recentHighs[recentHighs.length - 1].price;
    } else {
      structuralPivotHigh = currentCandle.high + atr * 1.0;
    }

    const calculatedStopLoss = Number(
      (structuralPivotHigh + atrBuffer).toFixed(instrument.precision)
    );

    const riskDistance = calculatedStopLoss - entryPrice;
    if (riskDistance <= 0) {
      return {
        decision: 'NO TRADE',
        setupStatus: 'NO_TRADE',
        rejectionReason: 'Invalid geometry: Stop Loss is below or equal to Entry Price',
      };
    }

    const target1Price = Number((entryPrice - riskDistance * minRiskReward).toFixed(instrument.precision));
    const target2Price = Number((entryPrice - riskDistance * 3.0).toFixed(instrument.precision));

    const nextSupport = structure.activeSupportLevels.find((s) => s.price < target2Price);
    const target3Price = nextSupport
      ? nextSupport.price
      : Number((entryPrice - riskDistance * 4.0).toFixed(instrument.precision));

    const rr1 = Number((((entryPrice - target1Price) / riskDistance)).toFixed(2));
    const rr2 = Number((((entryPrice - target2Price) / riskDistance)).toFixed(2));
    const rr3 = Number((((entryPrice - target3Price) / riskDistance)).toFixed(2));

    if (rr1 < minRiskReward) {
      return {
        decision: 'NO TRADE',
        setupStatus: 'NO_TRADE',
        rejectionReason: `Planned R:R ratio (${rr1}) is below required minimum threshold (${minRiskReward})`,
      };
    }

    const stopDistancePips = Number((riskDistance / instrument.pipOrTickSize).toFixed(1));

    return {
      decision: 'SHORT',
      setupStatus: 'CONFIRMED',
      levels: {
        entryPrice,
        entryZone: { min: entryMin, max: entryMax },
        stopLossPrice: calculatedStopLoss,
        takeProfit1: target1Price,
        takeProfit2: target2Price,
        takeProfit3: target3Price,
        riskRewardTP1: rr1,
        riskRewardTP2: rr2,
        riskRewardTP3: rr3,
        stopLossDistancePipsOrPoints: stopDistancePips,
        stopLossReasoning: `Placed above structural swing high (${structuralPivotHigh}) with a 0.75x ATR buffer (${atrBuffer.toFixed(instrument.precision)}) above buy-side liquidity.`,
        takeProfitReasoning: `TP1 captures 1:${rr1} R:R minimum expansion; TP2 captures 1:${rr2} R:R; TP3 targets HTF sell-side liquidity / 1:${rr3} R:R.`,
      },
    };
  }
}

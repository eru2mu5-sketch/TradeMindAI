// =====================================================================
// TradeMind AI - Quantitative Risk Management & Position Sizing Engine
// Computes exact position sizes, pip values, notional value, and fees.
// Enforces strict mathematical risk guardrails.
// =====================================================================

import { RiskCalculationResult, RiskCalculatorInputs, UserRiskSettings } from '../../types/risk';

export const DEFAULT_RISK_SETTINGS: UserRiskSettings = {
  riskPerTradePct: 0.5, // 0.5% per trade
  maxDailyLossPct: 1.5, // 1.5% maximum daily loss limit
  maxSimultaneousPositions: 2, // Maximum 2 concurrent trades
  hypotheticalBalance: 10000, // 10,000 USD default hypothetical balance
  allowMartingale: false,
  enforceFixedStopLoss: true,
};

/**
 * Calculates position sizing, cash risk, and reward metrics
 */
export function calculateRiskAndPosition(inputs: RiskCalculatorInputs): RiskCalculationResult {
  const {
    marketType,
    symbol,
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    lotOrContractSize,
    pipOrTickSize,
  } = inputs;

  const warnings: string[] = [];

  // Guard: Positive balance
  if (accountBalance <= 0) {
    throw new Error('Account balance must be greater than zero');
  }

  // Guard: Risk % check
  if (riskPercentage <= 0 || riskPercentage > 5.0) {
    warnings.push('Risk percentage exceeds recommended institutional threshold (0.5% - 1.0%)');
  }

  // Stop loss distance
  const stopLossDistancePrice = Math.abs(entryPrice - stopLossPrice);
  if (stopLossDistancePrice === 0) {
    throw new Error('Entry price and stop loss price cannot be identical');
  }

  const stopLossDistancePips = stopLossDistancePrice / pipOrTickSize;
  const takeProfitDistancePrice = Math.abs(takeProfitPrice - entryPrice);

  // Cash risk
  const riskAmountCash = (accountBalance * riskPercentage) / 100;
  const potentialProfitCash = (riskAmountCash * takeProfitDistancePrice) / stopLossDistancePrice;
  const potentialRiskRewardRatio = Number((takeProfitDistancePrice / stopLossDistancePrice).toFixed(2));

  const isRiskRewardAcceptable = potentialRiskRewardRatio >= 2.0;
  if (!isRiskRewardAcceptable) {
    warnings.push(`Risk/Reward ratio of 1:${potentialRiskRewardRatio} is below the 1:2.0 discipline rule`);
  }

  let positionSizeUnits = 0;
  let positionSizeLotsOrContracts = 0;
  let positionNotionalValue = 0;
  let estimatedFeeAllowance = 0;

  if (marketType === 'forex') {
    // -------------------------------------------------------------
    // FOREX POSITION SIZING (Lots & Pips)
    // -------------------------------------------------------------
    // Pip value for 1 standard lot = (pipSize / entryPrice) * lotSize, or approx 10 USD per pip for USD quote
    const pipValuePerStandardLot = (pipOrTickSize / (entryPrice > 10 ? entryPrice : 1)) * lotOrContractSize;
    const effectivePipValuePerLot = symbol.endsWith('/USD') ? 10 : pipValuePerStandardLot;

    // Lots = Risk Cash / (Stop Loss Pips * Pip Value per Lot)
    const rawLots = riskAmountCash / (stopLossDistancePips * effectivePipValuePerLot);
    positionSizeLotsOrContracts = Number(Math.max(0.01, rawLots).toFixed(2));
    positionSizeUnits = Number((positionSizeLotsOrContracts * lotOrContractSize).toFixed(0));
    positionNotionalValue = Number((positionSizeUnits * (symbol.endsWith('/USD') ? 1 : entryPrice)).toFixed(2));
    // Forex spread / commission estimate ($7 per lot round-turn)
    estimatedFeeAllowance = Number((positionSizeLotsOrContracts * 7.0).toFixed(2));
  } else {
    // -------------------------------------------------------------
    // CRYPTOCURRENCY POSITION SIZING (Coins & USD Notional)
    // -------------------------------------------------------------
    // Coin Units = Risk Cash / Price Distance per coin
    const rawCoins = riskAmountCash / stopLossDistancePrice;
    positionSizeUnits = Number(rawCoins.toFixed(4));
    positionSizeLotsOrContracts = positionSizeUnits;
    positionNotionalValue = Number((positionSizeUnits * entryPrice).toFixed(2));
    // Approx 0.05% taker fee round-trip
    estimatedFeeAllowance = Number((positionNotionalValue * 0.001).toFixed(2));
  }

  if (positionNotionalValue > accountBalance * 10) {
    warnings.push('Notional position exceeds 10x account equity. Excessive effective leverage detected.');
  }

  const leverageAdvisory =
    'CRITICAL RISK PRINCIPLE: Leverage does NOT reduce risk. Higher leverage solely decreases the collateral/margin required to open the position, while exponentially magnifying liquidation hazard and spread drag. Always size according to fixed percentage cash risk and structural stop loss.';

  return {
    riskAmountCash: Number(riskAmountCash.toFixed(2)),
    stopLossDistancePrice: Number(stopLossDistancePrice.toFixed(6)),
    stopLossDistancePips: Number(stopLossDistancePips.toFixed(1)),
    positionSizeUnits,
    positionSizeLotsOrContracts,
    potentialProfitCash: Number(potentialProfitCash.toFixed(2)),
    potentialRiskRewardRatio,
    isRiskRewardAcceptable,
    positionNotionalValue,
    estimatedFeeAllowance,
    warnings,
    leverageAdvisory,
  };
}

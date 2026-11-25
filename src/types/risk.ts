// =====================================================================
// TradeMind AI - Risk Management Domain Types
// =====================================================================

export interface RiskCalculatorInputs {
  marketType: 'crypto' | 'forex';
  symbol: string;
  accountBalance: number;
  riskPercentage: number; // e.g. 0.5% default, up to 2.0%
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  lotOrContractSize: number; // 100,000 for standard forex lot, 1 for crypto
  pipOrTickSize: number; // 0.0001 for EUR/USD, 0.01 for JPY, 0.1 for BTC
}

export interface RiskCalculationResult {
  riskAmountCash: number; // Balance * risk%
  stopLossDistancePrice: number;
  stopLossDistancePips: number;
  positionSizeUnits: number; // exact units of base asset
  positionSizeLotsOrContracts: number; // Lots for forex, coins for crypto
  potentialProfitCash: number;
  potentialRiskRewardRatio: number;
  isRiskRewardAcceptable: boolean; // >= 2.0
  positionNotionalValue: number;
  estimatedFeeAllowance: number;
  warnings: string[];
  leverageAdvisory: string;
}

export interface UserRiskSettings {
  riskPerTradePct: number; // default 0.5%
  maxDailyLossPct: number; // default 1.5%
  maxSimultaneousPositions: number; // default 2
  hypotheticalBalance: number; // default 10,000 USD
  allowMartingale: false; // strictly false
  enforceFixedStopLoss: true;
}

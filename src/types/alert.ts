// =====================================================================
// TradeMind AI - Alert Engine & Notification Domain Types
// Defines user-defined price alerts, structural breaks, indicator alerts,
// notification channels, cooldowns, and Supabase entity schemas.
// =====================================================================

import { MarketType } from './market';

export type AlertType =
  | 'PRICE_CROSS_ABOVE'
  | 'PRICE_CROSS_BELOW'
  | 'SUPPORT_LEVEL'
  | 'RESISTANCE_LEVEL'
  | 'INDICATOR_RSI'
  | 'STRUCTURAL_BOS'
  | 'AI_ANALYSIS_COMPLETE'
  | 'RISK_VIOLATION';

export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'MUTED' | 'DELETED';

export interface AlertRule {
  id: string;
  userId?: string;
  symbol: string;
  marketType: MarketType;
  alertType: AlertType;
  targetPrice?: number;
  conditionParam?: string; // e.g., 'RSI > 70', 'RSI < 30', 'BOS_BULLISH'
  title: string;
  note?: string;
  status: AlertStatus;
  cooldownMinutes: number; // Minimum minutes between successive triggers (default 15m)
  lastTriggeredAt?: number;
  createdAt: number;
}

export interface AlertEvent {
  id: string;
  alertRuleId?: string;
  symbol: string;
  marketType: MarketType;
  alertType: AlertType;
  triggeredPrice: number;
  headline: string;
  message: string;
  timestamp: number;
  acknowledgedAt?: number;
  isRead: boolean;
}

export interface NotificationPreferences {
  breakoutAlerts: boolean; // BOS and CHoCH structural alerts
  aiAnalysisAlerts: boolean; // Confirmed 8+/10 setups
  priceAlerts: boolean; // Crossing above/below targets
  riskAlerts: boolean; // Drawdown & position size violations
  soundEnabled: boolean;
  expoPushToken?: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

export interface NotificationPayload {
  title: string;
  body: string;
  channelId?: 'trade_alerts' | 'ai_analysis' | 'risk_warnings';
  data?: {
    screen?: string;
    symbol?: string;
    alertId?: string;
    analysisId?: string;
    marketType?: MarketType;
  };
}

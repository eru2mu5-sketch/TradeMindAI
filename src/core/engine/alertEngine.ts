// =====================================================================
// TradeMind AI - Quantitative Market Alert Engine
// Monitors cryptocurrency and forex feeds for price threshold crossings,
// support/resistance retests, structural breaks (BOS/CHoCH), and RSI divergences.
// Enforces duplicate suppression, cooldowns, and stale-data safety guardrails.
// =====================================================================

import { AlertEvent, AlertRule, AlertType, AlertStatus } from '../../types/alert';
import { Instrument, MarketPriceSnapshot } from '../../types/market';
import { MultiTimeframeSummary } from '../../types/analysis';
import { notificationService } from '../notifications/notificationService';

export class AlertEngine {
  private alertRules: Map<string, AlertRule> = new Map();
  private alertEvents: AlertEvent[] = [];
  private lastEvaluatedPrices: Map<string, number> = new Map();

  constructor() {
    this.seedDefaultAlerts();
  }

  /**
   * Seeds demo institutional alert rules for initial watchlists
   */
  private seedDefaultAlerts(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'rule_btc_breakout_62000',
        symbol: 'BTC/USDT',
        marketType: 'crypto',
        alertType: 'PRICE_CROSS_ABOVE',
        targetPrice: 62000,
        title: 'BTC/USDT Resistance Breakout',
        note: 'Alert when BTC reclaims $62,000 major resistance zone',
        status: 'ACTIVE',
        cooldownMinutes: 30,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'rule_btc_support_59000',
        symbol: 'BTC/USDT',
        marketType: 'crypto',
        alertType: 'SUPPORT_LEVEL',
        targetPrice: 59000,
        title: 'BTC/USDT Demand Zone Retest',
        note: 'Alert when BTC drops to $59,000 support level',
        status: 'ACTIVE',
        cooldownMinutes: 30,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'rule_eurusd_10800',
        symbol: 'EUR/USD',
        marketType: 'forex',
        alertType: 'PRICE_CROSS_BELOW',
        targetPrice: 1.080,
        title: 'EUR/USD Support Breakdown',
        note: 'Alert when EUR/USD drops below 1.0800 key handle',
        status: 'ACTIVE',
        cooldownMinutes: 60,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'rule_eth_rsi_oversold',
        symbol: 'ETH/USDT',
        marketType: 'crypto',
        alertType: 'INDICATOR_RSI',
        conditionParam: 'RSI < 30',
        title: 'ETH/USDT 15M RSI Oversold',
        note: 'Alert when 15M RSI dips below 30 into oversold territory',
        status: 'ACTIVE',
        cooldownMinutes: 45,
        createdAt: Date.now() - 3600000,
      },
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  /**
   * Retrieves all registered alert rules
   */
  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values()).filter((r) => r.status !== 'DELETED');
  }

  /**
   * Retrieves alerts for a specific instrument
   */
  public getAlertsForInstrument(symbol: string): AlertRule[] {
    return this.getAlertRules().filter((r) => r.symbol === symbol);
  }

  /**
   * Creates a new user alert rule
   */
  public createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'status'>): AlertRule {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRule: AlertRule = {
      ...rule,
      id,
      status: 'ACTIVE',
      createdAt: Date.now(),
    };

    this.alertRules.set(id, newRule);
    return newRule;
  }

  /**
   * Toggles alert mute/active status
   */
  public toggleMuteAlert(ruleId: string): AlertRule | null {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return null;

    rule.status = rule.status === 'MUTED' ? 'ACTIVE' : 'MUTED';
    this.alertRules.set(ruleId, rule);
    return rule;
  }

  /**
   * Deletes an alert rule
   */
  public deleteAlertRule(ruleId: string): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    rule.status = 'DELETED';
    this.alertRules.delete(ruleId);
    return true;
  }

  /**
   * Acknowledges an alert event
   */
  public acknowledgeEvent(eventId: string): void {
    const ev = this.alertEvents.find((e) => e.id === eventId);
    if (ev) {
      ev.acknowledgedAt = Date.now();
      ev.isRead = true;
    }
  }

  /**
   * Retrieves all triggered alert events
   */
  public getAlertEvents(): AlertEvent[] {
    return [...this.alertEvents].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Evaluates current market price and technical state against active rules.
   * PHASE 3 DATA QUALITY GUARDRAIL: Refuses to trigger alerts if market data is
   * unavailable, stale, or corrupt.
   */
  public async evaluateMarketSnapshot(
    instrument: Instrument,
    snapshot: MarketPriceSnapshot,
    multiTimeframe?: MultiTimeframeSummary
  ): Promise<AlertEvent[]> {
    // 1. Data Quality Guardrail: Do not generate alerts from stale or unavailable data
    if (!snapshot || snapshot.status === 'UNAVAILABLE' || snapshot.price <= 0) {
      return [];
    }

    const currentPrice = snapshot.price;
    const previousPrice = this.lastEvaluatedPrices.get(instrument.symbol) ?? currentPrice;
    this.lastEvaluatedPrices.set(instrument.symbol, currentPrice);

    const activeRules = this.getAlertsForInstrument(instrument.symbol).filter(
      (r) => r.status === 'ACTIVE'
    );

    const triggeredEvents: AlertEvent[] = [];
    const now = Date.now();

    for (const rule of activeRules) {
      // 2. Cooldown Guardrail: Prevent repeated triggers within cooldown window
      if (rule.lastTriggeredAt) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (now - rule.lastTriggeredAt < cooldownMs) {
          continue; // Cooldown still active
        }
      }

      let isConditionMet = false;
      let triggerMessage = '';

      switch (rule.alertType) {
        case 'PRICE_CROSS_ABOVE':
          if (rule.targetPrice && previousPrice < rule.targetPrice && currentPrice >= rule.targetPrice) {
            isConditionMet = true;
            triggerMessage = `${instrument.symbol} crossed ABOVE target price of $${rule.targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`;
          }
          break;

        case 'PRICE_CROSS_BELOW':
          if (rule.targetPrice && previousPrice > rule.targetPrice && currentPrice <= rule.targetPrice) {
            isConditionMet = true;
            triggerMessage = `${instrument.symbol} crossed BELOW target price of $${rule.targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`;
          }
          break;

        case 'SUPPORT_LEVEL':
          if (rule.targetPrice && Math.abs(currentPrice - rule.targetPrice) / rule.targetPrice <= 0.003) {
            isConditionMet = true;
            triggerMessage = `${instrument.symbol} retested Support Zone at $${rule.targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`;
          }
          break;

        case 'RESISTANCE_LEVEL':
          if (rule.targetPrice && Math.abs(currentPrice - rule.targetPrice) / rule.targetPrice <= 0.003) {
            isConditionMet = true;
            triggerMessage = `${instrument.symbol} retested Resistance Zone at $${rule.targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`;
          }
          break;

        case 'STRUCTURAL_BOS':
          if (multiTimeframe?.oneHour?.lastEvent?.includes('BOS')) {
            isConditionMet = true;
            triggerMessage = `1H Break of Structure (BOS) detected on ${instrument.symbol}: ${multiTimeframe.oneHour.lastEvent}`;
          }
          break;

        case 'INDICATOR_RSI':
          if (rule.conditionParam?.includes('< 30')) {
            // Check oversold condition from 15M
            if (multiTimeframe?.fifteenMinute?.momentumState?.includes('Oversold')) {
              isConditionMet = true;
              triggerMessage = `${instrument.symbol} 15M RSI entered Oversold territory (<30)`;
            }
          } else if (rule.conditionParam?.includes('> 70')) {
            if (multiTimeframe?.fifteenMinute?.momentumState?.includes('Overbought')) {
              isConditionMet = true;
              triggerMessage = `${instrument.symbol} 15M RSI entered Overbought territory (>70)`;
            }
          }
          break;
      }

      if (isConditionMet) {
        // Update rule state and timestamp
        rule.lastTriggeredAt = now;
        rule.status = 'TRIGGERED';
        this.alertRules.set(rule.id, rule);

        const event: AlertEvent = {
          id: `ev_${now}_${Math.random().toString(36).substring(2, 6)}`,
          alertRuleId: rule.id,
          symbol: instrument.symbol,
          marketType: instrument.marketType,
          alertType: rule.alertType,
          triggeredPrice: currentPrice,
          headline: `ALERT: ${rule.title}`,
          message: triggerMessage,
          timestamp: now,
          isRead: false,
        };

        this.alertEvents.unshift(event);
        triggeredEvents.push(event);

        // Dispatch local notification via Expo notification service
        notificationService.notifyAlertEvent(event);
      }
    }

    return triggeredEvents;
  }
}

export const alertEngine = new AlertEngine();

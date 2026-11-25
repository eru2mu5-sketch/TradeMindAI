// =====================================================================
// TradeMind AI - Risk Management Calculator Screen
// Calculates exact position sizing, pip value, cash risk, fee allowance,
// and leverage warnings for both Cryptocurrency and Forex instruments.
// =====================================================================

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { Colors, Spacing } from '../theme/colors';
import { calculateRiskAndPosition } from '../core/engine/riskCalculator';
import { RiskCalculationResult } from '../types/risk';

export const RiskCalculatorScreen: React.FC<{ route?: any }> = ({ route }) => {
  const [marketType, setMarketType] = useState<'crypto' | 'forex'>('crypto');
  const [symbol, setSymbol] = useState<string>(route?.params?.symbol || 'BTC/USDT');
  const [accountBalance, setAccountBalance] = useState<string>('10000');
  const [riskPercent, setRiskPercent] = useState<string>('0.5'); // Default 0.5%
  const [entryPrice, setEntryPrice] = useState<string>(route?.params?.entry?.toString() || '95000');
  const [stopLoss, setStopLoss] = useState<string>(route?.params?.stop?.toString() || '94000');
  const [takeProfit, setTakeProfit] = useState<string>(route?.params?.tp?.toString() || '97500');

  const [result, setResult] = useState<RiskCalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const handleCalculate = () => {
    setCalcError(null);
    try {
      const balance = parseFloat(accountBalance);
      const riskPct = parseFloat(riskPercent);
      const entry = parseFloat(entryPrice);
      const stop = parseFloat(stopLoss);
      const tp = parseFloat(takeProfit);

      if (isNaN(balance) || isNaN(riskPct) || isNaN(entry) || isNaN(stop) || isNaN(tp)) {
        throw new Error('Please enter valid numeric values for all parameters');
      }

      const pipOrTick = marketType === 'crypto' ? 0.1 : symbol.includes('JPY') ? 0.01 : 0.0001;
      const lotOrContract = marketType === 'crypto' ? 1.0 : 100000.0;

      const res = calculateRiskAndPosition({
        marketType,
        symbol,
        accountBalance: balance,
        riskPercentage: riskPct,
        entryPrice: entry,
        stopLossPrice: stop,
        takeProfitPrice: tp,
        lotOrContractSize: lotOrContract,
        pipOrTickSize: pipOrTick,
      });

      setResult(res);
    } catch (err: any) {
      setCalcError(err.message || 'Calculation failed');
      setResult(null);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Risk Calculator"
        subtitle="Mathematical Position Sizing & Guardrails"
        isLive={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Market Type Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, marketType === 'crypto' && styles.tabActive]}
            onPress={() => {
              setMarketType('crypto');
              setSymbol('BTC/USDT');
              setEntryPrice('95000');
              setStopLoss('94000');
              setTakeProfit('97500');
            }}
          >
            <Text style={[styles.tabText, marketType === 'crypto' && styles.tabTextActive]}>
              Cryptocurrency
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, marketType === 'forex' && styles.tabActive]}
            onPress={() => {
              setMarketType('forex');
              setSymbol('EUR/USD');
              setEntryPrice('1.0850');
              setStopLoss('1.0825');
              setTakeProfit('1.0900');
            }}
          >
            <Text style={[styles.tabText, marketType === 'forex' && styles.tabTextActive]}>
              Forex Currency Pairs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>INSTRUMENT SYMBOL</Text>
            <TextInput
              style={styles.input}
              value={symbol}
              onChangeText={setSymbol}
              placeholder="e.g. BTC/USDT or EUR/USD"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>ACCOUNT BALANCE ($)</Text>
              <TextInput
                style={styles.input}
                value={accountBalance}
                onChangeText={setAccountBalance}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>RISK PER TRADE (%)</Text>
              <TextInput
                style={styles.input}
                value={riskPercent}
                onChangeText={setRiskPercent}
                keyboardType="numeric"
                placeholder="0.5"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ENTRY PRICE</Text>
            <TextInput
              style={styles.input}
              value={entryPrice}
              onChangeText={setEntryPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: Colors.bearish }]}>STOP LOSS PRICE</Text>
              <TextInput
                style={[styles.input, { borderColor: Colors.bearish }]}
                value={stopLoss}
                onChangeText={setStopLoss}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: Colors.bullish }]}>TAKE PROFIT TARGET</Text>
              <TextInput
                style={[styles.input, { borderColor: Colors.bullish }]}
                value={takeProfit}
                onChangeText={setTakeProfit}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.calcButton} onPress={handleCalculate}>
            <Text style={styles.calcButtonText}>Calculate Exact Position Size</Text>
          </TouchableOpacity>

          {calcError && <Text style={styles.errorText}>⚠ {calcError}</Text>}
        </View>

        {/* Calculation Results Card */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>QUANTITATIVE SIZING REPORT</Text>

            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultItemLabel}>RECOMMENDED SIZE</Text>
                <Text style={[styles.resultItemValue, { color: Colors.accent }]}>
                  {marketType === 'forex'
                    ? `${result.positionSizeLotsOrContracts} Lots`
                    : `${result.positionSizeUnits} ${symbol.split('/')[0]}`}
                </Text>
                <Text style={styles.resultItemSub}>
                  {marketType === 'forex' ? `${result.positionSizeUnits.toLocaleString()} Units` : 'Base coins'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultItemLabel}>MAX CASH RISK</Text>
                <Text style={[styles.resultItemValue, { color: Colors.bearish }]}>
                  ${result.riskAmountCash.toLocaleString()}
                </Text>
                <Text style={styles.resultItemSub}>Exact {riskPercent}% of equity</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultItemLabel}>ESTIMATED PROFIT</Text>
                <Text style={[styles.resultItemValue, { color: Colors.bullish }]}>
                  +${result.potentialProfitCash.toLocaleString()}
                </Text>
                <Text style={styles.resultItemSub}>Target R:R 1:{result.potentialRiskRewardRatio}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultItemLabel}>NOTIONAL VALUE</Text>
                <Text style={styles.resultItemValue}>${result.positionNotionalValue.toLocaleString()}</Text>
                <Text style={styles.resultItemSub}>Fee Est: ${result.estimatedFeeAllowance}</Text>
              </View>
            </View>

            {/* Warnings */}
            {result.warnings.map((w, idx) => (
              <View key={idx} style={styles.warningBox}>
                <Text style={styles.warningText}>⚠ {w}</Text>
              </View>
            ))}

            {/* Institutional Leverage Principle */}
            <View style={styles.advisoryBox}>
              <Text style={styles.advisoryTitle}>LEVERAGE & MARGIN EDUCATION</Text>
              <Text style={styles.advisoryText}>{result.leverageAdvisory}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  calcButton: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  calcButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  errorText: {
    fontSize: 12,
    color: Colors.bearish,
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  resultTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
    marginBottom: Spacing.md,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  resultItem: {
    width: '48.5%',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    padding: Spacing.md,
  },
  resultItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  resultItemValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 3,
  },
  resultItemSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  warningBox: {
    backgroundColor: Colors.warningSoft,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  warningText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
  advisoryBox: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  advisoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  advisoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});

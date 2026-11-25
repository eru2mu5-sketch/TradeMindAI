// =====================================================================
// TradeMind AI - Multi-Timeframe Alignment Matrix Component
// Visualizes 4H macro, 1H structure, 15M setup, and 5M trigger status.
// =====================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { MultiTimeframeSummary } from '../types/analysis';

interface MultiTimeframeMatrixProps {
  summary: MultiTimeframeSummary;
}

export const MultiTimeframeMatrix: React.FC<MultiTimeframeMatrixProps> = ({ summary }) => {
  const { fourHour, oneHour, fifteenMinute, fiveMinute } = summary;

  const getTrendColor = (t: string) => {
    if (t === 'BULLISH' || t === 'HIGHER_HIGHS_AND_LOWS') return Colors.bullish;
    if (t === 'BEARISH' || t === 'LOWER_HIGHS_AND_LOWS') return Colors.bearish;
    return Colors.neutral;
  };

  const tfRows = [
    {
      timeframe: '4H',
      badge: fourHour.trend,
      badgeColor: getTrendColor(fourHour.trend),
      title: 'Macro Direction & Key Levels',
      detail: fourHour.emaAlignment,
      extra: fourHour.majorKeyLevels,
    },
    {
      timeframe: '1H',
      badge: oneHour.structure.replace(/_/g, ' '),
      badgeColor: getTrendColor(oneHour.structure),
      title: 'Market Structure & Liquidity',
      detail: oneHour.lastEvent,
      extra: oneHour.liquidityContext,
    },
    {
      timeframe: '15M',
      badge: fifteenMinute.setupType.split(' ')[0],
      badgeColor: Colors.accent,
      title: 'Setup & Order Flow Context',
      detail: fifteenMinute.setupType,
      extra: `${fifteenMinute.pullbackStatus} • ${fifteenMinute.fvgContext}`,
    },
    {
      timeframe: '5M',
      badge: fiveMinute.rejectionDetected ? 'REJECTION' : 'CONTINUATION',
      badgeColor: fiveMinute.rejectionDetected ? Colors.bullish : Colors.warning,
      title: 'LTF Entry Trigger & Invalidation',
      detail: fiveMinute.triggerCandle,
      extra: `Invalidation: ${fiveMinute.invalidationPrice.toFixed(2)}`,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>MULTI-TIMEFRAME ALIGNMENT MATRIX</Text>

      <View style={styles.list}>
        {tfRows.map((row, idx) => (
          <View key={idx} style={styles.rowCard}>
            <View style={styles.tfCol}>
              <View style={styles.tfBadge}>
                <Text style={styles.tfText}>{row.timeframe}</Text>
              </View>
              <View style={[styles.statusPill, { borderColor: row.badgeColor }]}>
                <Text style={[styles.statusPillText, { color: row.badgeColor }]}>{row.badge}</Text>
              </View>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowDetail}>{row.detail}</Text>
              <Text style={styles.rowExtra}>{row.extra}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tfCol: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
    paddingRight: Spacing.sm,
    marginRight: Spacing.md,
  },
  tfBadge: {
    backgroundColor: Colors.elevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  tfText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowDetail: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  rowExtra: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

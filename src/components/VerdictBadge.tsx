// =====================================================================
// TradeMind AI - Verdict & Setup Status Badge Component
// =====================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { TradingDecision, SetupStatus } from '../types/analysis';

interface VerdictBadgeProps {
  decision: TradingDecision;
  setupStatus: SetupStatus;
  size?: 'normal' | 'large';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  decision,
  setupStatus,
  size = 'normal',
}) => {
  const isLong = decision === 'LONG';
  const isShort = decision === 'SHORT';
  const isNoTrade = decision === 'NO TRADE';

  const baseColor = isLong ? Colors.bullish : isShort ? Colors.bearish : Colors.neutral;
  const softBg = isLong ? Colors.bullishSoft : isShort ? Colors.bearishSoft : Colors.neutralSoft;
  const borderColor = isLong ? Colors.bullishBorder : isShort ? Colors.bearishBorder : Colors.neutralBorder;

  const statusLabel =
    setupStatus === 'CONFIRMED'
      ? 'CONFIRMED SETUP'
      : setupStatus === 'DEVELOPING'
      ? 'DEVELOPING SETUP'
      : 'NO EDGE / RANGEBOUND';

  if (size === 'large') {
    return (
      <View style={[styles.largeCard, { backgroundColor: softBg, borderColor }]}>
        <View style={styles.topRow}>
          <View style={[styles.pulseDot, { backgroundColor: baseColor }]} />
          <Text style={[styles.statusSubtitle, { color: baseColor }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.largeVerdictText, { color: baseColor }]}>{decision}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badgeContainer, { backgroundColor: softBg, borderColor }]}>
      <View style={[styles.dot, { backgroundColor: baseColor }]} />
      <Text style={[styles.verdictText, { color: baseColor }]}>{decision}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  largeCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  largeVerdictText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  verdictText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

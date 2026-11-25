// =====================================================================
// TradeMind AI - Technical Score Meter & Radar Breakdown Component
// Displays 0-10 score with 5-pillar breakdown and quant interpretation.
// =====================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { ScorePillarBreakdown } from '../types/analysis';

interface ScoreMeterProps {
  scoreBreakdown: ScorePillarBreakdown;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ scoreBreakdown }) => {
  const {
    totalScore,
    trendAlignment,
    marketStructure,
    momentum,
    volumeAndVolatility,
    entryConfirmation,
    interpretation,
    pillarComments,
  } = scoreBreakdown;

  const scoreColor =
    totalScore >= 8.0 ? Colors.bullish : totalScore >= 6.0 ? Colors.warning : Colors.bearish;

  const pillars = [
    { name: 'Trend Alignment', value: trendAlignment, max: 2.0, comment: pillarComments.trend },
    { name: 'Market Structure', value: marketStructure, max: 2.0, comment: pillarComments.structure },
    { name: 'Momentum', value: momentum, max: 2.0, comment: pillarComments.momentum },
    { name: 'Volume & Volatility', value: volumeAndVolatility, max: 2.0, comment: pillarComments.volume },
    { name: 'Entry Confirmation', value: entryConfirmation, max: 2.0, comment: pillarComments.entry },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>TECHNICAL ALIGNMENT SCORE</Text>
          <Text style={[styles.interpretationText, { color: scoreColor }]}>{interpretation}</Text>
        </View>
        <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{totalScore.toFixed(1)}</Text>
          <Text style={styles.scoreMax}>/10</Text>
        </View>
      </View>

      <View style={styles.pillarsContainer}>
        {pillars.map((p, idx) => {
          const pct = Math.min(100, (p.value / p.max) * 100);
          return (
            <View key={idx} style={styles.pillarRow}>
              <View style={styles.pillarHeader}>
                <Text style={styles.pillarName}>{p.name}</Text>
                <Text style={styles.pillarValue}>
                  {p.value.toFixed(1)} <Text style={styles.pillarMax}>/ {p.max.toFixed(1)}</Text>
                </Text>
              </View>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
              </View>
              <Text style={styles.pillarComment} numberOfLines={1}>
                {p.comment}
              </Text>
            </View>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  interpretationText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 2,
  },
  pillarsContainer: {
    gap: Spacing.sm,
  },
  pillarRow: {
    marginVertical: 2,
  },
  pillarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillarName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pillarValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pillarMax: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  barBackground: {
    height: 6,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  pillarComment: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 3,
  },
});

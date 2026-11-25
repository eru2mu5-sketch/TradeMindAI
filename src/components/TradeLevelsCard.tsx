// =====================================================================
// TradeMind AI - Trade Levels Ladder & Execution Guide Component
// Displays Entry Zone, Stop Loss, TP1, TP2, TP3, R:R, and Invalidation.
// =====================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { TradeLevels } from '../types/analysis';

interface TradeLevelsCardProps {
  levels: TradeLevels;
  direction: 'LONG' | 'SHORT';
  invalidationConditions: string[];
  preEntryRequirements: string[];
}

export const TradeLevelsCard: React.FC<TradeLevelsCardProps> = ({
  levels,
  direction,
  invalidationConditions,
  preEntryRequirements,
}) => {
  const isLong = direction === 'LONG';
  const dirColor = isLong ? Colors.bullish : Colors.bearish;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>CALCULATED TRADE LEVELS</Text>
        <View style={[styles.rrBadge, { borderColor: dirColor }]}>
          <Text style={[styles.rrText, { color: dirColor }]}>
            TARGET R:R 1:{levels.riskRewardTP1}
          </Text>
        </View>
      </View>

      {/* Levels Ladder */}
      <View style={styles.ladder}>
        {/* Take Profit 3 (Optional) */}
        {levels.takeProfit3 && (
          <View style={[styles.levelRow, styles.tpRow]}>
            <View style={styles.levelTag}>
              <Text style={styles.tpTagText}>TP 3</Text>
              <Text style={styles.rrSmallText}>1:{levels.riskRewardTP3}</Text>
            </View>
            <View style={styles.levelPriceCol}>
              <Text style={styles.tpPrice}>{levels.takeProfit3.toLocaleString()}</Text>
              <Text style={styles.levelSub}>HTF Structural Pool</Text>
            </View>
          </View>
        )}

        {/* Take Profit 2 */}
        <View style={[styles.levelRow, styles.tpRow]}>
          <View style={styles.levelTag}>
            <Text style={styles.tpTagText}>TP 2</Text>
            <Text style={styles.rrSmallText}>1:{levels.riskRewardTP2}</Text>
          </View>
          <View style={styles.levelPriceCol}>
            <Text style={styles.tpPrice}>{levels.takeProfit2.toLocaleString()}</Text>
            <Text style={styles.levelSub}>Runner / Secondary Target</Text>
          </View>
        </View>

        {/* Take Profit 1 */}
        <View style={[styles.levelRow, styles.tpRow, styles.primaryTp]}>
          <View style={[styles.levelTag, { backgroundColor: Colors.bullishSoft }]}>
            <Text style={[styles.tpTagText, { color: Colors.bullish }]}>TP 1</Text>
            <Text style={[styles.rrSmallText, { color: Colors.bullish }]}>1:{levels.riskRewardTP1}</Text>
          </View>
          <View style={styles.levelPriceCol}>
            <Text style={[styles.tpPrice, { color: Colors.bullish }]}>{levels.takeProfit1.toLocaleString()}</Text>
            <Text style={styles.levelSub}>Primary Target (Take 50% off table)</Text>
          </View>
        </View>

        {/* Entry Zone */}
        <View style={[styles.levelRow, styles.entryRow]}>
          <View style={[styles.levelTag, { backgroundColor: Colors.cardSecondary }]}>
            <Text style={styles.entryTagText}>ENTRY</Text>
          </View>
          <View style={styles.levelPriceCol}>
            <Text style={styles.entryPrice}>{levels.entryPrice.toLocaleString()}</Text>
            <Text style={styles.levelSub}>
              Zone: {levels.entryZone.min.toLocaleString()} - {levels.entryZone.max.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Stop Loss */}
        <View style={[styles.levelRow, styles.slRow]}>
          <View style={[styles.levelTag, { backgroundColor: Colors.bearishSoft }]}>
            <Text style={[styles.slTagText, { color: Colors.bearish }]}>STOP</Text>
            <Text style={[styles.rrSmallText, { color: Colors.bearish }]}>
              {levels.stopLossDistancePipsOrPoints} pips
            </Text>
          </View>
          <View style={styles.levelPriceCol}>
            <Text style={[styles.slPrice, { color: Colors.bearish }]}>
              {levels.stopLossPrice.toLocaleString()}
            </Text>
            <Text style={styles.levelSub}>{levels.stopLossReasoning}</Text>
          </View>
        </View>
      </View>

      {/* Execution Requirements & Invalidation */}
      <View style={styles.notesSection}>
        <Text style={styles.noteLabel}>ENTRY CONDITIONS REQUIRED:</Text>
        {preEntryRequirements.map((req, i) => (
          <Text key={i} style={styles.noteItem}>• {req}</Text>
        ))}

        <Text style={[styles.noteLabel, { marginTop: Spacing.sm, color: Colors.bearish }]}>
          TRADE INVALIDATION:
        </Text>
        {invalidationConditions.map((inv, i) => (
          <Text key={i} style={[styles.noteItem, { color: Colors.textSecondary }]}>• {inv}</Text>
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
  },
  rrBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  rrText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ladder: {
    gap: Spacing.xs,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tpRow: {
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  primaryTp: {
    borderColor: Colors.bullish,
  },
  entryRow: {
    borderColor: Colors.accent,
  },
  slRow: {
    borderColor: Colors.bearish,
  },
  levelTag: {
    width: 65,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tpTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.bullish,
  },
  entryTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent,
  },
  slTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.bearish,
  },
  rrSmallText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 1,
  },
  levelPriceCol: {
    flex: 1,
  },
  tpPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bullish,
  },
  entryPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  slPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bearish,
  },
  levelSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  notesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteItem: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },
});

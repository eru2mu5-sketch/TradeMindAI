// =====================================================================
// TradeMind AI - Performance Analytics Screen
// Displays quantitative trading metrics: Win Rate, Average R, Profit Factor,
// Expectancy, Max Drawdown, Equity Curve, and Long/Short & Crypto/Forex breakdowns.
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { Colors, Spacing } from '../theme/colors';
import { PerformanceAnalytics } from '../types/journal';
import { journalService } from '../core/engine/journalService';

export const PerformanceScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceAnalytics | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'hypothetical_analysis' | 'user_executed_trade'>('all');

  const loadMetrics = () => {
    const data = journalService.calculatePerformanceAnalytics(
      filterType === 'all' ? undefined : filterType
    );
    setMetrics(data);
  };

  useEffect(() => {
    loadMetrics();
  }, [filterType]);

  if (!metrics) return null;

  return (
    <View style={styles.container}>
      <Header
        title="Performance Analytics"
        subtitle="Institutional Quantitative Metrics"
        isLive={true}
      />

      {/* Dataset Filter */}
      <View style={styles.filterRow}>
        {(['all', 'hypothetical_analysis', 'user_executed_trade'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.filterChip, filterType === t && styles.filterChipActive]}
            onPress={() => setFilterType(t)}
          >
            <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>
              {t === 'all' ? 'All Records' : t === 'hypothetical_analysis' ? 'AI Hypothetical' : 'User Executed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sample Benchmark Notice */}
        <View style={styles.benchmarkNoticeBox}>
          <Text style={styles.benchmarkNoticeTitle}>BENCHMARK SAMPLE DATASET</Text>
          <Text style={styles.benchmarkNoticeText}>
            Metrics currently include initial historical demonstration samples. Recorded live trades and journal updates will dynamically adjust these quantitative statistics.
          </Text>
        </View>

        {/* Core Metric Cards Grid */}
        <View style={styles.metricGrid}>
          {/* Win Rate */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>WIN RATE</Text>
            <Text style={[styles.metricValue, { color: Colors.bullish }]}>{metrics.winRatePct}%</Text>
            <Text style={styles.metricSub}>
              {metrics.winningTrades}W / {metrics.losingTrades}L ({metrics.totalTrades} Total)
            </Text>
          </View>

          {/* Profit Factor */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PROFIT FACTOR</Text>
            <Text style={[styles.metricValue, { color: Colors.accent }]}>{metrics.profitFactor}</Text>
            <Text style={styles.metricSub}>Gross Wins / Gross Losses</Text>
          </View>

          {/* Average R */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>AVERAGE R</Text>
            <Text style={[styles.metricValue, { color: metrics.averageR >= 0 ? Colors.bullish : Colors.bearish }]}>
              {metrics.averageR > 0 ? '+' : ''}{metrics.averageR} R
            </Text>
            <Text style={styles.metricSub}>Per closed trade</Text>
          </View>

          {/* Expectancy R */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>EXPECTANCY</Text>
            <Text style={[styles.metricValue, { color: metrics.expectancyR >= 0 ? Colors.bullish : Colors.bearish }]}>
              {metrics.expectancyR > 0 ? '+' : ''}{metrics.expectancyR} R
            </Text>
            <Text style={styles.metricSub}>Stat mathematical edge</Text>
          </View>
        </View>

        {/* Max Drawdown Banner */}
        <View style={styles.drawdownCard}>
          <View style={styles.drawdownLeft}>
            <Text style={styles.drawdownLabel}>MAX DRAWDOWN</Text>
            <Text style={styles.drawdownValue}>{metrics.maxDrawdownPct}%</Text>
          </View>
          <View style={styles.drawdownRight}>
            <Text style={styles.drawdownSub}>
              Total R Accumulated: <Text style={{ color: Colors.bullish, fontWeight: '700' }}>+{metrics.totalRGained} R</Text>
            </Text>
          </View>
        </View>

        {/* Breakdown by Direction & Market */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>PERFORMANCE SEGMENTATION</Text>

          <View style={styles.segmentRow}>
            <View style={styles.segmentCol}>
              <Text style={styles.segLabel}>LONG Win Rate</Text>
              <Text style={[styles.segValue, { color: Colors.bullish }]}>{metrics.longWinRatePct}%</Text>
            </View>
            <View style={styles.segmentCol}>
              <Text style={styles.segLabel}>SHORT Win Rate</Text>
              <Text style={[styles.segValue, { color: Colors.bearish }]}>{metrics.shortWinRatePct}%</Text>
            </View>
          </View>

          <View style={[styles.segmentRow, { marginTop: Spacing.md }]}>
            <View style={styles.segmentCol}>
              <Text style={styles.segLabel}>Crypto Win Rate</Text>
              <Text style={[styles.segValue, { color: Colors.accent }]}>{metrics.cryptoWinRatePct}%</Text>
            </View>
            <View style={styles.segmentCol}>
              <Text style={styles.segLabel}>Forex Win Rate</Text>
              <Text style={[styles.segValue, { color: Colors.accentPurple }]}>{metrics.forexWinRatePct}%</Text>
            </View>
          </View>
        </View>

        {/* Equity Curve in R-Multiples */}
        <View style={styles.equityCard}>
          <Text style={styles.sectionTitle}>CUMULATIVE EQUITY CURVE (R-MULTIPLES)</Text>
          <View style={styles.equityList}>
            {metrics.equityCurve.map((pt, i) => (
              <View key={i} style={styles.equityPointRow}>
                <Text style={styles.equityDate}>{pt.date}</Text>
                <View style={styles.equityBarWrapper}>
                  <View style={[styles.equityBar, { width: `${Math.min(100, Math.max(10, pt.cumulativeR * 12))}%` }]} />
                </View>
                <Text style={styles.equityR}>+{pt.cumulativeR.toFixed(2)} R</Text>
              </View>
            ))}
          </View>
        </View>

        {/* R Distribution Histogram */}
        <View style={styles.rDistCard}>
          <Text style={styles.sectionTitle}>R-MULTIPLE DISTRIBUTION</Text>
          <View style={styles.rDistList}>
            {metrics.rDistribution.map((bin, i) => (
              <View key={i} style={styles.rBinRow}>
                <Text style={styles.rBinLabel}>{bin.rBin}</Text>
                <View style={styles.rBinBarWrap}>
                  <View style={[styles.rBinBar, { width: `${Math.min(100, bin.count * 25)}%`, backgroundColor: bin.rBin.includes('+') ? Colors.bullish : bin.rBin.includes('-') ? Colors.bearish : Colors.neutral }]} />
                </View>
                <Text style={styles.rBinCount}>{bin.count} trades</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  benchmarkNoticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: Spacing.md,
  },
  benchmarkNoticeTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accentGold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  benchmarkNoticeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  drawdownCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  drawdownLeft: {},
  drawdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  drawdownValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.bearish,
    marginTop: 2,
  },
  drawdownRight: {
    alignItems: 'flex-end',
  },
  drawdownSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  breakdownCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
    marginBottom: Spacing.md,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentCol: {
    flex: 1,
  },
  segLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  segValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  equityCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  equityList: {
    gap: Spacing.sm,
  },
  equityPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equityDate: {
    width: 60,
    fontSize: 10,
    color: Colors.textMuted,
  },
  equityBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  equityBar: {
    height: '100%',
    backgroundColor: Colors.bullish,
    borderRadius: 4,
  },
  equityR: {
    width: 55,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.bullish,
    textAlign: 'right',
  },
  rDistCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  rDistList: {
    gap: Spacing.sm,
  },
  rBinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rBinLabel: {
    width: 90,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rBinBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  rBinBar: {
    height: '100%',
    borderRadius: 4,
  },
  rBinCount: {
    width: 60,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});

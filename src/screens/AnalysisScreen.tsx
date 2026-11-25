// =====================================================================
// TradeMind AI - AI Market Analysis Screen
// Central operational screen: executes quantitative multi-timeframe analysis,
// displays structured verdict, levels, score, and saves to journal.
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { VerdictBadge } from '../components/VerdictBadge';
import { ScoreMeter } from '../components/ScoreMeter';
import { MultiTimeframeMatrix } from '../components/MultiTimeframeMatrix';
import { TradeLevelsCard } from '../components/TradeLevelsCard';
import { Colors, Spacing } from '../theme/colors';
import { Instrument } from '../types/market';
import { AIAnalysisResult } from '../types/analysis';
import { INITIAL_WATCHLIST_INSTRUMENTS, marketDataService } from '../core/api/marketDataService';
import { executeMarketAnalysis } from '../core/engine/aiAnalysisEngine';
import { journalService } from '../core/engine/journalService';
import { notificationService } from '../core/notifications/notificationService';
import { AlertModal } from '../components/AlertModal';

interface AnalysisScreenProps {
  route: any;
  navigation: any;
}

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ route, navigation }) => {
  const initialInstrument = route?.params?.instrument || INITIAL_WATCHLIST_INSTRUMENTS[0];
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>(initialInstrument);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [savedToJournal, setSavedToJournal] = useState<boolean>(false);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);

  useEffect(() => {
    if (route?.params?.instrument) {
      setSelectedInstrument(route.params.instrument);
    }
  }, [route?.params?.instrument]);

  const runAnalysis = async () => {
    setLoading(true);
    setSavedToJournal(false);
    try {
      // 1. Fetch 4-timeframe candle datasets
      const candlesMap = await marketDataService.getMultiTimeframeCandles(selectedInstrument);

      // 2. Execute structured quantitative analysis
      const result = await executeMarketAnalysis({
        instrument: selectedInstrument,
        candlesMap,
        dataSources: [
          selectedInstrument.marketType === 'crypto' ? 'Binance API (Direct Public)' : 'TwelveData / Forex Engine',
          'TradeMind Multi-Timeframe Core (4H/1H/15M/5M)',
        ],
      });

      setAnalysis(result);

      // 3. Dispatch notification if confirmed setup is detected
      if (result.decision === 'LONG' || result.decision === 'SHORT') {
        notificationService.notifyAIAnalysisComplete(result);
      }
    } catch (err: any) {
      Alert.alert('Analysis Error', err.message || 'Failed to complete market analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedInstrument.symbol]);

  const handleSaveToJournal = () => {
    if (!analysis || !analysis.levels || analysis.decision === 'NO TRADE') {
      Alert.alert('Cannot Save', 'Only confirmed or developing trade setups with valid levels can be saved.');
      return;
    }

    journalService.saveAnalysisToJournal(analysis, selectedInstrument);
    setSavedToJournal(true);
    Alert.alert('Saved to Journal', `Trade plan for ${selectedInstrument.symbol} has been recorded.`);
  };

  return (
    <View style={styles.container}>
      <Header
        title="AI Analysis"
        subtitle="Multi-Timeframe Structural Model"
        isLive={true}
      />

      {/* Horizontal Instrument Selector */}
      <View style={styles.instrumentSelectorRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instrumentScroll}>
          {INITIAL_WATCHLIST_INSTRUMENTS.map((inst) => {
            const isSelected = inst.symbol === selectedInstrument.symbol;
            return (
              <TouchableOpacity
                key={inst.id}
                style={[styles.instChip, isSelected && styles.instChipActive]}
                onPress={() => setSelectedInstrument(inst)}
              >
                <Text style={[styles.instChipText, isSelected && styles.instChipTextActive]}>
                  {inst.symbol}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Run Analysis Trigger Button */}
        <TouchableOpacity
          style={[styles.runButton, loading && styles.runButtonDisabled]}
          onPress={runAnalysis}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <Text style={styles.runButtonText}>⚡ Recalculate Multi-Timeframe Analysis</Text>
          )}
        </TouchableOpacity>

        {loading && !analysis && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Synthesizing 4H, 1H, 15M, and 5M structure...</Text>
          </View>
        )}

        {analysis && (
          <View>
            {/* Top Verdict Card */}
            <VerdictBadge
              decision={analysis.decision}
              setupStatus={analysis.setupStatus}
              size="large"
            />

            {/* Quick Metadata Bar */}
            <View style={styles.metaBar}>
              <Text style={styles.metaText}>
                Instrument: <Text style={styles.metaValue}>{analysis.instrumentSymbol}</Text>
              </Text>
              <Text style={styles.metaText}>
                Regime: <Text style={styles.metaValue}>{analysis.marketCondition}</Text>
              </Text>
              <Text style={styles.metaText}>
                Bias: <Text style={styles.metaValue}>{analysis.fundamental.bias}</Text>
              </Text>
            </View>

            {/* Trade Levels (If LONG or SHORT) */}
            {analysis.levels && analysis.decision !== 'NO TRADE' && (
              <TradeLevelsCard
                levels={analysis.levels}
                direction={analysis.decision as 'LONG' | 'SHORT'}
                invalidationConditions={analysis.invalidationConditions}
                preEntryRequirements={analysis.preEntryRequirements}
              />
            )}

            {/* Technical Score Card */}
            <ScoreMeter scoreBreakdown={analysis.scoreBreakdown} />

            {/* Multi-Timeframe Alignment Matrix */}
            <MultiTimeframeMatrix summary={analysis.multiTimeframe} />

            {/* AI Quantitative Reasoning Narrative */}
            <View style={styles.reasoningCard}>
              <View style={styles.reasoningHeader}>
                <Text style={styles.reasoningTitle}>AI QUANTITATIVE REASONING</Text>
                <Text style={styles.modelTag}>{analysis.modelUsed}</Text>
              </View>
              <Text style={styles.reasoningBody}>{analysis.detailedReasoning}</Text>

              <Text style={[styles.reasoningTitle, { marginTop: Spacing.md }]}>PRIMARY RATIONALE</Text>
              {analysis.primaryReasons.map((r, i) => (
                <Text key={i} style={styles.bulletItem}>✔ {r}</Text>
              ))}

              <Text style={[styles.reasoningTitle, { marginTop: Spacing.md, color: Colors.warning }]}>
                RISKS & EVENT HORIZON
              </Text>
              {analysis.riskFactors.map((r, i) => (
                <Text key={i} style={[styles.bulletItem, { color: Colors.textSecondary }]}>⚠ {r}</Text>
              ))}

              <Text style={[styles.reasoningTitle, { marginTop: Spacing.md, color: Colors.accent }]}>
                ALTERNATIVE SCENARIO
              </Text>
              <Text style={styles.reasoningBody}>{analysis.alternativeScenario}</Text>
            </View>

            {/* Action Buttons */}
            {analysis.levels && analysis.decision !== 'NO TRADE' && (
              <View style={styles.bottomActions}>
                <TouchableOpacity
                  style={[styles.saveJournalButton, savedToJournal && styles.savedButton]}
                  onPress={handleSaveToJournal}
                  disabled={savedToJournal}
                >
                  <Text style={styles.saveJournalButtonText}>
                    {savedToJournal ? '✓ Saved to Journal' : '💾 Save Setup to Journal'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertShortcutButton}
                  onPress={() => setShowAlertModal(true)}
                >
                  <Text style={styles.alertShortcutText}>🔔 Set Alert for this Setup</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calcShortcutButton}
                  onPress={() =>
                    navigation.navigate('Performance', {
                      screen: 'Risk Calculator',
                      params: {
                        symbol: analysis.instrumentSymbol,
                        entry: analysis.levels?.entryPrice,
                        stop: analysis.levels?.stopLossPrice,
                        tp: analysis.levels?.takeProfit1,
                      },
                    })
                  }
                >
                  <Text style={styles.calcShortcutText}>🧮 Open Risk Calculator</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {showAlertModal && (
        <AlertModal
          visible={showAlertModal}
          instrument={selectedInstrument}
          currentPrice={analysis?.levels?.entryPrice}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  instrumentSelectorRow: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingVertical: Spacing.xs,
  },
  instrumentScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  instChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.cardSecondary,
  },
  instChipActive: {
    backgroundColor: Colors.accent,
  },
  instChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  instChipTextActive: {
    color: Colors.textInverse,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  runButton: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  metaValue: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  reasoningCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  reasoningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reasoningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
  },
  modelTag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.accent,
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reasoningBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
  },
  bottomActions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  saveJournalButton: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  savedButton: {
    borderColor: Colors.bullish,
    backgroundColor: Colors.bullishSoft,
  },
  saveJournalButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  alertShortcutButton: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  alertShortcutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  calcShortcutButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  calcShortcutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

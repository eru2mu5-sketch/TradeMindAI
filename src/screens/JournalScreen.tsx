// =====================================================================
// TradeMind AI - Trading Journal Screen
// Logs and tracks saved AI trade setups and user-executed trades.
// Computes R-multiple outcomes and distinguishes hypothetical from actual.
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { Colors, Spacing } from '../theme/colors';
import { JournalEntry, TradeOutcome, JournalEntryType } from '../types/journal';
import { journalService } from '../core/engine/journalService';

export const JournalScreen: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'all' | JournalEntryType>('all');
  const [sampleFilter, setSampleFilter] = useState<'all' | 'live' | 'sample'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const loadEntries = () => {
    const list = journalService.getEntries();
    setEntries(list);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = entries.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (typeFilter !== 'all' && e.entryType !== typeFilter) return false;
    if (sampleFilter === 'live' && e.isSampleData === true) return false;
    if (sampleFilter === 'sample' && !e.isSampleData) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        e.instrumentSymbol.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.direction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateOutcome = (status: TradeOutcome, r: number) => {
    if (!selectedEntry) return;
    journalService.updateTradeOutcome(selectedEntry.id, {
      status,
      outcomeR: r,
    });
    setSelectedEntry(null);
    loadEntries();
  };

  const renderJournalCard = ({ item }: { item: JournalEntry }) => {
    const isLong = item.direction === 'LONG';
    const dirColor = isLong ? Colors.bullish : Colors.bearish;

    const isWon = item.status === 'WON';
    const isLost = item.status === 'LOST';
    const outcomeColor = isWon ? Colors.bullish : isLost ? Colors.bearish : Colors.neutral;

    const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedEntry(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.symbolRow}>
              <Text style={styles.symbolText}>{item.instrumentSymbol}</Text>
              <View style={[styles.dirBadge, { backgroundColor: isLong ? Colors.bullishSoft : Colors.bearishSoft }]}>
                <Text style={[styles.dirText, { color: dirColor }]}>{item.direction}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: item.entryType === 'hypothetical_analysis' ? Colors.cardSecondary : 'rgba(129, 140, 248, 0.15)' }]}>
                <Text style={[styles.typeText, { color: item.entryType === 'hypothetical_analysis' ? Colors.textMuted : Colors.accentPurple }]}>
                  {item.entryType === 'hypothetical_analysis' ? 'HYPOTHETICAL' : 'ACTUAL'}
                </Text>
              </View>
              {item.isSampleData && (
                <View style={styles.sampleBadge}>
                  <Text style={styles.sampleBadgeText}>SAMPLE DATA</Text>
                </View>
              )}
            </View>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { borderColor: outcomeColor }]}>
              <Text style={[styles.statusText, { color: outcomeColor }]}>{item.status}</Text>
            </View>
            {item.outcomeR !== undefined && (
              <Text style={[styles.rText, { color: outcomeColor }]}>
                {item.outcomeR > 0 ? '+' : ''}{item.outcomeR.toFixed(2)} R
              </Text>
            )}
          </View>
        </View>

        {/* Levels Grid */}
        <View style={styles.levelsGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>ENTRY</Text>
            <Text style={styles.gridValue}>{item.plannedEntry.toLocaleString()}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>STOP LOSS</Text>
            <Text style={[styles.gridValue, { color: Colors.bearish }]}>
              {item.plannedStopLoss.toLocaleString()}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>TARGET TP</Text>
            <Text style={[styles.gridValue, { color: Colors.bullish }]}>
              {item.plannedTakeProfit.toLocaleString()}
            </Text>
          </View>
        </View>

        {item.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Trading Journal"
        subtitle={`${entries.length} Recorded Analyses & Trades`}
        isLive={true}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by symbol, direction, or notes..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['ALL', 'OPEN', 'WON', 'LOST'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
            onPress={() => setStatusFilter(st)}
          >
            <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Data Source Segment Filter */}
      <View style={styles.sourceFilterRow}>
        {(
          [
            { id: 'all', label: 'All Records' },
            { id: 'live', label: 'Live Trades Only' },
            { id: 'sample', label: 'Sample Benchmark' },
          ] as const
        ).map((sf) => (
          <TouchableOpacity
            key={sf.id}
            style={[styles.sourceChip, sampleFilter === sf.id && styles.sourceChipActive]}
            onPress={() => setSampleFilter(sf.id)}
          >
            <Text
              style={[
                styles.sourceChipText,
                sampleFilter === sf.id && styles.sourceChipTextActive,
              ]}
            >
              {sf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderJournalCard}
        contentContainerStyle={styles.listContent}
      />

      {/* Outcome Selection Modal */}
      {selectedEntry && (
        <Modal
          visible={!!selectedEntry}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedEntry(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Update Trade Outcome</Text>
              <Text style={styles.modalSubtitle}>
                {selectedEntry.instrumentSymbol} ({selectedEntry.direction})
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.bullishSoft, borderColor: Colors.bullish }]}
                  onPress={() => handleUpdateOutcome('WON', 2.0)}
                >
                  <Text style={[styles.modalBtnText, { color: Colors.bullish }]}>✓ WON (+2.0 R)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.bearishSoft, borderColor: Colors.bearish }]}
                  onPress={() => handleUpdateOutcome('LOST', -1.0)}
                >
                  <Text style={[styles.modalBtnText, { color: Colors.bearish }]}>✗ LOST (-1.0 R)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.cardSecondary, borderColor: Colors.border }]}
                  onPress={() => handleUpdateOutcome('BREAKEVEN', 0.0)}
                >
                  <Text style={[styles.modalBtnText, { color: Colors.neutral }]}>— BREAKEVEN (0.0 R)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedEntry(null)}
              >
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
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
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dirBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dirText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  sampleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sampleBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.accentGold,
    letterSpacing: 0.5,
  },
  sourceFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sourceChip: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  sourceChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accent,
  },
  sourceChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sourceChipTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  levelsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  notesText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalBox: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    gap: Spacing.sm,
  },
  modalBtn: {
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  closeBtnText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});

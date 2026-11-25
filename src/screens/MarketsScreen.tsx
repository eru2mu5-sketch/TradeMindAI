// =====================================================================
// TradeMind AI - Markets Dashboard Screen
// Live cryptocurrency and forex watchlists with price freshness,
// market sessions, trend indicators, and quick analysis access.
// =====================================================================

import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { Colors, Spacing } from '../theme/colors';
import { WatchlistItem, MarketType, Instrument } from '../types/market';
import { marketDataService, getCurrentMarketSession } from '../core/api/marketDataService';
import { alertEngine } from '../core/engine/alertEngine';
import { AlertModal } from '../components/AlertModal';

interface MarketsScreenProps {
  navigation: any;
}

export const MarketsScreen: React.FC<MarketsScreenProps> = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'crypto' | 'forex'>('all');
  const [session, setSession] = useState<string>(getCurrentMarketSession());
  const [alertTarget, setAlertTarget] = useState<{ instrument: Instrument; price: number } | null>(null);

  const loadData = async () => {
    try {
      const items = await marketDataService.getWatchlist();
      setWatchlist(items);
      setSession(getCurrentMarketSession());

      // Evaluate active alert rules on fresh live market data
      for (const item of items) {
        alertEngine.evaluateMarketSnapshot(item.instrument, item.snapshot);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // 5-second polling for live prices
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredItems = watchlist.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.instrument.marketType === selectedFilter;
  });

  const renderMarketItem = ({ item }: { item: WatchlistItem }) => {
    const { instrument, snapshot } = item;
    const isBullish = snapshot.change24h > 0;
    const isBearish = snapshot.change24h < 0;
    const changeColor = isBullish ? Colors.bullish : isBearish ? Colors.bearish : Colors.neutral;
    const changePrefix = isBullish ? '+' : '';

    const dataStatus = snapshot.status || (snapshot.isLive ? 'LIVE' : 'SIMULATED');
    const statusBg =
      dataStatus === 'LIVE'
        ? 'rgba(16, 185, 129, 0.15)'
        : dataStatus === 'SIMULATED'
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(239, 68, 68, 0.15)';
    const statusColor =
      dataStatus === 'LIVE'
        ? Colors.bullish
        : dataStatus === 'SIMULATED'
        ? Colors.accentGold
        : Colors.bearish;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AI Analysis', { instrument })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.symbolCol}>
            <View style={styles.symbolRow}>
              <Text style={styles.symbolText}>{instrument.symbol}</Text>
              <View style={[styles.marketTypeBadge, { backgroundColor: instrument.marketType === 'crypto' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(129, 140, 248, 0.15)' }]}>
                <Text style={[styles.marketTypeText, { color: instrument.marketType === 'crypto' ? Colors.accent : Colors.accentPurple }]}>
                  {instrument.marketType.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.dataStatusBadge, { backgroundColor: statusBg }]}>
                <Text style={[styles.dataStatusText, { color: statusColor }]}>
                  {dataStatus}
                </Text>
              </View>
            </View>
            <Text style={styles.displayNameText}>{instrument.displayName}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.priceText}>
              ${snapshot.price.toLocaleString(undefined, {
                minimumFractionDigits: instrument.precision,
                maximumFractionDigits: instrument.precision,
              })}
            </Text>
            <View style={[styles.changeBadge, { backgroundColor: isBullish ? Colors.bullishSoft : isBearish ? Colors.bearishSoft : Colors.neutralSoft }]}>
              <Text style={[styles.changeText, { color: changeColor }]}>
                {changePrefix}{snapshot.change24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.providerText}>
              Provider: <Text style={styles.providerHighlight}>{snapshot.dataProvider}</Text>
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertTarget({ instrument, price: snapshot.price })}
            >
              <Text style={styles.alertButtonText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chartButton}
              onPress={() => navigation.navigate('Chart', { symbol: instrument.symbol })}
            >
              <Text style={styles.chartButtonText}>Chart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={() => navigation.navigate('AI Analysis', { instrument })}
            >
              <Text style={styles.analyzeButtonText}>Analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="TradeMind AI"
        subtitle="Professional Market Intelligence"
        session={session}
        isLive={watchlist.some((w) => w.snapshot.isLive)}
        onRefresh={onRefresh}
      />

      {/* Market Type Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'crypto', 'forex'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, selectedFilter === tab && styles.filterTabActive]}
            onPress={() => setSelectedFilter(tab)}
          >
            <Text style={[styles.filterTabText, selectedFilter === tab && styles.filterTabTextActive]}>
              {tab === 'all' ? 'Watchlist (All)' : tab === 'crypto' ? 'Cryptocurrency' : 'Forex'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.instrument.id}
        renderItem={renderMarketItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      />

      {alertTarget && (
        <AlertModal
          visible={!!alertTarget}
          instrument={alertTarget.instrument}
          currentPrice={alertTarget.price}
          onClose={() => setAlertTarget(null)}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  filterTabActive: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textPrimary,
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
  },
  symbolCol: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  symbolText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  marketTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marketTypeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dataStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dataStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  displayNameText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  changeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  footerLeft: {
    flex: 1,
  },
  providerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  providerHighlight: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  alertButton: {
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 12,
  },
  chartButton: {
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  analyzeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  analyzeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});

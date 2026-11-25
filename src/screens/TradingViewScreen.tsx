// =====================================================================
// TradeMind AI - TradingView Interactive Chart Screen
// Embeds licensed TradingView Lightweight Charts / Widget with multi-timeframe
// switches (4H, 1H, 15M, 5M), candlestick navigation, and symbol picker.
// =====================================================================

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Header } from '../components/Header';
import { Colors, Spacing } from '../theme/colors';
import { INITIAL_WATCHLIST_INSTRUMENTS } from '../core/api/marketDataService';
import { Timeframe } from '../types/market';

interface TradingViewScreenProps {
  route: any;
  navigation: any;
}

export const TradingViewScreen: React.FC<TradingViewScreenProps> = ({ route, navigation }) => {
  const initialSymbol = route?.params?.symbol || 'BTC/USDT';
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15m');

  // Convert symbol to TradingView format e.g. BINANCE:BTCUSDT or FX:EURUSD
  const getTradingViewSymbol = (sym: string): string => {
    if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('BNB')) {
      return `BINANCE:${sym.replace('/', '')}`;
    }
    return `FX:${sym.replace('/', '')}`;
  };

  const getIntervalString = (tf: Timeframe): string => {
    switch (tf) {
      case '4h': return '240';
      case '1h': return '60';
      case '15m': return '15';
      case '5m': return '5';
    }
  };

  const tvSymbol = getTradingViewSymbol(selectedSymbol);
  const interval = getIntervalString(selectedTimeframe);

  // TradingView Official Advanced Real-Time Chart Embed
  const chartHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body, html, #tv_chart_container {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #0B0F17;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="tv_chart_container"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
          new TradingView.widget({
            "autosize": true,
            "symbol": "${tvSymbol}",
            "interval": "${interval}",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#131A27",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": "tv_chart_container",
            "backgroundColor": "#0B0F17",
            "gridColor": "rgba(36, 50, 71, 0.4)",
            "studies": [
              "MASimple@tv-basicstudies",
              "RSI@tv-basicstudies",
              "MACD@tv-basicstudies"
            ]
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Header
        title="Interactive Charts"
        subtitle={`${selectedSymbol} • TradingView`}
        isLive={true}
      />

      {/* Symbol Bar */}
      <View style={styles.symbolSelectorBar}>
        {INITIAL_WATCHLIST_INSTRUMENTS.slice(0, 4).map((inst) => {
          const isSelected = inst.symbol === selectedSymbol;
          return (
            <TouchableOpacity
              key={inst.id}
              style={[styles.symbolChip, isSelected && styles.symbolChipActive]}
              onPress={() => setSelectedSymbol(inst.symbol)}
            >
              <Text style={[styles.symbolChipText, isSelected && styles.symbolChipTextActive]}>
                {inst.symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timeframe Bar */}
      <View style={styles.timeframeBar}>
        {(['4h', '1h', '15m', '5m'] as Timeframe[]).map((tf) => {
          const isSelected = tf === selectedTimeframe;
          return (
            <TouchableOpacity
              key={tf}
              style={[styles.tfButton, isSelected && styles.tfButtonActive]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text style={[styles.tfText, isSelected && styles.tfTextActive]}>
                {tf.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Chart Webview */}
      <View style={styles.chartWrapper}>
        <WebView
          originWhitelist={['*']}
          source={{ html: chartHtml }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  symbolSelectorBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  symbolChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.cardSecondary,
  },
  symbolChipActive: {
    backgroundColor: Colors.accent,
  },
  symbolChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  symbolChipTextActive: {
    color: Colors.textInverse,
  },
  timeframeBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    backgroundColor: Colors.cardSecondary,
    gap: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tfButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tfButtonActive: {
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tfText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tfTextActive: {
    color: Colors.accent,
  },
  chartWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

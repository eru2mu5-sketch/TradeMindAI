// =====================================================================
// TradeMind AI - Root Application Component
// Configures theme, navigation container, and notification tap router.
// =====================================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme/colors';
import { notificationService } from './src/core/notifications/notificationService';
import { INITIAL_WATCHLIST_INSTRUMENTS } from './src/core/api/marketDataService';

export const navigationRef = createNavigationContainerRef<any>();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.card,
    text: Colors.textPrimary,
    border: Colors.border,
    primary: Colors.accent,
  },
};

export default function App() {
  useEffect(() => {
    // 1. Initialize notification channels and register for push notifications
    notificationService.initChannels();
    notificationService.registerForPushNotifications();

    // 2. Setup notification response listener to handle user taps and deep-link
    const unsubscribe = notificationService.addNotificationTapListener((data) => {
      if (data && navigationRef.isReady()) {
        const targetScreen = data.screen || 'AI Analysis';
        if (targetScreen === 'AI Analysis' && data.symbol) {
          const instrument =
            INITIAL_WATCHLIST_INSTRUMENTS.find((i) => i.symbol === data.symbol) || {
              id: `inst_${data.symbol.replace('/', '').toLowerCase()}`,
              symbol: data.symbol,
              displayName: data.symbol,
              marketType: data.marketType || 'crypto',
              baseAsset: data.symbol.split('/')[0],
              quoteAsset: data.symbol.split('/')[1] || 'USDT',
              pipOrTickSize: 0.01,
              lotOrContractSize: 1.0,
              isActive: true,
              precision: 2,
            };
          navigationRef.navigate('AI Analysis', { instrument });
        } else {
          navigationRef.navigate(targetScreen);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <NavigationContainer ref={navigationRef} theme={CustomDarkTheme}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

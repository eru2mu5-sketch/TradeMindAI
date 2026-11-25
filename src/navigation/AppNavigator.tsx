// =====================================================================
// TradeMind AI - App Navigation Architecture
// 5 Core Tabs: Markets, AI Analysis, Trading Journal, Performance, Settings
// =====================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MarketsScreen } from '../screens/MarketsScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { PerformanceScreen } from '../screens/PerformanceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TradingViewScreen } from '../screens/TradingViewScreen';
import { RiskCalculatorScreen } from '../screens/RiskCalculatorScreen';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack for Markets + Chart
function MarketsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MarketsMain" component={MarketsScreen} />
      <Stack.Screen name="Chart" component={TradingViewScreen} />
    </Stack.Navigator>
  );
}

// Stack for Performance + Risk Calculator
function PerformanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerformanceMain" component={PerformanceScreen} />
      <Stack.Screen name="Risk Calculator" component={RiskCalculatorScreen} />
    </Stack.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Markets"
        component={MarketsStack}
        options={{
          tabBarLabel: 'Markets',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="AI Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: 'AI Analysis',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>⚡</Text>,
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarLabel: 'Journal',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📓</Text>,
        }}
      />
      <Tab.Screen
        name="Performance"
        component={PerformanceStack}
        options={{
          tabBarLabel: 'Performance',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📈</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>⚙</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 18,
  },
});

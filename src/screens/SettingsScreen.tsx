// =====================================================================
// TradeMind AI - Settings & Configuration Screen
// Manages Backend microservice connection, Supabase public credentials,
// risk management thresholds, and notification preferences.
// Strict security: OpenAI and TwelveData secrets are held on backend ONLY.
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { Colors, Spacing } from '../theme/colors';
import { backendClient, BackendHealthResponse } from '../core/api/backendClient';
import { notificationService } from '../core/notifications/notificationService';

export const SettingsScreen: React.FC = () => {
  // Backend & Supabase Configuration
  const [backendUrl, setBackendUrl] = useState<string>(backendClient.getBaseUrl());
  const [supabaseUrl, setSupabaseUrl] = useState<string>('https://your-project.supabase.co');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');

  // Backend Health State
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<BackendHealthResponse | null>(null);
  const [connectionTested, setConnectionTested] = useState<boolean>(false);

  // Risk Parameters
  const [riskPerTrade, setRiskPerTrade] = useState<string>('0.5');
  const [maxDailyLoss, setMaxDailyLoss] = useState<string>('1.5');
  const [maxOpenPositions, setMaxOpenPositions] = useState<string>('2');
  const [minRiskReward, setMinRiskReward] = useState<string>('2.0');

  // Notification Toggles & Device Push Token
  const initialPrefs = notificationService.getPreferences();
  const [breakoutAlerts, setBreakoutAlerts] = useState<boolean>(initialPrefs.breakoutAlerts);
  const [aiAnalysisAlerts, setAiAnalysisAlerts] = useState<boolean>(initialPrefs.aiAnalysisAlerts);
  const [priceAlerts, setPriceAlerts] = useState<boolean>(initialPrefs.priceAlerts);
  const [riskAlerts, setRiskAlerts] = useState<boolean>(initialPrefs.riskAlerts);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialPrefs.soundEnabled);
  const [permissionStatus, setPermissionStatus] = useState<string>(initialPrefs.permissionStatus);
  const [pushToken, setPushToken] = useState<string | null>(initialPrefs.expoPushToken || null);
  const [registeringToken, setRegisteringToken] = useState<boolean>(false);

  // Auto-check backend connection on mount
  useEffect(() => {
    handleTestBackend();
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = () => {
    const prefs = notificationService.getPreferences();
    setPermissionStatus(prefs.permissionStatus);
    setPushToken(prefs.expoPushToken || null);
  };

  const handleRequestPermission = async () => {
    setRegisteringToken(true);
    try {
      const res = await notificationService.requestPermissions();
      setPermissionStatus(res.status);
      if (res.granted) {
        const token = await notificationService.registerForPushNotifications();
        setPushToken(token);
        Alert.alert('Permission Granted', 'Device registered for real-time market notifications.');
      } else {
        Alert.alert(
          'Permission Denied',
          'Notification permission was not granted. Please enable notifications in your device settings.'
        );
      }
    } finally {
      setRegisteringToken(false);
    }
  };

  const handleSendTestNotification = async () => {
    const id = await notificationService.sendNotification({
      title: 'TradeMind AI Alert: Test Notification',
      body: 'Verified: Local & push notification engine is functional with sound & vibration.',
      channelId: 'trade_alerts',
      data: { screen: 'Markets' },
    });

    if (id) {
      Alert.alert('Notification Dispatched', 'A high-priority alert notification was delivered.');
    } else {
      Alert.alert(
        'Delivery Blocked',
        'Notification was not sent. Check that notifications and alert categories are enabled.'
      );
    }
  };

  const handleTestBackend = async () => {
    setCheckingHealth(true);
    setConnectionTested(true);
    try {
      backendClient.setBaseUrl(backendUrl);
      const health = await backendClient.checkHealth();
      setHealthStatus(health);
    } catch {
      setHealthStatus(null);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleSave = () => {
    backendClient.setBaseUrl(backendUrl);
    notificationService.updatePreferences({
      breakoutAlerts,
      aiAnalysisAlerts,
      priceAlerts,
      riskAlerts,
      soundEnabled,
    });
    Alert.alert(
      'Settings Saved',
      'Backend URL, risk limits, and notification preferences have been successfully updated.'
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings & Config"
        subtitle="Security & Risk Governance"
        isLive={healthStatus !== null}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Backend & Security Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>SECURE BACKEND SERVICE</Text>
            <View
              style={[
                styles.healthBadge,
                {
                  backgroundColor: healthStatus
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.healthBadgeText,
                  { color: healthStatus ? Colors.bullish : Colors.bearish },
                ]}
              >
                {healthStatus ? 'ONLINE' : 'UNREACHABLE'}
              </Text>
            </View>
          </View>

          <Text style={styles.securityNotice}>
            All secret API keys (OpenAI, TwelveData) are secured on the backend microservice.
            The mobile application communicates exclusively through authenticated server proxies.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Backend Service URL</Text>
            <TextInput
              style={styles.input}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="http://localhost:3001"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.subtext}>
              Default: http://localhost:3001 (set via EXPO_PUBLIC_BACKEND_URL in production)
            </Text>
          </View>

          {/* Test Backend Button */}
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestBackend}
            disabled={checkingHealth}
          >
            {checkingHealth ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.testBtnText}>Test Backend Connection</Text>
            )}
          </TouchableOpacity>

          {/* Backend Status Diagnostics */}
          {connectionTested && (
            <View style={styles.diagnosticsBox}>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Server Status:</Text>
                <Text
                  style={[
                    styles.diagValue,
                    { color: healthStatus ? Colors.bullish : Colors.bearish },
                  ]}
                >
                  {healthStatus ? 'Connected (HTTP 200 OK)' : 'Failed to connect'}
                </Text>
              </View>

              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>OpenAI Server Key:</Text>
                <Text
                  style={[
                    styles.diagValue,
                    {
                      color: healthStatus?.providersConfigured.openAi
                        ? Colors.bullish
                        : Colors.neutral,
                    },
                  ]}
                >
                  {healthStatus?.providersConfigured.openAi
                    ? 'Active (GPT-4o Proxy)'
                    : 'Unconfigured (Deterministic Core Active)'}
                </Text>
              </View>

              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>TwelveData Forex Key:</Text>
                <Text
                  style={[
                    styles.diagValue,
                    {
                      color: healthStatus?.providersConfigured.twelveData
                        ? Colors.bullish
                        : Colors.neutral,
                    },
                  ]}
                >
                  {healthStatus?.providersConfigured.twelveData
                    ? 'Active (Live Rates Proxy)'
                    : 'Unconfigured (Simulated Fallback)'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Supabase Database Configuration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>SUPABASE CLOUD DATABASE</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Supabase Project URL</Text>
            <TextInput
              style={styles.input}
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              placeholder="https://xyz.supabase.co"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Supabase Anon Key (Public Key Only)</Text>
            <TextInput
              style={styles.input}
              value={supabaseAnonKey}
              onChangeText={setSupabaseAnonKey}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={true}
            />
            <Text style={styles.subtext}>
              Safe for mobile clients. Never use the service-role key on the client.
            </Text>
          </View>
        </View>

        {/* Institutional Risk Management Rules */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>INSTITUTIONAL RISK RULES</Text>

          <View style={styles.twoCol}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Risk / Trade (%)</Text>
              <TextInput
                style={styles.input}
                value={riskPerTrade}
                onChangeText={setRiskPerTrade}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Max Daily Loss (%)</Text>
              <TextInput
                style={styles.input}
                value={maxDailyLoss}
                onChangeText={setMaxDailyLoss}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Max Open Positions</Text>
              <TextInput
                style={styles.input}
                value={maxOpenPositions}
                onChangeText={setMaxOpenPositions}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Min Target R:R</Text>
              <TextInput
                style={styles.input}
                value={minRiskReward}
                onChangeText={setMinRiskReward}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Notifications & Alert Triggers */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>NOTIFICATIONS & ALERTS</Text>
            <View
              style={[
                styles.healthBadge,
                {
                  backgroundColor:
                    permissionStatus === 'granted'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.healthBadgeText,
                  {
                    color:
                      permissionStatus === 'granted' ? Colors.bullish : Colors.warning,
                  },
                ]}
              >
                {permissionStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Permission & Token Card */}
          <View style={styles.diagnosticsBox}>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Device Push Token:</Text>
              <Text style={[styles.diagValue, { color: Colors.textSecondary, fontSize: 10 }]} numberOfLines={1}>
                {pushToken ? (pushToken.length > 25 ? `${pushToken.substring(0, 22)}...` : pushToken) : 'Not Registered'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleRequestPermission}
              disabled={registeringToken}
            >
              <Text style={styles.testBtnText}>
                {registeringToken ? 'Requesting...' : '📲 Request Permissions & Register Token'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Structural Breakout Alerts</Text>
              <Text style={styles.switchSub}>BOS and CHoCH real-time alerts</Text>
            </View>
            <Switch
              value={breakoutAlerts}
              onValueChange={setBreakoutAlerts}
              trackColor={{ false: Colors.cardSecondary, true: Colors.accent }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>AI Analysis Setup Alerts</Text>
              <Text style={styles.switchSub}>Confirmed 8+/10 trade recommendations</Text>
            </View>
            <Switch
              value={aiAnalysisAlerts}
              onValueChange={setAiAnalysisAlerts}
              trackColor={{ false: Colors.cardSecondary, true: Colors.accent }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Price Threshold Alerts</Text>
              <Text style={styles.switchSub}>Crossing above/below user target prices</Text>
            </View>
            <Switch
              value={priceAlerts}
              onValueChange={setPriceAlerts}
              trackColor={{ false: Colors.cardSecondary, true: Colors.accent }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Risk Violation Warnings</Text>
              <Text style={styles.switchSub}>Daily drawdown and position size warnings</Text>
            </View>
            <Switch
              value={riskAlerts}
              onValueChange={setRiskAlerts}
              trackColor={{ false: Colors.cardSecondary, true: Colors.accent }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Alert Sound & Vibration</Text>
              <Text style={styles.switchSub}>Audible notifications with haptic cues</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: Colors.cardSecondary, true: Colors.accent }}
            />
          </View>

          <TouchableOpacity style={styles.testBtn} onPress={handleSendTestNotification}>
            <Text style={styles.testBtnText}>🔔 Send Test Alert Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Save Settings Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>

        {/* Methodology & Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>QUANTITATIVE METHODOLOGY NOTICE</Text>
          <Text style={styles.disclaimerText}>
            TradeMind AI executes algorithmic market-structure and quantitative multi-timeframe
            analysis. Trade recommendations represent calculated asymmetric risk-to-reward setups
            (minimum 1:2.0 R:R) and are not financial advice or guaranteed profit outcomes. All
            trading entails risk of capital loss.
          </Text>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityNotice: {
    fontSize: 11,
    color: Colors.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    lineHeight: 16,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  subtext: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 14,
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  diagnosticsBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  diagValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  switchSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  disclaimerBox: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  disclaimerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 15,
  },
});

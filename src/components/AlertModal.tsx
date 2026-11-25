// =====================================================================
// TradeMind AI - Alert Creation & Management Modal
// Allows traders to set price crossing alerts, support/resistance alerts,
// structural break triggers, indicator conditions, and manage active rules.
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { Instrument } from '../types/market';
import { AlertRule, AlertType } from '../types/alert';
import { alertEngine } from '../core/engine/alertEngine';
import { notificationService } from '../core/notifications/notificationService';

interface AlertModalProps {
  visible: boolean;
  instrument: Instrument;
  currentPrice?: number;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  instrument,
  currentPrice,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [alertType, setAlertType] = useState<AlertType>('PRICE_CROSS_ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>(
    currentPrice ? (currentPrice * 1.01).toFixed(instrument.precision) : ''
  );
  const [title, setTitle] = useState<string>(`${instrument.symbol} Price Alert`);
  const [cooldown, setCooldown] = useState<number>(30);
  const [existingRules, setExistingRules] = useState<AlertRule[]>([]);

  const loadRules = () => {
    const list = alertEngine.getAlertsForInstrument(instrument.symbol);
    setExistingRules(list);
  };

  useEffect(() => {
    if (visible) {
      loadRules();
      if (currentPrice) {
        setTargetPrice(
          alertType === 'PRICE_CROSS_BELOW'
            ? (currentPrice * 0.99).toFixed(instrument.precision)
            : (currentPrice * 1.01).toFixed(instrument.precision)
        );
      }
    }
  }, [visible, instrument.symbol, alertType]);

  const handleCreateAlert = () => {
    const parsedPrice = parseFloat(targetPrice);
    if ((alertType === 'PRICE_CROSS_ABOVE' || alertType === 'PRICE_CROSS_BELOW' || alertType === 'SUPPORT_LEVEL' || alertType === 'RESISTANCE_LEVEL') && (!parsedPrice || parsedPrice <= 0)) {
      Alert.alert('Invalid Price', 'Please enter a valid numeric target price for this alert.');
      return;
    }

    alertEngine.createAlertRule({
      symbol: instrument.symbol,
      marketType: instrument.marketType,
      alertType,
      targetPrice: parsedPrice || undefined,
      conditionParam: alertType === 'INDICATOR_RSI' ? 'RSI < 30' : undefined,
      title: title.trim() || `${instrument.symbol} Alert`,
      cooldownMinutes: cooldown,
    });

    Alert.alert('Alert Created', `Monitoring ${instrument.symbol} for ${alertType.replace(/_/g, ' ')}.`);
    loadRules();
    setActiveTab('list');
  };

  const handleToggleMute = (ruleId: string) => {
    alertEngine.toggleMuteAlert(ruleId);
    loadRules();
  };

  const handleDelete = (ruleId: string) => {
    alertEngine.deleteAlertRule(ruleId);
    loadRules();
  };

  const handleSendTestNotification = async () => {
    await notificationService.sendNotification({
      title: `Test Alert: ${instrument.symbol}`,
      body: `Test notification sent successfully. Notifications are active and configured.`,
      channelId: 'trade_alerts',
      data: { screen: 'AI Analysis', symbol: instrument.symbol },
    });
    Alert.alert('Test Notification Sent', 'A local high-priority notification was dispatched.');
  };

  const ALERT_TYPES: Array<{ id: AlertType; label: string; desc: string }> = [
    { id: 'PRICE_CROSS_ABOVE', label: 'Cross Above', desc: 'Price surges above target' },
    { id: 'PRICE_CROSS_BELOW', label: 'Cross Below', desc: 'Price dips below target' },
    { id: 'SUPPORT_LEVEL', label: 'Support Retest', desc: 'Price enters demand support zone' },
    { id: 'RESISTANCE_LEVEL', label: 'Resistance Retest', desc: 'Price taps supply resistance zone' },
    { id: 'STRUCTURAL_BOS', label: '1H Break of Structure', desc: 'Candle close beyond swing pivot' },
    { id: 'INDICATOR_RSI', label: '15M RSI Divergence', desc: 'RSI overbought (>70) or oversold (<30)' },
  ];

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Set Market Alerts</Text>
              <Text style={styles.modalSubtitle}>
                {instrument.symbol} {currentPrice ? `• $${currentPrice.toLocaleString()}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'create' && styles.subTabActive]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.subTabText, activeTab === 'create' && styles.subTabTextActive]}>
                New Alert
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'list' && styles.subTabActive]}
              onPress={() => setActiveTab('list')}
            >
              <Text style={[styles.subTabText, activeTab === 'list' && styles.subTabTextActive]}>
                Active Alerts ({existingRules.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {activeTab === 'create' ? (
              <View style={styles.createForm}>
                {/* Alert Type Selector */}
                <Text style={styles.fieldLabel}>ALERT TRIGGER TYPE</Text>
                <View style={styles.typeGrid}>
                  {ALERT_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typeCard, alertType === t.id && styles.typeCardActive]}
                      onPress={() => setAlertType(t.id)}
                    >
                      <Text style={[styles.typeLabel, alertType === t.id && styles.typeLabelActive]}>
                        {t.label}
                      </Text>
                      <Text style={styles.typeDesc}>{t.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Target Price (if applicable) */}
                {(alertType === 'PRICE_CROSS_ABOVE' ||
                  alertType === 'PRICE_CROSS_BELOW' ||
                  alertType === 'SUPPORT_LEVEL' ||
                  alertType === 'RESISTANCE_LEVEL') && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>TARGET PRICE</Text>
                    <TextInput
                      style={styles.input}
                      value={targetPrice}
                      onChangeText={setTargetPrice}
                      keyboardType="numeric"
                      placeholder="e.g. 62500"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                )}

                {/* Alert Title */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CUSTOM ALERT NOTE / TITLE</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Watch for rejection"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Cooldown selector */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TRIGGER COOLDOWN</Text>
                  <View style={styles.cooldownRow}>
                    {[15, 30, 60, 240].map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={[styles.cooldownPill, cooldown === mins && styles.cooldownPillActive]}
                        onPress={() => setCooldown(mins)}
                      >
                        <Text
                          style={[
                            styles.cooldownText,
                            cooldown === mins && styles.cooldownTextActive,
                          ]}
                        >
                          {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity style={styles.saveAlertBtn} onPress={handleCreateAlert}>
                  <Text style={styles.saveAlertBtnText}>Activate Alert Rule</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.testBtn} onPress={handleSendTestNotification}>
                  <Text style={styles.testBtnText}>🔔 Send Test Device Notification</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {existingRules.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No alerts configured for {instrument.symbol}.</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('create')}>
                      <Text style={styles.emptyBtnText}>Create Your First Alert</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  existingRules.map((rule) => {
                    const isMuted = rule.status === 'MUTED';
                    return (
                      <View key={rule.id} style={styles.ruleCard}>
                        <View style={styles.ruleTop}>
                          <View>
                            <Text style={styles.ruleTitle}>{rule.title}</Text>
                            <Text style={styles.ruleSub}>
                              {rule.alertType.replace(/_/g, ' ')}{' '}
                              {rule.targetPrice ? `at $${rule.targetPrice.toLocaleString()}` : ''}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor: isMuted
                                  ? 'rgba(148, 163, 184, 0.15)'
                                  : 'rgba(56, 189, 248, 0.15)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                { color: isMuted ? Colors.neutral : Colors.accent },
                              ]}
                            >
                              {rule.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.ruleFooter}>
                          <Text style={styles.ruleCooldown}>Cooldown: {rule.cooldownMinutes}m</Text>
                          <View style={styles.ruleActions}>
                            <TouchableOpacity
                              style={styles.muteBtn}
                              onPress={() => handleToggleMute(rule.id)}
                            >
                              <Text style={styles.muteBtnText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={() => handleDelete(rule.id)}
                            >
                              <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: Colors.cardSecondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  subTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accent,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  subTabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  scrollBody: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  createForm: {
    gap: Spacing.md,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  typeGrid: {
    gap: Spacing.xs,
  },
  typeCard: {
    backgroundColor: Colors.cardSecondary,
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: Colors.accent,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  typeLabelActive: {
    color: Colors.accent,
  },
  typeDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  input: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  cooldownRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  cooldownPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cooldownPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  cooldownText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cooldownTextActive: {
    color: Colors.textInverse,
    fontWeight: '800',
  },
  saveAlertBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveAlertBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  testBtn: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listContainer: {
    gap: Spacing.sm,
  },
  emptyBox: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  ruleCard: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: 10,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  ruleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ruleSub: {
    fontSize: 11,
    color: Colors.accent,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ruleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  ruleCooldown: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  muteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  muteBtnText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    fontSize: 10,
    color: Colors.bearish,
    fontWeight: '700',
  },
});

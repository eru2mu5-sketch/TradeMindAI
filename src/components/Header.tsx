// =====================================================================
// TradeMind AI - Header Component
// =====================================================================

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../theme/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  session?: string;
  isLive?: boolean;
  onRefresh?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  session,
  isLive = true,
  onRefresh,
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.logoMark}>◆</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightColumn}>
        {session && (
          <View style={styles.sessionPill}>
            <View style={[styles.sessionDot, { backgroundColor: session === 'Weekend' ? Colors.neutral : Colors.accent }]} />
            <Text style={styles.sessionText}>{session}</Text>
          </View>
        )}

        <View style={[styles.statusBadge, { borderColor: isLive ? Colors.bullishBorder : Colors.warning }]}>
          <View style={[styles.statusDot, { backgroundColor: isLive ? Colors.bullish : Colors.warning }]} />
          <Text style={[styles.statusText, { color: isLive ? Colors.bullish : Colors.warning }]}>
            {isLive ? 'LIVE' : 'SIMULATED'}
          </Text>
        </View>

        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  leftColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMark: {
    fontSize: 16,
    color: Colors.accent,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  sessionText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

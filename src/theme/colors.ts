// =====================================================================
// TradeMind AI - Premium Dark-Mode Theme & Typography
// =====================================================================

export const Colors = {
  // Backgrounds
  background: '#0B0F17', // Deep dark charcoal
  card: '#131A27', // Dark navy card
  cardSecondary: '#1A2333', // Slightly lighter surface
  elevated: '#202B3D', // Elevated modals & dropdowns
  border: '#243247', // Clean divider borders
  borderSubtle: '#1C2738',

  // Semantic Status Colors
  bullish: '#00E676', // Vivid emerald green
  bullishSoft: 'rgba(0, 230, 118, 0.12)',
  bullishBorder: 'rgba(0, 230, 118, 0.3)',

  bearish: '#FF5252', // Vivid crimson red
  bearishSoft: 'rgba(255, 82, 82, 0.12)',
  bearishBorder: 'rgba(255, 82, 82, 0.3)',

  neutral: '#94A3B8', // Neutral grey for NO TRADE
  neutralSoft: 'rgba(148, 163, 184, 0.12)',
  neutralBorder: 'rgba(148, 163, 184, 0.25)',

  // Accents
  accent: '#38BDF8', // Cyan accent
  accentPurple: '#818CF8', // Indigo/purple
  accentGold: '#F59E0B', // Amber/gold for warnings & sample notices
  warning: '#F59E0B', // Amber for event risk / caution
  warningSoft: 'rgba(245, 158, 11, 0.12)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F17',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, color: Colors.textPrimary },
  titleMedium: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  titleSmall: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
  bodyLarge: { fontSize: 15, fontWeight: '400' as const, color: Colors.textSecondary },
  bodyMedium: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  numericLarge: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.5 },
  numericMedium: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
};

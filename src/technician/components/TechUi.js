import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTechTheme } from '../theme';

function useTechUiStyles() {
  const theme = useTechTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return {
    ...theme,
    styles,
  };
}

export function TechCard({ children, style }) {
  const { styles } = useTechUiStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function TechSection({ eyebrow, title, action }) {
  const { styles } = useTechUiStyles();

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function TechBadge({ label, tone = 'coral', style, textStyle }) {
  const { getTone, styles } = useTechUiStyles();
  const colors = getTone(tone);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.text }, textStyle]}>{label}</Text>
    </View>
  );
}

export function TechGradientButton({
  label,
  onPress,
  icon = 'arrow-right',
  variant = 'brand',
  style,
  textStyle,
}) {
  const { colors, gradients, styles } = useTechUiStyles();
  const gradientColors = variant === 'emerald' ? gradients.emerald : gradients.brand;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={style}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryButton}
      >
        <Text style={[styles.primaryButtonText, textStyle]}>{label}</Text>
        {icon ? <Icon name={icon} size={18} color={colors.white} /> : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function TechOutlineButton({ label, onPress, icon, tone = 'card', style }) {
  const { colors, styles } = useTechUiStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[
        styles.outlineButton,
        tone === 'danger' && styles.outlineDanger,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={tone === 'danger' ? colors.rose : colors.textSecondary} /> : null}
      <Text
        style={[
          styles.outlineButtonText,
          tone === 'danger' && { color: colors.rose },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function TechMetricCard({ label, value, subtitle, tone = 'gold', style }) {
  const { getTone, styles } = useTechUiStyles();
  const colors = getTone(tone);

  return (
    <TechCard style={[styles.metricCard, style]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      {subtitle ? <Text style={styles.metricSubtitle}>{subtitle}</Text> : null}
    </TechCard>
  );
}

export function TechIconBubble({ icon, tone = 'coral', size = 46 }) {
  const { getTone, styles } = useTechUiStyles();
  const colors = getTone(tone);

  return (
    <View
      style={[
        styles.iconBubble,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Icon name={icon} size={Math.max(20, size * 0.48)} color={colors.text} />
    </View>
  );
}

export function TechRow({ label, value, muted = false, tone }) {
  const { getTone, styles } = useTechUiStyles();
  const resolvedTone = tone ? getTone(tone) : null;

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, muted && styles.infoMuted]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          muted && styles.infoMuted,
          resolvedTone && { color: resolvedTone.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function TechScreenHeader({ title, subtitle, right, backLabel, onBackPress }) {
  const { styles } = useTechUiStyles();

  return (
    <View style={styles.screenHeader}>
      {onBackPress ? (
        <TouchableOpacity activeOpacity={0.86} style={styles.backButton} onPress={onBackPress}>
          <Icon name="arrow-left" size={18} color={styles.iconColor.color} />
          {backLabel ? <Text style={styles.backLabel}>{backLabel}</Text> : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.headerGhost} />
      )}

      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

const createStyles = ({ colors, radius, shadows }) => StyleSheet.create({
  iconColor: {
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.coral,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.glow,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  outlineButton: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  outlineDanger: {
    borderColor: 'rgba(251,113,133,0.22)',
    backgroundColor: colors.roseTint,
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metricCard: {
    padding: 14,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  metricSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textMuted,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  infoMuted: {
    color: colors.textMuted,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    minWidth: 48,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  backLabel: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  headerGhost: {
    width: 48,
  },
  headerCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  headerRight: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
});

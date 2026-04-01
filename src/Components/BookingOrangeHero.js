import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { FONT, RADIUS, SHADOW, SPACING } from '../theme';

const HERO_ORANGE = '#FF6B2B';

export default function BookingOrangeHero({
  eyebrow,
  title,
  subtitle,
  stats = [],
  stepLabel = 'STEP 1 OF 5',
  showTopRow = true,
}) {
  return (
    <View style={styles.hero}>
      <View style={[styles.blob, styles.blobLarge]} />
      <View style={[styles.blob, styles.blobMedium]} />
      <View style={[styles.blobDark, styles.blobAccent]} />

      {showTopRow ? (
        <View style={styles.topRow}>
          <Text style={styles.brandText}>
            <Text style={styles.brandTrust}>Trust</Text>
            <Text style={styles.brandFix}>Fix</Text>
          </Text>

          <View style={styles.stepPill}>
            <View style={styles.stepPillDot} />
            <Text style={styles.stepPillText}>{stepLabel}</Text>
          </View>
        </View>
      ) : null}

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <React.Fragment key={`${stat.value}-${stat.label}`}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {index < stats.length - 1 ? <View style={styles.statDivider} /> : null}
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: HERO_ORANGE,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 260,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobDark: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(211,96,45,0.26)',
  },
  blobLarge: {
    width: 360,
    height: 360,
    top: -150,
    right: -110,
  },
  blobMedium: {
    width: 210,
    height: 210,
    top: 82,
    right: 128,
  },
  blobAccent: {
    width: 180,
    height: 180,
    top: 112,
    left: -100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTrust: {
    color: '#111318',
  },
  brandFix: {
    color: '#FFFFFF',
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: FONT.black,
    color: '#FFFFFF',
    letterSpacing: 1.1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: FONT.black,
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: FONT.black,
    color: '#FFFFFF',
    letterSpacing: -0.7,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    fontWeight: FONT.regular,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    ...SHADOW.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statNum: {
    fontSize: 15,
    fontWeight: FONT.black,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: FONT.medium,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
});

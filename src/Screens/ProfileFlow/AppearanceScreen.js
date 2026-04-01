import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { SubScreenShell, useProfileColors } from '../../Components/ProfileComponents';
import { useAppTheme } from '../../theme/ThemeProvider';
import { THEME_MODES } from '../../state/themeStore';

const OPTIONS = [
  {
    id: THEME_MODES.LIGHT,
    title: 'Light',
    subtitle: 'Bright surfaces and dark text',
  },
  {
    id: THEME_MODES.DARK,
    title: 'Dark',
    subtitle: 'Low-glare dark surfaces',
  },
];

export default function AppearanceScreen({ onBack }) {
  const colors = useProfileColors();
  const { mode, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusBarStyle = colors.isDark ? 'light-content' : 'dark-content';

  return (
    <ScreenWrapper
      topColor={colors.surface}
      bottomColor={colors.bg}
      statusBarStyle={statusBarStyle}
    >
      <SubScreenShell
        title="Appearance"
        onBack={onBack}
        titleNearBack
        titleLarge
      >
        <View style={styles.content}>
          <Text style={styles.label}>THEME MODE</Text>
          <Text style={styles.title}>Choose how TrustFix looks</Text>
          <Text style={styles.subtitle}>
            Change the app theme anytime from your profile settings.
          </Text>

          <View style={styles.list}>
            {OPTIONS.map((option) => {
              const isActive = mode === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isActive && styles.optionCardActive,
                  ]}
                  activeOpacity={0.86}
                  onPress={() => setMode(option.id)}
                >
                  <View style={styles.optionMain}>
                    <View style={[styles.previewTile, option.id === THEME_MODES.DARK && styles.previewTileDark]}>
                      <View
                        style={[
                          styles.previewTop,
                          option.id === THEME_MODES.DARK && styles.previewTopDark,
                        ]}
                      />
                      <View
                        style={[
                          styles.previewBody,
                          option.id === THEME_MODES.DARK && styles.previewBodyDark,
                        ]}
                      />
                    </View>

                    <View style={styles.copyWrap}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.selectorRing,
                      isActive && styles.selectorRingActive,
                    ]}
                  >
                    {isActive ? <View style={styles.selectorDot} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const createStyles = (colors) => StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 8,
  },
  list: {
    marginTop: 20,
    gap: 12,
  },
  optionCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.22 : 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  optionCardActive: {
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: colors.isDark ? 0.24 : 0.12,
  },
  optionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  previewTile: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAED',
    padding: 8,
    marginRight: 14,
  },
  previewTileDark: {
    backgroundColor: '#141A22',
    borderColor: '#293241',
  },
  previewTop: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFEEE6',
    marginBottom: 8,
  },
  previewTopDark: {
    backgroundColor: '#2D221E',
  },
  previewBody: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: '#F5F7FA',
  },
  previewBodyDark: {
    backgroundColor: '#1B2430',
  },
  copyWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  optionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 3,
  },
  selectorRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorRingActive: {
    borderColor: colors.brand,
  },
  selectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
});

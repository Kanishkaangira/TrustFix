import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { SubScreenShell, useProfileColors } from '../../../Components/ProfileComponents';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { THEME_MODES } from '../../../state/themeStore';

const OPTIONS = [
  {
    id: THEME_MODES.LIGHT,
    title: 'Light',
    subtitle: 'Bright surfaces and sharp contrast for daytime use.',
    chip: 'Clean',
  },
  {
    id: THEME_MODES.DARK,
    title: 'Dark',
    subtitle: 'Low-glare surfaces with softer contrast for night sessions.',
    chip: 'Comfort',
  },
];

export default function AppearanceScreen({ onBack }) {
  const colors = useProfileColors();
  const { mode, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenWrapper
      topColor={colors.brand}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="Appearance"
        onBack={onBack}
        accentHeader
        accentHeaderColor={colors.brand}
        titleNearBack
        titleLarge
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageLabel}>THEME MODE</Text>
          <Text style={styles.pageTitle}>Choose how TrustFix looks</Text>
          <Text style={styles.pageSubtitle}>
            Switch instantly between bright and low-glare layouts anytime from your profile settings.
          </Text>

          <View style={styles.list}>
            {OPTIONS.map((option) => {
              const isActive = mode === option.id;
              const isDarkOption = option.id === THEME_MODES.DARK;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isDarkOption && styles.optionCardDark,
                    isActive && styles.optionCardActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setMode(option.id)}
                >
                  <View style={styles.optionHeader}>
                    <View>
                      <Text style={[styles.optionTitle, isDarkOption && styles.optionTitleDark]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, isDarkOption && styles.optionSubtitleDark]}>
                        {option.subtitle}
                      </Text>
                    </View>

                    <View style={[styles.optionTag, isDarkOption && styles.optionTagDark]}>
                      <Text style={[styles.optionTagText, isDarkOption && styles.optionTagTextDark]}>
                        {option.chip}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.optionBody}>
                    <View style={[styles.previewTile, isDarkOption && styles.previewTileDark]}>
                      <View style={[styles.previewTop, isDarkOption && styles.previewTopDark]} />
                      <View style={[styles.previewBody, isDarkOption && styles.previewBodyDark]}>
                        <View style={[styles.previewWidget, isDarkOption && styles.previewWidgetDark]} />
                        <View style={[styles.previewWidgetWide, isDarkOption && styles.previewWidgetWideDark]} />
                      </View>
                    </View>

                    <View style={styles.optionMeta}>
                      <Text style={[styles.optionMetaTitle, isDarkOption && styles.optionMetaTitleDark]}>
                        {isActive ? 'Currently applied' : 'Tap to apply'}
                      </Text>
                      <Text style={[styles.optionMetaText, isDarkOption && styles.optionMetaTextDark]}>
                        {isDarkOption
                          ? 'Best for evening use and lower eye strain.'
                          : 'Best for bright environments and crisp visibility.'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.selectorRing,
                        isDarkOption && styles.selectorRingDark,
                        isActive && styles.selectorRingActive,
                      ]}
                    >
                      {isActive ? <View style={styles.selectorDot} /> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  pageLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.muted,
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 8,
  },
  list: {
    marginTop: 18,
    gap: 14,
  },
  optionCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.isDark ? 0.18 : 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  optionCardDark: {
    backgroundColor: colors.surfaceRaised,
  },
  optionCardActive: {
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: colors.isDark ? 0.18 : 0.10,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  optionTitleDark: {
    color: colors.white,
  },
  optionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 4,
    maxWidth: 220,
  },
  optionSubtitleDark: {
    color: colors.inkMid,
  },
  optionTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF4ED',
    borderWidth: 1,
    borderColor: '#FFD7C7',
  },
  optionTagDark: {
    backgroundColor: 'rgba(255,122,69,0.14)',
    borderColor: 'rgba(255,122,69,0.24)',
  },
  optionTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  optionTagTextDark: {
    color: '#FFAA84',
  },
  optionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  previewTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAED',
    padding: 10,
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
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    padding: 7,
    gap: 5,
  },
  previewBodyDark: {
    backgroundColor: '#1B2430',
  },
  previewWidget: {
    height: 14,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  previewWidgetDark: {
    backgroundColor: '#263241',
  },
  previewWidgetWide: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#E9EEF5',
  },
  previewWidgetWideDark: {
    backgroundColor: '#101720',
  },
  optionMeta: {
    flex: 1,
    paddingRight: 12,
  },
  optionMetaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  optionMetaTitleDark: {
    color: colors.white,
  },
  optionMetaText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 3,
  },
  optionMetaTextDark: {
    color: colors.inkMid,
  },
  selectorRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorRingDark: {
    borderColor: colors.border,
  },
  selectorRingActive: {
    borderColor: colors.brand,
  },
  selectorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand,
  },
});

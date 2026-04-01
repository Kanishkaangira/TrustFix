// ScreenWrapper.js
// Uses useFocusEffect so StatusBar updates ONLY when this screen is active.
// This prevents other screens' colors from bleeding through on Android.

import React, { useCallback, useEffect } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import { getThemeColors } from '../theme';

const ScreenWrapper = ({
  children,
  topColor,
  bottomColor,
  statusBarStyle,
}) => {
  const isFocused = useIsFocused();
  const { isDark } = useAppTheme();
  const themeColors = getThemeColors(isDark);
  const resolvedTopColor = topColor ?? themeColors.surface;
  const resolvedBottomColor = bottomColor ?? themeColors.background;
  const resolvedStatusBarStyle = statusBarStyle ?? (isDark ? 'light-content' : 'dark-content');

  // useFocusEffect fires when THIS screen gains/loses focus.
  // So Home sets coral when focused, AiChat sets white when focused —
  // they never overwrite each other at wrong times.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor(resolvedTopColor, false);
      StatusBar.setBarStyle(resolvedStatusBarStyle, false);
    }, [resolvedTopColor, resolvedStatusBarStyle])
  );

  // Re-apply the active screen colors after nested stack/tab transitions.
  // This keeps Android's status bar background stable when returning
  // from overlay screens like Search back to Home.
  useEffect(() => {
    if (!isFocused) return;

    StatusBar.setBackgroundColor(resolvedTopColor, false);
    StatusBar.setBarStyle(resolvedStatusBarStyle, false);
  }, [isFocused, resolvedTopColor, resolvedStatusBarStyle]);

  return (
    <View style={[styles.root, { backgroundColor: resolvedTopColor }]}>
      <StatusBar
        backgroundColor={resolvedTopColor}
        barStyle={resolvedStatusBarStyle}
        translucent={false}
      />
      <View style={[styles.content, { backgroundColor: resolvedBottomColor }]}>
        {children}
      </View>
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { flex: 1 },
});

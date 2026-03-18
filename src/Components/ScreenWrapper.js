// ScreenWrapper.js
// Uses useFocusEffect so StatusBar updates ONLY when this screen is active.
// This prevents other screens' colors from bleeding through on Android.

import React, { useCallback } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const ScreenWrapper = ({
  children,
  topColor       = '#FFFFFF',
  bottomColor    = '#FAF9F6',
  statusBarStyle = 'dark-content',
}) => {

  // useFocusEffect fires when THIS screen gains/loses focus.
  // So Home sets coral when focused, AiChat sets white when focused —
  // they never overwrite each other at wrong times.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor(topColor, false);
      StatusBar.setBarStyle(statusBarStyle, false);
    }, [topColor, statusBarStyle])
  );

  return (
    <View style={[styles.root, { backgroundColor: topColor }]}>
      <StatusBar
        backgroundColor={topColor}
        barStyle={statusBarStyle}
        translucent={false}
      />
      <View style={[styles.content, { backgroundColor: bottomColor }]}>
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
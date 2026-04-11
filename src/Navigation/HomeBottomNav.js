import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Home from '../Screens/Home';
import AiChat from '../Screens/AiChat';
import Profile from '../Screens/Profile';
import Booking from '../Screens/Booking';
import { useAppTheme } from '../theme/ThemeProvider';
import { getThemeColors } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: 'Home',
    label: 'Home',
    icon: 'home-variant-outline',
    activeIcon: 'home-variant',
  },
  {
    name: 'AI Chat',
    label: 'AI Chat',
    icon: 'robot-outline',
    activeIcon: 'robot',
  },
  {
    name: 'Booking',
    label: 'Booking',
    icon: 'calendar-outline',
    activeIcon: 'calendar-check',
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'account-outline',
    activeIcon: 'account',
  },
];

const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 70 : 62;

const getTabColors = isDark => {
  const theme = getThemeColors(isDark);

  return {
    isDark,
    primary: theme.primary,
    primarySoft: isDark ? 'rgba(255,122,69,0.22)' : 'rgba(217,79,43,0.12)',
    activeStart: isDark ? '#FF8B5E' : '#FF7D4D',
    activeEnd: isDark ? '#D85B2A' : '#D94F2B',
    surfaceTop: isDark ? '#1B2430' : '#FFFFFF',
    surfaceBottom: isDark ? '#111821' : '#FFF7F2',
    border: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(217,79,43,0.12)',
    borderStrong: isDark ? 'rgba(255,255,255,0.14)' : '#F3DED3',
    textMuted: theme.inkMuted,
    textSecondary: theme.inkSecondary,
    textOnActive: theme.white,
    iconShell: isDark ? 'rgba(255,255,255,0.05)' : '#FFF8F3',
    iconShellBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(217,79,43,0.08)',
    ambientGlow: isDark ? 'rgba(255,122,69,0.28)' : 'rgba(217,79,43,0.18)',
    sheen: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.92)',
    shadow: theme.black,
  };
};

const CustomTabBar = ({ state, navigation }) => {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const colors = useMemo(() => getTabColors(isDark), [isDark]);
  const styles = useMemo(
    () => createStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );
  const currentRouteName = state.routes[state.index]?.name;

  const bookingRoute = state.routes.find(route => route.name === 'Booking');
  const currentStep = bookingRoute?.params?.currentStep ?? 1;
  const isOnBooking = currentRouteName === 'Booking';

  if (isOnBooking && currentStep > 1) {
    return null;
  }

  const profileRoute = state.routes.find(route => route.name === 'Profile');
  const profileScreen = profileRoute?.params?.profileScreen ?? 'main';
  const isOnProfile = currentRouteName === 'Profile';

  if (isOnProfile && profileScreen !== 'main') {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.shell}>
        <LinearGradient
          colors={[colors.surfaceTop, colors.surfaceBottom]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bar}
        >
          <View style={styles.ambientGlow} />
          <View style={styles.topSheen} />
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const tab = TABS.find(item => item.name === route.name);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.88}
                style={styles.tabItem}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={tab?.label || route.name}
              >
                <View
                  style={[styles.tabContent, isFocused && styles.activeTab]}
                >
                  <View
                    style={[
                      styles.indicator,
                      isFocused && styles.indicatorActive,
                    ]}
                  />
                  {isFocused ? (
                    <LinearGradient
                      colors={[colors.activeStart, colors.activeEnd]}
                      start={{ x: 0, y: 0.2 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.activeIconChip}
                    >
                      <Icon
                        name={tab?.activeIcon || tab?.icon || 'circle-outline'}
                        size={17}
                        color={colors.textOnActive}
                      />
                    </LinearGradient>
                  ) : (
                    <View style={styles.iconChip}>
                      <Icon
                        name={tab?.icon || 'circle-outline'}
                        size={19}
                        color={colors.textMuted}
                      />
                    </View>
                  )}
                  <Text
                    style={[styles.label, isFocused && styles.activeLabel]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {tab?.label || route.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
    </View>
  );
};

const renderTabBar = props => <CustomTabBar {...props} />;

const HomeBottomNav = () => (
  <Tab.Navigator
    tabBar={renderTabBar}
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="AI Chat" component={AiChat} />
    <Tab.Screen name="Booking" component={Booking} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

export default HomeBottomNav;

const createStyles = (colors, bottomInset) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 14,
      paddingBottom:
        bottomInset > 0 ? Math.max(bottomInset - 4, 8) : Platform.OS === 'ios' ? 10 : 8,
    },
    shell: {
      borderRadius: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: colors.isDark ? 0.3 : 0.12,
      shadowRadius: 14,
      elevation: 14,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingHorizontal: 6,
      paddingVertical: 6,
      backgroundColor: colors.surfaceTop,
      minHeight: TAB_BAR_BASE_HEIGHT,
    },
    ambientGlow: {
      position: 'absolute',
      top: -28,
      left: '50%',
      marginLeft: -62,
      width: 124,
      height: 74,
      borderRadius: 999,
      backgroundColor: colors.ambientGlow,
      opacity: 0.9,
    },
    topSheen: {
      position: 'absolute',
      top: 0,
      left: 22,
      right: 22,
      height: 1,
      backgroundColor: colors.sheen,
    },
    tabItem: {
      flex: 1,
      paddingHorizontal: 3,
      justifyContent: 'center',
    },
    tabContent: {
      width: '100%',
      minHeight: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 4,
    },
    activeTab: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: 'transparent',
    },
    indicatorActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 2,
    },
    iconChip: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconShell,
      borderWidth: 1,
      borderColor: colors.iconShellBorder,
    },
    activeIconChip: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderStrong,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: colors.isDark ? 0.16 : 0.18,
      shadowRadius: 10,
      elevation: 5,
    },
    label: {
      fontSize: 9.5,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.15,
    },
    activeLabel: {
      fontSize: 9.75,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.2,
    },
  });

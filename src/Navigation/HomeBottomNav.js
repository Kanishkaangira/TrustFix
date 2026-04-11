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
import Profile from '../Screens/Profile';
import Booking from '../Screens/Booking';
import ServiceLedger from '../Screens/ServiceLedger';
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
    name: 'History',
    label: 'History',
    icon: 'timeline-text-outline',
    activeIcon: 'timeline-text',
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

const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 60 : 54;

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
          <View style={styles.tabsRow}>
            {state.routes.map((route) => {
              const isFocused =
                state.index ===
                state.routes.findIndex(item => item.key === route.key);
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
                        styles.iconChip,
                        isFocused && styles.iconChipActive,
                      ]}
                    >
                      <Icon
                        name={
                          isFocused
                            ? tab?.activeIcon || tab?.icon || 'circle-outline'
                            : tab?.icon || 'circle-outline'
                        }
                        size={16}
                        color={
                          isFocused ? colors.textOnActive : colors.textMuted
                        }
                      />
                    </View>
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
          </View>
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
    <Tab.Screen name="History" component={ServiceLedger} />
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
      paddingHorizontal: 12,
      paddingBottom:
        bottomInset > 0 ? Math.max(bottomInset - 6, 6) : Platform.OS === 'ios' ? 8 : 6,
    },
    shell: {
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.isDark ? 0.24 : 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingHorizontal: 5,
      paddingVertical: 4,
      backgroundColor: colors.surfaceTop,
      minHeight: TAB_BAR_BASE_HEIGHT,
    },
    tabsRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tabItem: {
      flex: 1,
      paddingHorizontal: 3,
      justifyContent: 'center',
      minWidth: 0,
    },
    tabContent: {
      width: '100%',
      minHeight: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    activeTab: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 16,
    },
    iconChip: {
      width: 30,
      height: 30,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconShell,
      borderWidth: 1,
      borderColor: colors.iconShellBorder,
    },
    iconChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.isDark ? 0.14 : 0.16,
      shadowRadius: 8,
      elevation: 4,
    },
    label: {
      marginTop: 2,
      fontSize: 8.5,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.1,
    },
    activeLabel: {
      fontWeight: '800',
      color: colors.primary,
    },
  });

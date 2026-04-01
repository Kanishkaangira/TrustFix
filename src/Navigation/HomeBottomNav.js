import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Home from '../Screens/Home';
import AiChat from '../Screens/AiChat';
import Profile from '../Screens/Profile';
import Booking from '../Screens/Booking';
import { useAppTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', icon: 'home-variant-outline' },
  { name: 'AI Chat', icon: 'robot-outline' },
  { name: 'Booking', icon: 'calendar-outline' },
  { name: 'Profile', icon: 'account-outline' },
];

const getTabColors = (isDark) => ({
  coral: '#FF6B35',
  coralPale: isDark ? 'rgba(255,107,53,0.18)' : '#FFF0EB',
  card: isDark ? '#141A22' : '#FFFFFF',
  border: isDark ? '#293241' : '#E5E7EB',
  textMuted: isDark ? '#8FA0B5' : '#9CA3AF',
  shadow: '#000000',
});

const CustomTabBar = ({ state, navigation }) => {
  const { isDark } = useAppTheme();
  const colors = useMemo(() => getTabColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentRouteName = state.routes[state.index]?.name;

  const bookingRoute = state.routes.find((route) => route.name === 'Booking');
  const currentStep = bookingRoute?.params?.currentStep ?? 1;
  const isOnBooking = currentRouteName === 'Booking';

  if (isOnBooking && currentStep > 1) {
    return null;
  }

  const profileRoute = state.routes.find((route) => route.name === 'Profile');
  const profileScreen = profileRoute?.params?.profileScreen ?? 'main';
  const isOnProfile = currentRouteName === 'Profile';

  if (isOnProfile && profileScreen !== 'main') {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find((item) => item.name === route.name);

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

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />
              <View style={[styles.iconChip, isFocused && styles.iconChipActive]}>
                <Icon
                  name={tab?.icon || 'circle-outline'}
                  size={22}
                  color={isFocused ? colors.coral : colors.textMuted}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tab?.name || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const HomeBottomNav = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="AI Chat" component={AiChat} />
    <Tab.Screen name="Booking" component={Booking} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

export default HomeBottomNav;

const createStyles = (colors) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 14 : 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  indicator: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  indicatorActive: {
    backgroundColor: colors.coral,
  },
  iconChip: {
    width: 40,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: colors.coralPale,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.coral,
    fontWeight: '800',
  },
});

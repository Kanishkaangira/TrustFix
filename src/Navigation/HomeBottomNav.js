import React from 'react';
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
import Bookings from '../Screens/Bookings';
import Profile from '../Screens/Profile';

const Tab = createBottomTabNavigator();

// ─── Tokens ───────────────────────────────────────────────────
const C = {
  coral:     '#FF6B35',
  coralPale: '#FFF0EB',
  card:      '#FFFFFF',
  border:    '#E5E7EB',
  textMuted: '#9CA3AF',
  white:     '#FFFFFF',
};

// ─── Tab definitions ──────────────────────────────────────────
const TABS = [
  { name: 'Home',     icon: 'home-variant-outline'  },
  { name: 'AI Chat',  icon: 'robot-outline'         },
  { name: 'Bookings', icon: 'calendar-outline'      },
  { name: 'Profile',  icon: 'account-outline'       },
];

// ─── Custom Tab Bar ───────────────────────────────────────────
const CustomTabBar = ({ state, navigation }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find(t => t.name === route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {/* Top indicator */}
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />

              {/* Icon chip */}
              <View style={[styles.iconChip, isFocused && styles.iconChipActive]}>
                <Icon
                  name={tab.icon}
                  size={24}
                  color={isFocused ? C.coral : C.textMuted}
                />
              </View>

              {/* Label */}
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Navigator ────────────────────────────────────────────────
const HomeBottomNav = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"     component={Home} />
    <Tab.Screen name="AI Chat"  component={AiChat} />
    <Tab.Screen name="Bookings" component={Bookings} />
    <Tab.Screen name="Profile"  component={Profile} />
  </Tab.Navigator>
);

export default HomeBottomNav;

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
  },

  // ── Each tab ──
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  // Thin coral bar on top of active tab
  indicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  indicatorActive: {
    backgroundColor: C.coral,
  },

  // Icon background chip
  iconChip: {
    width: 48,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: C.coralPale,
  },

  // Label
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: C.coral,
    fontWeight: '800',
  },
});
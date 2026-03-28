import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationState } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Home from '../Screens/Home';
import AiChat from '../Screens/AiChat';
import Profile from '../Screens/Profile';
import Booking from '../Screens/Booking';

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
  { name: 'Home',    icon: 'home-variant-outline' },
  { name: 'AI Chat', icon: 'robot-outline'        },
  { name: 'Booking', icon: 'calendar-outline'     },
  { name: 'Profile', icon: 'account-outline'      },
];

// ─── Custom Tab Bar ───────────────────────────────────────────
const CustomTabBar = ({ state, navigation }) => {
  // Read the current booking step from navigation params
  // When step > 1, hide the tab bar
  const bookingRoute = state.routes.find(r => r.name === 'Booking');
  const currentStep  = bookingRoute?.params?.currentStep ?? 1;
  const isBookingTab = state.routes[state.index]?.name === 'Booking';

  // Hide bar when user is on Booking tab AND past step 1
  if (isBookingTab && currentStep > 1) {
    return null; // completely unmount the bar
  }

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
                  name={tab.icon}
                  size={22}
                  color={isFocused ? C.coral : C.textMuted}
                />
              </View>
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
    <Tab.Screen name="Home"    component={Home}    />
    <Tab.Screen name="AI Chat" component={AiChat}  />
    <Tab.Screen name="Booking" component={Booking} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

export default HomeBottomNav;

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position:        'absolute',
    bottom:           0,
    left:             0,
    right:            0,
    backgroundColor: C.card,
    borderTopWidth:   1,
    borderTopColor:  C.border,
    paddingBottom:   Platform.OS === 'ios' ? 14 : 6,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: -2 },
    shadowOpacity:   0.05,
    shadowRadius:    8,
    elevation:       10,
  },
  bar: {
    flexDirection: 'row',
    paddingTop:     6,
  },
  tabItem: {
    flex:       1,
    alignItems: 'center',
    gap:         2,
  },
  indicator: {
    width:           20,
    height:           2,
    borderRadius:     2,
    backgroundColor: 'transparent',
    marginBottom:     4,
  },
  indicatorActive: {
    backgroundColor: C.coral,
  },
  iconChip: {
    width:          40,
    height:         30,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: C.coralPale,
  },
  label: {
    fontSize:      9,
    fontWeight:   '600',
    color:         C.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color:      C.coral,
    fontWeight: '800',
  },
});
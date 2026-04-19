import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import TechnicianHomeScreen from '../Screens/Technician/TechnicianHomeScreen';
import TechnicianJobsScreen from '../Screens/Technician/TechnicianJobsScreen';
import TechnicianEarningsScreen from '../Screens/Technician/TechnicianEarningsScreen';
import TechnicianProfileMainScreen from '../Screens/Technician/Profile/ProfileMain';
import { useTechTheme } from '../technician/theme';

const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: 'TechnicianHome',
    label: 'Home',
    icon: 'home-variant-outline',
    activeIcon: 'home-variant',
  },
  {
    name: 'TechnicianJobs',
    label: 'Jobs',
    icon: 'clipboard-text-outline',
    activeIcon: 'clipboard-text',
  },
  {
    name: 'TechnicianEarnings',
    label: 'Earnings',
    icon: 'cash-multiple',
    activeIcon: 'cash-fast',
  },
  {
    name: 'TechnicianProfile',
    label: 'Profile',
    icon: 'account-outline',
    activeIcon: 'account',
  },
];

const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 62 : 56;

function TechnicianTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useTechTheme();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={theme.gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((item) => item.name === route.name);
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.86}
              style={styles.tabButton}
              onPress={() => navigation.navigate(route.name)}
            >
              <View style={[styles.tabInner, isFocused && styles.tabInnerActive]}>
                <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                  <Icon
                    name={isFocused ? tab?.activeIcon || tab?.icon : tab?.icon || 'circle-outline'}
                    size={16}
                    color={isFocused ? theme.colors.white : theme.colors.textMuted}
                  />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {tab?.label || route.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const renderTechnicianTabBar = (props) => <TechnicianTabBar {...props} />;

export default function TechnicianBottomNav() {
  return (
    <Tab.Navigator
      tabBar={renderTechnicianTabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="TechnicianHome" component={TechnicianHomeScreen} />
      <Tab.Screen name="TechnicianJobs" component={TechnicianJobsScreen} />
      <Tab.Screen name="TechnicianEarnings" component={TechnicianEarningsScreen} />
      <Tab.Screen name="TechnicianProfile" component={TechnicianProfileMainScreen} />
    </Tab.Navigator>
  );
}

const createStyles = ({ colors, isDark }, bottomInset) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: bottomInset > 0 ? Math.max(bottomInset - 4, 6) : 6,
  },
  bar: {
    minHeight: TAB_BAR_BASE_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabButton: {
    flex: 1,
    paddingHorizontal: 4,
  },
  tabInner: {
    minHeight: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInnerActive: {
    backgroundColor: colors.coralTint,
    borderWidth: 1,
    borderColor: colors.coralBorder,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
  },
  iconWrapActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.coral,
  },
});

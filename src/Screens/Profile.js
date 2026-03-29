// src/Screens/Profile.js
// Profile controller — same pattern as Booking.js
// Sends profileScreen param so HomeBottomNav can hide tab bar on sub-screens

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import ProfileMain         from './ProfileFlow/ProfileMain';
import EditProfileScreen   from './ProfileFlow/EditProfileScreen';
import NotificationsScreen from './ProfileFlow/NotificationsScreen';
import AddressesScreen     from './ProfileFlow/AddressesScreen';
import PaymentScreen       from './ProfileFlow/PaymentScreen';
import HelpScreen          from './ProfileFlow/HelpScreen';
import AboutScreen         from './ProfileFlow/AboutScreen';
import ShareScreen         from './ProfileFlow/ShareScreen';
import SubscriptionScreen  from './ProfileFlow/SubscriptionScreen';

const SCREENS = {
  MAIN:          'main',
  EDIT_PROFILE:  'editProfile',
  NOTIFICATIONS: 'notifications',
  ADDRESSES:     'addresses',
  PAYMENT:       'payment',
  HELP:          'help',
  ABOUT:         'about',
  SHARE:         'share',
  SUBSCRIPTION:  'subscription',
};

export default function Profile({ navigation }) {
  const [activeScreen, setActiveScreen] = useState(SCREENS.MAIN);

  // ── Tell HomeBottomNav which profile screen is active ──────────────────────
  // HomeBottomNav reads profileScreen param — hides tab bar when not 'main'
  useEffect(() => {
    navigation.setParams({ profileScreen: activeScreen });
  }, [activeScreen]);

  const navigate = (screen) => setActiveScreen(screen);
  const goBack   = ()       => setActiveScreen(SCREENS.MAIN);

  const renderScreen = () => {
    switch (activeScreen) {
      case SCREENS.EDIT_PROFILE:  return <EditProfileScreen   onBack={goBack} />;
      case SCREENS.NOTIFICATIONS: return <NotificationsScreen onBack={goBack} />;
      case SCREENS.ADDRESSES:     return <AddressesScreen     onBack={goBack} />;
      case SCREENS.PAYMENT:       return <PaymentScreen       onBack={goBack} />;
      case SCREENS.HELP:          return <HelpScreen          onBack={goBack} />;
      case SCREENS.ABOUT:         return <AboutScreen         onBack={goBack} />;
      case SCREENS.SHARE:         return <ShareScreen         onBack={goBack} />;
      case SCREENS.SUBSCRIPTION:  return <SubscriptionScreen  onBack={goBack} />;
      default:                    return <ProfileMain         onNavigate={navigate} />;
    }
  };

  return <View style={styles.root}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
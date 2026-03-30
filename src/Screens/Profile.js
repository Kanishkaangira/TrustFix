// src/Screens/Profile.js
// Profile controller - same pattern as Booking.js
// Sends profileScreen param so HomeBottomNav can hide tab bar on sub-screens

import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ProfileMain from './ProfileFlow/ProfileMain';
import EditProfileScreen from './ProfileFlow/EditProfileScreen';
import NotificationsScreen from './ProfileFlow/NotificationsScreen';
import AddressesScreen from './ProfileFlow/AddressesScreen';
import PaymentScreen from './ProfileFlow/PaymentScreen';
import HelpScreen from './ProfileFlow/HelpScreen';
import AboutScreen from './ProfileFlow/AboutScreen';
import ShareScreen from './ProfileFlow/ShareScreen';
import SubscriptionScreen from './ProfileFlow/SubscriptionScreen';
import {
  getAddresses,
  subscribeToAddresses,
  updateAddresses,
} from '../store/addressStore';

const SCREENS = {
  MAIN: 'main',
  EDIT_PROFILE: 'editProfile',
  NOTIFICATIONS: 'notifications',
  ADDRESSES: 'addresses',
  PAYMENT: 'payment',
  HELP: 'help',
  ABOUT: 'about',
  SHARE: 'share',
  SUBSCRIPTION: 'subscription',
};

const VALID_SCREENS = Object.values(SCREENS);

export default function Profile({ navigation, route }) {
  const [activeScreen, setActiveScreen] = useState(SCREENS.MAIN);
  const [addresses, setAddresses] = useState(() => getAddresses());
  const returnToBooking = route?.params?.returnToBooking === true;

  useEffect(() => {
    const targetScreen = route?.params?.openScreen;
    if (!VALID_SCREENS.includes(targetScreen)) {
      return;
    }

    if (targetScreen !== activeScreen) {
      setActiveScreen(targetScreen);
    }

    navigation.setParams({ openScreen: undefined });
  }, [activeScreen, navigation, route?.params?.openScreen]);

  useEffect(() => {
    navigation.setParams({ profileScreen: activeScreen });
  }, [activeScreen, navigation]);

  useEffect(() => subscribeToAddresses(setAddresses), []);

  const navigate = (screen) => setActiveScreen(screen);

  const goBack = useCallback(() => {
    if (returnToBooking && activeScreen === SCREENS.ADDRESSES) {
      setActiveScreen(SCREENS.MAIN);
      navigation.setParams({
        openScreen: undefined,
        profileScreen: SCREENS.MAIN,
        returnToBooking: undefined,
      });
      navigation.navigate('Booking', {
        returnStep: 4,
        addressTrigger: Date.now(),
      });
      return;
    }

    setActiveScreen(SCREENS.MAIN);
  }, [activeScreen, navigation, returnToBooking]);

  useFocusEffect(
    useCallback(() => {
      const handleHardwareBack = () => {
        if (activeScreen === SCREENS.MAIN) {
          return false;
        }

        goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);

      return () => {
        subscription.remove();
      };
    }, [activeScreen, goBack])
  );

  const handleAddAddress = useCallback((newAddress) => {
    updateAddresses((prev) => {
      const shouldBeDefault = newAddress.isDefault || prev.length === 0;
      const nextBase = shouldBeDefault
        ? prev.map((item) => ({ ...item, isDefault: false }))
        : prev;

      return [
        ...nextBase,
        {
          id: `address-${Date.now()}`,
          label: newAddress.label.trim(),
          address: newAddress.address.trim(),
          isDefault: shouldBeDefault,
        },
      ];
    });
  }, []);

  const handleDeleteAddress = useCallback((addressId) => {
    updateAddresses((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      const next = prev.filter((item) => item.id !== addressId);

      if (!next.some((item) => item.isDefault) && next.length) {
        return next.map((item, index) => (
          index === 0 ? { ...item, isDefault: true } : item
        ));
      }

      return next;
    });
  }, []);

  const handleSetDefaultAddress = useCallback((addressId) => {
    updateAddresses((prev) => prev.map((item) => ({
      ...item,
      isDefault: item.id === addressId,
    })));
  }, []);

  const handleAddressSelect = (selectedAddress) => {
    if (returnToBooking) {
      setActiveScreen(SCREENS.MAIN);
      navigation.setParams({
        openScreen: undefined,
        profileScreen: SCREENS.MAIN,
        returnToBooking: undefined,
      });
      navigation.navigate('Booking', {
        returnStep: 4,
        selectedAddress,
        addressTrigger: Date.now(),
      });
      return;
    }

    setActiveScreen(SCREENS.MAIN);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case SCREENS.EDIT_PROFILE:
        return <EditProfileScreen onBack={goBack} />;
      case SCREENS.NOTIFICATIONS:
        return <NotificationsScreen onBack={goBack} />;
      case SCREENS.ADDRESSES:
        return (
          <AddressesScreen
            onBack={goBack}
            onSelectAddress={handleAddressSelect}
            addresses={addresses}
            onAddAddress={handleAddAddress}
            onDeleteAddress={handleDeleteAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
            selectable={returnToBooking}
          />
        );
      case SCREENS.PAYMENT:
        return <PaymentScreen onBack={goBack} />;
      case SCREENS.HELP:
        return <HelpScreen onBack={goBack} />;
      case SCREENS.ABOUT:
        return <AboutScreen onBack={goBack} />;
      case SCREENS.SHARE:
        return <ShareScreen onBack={goBack} />;
      case SCREENS.SUBSCRIPTION:
        return <SubscriptionScreen onBack={goBack} />;
      default:
        return <ProfileMain onNavigate={navigate} />;
    }
  };

  return <View style={styles.root}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

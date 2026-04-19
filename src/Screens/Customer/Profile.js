// src/Screens/Customer/Profile.js
// Profile controller - same pattern as Booking.js
// Sends profileScreen param so HomeBottomNav can hide tab bar on sub-screens

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, View, StyleSheet } from 'react-native';
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
import AppearanceScreen from './ProfileFlow/AppearanceScreen';
import {
  addAddress,
  getAddresses,
  removeAddress,
  setDefaultAddress,
  subscribeToAddresses,
} from '../../state/addressStore';
import {
  clearAuthenticatedState,
} from '../../state/authStore';
import {
  resetAuthenticatedAppData,
} from '../../state/appDataBootstrap';
import {
  getProfile,
  subscribeToProfile,
  updateProfile,
} from '../../state/profileStore';
import {
  getBookings,
  subscribeToBookings,
} from '../../state/bookingStore';
import { supabase } from '../../lib/supabase';

const SCREENS = {
  MAIN: 'main',
  EDIT_PROFILE: 'editProfile',
  NOTIFICATIONS: 'notifications',
  ADDRESSES: 'addresses',
  PAYMENT: 'payment',
  APPEARANCE: 'appearance',
  HELP: 'help',
  ABOUT: 'about',
  SHARE: 'share',
  SUBSCRIPTION: 'subscription',
};

const VALID_SCREENS = Object.values(SCREENS);

export default function Profile({ navigation, route }) {
  const [activeScreen, setActiveScreen] = useState(SCREENS.MAIN);
  const [addresses, setAddresses] = useState(() => getAddresses());
  const [profile, setProfile] = useState(() => getProfile());
  const [bookings, setBookings] = useState(() => getBookings());
  const returnToBooking = route?.params?.returnToBooking === true;
  const bookingReturnStep = route?.params?.returnStep || 4;

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
  useEffect(() => subscribeToProfile(setProfile), []);
  useEffect(() => subscribeToBookings(setBookings), []);

  const navigate = (screen) => setActiveScreen(screen);

  const handleSaveProfile = useCallback(async (updates) => {
    const result = await updateProfile(updates);

    if (result.error) {
      Alert.alert('Could not save profile', result.error.message);
      return false;
    }

    return true;
  }, []);

  const goBack = useCallback(() => {
    if (returnToBooking && activeScreen === SCREENS.ADDRESSES) {
      setActiveScreen(SCREENS.MAIN);
      navigation.setParams({
        openScreen: undefined,
        profileScreen: SCREENS.MAIN,
        returnToBooking: undefined,
        returnStep: undefined,
      });
      navigation.navigate('Booking', {
        returnStep: bookingReturnStep,
        addressTrigger: Date.now(),
      });
      return;
    }

    setActiveScreen(SCREENS.MAIN);
  }, [activeScreen, bookingReturnStep, navigation, returnToBooking]);

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

  const handleAddAddress = useCallback(async (newAddress) => {
    const shouldBeDefault = newAddress.isDefault || addresses.length === 0;
    const result = await addAddress({
      ...newAddress,
      isDefault: shouldBeDefault,
    });

    if (result.error) {
      Alert.alert('Could not save address', result.error.message);
    }
  }, [addresses.length]);

  const handleDeleteAddress = useCallback(async (addressId) => {
    const result = await removeAddress(addressId);

    if (result.error) {
      Alert.alert('Could not delete address', result.error.message);
    }
  }, []);

  const handleSetDefaultAddress = useCallback(async (addressId) => {
    const result = await setDefaultAddress(addressId);

    if (result.error) {
      Alert.alert('Could not update address', result.error.message);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthenticatedState();
    await resetAuthenticatedAppData();

    let rootNavigation = navigation;

    while (rootNavigation.getParent?.()) {
      rootNavigation = rootNavigation.getParent();
    }

    rootNavigation.reset({
      index: 0,
      routes: [{ name: 'Flash' }],
    });
  }, [navigation]);

  const handleAddressSelect = (selectedAddress) => {
    if (returnToBooking) {
      setActiveScreen(SCREENS.MAIN);
      navigation.setParams({
        openScreen: undefined,
        profileScreen: SCREENS.MAIN,
        returnToBooking: undefined,
        returnStep: undefined,
      });
      navigation.navigate('Booking', {
        returnStep: bookingReturnStep,
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
        return (
          <EditProfileScreen
            onBack={goBack}
            profile={profile}
            onSaveProfile={handleSaveProfile}
          />
        );
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
      case SCREENS.APPEARANCE:
        return <AppearanceScreen onBack={goBack} />;
      case SCREENS.HELP:
        return <HelpScreen onBack={goBack} />;
      case SCREENS.ABOUT:
        return <AboutScreen onBack={goBack} />;
      case SCREENS.SHARE:
        return <ShareScreen onBack={goBack} />;
      case SCREENS.SUBSCRIPTION:
        return <SubscriptionScreen onBack={goBack} />;
      default:
        return (
          <ProfileMain
            onNavigate={navigate}
            onSignOut={handleSignOut}
            profile={profile}
            addresses={addresses}
            bookings={bookings}
          />
        );
    }
  };

  return <View style={styles.root}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

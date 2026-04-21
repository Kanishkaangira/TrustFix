import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TechnicianBottomNav from './TechnicianBottomNav';
import TechnicianOtpPreviewScreen from '../Screens/Technician/TechnicianOtpPreviewScreen';
import TechnicianJobAlertScreen from '../Screens/Technician/TechnicianJobAlertScreen';
import TechnicianJobDetailScreen from '../Screens/Technician/TechnicianJobDetailScreen';
import TechnicianEnRouteScreen from '../Screens/Technician/JobFlow/EnRouteScreen';
import TechnicianSafetyOtpScreen from '../Screens/Technician/JobFlow/SafetyOtpScreen';
import TechnicianJobInProgressScreen from '../Screens/Technician/JobFlow/JobProgressScreen';
import TechnicianJobCompletionScreen from '../Screens/Technician/JobFlow/JobCompletionScreen';
import TechnicianSubscriptionScreen from '../Screens/Technician/TechnicianSubscriptionScreen';
import TechnicianProfileEditScreen from '../Screens/Technician/Profile/EditProfileScreen';
import TechnicianProfileNotificationsScreen from '../Screens/Technician/Profile/NotificationsScreen';
import TechnicianProfileAddressesScreen from '../Screens/Technician/Profile/AddressesScreen';
import TechnicianProfilePaymentScreen from '../Screens/Technician/Profile/PaymentScreen';
import TechnicianProfileHelpScreen from '../Screens/Technician/Profile/HelpScreen';
import TechnicianProfileAboutScreen from '../Screens/Technician/Profile/AboutScreen';
import TechnicianProfileShareScreen from '../Screens/Technician/Profile/ShareScreen';
import TechnicianAppearanceScreen from '../Screens/Technician/Profile/TechnicianAppearanceScreen';

const Stack = createNativeStackNavigator();

export default function TechnicianStackNavigation() {
  return (
    <Stack.Navigator
      initialRouteName="TechnicianTabs"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="TechnicianTabs" component={TechnicianBottomNav} />
      <Stack.Screen name="TechnicianOtpPreview" component={TechnicianOtpPreviewScreen} />
      <Stack.Screen name="TechnicianJobAlert" component={TechnicianJobAlertScreen} />
      <Stack.Screen name="TechnicianJobDetail" component={TechnicianJobDetailScreen} />
      <Stack.Screen name="TechnicianEnRoute" component={TechnicianEnRouteScreen} />
      <Stack.Screen name="TechnicianSafetyOtp" component={TechnicianSafetyOtpScreen} />
      <Stack.Screen name="TechnicianJobInProgress" component={TechnicianJobInProgressScreen} />
      <Stack.Screen name="TechnicianJobCompletion" component={TechnicianJobCompletionScreen} />
      <Stack.Screen name="TechnicianProfileEdit" component={TechnicianProfileEditScreen} />
      <Stack.Screen name="TechnicianProfileNotifications" component={TechnicianProfileNotificationsScreen} />
      <Stack.Screen name="TechnicianProfileAddresses" component={TechnicianProfileAddressesScreen} />
      <Stack.Screen name="TechnicianProfilePayment" component={TechnicianProfilePaymentScreen} />
      <Stack.Screen name="TechnicianProfileHelp" component={TechnicianProfileHelpScreen} />
      <Stack.Screen name="TechnicianProfileAbout" component={TechnicianProfileAboutScreen} />
      <Stack.Screen name="TechnicianProfileShare" component={TechnicianProfileShareScreen} />
      <Stack.Screen name="TechnicianSubscription" component={TechnicianSubscriptionScreen} />
      <Stack.Screen name="TechnicianAppearance" component={TechnicianAppearanceScreen} />
    </Stack.Navigator>
  );
}

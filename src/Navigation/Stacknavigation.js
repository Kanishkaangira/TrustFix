// ════════════════════════════════════════════════════════════════
//  TrustFix — Stack Navigation
//  Flow: FlashScreen → OnboardingScreen → Login → OTP → Main (HomeBottomNav)
// ════════════════════════════════════════════════════════════════

import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FlashScreen      from '../Screens/Customer/FlashScreen';
import OnboardingScreen from '../Screens/Customer/OnboardingScreen';
import AuthPhoneScreen  from '../Screens/Customer/AuthPhoneScreen';
import OtpVerificationScreen from '../Screens/Customer/OtpVerificationScreen';
import NameSetupScreen from '../Screens/Customer/NameSetupScreen';
import TechnicianLoginScreen from '../Screens/Technician/TechnicianLoginScreen';
import SearchScreen     from '../Screens/Customer/SearchScreen';
import AiChat from '../Screens/Customer/AiChat';
import HomeBottomNav    from './HomeBottomNav';
import TechnicianStackNavigation from './TechnicianStackNavigation';
import { useAppTheme } from '../theme/ThemeProvider';
import { getThemeColors } from '../theme';

const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      text: colors.ink,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Flash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Flash"      component={FlashScreen}      />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login"      component={AuthPhoneScreen}  />
        <Stack.Screen name="TechnicianLogin" component={TechnicianLoginScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="NameSetup" component={NameSetupScreen} />
        <Stack.Screen name="Main"       component={HomeBottomNav}    />
        <Stack.Screen name="TechnicianMain" component={TechnicianStackNavigation} />
        <Stack.Screen name="Search"     component={SearchScreen}     />
        <Stack.Screen name="AiChat"     component={AiChat}           />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigation;

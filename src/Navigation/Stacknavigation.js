// ════════════════════════════════════════════════════════════════
//  TrustFix — Stack Navigation
//  Flow: FlashScreen → OnboardingScreen → Main (HomeBottomNav)
// ════════════════════════════════════════════════════════════════

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FlashScreen      from '../Screens/FlashScreen';
import OnboardingScreen from '../Screens/OnboardingScreen';
import SearchScreen     from '../Screens/SearchScreen';
import HomeBottomNav    from './HomeBottomNav';

const Stack = createNativeStackNavigator();

const StackNavigation = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Flash"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Flash"      component={FlashScreen}      />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main"       component={HomeBottomNav}    />
      <Stack.Screen name="Search"     component={SearchScreen}     />
    </Stack.Navigator>
  </NavigationContainer>
);

export default StackNavigation;

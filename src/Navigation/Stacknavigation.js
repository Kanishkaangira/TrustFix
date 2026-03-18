import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeBottomNav from './HomeBottomNav';

const Stack = createNativeStackNavigator();

const Stacknavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        <Stack.Screen 
          name="Main" 
          component={HomeBottomNav} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Stacknavigation;
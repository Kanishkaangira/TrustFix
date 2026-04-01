import 'react-native-gesture-handler';
import React from 'react';
import Stacknavigation from './src/Navigation/Stacknavigation';
import { AppThemeProvider } from './src/theme/ThemeProvider';

const App = () => {
  return (
    <AppThemeProvider>
      <Stacknavigation />
    </AppThemeProvider>
  );
};

export default App;

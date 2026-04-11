import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import Stacknavigation from './src/Navigation/Stacknavigation';
import { AppThemeProvider } from './src/theme/ThemeProvider';
import {
  clearAuthenticatedState,
  completePhoneAuth,
} from './src/state/authStore';
import {
  resetAuthenticatedAppData,
  syncAuthenticatedAppData,
} from './src/state/appDataBootstrap';
import { supabase } from './src/lib/supabase';

const App = () => {
  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      const sessionPhone = data?.session?.user?.phone || '';

      if (!isMounted || !sessionPhone) {
        return;
      }

      completePhoneAuth(sessionPhone);
      void syncAuthenticatedAppData();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionPhone = session?.user?.phone || '';

      if (event === 'SIGNED_OUT' || !sessionPhone) {
        clearAuthenticatedState();
        void resetAuthenticatedAppData();
        return;
      }

      completePhoneAuth(sessionPhone);
      void syncAuthenticatedAppData();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppThemeProvider>
      <Stacknavigation />
    </AppThemeProvider>
  );
};

export default App;

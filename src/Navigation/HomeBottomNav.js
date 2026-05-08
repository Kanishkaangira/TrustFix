import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDistance } from 'geolib';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import TrackingPopup from '../Components/TrackingPopup';
import { supabase } from '../lib/supabase';
import Home from '../Screens/Customer/Home';
import Profile from '../Screens/Customer/Profile';
import Booking from '../Screens/Customer/Booking';
import ServiceLedger from '../Screens/Customer/ServiceLedger';
import {
  getBookings,
  subscribeToBookings,
  syncBookingsFromRemote,
} from '../state/bookingStore';
import { useAppTheme } from '../theme/ThemeProvider';
import { getThemeColors } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: 'Home',
    label: 'Home',
    icon: 'home-variant-outline',
    activeIcon: 'home-variant',
  },
   {
    name: 'Booking',
    label: 'Booking',
    icon: 'calendar-outline',
    activeIcon: 'calendar-check',
  },
  {
    name: 'History',
    label: 'History',
    icon: 'timeline-text-outline',
    activeIcon: 'timeline-text',
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'account-outline',
    activeIcon: 'account',
  },
];

const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 60 : 54;
const TRACKABLE_BOOKING_STATUSES = new Set([
  'requested',
  'confirmed',
  'assigned',
  'accepted',
  'en_route',
  'arrived',
  'otp_verified',
  'estimate_sent',
  'estimate_revision_requested',
  'estimate_approved',
  'in_progress',
  'work_completed',
  'payment_pending',
  'payment_requested',
]);
const TRACKING_STATUS_GROUPS = [
  ['en_route', 'accepted', 'assigned', 'arrived'],
  ['otp_verified', 'estimate_sent', 'estimate_revision_requested', 'estimate_approved', 'in_progress', 'work_completed', 'payment_pending', 'payment_requested'],
  ['confirmed', 'requested'],
];
const TRACKING_POPUP_VISIBLE_STATUSES = new Set(['en_route', 'accepted', 'assigned']);
const TRACKING_POPUP_CLOSE_STATUSES = new Set(['arrived']);

const ROOT_STYLES = StyleSheet.create({
  root: {
    flex: 1,
  },
});

const safeDate = value => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortBookingsByRecent = bookings => [...bookings].sort((a, b) => {
  const aDate = safeDate(a?.scheduledDate) || safeDate(a?.createdAt);
  const bDate = safeDate(b?.scheduledDate) || safeDate(b?.createdAt);

  return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
});

const normalizeStatus = value => String(value || '').trim().toLowerCase();

const parseTrackingCoordinates = record => {
  const latitude = Number(record?.current_lat);
  const longitude = Number(record?.current_lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const formatTrackingDistance = distanceInMeters => {
  if (!Number.isFinite(distanceInMeters)) {
    return null;
  }

  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m away`;
  }

  return `${(distanceInMeters / 1000).toFixed(distanceInMeters >= 10000 ? 0 : 1)} km away`;
};

const buildTrackingCoordinateSignature = coords => (
  `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`
);

const formatTrackingLocationFallback = coords => (
  `Technician live at ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
);

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location access needed',
        message: 'TrustFix uses your location to show how far the technician is from you.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (_) {
    return false;
  }
};

const getCurrentCoordinates = () => new Promise((resolve, reject) => {
  Geolocation.getCurrentPosition(
    position => resolve({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
    reject,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      forceRequestLocation: true,
      showLocationDialog: true,
    },
  );
});

const getTabColors = isDark => {
  const theme = getThemeColors(isDark);

  return {
    isDark,
    primary: theme.primary,
    primarySoft: isDark ? 'rgba(255,122,69,0.22)' : 'rgba(217,79,43,0.12)',
    activeStart: isDark ? '#FF8B5E' : '#FF7D4D',
    activeEnd: isDark ? '#D85B2A' : '#D94F2B',
    surfaceTop: isDark ? '#1B2430' : '#FFFFFF',
    surfaceBottom: isDark ? '#111821' : '#FFF7F2',
    border: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(217,79,43,0.12)',
    borderStrong: isDark ? 'rgba(255,255,255,0.14)' : '#F3DED3',
    textMuted: theme.inkMuted,
    textSecondary: theme.inkSecondary,
    textOnActive: theme.white,
    iconShell: isDark ? 'rgba(255,255,255,0.05)' : '#FFF8F3',
    iconShellBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(217,79,43,0.08)',
    ambientGlow: isDark ? 'rgba(255,122,69,0.28)' : 'rgba(217,79,43,0.18)',
    sheen: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.92)',
    shadow: theme.black,
  };
};

const CustomTabBar = ({ state, navigation }) => {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const colors = useMemo(() => getTabColors(isDark), [isDark]);
  const styles = useMemo(
    () => createStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );
  const currentRouteName = state.routes[state.index]?.name;

  const bookingRoute = state.routes.find(route => route.name === 'Booking');
  const currentStep = bookingRoute?.params?.currentStep ?? 1;
  const isOnBooking = currentRouteName === 'Booking';

  if (isOnBooking && currentStep > 1) {
    return null;
  }

  const profileRoute = state.routes.find(route => route.name === 'Profile');
  const profileScreen = profileRoute?.params?.profileScreen ?? 'main';
  const isOnProfile = currentRouteName === 'Profile';

  if (isOnProfile && profileScreen !== 'main') {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.shell}>
        <LinearGradient
          colors={[colors.surfaceTop, colors.surfaceBottom]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bar}
        >
          <View style={styles.tabsRow}>
            {state.routes.map((route) => {
              const isFocused =
                state.index ===
                state.routes.findIndex(item => item.key === route.key);
              const tab = TABS.find(item => item.name === route.name);

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.88}
                  style={styles.tabItem}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={tab?.label || route.name}
                >
                  <View
                    style={[styles.tabContent, isFocused && styles.activeTab]}
                  >
                    <View
                      style={[
                        styles.iconChip,
                        isFocused && styles.iconChipActive,
                      ]}
                    >
                      <Icon
                        name={
                          isFocused
                            ? tab?.activeIcon || tab?.icon || 'circle-outline'
                            : tab?.icon || 'circle-outline'
                        }
                        size={16}
                        color={
                          isFocused ? colors.textOnActive : colors.textMuted
                        }
                      />
                    </View>
                    <Text
                      style={[styles.label, isFocused && styles.activeLabel]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {tab?.label || route.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const renderTabBar = props => <CustomTabBar {...props} />;

const HomeBottomNav = () => {
  const [bookings, setBookings] = useState(() => getBookings());
  const [activeTabName, setActiveTabName] = useState('Home');
  const [showTrackingPopup, setShowTrackingPopup] = useState(false);
  const [trackingDistance, setTrackingDistance] = useState(null);
  const [trackingLocationLabel, setTrackingLocationLabel] = useState(null);
  const trackingChannelRef = useRef(null);
  const trackingStatusChannelRef = useRef(null);
  const customerCoordsRef = useRef(null);
  const hasRequestedCustomerLocationRef = useRef(false);
  const trackingLocationCacheRef = useRef({ signature: '', label: null });
  const trackingLocationRequestRef = useRef(0);
  const activeBooking = useMemo(() => {
    const sortedBookings = sortBookingsByRecent(bookings).filter(booking => (
      TRACKABLE_BOOKING_STATUSES.has(String(booking?.status || '').trim())
    ));

    for (const group of TRACKING_STATUS_GROUPS) {
      const matchingBooking = sortedBookings.find(booking => (
        group.includes(String(booking?.status || '').trim())
      ));

      if (matchingBooking) {
        return matchingBooking;
      }
    }

    return sortedBookings[0] || null;
  }, [bookings]);
  const activeBookingStatus = normalizeStatus(activeBooking?.status);
  const shouldShowTrackingPopup = TRACKING_POPUP_VISIBLE_STATUSES.has(activeBookingStatus);

  useEffect(() => {
    syncBookingsFromRemote();
    return subscribeToBookings(setBookings);
  }, []);

  useEffect(() => {
    customerCoordsRef.current = null;
    hasRequestedCustomerLocationRef.current = false;
    trackingLocationCacheRef.current = { signature: '', label: null };
    trackingLocationRequestRef.current = 0;
    setTrackingDistance(null);
    setTrackingLocationLabel(null);

    if (!activeBooking?.id) {
      setShowTrackingPopup(false);
    }
  }, [activeBooking?.id]);

  const resolveCustomerCoordinates = useCallback(async () => {
    if (customerCoordsRef.current) {
      return customerCoordsRef.current;
    }

    let hasPermission = false;

    if (!hasRequestedCustomerLocationRef.current) {
      hasRequestedCustomerLocationRef.current = true;
      hasPermission = await requestLocationPermission();
    }

    if (hasPermission) {
      try {
        customerCoordsRef.current = await getCurrentCoordinates();
        return customerCoordsRef.current;
      } catch (_) {}
    }

    if (
      Number.isFinite(activeBooking?.customerLat)
      && Number.isFinite(activeBooking?.customerLng)
    ) {
      customerCoordsRef.current = {
        latitude: activeBooking.customerLat,
        longitude: activeBooking.customerLng,
      };
      return customerCoordsRef.current;
    }

    return null;
  }, [activeBooking?.customerLat, activeBooking?.customerLng]);

  const updateTrackingDistance = useCallback(async (record) => {
    const technicianCoords = parseTrackingCoordinates(record);

    if (!technicianCoords) {
      setTrackingDistance(null);
      return;
    }

    const customerCoords = await resolveCustomerCoordinates();

    if (!customerCoords) {
      setTrackingDistance(null);
      return;
    }

    const distanceInMeters = getDistance(customerCoords, technicianCoords);
    setTrackingDistance(formatTrackingDistance(distanceInMeters));
  }, [resolveCustomerCoordinates]);

  const updateTrackingLocationLabel = useCallback(async (record) => {
    const bookingId = String(activeBooking?.id || '').trim();
    const technicianCoords = parseTrackingCoordinates(record);

    if (!bookingId || !technicianCoords) {
      setTrackingLocationLabel(null);
      return;
    }

    const nextSignature = buildTrackingCoordinateSignature(technicianCoords);
    const cachedResult = trackingLocationCacheRef.current;

    if (cachedResult.signature === nextSignature && cachedResult.label) {
      setTrackingLocationLabel(cachedResult.label);
      return;
    }

    const requestId = trackingLocationRequestRef.current + 1;
    trackingLocationRequestRef.current = requestId;

    if (!cachedResult.label) {
      setTrackingLocationLabel('Resolving technician location...');
    }

    const reverseResult = await supabase.functions.invoke('geocode-booking-address', {
      body: {
        bookingId,
        technicianLat: technicianCoords.latitude,
        technicianLng: technicianCoords.longitude,
      },
    });

    if (trackingLocationRequestRef.current !== requestId) {
      return;
    }

    const nextLabel = String(
      reverseResult?.data?.technicianLocation
      || cachedResult.label
      || formatTrackingLocationFallback(technicianCoords),
    ).trim();

    trackingLocationCacheRef.current = {
      signature: nextSignature,
      label: nextLabel,
    };
    setTrackingLocationLabel(nextLabel);
  }, [activeBooking?.id]);

  useEffect(() => {
    let isMounted = true;
    const bookingId = String(activeBooking?.id || '').trim();

    const clearTrackingUi = () => {
      customerCoordsRef.current = null;
      setShowTrackingPopup(false);
      setTrackingDistance(null);
      setTrackingLocationLabel(null);
    };

    if (!bookingId || !shouldShowTrackingPopup) {
      const existingChannel = trackingChannelRef.current;
      trackingChannelRef.current = null;
      const existingStatusChannel = trackingStatusChannelRef.current;
      trackingStatusChannelRef.current = null;

      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      if (existingStatusChannel) {
        supabase.removeChannel(existingStatusChannel);
      }

      clearTrackingUi();
      return undefined;
    }

    const handleTrackingUpdate = async (record) => {
      if (!isMounted) {
        return;
      }

      setShowTrackingPopup(true);
      setTrackingDistance(currentValue => currentValue || 'Locating...');
      setTrackingLocationLabel(currentValue => currentValue || 'Resolving technician location...');

      updateTrackingDistance(record).catch(() => {});
      updateTrackingLocationLabel(record).catch(() => {});
    };

    const subscribeToTracking = async () => {
      const existingChannel = trackingChannelRef.current;
      const existingStatusChannel = trackingStatusChannelRef.current;

      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (existingStatusChannel) {
        await supabase.removeChannel(existingStatusChannel);
      }

      const statusChannel = supabase
        .channel(`booking-status-history:${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'booking_status_history',
            filter: `booking_id=eq.${bookingId}`,
          },
          payload => {
            if (!isMounted) {
              return;
            }

            if (TRACKING_POPUP_CLOSE_STATUSES.has(normalizeStatus(payload.new?.status))) {
              clearTrackingUi();
            }
          },
        );

      trackingStatusChannelRef.current = statusChannel;
      statusChannel.subscribe();

      const latestStatusResult = await supabase.db.select('booking_status_history', {
        columns: 'status,created_at',
        filters: [{ column: 'booking_id', op: 'eq', value: bookingId }],
        order: [{ column: 'created_at', ascending: false }],
        maybeSingle: true,
      });

      if (!isMounted) {
        return;
      }

      if (TRACKING_POPUP_CLOSE_STATUSES.has(normalizeStatus(latestStatusResult.data?.status))) {
        clearTrackingUi();
        return;
      }

      const channel = supabase
        .channel(`technician-live-tracking:${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'technician_live_tracking',
            filter: `booking_id=eq.${bookingId}`,
          },
          async payload => {
            await handleTrackingUpdate(payload.new);
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'technician_live_tracking',
            filter: `booking_id=eq.${bookingId}`,
          },
          async payload => {
            await handleTrackingUpdate(payload.new);
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'technician_live_tracking',
            filter: `booking_id=eq.${bookingId}`,
          },
          () => {
            if (!isMounted) {
              return;
            }

            clearTrackingUi();
          },
        );

      trackingChannelRef.current = channel;
      channel.subscribe();

      const existingTrackingResult = await supabase.db.select('technician_live_tracking', {
        filters: [{ column: 'booking_id', op: 'eq', value: bookingId }],
        maybeSingle: true,
      });

      if (!isMounted) {
        return;
      }

      if (existingTrackingResult.data) {
        await handleTrackingUpdate(existingTrackingResult.data);
        return;
      }

      clearTrackingUi();
    };

    subscribeToTracking();

    return () => {
      isMounted = false;

      const existingChannel = trackingChannelRef.current;
      trackingChannelRef.current = null;
      const existingStatusChannel = trackingStatusChannelRef.current;
      trackingStatusChannelRef.current = null;

      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      if (existingStatusChannel) {
        supabase.removeChannel(existingStatusChannel);
      }
    };
  }, [
    activeBooking?.id,
    shouldShowTrackingPopup,
    updateTrackingDistance,
    updateTrackingLocationLabel,
  ]);

  return (
    <View style={ROOT_STYLES.root}>
      <Tab.Navigator
        tabBar={renderTabBar}
        screenListeners={({ route }) => ({
          focus: () => setActiveTabName(route.name),
        })}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Booking" component={Booking} />
        <Tab.Screen name="History" component={ServiceLedger} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>

      <TrackingPopup
        visible={showTrackingPopup && activeTabName === 'Home'}
        distance={trackingDistance}
        locationLabel={trackingLocationLabel}
        showClose={false}
      />
    </View>
  );
};

export default HomeBottomNav;

const createStyles = (colors, bottomInset) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 12,
      paddingBottom:
        bottomInset > 0 ? Math.max(bottomInset - 6, 6) : Platform.OS === 'ios' ? 8 : 6,
    },
    shell: {
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.isDark ? 0.24 : 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingHorizontal: 5,
      paddingVertical: 4,
      backgroundColor: colors.surfaceTop,
      minHeight: TAB_BAR_BASE_HEIGHT,
    },
    tabsRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tabItem: {
      flex: 1,
      paddingHorizontal: 3,
      justifyContent: 'center',
      minWidth: 0,
    },
    tabContent: {
      width: '100%',
      minHeight: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    activeTab: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 16,
    },
    iconChip: {
      width: 30,
      height: 30,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconShell,
      borderWidth: 1,
      borderColor: colors.iconShellBorder,
    },
    iconChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.isDark ? 0.14 : 0.16,
      shadowRadius: 8,
      elevation: 4,
    },
    label: {
      marginTop: 2,
      fontSize: 8.5,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.1,
    },
    activeLabel: {
      fontWeight: '800',
      color: colors.primary,
    },
  });

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { supabase } from '../../../lib/supabase';
import { fetchTechnicianJobDetail } from '../../../technician/jobAssignmentEngine';
import { markTechnicianArrived, markTechnicianEnRoute } from '../../../technician/jobProgressEngine';
import { useTechScreenTheme } from '../../../technician/theme';

const TRACKING_TABLE = 'technician_live_tracking';
const LOCATION_DISTANCE_FILTER = 20;

const formatSchedule = (booking = {}) => {
  const date = String(booking.scheduled_date || '').trim();
  const slot = String(booking.scheduled_slot_label || '').trim();

  if (date && slot) {
    return `${date} - ${slot}`;
  }

  return date || slot || 'Schedule pending';
};

const formatProblem = (booking = {}) => (
  String(
    booking.problem_name_snapshot ||
    booking.custom_problem ||
    'Problem details not shared yet.',
  ).trim()
);

const normalizeCountryLabel = (value = '') => {
  const address = String(value || '').trim();

  if (!address) {
    return '';
  }

  const withIndia = address.replace(/(?:,\s*|\s+)IN$/i, ', India');

  if (/\bIndia$/i.test(withIndia)) {
    return withIndia;
  }

  return `${withIndia}, India`;
};

const appendAddressSegment = (baseValue = '', segmentValue = '') => {
  const base = String(baseValue || '').trim();
  const segment = String(segmentValue || '').trim();

  if (!segment) {
    return base;
  }

  if (!base) {
    return segment;
  }

  if (base.toLowerCase().includes(segment.toLowerCase())) {
    return base;
  }

  return `${base}, ${segment}`;
};

const getBookingDestinationAddress = (booking = {}) => {
  const address = String(booking.address_snapshot || '').trim();
  const postalCode = String(booking.pincode || booking.postal_code || '').trim();
  return normalizeCountryLabel(appendAddressSegment(address, postalCode));
};

const formatAddress = (booking = {}) => {
  const label = String(booking.address_label_snapshot || '').trim();
  const address = getBookingDestinationAddress(booking);

  if (label && address) {
    return `${label} - ${address}`;
  }

  return label || address || 'Address pending';
};

const getTrackingCustomerDestination = (record = null) => {
  const destinationText = String(record?.customer_address || '').trim();
  const coordinates = sanitizeCoords({
    latitude: record?.customer_lat,
    longitude: record?.customer_lng,
  });

  if (coordinates) {
    return {
      ...coordinates,
      destinationText,
    };
  }

  if (destinationText) {
    return { destinationText };
  }

  return null;
};

const normalizeRouteDestination = (destination = null, fallbackText = '') => {
  const destinationText = String(destination?.destinationText || fallbackText || '').trim();
  const coordinates = sanitizeCoords(destination);

  if (coordinates) {
    return {
      ...coordinates,
      destinationText,
    };
  }

  if (destinationText) {
    return { destinationText };
  }

  return null;
};

const getCoordinateDestination = (destination = null) => {
  const coordinates = sanitizeCoords(destination);

  if (!coordinates) {
    return null;
  }

  return normalizeRouteDestination(destination);
};

const sanitizeCoords = (coords = null) => {
  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const buildMapsRouteUrl = (destination, origin) => {
  if (!destination) {
    return '';
  }

  const destinationText = String(destination?.destinationText || '').trim();
  const originCoords = sanitizeCoords(origin);
  const hasDestinationCoords = Number.isFinite(destination.latitude) && Number.isFinite(destination.longitude);

  if (destinationText) {
    const originQuery = originCoords
      ? `origin=${originCoords.latitude},${originCoords.longitude}&`
      : '';
    return `https://www.google.com/maps/dir/?api=1&${originQuery}destination=${encodeURIComponent(destinationText)}&travelmode=driving&dir_action=navigate`;
  }

  if (hasDestinationCoords) {
    const originQuery = originCoords
      ? `origin=${originCoords.latitude},${originCoords.longitude}&`
      : '';
    return `https://www.google.com/maps/dir/?api=1&${originQuery}destination=${destination.latitude},${destination.longitude}&travelmode=driving&dir_action=navigate`;
  }

  return '';
};

const getReadableErrorMessage = (error, fallbackMessage) => (
  String(error?.message || '').trim() || fallbackMessage
);

const isTrackingTableMissing = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes(TRACKING_TABLE.toLowerCase())
    && (
      message.includes('schema cache')
      || message.includes('could not find the table')
      || message.includes('relation')
    )
  );
};

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location access needed',
        message: 'TrustFix needs your location to share live route updates with the customer.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (_) {
    return false;
  }
};

const getCurrentPosition = () => new Promise((resolve, reject) => {
  Geolocation.getCurrentPosition(
    position => resolve(position),
    reject,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
      forceRequestLocation: true,
      showLocationDialog: true,
    },
  );
});

export default function EnRouteScreen({ navigation, route }) {
  const bookingId = route?.params?.jobId;
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [jobRecord, setJobRecord] = useState(null);
  const [pageError, setPageError] = useState('');
  const [routeNotice, setRouteNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const watcherRef = useRef(null);
  const technicianIdRef = useRef('');
  const technicianCoordsRef = useRef(null);
  const customerDestinationRef = useRef(null);
  const isStartingTrackingRef = useRef(false);
  const hasOpenedMapsRef = useRef(false);
  const trackingUnavailableRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      setIsLoading(true);
      setPageError('');
      setRouteNotice('');
      technicianCoordsRef.current = null;
      customerDestinationRef.current = null;
      hasOpenedMapsRef.current = false;
      trackingUnavailableRef.current = false;

      const result = await fetchTechnicianJobDetail(bookingId);

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setJobRecord(null);
        setPageError(result.error.message || 'Could not load this booking right now.');
      } else {
        setJobRecord(result.data);
      }

      setIsLoading(false);
    };

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const clearLocationWatch = useCallback(() => {
    if (watcherRef.current !== null && watcherRef.current !== undefined) {
      Geolocation.clearWatch(watcherRef.current);
      watcherRef.current = null;
    }
  }, []);

  useEffect(() => (
    () => {
      clearLocationWatch();
    }
  ), [clearLocationWatch]);

  const showTrackingNotice = useCallback((error, fallbackMessage) => {
    if (isTrackingTableMissing(error)) {
      trackingUnavailableRef.current = true;
      clearLocationWatch();
      setRouteNotice('Live tracking table is not ready in Supabase yet. Open in Maps will still work.');
      return;
    }

    setRouteNotice(getReadableErrorMessage(error, fallbackMessage));
  }, [clearLocationWatch]);

  const fetchTrackingRecord = useCallback(async () => {
    const trackingResult = await supabase.db.select(TRACKING_TABLE, {
      filters: [{ column: 'booking_id', op: 'eq', value: bookingId }],
      maybeSingle: true,
    });

    if (trackingResult.error) {
      showTrackingNotice(trackingResult.error, 'Could not load live tracking details right now.');
      return null;
    }

    return trackingResult.data || null;
  }, [bookingId, showTrackingNotice]);

  const upsertTrackingLocation = useCallback(async ({
    technicianId,
    coords,
    customerAddress,
    customerDestination,
  }) => {
    return supabase.db.upsert(
      TRACKING_TABLE,
      {
        booking_id: bookingId,
        technician_id: technicianId,
        current_lat: coords.latitude,
        current_lng: coords.longitude,
        customer_address: String(
          customerAddress
          || customerDestination?.destinationText
          || getBookingDestinationAddress(jobRecord?.bookings)
          || '',
        ).trim() || null,
        customer_lat: customerDestination?.latitude ?? null,
        customer_lng: customerDestination?.longitude ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'booking_id',
      },
    );
  }, [bookingId, jobRecord?.bookings]);

  const resolveTechnicianId = useCallback(async () => {
    if (technicianIdRef.current) {
      return technicianIdRef.current;
    }

    const userResult = await supabase.auth.getUser();
    const technicianId = String(
      userResult.data?.user?.id
      || jobRecord?.bookings?.technician_id
      || jobRecord?.technician_id
      || '',
    ).trim();

    if (technicianId) {
      technicianIdRef.current = technicianId;
    }

    return technicianId;
  }, [jobRecord?.bookings?.technician_id, jobRecord?.technician_id]);

  const rememberTechnicianCoords = useCallback((coords) => {
    const sanitized = sanitizeCoords(coords);

    if (sanitized) {
      technicianCoordsRef.current = sanitized;
    }

    return sanitized;
  }, []);

  const resolveRouteOrigin = useCallback(async (originOverride = null) => {
    const overrideCoords = sanitizeCoords(originOverride);

    if (overrideCoords) {
      technicianCoordsRef.current = overrideCoords;
      return overrideCoords;
    }

    const storedCoords = sanitizeCoords(technicianCoordsRef.current);

    if (storedCoords) {
      return storedCoords;
    }

    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      return null;
    }

    try {
      const position = await getCurrentPosition();
      return rememberTechnicianCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (_) {
      return null;
    }
  }, [rememberTechnicianCoords]);

  const resolveCustomerDestination = useCallback(async ({
    booking,
    technicianId,
    coords,
  }) => {
    const trackingRecord = await fetchTrackingRecord();
    const trackingDestination = getTrackingCustomerDestination(trackingRecord);
    const bookingAddress = getBookingDestinationAddress(booking);
    const trackingAddress = String(trackingRecord?.customer_address || '').trim();
    const customerAddress = bookingAddress || trackingAddress;

    if (!customerAddress) {
      setRouteNotice('Customer address is unavailable for navigation right now.');
      return null;
    }

    const trackedSnapshot = normalizeRouteDestination(
      trackingDestination
        ? {
            ...trackingDestination,
            destinationText: customerAddress,
          }
        : null,
      customerAddress,
    )
      || { destinationText: customerAddress };
    const existingTrackingDestination = getCoordinateDestination(trackedSnapshot);
    const syncTrackingResult = await upsertTrackingLocation({
      technicianId,
      coords,
      customerAddress,
      customerDestination: trackedSnapshot,
    });

    if (syncTrackingResult.error) {
      showTrackingNotice(syncTrackingResult.error, 'Could not sync route details right now.');
      return null;
    }

    if (existingTrackingDestination) {
      customerDestinationRef.current = existingTrackingDestination;
      return existingTrackingDestination;
    }

    const cachedDestination = getCoordinateDestination(customerDestinationRef.current);

    if (cachedDestination) {
      customerDestinationRef.current = cachedDestination;
      return cachedDestination;
    }

    if (!trackingRecord || !trackingAddress) {
      const ensureRowResult = await upsertTrackingLocation({
        technicianId,
        coords,
        customerAddress,
        customerDestination: null,
      });

      if (ensureRowResult.error) {
        showTrackingNotice(ensureRowResult.error, 'Could not prepare live tracking right now.');
        return null;
      }
    }

    const geocodingResult = await supabase.functions.invoke('geocode-booking-address', {
      body: {
        bookingId,
        customerAddress,
      },
    });

    if (geocodingResult.error) {
      const fallbackDestination = normalizeRouteDestination(null, customerAddress);
      customerDestinationRef.current = fallbackDestination;
      setRouteNotice(geocodingResult.error.message || 'Opening Google Maps with the saved customer address.');
      return fallbackDestination;
    }

    const resolvedDestination = getCoordinateDestination(normalizeRouteDestination(
      {
        latitude: geocodingResult.data?.customerLat,
        longitude: geocodingResult.data?.customerLng,
        destinationText: geocodingResult.data?.customerAddress || customerAddress,
      },
      customerAddress,
    ));

    if (!resolvedDestination) {
      const fallbackDestination = normalizeRouteDestination(null, customerAddress);
      customerDestinationRef.current = fallbackDestination;
      setRouteNotice('Opening Google Maps with the saved customer address.');
      return fallbackDestination;
    }

    const saveDestinationResult = await upsertTrackingLocation({
      technicianId,
      coords,
      customerAddress,
      customerDestination: resolvedDestination,
    });

    if (saveDestinationResult.error) {
      showTrackingNotice(saveDestinationResult.error, 'Could not save customer map location right now.');
    }

    const savedTrackingRecord = await fetchTrackingRecord();
    const savedTrackingDestination = getCoordinateDestination(
      getTrackingCustomerDestination(savedTrackingRecord),
    );
    const finalDestination = savedTrackingDestination || resolvedDestination || trackedSnapshot;

    customerDestinationRef.current = finalDestination;
    return finalDestination;
  }, [bookingId, fetchTrackingRecord, showTrackingNotice, upsertTrackingLocation]);

  const openCustomerRoute = useCallback(async (
    originOverride = null,
    destinationOverride = null,
  ) => {
    const destination = normalizeRouteDestination(destinationOverride);
    const origin = await resolveRouteOrigin(originOverride);

    if (!origin) {
      setRouteNotice('Current phone location is required before opening the route.');
      return false;
    }

    const mapsUrl = buildMapsRouteUrl(destination, origin);

    if (!mapsUrl) {
      setRouteNotice('Customer address is unavailable for navigation right now.');
      return false;
    }

    try {
      await Linking.openURL(mapsUrl);
      setRouteNotice('');
      return true;
    } catch (_) {
      setRouteNotice('Could not open Google Maps right now.');
      return false;
    }
  }, [resolveRouteOrigin]);

  const beginLiveTracking = useCallback(async ({
    shouldMarkEnRoute,
    shouldOpenMaps,
  }) => {
    if (!bookingId || isStartingTrackingRef.current || trackingUnavailableRef.current) {
      return;
    }

    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setRouteNotice('Location permission is required to share live route updates.');
      return;
    }

    setPageError('');
    setIsUpdatingStatus(true);
    isStartingTrackingRef.current = true;

    try {
      const currentPosition = await getCurrentPosition();
      const latestCoords = rememberTechnicianCoords({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });

      if (!latestCoords) {
        setRouteNotice('Current phone location is unavailable right now.');
        return;
      }

      const technicianId = await resolveTechnicianId();

      if (!technicianId) {
        setRouteNotice('Technician profile could not be verified right now.');
        return;
      }

      if (shouldMarkEnRoute) {
        const statusResult = await markTechnicianEnRoute(bookingId);

        if (statusResult.error) {
          setRouteNotice(statusResult.error.message || 'Could not update route status right now.');
          return;
        }

        if (statusResult.data?.status) {
          setJobRecord(prev => (
            prev
              ? {
                  ...prev,
                  bookings: {
                    ...prev.bookings,
                    status: statusResult.data.status,
                  },
                }
              : prev
          ));
        }
      }

      const immediateCustomerAddress = getBookingDestinationAddress(jobRecord?.bookings);
      const immediateTrackingResult = await upsertTrackingLocation({
        technicianId,
        coords: latestCoords,
        customerAddress: immediateCustomerAddress,
        customerDestination: null,
      });

      if (immediateTrackingResult.error) {
        if (shouldOpenMaps && !hasOpenedMapsRef.current) {
          hasOpenedMapsRef.current = true;
          await openCustomerRoute(latestCoords, normalizeRouteDestination(null, immediateCustomerAddress));
        }

        showTrackingNotice(immediateTrackingResult.error, 'Could not start live tracking right now.');
        return;
      }

      const customerDestination = await resolveCustomerDestination({
        booking: jobRecord?.bookings,
        technicianId,
        coords: latestCoords,
      });

      const hasCustomerRoute = !!normalizeRouteDestination(customerDestination);

      if (!hasCustomerRoute) {
        setRouteNotice('Customer address is unavailable for navigation right now.');
        return;
      }

      const initialTrackingResult = await upsertTrackingLocation({
        technicianId,
        coords: latestCoords,
        customerAddress: customerDestination.destinationText,
        customerDestination,
      });

      if (initialTrackingResult.error) {
        if (shouldOpenMaps && !hasOpenedMapsRef.current) {
          hasOpenedMapsRef.current = true;
          await openCustomerRoute(latestCoords, customerDestination);
        }

        showTrackingNotice(initialTrackingResult.error, 'Could not start live tracking right now.');
        return;
      }

      clearLocationWatch();
      watcherRef.current = Geolocation.watchPosition(
        async (position) => {
          const watchCoords = rememberTechnicianCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          const liveTrackingResult = await upsertTrackingLocation({
            technicianId,
            coords: watchCoords,
            customerAddress: customerDestination.destinationText,
            customerDestination,
          });

          if (liveTrackingResult.error) {
            showTrackingNotice(liveTrackingResult.error, 'Live location update failed.');
          }
        },
        (watchError) => {
          if (String(watchError?.message || '').trim()) {
            setRouteNotice(watchError.message);
          }
        },
        {
          enableHighAccuracy: true,
          distanceFilter: LOCATION_DISTANCE_FILTER,
          interval: 20000,
          fastestInterval: 15000,
          forceRequestLocation: true,
          showLocationDialog: false,
        },
      );

      if (shouldOpenMaps && !hasOpenedMapsRef.current) {
        hasOpenedMapsRef.current = true;
        await openCustomerRoute(latestCoords, customerDestination);
      }
    } catch (error) {
      setRouteNotice(error?.message || 'Could not fetch your current location.');
    } finally {
      isStartingTrackingRef.current = false;
      setIsUpdatingStatus(false);
    }
  }, [
    bookingId,
    clearLocationWatch,
    jobRecord?.bookings,
    openCustomerRoute,
    rememberTechnicianCoords,
    resolveCustomerDestination,
    resolveTechnicianId,
    setPageError,
    showTrackingNotice,
    upsertTrackingLocation,
  ]);

  useEffect(() => {
    const currentStatus = String(jobRecord?.bookings?.status || '').trim();

    if (!bookingId || !jobRecord?.bookings) {
      return;
    }

    if (['accepted', 'assigned'].includes(currentStatus)) {
      beginLiveTracking({
        shouldMarkEnRoute: true,
        shouldOpenMaps: true,
      });
      return;
    }

    if (currentStatus === 'en_route' && watcherRef.current == null) {
      beginLiveTracking({
        shouldMarkEnRoute: false,
        shouldOpenMaps: true,
      });
    }
  }, [beginLiveTracking, bookingId, jobRecord?.bookings]);

  useEffect(() => {
    const currentStatus = String(jobRecord?.bookings?.status || '').trim();

    if (currentStatus === 'arrived') {
      clearLocationWatch();
      navigation.replace('TechnicianSafetyOtp', {
        jobId: bookingId,
        estimateDraft: route?.params?.estimateDraft,
      });
      return;
    }

    if ([
      'otp_verified',
      'estimate_sent',
      'estimate_revision_requested',
      'estimate_approved',
      'in_progress',
      'work_completed',
    ].includes(currentStatus)) {
      navigation.replace('TechnicianJobInProgress', {
        jobId: bookingId,
        estimateDraft: route?.params?.estimateDraft,
      });
    }
  }, [bookingId, clearLocationWatch, jobRecord?.bookings?.status, navigation, route?.params?.estimateDraft]);

  const booking = jobRecord?.bookings || {};
  const customerName = String(booking.customer_name_snapshot || 'Customer').trim();
  const customerPhone = String(booking.customer_phone_snapshot || '').trim();
  const serviceName = String(booking.service_name_snapshot || 'Service request').trim();
  const problemLabel = formatProblem(booking);
  const addressLabel = formatAddress(booking);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.topFloat}>
            <View style={styles.topFloatIcon}>
              <Icon name="hammer-wrench" size={20} color={TECH_COLORS.white} />
            </View>

            <View style={styles.topFloatCopy}>
              <Text style={styles.topFloatTitle}>{serviceName}</Text>
              <Text style={styles.topFloatText}>
                {customerName} - {problemLabel}
              </Text>
            </View>

            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>En Route</Text>
            </View>
          </View>

          <View style={styles.bottomSheet}>
            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={TECH_COLORS.emerald} />
                <Text style={styles.stateText}>Loading route details</Text>
              </View>
            ) : null}

            {!isLoading && pageError ? (
              <View style={styles.stateCard}>
                <Icon name="alert-circle-outline" size={24} color={TECH_COLORS.rose} />
                <Text style={styles.stateText}>{pageError}</Text>
              </View>
            ) : null}

            {!isLoading && !pageError ? (
              <>
                {routeNotice ? (
                  <View style={styles.noticeCard}>
                    <Icon name="information-outline" size={18} color={TECH_COLORS.gold} />
                    <Text style={styles.noticeText}>{routeNotice}</Text>
                  </View>
                ) : null}

                <View style={styles.bottomTopRow}>
                  <View>
                    <Text style={styles.etaNumber}>{formatSchedule(booking)}</Text>
                    <Text style={styles.etaText}>Scheduled arrival</Text>
                  </View>
                </View>

                <View style={styles.customerCard}>
                  <View style={styles.customerCardCopy}>
                    <Text style={styles.customerCardTitle}>{customerName}</Text>
                    <Text style={styles.customerCardText}>
                      {customerPhone || 'Customer phone not available'}
                    </Text>
                  </View>
                  <Icon name="account-circle-outline" size={22} color={TECH_COLORS.emerald} />
                </View>

                <View style={styles.locationCard}>
                  <View style={styles.locationEyebrowRow}>
                    <Icon name="map-marker-outline" size={14} color={TECH_COLORS.emerald} />
                    <Text style={styles.locationEyebrow}>Customer address</Text>
                  </View>
                  <Text style={styles.locationTitle}>{addressLabel}</Text>
                  <Text style={styles.locationText}>
                    Booking {booking.booking_number || '-'}
                  </Text>
                  <Text style={styles.locationHint}>
                    Live route updates are shared with the customer while you travel.
                  </Text>
                </View>

                <View style={styles.bottomActions}>
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.routeButton}
                    onPress={async () => {
                      const origin = await resolveRouteOrigin();

                      if (!origin) {
                        setRouteNotice('Current phone location is required before opening the route.');
                        return;
                      }

                      const technicianId = await resolveTechnicianId();

                      if (!technicianId) {
                        setRouteNotice('Technician profile could not be verified right now.');
                        return;
                      }

                      const destination = await resolveCustomerDestination({
                        booking: jobRecord?.bookings,
                        technicianId,
                        coords: origin,
                      });

                      if (!destination) {
                        return;
                      }

                      await openCustomerRoute(origin, destination);
                    }}
                  >
                    <Text style={styles.routeText}>Open in Maps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={styles.callButton}
                    disabled={!customerPhone}
                    onPress={() => Linking.openURL(`tel:${customerPhone.replace(/\s+/g, '')}`)}
                  >
                    <Text style={styles.callText}>Call Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.arrivedButton}
                    disabled={isUpdatingStatus}
                    onPress={async () => {
                      setPageError('');
                      setIsUpdatingStatus(true);
                      const result = await markTechnicianArrived(bookingId);

                      if (result.error) {
                        setIsUpdatingStatus(false);
                        setRouteNotice(result.error.message || 'Could not mark arrival right now.');
                        return;
                      }

                      const deleteTrackingResult = await supabase.db.remove(TRACKING_TABLE, {
                        filters: [{ column: 'booking_id', op: 'eq', value: bookingId }],
                      });

                      clearLocationWatch();
                      setIsUpdatingStatus(false);

                      if (deleteTrackingResult.error) {
                        showTrackingNotice(deleteTrackingResult.error, 'Could not stop live tracking right now.');
                      }

                      navigation.replace('TechnicianSafetyOtp', {
                        jobId: bookingId,
                        estimateDraft: route?.params?.estimateDraft,
                        otpExpiresAt: result.data?.expiresAt || null,
                      });
                    }}
                  >
                    <Text style={styles.arrivedText}>
                      {isUpdatingStatus ? 'Updating...' : "I've Arrived"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const createStyles = ({
  colors: TECH_COLORS,
  radius: TECH_RADIUS,
}) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TECH_COLORS.bg,
  },
  content: {
    flex: 1,
    backgroundColor: TECH_COLORS.bgElevated,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  topFloat: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(22,27,38,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  topFloatIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topFloatCopy: {
    flex: 1,
  },
  topFloatTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  topFloatText: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: TECH_RADIUS.pill,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  bottomSheet: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 26,
    borderRadius: 28,
    backgroundColor: 'rgba(22,27,38,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: 'rgba(250,204,21,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.22)',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  etaNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  etaText: {
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.20)',
    marginBottom: 14,
  },
  customerCardCopy: {
    flex: 1,
    marginRight: 10,
  },
  customerCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerCardText: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.emerald,
  },
  locationCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    marginBottom: 14,
  },
  locationEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
    textTransform: 'uppercase',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  locationText: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  locationHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: TECH_COLORS.textMuted,
  },
  bottomActions: {
    gap: 10,
  },
  routeButton: {
    minHeight: 46,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
    backgroundColor: TECH_COLORS.emeraldTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.emerald,
  },
  callButton: {
    minHeight: 46,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  arrivedButton: {
    minHeight: 46,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedText: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.bg,
  },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
    color: TECH_COLORS.textSecondary,
  },
});

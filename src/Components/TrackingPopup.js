import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const parseDistanceInMeters = distanceLabel => {
  const match = String(distanceLabel || '').trim().match(/([\d.]+)\s*(km|m)/i);

  if (!match) {
    return null;
  }

  const numericValue = Number(match[1]);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return match[2].toLowerCase() === 'km'
    ? numericValue * 1000
    : numericValue;
};

const formatEtaLabel = distanceLabel => {
  const distanceInMeters = parseDistanceInMeters(distanceLabel);

  if (!Number.isFinite(distanceInMeters)) {
    return 'ETA updating';
  }

  const etaMinutes = Math.max(1, Math.round(distanceInMeters / 300));
  return `ETA ${etaMinutes} min`;
};

export default function TrackingPopup({
  visible,
  distance,
  onClose,
  showClose = false,
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  const etaLabel = formatEtaLabel(distance);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return undefined;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -28,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });

    return undefined;
  }, [opacity, translateY, visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        { top: insets.top + 12 },
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.glowAccent} />

      <View style={styles.headerRow}>
        <View style={styles.iconShell}>
          <View style={styles.iconChip}>
            <Icon name="account-wrench" size={20} color="#10B981" />
          </View>
        </View>

        <View style={styles.copyWrap}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Technician on the way</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.distance}>{distance || 'Locating...'}</Text>
        </View>

        {showClose ? (
          <TouchableOpacity
            activeOpacity={0.82}
            hitSlop={10}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Icon name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusChip}>
          <Icon name="navigation-variant-outline" size={13} color="#0F766E" />
          <Text style={styles.statusChipText}>Live route shared</Text>
        </View>
        <View style={styles.statusChip}>
          <Icon name="clock-time-four-outline" size={13} color="#0F766E" />
          <Text style={styles.statusChipText}>{etaLabel}</Text>
        </View>
      </View>

      <View style={styles.routePreview}>
        <View style={styles.previewGlowLeft} />
        <View style={styles.previewGlowRight} />
        <View style={styles.previewStreetHorizontal} />
        <View style={styles.previewStreetVerticalLeft} />
        <View style={styles.previewStreetVerticalRight} />
        <View style={styles.routeLineBase} />
        <View style={styles.routeLineActive} />

        <View style={styles.technicianMarker}>
          <View style={styles.markerOuter}>
            <View style={styles.markerInner} />
          </View>
          <View style={styles.technicianTag}>
            <Text style={styles.markerTagText}>Technician</Text>
          </View>
        </View>

        <View style={styles.customerMarker}>
          <View style={[styles.markerOuter, styles.customerMarkerOuter]}>
            <View style={[styles.markerInner, styles.customerMarkerInner]} />
          </View>
          <View style={styles.customerTag}>
            <Text style={styles.markerTagText}>You</Text>
          </View>
        </View>

        <View style={styles.etaChip}>
          <Text style={styles.etaText}>Approaching</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#F3E5D8',
    elevation: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    zIndex: 40,
    overflow: 'hidden',
  },
  glowAccent: {
    position: 'absolute',
    top: -36,
    right: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249,115,22,0.10)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginRight: 10,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9FBF2',
  },
  copyWrap: {
    flex: 1,
    paddingRight: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#64748B',
  },
  livePill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#CFF7E3',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },
  distance: {
    marginTop: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#0F766E',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  statusRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1FDF7',
    borderWidth: 1,
    borderColor: '#D7F7E8',
  },
  statusChipText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  routePreview: {
    height: 74,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F7FFFB',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  previewGlowLeft: {
    position: 'absolute',
    left: -18,
    bottom: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  previewGlowRight: {
    position: 'absolute',
    right: -10,
    top: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(14,165,233,0.08)',
  },
  previewStreetHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 34,
    height: 1,
    backgroundColor: '#DCEFE6',
  },
  previewStreetVerticalLeft: {
    position: 'absolute',
    left: '23%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#DCEFE6',
  },
  previewStreetVerticalRight: {
    position: 'absolute',
    right: '24%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#DCEFE6',
  },
  routeLineBase: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 35,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#D8F8EA',
  },
  routeLineActive: {
    position: 'absolute',
    left: 24,
    width: '56%',
    top: 38,
    borderWidth: 1.8,
    borderStyle: 'dashed',
    borderColor: '#10B981',
  },
  technicianMarker: {
    position: 'absolute',
    left: '24%',
    top: 18,
    alignItems: 'center',
  },
  customerMarker: {
    position: 'absolute',
    right: '27%',
    top: 18,
    alignItems: 'center',
  },
  markerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  customerMarkerOuter: {
    borderColor: '#F87171',
  },
  markerInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  customerMarkerInner: {
    backgroundColor: '#F87171',
  },
  technicianTag: {
    marginTop: -5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#059669',
  },
  customerTag: {
    marginTop: -5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F87171',
  },
  markerTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  etaChip: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8F8EA',
  },
  etaText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
});

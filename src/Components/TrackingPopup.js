import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function TrackingPopup({
  visible,
  distance,
  onClose,
  showClose = false,
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const boundsRef = useRef({
    minX: -4,
    maxX: 0,
    minY: -4,
    maxY: 0,
  });
  const [shouldRender, setShouldRender] = useState(visible);
  const [cardSize, setCardSize] = useState({ width: 268, height: 150 });
  const etaLabel = formatEtaLabel(distance);
  const popupWidth = Math.min(screenWidth - 32, 268);
  const baseTop = insets.top + 12;

  useEffect(() => {
    const minLeft = 12;
    const maxLeft = Math.max(minLeft, screenWidth - cardSize.width - 12);
    const minTop = insets.top + 8;
    const maxTop = Math.max(
      minTop,
      screenHeight - insets.bottom - cardSize.height - 92,
    );
    const bounds = {
      minX: minLeft - 16,
      maxX: maxLeft - 16,
      minY: minTop - baseTop,
      maxY: maxTop - baseTop,
    };

    boundsRef.current = bounds;

    const nextX = clamp(dragOffsetRef.current.x, bounds.minX, bounds.maxX);
    const nextY = clamp(dragOffsetRef.current.y, bounds.minY, bounds.maxY);

    dragOffsetRef.current = { x: nextX, y: nextY };
    dragOffset.setValue({ x: nextX, y: nextY });
  }, [baseTop, cardSize.height, cardSize.width, dragOffset, insets.bottom, insets.top, screenHeight, screenWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => (
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4
      ),
      onPanResponderGrant: () => {
        dragOffset.stopAnimation((value) => {
          dragOffsetRef.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const bounds = boundsRef.current;
        const nextX = clamp(
          dragOffsetRef.current.x + gestureState.dx,
          bounds.minX,
          bounds.maxX,
        );
        const nextY = clamp(
          dragOffsetRef.current.y + gestureState.dy,
          bounds.minY,
          bounds.maxY,
        );

        dragOffset.setValue({ x: nextX, y: nextY });
      },
      onPanResponderRelease: (_, gestureState) => {
        const bounds = boundsRef.current;
        dragOffsetRef.current = {
          x: clamp(
            dragOffsetRef.current.x + gestureState.dx,
            bounds.minX,
            bounds.maxX,
          ),
          y: clamp(
            dragOffsetRef.current.y + gestureState.dy,
            bounds.minY,
            bounds.maxY,
          ),
        };
        dragOffset.setValue(dragOffsetRef.current);
      },
      onPanResponderTerminate: () => {
        dragOffset.setValue(dragOffsetRef.current);
      },
    }),
  ).current;

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
      {...panResponder.panHandlers}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setCardSize((current) => (
          current.width === width && current.height === height
            ? current
            : { width, height }
        ));
      }}
      style={[
        styles.container,
        {
          top: baseTop,
          width: popupWidth,
        },
        {
          opacity,
          transform: [
            { translateX: dragOffset.x },
            { translateY: Animated.add(translateY, dragOffset.y) },
          ],
        },
      ]}
    >
      <View style={styles.glowAccent} />
      <View style={styles.dragHandle} />

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
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
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
  dragHandle: {
    alignSelf: 'center',
    width: 30,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginRight: 8,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9FBF2',
  },
  copyWrap: {
    flex: 1,
    paddingRight: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#64748B',
  },
  livePill: {
    marginLeft: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },
  distance: {
    marginTop: 1,
    fontSize: 18,
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
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F1FDF7',
    borderWidth: 1,
    borderColor: '#D7F7E8',
  },
  statusChipText: {
    marginLeft: 4,
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  routePreview: {
    height: 64,
    borderRadius: 14,
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
    top: 29,
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
    left: 18,
    right: 18,
    top: 30,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D8F8EA',
  },
  routeLineActive: {
    position: 'absolute',
    left: 18,
    width: '56%',
    top: 33,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#10B981',
  },
  technicianMarker: {
    position: 'absolute',
    left: '24%',
    top: 14,
    alignItems: 'center',
  },
  customerMarker: {
    position: 'absolute',
    right: '27%',
    top: 14,
    alignItems: 'center',
  },
  markerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  customerMarkerOuter: {
    borderColor: '#F87171',
  },
  markerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  customerMarkerInner: {
    backgroundColor: '#F87171',
  },
  technicianTag: {
    marginTop: -5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: '#059669',
  },
  customerTag: {
    marginTop: -5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: '#F87171',
  },
  markerTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  etaChip: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8F8EA',
  },
  etaText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0F766E',
  },
});

import React from 'react';
import {
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { getTechnicianJobFlow } from '../../../technician/jobFlowData';
import { useTechScreenTheme } from '../../../technician/theme';

export default function EnRouteScreen({ navigation, route }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const job = getTechnicianJobFlow(route?.params?.jobId);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.map}>
          <View style={[styles.roadH, styles.roadTop32]} />
          <View style={[styles.roadH, styles.roadTop52]} />
          <View style={[styles.roadH, styles.mainRoadH, styles.roadTop68]} />
          <View style={[styles.roadV, styles.roadLeft24]} />
          <View style={[styles.roadV, styles.mainRoadV, styles.roadLeft56]} />
          <View style={[styles.roadV, styles.roadLeft76]} />

          <View style={[styles.block, styles.blockOne]} />
          <View style={[styles.block, styles.blockTwo]} />
          <View style={[styles.block, styles.blockThree]} />
          <View style={[styles.block, styles.blockFour]} />
          <View style={styles.routeDots} />

          <View style={styles.topFloatWrap}>
            <View style={styles.topFloat}>
              <View style={styles.topFloatIcon}>
                <Icon name={job.serviceIcon} size={20} color={TECH_COLORS.white} />
              </View>

              <View style={styles.topFloatCopy}>
                <Text style={styles.topFloatTitle}>{job.service}</Text>
                <Text style={styles.topFloatText}>
                  {job.customer.name} · {job.location.area}
                </Text>
              </View>

              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live tracking</Text>
              </View>
            </View>
          </View>

          <View style={styles.techMarker}>
            <Icon name="hammer-wrench" size={22} color={TECH_COLORS.white} />
          </View>
          <View style={styles.homeMarker}>
            <Icon name="home" size={18} color={TECH_COLORS.white} />
          </View>

          <View style={styles.bottomSheet}>
            <View style={styles.bottomTopRow}>
              <View>
                <Text style={styles.etaNumber}>{job.location.eta}</Text>
                <Text style={styles.etaText}>Estimated arrival</Text>
              </View>
              <View style={styles.distanceWrap}>
                <Text style={styles.distanceNumber}>{job.location.distance}</Text>
                <Text style={styles.etaText}>Distance remaining</Text>
              </View>
            </View>

            <View style={styles.customerCard}>
              <View style={styles.customerCardCopy}>
                <Text style={styles.customerCardTitle}>Customer can track your route</Text>
                <Text style={styles.customerCardText}>
                  Arrival status stays in sync for both customer and technician apps.
                </Text>
              </View>
              <Icon name="map-marker-path" size={22} color={TECH_COLORS.emerald} />
            </View>

            <View style={styles.locationCard}>
              <Text style={styles.locationTitle}>{job.location.address}</Text>
              <Text style={styles.locationText}>
                {job.location.landmark} · Call if building access is blocked.
              </Text>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${job.customer.phoneUnlocked.replace(/\s+/g, '')}`)}
              >
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.arrivedButton}
                onPress={() =>
                  navigation.navigate('TechnicianSafetyOtp', {
                    jobId: job.id,
                    estimateDraft: route?.params?.estimateDraft,
                  })
                }
              >
                <Text style={styles.arrivedText}>I've Arrived</Text>
              </TouchableOpacity>
            </View>
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
  map: {
    flex: 1,
    backgroundColor: TECH_COLORS.bgElevated,
    overflow: 'hidden',
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: TECH_COLORS.cardAlt,
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: TECH_COLORS.cardAlt,
  },
  mainRoadH: {
    height: 8,
    backgroundColor: 'rgba(255,107,53,0.10)',
  },
  mainRoadV: {
    width: 8,
    backgroundColor: 'rgba(255,107,53,0.10)',
  },
  roadTop32: {
    top: '32%',
  },
  roadTop52: {
    top: '52%',
  },
  roadTop68: {
    top: '68%',
  },
  roadLeft24: {
    left: '24%',
  },
  roadLeft56: {
    left: '56%',
  },
  roadLeft76: {
    left: '76%',
  },
  block: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
  },
  blockOne: {
    top: '36%',
    left: '28%',
    width: 84,
    height: 64,
  },
  blockTwo: {
    top: '58%',
    left: '60%',
    width: 64,
    height: 72,
  },
  blockThree: {
    top: '40%',
    left: '60%',
    width: 98,
    height: 56,
  },
  blockFour: {
    top: '58%',
    left: '14%',
    width: 76,
    height: 68,
  },
  routeDots: {
    position: 'absolute',
    width: 170,
    top: '60%',
    left: '30%',
    borderTopWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,217,160,0.42)',
    transform: [{ rotate: '-24deg' }],
  },
  topFloatWrap: {
    position: 'absolute',
    top: 52,
    left: 14,
    right: 14,
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
  techMarker: {
    position: 'absolute',
    bottom: '35%',
    left: '24%',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.emerald,
    borderWidth: 3,
    borderColor: TECH_COLORS.white,
  },
  homeMarker: {
    position: 'absolute',
    top: '37%',
    left: '58%',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.coral,
    borderWidth: 3,
    borderColor: TECH_COLORS.white,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'rgba(22,27,38,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  etaNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  etaText: {
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  distanceWrap: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 6,
  },
  distanceNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.20)',
    backgroundColor: TECH_COLORS.emeraldTint,
    padding: 14,
    marginBottom: 12,
  },
  customerCardCopy: {
    flex: 1,
    paddingRight: 12,
  },
  customerCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  customerCardText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: TECH_COLORS.textSecondary,
  },
  locationCard: {
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    padding: 14,
    marginBottom: 14,
  },
  locationTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  locationText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: TECH_COLORS.textMuted,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
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
    flex: 1.35,
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
});

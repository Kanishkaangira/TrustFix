import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { jobDetail } from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';

export default function TechnicianEnRouteScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    gradients: TECH_GRADIENTS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.map}>
          <View style={[styles.roadH, styles.roadTop30]} />
          <View style={[styles.roadH, styles.roadTop50]} />
          <View style={[styles.roadH, styles.mainRoadH, styles.roadTop66]} />
          <View style={[styles.roadV, styles.roadLeft25]} />
          <View style={[styles.roadV, styles.mainRoadV, styles.roadLeft55]} />
          <View style={[styles.roadV, styles.roadLeft75]} />

          <View style={[styles.block, styles.blockOne]} />
          <View style={[styles.block, styles.blockTwo]} />
          <View style={[styles.block, styles.blockThree]} />
          <View style={[styles.block, styles.blockFour]} />
          <View style={styles.routeDots} />

          <View style={styles.topFloatWrap}>
            <View style={styles.topFloat}>
              <LinearGradient
                colors={TECH_GRADIENTS.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topFloatIcon}
              >
                <Icon name="snowflake" size={20} color={TECH_COLORS.white} />
              </LinearGradient>

              <View style={styles.topFloatCopy}>
                <Text style={styles.topFloatTitle}>AC Repair - Karol Bagh</Text>
                <Text style={styles.topFloatText}>
                  {jobDetail.customer} · +91 98765 ••••
                </Text>
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
                <Text style={styles.etaNumber}>8 min</Text>
                <Text style={styles.etaText}>Estimated arrival</Text>
              </View>
              <View style={styles.distanceWrap}>
                <Text style={styles.distanceNumber}>2.3 km</Text>
                <Text style={styles.etaText}>Distance remaining</Text>
              </View>
            </View>

            <View style={styles.unlockedCard}>
              <Text style={styles.unlockedLabel}>📞 Customer phone unlocked</Text>
              <Text style={styles.unlockedNumber}>{jobDetail.phoneUnlocked}</Text>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity activeOpacity={0.86} style={styles.callButton} onPress={() => {}}>
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.arrivedButton}
                onPress={() => navigation.navigate('TechnicianSafetyOtp')}
              >
                <Text style={styles.arrivedText}>I&apos;ve Arrived</Text>
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
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  roadTop30: {
    top: '30%',
  },
  roadTop50: {
    top: '50%',
  },
  roadTop66: {
    top: '66%',
  },
  mainRoadV: {
    width: 8,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  roadLeft25: {
    left: '25%',
  },
  roadLeft55: {
    left: '55%',
  },
  roadLeft75: {
    left: '75%',
  },
  block: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
  },
  blockOne: {
    top: '34%',
    left: '28%',
    width: 82,
    height: 62,
  },
  blockTwo: {
    top: '56%',
    left: '60%',
    width: 62,
    height: 70,
  },
  blockThree: {
    top: '38%',
    left: '61%',
    width: 96,
    height: 52,
  },
  blockFour: {
    top: '56%',
    left: '15%',
    width: 74,
    height: 66,
  },
  routeDots: {
    position: 'absolute',
    width: 170,
    top: '58%',
    left: '30%',
    borderTopWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,217,160,0.45)',
    transform: [{ rotate: '-25deg' }],
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
    shadowColor: TECH_COLORS.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  homeMarker: {
    position: 'absolute',
    top: '35%',
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
    fontSize: 36,
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
  unlockedCard: {
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
  unlockedLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  unlockedNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
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
    flex: 1,
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

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { jobDetail } from '../../technician/mockData';
import {
  useTechScreenTheme,
} from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechRow,
  TechScreenHeader,
} from '../../technician/components/TechUi';

export default function TechnicianJobDetailScreen({ navigation }) {
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
        <TechScreenHeader
          title="Job Detail"
          onBackPress={() => navigation.goBack()}
          right={<TechBadge label="Accepted" tone="emerald" />}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={TECH_GRADIENTS.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.serviceBanner}
          >
            <Text style={styles.serviceIcon}>❄️</Text>
            <Text style={styles.serviceTitle}>{jobDetail.service}</Text>
            <Text style={styles.serviceSubtitle}>{jobDetail.issue}</Text>

            <View style={styles.cutCard}>
              <Text style={styles.cutValue}>{jobDetail.visitCut}</Text>
              <Text style={styles.cutLabel}>YOUR CUT</Text>
            </View>
          </LinearGradient>

          <View style={styles.sectionWrap}>
            <Text style={styles.eyebrow}>Customer</Text>
            <TechCard style={styles.sectionCard}>
              <View style={styles.customerTop}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>{jobDetail.initials}</Text>
                </View>

                <View style={styles.customerCopy}>
                  <Text style={styles.customerName}>{jobDetail.customer}</Text>
                  <Text style={styles.customerHint}>Reveal phone on arrival</Text>
                </View>

                <View style={styles.phoneMask}>
                  <Text style={styles.phoneMaskText}>{jobDetail.phoneMasked}</Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Icon name="map-marker-outline" size={16} color={TECH_COLORS.textSecondary} />
                <View style={styles.addressCopy}>
                  <Text style={styles.addressText}>{jobDetail.address}</Text>
                  <Text style={styles.distanceText}>{jobDetail.distance}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.86}
                  style={styles.navigateButton}
                  onPress={() => navigation.navigate('TechnicianEnRoute')}
                >
                  <Text style={styles.navigateText}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </TechCard>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.eyebrow}>Booking Details</Text>
            <TechCard style={styles.infoCard}>
              <TechRow label="Booking type" value={jobDetail.bookingType} />
              <View style={styles.divider} />
              <TechRow label="Time slot" value={jobDetail.timeSlot} />
              <View style={styles.divider} />
              <TechRow label="Problem" value={jobDetail.problem} />
              <View style={styles.divider} />
              <TechRow label="Notes" value={jobDetail.notes} />
            </TechCard>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.eyebrow}>Your Earnings (Guaranteed)</Text>
            <View style={styles.earningPreview}>
              <TechRow label="Visit fee cut (Normal)" value={jobDetail.visitCut} tone="emerald" />
              <View style={styles.earningDivider} />
              <TechRow
                label="Labour (after job, 0% ≤ ₹800)"
                value={jobDetail.labourHint}
              />
            </View>
          </View>

          <TechGradientButton
            label="I'm On My Way"
            variant="emerald"
            onPress={() => navigation.navigate('TechnicianEnRoute')}
          />
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  serviceBanner: {
    borderRadius: TECH_RADIUS.xl,
    padding: 18,
    overflow: 'hidden',
  },
  serviceIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  serviceSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: 'rgba(255,255,255,0.76)',
  },
  cutCard: {
    position: 'absolute',
    right: 16,
    top: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  cutValue: {
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  cutLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.72)',
  },
  sectionWrap: {
    marginTop: 16,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  sectionCard: {
    padding: 16,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: TECH_COLORS.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: TECH_COLORS.coral,
  },
  customerCopy: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  customerHint: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  phoneMask: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
  },
  phoneMaskText: {
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: TECH_COLORS.border,
  },
  addressCopy: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 10,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  distanceText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: TECH_COLORS.sky,
  },
  navigateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: TECH_COLORS.skyTint,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.22)',
  },
  navigateText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.sky,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  earningPreview: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: TECH_RADIUS.lg,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
  },
  earningDivider: {
    height: 1,
    backgroundColor: 'rgba(16,217,160,0.18)',
  },
});

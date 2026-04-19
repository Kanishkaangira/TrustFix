import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { jobAlert } from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import { TechCard } from '../../technician/components/TechUi';

export default function TechnicianJobAlertScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
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
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.timerWrap}>
              <Text style={styles.timerText}>{jobAlert.countdown}</Text>
            </View>

            <Text style={styles.title}>New Job Available!</Text>
            <Text style={styles.subtitle}>
              Auto-declines if not accepted in time
            </Text>

            <TechCard style={styles.jobCard}>
              <View style={styles.jobHead}>
                <View style={styles.jobIconWrap}>
                  <Icon name="pipe-leak" size={28} color={TECH_COLORS.coral} />
                </View>
                <View style={styles.jobHeadCopy}>
                  <Text style={styles.jobTitle}>{jobAlert.title}</Text>
                  <Text style={styles.jobLabel}>{jobAlert.bookingType}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                {[
                  ['Area', jobAlert.area],
                  ['Distance', jobAlert.distance],
                  ['Visit Fee (Your Cut)', jobAlert.visitCut],
                  ['Time Slot', jobAlert.timeSlot],
                ].map(([label, value]) => (
                  <View key={label} style={styles.gridCell}>
                    <Text style={styles.gridLabel}>{label}</Text>
                    <Text
                      style={[
                        styles.gridValue,
                        label.includes('Visit Fee') && styles.gridValueSuccess,
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            </TechCard>

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.declineButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.acceptButton}
                onPress={() => navigation.replace('TechnicianJobDetail')}
              >
                <Text style={styles.acceptText}>Accept Job</Text>
                <Icon name="check" size={18} color={TECH_COLORS.bg} />
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: TECH_COLORS.bgElevated,
    borderTopWidth: 1,
    borderTopColor: TECH_COLORS.border,
  },
  timerWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.coral,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: TECH_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 18,
  },
  jobCard: {
    padding: 18,
  },
  jobHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  jobIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.coralTint,
    borderWidth: 1,
    borderColor: TECH_COLORS.coralBorder,
    marginRight: 12,
  },
  jobHeadCopy: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  jobLabel: {
    marginTop: 2,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '48%',
    borderRadius: 12,
    padding: 10,
    backgroundColor: TECH_COLORS.bg,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: TECH_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  gridValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  gridValueSuccess: {
    color: TECH_COLORS.emerald,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: TECH_RADIUS.lg,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
    color: TECH_COLORS.rose,
  },
  acceptButton: {
    flex: 2,
    minHeight: 48,
    borderRadius: TECH_RADIUS.lg,
    backgroundColor: TECH_COLORS.emerald,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.bg,
  },
});

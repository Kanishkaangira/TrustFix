import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  createEstimateDraft,
  formatTechnicianCurrency,
  getTechnicianJobFlow,
} from '../../../technician/jobFlowData';
import {
  TechCard,
  TechGradientButton,
  TechIconBubble,
  TechRow,
  TechScreenHeader,
} from '../../../technician/components/TechUi';

export default function JobDetailScreen({ navigation, route }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const job = getTechnicianJobFlow(route?.params?.jobId);
  const estimateDraft = createEstimateDraft(job);

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
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TechCard style={styles.heroCard}>
            <View style={styles.heroIdentity}>
              <TechIconBubble
                icon={job.serviceIcon}
                tone={job.serviceTone}
                size={54}
              />
              <View style={styles.heroCopy}>
                <Text style={styles.serviceName}>{job.service}</Text>
                <Text style={styles.issueText}>{job.issue}</Text>
              </View>
            </View>
          </TechCard>

          <View style={styles.sectionWrap}>
            <Text style={styles.eyebrow}>Customer & Route</Text>
            <TechCard style={styles.sectionCard}>
              <View style={styles.customerTop}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>{job.customer.initials}</Text>
                </View>

                <View style={styles.customerCopy}>
                  <Text style={styles.customerName}>{job.customer.name}</Text>
                  <Text style={styles.customerMeta}>{job.customer.phoneUnlocked}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.86}
                  style={styles.callButton}
                  onPress={() => Linking.openURL(`tel:${job.customer.phoneUnlocked.replace(/\s+/g, '')}`)}
                >
                  <Icon name="phone-outline" size={18} color={TECH_COLORS.emerald} />
                </TouchableOpacity>
              </View>

              <View style={styles.addressRow}>
                <Icon
                  name="map-marker-radius-outline"
                  size={16}
                  color={TECH_COLORS.textSecondary}
                />
                <View style={styles.addressCopy}>
                  <Text style={styles.addressText}>{job.location.address}</Text>
                </View>
              </View>
            </TechCard>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.eyebrow}>Charges Visible to Customer</Text>
            <TechCard style={styles.infoCard}>
              <TechRow
                label="Visit charge"
                value={formatTechnicianCurrency(job.fees.visitCharge)}
              />
              <View style={styles.divider} />
              <TechRow
                label="Platform fee"
                value={formatTechnicianCurrency(job.fees.platformFee)}
              />
              <View style={styles.divider} />
              <TechRow
                label="Labour + parts"
                value="Added after inspection"
                muted
              />
            </TechCard>
          </View>

          <View style={styles.footerButtons}>
            <TechGradientButton
              label="I'm On My Way"
              variant="emerald"
              onPress={() => navigation.navigate('TechnicianEnRoute', { jobId: job.id, estimateDraft })}
            />
          </View>
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
  heroCard: {
    padding: 16,
  },
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroCopy: {
    flex: 1,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  issueText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  sectionWrap: {
    marginTop: 16,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  sectionCard: {
    padding: 16,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: TECH_COLORS.coralTint,
    borderWidth: 1,
    borderColor: TECH_COLORS.coralBorder,
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
  customerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
    backgroundColor: TECH_COLORS.emeraldTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: TECH_COLORS.border,
  },
  addressCopy: {
    flex: 1,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    color: TECH_COLORS.text,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  footerButtons: {
    marginTop: 18,
  },
});

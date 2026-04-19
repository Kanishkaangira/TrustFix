import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  buildJobFinancials,
  createEstimateDraft,
  formatTechnicianCurrency,
  getTechnicianJobFlow,
} from '../../../technician/jobFlowData';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  TechCard,
  TechGradientButton,
  TechRow,
  TechScreenHeader,
} from '../../../technician/components/TechUi';

export default function JobCompletionScreen({ navigation, route }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const job = getTechnicianJobFlow(route?.params?.jobId);
  const estimateDraft = route?.params?.estimateDraft || createEstimateDraft(job);
  const completionState = route?.params?.completionState || {};
  const financials = buildJobFinancials({ job, estimateDraft });

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Complete Job"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TechCard style={styles.headlineCard}>
            <Text style={styles.headlineEyebrow}>FINAL ONLINE INVOICE</Text>
            <Text style={styles.headlineTitle}>Customer total</Text>
            <Text style={styles.headlineValue}>
              {formatTechnicianCurrency(financials.customerTotal)}
            </Text>
            <Text style={styles.headlineText}>
              TrustFix sends one final online charge that includes visit charge, platform fee,
              labour, and approved parts.
            </Text>
          </TechCard>

          <Text style={styles.eyebrow}>Customer Invoice</Text>
          <TechCard style={styles.billCard}>
            <TechRow label="Visit charge" value={formatTechnicianCurrency(job.fees.visitCharge)} />
            <View style={styles.divider} />
            <TechRow label="Platform fee" value={formatTechnicianCurrency(job.fees.platformFee)} />
            <View style={styles.divider} />
            <TechRow label="Labour charge" value={formatTechnicianCurrency(financials.labourCharge)} />
            {financials.parts.map((part) => (
              <View key={part.id}>
                <View style={styles.divider} />
                <TechRow
                  label={`${part.name} x${part.qty}`}
                  value={formatTechnicianCurrency(part.qty * part.unitPrice)}
                />
              </View>
            ))}
            <View style={styles.totalDivider} />
            <TechRow label="Customer total" value={formatTechnicianCurrency(financials.customerTotal)} />
          </TechCard>

          <Text style={styles.eyebrow}>Technician Settlement</Text>
          <View style={styles.settlementCard}>
            <Text style={styles.settlementTitle}>{job.planSnapshot.name} plan payout</Text>
            <TechRow
              label="Visit charge to technician"
              value={formatTechnicianCurrency(job.fees.visitCharge)}
              tone="emerald"
            />
            <View style={styles.settlementDivider} />
            <TechRow
              label="Commission base (labour + parts)"
              value={formatTechnicianCurrency(financials.commissionBase)}
            />
            <View style={styles.settlementDivider} />
            <TechRow
              label={`${financials.commissionRate}% platform commission`}
              value={formatTechnicianCurrency(financials.commissionAmount)}
              tone="coral"
            />
            <View style={styles.settlementDivider} />
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Technician payout</Text>
              <Text style={styles.payoutValue}>
                {formatTechnicianCurrency(financials.technicianPayout)}
              </Text>
            </View>
            <View style={styles.platformRow}>
              <Text style={styles.platformLabel}>TrustFix keeps</Text>
              <Text style={styles.platformValue}>
                {formatTechnicianCurrency(financials.platformEarnings)}
              </Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>Completion Snapshot</Text>
          <TechCard style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Diagnosis shared with customer</Text>
            <Text style={styles.snapshotText}>{estimateDraft.diagnosis}</Text>

            <View style={styles.snapshotDivider} />

            <Text style={styles.snapshotLabel}>Checklist completed</Text>
            <Text style={styles.snapshotText}>
              {Array.isArray(completionState.checklist)
                ? `${completionState.checklist.filter((item) => item.complete).length}/${completionState.checklist.length} tasks marked done`
                : 'Final service checklist completed'}
            </Text>

            <View style={styles.snapshotDivider} />

            <Text style={styles.snapshotLabel}>After photos</Text>
            <Text style={styles.snapshotText}>
              {completionState.afterPhotos || 0} uploaded before completion
            </Text>
          </TechCard>

          <TechGradientButton
            label="Submit Completion & Trigger Online Payment"
            variant="emerald"
            icon="check"
            onPress={() => navigation.navigate('TechnicianTabs', { screen: 'TechnicianHome' })}
            style={styles.primaryAction}
          />

          <Text style={styles.footerText}>
            After submission, customer sees the final invoice in-app and the technician payout can be settled from the platform ledger.
          </Text>
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
  headlineCard: {
    padding: 18,
  },
  headlineEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: TECH_COLORS.textMuted,
    marginBottom: 6,
  },
  headlineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  headlineValue: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '900',
    color: TECH_COLORS.coral,
  },
  headlineText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  eyebrow: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  billCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  totalDivider: {
    height: 2,
    backgroundColor: TECH_COLORS.border,
    marginTop: 4,
  },
  settlementCard: {
    padding: 18,
    borderRadius: TECH_RADIUS.xl,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
  },
  settlementTitle: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  settlementDivider: {
    height: 1,
    backgroundColor: 'rgba(16,217,160,0.18)',
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,217,160,0.18)',
  },
  payoutLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  payoutValue: {
    fontSize: 24,
    fontWeight: '900',
    color: TECH_COLORS.emerald,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  platformLabel: {
    fontSize: 12,
    color: TECH_COLORS.textSecondary,
  },
  platformValue: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  snapshotCard: {
    padding: 16,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: TECH_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  snapshotText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: TECH_COLORS.textSecondary,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
    marginVertical: 12,
  },
  primaryAction: {
    marginTop: 18,
  },
  footerText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: TECH_COLORS.textMuted,
  },
});

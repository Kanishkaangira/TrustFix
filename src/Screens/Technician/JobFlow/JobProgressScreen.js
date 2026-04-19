import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  buildJobFinancials,
  createEstimateDraft,
  formatTechnicianCurrency,
  getTechnicianJobFlow,
} from '../../../technician/jobFlowData';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechScreenHeader,
} from '../../../technician/components/TechUi';

const getNumericText = (value) => String(value || '').replace(/[^0-9]/g, '');

const getNextApprovalState = (currentState) => {
  if (currentState === 'draft') {
    return 'sent';
  }

  if (currentState === 'sent') {
    return 'approved';
  }

  return 'approved';
};

export default function JobProgressScreen({ navigation, route }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const job = getTechnicianJobFlow(route?.params?.jobId);
  const initialDraft = useMemo(
    () => route?.params?.estimateDraft || createEstimateDraft(job),
    [job, route?.params?.estimateDraft],
  );
  const [labourCharge, setLabourCharge] = useState(initialDraft.labourCharge);
  const [partsCharge, setPartsCharge] = useState(
    String(
      (initialDraft.parts || []).reduce(
        (sum, part) => sum + (Number(part.qty || 0) * Number(part.unitPrice || 0)),
        0,
      ),
    ),
  );
  const [approvalStatus, setApprovalStatus] = useState(initialDraft.approvalStatus || 'draft');
  const [afterPhotos, setAfterPhotos] = useState(job.workboard.afterPhotos);

  const estimateDraft = useMemo(
    () => ({
      diagnosis: initialDraft.diagnosis || job.issueSummary,
      labourCharge,
      parts: [
        {
          id: 'parts-total',
          name: 'Replacement parts',
          qty: Number(partsCharge ? 1 : 0),
          unitPrice: Number(partsCharge || 0),
        },
      ],
      approvalStatus,
      sentAt: approvalStatus === 'draft' ? null : (initialDraft.sentAt || '2:42 PM'),
      approvedAt: approvalStatus === 'approved' ? (initialDraft.approvedAt || '3:04 PM') : null,
    }),
    [approvalStatus, initialDraft.approvedAt, initialDraft.diagnosis, initialDraft.sentAt, job.issueSummary, labourCharge, partsCharge],
  );
  const financials = buildJobFinancials({ job, estimateDraft });
  const isApproved = approvalStatus === 'approved';

  const handleEstimateAction = () => {
    setApprovalStatus((currentState) => getNextApprovalState(currentState));
  };

  const openCompletion = () => {
    if (!isApproved || afterPhotos === 0) {
      return;
    }

    navigation.navigate('TechnicianJobCompletion', {
      jobId: job.id,
      estimateDraft,
      completionState: {
        afterPhotos,
      },
    });
  };

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Job Progress"
          onBackPress={() => navigation.goBack()}
          right={<TechBadge label={isApproved ? 'Approved' : 'Inspection'} tone={isApproved ? 'emerald' : 'amber'} />}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TechCard style={styles.summaryCard}>
            <Text style={styles.summaryService}>{job.service}</Text>
            <Text style={styles.summaryIssue}>{job.issue}</Text>

            <View style={styles.summaryInfoBlock}>
              <View style={styles.summaryInfoRow}>
                <Icon name="account-outline" size={15} color={TECH_COLORS.sky} />
                <Text style={styles.summaryInfoText}>{job.customer.name}</Text>
              </View>
              <View style={styles.summaryInfoRow}>
                <Icon name="phone-outline" size={15} color={TECH_COLORS.emerald} />
                <Text style={styles.summaryInfoText}>{job.customer.phoneUnlocked}</Text>
              </View>
              <View style={styles.summaryInfoRow}>
                <Icon name="map-marker-outline" size={15} color={TECH_COLORS.coral} />
                <Text style={styles.summaryInfoText}>{job.location.address}</Text>
              </View>
              <View style={styles.summaryInfoRow}>
                <Icon name="clock-outline" size={15} color={TECH_COLORS.gold} />
                <Text style={styles.summaryInfoText}>{job.scheduledSlot}</Text>
              </View>
            </View>
          </TechCard>

          <Text style={styles.eyebrow}>Estimate Builder</Text>
          <TechCard style={styles.formCard}>
            <View style={styles.staticFeeRow}>
              <View style={styles.staticFeeCopy}>
                <Text style={styles.staticFeeLabel}>Visit charge</Text>
                <Text style={styles.staticFeeHint}>Auto-added to customer invoice</Text>
              </View>
              <Text style={styles.staticFeeValue}>
                {formatTechnicianCurrency(job.fees.visitCharge)}
              </Text>
            </View>

            <View style={styles.staticFeeDivider} />

            <View style={styles.staticFeeRow}>
              <View style={styles.staticFeeCopy}>
                <Text style={styles.staticFeeLabel}>Platform fee</Text>
                <Text style={styles.staticFeeHint}>Auto-added by TrustFix</Text>
              </View>
              <Text style={styles.staticFeeValue}>
                {formatTechnicianCurrency(job.fees.platformFee)}
              </Text>
            </View>

            <View style={styles.staticFeeDivider} />

            <View style={styles.inputRow}>
              <View style={styles.inputCopy}>
                <Text style={styles.fieldLabel}>Labour charge</Text>
                <Text style={styles.fieldHint}>This amount is part of commission calculation.</Text>
              </View>
              <View style={styles.moneyInputWrap}>
                <Text style={styles.moneyPrefix}>Rs</Text>
                <TextInput
                  value={labourCharge}
                  onChangeText={(value) => setLabourCharge(getNumericText(value))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={TECH_COLORS.textMuted}
                  style={styles.moneyInput}
                />
              </View>
            </View>

            <View style={styles.partsSection}>
              <Text style={styles.fieldLabel}>Parts / replacements</Text>
              <Text style={styles.fieldHint}>Enter the total approved parts cost.</Text>
              <View style={styles.inputRowCompact}>
                <View style={styles.inputCopy}>
                  <Text style={styles.fieldLabel}>Parts cost</Text>
                </View>
                <View style={styles.moneyInputWrap}>
                  <Text style={styles.moneyPrefix}>Rs</Text>
                  <TextInput
                    value={partsCharge}
                    onChangeText={(value) => setPartsCharge(getNumericText(value))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={TECH_COLORS.textMuted}
                    style={styles.moneyInput}
                  />
                </View>
              </View>
            </View>
          </TechCard>

          <Text style={styles.eyebrow}>Invoice Preview</Text>
          <TechCard style={styles.invoiceCard}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Visit charge</Text>
              <Text style={styles.invoiceValue}>{formatTechnicianCurrency(job.fees.visitCharge)}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Platform fee</Text>
              <Text style={styles.invoiceValue}>{formatTechnicianCurrency(job.fees.platformFee)}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Labour</Text>
              <Text style={styles.invoiceValue}>{formatTechnicianCurrency(financials.labourCharge)}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Parts total</Text>
              <Text style={styles.invoiceValue}>{formatTechnicianCurrency(financials.partsSubtotal)}</Text>
            </View>
            <View style={styles.invoiceDivider} />
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceTotalLabel}>Customer total</Text>
              <Text style={styles.invoiceTotalValue}>
                {formatTechnicianCurrency(financials.customerTotal)}
              </Text>
            </View>
          </TechCard>

          <View style={styles.approvalCard}>
            <View style={styles.approvalTopRow}>
              <View style={styles.approvalCopy}>
                <Text style={styles.approvalTitle}>
                  {approvalStatus === 'draft'
                    ? 'Estimate not sent yet'
                    : approvalStatus === 'sent'
                      ? 'Estimate sent to customer'
                      : 'Customer approved estimate'}
                </Text>
                <Text style={styles.approvalText}>
                  {approvalStatus === 'draft'
                    ? 'Send the estimate once labour and parts are final.'
                    : approvalStatus === 'sent'
                      ? 'Wait for customer approval before completing the job.'
                      : 'Approved estimate is now locked for final completion.'}
                </Text>
              </View>

              <TechBadge
                label={
                  approvalStatus === 'approved'
                    ? 'Approved'
                    : approvalStatus === 'sent'
                      ? 'Pending'
                      : 'Draft'
                }
                tone={
                  approvalStatus === 'approved'
                    ? 'emerald'
                    : approvalStatus === 'sent'
                      ? 'amber'
                      : 'sky'
                }
              />
            </View>

            <View style={styles.approvalButtons}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.secondaryButton}
                onPress={handleEstimateAction}
              >
                <Text style={styles.secondaryButtonText}>
                  {approvalStatus === 'draft'
                    ? 'Send Estimate'
                    : approvalStatus === 'sent'
                      ? 'Mark Approved'
                      : 'Approved'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.secondaryGhostButton}
                onPress={() => setApprovalStatus('draft')}
              >
                <Text style={styles.secondaryGhostText}>Edit Estimate</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.eyebrow}>Photo Evidence</Text>
          <TechCard style={styles.formCard}>
            <View style={styles.photoRow}>
              <View style={styles.photoMetric}>
                <Text style={styles.photoMetricLabel}>Before</Text>
                <Text style={styles.photoMetricValue}>{job.workboard.beforePhotos}</Text>
              </View>
              <View style={styles.photoMetric}>
                <Text style={styles.photoMetricLabel}>Work</Text>
                <Text style={styles.photoMetricValue}>{job.workboard.workPhotos}</Text>
              </View>
              <View style={styles.photoMetric}>
                <Text style={styles.photoMetricLabel}>After</Text>
                <Text style={styles.photoMetricValue}>{afterPhotos}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.addPhotoButton}
              onPress={() => setAfterPhotos((currentValue) => currentValue + 1)}
            >
              <Icon name="camera-plus-outline" size={16} color={TECH_COLORS.emerald} />
              <Text style={styles.addPhotoText}>Add after photo</Text>
            </TouchableOpacity>
          </TechCard>

          <TechGradientButton
            label="Open Complete Job"
            variant="emerald"
            onPress={openCompletion}
            style={[
              styles.primaryAction,
              (!isApproved || afterPhotos === 0) && styles.disabledAction,
            ]}
          />

          <Text style={styles.footerText}>
            Complete job unlocks when the estimate is approved and after photos are added.
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
  summaryCard: {
    padding: 16,
  },
  summaryService: {
    fontSize: 18,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  summaryIssue: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  summaryInfoBlock: {
    marginTop: 14,
    gap: 10,
  },
  summaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryInfoText: {
    flex: 1,
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
  formCard: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  fieldHint: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: TECH_COLORS.textMuted,
  },
  staticFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staticFeeCopy: {
    flex: 1,
    paddingRight: 12,
  },
  staticFeeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  staticFeeHint: {
    marginTop: 3,
    fontSize: 11,
    color: TECH_COLORS.textMuted,
  },
  staticFeeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  staticFeeDivider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
    marginVertical: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputCopy: {
    flex: 1,
    paddingRight: 12,
  },
  moneyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 126,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.input,
    paddingHorizontal: 12,
  },
  moneyPrefix: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.textMuted,
    marginRight: 6,
  },
  moneyInput: {
    flex: 1,
    minHeight: 46,
    color: TECH_COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  partsSection: {
    marginTop: 18,
  },
  invoiceCard: {
    padding: 16,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  invoiceLabel: {
    fontSize: 13,
    color: TECH_COLORS.textSecondary,
  },
  invoiceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TECH_COLORS.text,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
    marginVertical: 8,
  },
  invoiceTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  invoiceTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: TECH_COLORS.coral,
  },
  approvalCard: {
    marginTop: 16,
    borderRadius: TECH_RADIUS.xl,
    backgroundColor: TECH_COLORS.card,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    padding: 16,
  },
  approvalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  approvalCopy: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  approvalText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: TECH_RADIUS.md,
    backgroundColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  secondaryGhostButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryGhostText: {
    fontSize: 12,
    fontWeight: '700',
    color: TECH_COLORS.textSecondary,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoMetric: {
    flex: 1,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: TECH_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  photoMetricValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  addPhotoButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
    backgroundColor: TECH_COLORS.emeraldTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  primaryAction: {
    marginTop: 18,
  },
  disabledAction: {
    opacity: 0.52,
  },
  footerText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: TECH_COLORS.textMuted,
  },
});

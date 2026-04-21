import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
import { fetchTechnicianJobDetail } from '../../../technician/jobAssignmentEngine';
import {
  generateTechnicianCompletionOtp,
  sendTechnicianEstimate,
} from '../../../technician/jobProgressEngine';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechRow,
  TechScreenHeader,
} from '../../../technician/components/TechUi';

const formatCurrency = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const formatSchedule = (booking = {}) => {
  const date = String(booking.scheduled_date || '').trim();
  const slot = String(booking.scheduled_slot_label || '').trim();

  if (date && slot) {
    return `${date} | ${slot}`;
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

const sanitizeMoneyInput = (value) => String(value || '').replace(/[^0-9.]/g, '');

const getEstimateStateMeta = (booking = {}, colors) => {
  const status = String(booking.status || '').trim();

  if (status === 'estimate_revision_requested') {
    return {
      title: 'Customer requested a revised estimate',
      text: booking.estimate_response_note || 'Please update the labour and parts amount, then send it again.',
      tone: colors.coral,
      bg: colors.coralTint,
      border: colors.coralBorder,
    };
  }

  if (status === 'estimate_sent') {
    return {
      title: 'Estimate sent to customer',
      text: 'The customer can approve it or ask for a revised estimate from the app.',
      tone: colors.amber,
      bg: colors.amberTint,
      border: 'rgba(251,191,36,0.22)',
    };
  }

  if (status === 'estimate_approved') {
    return {
      title: '',
      text: '',
      tone: colors.emerald,
      bg: colors.emeraldTint,
      border: 'rgba(16,217,160,0.22)',
    };
  }

  return {
    title: 'Prepare the repair estimate',
    text: 'Enter labour and parts charges, then send them to the customer for approval.',
    tone: colors.sky,
    bg: colors.skyTint,
    border: 'rgba(56,189,248,0.22)',
  };
};

export default function JobProgressScreen({ navigation, route }) {
  const bookingId = route?.params?.jobId;
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [jobRecord, setJobRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [labourCharge, setLabourCharge] = useState('');
  const [partsCharge, setPartsCharge] = useState('');
  const [isSendingEstimate, setIsSendingEstimate] = useState(false);
  const [isPreparingCompletionOtp, setIsPreparingCompletionOtp] = useState(false);
  const [estimateSentModalVisible, setEstimateSentModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      setIsLoading(true);
      setErrorMessage('');

      const result = await fetchTechnicianJobDetail(bookingId);

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setJobRecord(null);
        setErrorMessage(result.error.message || 'Could not load this booking right now.');
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

  const booking = jobRecord?.bookings || {};

  useEffect(() => {
    setLabourCharge(
      String(
        booking.proposed_labour_charge > 0
          ? booking.proposed_labour_charge
          : booking.final_labour_charge > 0
            ? booking.final_labour_charge
            : '',
      ),
    );
    setPartsCharge(
      String(
        booking.proposed_parts_charge > 0
          ? booking.proposed_parts_charge
          : booking.final_parts_charge > 0
            ? booking.final_parts_charge
            : '',
      ),
    );
  }, [
    booking.id,
    booking.proposed_labour_charge,
    booking.proposed_parts_charge,
    booking.final_labour_charge,
    booking.final_parts_charge,
  ]);

  const serviceName = String(booking.service_name_snapshot || 'Service request').trim();
  const customerName = String(booking.customer_name_snapshot || 'Customer').trim();
  const customerPhone = String(booking.customer_phone_snapshot || '').trim();
  const problemLabel = formatProblem(booking);
  const estimateMeta = getEstimateStateMeta(booking, TECH_COLORS);
  const parsedLabour = Number(labourCharge || 0);
  const parsedParts = Number(partsCharge || 0);
  const proposedTotal = Number(booking.visit_charge || 0)
    + Number(booking.platform_fee || 0)
    + Number(booking.protection_fee || 0)
    + Number(booking.urgency_surcharge || 0)
    + parsedLabour
    + parsedParts;
  const approvedTotal = Number(booking.final_invoice_total || 0);
  const bookingStatus = String(booking.status || '').trim();
  const isEstimateApproved = [
    'estimate_approved',
    'in_progress',
    'payment_pending',
    'payment_requested',
    'work_completed',
    'completed',
  ].includes(bookingStatus);
  const isFinalPaymentDone = String(booking.payment_status || '').trim() === 'paid';
  const isCompletionOtpStage = bookingStatus === 'work_completed' && isFinalPaymentDone;
  const showUrgencySurcharge = Number(booking.urgency_surcharge || 0) > 0;
  const estimateButtonLabel = bookingStatus === 'estimate_sent'
    ? 'Update Estimate'
    : 'Send to Customer';

  const handleSendEstimate = async () => {
    if (isSendingEstimate) {
      return;
    }

    if (parsedLabour < 0 || parsedParts < 0) {
      setErrorMessage('Enter valid labour and parts amounts.');
      return;
    }

    setIsSendingEstimate(true);
    setErrorMessage('');

    const result = await sendTechnicianEstimate({
      bookingId,
      labourCharge: parsedLabour,
      partsCharge: parsedParts,
      note: null,
    });

    setIsSendingEstimate(false);

    if (result.error) {
      setErrorMessage(result.error.message || 'Could not send the estimate right now.');
      return;
    }

    setJobRecord((prev) => (
      prev
        ? {
            ...prev,
            bookings: {
              ...prev.bookings,
              ...result.data?.booking,
            },
          }
        : prev
    ));

    setEstimateSentModalVisible(true);
  };

  const estimateVersionLabel = Number(booking.estimate_version_no || 0) > 0
    ? `Estimate v${Number(booking.estimate_version_no || 0)}`
    : 'Estimate draft';

  const finalStatusLabel = approvedTotal > 0
    ? formatCurrency(approvedTotal)
    : 'Awaiting approval';

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
          right={<TechBadge label="Live" tone="emerald" />}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <TechCard style={styles.stateCard}>
              <ActivityIndicator color={TECH_COLORS.coral} />
              <Text style={styles.stateTitle}>Loading job progress</Text>
              <Text style={styles.stateText}>Fetching the latest booking details.</Text>
            </TechCard>
          ) : null}

          {!isLoading && errorMessage ? (
            <TechCard style={styles.stateCard}>
              <Icon name="alert-circle-outline" size={28} color={TECH_COLORS.rose} />
              <Text style={styles.stateTitle}>Could not update estimate</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
            </TechCard>
          ) : null}

          {!isLoading && !errorMessage ? (
            <>
              <TechCard style={styles.summaryCard}>
                <Text style={styles.summaryService}>{serviceName}</Text>
                <Text style={styles.summaryIssue}>{problemLabel}</Text>

                <View style={styles.summaryInfoBlock}>
                  <View style={styles.summaryInfoRow}>
                    <Icon name="account-outline" size={15} color={TECH_COLORS.sky} />
                    <Text style={styles.summaryInfoText}>{customerName}</Text>
                  </View>
                  <View style={styles.summaryInfoRow}>
                    <Icon name="phone-outline" size={15} color={TECH_COLORS.emerald} />
                    <Text style={styles.summaryInfoText}>
                      {customerPhone || 'Customer phone not available'}
                    </Text>
                  </View>
                  <View style={styles.summaryInfoRow}>
                    <Icon name="map-marker-outline" size={15} color={TECH_COLORS.coral} />
                    <Text style={styles.summaryInfoText}>
                      {booking.address_snapshot || 'Address pending'}
                    </Text>
                  </View>
                  <View style={styles.summaryInfoRow}>
                    <Icon name="clock-outline" size={15} color={TECH_COLORS.gold} />
                    <Text style={styles.summaryInfoText}>{formatSchedule(booking)}</Text>
                  </View>
                </View>
              </TechCard>

              {estimateMeta.title ? (
                <View style={[
                  styles.bannerCard,
                  {
                    backgroundColor: estimateMeta.bg,
                    borderColor: estimateMeta.border,
                  },
                ]}>
                  <Icon name="file-document-edit-outline" size={20} color={estimateMeta.tone} />
                  <View style={styles.bannerCopy}>
                    <Text style={[styles.bannerTitle, { color: estimateMeta.tone }]}>{estimateMeta.title}</Text>
                    <Text style={styles.bannerText}>{estimateMeta.text}</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.eyebrow}>{isEstimateApproved ? 'Final Bill' : 'Estimate Builder'}</Text>
              <TechCard style={styles.estimateCard}>
                <View style={styles.versionRow}>
                  <Text style={styles.versionText}>
                    {isEstimateApproved ? 'Final Approved Bill' : estimateVersionLabel}
                  </Text>
                  <Text style={styles.versionValue}>
                    {formatCurrency(isEstimateApproved ? approvedTotal : proposedTotal)}
                  </Text>
                </View>

                {!isEstimateApproved ? (
                  <View style={styles.amountGrid}>
                    <View style={styles.amountCard}>
                      <Text style={styles.amountCardLabel}>Labour cost</Text>
                      <View style={styles.amountInputShell}>
                        <Text style={styles.currencyPrefix}>Rs</Text>
                        <TextInput
                          value={labourCharge}
                          onChangeText={(value) => setLabourCharge(sanitizeMoneyInput(value))}
                          keyboardType="decimal-pad"
                          placeholder="Enter amount"
                          placeholderTextColor={TECH_COLORS.textMuted}
                          style={styles.amountInput}
                        />
                      </View>
                    </View>

                    <View style={styles.amountCard}>
                      <Text style={styles.amountCardLabel}>Parts cost</Text>
                      <View style={styles.amountInputShell}>
                        <Text style={styles.currencyPrefix}>Rs</Text>
                        <TextInput
                          value={partsCharge}
                          onChangeText={(value) => setPartsCharge(sanitizeMoneyInput(value))}
                          keyboardType="decimal-pad"
                          placeholder="Enter amount"
                          placeholderTextColor={TECH_COLORS.textMuted}
                          style={styles.amountInput}
                        />
                      </View>
                    </View>
                  </View>
                ) : null}

                {String(booking.estimate_response_note || '').trim() ? (
                  <View style={styles.customerFeedbackCard}>
                    <Text style={styles.customerFeedbackLabel}>Customer message</Text>
                    <Text style={styles.customerFeedbackText}>{booking.estimate_response_note}</Text>
                  </View>
                ) : null}

                <View style={styles.previewCard}>
                  <TechRow label="Visit charge" value={formatCurrency(booking.visit_charge)} />
                  <View style={styles.divider} />
                  <TechRow label="Platform fee" value={formatCurrency(booking.platform_fee)} />
                  <View style={styles.divider} />
                  <TechRow
                    label="Protection"
                    value={booking.protection_selected ? formatCurrency(booking.protection_fee) : 'Not selected'}
                  />
                  {showUrgencySurcharge ? (
                    <>
                      <View style={styles.divider} />
                      <TechRow
                        label="Urgency surcharge"
                        value={formatCurrency(booking.urgency_surcharge)}
                      />
                    </>
                  ) : null}
                  <View style={styles.divider} />
                  <TechRow
                    label="Labour"
                    value={formatCurrency(isEstimateApproved ? booking.final_labour_charge : parsedLabour)}
                  />
                  <View style={styles.divider} />
                  <TechRow
                    label="Parts"
                    value={formatCurrency(isEstimateApproved ? booking.final_parts_charge : parsedParts)}
                  />
                  <View style={styles.totalDivider} />
                  <TechRow
                    label="Customer total"
                    value={formatCurrency(isEstimateApproved ? approvedTotal : proposedTotal)}
                    tone="emerald"
                  />
                </View>

                {!isEstimateApproved ? (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      styles.sendEstimateButton,
                      isSendingEstimate && styles.sendEstimateButtonDisabled,
                    ]}
                    onPress={handleSendEstimate}
                    disabled={isSendingEstimate}
                  >
                    <Text style={styles.sendEstimateButtonText}>
                      {isSendingEstimate ? 'Sending...' : estimateButtonLabel}
                    </Text>
                    <Icon name="send-outline" size={18} color={TECH_COLORS.white} />
                  </TouchableOpacity>
                ) : null}
              </TechCard>

              <Text style={styles.eyebrow}>Booking Charges</Text>
              <TechCard style={styles.infoCard}>
                <TechRow label="Booking number" value={booking.booking_number || '-'} />
                <View style={styles.divider} />
                <TechRow label="Booking status" value={String(booking.status || 'pending').replace(/_/g, ' ')} />
                <View style={styles.divider} />
                <TechRow label="Approved final total" value={finalStatusLabel} tone={isEstimateApproved || isFinalPaymentDone ? 'emerald' : 'amber'} />
              </TechCard>

              {isCompletionOtpStage ? (
                <TechGradientButton
                  label={isPreparingCompletionOtp ? 'Preparing Finish OTP...' : 'Finish with Safety OTP'}
                  onPress={async () => {
                    if (isPreparingCompletionOtp) {
                      return;
                    }

                    setIsPreparingCompletionOtp(true);
                    setErrorMessage('');

                    const result = await generateTechnicianCompletionOtp(bookingId);

                    setIsPreparingCompletionOtp(false);

                    if (result.error || !result.data?.success) {
                      setErrorMessage(
                        result.error?.message ||
                        result.data?.message ||
                        'Could not prepare the finish OTP right now.',
                      );
                      return;
                    }

                    navigation.push('TechnicianSafetyOtp', {
                      jobId: bookingId,
                      purpose: 'completion_verification',
                      otpExpiresAt: result.data?.expiresAt || null,
                    });
                  }}
                />
              ) : isFinalPaymentDone ? (
                <Text style={styles.waitingText}>
                  Final payment is done. Open the finish OTP step to close this job safely.
                </Text>
              ) : (
                <Text style={styles.waitingText}>
                  Wait for the customer to pay the final bill before closing this job.
                </Text>
              )}
            </>
          ) : null}
        </ScrollView>

        <Modal
          transparent
          visible={estimateSentModalVisible}
          animationType="fade"
          onRequestClose={() => setEstimateSentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setEstimateSentModalVisible(false)}
            />

            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <Icon name="send-check-outline" size={24} color={TECH_COLORS.emerald} />
              </View>
              <Text style={styles.modalTitle}>Estimate sent</Text>
              <Text style={styles.modalText}>
                The customer can now approve this estimate or ask you to revise it.
              </Text>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.modalButton}
                onPress={() => setEstimateSentModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  stateCard: {
    marginTop: 12,
    padding: 20,
    alignItems: 'center',
  },
  stateTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  stateText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: TECH_COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  summaryService: {
    fontSize: 20,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  summaryIssue: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: TECH_COLORS.textSecondary,
  },
  summaryInfoBlock: {
    marginTop: 14,
    gap: 10,
  },
  summaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryInfoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
    color: TECH_COLORS.text,
  },
  bannerCard: {
    marginBottom: 16,
    borderRadius: TECH_RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  estimateCard: {
    marginBottom: 16,
    padding: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  amountCard: {
    flex: 1,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.bgElevated,
    padding: 14,
  },
  amountCardLabel: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.textSecondary,
  },
  amountInputShell: {
    minHeight: 52,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.borderStrong,
    backgroundColor: TECH_COLORS.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.coral,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
    color: TECH_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  customerFeedbackCard: {
    marginBottom: 14,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.coralBorder,
    backgroundColor: TECH_COLORS.coralTint,
    padding: 12,
  },
  customerFeedbackLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: TECH_COLORS.coral,
  },
  customerFeedbackText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.text,
  },
  previewCard: {
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  infoCard: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  totalDivider: {
    height: 2,
    backgroundColor: TECH_COLORS.borderStrong,
  },
  sendEstimateButton: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: TECH_RADIUS.lg,
    backgroundColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendEstimateButtonDisabled: {
    opacity: 0.6,
  },
  sendEstimateButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
  waitingText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: TECH_COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 8, 11, 0.62)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: TECH_COLORS.borderStrong,
    backgroundColor: TECH_COLORS.card,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.22)',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TECH_COLORS.text,
    textAlign: 'center',
  },
  modalText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: TECH_COLORS.textSecondary,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 18,
    minWidth: 132,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: TECH_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.white,
  },
});

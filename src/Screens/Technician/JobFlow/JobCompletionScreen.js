import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import { supabase } from '../../../lib/supabase';
import { fetchTechnicianJobDetail } from '../../../technician/jobAssignmentEngine';
import { useTechScreenTheme } from '../../../technician/theme';
import {
  TechCard,
  TechRow,
  TechScreenHeader,
} from '../../../technician/components/TechUi';

const PAYOUT_COLUMNS = [
  'id',
  'status',
  'gross_amount',
  'visit_fee_amount',
  'labour_amount',
  'parts_amount',
  'commission_percent_snapshot',
  'commission_scope_snapshot',
  'visit_fee_commissionable_snapshot',
  'commissionable_visit_fee_amount',
  'commissionable_labour_amount',
  'commissionable_parts_amount',
  'commission_base_amount',
  'commission_amount',
  'net_amount',
  'requested_at',
  'processed_at',
].join(',');

const COMPLETION_RECORD_COLUMNS = [
  'id',
  'status',
  'final_visit_charge',
  'final_labour_amount',
  'final_parts_amount',
  'final_customer_total',
  'payment_requested_at',
  'payment_completed_at',
].join(',');

const formatCurrency = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const pickFirstRecord = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

const getCommissionCaption = (payoutRecord) => {
  if (!payoutRecord) {
    return '';
  }

  const percent = Number(payoutRecord.commission_percent_snapshot || 0);
  const visitFeeCommissionable = Boolean(payoutRecord.visit_fee_commissionable_snapshot);
  const scope = String(payoutRecord.commission_scope_snapshot || '').trim();

  if (percent <= 0) {
    return 'No commission was deducted on this job.';
  }

  if (visitFeeCommissionable) {
    return `${percent}% commission applied on visit charge, labour, and parts.`;
  }

  if (scope === 'labour_only') {
    return `${percent}% commission applied on labour only.`;
  }

  return `${percent}% commission applied on labour and parts.`;
};

export default function JobCompletionScreen({ navigation, route }) {
  const routeBookingId = String(route?.params?.jobId || '').trim();
  const routeBookingNumber = String(route?.params?.bookingNumber || '').trim();
  const routeBookingSnapshot = route?.params?.bookingSnapshot || null;
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);
  const [receiptData, setReceiptData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const resolveBookingId = useCallback(async () => {
    if (routeBookingId) {
      return { bookingId: routeBookingId, bookingSnapshot: routeBookingSnapshot };
    }

    if (!routeBookingNumber) {
      return { bookingId: '', bookingSnapshot: routeBookingSnapshot };
    }

    const bookingLookup = await supabase.db.select('bookings', {
      columns: '*',
      filters: [{ column: 'booking_number', op: 'eq', value: routeBookingNumber }],
      maybeSingle: true,
    });

    if (bookingLookup.error) {
      return {
        bookingId: '',
        bookingSnapshot: routeBookingSnapshot,
        error: bookingLookup.error,
      };
    }

    return {
      bookingId: String(bookingLookup.data?.id || '').trim(),
      bookingSnapshot: bookingLookup.data || routeBookingSnapshot,
    };
  }, [routeBookingId, routeBookingNumber, routeBookingSnapshot]);

  const loadReceipt = useCallback(async ({ showLoader = false } = {}) => {
    const resolved = await resolveBookingId();
    const bookingId = String(resolved.bookingId || '').trim();

    if (resolved.error) {
      setReceiptData(null);
      setErrorMessage(resolved.error.message || 'Could not find this booking right now.');
      setIsLoading(false);
      return;
    }

    if (!bookingId) {
      setReceiptData(null);
      setErrorMessage('This receipt is no longer available.');
      setIsLoading(false);
      return;
    }

    if (showLoader) {
      setIsLoading(true);
    }

    setErrorMessage('');

    const [jobResult, completionResult, payoutResult] = await Promise.all([
      fetchTechnicianJobDetail(bookingId),
      supabase.db.select('booking_financial_records', {
        columns: COMPLETION_RECORD_COLUMNS,
        filters: [
          { column: 'booking_id', op: 'eq', value: bookingId },
          { column: 'record_type', op: 'eq', value: 'completion' },
        ],
        order: [{ column: 'updated_at', ascending: false }],
      }),
      supabase.db.select('technician_payout_requests', {
        columns: PAYOUT_COLUMNS,
        filters: [{ column: 'booking_id', op: 'eq', value: bookingId }],
        order: [{ column: 'requested_at', ascending: false }],
      }),
    ]);

    if (jobResult.error) {
      setReceiptData(null);
      setErrorMessage(jobResult.error.message || 'Could not load this receipt right now.');

      if (showLoader) {
        setIsLoading(false);
      }

      return;
    }

    if (completionResult.error) {
      setReceiptData(null);
      setErrorMessage(completionResult.error.message || 'Could not load the job charges right now.');

      if (showLoader) {
        setIsLoading(false);
      }

      return;
    }

    if (payoutResult.error) {
      setReceiptData(null);
      setErrorMessage(payoutResult.error.message || 'Could not load the technician payout right now.');

      if (showLoader) {
        setIsLoading(false);
      }

      return;
    }

    setReceiptData({
      booking: jobResult.data?.bookings || resolved.bookingSnapshot || {},
      completionRecord: pickFirstRecord(completionResult.data),
      payoutRecord: pickFirstRecord(payoutResult.data),
    });

    if (showLoader) {
      setIsLoading(false);
    }
  }, [resolveBookingId]);

  useFocusEffect(
    useCallback(() => {
      loadReceipt({ showLoader: !receiptData });
    }, [loadReceipt, receiptData]),
  );

  useEffect(() => {
    if (!routeBookingId && !routeBookingNumber) {
      setIsLoading(false);
      setErrorMessage('This receipt is no longer available.');
      return undefined;
    }

    return undefined;
  }, [routeBookingId, routeBookingNumber]);

  const booking = receiptData?.booking || {};
  const completionRecord = receiptData?.completionRecord || {};
  const payoutRecord = receiptData?.payoutRecord || null;
  const visitCharge = Number(
    payoutRecord?.visit_fee_amount
    ?? completionRecord?.final_visit_charge
    ?? booking?.visit_charge
    ?? 0,
  );
  const labourCharge = Number(
    payoutRecord?.labour_amount
    ?? completionRecord?.final_labour_amount
    ?? booking?.proposed_labour_charge
    ?? 0,
  );
  const partsCharge = Number(
    payoutRecord?.parts_amount
    ?? completionRecord?.final_parts_amount
    ?? booking?.proposed_parts_charge
    ?? 0,
  );
  const commissionAmount = payoutRecord
    ? Number(payoutRecord.commission_amount || 0)
    : null;
  const technicianPayout = payoutRecord
    ? Number(
      payoutRecord.net_amount > 0
        ? payoutRecord.net_amount
        : payoutRecord.gross_amount || 0,
    )
    : null;
  const isPaymentDone = String(booking.payment_status || '').trim() === 'paid';
  const isReceiptReady = Boolean(payoutRecord);
  const commissionCaption = useMemo(
    () => getCommissionCaption(payoutRecord),
    [payoutRecord],
  );

  useEffect(() => {
    if ((!routeBookingId && !routeBookingNumber) || isReceiptReady || errorMessage) {
      return undefined;
    }

    const timer = setInterval(() => {
      loadReceipt({ showLoader: false });
    }, 4000);

    return () => clearInterval(timer);
  }, [errorMessage, isReceiptReady, loadReceipt, routeBookingId, routeBookingNumber]);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Receipt"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <TechCard style={styles.stateCard}>
              <ActivityIndicator color={TECH_COLORS.coral} />
              <Text style={styles.stateTitle}>Loading receipt</Text>
              <Text style={styles.stateText}>Fetching the latest technician payout details.</Text>
            </TechCard>
          ) : null}

          {!isLoading && errorMessage ? (
            <TechCard style={styles.stateCard}>
              <Icon name="alert-circle-outline" size={28} color={TECH_COLORS.rose} />
              <Text style={styles.stateTitle}>Could not load receipt</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
            </TechCard>
          ) : null}

          {!isLoading && !errorMessage ? (
            <>
              {!isReceiptReady ? (
                <TechCard style={styles.pendingCard}>
                  <Icon
                    name={isPaymentDone ? 'cash-clock' : 'clock-alert-outline'}
                    size={22}
                    color={TECH_COLORS.amber}
                  />
                  <View style={styles.pendingCopy}>
                    <Text style={styles.pendingTitle}>
                      {isPaymentDone ? 'Payout is being prepared' : 'Waiting for final payment'}
                    </Text>
                    <Text style={styles.pendingText}>
                      {isPaymentDone
                        ? 'The job is paid, but the payout receipt is still being created. Refresh this screen in a moment.'
                        : 'The receipt will show commission and payout after the customer finishes the final payment.'}
                    </Text>
                  </View>
                </TechCard>
              ) : null}

              <Text style={styles.eyebrow}>Job Charges</Text>
              <TechCard style={styles.chargeCard}>
                <TechRow label="Visit Charge" value={formatCurrency(visitCharge)} />
                <View style={styles.divider} />
                <TechRow label="Labour Charged" value={formatCurrency(labourCharge)} />
                <View style={styles.divider} />
                <TechRow label="Parts Charged" value={formatCurrency(partsCharge)} />
              </TechCard>

              <Text style={styles.eyebrow}>Technician Settlement</Text>
              <View style={styles.settlementCard}>
                <TechRow
                  label="Commission Deducted"
                  value={commissionAmount === null ? 'Pending' : formatCurrency(commissionAmount)}
                  tone={commissionAmount === null ? undefined : 'coral'}
                />
                {commissionCaption ? (
                  <Text style={styles.commissionHint}>{commissionCaption}</Text>
                ) : null}
                <View style={styles.settlementDivider} />
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Technician Payout</Text>
                  <Text style={styles.payoutValue}>
                    {technicianPayout === null ? 'Pending' : formatCurrency(technicianPayout)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
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
  stateCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  stateTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: TECH_COLORS.textSecondary,
  },
  pendingCard: {
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.24)',
    backgroundColor: TECH_COLORS.amberTint,
  },
  pendingCopy: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TECH_COLORS.text,
  },
  pendingText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  eyebrow: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  chargeCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  settlementCard: {
    padding: 18,
    borderRadius: TECH_RADIUS.xl,
    backgroundColor: TECH_COLORS.emeraldTint,
    borderWidth: 1,
    borderColor: 'rgba(16,217,160,0.24)',
  },
  commissionHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: TECH_COLORS.textSecondary,
  },
  settlementDivider: {
    height: 1,
    marginTop: 12,
    backgroundColor: 'rgba(16,217,160,0.18)',
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
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
});

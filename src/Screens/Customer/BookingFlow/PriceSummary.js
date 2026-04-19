import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FONT, RADIUS, SHADOW, SPACING, getThemeColors } from '../../../theme';
import { getSeverityPricing } from '../../../lib/pricing/bookingPricing';
import { useAppTheme } from '../../../theme/ThemeProvider';
import {
  getBookingSeverityPricing,
  subscribeToServiceCatalog,
} from '../../../state/serviceStore';

const BRAND_ORANGE = '#FF6B2B';
const BRAND_SOFT = '#FFF0E8';
const REPAIR_PROTECTION_PRICE = 19;

const formatCurrency = (value) => `\u20B9${value}`;

const getScheduleValue = ({ severity, date, slot }) => {
  if (severity === 'minor' && date && slot) {
    return `${date.dayName}, ${date.date} ${date.month} - ${slot.label}`;
  }

  if (severity === 'moderate') {
    return 'Within 24 hours';
  }

  if (severity === 'urgent') {
    return 'Dispatch in 15 to 20 minutes';
  }

  return 'Will be confirmed';
};

const createSeverityMeta = (colors) => ({
  minor: {
    label: 'Minor',
    tone: colors.success,
    bg: colors.successLight,
    border: colors.isDark ? '#2C5A3D' : '#CFE8DA',
    icon: 'calendar-clock-outline',
    scheduleLabel: 'Scheduled visit',
  },
  moderate: {
    label: 'Moderate',
    tone: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    icon: 'account-clock-outline',
    scheduleLabel: 'Dispatch window',
  },
  urgent: {
    label: 'Urgent',
    tone: colors.danger,
    bg: colors.dangerLight,
    border: colors.isDark ? '#6F383E' : '#F2CBC5',
    icon: 'flash-alert-outline',
    scheduleLabel: 'Dispatch window',
  },
});

const buildVisibleFeeRows = ({ visitCharge, platformFee, severity, colors }) => ([
  {
    key: 'visit',
    icon: severity === 'urgent' ? 'flash-outline' : 'home-account',
    label: 'Visit charge',
    value: visitCharge,
    sublabel:
      severity === 'urgent'
        ? 'Includes urgent dispatch priority'
        : severity === 'moderate'
          ? 'Includes same-day dispatch priority'
          : 'Applies to technician visit and inspection',
    tone: BRAND_ORANGE,
    bg: BRAND_SOFT,
  },
  {
    key: 'platform',
    icon: 'receipt-text-outline',
    label: 'Platform fee',
    value: platformFee,
    sublabel: 'Supports booking ops, support, and platform handling',
    tone: colors.inkSecondary,
    bg: colors.surfaceMuted,
  },
]);

export default function PriceSummary({
  service,
  problem,
  customProblem,
  severity,
  date,
  slot,
  address,
  navigation,
  onConfirm,
  isSubmitting = false,
}) {
  const { isDark } = useAppTheme();
  const colors = getThemeColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const severityMetaMap = useMemo(() => createSeverityMeta(colors), [colors]);
  const { bottom } = useSafeAreaInsets();
  const [repairProtection, setRepairProtection] = useState(true);
  const [bookingPricingMatrix, setBookingPricingMatrix] = useState(() => getBookingSeverityPricing());
  const scrollBottomPadding = bottom + 108;

  React.useEffect(() => subscribeToServiceCatalog((nextCatalog) => {
    setBookingPricingMatrix(nextCatalog.bookingSeverityPricing || getBookingSeverityPricing());
  }), []);

  const pricing = useMemo(() => ({
    ...getSeverityPricing({
      severity,
      pricingMatrix: bookingPricingMatrix,
    }),
  }), [bookingPricingMatrix, severity]);
  const visitCharge = pricing.visitCharge;
  const severityMeta = severityMetaMap[severity] || severityMetaMap.minor;
  const displayProblem = customProblem || problem?.label || 'General service';
  const serviceAccent = service?.accentColor || BRAND_ORANGE;
  const serviceSoft = service?.lightColor || BRAND_SOFT;
  const scheduleValue = getScheduleValue({ severity, date, slot });
  const visibleFeeRows = useMemo(
    () => buildVisibleFeeRows({ visitCharge, platformFee: pricing.platformFee, severity, colors }),
    [visitCharge, pricing.platformFee, severity, colors]
  );

  const visibleSubtotal =
    visitCharge +
    pricing.platformFee +
    (repairProtection ? REPAIR_PROTECTION_PRICE : 0);

  const handleChangeAddress = () => {
    navigation?.navigate('Profile', {
      openScreen: 'addresses',
      returnToBooking: true,
      returnStep: 5,
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: scrollBottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={[styles.summaryIconWrap, { backgroundColor: serviceSoft }]}>
            <Icon
              name={service?.icon || 'tools'}
              size={28}
              color={serviceAccent}
            />
          </View>

          <View style={styles.summaryCopy}>
            <Text style={styles.summaryService}>{service?.label || 'Home service'}</Text>
            <Text style={styles.summaryProblem}>{displayProblem}</Text>
          </View>

          <View
            style={[
              styles.summarySeverityBadge,
              {
                backgroundColor: severityMeta.bg,
                borderColor: severityMeta.border,
              },
            ]}
          >
            <Text style={[styles.summarySeverityText, { color: severityMeta.tone }]}>
              {severityMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <View style={[styles.metaIconWrap, { backgroundColor: severityMeta.bg }]}>
            <Icon name={severityMeta.icon} size={18} color={severityMeta.tone} />
          </View>
          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>{severityMeta.scheduleLabel}</Text>
            <Text style={styles.metaValue}>{scheduleValue}</Text>
          </View>
        </View>

        {address ? (
          <View style={styles.addressCard}>
            <View style={styles.addressLeft}>
              <View style={[styles.metaIconWrap, { backgroundColor: BRAND_SOFT }]}>
                <Icon name="map-marker-outline" size={18} color={BRAND_ORANGE} />
              </View>
              <View style={styles.metaCopy}>
                <Text style={styles.metaLabel}>{address.label || 'Service address'}</Text>
                <Text style={styles.metaValue}>{address.address || 'Address will be confirmed'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={handleChangeAddress}
              activeOpacity={0.85}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <View style={styles.priceHeaderCopy}>
            <Text style={styles.priceEyebrow}>PRE-INSPECTION FEES</Text>
            <Text style={styles.priceHeaderText}>
              Visit charge and platform fee are visible now. Labour and parts are added only after technician inspection.
            </Text>
          </View>
        </View>

        <View style={styles.priceList}>
          {visibleFeeRows.map((item) => (
            <View key={item.key} style={styles.priceRow}>
              <View style={styles.priceRowLeft}>
                <View style={[styles.priceRowIconWrap, { backgroundColor: item.bg }]}>
                  <Icon name={item.icon} size={18} color={item.tone} />
                </View>

                <View style={styles.priceRowCopy}>
                  <Text style={styles.priceRowLabel}>{item.label}</Text>
                  {item.sublabel ? (
                    <Text style={styles.priceRowSubLabel}>{item.sublabel}</Text>
                  ) : null}
                </View>
              </View>

              <Text
                style={[
                  styles.priceRowValue,
                  item.highlightValue && { color: colors.success },
                ]}
              >
                {formatCurrency(item.value)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.protectionCard}>
          <View style={styles.protectionLeft}>
            <View style={styles.protectionIconWrap}>
              <Icon name="shield-check-outline" size={18} color={BRAND_ORANGE} />
            </View>

            <View style={styles.protectionCopy}>
              <Text style={styles.protectionTitle}>Repair protection</Text>
              <Text style={styles.protectionText}>7-day post-service cover.</Text>
            </View>
          </View>

          <View style={styles.protectionRight}>
            <Text style={styles.protectionPrice}>
              +{formatCurrency(REPAIR_PROTECTION_PRICE)}
            </Text>
            <Switch
              value={repairProtection}
              onValueChange={setRepairProtection}
              trackColor={{ false: colors.border, true: BRAND_ORANGE }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Visible before inspection</Text>
          </View>
          <Text style={styles.totalValue}>{formatCurrency(visibleSubtotal)}</Text>
        </View>
      </View>

      <View style={styles.noteCard}>
        <View style={[styles.noteIconWrap, { backgroundColor: '#EFF6FF' }]}>
          <Icon name="clipboard-text-outline" size={18} color="#2563EB" />
        </View>
        <View style={styles.noteCopy}>
          <Text style={styles.noteTitle}>Calculated after inspection</Text>
          <Text style={styles.noteText}>
            Labour charge and replacement parts are finalized only after the technician inspects the issue and shares the final estimate for approval.
          </Text>
        </View>
      </View>

      <View style={styles.noteCard}>
        <View style={[styles.noteIconWrap, { backgroundColor: BRAND_SOFT }]}>
          <Icon name="shield-account-outline" size={18} color={BRAND_ORANGE} />
        </View>
        <View style={styles.noteCopy}>
          <Text style={styles.noteTitle}>Safety protocols included</Text>
          <Text style={styles.noteText}>OTP and live verification included.</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={() => onConfirm?.({ protectionSelected: repairProtection })}
        activeOpacity={0.92}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            <Icon name="arrow-right" size={18} color="#FFFFFF" style={styles.confirmBtnIcon} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: 14,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
    ...SHADOW.card,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  summaryService: {
    fontSize: 16,
    fontWeight: FONT.black,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  summaryProblem: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  summarySeverityBadge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  summarySeverityText: {
    fontSize: 10,
    fontWeight: FONT.bold,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginTop: 8,
  },
  metaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  metaCopy: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: colors.inkMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: FONT.medium,
    color: colors.ink,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginTop: 8,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 10,
  },
  changeBtn: {
    alignSelf: 'center',
    backgroundColor: BRAND_SOFT,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.16)',
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: FONT.bold,
    color: BRAND_ORANGE,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
    ...SHADOW.card,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceHeaderCopy: {
    flex: 1,
    paddingRight: 14,
  },
  priceEyebrow: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: colors.inkMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  priceHeaderText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSecondary,
  },
  priceList: {
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  priceRowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  priceRowCopy: {
    flex: 1,
  },
  priceRowLabel: {
    fontSize: 14,
    fontWeight: FONT.semibold,
    color: colors.ink,
  },
  priceRowSubLabel: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMuted,
  },
  priceRowValue: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },
  protectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  protectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  protectionCopy: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: colors.ink,
  },
  protectionText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSecondary,
  },
  protectionRight: {
    alignItems: 'flex-end',
  },
  protectionPrice: {
    fontSize: 12,
    fontWeight: FONT.bold,
    color: BRAND_ORANGE,
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: FONT.bold,
    color: colors.ink,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: BRAND_ORANGE,
    letterSpacing: -0.8,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    ...SHADOW.card,
  },
  noteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteCopy: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSecondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_ORANGE,
    borderRadius: 18,
    paddingVertical: 17,
    marginTop: 2,
    shadowColor: BRAND_ORANGE,
    ...SHADOW.cta,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: FONT.bold,
    letterSpacing: 0.2,
  },
  confirmBtnIcon: {
    marginLeft: 8,
  },
  bottomSpace: {
    height: 8,
  },
});

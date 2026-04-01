// src/Screens/BookingFlow/PriceSummary.js
// Step 5 - review booking, estimate, and continue to payment

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  PRICING,
  PARTS_CATALOG,
  REPAIR_PROTECTION_PRICE,
} from '../../data/serviceProblems';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../theme';

const BRAND_ORANGE = '#FF6B2B';
const BRAND_SOFT = '#FFF0E8';

const SEVERITY_META = {
  minor: {
    label: 'Minor',
    tone: COLORS.success,
    bg: COLORS.successLight,
    border: '#CFE8DA',
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
    tone: COLORS.danger,
    bg: COLORS.dangerLight,
    border: '#F2CBC5',
    icon: 'flash-alert-outline',
    scheduleLabel: 'Dispatch window',
  },
};

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

const buildPriceRows = ({ pricing, part, urgencySurcharge, severity }) => {
  const rows = [
    {
      key: 'visit',
      icon: 'home-account',
      label: 'Visit charge',
      value: pricing.visitCharge,
      tone: BRAND_ORANGE,
      bg: BRAND_SOFT,
    },
    {
      key: 'labour',
      icon: 'hammer-wrench',
      label: 'Labour cost',
      value: pricing.labourCost,
      tone: '#2563EB',
      bg: '#EFF6FF',
    },
  ];

  if (part) {
    rows.push({
      key: 'part',
      icon: 'package-variant-closed',
      label: part.name,
      value: part.price,
      sublabel: `MRP ${formatCurrency(part.mrp)} - Save ${formatCurrency(part.mrp - part.price)}`,
      tone: COLORS.success,
      bg: COLORS.successLight,
      highlightValue: true,
    });
  }

  if (urgencySurcharge > 0) {
    rows.push({
      key: 'urgency',
      icon: severity === 'urgent' ? 'flash-outline' : 'clock-fast',
      label: severity === 'urgent' ? 'Emergency surcharge' : 'Priority surcharge',
      value: urgencySurcharge,
      tone: severity === 'urgent' ? COLORS.danger : COLORS.warning,
      bg: severity === 'urgent' ? COLORS.dangerLight : COLORS.warningLight,
    });
  }

  rows.push({
    key: 'platform',
    icon: 'receipt-text-outline',
    label: 'Platform fee',
    value: pricing.platformFee,
    tone: COLORS.inkSecondary,
    bg: '#F4F6F8',
  });

  return rows;
};

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
}) {
  const { bottom } = useSafeAreaInsets();
  const [repairProtection, setRepairProtection] = useState(true);
  const scrollBottomPadding = bottom + 108;

  const pricing = PRICING[service?.id] || {
    visitCharge: 149,
    labourCost: 300,
    platformFee: 49,
  };
  const part = problem?.id ? PARTS_CATALOG[problem.id] : null;
  const urgencySurcharge = severity === 'urgent' ? 150 : severity === 'moderate' ? 50 : 0;
  const severityMeta = SEVERITY_META[severity] || SEVERITY_META.minor;
  const displayProblem = customProblem || problem?.label || 'General service';
  const serviceAccent = service?.accentColor || BRAND_ORANGE;
  const serviceSoft = service?.lightColor || BRAND_SOFT;
  const scheduleValue = getScheduleValue({ severity, date, slot });
  const priceRows = buildPriceRows({ pricing, part, urgencySurcharge, severity });

  const subtotal =
    pricing.visitCharge +
    pricing.labourCost +
    (part ? part.price : 0) +
    urgencySurcharge +
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
            <Text style={styles.priceEyebrow}>ESTIMATE</Text>
          </View>
        </View>

        <View style={styles.priceList}>
          {priceRows.map((item) => (
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
                  item.highlightValue && { color: COLORS.success },
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
              trackColor={{ false: '#D7DBE2', true: BRAND_ORANGE }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Amount due</Text>
          </View>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>

      {part ? (
        <View style={styles.noteCard}>
          <View style={[styles.noteIconWrap, { backgroundColor: COLORS.successLight }]}>
            <Icon name="package-variant-closed" size={18} color={COLORS.success} />
          </View>
          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>Verified part pricing</Text>
            <Text style={styles.noteText}>Catalog price shown above.</Text>
          </View>
        </View>
      ) : null}

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
        onPress={onConfirm}
        activeOpacity={0.92}
      >
        <Text style={styles.confirmBtnText}>Continue to payment</Text>
        <Icon name="arrow-right" size={18} color="#FFFFFF" style={styles.confirmBtnIcon} />
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: 14,
  },

  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF1',
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
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  summaryProblem: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.inkSecondary,
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
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF1F4',
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
    color: COLORS.inkMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: FONT.medium,
    color: COLORS.ink,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF1F4',
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
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8ECF1',
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
    color: COLORS.inkMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
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
    color: COLORS.ink,
  },
  priceRowSubLabel: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.inkMuted,
  },
  priceRowValue: {
    fontSize: 14,
    fontWeight: FONT.bold,
    color: COLORS.ink,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
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
    color: COLORS.ink,
  },
  protectionText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkSecondary,
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
    borderTopColor: COLORS.borderLight,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: FONT.bold,
    color: COLORS.ink,
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
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF1',
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
    color: COLORS.ink,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkSecondary,
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

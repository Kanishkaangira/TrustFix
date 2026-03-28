// src/Screens/BookingFlow/PriceSummary.js
// Step 5 — Price breakdown, repair protection toggle, confirm & pay

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';

import {
  PRICING,
  PARTS_CATALOG,
  REPAIR_PROTECTION_PRICE,
} from '../../data/serviceProblems';

// Severity label map
const SEVERITY_LABELS = {
  minor:    { label: 'Minor',    color: '#4CAF50', bg: '#F1F8E9' },
  moderate: { label: 'Moderate', color: '#FF9800', bg: '#FFF8E1' },
  urgent:   { label: 'Urgent',   color: '#F44336', bg: '#FFEBEE' },
};

export default function PriceSummary({
  service,
  problem,
  customProblem,
  severity,
  date,
  slot,
  onConfirm,
}) {
  const [repairProtection, setRepairProtection] = useState(true);

  // Pull base pricing for this service
  const pricing = PRICING[service?.id] || { visitCharge: 149, labourCost: 300, platformFee: 49 };

  // Pull part if this problem has one
  const partKey = problem?.id;
  const part    = partKey ? PARTS_CATALOG[partKey] : null;

  // Surge multiplier for urgent bookings
  const urgencySurcharge = severity === 'urgent' ? 150 : severity === 'moderate' ? 50 : 0;

  // Total calculation
  const subtotal =
    pricing.visitCharge +
    pricing.labourCost +
    (part ? part.price : 0) +
    urgencySurcharge +
    pricing.platformFee +
    (repairProtection ? REPAIR_PROTECTION_PRICE : 0);

  const severityMeta = SEVERITY_LABELS[severity] || SEVERITY_LABELS.minor;
  const displayProblem = customProblem || problem?.label || 'General Service';

  // Scheduling info based on severity
  const getScheduleInfo = () => {
    if (severity === 'minor' && date && slot) {
      return `${date.dayName}, ${date.date} ${date.month}  ·  ${slot.label}`;
    }
    if (severity === 'moderate') return 'Auto-assigned — within 24 hours';
    if (severity === 'urgent')   return '🚨 Emergency dispatch — 15–20 min';
    return '';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Transparent pricing header */}
      <View style={styles.transparencyBanner}>
        <Text style={styles.transparencyText}>
          ● 100% TRANSPARENT — ZERO HIDDEN FEES
        </Text>
      </View>

      {/* Booking summary pill */}
      <View style={styles.bookingSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>{service?.icon}</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.summaryService}>{service?.label}</Text>
            <Text style={styles.summaryProblem}>{displayProblem}</Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityMeta.bg }]}>
            <Text style={[styles.severityText, { color: severityMeta.color }]}>
              {severityMeta.label}
            </Text>
          </View>
        </View>

        {/* Schedule info */}
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleIcon}>
            {severity === 'urgent' ? '🚨' : '📅'}
          </Text>
          <Text style={styles.scheduleText}>{getScheduleInfo()}</Text>
        </View>
      </View>

      {/* ── Price breakdown card ── */}
      <View style={styles.priceCard}>
        <Text style={styles.priceCardTitle}>Price Breakdown</Text>

        {/* Visit charge */}
        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <Text style={styles.priceRowIcon}>🚗</Text>
            <Text style={styles.priceRowLabel}>Visit Charge</Text>
          </View>
          <Text style={styles.priceRowValue}>₹{pricing.visitCharge}</Text>
        </View>

        {/* Labour */}
        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <Text style={styles.priceRowIcon}>👨‍🔧</Text>
            <Text style={styles.priceRowLabel}>Labour Cost</Text>
          </View>
          <Text style={styles.priceRowValue}>₹{pricing.labourCost}</Text>
        </View>

        {/* Parts — only if applicable */}
        {part && (
          <View style={styles.priceRow}>
            <View style={styles.priceRowLeft}>
              <Text style={styles.priceRowIcon}>⚙️</Text>
              <View>
                <Text style={styles.priceRowLabel}>{part.name}</Text>
                <Text style={styles.mrpText}>MRP ₹{part.mrp}</Text>
              </View>
            </View>
            <Text style={[styles.priceRowValue, styles.priceRowDiscount]}>₹{part.price}</Text>
          </View>
        )}

        {/* Urgency surcharge */}
        {urgencySurcharge > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.priceRowLeft}>
              <Text style={styles.priceRowIcon}>
                {severity === 'urgent' ? '🚨' : '⏰'}
              </Text>
              <Text style={styles.priceRowLabel}>
                {severity === 'urgent' ? 'Emergency Surcharge' : 'Priority Surcharge'}
              </Text>
            </View>
            <Text style={styles.priceRowValue}>₹{urgencySurcharge}</Text>
          </View>
        )}

        {/* Platform fee */}
        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <Text style={styles.priceRowIcon}>📱</Text>
            <Text style={styles.priceRowLabel}>Platform Fee</Text>
          </View>
          <Text style={styles.priceRowValue}>₹{pricing.platformFee}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Repair Protection toggle */}
        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <Text style={styles.priceRowIcon}>🛡️</Text>
            <View>
              <Text style={styles.priceRowLabel}>Add Repair Protection</Text>
              <Text style={styles.priceRowSub}>7-day coverage — only ₹{REPAIR_PROTECTION_PRICE}</Text>
            </View>
          </View>
          <Switch
            value={repairProtection}
            onValueChange={setRepairProtection}
            trackColor={{ false: '#E0E0E0', true: '#FF5722' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalValue}>₹{subtotal}</Text>
        </View>
      </View>

      {/* Parts marketplace note */}
      {part && (
        <View style={styles.partsNote}>
          <Text style={styles.partsNoteIcon}>🛒</Text>
          <Text style={styles.partsNoteText}>
            Parts at marketplace price — always below MRP. Technician picks from verified catalog.
          </Text>
        </View>
      )}

      {/* Safety protocol note */}
      <View style={styles.safetyNote}>
        <Text style={styles.safetyTitle}>🔐  Safety Protocol Included</Text>
        <Text style={styles.safetyText}>
          OTP-to-Start  ·  Live selfie verification  ·  Share technician location with family
        </Text>
      </View>

      {/* Confirm & Pay CTA */}
      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={onConfirm}
        activeOpacity={0.9}
      >
        <Text style={styles.confirmBtnText}>Confirm & Pay  ₹{subtotal}  →</Text>
      </TouchableOpacity>

      {/* Payment note */}
      <Text style={styles.paymentNote}>
        💳  Pay after service is complete · 100% refund if cancelled before dispatch
      </Text>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const ORANGE = '#FF5722';
const TEXT   = '#1A1A1A';

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom:     20,
  },

  // Transparency banner
  transparencyBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius:    10,
    paddingVertical: 8,
    alignItems:      'center',
    marginTop:       16,
    marginBottom:    12,
  },
  transparencyText: {
    fontSize:      11,
    fontWeight:    '800',
    color:         '#2E7D32',
    letterSpacing: 0.8,
  },

  // Booking summary
  bookingSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    padding:         14,
    marginBottom:    12,
    borderWidth:     1.5,
    borderColor:     '#EEEEEE',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius:   4,
    elevation:      2,
  },
  summaryRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:    8,
  },
  summaryIcon: {
    fontSize: 28,
  },
  summaryService: {
    fontSize:   16,
    fontWeight: '700',
    color:      TEXT,
  },
  summaryProblem: {
    fontSize:  13,
    color:     '#757575',
    marginTop:  2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      20,
  },
  severityText: {
    fontSize:   12,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop:     8,
  },
  scheduleIcon: {
    fontSize:    16,
    marginRight: 8,
  },
  scheduleText: {
    fontSize:   13,
    color:      '#616161',
    fontWeight: '500',
    flex:       1,
  },

  // Price card
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    padding:         16,
    marginBottom:    12,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.06,
    shadowRadius:   8,
    elevation:      3,
  },
  priceCardTitle: {
    fontSize:      13,
    fontWeight:    '800',
    color:         '#9E9E9E',
    letterSpacing: 0.8,
    marginBottom:  14,
  },
  priceRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   14,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  priceRowIcon: {
    fontSize:    18,
    marginRight: 10,
    width:       26,
    textAlign:  'center',
  },
  priceRowLabel: {
    fontSize:   14,
    color:      TEXT,
    fontWeight: '500',
  },
  priceRowSub: {
    fontSize:  11,
    color:     '#9E9E9E',
    marginTop:  2,
  },
  priceRowValue: {
    fontSize:   14,
    fontWeight: '700',
    color:      TEXT,
  },
  priceRowDiscount: {
    color: '#4CAF50',
  },
  mrpText: {
    fontSize:          11,
    color:             '#BDBDBD',
    textDecorationLine:'line-through',
    marginTop:          2,
  },
  divider: {
    height:          1,
    backgroundColor: '#F5F5F5',
    marginBottom:    14,
  },
  totalRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:       4,
    borderTopWidth:  2,
    borderTopColor:  '#F5F5F5',
    paddingTop:      14,
  },
  totalLabel: {
    fontSize:   16,
    fontWeight: '700',
    color:      TEXT,
  },
  totalValue: {
    fontSize:   24,
    fontWeight: '900',
    color:      ORANGE,
    letterSpacing: -0.5,
  },

  // Parts note
  partsNote: {
    backgroundColor: '#F3E5F5',
    borderRadius:    12,
    padding:         12,
    flexDirection:   'row',
    alignItems:      'flex-start',
    marginBottom:    12,
  },
  partsNoteIcon: {
    fontSize:    16,
    marginRight: 8,
    marginTop:    1,
  },
  partsNoteText: {
    flex:       1,
    fontSize:   12,
    color:      '#6A1B9A',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Safety note
  safetyNote: {
    backgroundColor: '#E8F5E9',
    borderRadius:    12,
    padding:         12,
    marginBottom:    16,
  },
  safetyTitle: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#1B5E20',
    marginBottom: 4,
  },
  safetyText: {
    fontSize:  12,
    color:     '#2E7D32',
    lineHeight: 18,
  },

  // Confirm CTA
  confirmBtn: {
    backgroundColor: ORANGE,
    borderRadius:    14,
    paddingVertical: 18,
    alignItems:      'center',
    shadowColor:     ORANGE,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    12,
    elevation:       8,
    marginBottom:    10,
  },
  confirmBtnText: {
    color:         '#FFFFFF',
    fontSize:      17,
    fontWeight:    '800',
    letterSpacing: 0.3,
  },

  // Payment note
  paymentNote: {
    fontSize:  12,
    color:     '#9E9E9E',
    textAlign: 'center',
    lineHeight: 18,
  },
});
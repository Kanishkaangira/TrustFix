// src/Screens/BookingFlow/SelectSeverity.js
// Step 3 — Minor / Moderate / Urgent urgency selection

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const SEVERITY_OPTIONS = [
  {
    id:          'minor',
    label:       'Minor — Can Wait',
    sublabel:    'Book next 2–3 days',
    description: 'Issue is non-critical. Choose your preferred date and time slot. Technician assigned in advance.',
    icon:        '🟢',
    dotColor:    '#4CAF50',
    bgColor:     '#F1F8E9',
    borderColor: '#C5E1A5',
    accentColor: '#2E7D32',
    badge:       'Best Value',
    badgeColor:  '#4CAF50',
  },
  {
    id:          'moderate',
    label:       'Moderate — Fix Soon',
    sublabel:    'Within 24 hours',
    description: 'Issue needs attention soon. We assign the nearest available technician automatically.',
    icon:        '🟡',
    dotColor:    '#FF9800',
    bgColor:     '#FFF8E1',
    borderColor: '#FFE082',
    accentColor: '#E65100',
    badge:       'Most Chosen',
    badgeColor:  '#FF9800',
  },
  {
    id:          'urgent',
    label:       'Urgent — Risk Now',
    sublabel:    'Technician in 15–20 min',
    description: 'Emergency dispatch. Nearest technician sent immediately. Higher priority surcharge applies.',
    icon:        '🔴',
    dotColor:    '#F44336',
    bgColor:     '#FFEBEE',
    borderColor: '#EF9A9A',
    accentColor: '#C62828',
    badge:       'Emergency',
    badgeColor:  '#F44336',
  },
];

export default function SelectSeverity({ service, problem, onNext }) {
  const [selected, setSelected] = useState(null);

  const canProceed = selected !== null;

  const handleSelect = (option) => {
    setSelected(option.id);
  };

  const handleNext = () => {
    if (!canProceed) return;
    onNext(selected);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Heading */}
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>How urgent is this?</Text>
        <Text style={styles.headingSubtitle}>
          Your choice affects scheduling, pricing, and response time
        </Text>

        {/* Context pill — what they selected */}
        {(service || problem) && (
          <View style={styles.contextPill}>
            <Text style={styles.contextText}>
              {service?.icon}  {service?.label}
              {problem ? `  ·  ${problem}` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Severity cards */}
      {SEVERITY_OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.card,
              { borderColor: isSelected ? option.dotColor : '#EEEEEE' },
              isSelected && { backgroundColor: option.bgColor },
            ]}
            onPress={() => handleSelect(option)}
            activeOpacity={0.85}
          >
            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: option.badgeColor }]}>
              <Text style={styles.badgeText}>{option.badge}</Text>
            </View>

            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={[styles.dot, { backgroundColor: option.dotColor }]} />
              <View style={styles.cardTopText}>
                <Text style={[styles.cardLabel, isSelected && { color: option.accentColor }]}>
                  {option.label}
                </Text>
                <Text style={styles.cardSublabel}>{option.sublabel}</Text>
              </View>

              {/* Radio circle */}
              <View style={[
                styles.radio,
                { borderColor: isSelected ? option.dotColor : '#BDBDBD' },
              ]}>
                {isSelected && (
                  <View style={[styles.radioFill, { backgroundColor: option.dotColor }]} />
                )}
              </View>
            </View>

            {/* Description */}
            <Text style={styles.cardDescription}>{option.description}</Text>

            {/* SLA strip when selected */}
            {isSelected && (
              <View style={[styles.slaStrip, { borderColor: option.borderColor }]}>
                <Text style={[styles.slaText, { color: option.accentColor }]}>
                  {option.id === 'minor'    && '📅  You will pick your date & time in the next step'}
                  {option.id === 'moderate' && '⚙️  We auto-assign the nearest technician for you'}
                  {option.id === 'urgent'   && '🚨  Emergency dispatch — technician en route shortly'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Info note */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️  Our AI also suggests urgency based on your problem — you can override it anytime.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
        onPress={handleNext}
        activeOpacity={0.9}
        disabled={!canProceed}
      >
        <Text style={styles.nextBtnText}>
          {selected === 'minor'
            ? 'Next — Pick a Slot  →'
            : selected === 'moderate'
            ? 'Next — See Pricing  →'
            : selected === 'urgent'
            ? 'Next — Confirm Dispatch  →'
            : 'Select urgency to continue'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const ORANGE = '#FF5722';

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom:     20,
  },

  // Heading
  heading: {
    paddingTop:    20,
    paddingBottom: 16,
  },
  headingTitle: {
    fontSize:      22,
    fontWeight:    '800',
    color:         '#1A1A1A',
    letterSpacing: -0.5,
  },
  headingSubtitle: {
    fontSize:  14,
    color:     '#757575',
    marginTop:  4,
  },
  contextPill: {
    marginTop:         10,
    alignSelf:         'flex-start',
    backgroundColor:   '#F3E5F5',
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:    5,
  },
  contextText: {
    fontSize:   12,
    color:      '#7B1FA2',
    fontWeight: '600',
  },

  // Severity card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    borderWidth:     2,
    borderColor:     '#EEEEEE',
    padding:         16,
    marginBottom:    12,
    position:        'relative',
    // Shadow
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.06,
    shadowRadius:   6,
    elevation:      2,
  },
  badge: {
    position:          'absolute',
    top:               -1,
    right:             16,
    paddingHorizontal: 10,
    paddingVertical:    3,
    borderBottomLeftRadius:  8,
    borderBottomRightRadius: 8,
  },
  badgeText: {
    color:      '#FFFFFF',
    fontSize:   10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  8,
  },
  dot: {
    width:        12,
    height:       12,
    borderRadius:  6,
    marginRight:  10,
  },
  cardTopText: {
    flex: 1,
  },
  cardLabel: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#1A1A1A',
  },
  cardSublabel: {
    fontSize:  13,
    color:     '#757575',
    marginTop:  2,
    fontWeight: '500',
  },
  radio: {
    width:        22,
    height:       22,
    borderRadius: 11,
    borderWidth:  2,
    alignItems:   'center',
    justifyContent:'center',
  },
  radioFill: {
    width:        11,
    height:       11,
    borderRadius: 5.5,
  },
  cardDescription: {
    fontSize:   13,
    color:      '#616161',
    lineHeight: 19,
  },
  slaStrip: {
    marginTop:    10,
    borderTopWidth: 1,
    paddingTop:   10,
  },
  slaText: {
    fontSize:   13,
    fontWeight: '600',
  },

  // Info box
  infoBox: {
    backgroundColor:   '#E3F2FD',
    borderRadius:      10,
    padding:           12,
    marginBottom:      16,
  },
  infoText: {
    fontSize:   12,
    color:      '#1565C0',
    fontWeight: '500',
    lineHeight: 18,
  },

  // CTA
  nextBtn: {
    backgroundColor: ORANGE,
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
    shadowColor:     ORANGE,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    10,
    elevation:       6,
  },
  nextBtnDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity:   0,
    elevation:       0,
  },
  nextBtnText: {
    color:         '#FFFFFF',
    fontSize:      16,
    fontWeight:    '700',
    letterSpacing: 0.3,
  },
});
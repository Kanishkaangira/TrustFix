// src/Screens/BookingFlow/SelectProblem.js
// Step 2 — problem chips from serviceProblems.js + custom text input

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SERVICE_PROBLEMS } from '../../data/serviceProblems';

export default function SelectProblem({ service, onNext }) {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [customText,      setCustomText]      = useState('');

  // Pull problems for the current service
  const problems = SERVICE_PROBLEMS[service?.id] || [];

  // The final problem used downstream — custom text overrides chip selection
  const finalProblem  = selectedProblem;
  const finalCustom   = customText.trim();
  const canProceed    = selectedProblem !== null || finalCustom.length > 0;

  const handleChipPress = (problem) => {
    // Toggle — tap same chip to deselect
    setSelectedProblem(prev => prev?.id === problem.id ? null : problem);
    // Clear custom text when a chip is selected
    setCustomText('');
  };

  const handleCustomChange = (text) => {
    setCustomText(text);
    // Deselect chip when user starts typing
    if (text.length > 0) setSelectedProblem(null);
  };

  const handleNext = () => {
    if (!canProceed) return;
    onNext(finalProblem, finalCustom);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.serviceTag}>{service?.icon}  {service?.label}</Text>
          <Text style={styles.headingTitle}>What's the problem?</Text>
          <Text style={styles.headingSubtitle}>Select from common issues or describe it yourself</Text>
        </View>

        {/* Problem chips grid */}
        <View style={styles.chipsGrid}>
          {problems.map((item) => {
            const isSelected = selectedProblem?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => handleChipPress(item)}
                activeOpacity={0.8}
              >
                {/* Tag badge (Most Common / Urgent etc.) */}
                {item.tag && (
                  <View style={[styles.tagBadge, isSelected && styles.tagBadgeSelected]}>
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                      {item.tag}
                    </Text>
                  </View>
                )}

                <Text style={styles.chipIcon}>{item.icon}</Text>
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                  {item.label}
                </Text>

                {isSelected && (
                  <View style={styles.selectedTick}>
                    <Text style={styles.tickText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or describe it yourself</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Custom input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              customText.length > 0 && styles.inputActive,
            ]}
            placeholder="e.g. AC makes a rattling noise when starting..."
            placeholderTextColor="#BDBDBD"
            value={customText}
            onChangeText={handleCustomChange}
            multiline
            maxLength={200}
            returnKeyType="done"
          />
          <Text style={styles.charCount}>{customText.length}/200</Text>
        </View>

        {/* AI hint */}
        {customText.length > 10 && (
          <View style={styles.aiHint}>
            <Text style={styles.aiHintText}>
              🤖  Our AI will analyse your description to suggest the best fix
            </Text>
          </View>
        )}

        {/* Next CTA */}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.9}
          disabled={!canProceed}
        >
          <Text style={styles.nextBtnText}>Next — Set Urgency  →</Text>
        </TouchableOpacity>

        {/* Bottom spacer for keyboard */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ORANGE   = '#FF5722';
const ORANGE_L = '#FFF3E0';
const TEXT     = '#1A1A1A';

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
  serviceTag: {
    fontSize:        13,
    fontWeight:      '600',
    color:           ORANGE,
    backgroundColor: ORANGE_L,
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:    20,
    alignSelf:       'flex-start',
    overflow:        'hidden',
    marginBottom:    10,
  },
  headingTitle: {
    fontSize:      22,
    fontWeight:    '800',
    color:         TEXT,
    letterSpacing: -0.5,
  },
  headingSubtitle: {
    fontSize:  14,
    color:     '#757575',
    marginTop:  4,
  },

  // Chips grid — 2 columns
  chipsGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  chip: {
    width:           '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius:    14,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1.5,
    borderColor:     '#EEEEEE',
    position:        'relative',
    minHeight:       90,
    // Shadow
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius:   4,
    elevation:      2,
  },
  chipSelected: {
    borderColor:     ORANGE,
    backgroundColor: ORANGE_L,
    shadowOpacity:   0.12,
    elevation:       4,
  },
  tagBadge: {
    position:          'absolute',
    top:               8,
    right:             8,
    backgroundColor:   '#F5F5F5',
    borderRadius:      6,
    paddingHorizontal:  6,
    paddingVertical:    2,
  },
  tagBadgeSelected: {
    backgroundColor: 'rgba(255,87,34,0.15)',
  },
  tagText: {
    fontSize:   9,
    fontWeight: '700',
    color:      '#9E9E9E',
    letterSpacing: 0.3,
  },
  tagTextSelected: {
    color: ORANGE,
  },
  chipIcon: {
    fontSize:     28,
    marginBottom:  6,
    marginTop:     4,
  },
  chipLabel: {
    fontSize:   14,
    fontWeight: '600',
    color:      TEXT,
  },
  chipLabelSelected: {
    color: ORANGE,
  },
  selectedTick: {
    marginTop: 4,
  },
  tickText: {
    fontSize:   11,
    color:      ORANGE,
    fontWeight: '600',
  },

  // Divider
  dividerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    fontSize:          12,
    color:             '#9E9E9E',
    marginHorizontal:  10,
    fontWeight:        '500',
  },

  // Custom input
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     '#EEEEEE',
    padding:         14,
    marginBottom:    8,
  },
  input: {
    fontSize:   15,
    color:      TEXT,
    lineHeight: 22,
    minHeight:  70,
    textAlignVertical: 'top',
  },
  inputActive: {
    // subtle highlight when typing
  },
  charCount: {
    fontSize:  11,
    color:     '#BDBDBD',
    textAlign: 'right',
    marginTop:  6,
  },

  // AI hint
  aiHint: {
    backgroundColor: '#E8F5E9',
    borderRadius:    10,
    padding:         10,
    marginBottom:    14,
  },
  aiHintText: {
    fontSize:   12,
    color:      '#2E7D32',
    fontWeight: '500',
  },

  // CTA
  nextBtn: {
    backgroundColor: ORANGE,
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       8,
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
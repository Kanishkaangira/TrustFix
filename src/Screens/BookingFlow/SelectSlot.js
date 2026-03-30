// src/Screens/BookingFlow/SelectSlot.js
// Step 4 — Date picker + time slot grid (only shown for Minor severity)

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

// Generate next 7 days from today
const generateDates = () => {
  const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];
  const today  = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      id:       i,
      dayName:  i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
      date:     d.getDate(),
      month:    months[d.getMonth()],
      fullDate: d.toDateString(),
      // Sundays partially available
      isBusy:  d.getDay() === 0,
    });
  }
  return result;
};

const TIME_SLOTS = [
  { id: 'slot1', label: '9–11 AM',  available: true  },
  { id: 'slot2', label: '11–1 PM',  available: true  },
  { id: 'slot3', label: '2–4 PM',   available: true  },
  { id: 'slot4', label: '4–6 PM',   available: false },  // Full
  { id: 'slot5', label: '6–8 PM',   available: true  },
];

export default function SelectSlot({ onNext, navigation, selectedAddress }) {
  const dates = useMemo(() => generateDates(), []);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const canProceed = selectedDate !== null && selectedSlot !== null;

  const handleNext = () => {
    if (!canProceed) return;
    onNext(selectedDate, selectedSlot);
  };

  const handleChangeAddress = () => {
    navigation?.navigate('Profile', {
      openScreen: 'addresses',
      returnToBooking: true,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Heading */}
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Pick a Slot</Text>
        <Text style={styles.headingSubtitle}>Choose the most convenient date and time</Text>
      </View>

      {/* ── Date picker ── */}
      <Text style={styles.sectionLabel}>SELECT DATE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dates.map((item) => {
          const isSelected = selectedDate?.id === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dateCard,
                isSelected  && styles.dateCardSelected,
                item.isBusy && styles.dateCardBusy,
              ]}
              onPress={() => !item.isBusy && setSelectedDate(item)}
              activeOpacity={item.isBusy ? 1 : 0.8}
            >
              <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                {item.dayName}
              </Text>
              <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>
                {item.date}
              </Text>
              <Text style={[styles.dateMonth, isSelected && styles.dateTextSelectedSoft]}>
                {item.month}
              </Text>
              {item.isBusy && <Text style={styles.busyLabel}>Busy</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Time slots ── */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SELECT TIME</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => {
          const isSelected  = selectedSlot?.id === slot.id;
          const isAvailable = slot.available;
          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotChip,
                isSelected   && styles.slotChipSelected,
                !isAvailable && styles.slotChipFull,
              ]}
              onPress={() => isAvailable && setSelectedSlot(slot)}
              activeOpacity={isAvailable ? 0.8 : 1}
            >
              <Text
                style={[
                  styles.slotText,
                  isSelected   && styles.slotTextSelected,
                  !isAvailable && styles.slotTextFull,
                ]}
              >
                {isAvailable ? slot.label : 'Full'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected summary */}
      {canProceed && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Your slot</Text>
          <Text style={styles.summaryValue}>
            📅  {selectedDate?.dayName}, {selectedDate?.date} {selectedDate?.month}
            {'   '}
            🕐  {selectedSlot?.label}
          </Text>
        </View>
      )}

      {/* Address row */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ADDRESS</Text>
      <View style={styles.addressCard}>
        <View style={styles.addressLeft}>
          <Text style={styles.addressIcon}>📍</Text>
          <View style={styles.addressTextWrap}>
            <Text style={styles.addressName}>{selectedAddress?.label || 'Home'}</Text>
            <Text style={styles.addressDetail} numberOfLines={2}>
              {selectedAddress?.address || '42, Green Park, New Delhi'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleChangeAddress} activeOpacity={0.8}>
          <Text style={styles.changeBtn}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
        onPress={handleNext}
        activeOpacity={0.9}
        disabled={!canProceed}
      >
        <Text style={styles.nextBtnText}>Confirm Booking  →</Text>
      </TouchableOpacity>

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

  // Heading
  heading: {
    paddingTop:    20,
    paddingBottom: 16,
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

  sectionLabel: {
    fontSize:      11,
    fontWeight:    '700',
    color:         '#9E9E9E',
    letterSpacing: 1.2,
    marginBottom:  10,
  },

  // Date picker
  dateRow: {
    paddingRight: 8,
    paddingBottom: 4,
  },
  dateCard: {
    width:         68,
    height:        84,
    borderRadius:  14,
    backgroundColor:'#FFFFFF',
    alignItems:    'center',
    justifyContent:'center',
    marginRight:   10,
    borderWidth:   1.5,
    borderColor:   '#EEEEEE',
    // shadow
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  4,
    elevation:     2,
  },
  dateCardSelected: {
    backgroundColor: ORANGE,
    borderColor:     ORANGE,
    shadowColor:     ORANGE,
    shadowOpacity:   0.3,
    elevation:       5,
  },
  dateCardBusy: {
    backgroundColor: '#F5F5F5',
    borderColor:     '#EEEEEE',
    opacity:         0.6,
  },
  dateDayName: {
    fontSize:   11,
    fontWeight: '600',
    color:      '#9E9E9E',
    marginBottom: 2,
  },
  dateNum: {
    fontSize:   22,
    fontWeight: '800',
    color:      TEXT,
  },
  dateMonth: {
    fontSize:  11,
    color:     '#9E9E9E',
    marginTop:  2,
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  dateTextSelectedSoft: {
    color: 'rgba(255,255,255,0.7)',
  },
  busyLabel: {
    position:   'absolute',
    bottom:     4,
    fontSize:   9,
    color:      '#BDBDBD',
    fontWeight: '600',
  },

  // Time slots
  slotsGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'space-between',
  },
  slotChip: {
    width:           '31%',
    paddingVertical: 14,
    borderRadius:    12,
    backgroundColor: '#FFFFFF',
    alignItems:      'center',
    marginBottom:    10,
    borderWidth:     1.5,
    borderColor:     '#EEEEEE',
  },
  slotChipSelected: {
    backgroundColor: ORANGE,
    borderColor:     ORANGE,
    shadowColor:     ORANGE,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.3,
    shadowRadius:    6,
    elevation:       4,
  },
  slotChipFull: {
    backgroundColor: '#F5F5F5',
    borderColor:     '#EEEEEE',
  },
  slotText: {
    fontSize:   13,
    fontWeight: '600',
    color:      TEXT,
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  slotTextFull: {
    color: '#BDBDBD',
  },

  // Summary box
  summaryBox: {
    backgroundColor: '#FFF3E0',
    borderRadius:    12,
    padding:         14,
    marginTop:       6,
    borderWidth:     1,
    borderColor:     '#FFCC80',
  },
  summaryLabel: {
    fontSize:   11,
    fontWeight: '700',
    color:      '#E65100',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize:   14,
    fontWeight: '600',
    color:      '#1A1A1A',
  },

  // Address
  addressCard: {
    backgroundColor:  '#FFFFFF',
    borderRadius:     14,
    padding:          14,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    borderWidth:      1.5,
    borderColor:      '#EEEEEE',
    marginBottom:     20,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
    minWidth:      0,
  },
  addressTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  addressIcon: {
    fontSize:    22,
    marginRight: 10,
  },
  addressName: {
    fontSize:   15,
    fontWeight: '700',
    color:      TEXT,
  },
  addressDetail: {
    fontSize:  13,
    color:     '#757575',
    marginTop:  2,
    flexShrink: 1,
  },
  changeBtn: {
    fontSize:   14,
    fontWeight: '700',
    color:      ORANGE,
    marginLeft: 12,
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

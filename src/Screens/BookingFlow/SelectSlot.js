// src/Screens/BookingFlow/SelectSlot.js
// Step 4 - schedule date and time for minor bookings

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../theme';

const generateDates = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];
  const today = new Date();

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    result.push({
      id: i,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
      fullDate: d.toDateString(),
      isBusy: d.getDay() === 0,
    });
  }

  return result;
};

const TIME_SLOTS = [
  {
    id: 'slot1',
    icon: 'weather-sunset-up',
    period: 'Morning',
    label: '9:00 - 11:00 AM',
    available: true,
  },
  {
    id: 'slot2',
    icon: 'white-balance-sunny',
    period: 'Midday',
    label: '11:00 AM - 1:00 PM',
    available: true,
  },
  {
    id: 'slot3',
    icon: 'weather-partly-cloudy',
    period: 'Afternoon',
    label: '2:00 - 4:00 PM',
    available: true,
  },
  {
    id: 'slot4',
    icon: 'weather-sunset-down',
    period: 'Late',
    label: '4:00 - 6:00 PM',
    available: false,
  },
  {
    id: 'slot5',
    icon: 'weather-night',
    period: 'Evening',
    label: '6:00 - 8:00 PM',
    available: true,
  },
];

export default function SelectSlot({ onNext, navigation, selectedAddress }) {
  const dates = useMemo(() => generateDates(), []);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const canProceed = selectedDate !== null && selectedSlot !== null;

  const handleNext = () => {
    if (!canProceed) {
      return;
    }

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
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.heroChip}>
            <Icon name="calendar-clock-outline" size={16} color={COLORS.primary} />
            <Text style={styles.heroChipText}>SCHEDULE VISIT</Text>
          </View>

          <Text style={styles.heroTitle}>Pick your date and time</Text>
          <Text style={styles.heroSubtitle}>
            Choose the visit window that works best for you. We will reserve the
            technician once you continue to the next step.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>7</Text>
              <Text style={styles.heroStatLabel}>days open</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>5</Text>
              <Text style={styles.heroStatLabel}>time windows</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>Easy</Text>
              <Text style={styles.heroStatLabel}>reschedule</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionLabel}>SELECT DATE</Text>
          <Text style={styles.sectionTitle}>Choose a day</Text>
        </View>
        <Text style={styles.sectionMeta}>
          {selectedDate
            ? `${selectedDate.dayName}, ${selectedDate.date} ${selectedDate.month}`
            : 'Next 7 days'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dates.map((item) => {
          const isSelected = selectedDate?.id === item.id;
          const isDisabled = item.isBusy;
          const statusText = isDisabled ? 'Busy' : isSelected ? 'Picked' : 'Open';

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
                isDisabled && styles.dateCardDisabled,
              ]}
              onPress={() => !isDisabled && setSelectedDate(item)}
              activeOpacity={isDisabled ? 1 : 0.88}
            >
              <Text
                style={[
                  styles.dateDayText,
                  isSelected && styles.dateDayTextSelected,
                  isDisabled && styles.dateDayTextDisabled,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {item.dayName}
              </Text>

              <Text
                style={[
                  styles.dateNumber,
                  isSelected && styles.dateNumberSelected,
                  isDisabled && styles.dateNumberDisabled,
                ]}
              >
                {item.date}
              </Text>

              <View style={styles.dateMeta}>
                <Text
                  style={[
                    styles.dateMonth,
                    isSelected && styles.dateMonthSelected,
                    isDisabled && styles.dateMonthDisabled,
                  ]}
                >
                  {item.month}
                </Text>

                <Text
                  style={[
                    styles.dateStatusText,
                    isSelected && styles.dateStatusTextSelected,
                    isDisabled && styles.dateStatusTextDisabled,
                  ]}
                >
                  {statusText}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.sectionHeader, styles.timeSectionHeader]}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionLabel}>SELECT TIME</Text>
          <Text style={styles.sectionTitle}>Choose a time window</Text>
        </View>
        <Text style={styles.sectionMeta}>
          {selectedSlot ? selectedSlot.period : 'Available today'}
        </Text>
      </View>

      <View style={styles.slotList}>
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const isAvailable = slot.available;

          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotCard,
                isSelected && styles.slotCardSelected,
                !isAvailable && styles.slotCardDisabled,
              ]}
              onPress={() => isAvailable && setSelectedSlot(slot)}
              activeOpacity={isAvailable ? 0.9 : 1}
            >
              <View style={styles.slotCardInner}>
                <View
                  style={[
                    styles.slotIconWrap,
                    isSelected && styles.slotIconWrapSelected,
                    !isAvailable && styles.slotIconWrapDisabled,
                  ]}
                >
                  <Icon
                    name={slot.icon}
                    size={20}
                    color={
                      !isAvailable
                        ? '#A1A1AA'
                        : isSelected
                        ? COLORS.primary
                        : COLORS.inkSecondary
                    }
                  />
                </View>

                <View
                  style={[
                    styles.slotCopy,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotPeriod,
                      isSelected && styles.slotPeriodSelected,
                      !isAvailable && styles.slotPeriodDisabled,
                    ]}
                  >
                    {slot.period}
                  </Text>

                  <Text
                    style={[
                      styles.slotLabel,
                      isSelected && styles.slotLabelSelected,
                      !isAvailable && styles.slotLabelDisabled,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </View>

              <View
                style={[
                  styles.slotStatus,
                  isSelected && styles.slotStatusSelected,
                  !isAvailable && styles.slotStatusDisabled,
                ]}
              >
                {isSelected ? (
                  <Icon name="check" size={12} color="#FFFFFF" />
                ) : !isAvailable ? (
                  <Icon name="close" size={12} color="#A1A1AA" />
                ) : (
                  <View style={styles.slotStatusDot} />
                )}
              </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {canProceed && (
        <View style={styles.selectionCard}>
          <View style={styles.selectionIconWrap}>
            <Icon name="calendar-check-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.selectionCopy}>
            <Text style={styles.selectionLabel}>Selected visit slot</Text>
            <Text style={styles.selectionValue}>
              {selectedDate?.dayName}, {selectedDate?.date} {selectedDate?.month}  .  {selectedSlot?.label}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.addressSection}>
        <Text style={styles.sectionLabel}>SERVICE ADDRESS</Text>
        <View style={styles.addressCard}>
          <View style={styles.addressInfo}>
            <View style={styles.addressIconWrap}>
              <Icon name="map-marker-outline" size={20} color={COLORS.primary} />
            </View>

            <View style={styles.addressCopy}>
              <Text style={styles.addressName}>{selectedAddress?.label || 'Home'}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {selectedAddress?.address || '42, Green Park, New Delhi'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.changeAddressBtn}
            onPress={handleChangeAddress}
            activeOpacity={0.85}
          >
            <Text style={styles.changeAddressText}>Change</Text>
            <Icon name="chevron-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
        onPress={handleNext}
        activeOpacity={0.9}
        disabled={!canProceed}
      >
        <Text style={styles.nextBtnText}>Continue to review</Text>
        <Icon name="arrow-right" size={18} color="#FFFFFF" style={styles.nextBtnIcon} />
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: 14,
    paddingBottom: 28,
  },

  heroWrap: {
    borderRadius: 28,
    marginBottom: 20,
    ...SHADOW.elevated,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    overflow: 'hidden',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -58,
    right: -48,
    backgroundColor: 'rgba(217,79,43,0.10)',
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    bottom: -26,
    right: 42,
    backgroundColor: 'rgba(217,79,43,0.07)',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 14,
  },
  heroChipText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: FONT.bold,
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.ink,
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkSecondary,
    maxWidth: '92%',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDF0F4',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: FONT.black,
    color: COLORS.ink,
    marginBottom: 3,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: FONT.medium,
    color: COLORS.inkMuted,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E3E7ED',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeSectionHeader: {
    marginTop: 18,
  },
  sectionCopy: {
    flex: 1,
    paddingRight: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: COLORS.inkMuted,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: FONT.black,
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: FONT.semibold,
    color: COLORS.primary,
  },

  dateRow: {
    paddingRight: 6,
    paddingBottom: 4,
  },
  dateCard: {
    width: 82,
    minHeight: 112,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOW.card,
  },
  dateCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.24,
    elevation: 5,
  },
  dateCardDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.72,
  },
  dateDayText: {
    fontSize: 10,
    fontWeight: FONT.bold,
    color: COLORS.inkSecondary,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 12,
    width: '100%',
  },
  dateDayTextSelected: {
    color: '#FFFFFF',
  },
  dateDayTextDisabled: {
    color: '#9CA3AF',
  },
  dateNumber: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.ink,
    letterSpacing: -0.6,
    lineHeight: 32,
    includeFontPadding: false,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateNumberDisabled: {
    color: '#A1A1AA',
  },
  dateMeta: {
    width: '100%',
    alignItems: 'center',
    minHeight: 28,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: FONT.medium,
    color: COLORS.inkMuted,
    lineHeight: 13,
    includeFontPadding: false,
  },
  dateMonthSelected: {
    color: 'rgba(255,255,255,0.88)',
  },
  dateMonthDisabled: {
    color: '#A1A1AA',
  },
  dateStatusText: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: FONT.bold,
    color: COLORS.success,
    letterSpacing: 0.3,
    lineHeight: 11,
    includeFontPadding: false,
  },
  dateStatusTextSelected: {
    color: '#FFFFFF',
  },
  dateStatusTextDisabled: {
    color: '#A1A1AA',
  },

  slotList: {
    marginBottom: 2,
  },
  slotCard: {
    width: '100%',
    minHeight: 82,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    ...SHADOW.card,
  },
  slotCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
  },
  slotCardDisabled: {
    backgroundColor: '#F4F5F7',
    borderColor: '#E4E7EC',
  },
  slotCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#F4F6F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slotIconWrapSelected: {
    backgroundColor: '#FFFFFF',
  },
  slotIconWrapDisabled: {
    backgroundColor: '#E8EAEE',
  },
  slotCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  slotPeriod: {
    fontSize: 10,
    fontWeight: FONT.bold,
    color: COLORS.inkSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  slotPeriodSelected: {
    color: COLORS.primary,
  },
  slotPeriodDisabled: {
    color: '#A1A1AA',
  },
  slotStatus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D4D9E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  slotStatusSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  slotStatusDisabled: {
    borderColor: '#D4D4D8',
    backgroundColor: '#EFEFF1',
  },
  slotStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },
  slotLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: FONT.bold,
    color: COLORS.ink,
  },
  slotLabelSelected: {
    color: COLORS.primary,
  },
  slotLabelDisabled: {
    color: '#A1A1AA',
  },

  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F2D4CB',
    padding: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  selectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectionCopy: {
    flex: 1,
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: FONT.bold,
    color: COLORS.primary,
    marginBottom: 3,
  },
  selectionValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FONT.semibold,
    color: COLORS.ink,
  },

  addressSection: {
    marginBottom: 20,
  },
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    padding: 14,
    ...SHADOW.card,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressCopy: {
    flex: 1,
    minWidth: 0,
  },
  addressName: {
    fontSize: 15,
    fontWeight: FONT.bold,
    color: COLORS.ink,
    marginBottom: 3,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
  },
  changeAddressBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  changeAddressText: {
    fontSize: 13,
    fontWeight: FONT.bold,
    color: COLORS.primary,
    marginRight: 4,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 17,
    ...SHADOW.cta,
  },
  nextBtnDisabled: {
    backgroundColor: '#BFC6D1',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: FONT.bold,
    letterSpacing: 0.2,
  },
  nextBtnIcon: {
    marginLeft: 8,
  },
});

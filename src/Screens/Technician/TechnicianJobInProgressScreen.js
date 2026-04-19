import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  inProgressChecklist,
  photoEvidence,
} from '../../technician/mockData';
import { useTechScreenTheme } from '../../technician/theme';
import {
  TechBadge,
  TechCard,
  TechGradientButton,
  TechScreenHeader,
} from '../../technician/components/TechUi';

export default function TechnicianJobInProgressScreen({ navigation }) {
  const {
    colors: TECH_COLORS,
    statusBarStyle,
    styles,
  } = useTechScreenTheme(createStyles);

  return (
    <ScreenWrapper
      topColor={TECH_COLORS.bg}
      bottomColor={TECH_COLORS.bg}
      statusBarStyle={statusBarStyle}
    >
      <SafeAreaView style={styles.screen}>
        <TechScreenHeader
          title="Job In Progress"
          onBackPress={() => navigation.goBack()}
          right={<TechBadge label="Live" tone="emerald" />}
        />

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TechCard style={styles.timerCard}>
            <View>
              <Text style={styles.timerLabel}>Job Timer</Text>
              <Text style={styles.timerValue}>00:24:18</Text>
            </View>
            <View style={styles.timerCircle}>
              <Text style={styles.timerEmoji}>⏱️</Text>
            </View>
          </TechCard>

          <Text style={styles.eyebrow}>Problem Checklist</Text>
          <TechCard style={styles.checklistCard}>
            {inProgressChecklist.map((item, index) => (
              <View key={item.id}>
                <View style={styles.checkRow}>
                  <View style={[styles.checkBox, item.complete && styles.checkBoxDone]}>
                    {item.complete ? (
                      <Icon name="check" size={14} color={TECH_COLORS.bg} />
                    ) : null}
                  </View>
                  <Text style={[styles.checkLabel, item.complete && styles.checkLabelDone]}>
                    {item.label}
                  </Text>
                </View>
                {index < inProgressChecklist.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </TechCard>

          <Text style={styles.eyebrow}>Photo Evidence (min 2)</Text>
          <View style={styles.photoGrid}>
            {photoEvidence.map((photo) => (
              <View
                key={photo.id}
                style={[
                  styles.photoCard,
                  photo.done ? styles.photoCardDone : styles.photoCardPending,
                ]}
              >
                <Text style={styles.photoIcon}>{photo.done ? '📷' : '➕'}</Text>
                <Text style={[styles.photoLabel, photo.done && styles.photoLabelDone]}>
                  {photo.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.eyebrow}>Work Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>
              Refilled R22 gas 500g. Cleaned filters. Capacitor checked - ok.
            </Text>
          </View>

          <TechGradientButton
            label="Mark as Complete"
            onPress={() => navigation.navigate('TechnicianJobCompletion')}
          />
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
  timerCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderColor: 'rgba(16,217,160,0.26)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  timerValue: {
    marginTop: 3,
    fontSize: 28,
    fontWeight: '800',
    color: TECH_COLORS.emerald,
  },
  timerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: TECH_COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerEmoji: {
    fontSize: 22,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: TECH_COLORS.textMuted,
  },
  checklistCard: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.float,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    borderColor: TECH_COLORS.emerald,
    backgroundColor: TECH_COLORS.emerald,
  },
  checkLabel: {
    fontSize: 13,
    color: TECH_COLORS.text,
  },
  checkLabelDone: {
    color: TECH_COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    backgroundColor: TECH_COLORS.border,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoCard: {
    width: '48%',
    minHeight: 92,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  photoCardDone: {
    borderWidth: 1.5,
    borderColor: 'rgba(16,217,160,0.24)',
    backgroundColor: TECH_COLORS.emeraldTint,
  },
  photoCardPending: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.card,
  },
  photoIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  photoLabel: {
    fontSize: 10,
    color: TECH_COLORS.textMuted,
    textAlign: 'center',
  },
  photoLabelDone: {
    color: TECH_COLORS.emerald,
    fontWeight: '800',
  },
  notesCard: {
    marginBottom: 16,
    borderRadius: TECH_RADIUS.md,
    borderWidth: 1.5,
    borderColor: TECH_COLORS.border,
    backgroundColor: TECH_COLORS.input,
    padding: 14,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
    color: TECH_COLORS.textSecondary,
  },
});

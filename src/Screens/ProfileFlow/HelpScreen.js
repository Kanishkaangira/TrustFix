import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  PC,
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
  SubScreenShell,
} from '../../Components/ProfileComponents';

const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 10) / 2;

const QUICK_HELP = [
  { label: 'Track Booking', sub: 'Live technician tracking' },
  { label: 'Refund Status', sub: 'Check pending refunds' },
  { label: 'Reschedule', sub: 'Change date or time' },
  { label: 'Rate Service', sub: 'Share your feedback' },
];

const CONTACTS = [
  { title: 'Live Chat', sub: 'Avg reply in 2 min', badge: 'Online', badgeVariant: 'green', iconBg: PC.greenSoft },
  { title: 'Call Us', sub: '1800-123-TRUST (Free)', badge: 'Available', badgeVariant: 'blue', iconBg: PC.blueSoft },
  { title: 'Email Support', sub: 'support@trustfix.in', badge: '24h reply', badgeVariant: 'yellow', iconBg: PC.brandSoft },
  { title: 'Raise a Ticket', sub: 'Track issue resolution', badge: null, badgeVariant: null, iconBg: '#F3F0FF' },
];

export default function HelpScreen({ onBack }) {
  return (
    <ScreenWrapper topColor={PC.brand} bottomColor={PC.bg} statusBarStyle="light-content">
      <SubScreenShell
        title="Help & Support"
        onBack={onBack}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <SectionLabel title="QUICK HELP" />
          <View style={styles.quickGrid}>
            {QUICK_HELP.map(q => (
              <TouchableOpacity key={q.label} style={styles.quickCard} activeOpacity={0.8}>
                <View style={styles.quickDot} />
                <Text style={styles.quickLabel}>{q.label}</Text>
                <Text style={styles.quickSub}>{q.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionLabel title="CONTACT US" />
          <SettingsCard>
            {CONTACTS.map((c, i) => (
              <View key={c.title}>
                <SettingRow
                  iconBg={c.iconBg}
                  title={c.title}
                  subtitle={c.sub}
                  rightChip={c.badge}
                  rightChipVariant={c.badgeVariant}
                  onPress={() => {}}
                />
                {i < CONTACTS.length - 1 && <RowDivider />}
              </View>
            ))}
          </SettingsCard>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 10,
  },
  quickCard: {
    width: CARD_W,
    backgroundColor: PC.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PC.border,
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickDot: { width: 28, height: 28, borderRadius: 8, backgroundColor: PC.brandSoft, borderWidth: 1.5, borderColor: 'rgba(255,107,43,0.2)', marginBottom: 10 },
  quickLabel: { fontSize: 14, fontWeight: '700', color: PC.ink, marginBottom: 3 },
  quickSub: { fontSize: 11, color: PC.muted, lineHeight: 15 },
});

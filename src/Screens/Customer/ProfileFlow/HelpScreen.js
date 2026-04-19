import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
  SubScreenShell,
  useProfileColors,
} from '../../../Components/ProfileComponents';

const { width } = Dimensions.get('window');
const CARD_W = (width - 16 * 2 - 10) / 2;

const QUICK_HELP = [
  { label: 'Track Booking', sub: 'Live technician tracking' },
  { label: 'Refund Status', sub: 'Check pending refunds' },
  { label: 'Reschedule', sub: 'Change date or time' },
  { label: 'Rate Service', sub: 'Share your feedback' },
];

export default function HelpScreen({ onBack }) {
  const colors = useProfileColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const contacts = useMemo(
    () => [
      {
        title: 'Live Chat',
        sub: 'Avg reply in 2 min',
        badge: 'Online',
        badgeVariant: 'green',
        iconBg: colors.greenSoft,
      },
      {
        title: 'Call Us',
        sub: '1800-123-TRUST (Free)',
        badge: 'Available',
        badgeVariant: 'blue',
        iconBg: colors.blueSoft,
      },
      {
        title: 'Email Support',
        sub: 'support@trustfix.in',
        badge: '24h reply',
        badgeVariant: 'yellow',
        iconBg: colors.brandSoft,
      },
      {
        title: 'Raise a Ticket',
        sub: 'Track issue resolution',
        badge: null,
        badgeVariant: null,
        iconBg: colors.surfaceSoft,
      },
    ],
    [colors],
  );

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
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
            {QUICK_HELP.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                activeOpacity={0.8}
              >
                <View style={styles.quickDot} />
                <Text style={styles.quickLabel}>{item.label}</Text>
                <Text style={styles.quickSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionLabel title="CONTACT US" />
          <SettingsCard>
            {contacts.map((contact, index) => (
              <View key={contact.title}>
                <SettingRow
                  iconBg={contact.iconBg}
                  title={contact.title}
                  subtitle={contact.sub}
                  rightChip={contact.badge}
                  rightChipVariant={contact.badgeVariant}
                  onPress={() => {}}
                />
                {index < contacts.length - 1 ? <RowDivider /> : null}
              </View>
            ))}
          </SettingsCard>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 16,
      gap: 10,
    },
    quickCard: {
      width: CARD_W,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.isDark ? 0.22 : 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    quickDot: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.brandSoft,
      borderWidth: 1.5,
      borderColor: colors.brandMid,
      marginBottom: 10,
    },
    quickLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 3,
    },
    quickSub: {
      fontSize: 11,
      color: colors.muted,
      lineHeight: 15,
    },
  });

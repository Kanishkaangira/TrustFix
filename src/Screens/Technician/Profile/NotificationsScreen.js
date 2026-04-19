import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  RowDivider,
  SectionLabel,
  SettingRow,
  SettingsCard,
  SubScreenShell,
  useProfileColors,
} from '../../../Components/ProfileComponents';

export default function NotificationsScreen({ navigation }) {
  const colors = useProfileColors();
  const [jobAlerts, setJobAlerts] = useState(true);
  const [payoutUpdates, setPayoutUpdates] = useState(true);
  const [renewalReminders, setRenewalReminders] = useState(true);
  const [whatsApp, setWhatsApp] = useState(true);
  const [sms, setSms] = useState(false);

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="Notifications"
        onBack={() => navigation.goBack()}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <SectionLabel title="PARTNER ALERTS" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.brandSoft}
              title="New Job Alerts"
              subtitle="Nearby leads and instant job invites"
              showToggle
              toggleValue={jobAlerts}
              onToggle={setJobAlerts}
              showChevron={false}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.greenSoft}
              title="Payout Updates"
              subtitle="Daily earnings and settlement notices"
              showToggle
              toggleValue={payoutUpdates}
              onToggle={setPayoutUpdates}
              showChevron={false}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.blueSoft}
              title="Plan Renewals"
              subtitle="Subscription renewals and billing reminders"
              showToggle
              toggleValue={renewalReminders}
              onToggle={setRenewalReminders}
              showChevron={false}
            />
          </SettingsCard>

          <SectionLabel title="CHANNELS" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.greenSoft}
              title="WhatsApp Alerts"
              subtitle="Lead alerts and support updates on WhatsApp"
              showToggle
              toggleValue={whatsApp}
              onToggle={setWhatsApp}
              showChevron={false}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.blueSoft}
              title="SMS Notifications"
              subtitle="Critical OTPs and partner notices only"
              showToggle
              toggleValue={sms}
              onToggle={setSms}
              showChevron={false}
            />
          </SettingsCard>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

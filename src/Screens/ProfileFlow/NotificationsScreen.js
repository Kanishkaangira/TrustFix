import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
  SubScreenShell,
  useProfileColors,
} from '../../Components/ProfileComponents';

export default function NotificationsScreen({ onBack }) {
  const colors = useProfileColors();
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [promos, setPromos] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [whatsapp, setWhatsapp] = useState(true);
  const [sms, setSms] = useState(false);

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="Notifications"
        onBack={onBack}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <SectionLabel title="PUSH NOTIFICATIONS" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.brandSoft}
              title="Booking Updates"
              subtitle="Confirmations, technician arrival"
              showToggle
              toggleValue={bookingUpdates}
              onToggle={setBookingUpdates}
              showChevron={false}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              title="Offers & Promotions"
              subtitle="Deals, cashbacks, new services"
              showToggle
              toggleValue={promos}
              onToggle={setPromos}
              showChevron={false}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.brandSoft}
              title="Service Reminders"
              subtitle="Annual checkups, warranty alerts"
              showToggle
              toggleValue={reminders}
              onToggle={setReminders}
              showChevron={false}
            />
          </SettingsCard>

          <SectionLabel title="CHANNELS" />
          <SettingsCard>
            <SettingRow
              iconBg={colors.greenSoft}
              title="WhatsApp Alerts"
              subtitle="Service updates on WhatsApp"
              showToggle
              toggleValue={whatsapp}
              onToggle={setWhatsapp}
              showChevron={false}
            />
            <RowDivider />
            <SettingRow
              iconBg={colors.blueSoft}
              title="SMS Notifications"
              subtitle="OTPs and critical alerts only"
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

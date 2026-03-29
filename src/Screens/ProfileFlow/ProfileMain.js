import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenWrapper from '../../Components/ScreenWrapper';

import {
  PC,
  StatusChip,
  SectionLabel,
  SettingRow,
  RowDivider,
  SettingsCard,
} from '../../Components/ProfileComponents';

const IconEdit = () => (
  <View style={{ alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
    <View style={[gi.pencilBody, { borderColor: PC.brand }]} />
    <View style={[gi.pencilTip, { borderTopColor: PC.brand }]} />
    <View style={[gi.pencilLine, { backgroundColor: PC.brand }]} />
  </View>
);

const IconBell = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.bellBody, { borderColor: PC.green }]} />
    <View style={[gi.bellDot, { backgroundColor: PC.green }]} />
  </View>
);

const IconCard = () => (
  <View style={[gi.card, { borderColor: PC.blue }]}>
    <View style={[gi.cardStripe, { backgroundColor: PC.blue }]} />
  </View>
);

const IconLocation = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.pinCircle, { borderColor: PC.brand }]} />
    <View style={[gi.pinTail, { backgroundColor: PC.brand }]} />
  </View>
);

const IconStar = () => (
  <View style={gi.starWrap}>
    {[0, 72, 144, 216, 288].map((r, i) => (
      <View key={i} style={[gi.starPoint, { transform: [{ rotate: `${r}deg` }] }]} />
    ))}
  </View>
);

const IconChat = () => (
  <View>
    <View style={[gi.bubble, { borderColor: PC.blue }]} />
    <View style={[gi.bubbleTail, { borderTopColor: PC.blue }]} />
  </View>
);

const IconShare = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.shareCircle, { borderColor: PC.brand }]} />
    <View style={[gi.shareLine, { backgroundColor: PC.brand }]} />
  </View>
);

const IconInfo = () => (
  <View style={[gi.infoCircle, { borderColor: PC.muted }]}>
    <View style={[gi.infoDot, { backgroundColor: PC.muted }]} />
  </View>
);

const IconLogout = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={[gi.logoutRect, { borderColor: PC.red }]} />
    <View style={[gi.logoutArrow, { borderColor: PC.red }]} />
  </View>
);

const IconDelete = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={[gi.trashLid, { backgroundColor: PC.red }]} />
    <View style={[gi.trashBody, { borderColor: PC.red }]} />
  </View>
);

const IconAppear = () => (
  <View style={[gi.appearRect, { borderColor: PC.muted }]}>
    <View style={[gi.appearInner, { backgroundColor: PC.muted }]} />
  </View>
);

const gi = StyleSheet.create({
  pencilBody: { width: 10, height: 14, borderWidth: 1.5, borderRadius: 2, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  pencilTip: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  pencilLine: { width: 8, height: 1.5, borderRadius: 1, marginTop: 2 },
  bellBody: { width: 16, height: 14, borderWidth: 2, borderRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  bellDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  card: { width: 20, height: 14, borderWidth: 2, borderRadius: 3 },
  cardStripe: { height: 3, width: '100%', marginTop: 2 },
  pinCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  pinTail: { width: 2, height: 6, borderRadius: 1 },
  starWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  starPoint: { position: 'absolute', width: 2, height: 8, backgroundColor: PC.brand, borderRadius: 1, top: 1 },
  bubble: { width: 18, height: 13, borderWidth: 2, borderRadius: 6 },
  bubbleTail: { width: 0, height: 0, borderTopWidth: 5, borderLeftWidth: 4, borderLeftColor: 'transparent', marginLeft: 3 },
  shareCircle: { width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  shareLine: { width: 14, height: 2, borderRadius: 1, marginTop: 3 },
  infoCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  infoDot: { width: 3, height: 8, borderRadius: 1.5 },
  logoutRect: { width: 14, height: 16, borderWidth: 2, borderRadius: 3 },
  logoutArrow: { width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, transform: [{ rotate: '45deg' }], marginLeft: -3 },
  trashLid: { width: 18, height: 2.5, borderRadius: 1 },
  trashBody: { width: 14, height: 14, borderWidth: 2, borderRadius: 2, borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 1 },
  appearRect: { width: 18, height: 14, borderWidth: 2, borderRadius: 3 },
  appearInner: { width: 8, height: 6, borderRadius: 2, margin: 2 },
});

export default function ProfileMain({ onNavigate }) {
  return (
    <ScreenWrapper
      topColor={PC.brand}
      bottomColor={PC.bg}
      statusBarStyle="light-content"
    >
    <SafeAreaView style={styles.safe} edges={['top']}>

      <View style={styles.hero}>
        <View style={[styles.blob, { width: 240, height: 240, top: -90, right: -65 }]} />
        <View style={[styles.blob, { width: 140, height: 140, bottom: -42, left: 12 }]} />

        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => onNavigate('editProfile')}
              activeOpacity={0.85}
            >
              <Text style={styles.avatarInitials}>RS</Text>
            </TouchableOpacity>

            <View style={styles.onlineDot} />

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onNavigate('editProfile')}
              activeOpacity={0.85}
            >
              <View style={styles.pencilBody} />
              <View style={styles.pencilTip} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>Rahul Sharma</Text>
            <Text style={styles.heroPhone}>+91 98765 43210</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statsStrip}>
          {[
            { val: '12', label: 'Services' },
            { val: '₹18k', label: 'Total Spent' },
            { val: '3', label: 'Warranties' },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statKey}>{s.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.planStrip}
          onPress={() => onNavigate('subscription')}
          activeOpacity={0.85}
        >
          <View style={styles.planStarBox}>
            {[0, 72, 144, 216, 288].map((r, i) => (
              <View key={i} style={[styles.planStarRay, { transform: [{ rotate: `${r}deg` }] }]} />
            ))}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.planName}>HomeCare Pro</Text>
            <Text style={styles.planExp}>Active · Renews Apr 11, 2026</Text>
          </View>
          <StatusChip label="Manage" variant="brand" />
          <View style={styles.planChevron} />
        </TouchableOpacity>

        <SectionLabel title="ACCOUNT" />
        <SettingsCard>
          <SettingRow
            iconBg={PC.brandSoft}
            IconComponent={IconEdit}
            title="Edit Profile"
            subtitle="Name, email, city, pincode"
            onPress={() => onNavigate('editProfile')}
          />
          <RowDivider />
          <SettingRow
            iconBg={PC.brandSoft}
            IconComponent={IconLocation}
            title="Saved Addresses"
            subtitle="Home, Office + 1 more"
            rightValue="3"
            onPress={() => onNavigate('addresses')}
          />
          <RowDivider />
          <SettingRow
            iconBg={PC.blueSoft}
            IconComponent={IconCard}
            title="Payment Methods"
            subtitle="UPI, Card on file"
            onPress={() => onNavigate('payment')}
          />
        </SettingsCard>

        <SectionLabel title="PREFERENCES" />
        <SettingsCard>
          <SettingRow
            iconBg="#F0F0F5"
            IconComponent={IconAppear}
            title="Appearance"
            subtitle="Dark, Light or System"
            rightValue="System"
            onPress={() => {}}
          />
          <RowDivider />
          <SettingRow
            iconBg={PC.greenSoft}
            IconComponent={IconBell}
            title="Notifications"
            subtitle="Booking updates, promos, reminders"
            onPress={() => onNavigate('notifications')}
          />
          <RowDivider />
          <SettingRow
            iconBg={PC.brandSoft}
            IconComponent={IconStar}
            title="Subscription Plan"
            subtitle="HomeCare Pro · Active"
            rightChip="Pro"
            rightChipVariant="brand"
            onPress={() => onNavigate('subscription')}
          />
        </SettingsCard>

        <SectionLabel title="SUPPORT" />
        <SettingsCard>
          <SettingRow
            iconBg={PC.blueSoft}
            IconComponent={IconChat}
            title="Help & Support"
            subtitle="Chat, call or raise a ticket"
            rightChip="Online"
            rightChipVariant="green"
            onPress={() => onNavigate('help')}
          />
          <RowDivider />
          <SettingRow
            iconBg={PC.brandSoft}
            IconComponent={IconShare}
            title="Share TrustFix"
            subtitle="Refer & earn ₹150 per friend"
            onPress={() => onNavigate('share')}
          />
          <RowDivider />
          <SettingRow
            iconBg="#F3F4F6"
            IconComponent={IconInfo}
            title="About TrustFix"
            subtitle="Mission, version & legal"
            rightValue="v2.1"
            onPress={() => onNavigate('about')}
          />
        </SettingsCard>

        <SectionLabel title="ACCOUNT ACTIONS" />
        <SettingsCard>
          <SettingRow
            iconBg={PC.redSoft}
            IconComponent={IconLogout}
            title="Logout"
            subtitle="Sign out from this device"
            danger
            onPress={() =>
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => {} },
              ])
            }
          />
          <RowDivider />
          <SettingRow
            iconBg={PC.redSoft}
            IconComponent={IconDelete}
            title="Delete Account"
            subtitle="Permanently delete all your data"
            danger
            onPress={() =>
              Alert.alert('Delete Account', 'This action is irreversible.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {} },
              ])
            }
          />
        </SettingsCard>
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PC.brand },
  scroll: { flex: 1, backgroundColor: PC.bg },
  scrollContent: { paddingBottom: 32 },

  hero: {
    backgroundColor: PC.brand,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 38,
    minHeight: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },

  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: -0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00D97E',
    borderWidth: 2.5,
    borderColor: PC.brand,
  },

  editBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: PC.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 1,
  },
  pencilBody: {
    width: 8,
    height: 10,
    borderWidth: 1.5,
    borderColor: PC.brand,
    borderRadius: 1.5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  pencilTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PC.brand,
  },

  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', color: PC.white, letterSpacing: -0.4 },
  heroPhone: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: PC.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PC.border,
    overflow: 'hidden',
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: PC.border },
  statVal: { fontSize: 19, fontWeight: '800', color: PC.ink },
  statKey: { fontSize: 10, color: PC.muted, fontWeight: '600', marginTop: 3, letterSpacing: 0.2 },

  planStrip: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: PC.brandSoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planStarBox: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  planStarRay: { position: 'absolute', width: 2, height: 10, backgroundColor: PC.brand, borderRadius: 1, top: 1 },
  planName: { fontSize: 14, fontWeight: '700', color: PC.ink },
  planExp: { fontSize: 11, color: PC.muted, marginTop: 2 },
  planChevron: {
    width: 7,
    height: 7,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: PC.brand,
    transform: [{ rotate: '45deg' }],
    marginLeft: 6,
  },
});

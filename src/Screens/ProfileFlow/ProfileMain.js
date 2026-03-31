import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../Components/ScreenWrapper';

import {
  PC,
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

const profile = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@gmail.com',
  plan: 'HomeCare Pro',
  planMeta: `Active \u00B7 Renews Apr 11, 2026`,
};

export default function ProfileMain({ onNavigate }) {
  const { bottom } = useSafeAreaInsets();
  const scrollBottomPadding = bottom + 96;

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScreenWrapper
      topColor={PC.brand}
      bottomColor={PC.bg}
      statusBarStyle="light-content"
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.hero}>
          <View style={[styles.blob, { width: 380, height: 380, top: -156, right: -110 }]} />
          <View style={[styles.blob, { width: 220, height: 220, top: 80, right: 130 }]} />
          <View style={[styles.blobDark, { width: 190, height: 190, top: 108, left: -110 }]} />

          <View style={styles.heroHeader}>
            <Text style={styles.heroBrand}>TrustFix</Text>
          </View>

          <View style={styles.heroRow}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => onNavigate('editProfile')}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.onlineDot} />

              <View style={styles.editBtn}>
                <View style={styles.editBtnLine} />
                <View style={styles.editBtnLineShort} />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{profile.name}</Text>
              <Text style={styles.heroPhone}>{profile.phone}</Text>
              <Text style={styles.heroEmail} numberOfLines={1}>
                {profile.email}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPadding },
          ]}
        >
          <View style={styles.statsStrip}>
            {[
              { val: '12', label: 'Services' },
              { val: '\u20B918k', label: 'Total Spent' },
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
            <View style={styles.planIconBox}>
              <View style={styles.planIconDot} />
            </View>

            <View style={styles.planContent}>
              <Text style={styles.planName}>{profile.plan}</Text>
              <Text style={styles.planExp}>{profile.planMeta}</Text>
            </View>

            <View style={styles.planAction}>
              <Text style={styles.planActionText}>Manage</Text>
              <View style={styles.planChevron} />
            </View>
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
              subtitle="HomeCare Pro \u00B7 Active"
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
              subtitle="Refer & earn \u20B9150 per friend"
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
  scroll: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    marginTop: -22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: { paddingTop: 28 },

  hero: {
    backgroundColor: PC.brand,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 52,
    minHeight: 268,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobDark: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(211,96,45,0.26)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroBrand: {
    fontSize: 24,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: -0.5,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingRight: 8,
  },

  avatarWrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: 0.3,
  },
  onlineDot: {
    position: 'absolute',
    right: 3,
    bottom: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2ED67B',
    borderWidth: 2,
    borderColor: PC.white,
  },
  editBtn: {
    position: 'absolute',
    top: 4,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: PC.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B3917',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  editBtnLine: {
    width: 10,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: PC.brand,
  },
  editBtnLineShort: {
    width: 10,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: PC.brand,
    marginTop: 3,
  },

  heroInfo: {
    flex: 1,
    paddingLeft: 22,
    paddingRight: 10,
  },
  heroName: {
    fontSize: 25,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: -0.6,
  },
  heroPhone: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    marginTop: 8,
  },
  heroEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.68)',
    marginTop: 5,
  },

  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 14,
    backgroundColor: PC.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF3',
    overflow: 'hidden',
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#F0F1F4',
  },
  statVal: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111318',
    letterSpacing: -0.3,
  },
  statKey: {
    fontSize: 9,
    color: '#8A8FA8',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.1,
  },

  planStrip: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: '#FFF1E7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.16)',
    paddingHorizontal: 11,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PC.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D75922',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  planIconDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: PC.white,
  },
  planContent: {
    flex: 1,
    marginLeft: 10,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    color: PC.ink,
    letterSpacing: -0.4,
  },
  planExp: {
    fontSize: 10,
    color: PC.muted,
    marginTop: 3,
    fontWeight: '500',
  },
  planAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  planActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: PC.brand,
  },
  planChevron: {
    width: 7,
    height: 7,
    borderTopWidth: 1.6,
    borderRightWidth: 1.6,
    borderColor: PC.brand,
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  PC,
  StatusChip,
  RowDivider,
  SettingsCard,
  SubScreenShell,
} from '../../Components/ProfileComponents';

const ADDRESSES = [
  { label: 'Home', address: 'B-12, Sector 62, Noida, UP 201309', isDefault: true },
  { label: 'Office', address: '14th Floor, Cyber Hub, Gurugram, HR 122002', isDefault: false },
  { label: "Mom's Place", address: 'C-4, Lajpat Nagar II, New Delhi 110024', isDefault: false },
];

const AddBtn = () => (
  <TouchableOpacity activeOpacity={0.7} style={styles.addBtn}>
    <Text style={styles.addBtnText}>+ Add</Text>
  </TouchableOpacity>
);

export default function AddressesScreen({ onBack }) {
  return (
    <ScreenWrapper topColor={PC.brand} bottomColor={PC.bg} statusBarStyle="light-content">
      <SubScreenShell
        title="Saved Addresses"
        onBack={onBack}
        rightAction={<AddBtn />}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <SettingsCard style={{ marginHorizontal: 0, marginTop: 8 }}>
            {ADDRESSES.map((a, i) => (
              <View key={a.label}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: a.isDefault ? PC.brandSoft : PC.bg }]}>
                    <View style={[styles.pinCircle, { borderColor: a.isDefault ? PC.brand : PC.muted }]} />
                    <View style={[styles.pinTail, { backgroundColor: a.isDefault ? PC.brand : PC.muted }]} />
                  </View>

                  <View style={styles.textBlock}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>{a.label}</Text>
                      {a.isDefault && <StatusChip label="Default" variant="brand" />}
                    </View>
                    <Text style={styles.address} numberOfLines={2}>{a.address}</Text>
                  </View>

                  <TouchableOpacity style={styles.moreBtn}>
                    <View style={styles.moreDot} />
                    <View style={styles.moreDot} />
                    <View style={styles.moreDot} />
                  </TouchableOpacity>
                </View>
                {i < ADDRESSES.length - 1 && <RowDivider />}
              </View>
            ))}
          </SettingsCard>
        </ScrollView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  pinTail: { width: 2, height: 6, borderRadius: 1 },
  textBlock: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: PC.ink },
  address: { fontSize: 12, color: PC.muted, lineHeight: 17 },
  moreBtn: { gap: 3, padding: 4 },
  moreDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: PC.muted },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  addBtnText: {
    color: PC.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

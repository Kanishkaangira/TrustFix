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

const METHODS = [
  { name: 'HDFC Bank UPI', sub: 'rahul@hdfcbank', type: 'UPI', isDefault: true },
  { name: 'Visa ending 4521', sub: 'Expires 09/27', type: 'Card', isDefault: false },
  { name: 'Paytm Wallet', sub: '₹420 available', type: 'Wallet', isDefault: false },
];

const AddBtn = () => (
  <TouchableOpacity activeOpacity={0.7} style={styles.addBtn}>
    <Text style={styles.addBtnText}>+ Add</Text>
  </TouchableOpacity>
);

export default function PaymentScreen({ onBack }) {
  return (
    <ScreenWrapper topColor={PC.brand} bottomColor={PC.bg} statusBarStyle="light-content">
      <SubScreenShell
        title="Payment Methods"
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
            {METHODS.map((m, i) => (
              <View key={m.name}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: PC.brandSoft }]}>
                    <View style={[styles.cardIcon, { borderColor: PC.brand }]}>
                      <View style={[styles.cardStripe, { backgroundColor: PC.brand }]} />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{m.name}</Text>
                    <Text style={styles.sub}>{m.sub}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {m.isDefault && <StatusChip label="Default" variant="green" />}
                    <StatusChip label={m.type} variant="brand" />
                  </View>
                </View>
                {i < METHODS.length - 1 && <RowDivider />}
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
  cardIcon: { width: 20, height: 14, borderWidth: 2, borderRadius: 3 },
  cardStripe: { height: 3, width: '100%', marginTop: 2 },
  name: { fontSize: 14, fontWeight: '600', color: PC.ink },
  sub: { fontSize: 12, color: PC.muted, marginTop: 2 },
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

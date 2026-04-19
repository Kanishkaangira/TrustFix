import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  StatusChip,
  RowDivider,
  SettingsCard,
  SubScreenShell,
  useProfileColors,
} from '../../../Components/ProfileComponents';

const METHODS = [
  {
    name: 'HDFC Bank UPI',
    sub: 'rahul@hdfcbank',
    type: 'UPI',
    isDefault: true,
  },
  {
    name: 'Visa ending 4521',
    sub: 'Expires 09/27',
    type: 'Card',
    isDefault: false,
  },
  {
    name: 'Paytm Wallet',
    sub: '\u20B9420 available',
    type: 'Wallet',
    isDefault: false,
  },
];

function AddBtn({ styles }) {
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.addBtn}>
      <Text style={styles.addBtnText}>+ Add</Text>
    </TouchableOpacity>
  );
}

export default function PaymentScreen({ onBack }) {
  const colors = useProfileColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="Payment Methods"
        onBack={onBack}
        rightAction={<AddBtn styles={styles} />}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <SettingsCard style={{ marginHorizontal: 0, marginTop: 8 }}>
            {METHODS.map((method, index) => (
              <View key={method.name}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: colors.brandSoft },
                    ]}
                  >
                    <View
                      style={[styles.cardIcon, { borderColor: colors.brand }]}
                    >
                      <View
                        style={[
                          styles.cardStripe,
                          { backgroundColor: colors.brand },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.textWrap}>
                    <Text style={styles.name}>{method.name}</Text>
                    <Text style={styles.sub}>{method.sub}</Text>
                  </View>

                  <View style={styles.badges}>
                    {method.isDefault ? (
                      <StatusChip label="Default" variant="green" />
                    ) : null}
                    <StatusChip label={method.type} variant="brand" />
                  </View>
                </View>
                {index < METHODS.length - 1 ? <RowDivider /> : null}
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 14,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIcon: {
      width: 20,
      height: 14,
      borderWidth: 2,
      borderRadius: 3,
    },
    cardStripe: {
      height: 3,
      width: '100%',
      marginTop: 2,
    },
    textWrap: {
      flex: 1,
    },
    badges: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
    },
    sub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    addBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    addBtnText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 14,
    },
  });

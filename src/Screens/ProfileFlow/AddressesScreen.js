import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ScreenWrapper from '../../Components/ScreenWrapper';
import {
  PC,
  StatusChip,
  RowDivider,
  SettingsCard,
  SubScreenShell,
} from '../../Components/ProfileComponents';

const AddBtn = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.7} style={styles.addBtn} onPress={onPress}>
    <Text style={styles.addBtnText}>+ Add</Text>
  </TouchableOpacity>
);

const EMPTY_FORM = { label: '', address: '', isDefault: false };

export default function AddressesScreen({
  onBack,
  onSelectAddress,
  addresses = [],
  onAddAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  selectable = false,
}) {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [actionAddress, setActionAddress] = useState(null);
  const [deleteAddress, setDeleteAddress] = useState(null);

  const closeAddModal = () => {
    setIsAddModalVisible(false);
    setForm(EMPTY_FORM);
  };

  const closeActionModal = () => {
    setActionAddress(null);
  };

  const closeDeleteModal = () => {
    setDeleteAddress(null);
  };

  const handleSaveAddress = () => {
    const label = form.label.trim();
    const address = form.address.trim();

    if (!label || !address) {
      return;
    }

    onAddAddress?.({ label, address, isDefault: form.isDefault });
    closeAddModal();
  };

  const handleSetDefault = () => {
    if (!actionAddress) {
      return;
    }

    onSetDefaultAddress?.(actionAddress.id);
    closeActionModal();
  };

  const handleDeleteTap = () => {
    if (!actionAddress || addresses.length <= 1) {
      return;
    }

    setDeleteAddress(actionAddress);
    closeActionModal();
  };

  const handleDeleteConfirm = () => {
    if (!deleteAddress) {
      return;
    }

    onDeleteAddress?.(deleteAddress.id);
    closeDeleteModal();
  };

  return (
    <ScreenWrapper topColor={PC.brand} bottomColor={PC.bg} statusBarStyle="light-content">
      <SubScreenShell
        title="Saved Addresses"
        onBack={onBack}
        rightAction={<AddBtn onPress={() => setIsAddModalVisible(true)} />}
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <SettingsCard style={{ marginHorizontal: 0, marginTop: 8 }}>
            {addresses.map((a, i) => (
              <View key={a.id}>
                <View style={styles.row}>
                  <TouchableOpacity
                    activeOpacity={selectable ? 0.8 : 1}
                    style={styles.rowMain}
                    disabled={!selectable}
                    onPress={() => onSelectAddress?.(a)}
                  >
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
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.moreBtn}
                    onPress={() => setActionAddress(a)}
                  >
                    <View style={styles.moreDot} />
                    <View style={styles.moreDot} />
                    <View style={styles.moreDot} />
                  </TouchableOpacity>
                </View>
                {i < addresses.length - 1 && <RowDivider />}
              </View>
            ))}
          </SettingsCard>
        </ScrollView>
      </SubScreenShell>

      <Modal
        transparent
        animationType="fade"
        visible={isAddModalVisible}
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <Text style={styles.modalSubtitle}>Save another place for faster bookings.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label</Text>
              <TextInput
                value={form.label}
                onChangeText={(value) => setForm((prev) => ({ ...prev, label: value }))}
                placeholder="Home, Office, Flat..."
                placeholderTextColor={PC.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                value={form.address}
                onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
                placeholder="Enter full address"
                placeholderTextColor={PC.muted}
                style={[styles.input, styles.inputMultiline]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.defaultToggle}
              onPress={() => setForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))}
            >
              <View style={[styles.defaultToggleCheck, form.isDefault && styles.defaultToggleCheckActive]}>
                {form.isDefault ? <View style={styles.defaultToggleCheckInner} /> : null}
              </View>
              <View style={styles.defaultToggleTextWrap}>
                <Text style={styles.defaultToggleTitle}>Set as default</Text>
                <Text style={styles.defaultToggleHint}>Use this address first in bookings.</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.secondaryBtn}
                onPress={closeAddModal}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.primaryBtn,
                  (!form.label.trim() || !form.address.trim()) && styles.primaryBtnDisabled,
                ]}
                onPress={handleSaveAddress}
                disabled={!form.label.trim() || !form.address.trim()}
              >
                <Text style={styles.primaryBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="slide"
        visible={!!actionAddress}
        onRequestClose={closeActionModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheetBackdrop}
          onPress={closeActionModal}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheetCard} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{actionAddress?.label}</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={2}>
              {actionAddress?.address}
            </Text>

            {!actionAddress?.isDefault ? (
              <TouchableOpacity activeOpacity={0.82} style={styles.sheetAction} onPress={handleSetDefault}>
                <View style={[styles.sheetActionIcon, styles.sheetActionIconBrand]}>
                  <Icon name="star-circle" size={20} color={PC.brand} />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={styles.sheetActionTitle}>Set as default</Text>
                  <Text style={styles.sheetActionSubtitle}>Use this address first for future bookings.</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.sheetAction, styles.sheetActionStatic]}>
                <View style={[styles.sheetActionIcon, styles.sheetActionIconBrand]}>
                  <Icon name="check-decagram" size={20} color={PC.brand} />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={styles.sheetActionTitle}>Default address</Text>
                  <Text style={styles.sheetActionSubtitle}>This address is already selected by default.</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={addresses.length > 1 ? 0.82 : 1}
              style={[styles.sheetAction, addresses.length <= 1 && styles.sheetActionDisabled]}
              onPress={handleDeleteTap}
              disabled={addresses.length <= 1}
            >
              <View style={[styles.sheetActionIcon, styles.sheetActionIconDanger]}>
                <Icon name="trash-can-outline" size={20} color={PC.red} />
              </View>
              <View style={styles.sheetActionTextWrap}>
                <Text style={[styles.sheetActionTitle, styles.sheetActionTitleDanger]}>Delete address</Text>
                <Text style={styles.sheetActionSubtitle}>
                  {addresses.length > 1
                    ? 'Remove this saved address from your list.'
                    : 'Keep at least one address saved in your account.'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={styles.sheetCancelBtn} onPress={closeActionModal}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={!!deleteAddress}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete address?</Text>
            <Text style={styles.confirmSubtitle}>
              {deleteAddress ? `Remove ${deleteAddress.label} from your saved addresses.` : ''}
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity activeOpacity={0.82} style={styles.secondaryBtn} onPress={closeDeleteModal}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.82} style={styles.deleteBtn} onPress={handleDeleteConfirm}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  pinTail: { width: 2, height: 6, borderRadius: 1 },
  textBlock: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: PC.ink },
  address: { fontSize: 12, color: PC.muted, lineHeight: 17 },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PC.bg,
    borderWidth: 1,
    borderColor: PC.border,
    gap: 3,
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,19,24,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: PC.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: PC.border,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: PC.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: PC.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PC.ink,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: PC.muted,
    marginTop: 6,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PC.inkMid,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: PC.border,
    backgroundColor: PC.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PC.ink,
  },
  inputMultiline: {
    minHeight: 88,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PC.bg,
    borderWidth: 1,
    borderColor: PC.border,
    marginTop: 2,
  },
  defaultToggleCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PC.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  defaultToggleCheckActive: {
    borderColor: PC.brand,
    backgroundColor: PC.brandSoft,
  },
  defaultToggleCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PC.brand,
  },
  defaultToggleTextWrap: {
    flex: 1,
  },
  defaultToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PC.ink,
  },
  defaultToggleHint: {
    fontSize: 12,
    color: PC.muted,
    marginTop: 3,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PC.bg,
    borderWidth: 1,
    borderColor: PC.border,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PC.inkMid,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PC.brand,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PC.white,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,19,24,0.22)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: PC.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: PC.border,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: PC.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PC.ink,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: PC.muted,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 16,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: PC.bg,
    borderWidth: 1,
    borderColor: PC.border,
    marginBottom: 10,
  },
  sheetActionStatic: {
    opacity: 0.82,
  },
  sheetActionDisabled: {
    opacity: 0.52,
  },
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetActionIconBrand: {
    backgroundColor: PC.brandSoft,
  },
  sheetActionIconDanger: {
    backgroundColor: PC.redSoft,
  },
  sheetActionTextWrap: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PC.ink,
  },
  sheetActionTitleDanger: {
    color: PC.red,
  },
  sheetActionSubtitle: {
    fontSize: 12,
    color: PC.muted,
    lineHeight: 17,
    marginTop: 4,
  },
  sheetCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: PC.surface,
    borderWidth: 1,
    borderColor: PC.border,
    marginTop: 4,
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: PC.inkMid,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: PC.ink,
  },
  confirmSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: PC.muted,
    marginTop: 6,
    marginBottom: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: PC.red,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PC.white,
  },
});

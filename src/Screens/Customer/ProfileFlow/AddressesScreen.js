import React, { useMemo, useState } from 'react';
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

import ScreenWrapper from '../../../Components/ScreenWrapper';
import {
  StatusChip,
  RowDivider,
  SettingsCard,
  SubScreenShell,
  useProfileColors,
} from '../../../Components/ProfileComponents';

function AddBtn({ onPress, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.addBtn}
      onPress={onPress}
    >
      <Text style={styles.addBtnText}>+ Add</Text>
    </TouchableOpacity>
  );
}

const EMPTY_FORM = {
  label: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  isDefault: false,
};

export default function AddressesScreen({
  onBack,
  onSelectAddress,
  addresses = [],
  onAddAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  selectable = false,
}) {
  const colors = useProfileColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    const addressLine1 = form.addressLine1.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const postalCode = String(form.postalCode || '').replace(/\D/g, '').slice(0, 6);

    if (!label || !addressLine1 || !city || !state || postalCode.length !== 6) {
      return;
    }

    onAddAddress?.({
      label,
      addressLine1,
      city,
      state,
      postalCode,
      address: [addressLine1, city, state, postalCode, 'IN']
        .filter(Boolean)
        .join(', '),
      isDefault: form.isDefault,
    });
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
    if (!actionAddress) {
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
    <ScreenWrapper
      topColor={colors.headerAccent}
      bottomColor={colors.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="Saved Addresses"
        onBack={onBack}
        rightAction={
          <AddBtn onPress={() => setIsAddModalVisible(true)} styles={styles} />
        }
        accentHeader
        titleNearBack
        titleLarge
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <SettingsCard style={{ marginHorizontal: 0, marginTop: 8 }}>
            {addresses.length ? (
              addresses.map((address, index) => (
                <View key={address.id}>
                  <View style={styles.row}>
                    <TouchableOpacity
                      activeOpacity={selectable ? 0.8 : 1}
                      style={styles.rowMain}
                      disabled={!selectable}
                      onPress={() => onSelectAddress?.(address)}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: address.isDefault
                              ? colors.brandSoft
                              : colors.bg,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.pinCircle,
                            {
                              borderColor: address.isDefault
                                ? colors.brand
                                : colors.muted,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.pinTail,
                            {
                              backgroundColor: address.isDefault
                                ? colors.brand
                                : colors.muted,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.textBlock}>
                        <View style={styles.labelRow}>
                          <Text style={styles.label}>{address.label}</Text>
                          {address.isDefault ? (
                            <StatusChip label="Default" variant="brand" />
                          ) : null}
                        </View>
                        <Text style={styles.address} numberOfLines={2}>
                          {address.address}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.moreBtn}
                      onPress={() => setActionAddress(address)}
                    >
                      <View style={styles.moreDot} />
                      <View style={styles.moreDot} />
                      <View style={styles.moreDot} />
                    </TouchableOpacity>
                  </View>
                  {index < addresses.length - 1 ? <RowDivider /> : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No saved addresses yet</Text>
                <Text style={styles.emptyStateText}>
                  Tap + Add to save your first service address.
                </Text>
              </View>
            )}
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
            <Text style={styles.modalSubtitle}>
              Save another place for faster bookings.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label</Text>
              <TextInput
                value={form.label}
                onChangeText={value =>
                  setForm(prev => ({ ...prev, label: value }))
                }
                placeholder="Home, Office, Flat..."
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address line 1</Text>
              <TextInput
                value={form.addressLine1}
                onChangeText={value =>
                  setForm(prev => ({ ...prev, addressLine1: value }))
                }
                placeholder="House no, building, street"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.inlineInputRow}>
              <View style={[styles.inputGroup, styles.inlineInputGroup]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  value={form.city}
                  onChangeText={value =>
                    setForm(prev => ({ ...prev, city: value }))
                  }
                  placeholder="City"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>

              <View style={[styles.inputGroup, styles.inlineInputGroup]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  value={form.state}
                  onChangeText={value =>
                    setForm(prev => ({ ...prev, state: value }))
                  }
                  placeholder="State"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pin code</Text>
              <TextInput
                value={form.postalCode}
                onChangeText={value =>
                  setForm(prev => ({
                    ...prev,
                    postalCode: String(value || '').replace(/\D/g, '').slice(0, 6),
                  }))
                }
                placeholder="110001"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.defaultToggle}
              onPress={() =>
                setForm(prev => ({ ...prev, isDefault: !prev.isDefault }))
              }
            >
              <View
                style={[
                  styles.defaultToggleCheck,
                  form.isDefault && styles.defaultToggleCheckActive,
                ]}
              >
                {form.isDefault ? (
                  <View style={styles.defaultToggleCheckInner} />
                ) : null}
              </View>
              <View style={styles.defaultToggleTextWrap}>
                <Text style={styles.defaultToggleTitle}>Set as default</Text>
                <Text style={styles.defaultToggleHint}>
                  Use this address first in bookings.
                </Text>
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
                  (
                    !form.label.trim() ||
                    !form.addressLine1.trim() ||
                    !form.city.trim() ||
                    !form.state.trim() ||
                    String(form.postalCode || '').replace(/\D/g, '').length !== 6
                  ) &&
                    styles.primaryBtnDisabled,
                ]}
                onPress={handleSaveAddress}
                disabled={
                  !form.label.trim() ||
                  !form.addressLine1.trim() ||
                  !form.city.trim() ||
                  !form.state.trim() ||
                  String(form.postalCode || '').replace(/\D/g, '').length !== 6
                }
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
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheetCard}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{actionAddress?.label}</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={2}>
              {actionAddress?.address}
            </Text>

            {!actionAddress?.isDefault ? (
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.sheetAction}
                onPress={handleSetDefault}
              >
                <View
                  style={[styles.sheetActionIcon, styles.sheetActionIconBrand]}
                >
                  <Icon name="star-circle" size={20} color={colors.brand} />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={styles.sheetActionTitle}>Set as default</Text>
                  <Text style={styles.sheetActionSubtitle}>
                    Use this address first for future bookings.
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.sheetAction, styles.sheetActionStatic]}>
                <View
                  style={[styles.sheetActionIcon, styles.sheetActionIconBrand]}
                >
                  <Icon name="check-decagram" size={20} color={colors.brand} />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={styles.sheetActionTitle}>Default address</Text>
                  <Text style={styles.sheetActionSubtitle}>
                    This address is already selected by default.
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.sheetAction}
              onPress={handleDeleteTap}
            >
              <View
                style={[styles.sheetActionIcon, styles.sheetActionIconDanger]}
              >
                <Icon name="trash-can-outline" size={20} color={colors.red} />
              </View>
              <View style={styles.sheetActionTextWrap}>
                <Text
                  style={[
                    styles.sheetActionTitle,
                    styles.sheetActionTitleDanger,
                  ]}
                >
                  Delete address
                </Text>
                <Text style={styles.sheetActionSubtitle}>
                  Remove this saved address from your list.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sheetCancelBtn}
              onPress={closeActionModal}
            >
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
              {deleteAddress
                ? `Remove ${deleteAddress.label} from your saved addresses.`
                : ''}
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.secondaryBtn}
                onPress={closeDeleteModal}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.deleteBtn}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
    },
    pinTail: {
      width: 2,
      height: 6,
      borderRadius: 1,
    },
    textBlock: {
      flex: 1,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
    },
    address: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
    },
    moreBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 3,
    },
    moreDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.muted,
    },
    addBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.headerPill,
      borderWidth: colors.isDark ? 1 : 0,
      borderColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
    },
    addBtnText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 14,
    },
    emptyState: {
      paddingHorizontal: 18,
      paddingVertical: 22,
    },
    emptyStateTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.ink,
    },
    emptyStateText: {
      marginTop: 6,
      fontSize: 12,
      lineHeight: 18,
      color: colors.muted,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(17,19,24,0.42)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      borderRadius: 22,
      backgroundColor: colors.surface,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmCard: {
      width: '100%',
      borderRadius: 22,
      backgroundColor: colors.surface,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
    },
    modalSubtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      marginTop: 6,
      marginBottom: 18,
    },
    inputGroup: {
      marginBottom: 14,
    },
    inlineInputRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inlineInputGroup: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.inkMid,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.ink,
    },
    defaultToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 2,
    },
    defaultToggleCheck: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    defaultToggleCheckActive: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    defaultToggleCheckInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.brand,
    },
    defaultToggleTextWrap: {
      flex: 1,
    },
    defaultToggleTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    defaultToggleHint: {
      fontSize: 12,
      color: colors.muted,
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
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.inkMid,
    },
    primaryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.brand,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.white,
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(17,19,24,0.34)',
      justifyContent: 'flex-end',
    },
    sheetCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.ink,
    },
    sheetSubtitle: {
      fontSize: 13,
      color: colors.muted,
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
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    sheetActionStatic: {
      opacity: 0.82,
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
      backgroundColor: colors.brandSoft,
    },
    sheetActionIconDanger: {
      backgroundColor: colors.redSoft,
    },
    sheetActionTextWrap: {
      flex: 1,
    },
    sheetActionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    sheetActionTitleDanger: {
      color: colors.red,
    },
    sheetActionSubtitle: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
      marginTop: 4,
    },
    sheetCancelBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
    },
    sheetCancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.inkMid,
    },
    confirmTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.ink,
    },
    confirmSubtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
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
      backgroundColor: colors.red,
    },
    deleteBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.white,
    },
  });

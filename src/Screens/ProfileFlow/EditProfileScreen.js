import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import ScreenWrapper from '../../Components/ScreenWrapper';
import { PC, SubScreenShell } from '../../Components/ProfileComponents';
import { INITIAL_PROFILE } from '../../state/profileStore';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  editable = true,
  autoCapitalize = 'words',
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={PC.muted}
      keyboardType={keyboardType || 'default'}
      maxLength={maxLength}
      editable={editable}
      autoCapitalize={autoCapitalize}
    />
  </View>
);

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

export default function EditProfileScreen({
  onBack,
  profile = INITIAL_PROFILE,
  onSaveProfile,
}) {
  const { firstName: initialFirstName, lastName: initialLastName } = splitName(profile.name);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(profile.phone || INITIAL_PROFILE.phone);
  const [email, setEmail] = useState(profile.email || INITIAL_PROFILE.email);

  useEffect(() => {
    const { firstName: nextFirstName, lastName: nextLastName } = splitName(profile.name);
    setFirstName(nextFirstName);
    setLastName(nextLastName);
    setPhone(profile.phone || INITIAL_PROFILE.phone);
    setEmail(profile.email || INITIAL_PROFILE.email);
  }, [profile.email, profile.name, profile.phone]);

  const initials = [firstName, lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'RS';

  const handleSave = () => {
    const nextName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    onSaveProfile?.({
      name: nextName || profile.name || INITIAL_PROFILE.name,
      phone: phone.trim() || profile.phone || INITIAL_PROFILE.phone,
      email: email.trim() || profile.email || INITIAL_PROFILE.email,
    });

    onBack();
  };

  return (
    <ScreenWrapper
      topColor={PC.brand}
      bottomColor={PC.bg}
      statusBarStyle="light-content"
    >
      <SubScreenShell
        title="Edit Profile"
        onBack={onBack}
        accentHeader
        titleNearBack
        titleLarge
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarOuter}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formSectionLabel}>PERSONAL INFO</Text>

              <InputField
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                maxLength={30}
              />
              <View style={styles.fieldDivider} />

              <InputField
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                maxLength={30}
              />
            </View>

            <View style={[styles.formCard, { marginTop: 12 }]}>
              <Text style={styles.formSectionLabel}>CONTACT INFO</Text>

              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
                maxLength={16}
              />

              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                maxLength={60}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.mainSaveBtn}
              onPress={handleSave}
              activeOpacity={0.9}
            >
              <Text style={styles.mainSaveBtnText}>Save Changes</Text>
              <View style={styles.mainSaveBtnArrow} />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SubScreenShell>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: PC.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PC.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: PC.white,
    letterSpacing: -0.5,
  },

  formCard: {
    marginHorizontal: 16,
    backgroundColor: PC.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PC.border,
    overflow: 'hidden',
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: PC.muted,
    letterSpacing: 1.4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },

  fieldWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PC.muted,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '500',
    color: PC.ink,
    paddingVertical: 0,
  },
  fieldInputDisabled: {
    color: PC.muted,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: PC.divider,
    marginLeft: 16,
  },

  verifiedNote: {
    fontSize: 11,
    color: PC.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  mainSaveBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: PC.brand,
    borderRadius: 14,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PC.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  mainSaveBtnText: {
    color: PC.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mainSaveBtnArrow: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: PC.white,
    transform: [{ rotate: '45deg' }],
  },
});

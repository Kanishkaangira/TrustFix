import React, { useState } from 'react';
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

import { PC, SubScreenShell } from '../../Components/ProfileComponents';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  editable = true,
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
      autoCapitalize="words"
    />
  </View>
);

export default function EditProfileScreen({ onBack }) {
  const [firstName, setFirstName] = useState('Rahul');
  const [lastName, setLastName] = useState('Sharma');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('rahul.sharma@gmail.com');

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleSave = () => {
    onBack();
  };

  return (
    <SubScreenShell title="Edit Profile" onBack={onBack} accentHeader>
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

              <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.85}>
                <View style={styles.cameraBody}>
                  <View style={styles.cameraLens} />
                  <View style={styles.cameraNotch} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tap to update photo</Text>
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
              maxLength={14}
              editable={false}
            />
            <View style={styles.fieldDivider} />
            <Text style={styles.verifiedNote}>
              Phone number is verified. Contact support to change
            </Text>

            <View style={styles.fieldDivider} />

            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              maxLength={60}
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

  cameraBtn: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: PC.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PC.border,
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: PC.inkMid,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraLens: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: PC.inkMid,
  },
  cameraNotch: {
    position: 'absolute',
    top: -4,
    left: 3,
    width: 5,
    height: 3,
    borderRadius: 1,
    backgroundColor: PC.inkMid,
  },

  avatarHint: {
    fontSize: 12,
    color: PC.muted,
    fontWeight: '500',
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

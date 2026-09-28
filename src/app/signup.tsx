import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Link, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

const backgroundImage = require('@/assets/images/budget.webp');

const OCCUPATIONS = [
  { label: 'Full-time job', value: 'fulltime', icon: 'work' },
  { label: 'Part-time job', value: 'parttime', icon: 'work-outline' },
  { label: 'Student', value: 'student', icon: 'school' },
];

export default function SignUp() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [occupation, setOccupation] = useState('fulltime');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; password?: string }>({});
  const router = useRouter();
  const fileUri = `${FileSystem.documentDirectory}users.json`;

  const validate = () => {
    const newErrors: { name?: string; password?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const userData = { name: name.trim(), password, occupation };

    try {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      let users: any[] = [];
      if (fileExists.exists) {
        const existingData = await FileSystem.readAsStringAsync(fileUri);
        users = JSON.parse(existingData);
      }

      const duplicate = users.find((u) => u.name === name.trim());
      if (duplicate) {
        setErrors({ name: 'That username is already taken.' });
        setIsLoading(false);
        return;
      }

      users.push(userData);
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(users));
      Alert.alert('Account created!', `Welcome aboard, ${name.trim()}!`, [
        { text: 'Get started', onPress: () => router.push('/welcome') },
      ]);
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your details. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.bg}>
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="person-add" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Join BudgetWise and take control.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Step indicator */}
            <View style={styles.stepRow}>
              <View style={styles.stepDot} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, styles.stepDotInactive]} />
            </View>
            <Text style={styles.stepLabel}>Step 1 of 3 — Your details</Text>

            {/* Name field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                <MaterialIcons name="person-outline" size={18} color="#6b7c6b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chiyembekezo Yassin"
                  placeholderTextColor="#9aad9a"
                  value={name}
                  onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.name ? (
                <View style={styles.fieldError}>
                  <MaterialIcons name="error-outline" size={13} color="#b91c1c" />
                  <Text style={styles.fieldErrorText}>{errors.name}</Text>
                </View>
              ) : null}
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <MaterialIcons name="lock-outline" size={18} color="#6b7c6b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#9aad9a"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ paddingRight: 14 }}
                >
                  <MaterialIcons
                    name={passwordVisible ? 'visibility-off' : 'visibility'}
                    size={18}
                    color="#6b7c6b"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <View style={styles.fieldError}>
                  <MaterialIcons name="error-outline" size={13} color="#b91c1c" />
                  <Text style={styles.fieldErrorText}>{errors.password}</Text>
                </View>
              ) : null}

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            password.length >= n * 3
                              ? password.length < 6
                                ? '#f59e0b'
                                : '#2d6a2d'
                              : '#e5e7eb',
                        },
                      ]}
                    />
                  ))}
                  <Text style={styles.strengthText}>
                    {password.length < 6 ? 'Weak' : password.length < 10 ? 'Good' : 'Strong'}
                  </Text>
                </View>
              )}
            </View>

            {/* Occupation */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Occupation</Text>
              <View style={styles.occupationGrid}>
                {OCCUPATIONS.map((occ) => (
                  <TouchableOpacity
                    key={occ.value}
                    style={[
                      styles.occCard,
                      occupation === occ.value && styles.occCardActive,
                    ]}
                    onPress={() => setOccupation(occ.value)}
                    activeOpacity={0.75}
                  >
                    <MaterialIcons
                      name={occ.icon as any}
                      size={22}
                      color={occupation === occ.value ? '#2d6a2d' : '#9aaa9a'}
                    />
                    <Text style={[styles.occLabel, occupation === occ.value && styles.occLabelActive]}>
                      {occ.label}
                    </Text>
                    {occupation === occ.value && (
                      <View style={styles.occCheck}>
                        <MaterialIcons name="check" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sign up button */}
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Text>
              {!isLoading && (
                <MaterialIcons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Already have an account?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Back to Login */}
            <Link href="/login" asChild>
              <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
                <MaterialIcons name="arrow-back" size={16} color="#2d6a2d" style={{ marginRight: 5 }} />
                <Text style={styles.loginButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const GREEN = '#2d6a2d';
const GREEN_LIGHT = '#e8f5e2';
const GREEN_MUTED = '#5C8A4A';

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 10, 0.62)',
  },
  keyboardAvoid: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 60,
  },

  /* Header */
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  /* Step indicator */
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
  },
  stepDotInactive: { backgroundColor: '#d1ddd1' },
  stepLine: { flex: 1, height: 2, backgroundColor: GREEN, marginHorizontal: 4 },
  stepLabel: {
    fontSize: 11,
    color: '#9aaa9a',
    fontWeight: '500',
    marginBottom: 18,
    letterSpacing: 0.3,
  },

  /* Fields */
  fieldGroup: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1ddd1',
    borderRadius: 12,
    backgroundColor: '#f9fdf9',
  },
  inputError: { borderColor: '#fca5a5' },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, height: 50, fontSize: 15, color: '#1a2e1a', paddingRight: 14 },
  fieldError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  fieldErrorText: { fontSize: 12, color: '#b91c1c' },

  /* Password strength */
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthText: { fontSize: 11, color: '#6b7c6b', marginLeft: 4, fontWeight: '500' },

  /* Occupation grid */
  occupationGrid: { flexDirection: 'row', gap: 8 },
  occCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1ddd1',
    backgroundColor: '#f9fdf9',
    position: 'relative',
  },
  occCardActive: {
    borderColor: GREEN,
    backgroundColor: GREEN_LIGHT,
  },
  occLabel: {
    fontSize: 11,
    color: '#9aaa9a',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  occLabelActive: { color: GREEN },
  occCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Buttons */
  signupButton: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.65 },
  signupButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5ebe5' },
  dividerText: { fontSize: 11, color: '#9aaa9a', fontWeight: '500' },

  loginButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { color: GREEN, fontSize: 15, fontWeight: '700' },
});
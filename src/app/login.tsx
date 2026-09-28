import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';

const backgroundImage = require('@/assets/images/budget.webp');

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [useFingerprint, setUseFingerprint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const fileUri = `${FileSystem.documentDirectory}users.json`;

  const handleLogin = async () => {
    if (!name || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setIsLoading(true);
    try {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      if (!fileExists.exists) {
        setError('No registered users found. Please sign up first.');
        setIsLoading(false);
        return;
      }
      const fileData = await FileSystem.readAsStringAsync(fileUri);
      const users = JSON.parse(fileData);
      const user = users.find((u: any) => u.name === name && u.password === password);
      if (user) {
        Alert.alert('Welcome back!', `Good to see you, ${name}.`, [
          { text: 'Continue', onPress: () => router.push('/welcome') },
        ]);
      } else {
        setError('Incorrect name or password.');
      }
    } catch (err) {
      console.error('Error reading user data:', err);
      setError('Failed to authenticate. Please try again.');
    }
    setIsLoading(false);
  };

  const handleFingerprintLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Unavailable', 'Biometric authentication is not set up on this device.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
      });
      if (result.success) {
        Alert.alert('Authenticated', 'Welcome back!', [
          { text: 'Continue', onPress: () => router.push('/welcome') },
        ]);
      } else {
        Alert.alert('Failed', 'Authentication was not successful. Please try again.');
      }
    } catch (err) {
      console.error('Fingerprint error:', err);
      Alert.alert('Error', 'Biometric authentication failed.');
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.bg}>
      <StatusBar barStyle="light-content" />
      {/* Dark overlay */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header: logo + title */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Oshota</Text>
          <Text style={styles.tagline}>Your finances, simplified.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Toggle pills */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.pill, !useFingerprint && styles.pillActive]}
              onPress={() => { setUseFingerprint(false); setError(''); }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="lock-outline"
                size={15}
                color={!useFingerprint ? '#fff' : '#5C8A4A'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.pillText, !useFingerprint && styles.pillTextActive]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, useFingerprint && styles.pillActive]}
              onPress={() => { setUseFingerprint(true); setError(''); }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="fingerprint"
                size={15}
                color={useFingerprint ? '#fff' : '#5C8A4A'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.pillText, useFingerprint && styles.pillTextActive]}>Biometric</Text>
            </TouchableOpacity>
          </View>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={15} color="#b91c1c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {useFingerprint ? (
            /* ── Biometric view ── */
            <View style={styles.biometricContainer}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleFingerprintLogin}
                activeOpacity={0.75}
              >
                <View style={styles.biometricCircle}>
                  <MaterialIcons name="fingerprint" size={52} color="#2d6a2d" />
                </View>
              </TouchableOpacity>
              <Text style={styles.biometricHint}>Touch the sensor to authenticate</Text>
            </View>
          ) : (
            /* ── Password form ── */
            <View>
              {/* Name field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person-outline" size={18} color="#6b7c6b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#9aad9a"
                    value={name}
                    onChangeText={(t) => { setName(t); setError(''); }}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={18} color="#6b7c6b" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9aad9a"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    secureTextEntry={!passwordVisible}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
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
              </View>

              {/* Forgot password */}
              <TouchableOpacity style={styles.forgotRow} activeOpacity={0.6}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Login button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </Text>
                {!isLoading && (
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New here?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign up */}
          <Link href="/signup" asChild>
            <TouchableOpacity style={styles.signupButton} activeOpacity={0.8}>
              <Text style={styles.signupButtonText}>Create an Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const GREEN = '#2d6a2d';
const GREEN_MID = '#3d8c3d';
const GREEN_LIGHT = '#e8f5e2';
const GREEN_MUTED = '#5C8A4A';

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 10, 0.62)',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  /* ── Toggle pills ── */
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  pillActive: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN_MUTED,
  },
  pillTextActive: {
    color: '#ffffff',
  },

  /* ── Error ── */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    flex: 1,
  },

  /* ── Fields ── */
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#1a2e1a',
    paddingRight: 14,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 2,
  },
  forgotText: {
    fontSize: 13,
    color: GREEN_MID,
    fontWeight: '500',
  },

  /* ── Login button ── */
  loginButton: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Biometric ── */
  biometricContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  biometricButton: {
    marginBottom: 14,
  },
  biometricCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: GREEN_LIGHT,
    borderWidth: 2,
    borderColor: '#b6d9b6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricHint: {
    fontSize: 14,
    color: '#6b7c6b',
    textAlign: 'center',
  },

  /* ── Divider ── */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5ebe5',
  },
  dividerText: {
    fontSize: 12,
    color: '#9aaA9a',
    fontWeight: '500',
  },

  /* ── Sign up button ── */
  signupButton: {
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '700',
  },
});
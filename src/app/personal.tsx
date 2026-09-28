import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';

const backgroundImage = require('@/assets/images/budget.webp');

const OCCUPATIONS = [
  { label: 'Full-time', value: 'fulltime', icon: 'work' },
  { label: 'Part-time', value: 'parttime', icon: 'work-outline' },
  { label: 'Student', value: 'Student', icon: 'school' },
];

type UserData = { name: string; password: string; occupation: string };

export default function Personal() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [occupation, setOccupation] = useState('fulltime');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; password?: string }>({});
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const fileUri = `${FileSystem.documentDirectory}users.json`;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const fileExists = await FileSystem.getInfoAsync(fileUri);
        if (fileExists.exists) {
          const data = await FileSystem.readAsStringAsync(fileUri);
          const users = JSON.parse(data);
          const currentUser = users[users.length - 1];
          setUserData(currentUser);
          setName(currentUser.name);
          setPassword(currentUser.password);
          setOccupation(currentUser.occupation || 'fulltime');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const validate = () => {
    const newErrors: { name?: string; password?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setSaved(false);

    try {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      let users: UserData[] = [];
      if (fileExists.exists) {
        const data = await FileSystem.readAsStringAsync(fileUri);
        users = JSON.parse(data);
      }

      const updatedUser: UserData = { name: name.trim(), password, occupation };
      users[users.length - 1] = updatedUser;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(users));

      setUserData(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Error', 'Failed to update your details. Please try again.');
    }
    setIsLoading(false);
  };

  const getInitials = (n: string) =>
    n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <ImageBackground source={backgroundImage} style={styles.bg}>
      <StatusBar style="light" />
      <View style={styles.overlay} />

      {isSidebarVisible && (
        <View style={styles.sidebarOverlay}>
          <Sidebar onClose={() => setIsSidebarVisible(false)} />
        </View>
      )}

      <View style={styles.container}>
        <HeaderWithSidebar onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar + name hero */}
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name ? getInitials(name) : '?'}
                </Text>
              </View>
              <Text style={styles.heroName}>{name || 'Your Profile'}</Text>
              <View style={styles.occBadge}>
                <MaterialIcons
                  name={
                    (OCCUPATIONS.find((o) => o.value === occupation)?.icon as any) ?? 'work'
                  }
                  size={12}
                  color="#3d8c3d"
                />
                <Text style={styles.occBadgeText}>
                  {OCCUPATIONS.find((o) => o.value === occupation)?.label ?? occupation}
                </Text>
              </View>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Edit Details</Text>

              {/* Success banner */}
              {saved && (
                <View style={styles.successBanner}>
                  <MaterialIcons name="check-circle-outline" size={15} color="#15803d" />
                  <Text style={styles.successText}>Profile updated successfully!</Text>
                </View>
              )}

              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                  <MaterialIcons name="person-outline" size={18} color="#6b7c6b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#9aad9a"
                    value={name}
                    onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); setSaved(false); }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name ? (
                  <View style={styles.fieldError}>
                    <MaterialIcons name="error-outline" size={13} color="#b91c1c" />
                    <Text style={styles.fieldErrorText}>{errors.name}</Text>
                  </View>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                  <MaterialIcons name="lock-outline" size={18} color="#6b7c6b" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#9aad9a"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); setSaved(false); }}
                    secureTextEntry={!passwordVisible}
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
              </View>

              {/* Occupation */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Occupation</Text>
                <View style={styles.occGrid}>
                  {OCCUPATIONS.map((occ) => (
                    <TouchableOpacity
                      key={occ.value}
                      style={[styles.occCard, occupation === occ.value && styles.occCardActive]}
                      onPress={() => { setOccupation(occ.value); setSaved(false); }}
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

              {/* Divider */}
              <View style={styles.divider} />

              {/* Update button */}
              <TouchableOpacity
                style={[styles.updateButton, isLoading && styles.buttonDisabled]}
                onPress={handleUpdate}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <MaterialIcons
                  name={isLoading ? 'hourglass-empty' : 'save'}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 7 }}
                />
                <Text style={styles.updateButtonText}>
                  {isLoading ? 'Saving…' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Footer />
    </ImageBackground>
  );
}

const GREEN = '#2d6a2d';
const GREEN_LIGHT = '#e8f5e2';

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 10, 0.62)',
  },
  container: { flex: 1, width: '100%' },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: '100%',
    backgroundColor: 'white',
    zIndex: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  occBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  occBadgeText: {
    fontSize: 12,
    color: '#c8f0c8',
    fontWeight: '600',
  },

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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a2e1a',
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  /* Banners */
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
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

  /* Occupation grid */
  occGrid: { flexDirection: 'row', gap: 8 },
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

  divider: {
    height: 1,
    backgroundColor: '#e5ebe5',
    marginBottom: 18,
  },

  /* Update button */
  updateButton: {
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
  buttonDisabled: { opacity: 0.65 },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
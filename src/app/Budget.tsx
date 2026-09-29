import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ImageBackground, TextInput,
  Dimensions, Alert, TouchableOpacity, KeyboardAvoidingView,
  Platform, Animated, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import { Ionicons } from '@expo/vector-icons';

const backgroundImage = require('@/assets/images/budget.webp');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

// ── Month/Year Picker ──────────────────────────────────────────────────────
function MonthYearPicker({
  selectedMonth, selectedYear, onSelectMonth, onSelectYear,
}: {
  selectedMonth: number; selectedYear: number;
  onSelectMonth: (m: number) => void; onSelectYear: (y: number) => void;
}) {
  return (
    <View style={pickerStyles.wrap}>
      {/* Year row */}
      <View style={pickerStyles.yearRow}>
        <TouchableOpacity
          style={pickerStyles.yearArrow}
          onPress={() => onSelectYear(selectedYear - 1)}
          disabled={selectedYear <= YEARS[0]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18}
            color={selectedYear <= YEARS[0] ? 'rgba(255,255,255,0.2)' : '#fff'} />
        </TouchableOpacity>
        <Text style={pickerStyles.yearText}>{selectedYear}</Text>
        <TouchableOpacity
          style={pickerStyles.yearArrow}
          onPress={() => onSelectYear(selectedYear + 1)}
          disabled={selectedYear >= YEARS[YEARS.length - 1]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18}
            color={selectedYear >= YEARS[YEARS.length - 1] ? 'rgba(255,255,255,0.2)' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Month grid */}
      <View style={pickerStyles.grid}>
        {MONTHS.map((m, i) => {
          const isSelected = i === selectedMonth;
          return (
            <TouchableOpacity
              key={m}
              style={[pickerStyles.monthCell, isSelected && pickerStyles.monthCellActive]}
              onPress={() => onSelectMonth(i)}
              activeOpacity={0.75}
            >
              <Text style={[pickerStyles.monthText, isSelected && pickerStyles.monthTextActive]}>
                {m.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  yearRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 14, gap: 20,
  },
  yearArrow: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  yearText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthCell: {
    width: (SCREEN_WIDTH - 32 - 32 - 8 * 3) / 4,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  monthCellActive: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  monthText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  monthTextActive: { color: '#fff', fontWeight: '800' },
});

// ── Budget History Item ────────────────────────────────────────────────────
function HistoryItem({ label, amount, isActive }: { label: string; amount: number; isActive: boolean }) {
  return (
    <View style={[histStyles.row, isActive && histStyles.rowActive]}>
      <View style={histStyles.left}>
        <Ionicons
          name="calendar-outline" size={16}
          color={isActive ? '#22c55e' : 'rgba(255,255,255,0.4)'}
        />
        <Text style={[histStyles.label, isActive && histStyles.labelActive]}>{label}</Text>
        {isActive && (
          <View style={histStyles.currentBadge}>
            <Text style={histStyles.currentBadgeText}>current</Text>
          </View>
        )}
      </View>
      <Text style={[histStyles.amount, isActive && histStyles.amountActive]}>
        K {amount.toLocaleString()}
      </Text>
    </View>
  );
}
const histStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowActive: { backgroundColor: 'rgba(34,197,94,0.07)' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  labelActive: { color: '#fff', fontWeight: '700' },
  currentBadge: {
    backgroundColor: '#16a34a', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  currentBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700', textTransform: 'uppercase' },
  amount: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  amountActive: { color: '#4ade80' },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function Budget() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [inputBudget, setInputBudget] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetHistory, setBudgetHistory] = useState<Record<string, number>>({});
  const [currentBudget, setCurrentBudget] = useState(0);

  const router = useRouter();
  const sidebarAnimation = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  const budgetKey = `budget_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
  const selectedLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;
  const todayKey = `budget_${new Date().getFullYear()}_${String(new Date().getMonth()).padStart(2, '0')}`;

  const toggleSidebar = () => {
    const toValue = isSidebarVisible ? -SCREEN_WIDTH : 0;
    Animated.timing(sidebarAnimation, { toValue, duration: 300, useNativeDriver: true })
      .start(() => setIsSidebarVisible(!isSidebarVisible));
  };

  const loadData = async () => {
    try {
      const hist = await AsyncStorage.getItem('budgetHistory');
      const parsed: Record<string, number> = hist ? JSON.parse(hist) : {};
      setBudgetHistory(parsed);

      // Also load the "current" budget (legacy key) as fallback
      const legacy = await AsyncStorage.getItem('budget');
      const current = parsed[todayKey] ?? (legacy ? JSON.parse(legacy) : 0);
      setCurrentBudget(current);

      // Pre-fill input with selected month's value
      if (parsed[budgetKey] !== undefined) {
        setInputBudget(String(parsed[budgetKey]));
      } else {
        setInputBudget('');
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  // Update input when month/year changes
  useEffect(() => {
    setInputBudget(budgetHistory[budgetKey] !== undefined ? String(budgetHistory[budgetKey]) : '');
  }, [selectedMonth, selectedYear]);

  const handleSave = async () => {
    const val = parseFloat(inputBudget);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid budget amount.');
      return;
    }
    try {
      const updated = { ...budgetHistory, [budgetKey]: val };
      await AsyncStorage.setItem('budgetHistory', JSON.stringify(updated));
      setBudgetHistory(updated);

      // If saving for current month, also update the legacy 'budget' key
      if (budgetKey === todayKey) {
        await AsyncStorage.setItem('budget', JSON.stringify(val));
        setCurrentBudget(val);
      }

      Alert.alert('✅ Saved', `Budget for ${selectedLabel} set to K ${val.toLocaleString()}`, [
        { text: 'OK', onPress: () => router.replace('/home') },
      ]);
    } catch (e) { console.error(e); }
  };

  // Show up to 6 recent months in history
  const historyEntries = Object.entries(budgetHistory)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  const existingForSelected = budgetHistory[budgetKey];

  return (
    <ImageBackground source={backgroundImage} style={styles.bg}>
      <View style={styles.overlay} />

      <View style={styles.root}>
        <Animated.View style={[styles.sidebarWrap, { transform: [{ translateX: sidebarAnimation }] }]}>
          <Sidebar onClose={toggleSidebar} />
        </Animated.View>

        <HeaderWithSidebar onToggleSidebar={toggleSidebar} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Current Budget Hero ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
            <Text style={styles.heroLabel}>This Month's Budget</Text>
            <Text style={styles.heroAmount}>K {currentBudget.toLocaleString()}</Text>
            <Text style={styles.heroMonth}>
              {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}
            </Text>
          </View>

          {/* ── Month Picker Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="calendar" size={18} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Select Month</Text>
            </View>
            <MonthYearPicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelectMonth={setSelectedMonth}
              onSelectYear={setSelectedYear}
            />
          </View>

          {/* ── Amount Input Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#f97316' }]}>
                <Ionicons name="cash" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {existingForSelected !== undefined ? 'Update Budget' : 'Set Budget'}
                </Text>
                <Text style={styles.cardSubtitle}>{selectedLabel}</Text>
              </View>
              {existingForSelected !== undefined && (
                <View style={styles.existingBadge}>
                  <Text style={styles.existingBadgeText}>K {existingForSelected.toLocaleString()}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.currencyPrefix}>K</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={inputBudget}
                onChangeText={setInputBudget}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Budget for {selectedLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Budget History ── */}
          {historyEntries.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrap, { backgroundColor: '#8b5cf6' }]}>
                  <Ionicons name="time" size={18} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>Budget History</Text>
              </View>
              <View style={styles.historyList}>
                {historyEntries.map(([key, val]) => {
                  const [, yr, mo] = key.split('_');
                  const label = `${MONTHS[parseInt(mo)]} ${yr}`;
                  return (
                    <HistoryItem
                      key={key}
                      label={label}
                      amount={val}
                      isActive={key === todayKey}
                    />
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <StatusBar style="light" />
      </View>
      <Footer />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover', backgroundColor: 'rgba(1, 37, 20, 0.6)' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(1, 37, 20, 0.6)' },
  root: { flex: 1 },

  sidebarWrap: {
    position: 'absolute', top: 0, left: 0,
    width: '50%', height: Dimensions.get('window').height,
    zIndex: 20, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Hero
  heroCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 51, 11, 0.9)',
    borderRadius: 20, padding: 28,
    marginBottom: 16, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  heroLabel: {
    fontSize: 13, color: 'rgba(255,255,255,0.9)',
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1,
  },
  heroMonth: {
    fontSize: 13, color: 'rgba(255,255,255,0.9)',
    fontWeight: '500', marginTop: 6,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(7, 51, 11, 0.9)',
    borderRadius: 18, padding: 16,
    marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 18,
  },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  existingBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  existingBadgeText: { fontSize: 13, fontWeight: '700', color: '#4ade80' },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16, height: 64,
  },
  currencyPrefix: {
    fontSize: 26, fontWeight: '800', color: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  input: {
    flex: 1, fontSize: 28, fontWeight: '800', color: '#fff',
  },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingVertical: 14, gap: 8,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // History
  historyList: { borderRadius: 10, overflow: 'hidden' },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  Animated, StyleSheet, Text, View, Platform, ImageBackground,
  Dimensions, TextInput, TouchableOpacity, ScrollView, FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const backgroundImage = require('@/assets/images/budget.webp');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const FULL_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const ICON_COLORS: Record<string, string> = {
  '1': '#3b82f6', '2': '#8b5cf6', '3': '#f59e0b',
  '4': '#ec4899', '5': '#06b6d4', '6': '#f97316', '7': '#6b7280',
};
const getColor = (key: string) => ICON_COLORS[key] ?? '#22c55e';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

// ── Month Selector Strip ───────────────────────────────────────────────────
function MonthStrip({
  selectedMonth, selectedYear, onSelectMonth, onYearChange,
}: {
  selectedMonth: number; selectedYear: number;
  onSelectMonth: (m: number) => void; onYearChange: (y: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to selected month
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, selectedMonth - 2) * 56, animated: true });
    }, 100);
  }, [selectedMonth]);

  return (
    <View style={stripStyles.wrap}>
      <View style={stripStyles.yearRow}>
        <TouchableOpacity onPress={() => onYearChange(selectedYear - 1)} style={stripStyles.arrow}>
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={stripStyles.yearText}>{selectedYear}</Text>
        <TouchableOpacity onPress={() => onYearChange(selectedYear + 1)} style={stripStyles.arrow}>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stripStyles.strip}
      >
        {MONTHS.map((m, i) => {
          const isSelected = i === selectedMonth;
          return (
            <TouchableOpacity
              key={m}
              style={[stripStyles.chip, isSelected && stripStyles.chipActive]}
              onPress={() => onSelectMonth(i)}
              activeOpacity={0.75}
            >
              <Text style={[stripStyles.chipText, isSelected && stripStyles.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const stripStyles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 12,
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  yearRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 12, gap: 16,
  },
  arrow: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  yearText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  strip: { paddingHorizontal: 2, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: '#16a34a', borderColor: '#22c55e',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  chipTextActive: { color: '#fff', fontWeight: '800' },
});

// ── Summary Bar ────────────────────────────────────────────────────────────
function SummaryBar({ budget, expense }: { budget: number; expense: number }) {
  const pct = budget > 0 ? Math.min((expense / budget) * 100, 100) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 80 ? '#f97316' : '#22c55e';
  const remaining = budget - expense;

  return (
    <View style={sumStyles.wrap}>
      <View style={sumStyles.row}>
        <View style={sumStyles.col}>
          <Text style={sumStyles.label}>Budget</Text>
          <Text style={[sumStyles.value, { color: '#4ade80' }]}>K {budget.toLocaleString()}</Text>
        </View>
        <View style={[sumStyles.col, { alignItems: 'center' }]}>
          <Text style={sumStyles.label}>Used</Text>
          <Text style={[sumStyles.value, { color: barColor }]}>{pct.toFixed(1)}%</Text>
        </View>
        <View style={[sumStyles.col, { alignItems: 'flex-end' }]}>
          <Text style={sumStyles.label}>Remaining</Text>
          <Text style={[sumStyles.value, { color: remaining < 0 ? '#ef4444' : '#60a5fa' }]}>
            K {remaining.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={sumStyles.track}>
        <Animated.View style={[sumStyles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <View style={sumStyles.expRow}>
        <Ionicons name="trending-up-outline" size={13} color="rgba(255,255,255,0.4)" />
        <Text style={sumStyles.expText}>Total spent: K {expense.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  col: { flex: 1 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 17, fontWeight: '800' },
  track: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 99, overflow: 'hidden', marginBottom: 10,
  },
  fill: { height: '100%', borderRadius: 99 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
});

// ── Category Card ──────────────────────────────────────────────────────────
function CategoryCard({
  item, totalBudget, onPress, onChangeAmount,
}: {
  item: any; totalBudget: number; onPress: () => void; onChangeAmount: (t: string) => void;
}) {
  const accent = getColor(item.key);
  const spent = parseFloat(item.amount.replace('K', '').replace(',', '').trim()) || 0;
  const pct = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const isAlert = pct >= 80;

  return (
    <View style={[cardStyles.card, isAlert && cardStyles.cardAlert, { borderLeftColor: accent }]}>
      <TouchableOpacity style={cardStyles.left} onPress={onPress} activeOpacity={0.75}>
        <View style={[cardStyles.iconCircle, { backgroundColor: accent + '20' }]}>
          <Ionicons name={item.icon} size={20} color={accent} />
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{item.name}</Text>
          <View style={cardStyles.barTrack}>
            <View style={[cardStyles.barFill, {
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: isAlert ? '#ef4444' : accent,
            }]} />
          </View>
          <Text style={cardStyles.pctText}>
            {pct.toFixed(1)}% of budget
            {isAlert && <Text style={{ color: '#ef4444' }}> ⚠</Text>}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={[cardStyles.amountPill, { borderColor: accent + '40' }]}>
        <TextInput
          style={[cardStyles.amountText, { color: accent }]}
          value={item.amount}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardAlert: { backgroundColor: '#fff7f7', borderLeftColor: '#ef4444' },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 42, height: 42, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  barTrack: {
    height: 5, backgroundColor: '#f3f4f6',
    borderRadius: 99, overflow: 'hidden', width: '85%', marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 99 },
  pctText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  amountPill: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    minWidth: 80, alignItems: 'center', borderWidth: 1,
    backgroundColor: '#f9fafb',
  },
  amountText: { fontSize: 14, fontWeight: '800' },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function Categories() {
  const router = useRouter();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-SCREEN_WIDTH * 0.45)).current;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [categories, setCategories] = useState([
    { name: 'Home & Utilities',   key: '1', amount: 'K0.00', icon: 'home' },
    { name: 'Insurance',          key: '2', amount: 'K0.00', icon: 'shield-checkmark' },
    { name: 'Groceries',          key: '3', amount: 'K0.00', icon: 'cart' },
    { name: 'Personal & Medical', key: '4', amount: 'K0.00', icon: 'medkit' },
    { name: 'Entertainment',      key: '5', amount: 'K0.00', icon: 'film' },
    { name: 'Transport',          key: '6', amount: 'K0.00', icon: 'car' },
    { name: 'Other Utils',        key: '7', amount: 'K0.00', icon: 'ellipsis-horizontal' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Key for per-month category data
  const monthKey = `categories_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
  const budgetKey = `budget_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;

  const loadDataForMonth = async () => {
    try {
      // Load budget (per-month first, fallback to legacy)
      const hist = await AsyncStorage.getItem('budgetHistory');
      const budgetHistory = hist ? JSON.parse(hist) : {};
      const legacyBudget = await AsyncStorage.getItem('budget');

      // Use per-month budget if available, else legacy
      const isCurrentMonth =
        selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
      const budget =
        budgetHistory[budgetKey] ??
        (isCurrentMonth && legacyBudget ? JSON.parse(legacyBudget) : 0);
      setTotalBudget(budget);

      // Load categories for this month (or current stored categories for current month)
      const savedMonthCats = await AsyncStorage.getItem(monthKey);
      if (savedMonthCats) {
        const cats = JSON.parse(savedMonthCats);
        setCategories(cats);
        const expense = cats.reduce((s: number, c: any) =>
          s + (parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0), 0);
        setTotalExpense(expense);
      } else if (isCurrentMonth) {
        // Current month: use live categories
        const savedCats = await AsyncStorage.getItem('categories');
        const savedExp = await AsyncStorage.getItem('totalExpense');
        if (savedCats) {
          const cats = JSON.parse(savedCats);
          setCategories(cats);
        }
        if (savedExp) setTotalExpense(JSON.parse(savedExp));
      } else {
        // Past month with no data — show zeroed out
        setCategories(prev => prev.map(c => ({ ...c, amount: 'K0.00' })));
        setTotalExpense(0);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadDataForMonth(); }, [selectedMonth, selectedYear]);

  useFocusEffect(React.useCallback(() => { loadDataForMonth(); }, [selectedMonth, selectedYear]));

  useEffect(() => {
    if (Device.isDevice) {
      Notifications.getPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') Notifications.requestPermissionsAsync();
      });
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }
  }, []);

  useEffect(() => {
    if (totalBudget <= 0) return;
    const pct = (totalExpense / totalBudget) * 100;
    if (pct >= 100) {
      Notifications.scheduleNotificationAsync({ content: { title: 'Kushota: Budget Exceeded!', body: 'Zathapo! 100% used.' }, trigger: null });
    } else if (pct >= 90) {
      Notifications.scheduleNotificationAsync({ content: { title: 'Kushota: 90% Reached!', body: 'Uduka!' }, trigger: null });
    } else if (pct >= 80) {
      Notifications.scheduleNotificationAsync({ content: { title: 'Kushota: 80% Used', body: 'Review your expenses.' }, trigger: null });
    }
  }, [totalExpense]);

  const updateCategoryAmount = async (key: string, newAmount: string) => {
    const updated = categories.map(c => c.key === key ? { ...c, amount: newAmount } : c);
    setCategories(updated);

    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) {
      await AsyncStorage.setItem('categories', JSON.stringify(updated));
    }
    await AsyncStorage.setItem(monthKey, JSON.stringify(updated));

    const expense = updated.reduce((s, c) =>
      s + (parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0), 0);
    setTotalExpense(expense);
    if (isCurrentMonth) await AsyncStorage.setItem('totalExpense', JSON.stringify(expense));
  };

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      Animated.timing(sidebarAnimation, { toValue: -SCREEN_WIDTH * 0.45, duration: 250, useNativeDriver: true })
        .start(() => setIsSidebarVisible(false));
    } else {
      setIsSidebarVisible(true);
      Animated.timing(sidebarAnimation, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  return (
    <ImageBackground source={backgroundImage} style={styles.bg}>
      <View style={styles.overlay} />

      <View style={styles.root}>
        {isSidebarVisible && (
          <Animated.View style={[styles.sidebarWrap, { transform: [{ translateX: sidebarAnimation }] }]}>
            <Sidebar onClose={toggleSidebar} />
          </Animated.View>
        )}

        <View style={styles.main}>
          <HeaderWithSidebar onToggleSidebar={toggleSidebar} />

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── Month Strip ── */}
            <MonthStrip
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelectMonth={setSelectedMonth}
              onYearChange={y => setSelectedYear(y)}
            />

            {/* ── Month Label ── */}
            <View style={styles.monthLabelRow}>
              <Ionicons name="calendar" size={16} color="#4ade80" />
              <Text style={styles.monthLabel}>
                {FULL_MONTHS[selectedMonth]} {selectedYear}
              </Text>
              {isCurrentMonth && (
                <View style={styles.currentChip}>
                  <Text style={styles.currentChipText}>Current</Text>
                </View>
              )}
              {!isCurrentMonth && (
                <View style={styles.pastChip}>
                  <Text style={styles.pastChipText}>Past month</Text>
                </View>
              )}
            </View>

            {/* ── Budget Summary ── */}
            {totalBudget > 0
              ? <SummaryBar budget={totalBudget} expense={totalExpense} />
              : (
                <TouchableOpacity
                  style={styles.noBudgetBanner}
                  onPress={() => router.push('/Budget')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="wallet-outline" size={18} color="#f97316" />
                  <Text style={styles.noBudgetText}>
                    No budget set for this month — tap to add one
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#f97316" />
                </TouchableOpacity>
              )
            }

            {/* ── Search ── */}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Section header ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.sectionSub}>{filtered.length} items</Text>
            </View>

            {/* ── Category Cards ── */}
            {filtered.map(item => (
              <CategoryCard
                key={item.key}
                item={item}
                totalBudget={totalBudget}
                onPress={() => router.push({ pathname: '/details', params: { name: item.name, amount: item.amount, icon: item.icon } })}
                onChangeAmount={text => updateCategoryAmount(item.key, text)}
              />
            ))}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>

        <StatusBar style="light" />
      </View>
      <Footer />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,15,8,0.62)' },
  root: { flex: 1 },
  sidebarWrap: {
    position: 'absolute', top: 0, left: 0,
    width: '45%', height: Dimensions.get('window').height,
    zIndex: 20, elevation: 10,
  },
  main: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  // Month label
  monthLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  monthLabel: { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1 },
  currentChip: {
    backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)',
  },
  currentChipText: { fontSize: 11, color: '#4ade80', fontWeight: '700' },
  pastChip: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  pastChipText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  // No budget banner
  noBudgetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
  },
  noBudgetText: { flex: 1, fontSize: 13, color: '#fdba74', fontWeight: '600' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, height: 44,
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },

  // Section header
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  sectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
});
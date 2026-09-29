import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ImageBackground, Dimensions,
  ScrollView, Animated, TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const backgroundImage = require('@/assets/images/budget.webp');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const FULL_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const CATEGORY_COLORS = [
  '#22c55e','#3b82f6','#f59e0b','#ec4899',
  '#06b6d4','#f97316','#8b5cf6',
];

const DEFAULT_CATEGORIES = [
  { name: 'Home & Utilities',   key: '1', amount: 'K0.00' },
  { name: 'Insurance',          key: '2', amount: 'K0.00' },
  { name: 'Groceries',          key: '3', amount: 'K0.00' },
  { name: 'Personal & Medical', key: '4', amount: 'K0.00' },
  { name: 'Entertainment',      key: '5', amount: 'K0.00' },
  { name: 'Transport',          key: '6', amount: 'K0.00' },
  { name: 'Other Utils',        key: '7', amount: 'K0.00' },
];

// ── Month Strip ────────────────────────────────────────────────────────────
function MonthStrip({ selectedMonth, selectedYear, onSelectMonth, onYearChange }: {
  selectedMonth: number; selectedYear: number;
  onSelectMonth: (m: number) => void; onYearChange: (y: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, selectedMonth - 2) * 56, animated: true });
    }, 100);
  }, [selectedMonth]);

  return (
    <View style={stripStyles.wrap}>
      <View style={stripStyles.yearRow}>
        <TouchableOpacity style={stripStyles.arrow} onPress={() => onYearChange(selectedYear - 1)}>
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={stripStyles.yearText}>{selectedYear}</Text>
        <TouchableOpacity style={stripStyles.arrow} onPress={() => onYearChange(selectedYear + 1)}>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stripStyles.strip}>
        {MONTHS.map((m, i) => {
          const isActive = i === selectedMonth;
          return (
            <TouchableOpacity
              key={m}
              style={[stripStyles.chip, isActive && stripStyles.chipActive]}
              onPress={() => onSelectMonth(i)}
              activeOpacity={0.75}
            >
              <Text style={[stripStyles.chipText, isActive && stripStyles.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
const stripStyles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 16 },
  arrow: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  yearText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  strip: { paddingHorizontal: 2, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#22c55e', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
  chipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  chipTextActive: { color: '#fff', fontWeight: '800' },
});

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={17} color={color} />
      </View>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 13, marginHorizontal: 4,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 10, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  value: { fontSize: 15, fontWeight: '800' },
});

// ── Legend Item ────────────────────────────────────────────────────────────
function LegendItem({ name, amount, color, pct }: { name: string; amount: number; color: string; pct: number }) {
  return (
    <View style={legendStyles.row}>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
      <Text style={legendStyles.name} numberOfLines={1}>{name}</Text>
      <View style={legendStyles.barWrap}>
        <View style={[legendStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[legendStyles.amount, { color }]}>K {amount.toLocaleString()}</Text>
    </View>
  );
}
const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { width: 110, fontSize: 12, color: '#374151', fontWeight: '600' },
  barWrap: { flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  amount: { fontSize: 12, fontWeight: '800', minWidth: 70, textAlign: 'right' },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function Charts() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.55)).current;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [activeChart, setActiveChart] = useState<'pie' | 'bar'>('pie');

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const monthKey = `categories_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
  const budgetKey = `budget_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const loadData = async () => {
    try {
      // Budget
      const hist = await AsyncStorage.getItem('budgetHistory');
      const budgetHistory = hist ? JSON.parse(hist) : {};
      const legacyBudget = await AsyncStorage.getItem('budget');
      const budget = budgetHistory[budgetKey] ?? (isCurrentMonth && legacyBudget ? JSON.parse(legacyBudget) : 0);
      setTotalBudget(budget);

      // Categories
      const savedMonthCats = await AsyncStorage.getItem(monthKey);
      if (savedMonthCats) {
        const cats = JSON.parse(savedMonthCats);
        setCategories(cats);
        const exp = cats.reduce((s: number, c: any) =>
          s + (parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0), 0);
        setTotalExpense(exp);
      } else if (isCurrentMonth) {
        const savedCats = await AsyncStorage.getItem('categories');
        const savedExp = await AsyncStorage.getItem('totalExpense');
        if (savedCats) setCategories(JSON.parse(savedCats));
        if (savedExp) setTotalExpense(JSON.parse(savedExp));
      } else {
        setCategories(DEFAULT_CATEGORIES);
        setTotalExpense(0);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [selectedMonth, selectedYear]);

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      Animated.timing(sidebarAnim, { toValue: -SCREEN_WIDTH * 0.45, duration: 200, useNativeDriver: true })
        .start(() => setIsSidebarVisible(false));
    } else {
      setIsSidebarVisible(true);
      Animated.timing(sidebarAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  };

  // Chart data
  const nonZeroCategories = categories.filter(c =>
    (parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0) > 0
  );

  const pieData = nonZeroCategories.map((c, i) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    amount: parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0,
    color: CATEGORY_COLORS[parseInt(c.key) - 1] ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    legendFontColor: '#6b7280',
    legendFontSize: 10,
  }));

  const barData = {
    labels: categories.map(c => c.name.split(' ')[0]),
    datasets: [{
      data: categories.map(c => parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0),
    }],
  };

  const remaining = totalBudget - totalExpense;
  const usedPct = totalBudget > 0 ? ((totalExpense / totalBudget) * 100).toFixed(1) : '0';
  const barColor = Number(usedPct) >= 90 ? '#ef4444' : Number(usedPct) >= 80 ? '#f97316' : '#22c55e';

  return (
    <View style={styles.bg}>
      <View style={styles.overlay} />

      <View style={styles.root}>
        <Animated.View style={[styles.sidebarWrap, { transform: [{ translateX: sidebarAnim }] }]}>
          <Sidebar onClose={toggleSidebar} />
        </Animated.View>

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
            <View style={styles.monthRow}>
              <Ionicons name="bar-chart" size={16} color="#4ade80" />
              <Text style={styles.monthLabel}>{FULL_MONTHS[selectedMonth]} {selectedYear}</Text>
              {isCurrentMonth
                ? <View style={styles.currentChip}><Text style={styles.currentChipText}>Live</Text></View>
                : <View style={styles.pastChip}><Text style={styles.pastChipText}>Historical</Text></View>
              }
            </View>

            {/* ── Stat Cards ── */}
            <View style={styles.statsRow}>
              <StatCard label="Budget" value={`K ${totalBudget.toLocaleString()}`} icon="wallet-outline" color="#22c55e" />
              <StatCard label="Spent" value={`K ${totalExpense.toLocaleString()}`} icon="trending-up-outline" color="#f97316" />
              <StatCard
                label="Remaining"
                value={`K ${Math.abs(remaining).toLocaleString()}`}
                icon="cash-outline"
                color={remaining < 0 ? '#ef4444' : '#3b82f6'}
              />
            </View>

            {/* ── Budget Progress ── */}
            {totalBudget > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Budget Usage</Text>
                  <Text style={[styles.progressPct, { color: barColor }]}>{usedPct}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(Number(usedPct), 100)}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            )}

            {/* ── Chart Toggle ── */}
            <View style={styles.toggleRow}>
              {(['pie', 'bar'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleBtn, activeChart === type && styles.toggleBtnActive]}
                  onPress={() => setActiveChart(type)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={type === 'pie' ? 'pie-chart-outline' : 'bar-chart-outline'}
                    size={15}
                    color={activeChart === type ? '#fff' : 'rgba(255,255,255,0.5)'}
                  />
                  <Text style={[styles.toggleText, activeChart === type && styles.toggleTextActive]}>
                    {type === 'pie' ? 'Pie Chart' : 'Bar Chart'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {nonZeroCategories.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pie-chart-outline" size={52} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyTitle}>No data for this month</Text>
                <Text style={styles.emptySubtitle}>Add expenses in Categories or Transactions</Text>
              </View>
            ) : (
              <>
                {/* ── Pie Chart ── */}
                {activeChart === 'pie' && (
                  <View style={styles.chartCard}>
                    <View style={styles.chartCardHeader}>
                      <View style={styles.chartIconWrap}>
                        <Ionicons name="pie-chart" size={16} color="#fff" />
                      </View>
                      <Text style={styles.chartTitle}>Expense Distribution</Text>
                    </View>
                    <PieChart
                      data={pieData}
                      width={CHART_WIDTH}
                      height={200}
                      chartConfig={{ color: (opacity = 1) => `rgba(34,197,94,${opacity})` }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="10"
                      absolute
                      hasLegend={false}
                    />
                    {/* Custom legend */}
                    <View style={styles.legendWrap}>
                      {nonZeroCategories.map((c, i) => {
                        const amt = parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0;
                        const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                        const color = CATEGORY_COLORS[parseInt(c.key) - 1] ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                        return (
                          <LegendItem key={c.key} name={c.name} amount={amt} color={color} pct={pct} />
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* ── Bar Chart ── */}
                {activeChart === 'bar' && (
                  <View style={styles.chartCard}>
                    <View style={styles.chartCardHeader}>
                      <View style={[styles.chartIconWrap, { backgroundColor: '#f97316' }]}>
                        <Ionicons name="bar-chart" size={16} color="#fff" />
                      </View>
                      <Text style={styles.chartTitle}>Spending by Category</Text>
                    </View>
                    <BarChart
                      data={barData}
                      width={CHART_WIDTH - 8}
                      height={280}
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
                        labelColor: () => '#6b7280',
                        barPercentage: 0.65,
                        propsForBackgroundLines: { strokeWidth: 1, stroke: '#f3f4f6' },
                        propsForLabels: { fontSize: 10, fontWeight: '600' },
                      }}
                      style={{ marginVertical: 12, borderRadius: 8 }}
                      verticalLabelRotation={30}
                      showValuesOnTopOfBars
                    />
                    {/* Category breakdown below bar chart */}
                    <View style={styles.legendWrap}>
                      {categories.map((c, i) => {
                        const amt = parseFloat(c.amount.replace('K', '').replace(',', '').trim()) || 0;
                        if (amt === 0) return null;
                        const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                        const color = CATEGORY_COLORS[parseInt(c.key) - 1] ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                        return <LegendItem key={c.key} name={c.name} amount={amt} color={color} pct={pct} />;
                      })}
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>

        <StatusBar style="light" />
        <Footer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover', backgroundColor: 'rgba(7, 51, 11, 0.9)' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,15,8,0.62)' },
  root: { flex: 1 },
  sidebarWrap: {
    position: 'absolute', top: 0, left: 0,
    width: '45%', height: Dimensions.get('window').height,
    backgroundColor: 'white', zIndex: 20, elevation: 5,
  },
  main: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Month label
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
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

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 14 },

  // Progress
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressPct: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },

  // Chart toggle
  toggleRow: {
    flexDirection: 'row', gap: 10,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleBtnActive: {
    backgroundColor: '#16a34a', borderColor: '#22c55e',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },
  toggleText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  toggleTextActive: { color: '#fff' },

  // Chart card
  chartCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
    marginBottom: 14,
  },
  chartCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  chartIconWrap: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center',
  },
  chartTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Legend
  legendWrap: {
    borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 12, paddingTop: 12,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  emptySubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link, useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, icon, isLink, href }) {
  const content = (
    <View style={[statStyles.card, accent && { borderTopColor: accent }]}>
      <View style={statStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={accent || '#22c55e'} />
      </View>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, accent && { color: accent }]}>{value}</Text>
    </View>
  );

  if (isLink && href) {
    return <Link href={href} style={{ flex: 1 }}>{content}</Link>;
  }

  return <View style={{ flex: 1 }}>{content}</View>;
}

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 5,
    borderTopWidth: 3,
    borderTopColor: '#22c55e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
});

// ── Progress Bar ───────────────────────────────────────────────────────────
function BudgetProgress({ spent, total }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 80 ? '#f97316' : '#22c55e';

  return (
    <View style={progressStyles.wrap}>
      <View style={progressStyles.row}>
        <Text style={progressStyles.label}>Budget usage</Text>
        <Text style={[progressStyles.pct, { color }]}>
          {pct.toFixed(1)}%
        </Text>
      </View>

      <View style={progressStyles.track}>
        <View
          style={[
            progressStyles.fill,
            {
              width: `${pct}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  pct: {
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});

// ── Category Row ───────────────────────────────────────────────────────────
const ICON_COLORS = {
  '1': '#3b82f6',
  '2': '#8b5cf6',
  '3': '#f59e0b',
  '4': '#ec4899',
  '5': '#06b6d4',
  '6': '#f97316',
  '7': '#6b7280',
};

function CategoryRow({ item, totalBudget, onPress, onChangeAmount }) {
  const spentAmt =
    parseFloat(
      item.amount.replace('K', '').replace(',', '').trim()
    ) || 0;

  const pct = totalBudget > 0
    ? (spentAmt / totalBudget) * 100
    : 0;

  const accent = ICON_COLORS[item.key] || '#22c55e';
  const isOver = pct >= 80;

  return (
    <View style={[catStyles.row, isOver && catStyles.rowAlert]}>
      <TouchableOpacity
        style={catStyles.left}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            catStyles.iconCircle,
            { backgroundColor: accent + '1a' },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={accent}
          />
        </View>

        <View style={catStyles.info}>
          <Text style={catStyles.name}>{item.name}</Text>

          <View style={catStyles.miniBar}>
            <View
              style={[
                catStyles.miniFill,
                {
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: isOver ? '#ef4444' : accent,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>

      <View style={catStyles.amountWrap}>
        <TextInput
          style={[catStyles.amount, { color: accent }]}
          value={item.amount}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );
}

const catStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  rowAlert: {
    backgroundColor: '#fff7f7',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  miniBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 99,
    overflow: 'hidden',
    width: '80%',
  },
  miniFill: {
    height: '100%',
    borderRadius: 99,
  },
  amountWrap: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const sidebarAnimation = useRef(
    new Animated.Value(-SCREEN_WIDTH * 0.45)
  ).current;

  const [categories, setCategories] = useState([
    {
      name: 'Home & Utilities',
      key: '1',
      amount: 'K0.00',
      icon: 'home',
    },
    {
      name: 'Insurance',
      key: '2',
      amount: 'K0.00',
      icon: 'shield-checkmark',
    },
    {
      name: 'Groceries',
      key: '3',
      amount: 'K0.00',
      icon: 'cart',
    },
    {
      name: 'Personal & Medical',
      key: '4',
      amount: 'K0.00',
      icon: 'medkit',
    },
    {
      name: 'Entertainment',
      key: '5',
      amount: 'K0.00',
      icon: 'film',
    },
    {
      name: 'Transport',
      key: '6',
      amount: 'K0.00',
      icon: 'car',
    },
    {
      name: 'Other Utils',
      key: '7',
      amount: 'K0.00',
      icon: 'ellipsis-horizontal',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Keeps track of the previous budget percentage
  // so alerts only appear when crossing a threshold.
  const previousPercentage = useRef<number | null>(null);

  const loadBudgetAndExpense = async () => {
    try {
      const b = await AsyncStorage.getItem('budget');
      const e = await AsyncStorage.getItem('totalExpense');
      const c = await AsyncStorage.getItem('categories');

      if (b) setTotalBudget(JSON.parse(b));
      if (e) setTotalExpense(JSON.parse(e));
      if (c) setCategories(JSON.parse(c));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const done = await AsyncStorage.getItem('isInitialized');

        if (!done) {
          await AsyncStorage.setItem(
            'categories',
            JSON.stringify(categories)
          );

          await AsyncStorage.setItem(
            'budget',
            JSON.stringify(0)
          );

          await AsyncStorage.setItem(
            'totalExpense',
            JSON.stringify(0)
          );

          await AsyncStorage.setItem(
            'isInitialized',
            JSON.stringify(true)
          );
        } else {
          loadBudgetAndExpense();
        }
      } catch (e) {
        console.error(e);
      }
    };

    init();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadBudgetAndExpense();
    }, [])
  );

  // ── Kushota Alert ──────────────────────────────────────────────────────
  useEffect(() => {
    if (totalBudget <= 0) {
      previousPercentage.current = null;
      return;
    }

    const pct = (totalExpense / totalBudget) * 100;

    // Establish the initial percentage without showing
    // an alert when existing data is first loaded.
    if (previousPercentage.current === null) {
      previousPercentage.current = pct;
      return;
    }

    const previous = previousPercentage.current;

    if (previous < 80 && pct >= 80 && pct < 90) {
      Alert.alert(
        '📢 80% Budget Used',
        'Review your expenses soon.'
      );
    } else if (previous < 90 && pct >= 90 && pct < 100) {
      Alert.alert(
        '⚠️ 90% Budget Reached!',
        'Uduka! Almost at your limit.'
      );
    } else if (previous < 100 && pct >= 100) {
      Alert.alert(
        '🚨 Budget Exceeded!',
        "Zathapo! You've used 100% of your budget."
      );
    }

    previousPercentage.current = pct;
  }, [totalExpense, totalBudget]);

  const updateCategoryAmount = async (
    key,
    newAmount
  ) => {
    const updated = categories.map(cat =>
      cat.key === key
        ? { ...cat, amount: newAmount }
        : cat
    );

    setCategories(updated);

    await AsyncStorage.setItem(
      'categories',
      JSON.stringify(updated)
    );

    const expense = updated.reduce((sum, cat) => {
      return (
        sum +
        (parseFloat(
          cat.amount
            .replace('K', '')
            .replace(',', '')
            .trim()
        ) || 0)
      );
    }, 0);

    setTotalExpense(expense);

    await AsyncStorage.setItem(
      'totalExpense',
      JSON.stringify(expense)
    );
  };

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      Animated.timing(sidebarAnimation, {
        toValue: -SCREEN_WIDTH * 0.45,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsSidebarVisible(false));
    } else {
      setIsSidebarVisible(true);

      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const remaining = totalBudget - totalExpense;

  return (
    <View
      style={styles.bg}
    >
      
      <View style={styles.overlay} />

      <View style={styles.root}>
        {isSidebarVisible && (
          <Animated.View
            style={[
              styles.sidebarOverlay,
              {
                transform: [
                  { translateX: sidebarAnimation },
                ],
              },
            ]}
          >
            <Sidebar onClose={toggleSidebar} />
          </Animated.View>
        )}

        <View style={styles.main}>
          <HeaderWithSidebar
            onToggleSidebar={toggleSidebar}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Search ── */}
            <View style={styles.searchWrap}>
              <Ionicons
                name="search"
                size={18}
                color="#9ca3af"
                style={styles.searchIcon}
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* ── 4 Stat Cards ── */}
            <View style={styles.statsRow}>
              <StatCard
                label="Budget"
                value={`K ${totalBudget.toLocaleString()}`}
                accent="#22c55e"
                icon="wallet-outline"
                isLink
                href="/Budget"
              />

              <StatCard
                label="Spent"
                value={`K ${totalExpense.toLocaleString()}`}
                accent="#f97316"
                icon="trending-up-outline"
              />
            </View>

            <View
              style={[
                styles.statsRow,
                { marginTop: 10 },
              ]}
            >
              <StatCard
                label="Remaining"
                value={`K ${remaining.toLocaleString()}`}
                accent={
                  remaining < 0
                    ? '#ef4444'
                    : '#3b82f6'
                }
                icon="cash-outline"
              />

              <StatCard
                label="Used"
                value={
                  totalBudget > 0
                    ? `${(
                        (totalExpense / totalBudget) *
                        100
                      ).toFixed(1)}%`
                    : '0%'
                }
                accent={
                  totalBudget > 0 &&
                  (totalExpense / totalBudget) * 100 >= 80
                    ? '#ef4444'
                    : '#8b5cf6'
                }
                icon="pie-chart-outline"
              />
            </View>

            {/* ── Progress Bar ── */}
            <View style={{ marginTop: 18 }}>
              <BudgetProgress
                spent={totalExpense}
                total={totalBudget}
              />
            </View>

            {/* ── Section Header ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Categories
              </Text>

              <Text style={styles.sectionSub}>
                {filtered.length} items
              </Text>
            </View>

            {/* ── Category List ── */}
            <View style={styles.listWrap}>
              {filtered.map(item => (
                <CategoryRow
                  key={item.key}
                  item={item}
                  totalBudget={totalBudget}
                  onPress={() =>
                    router.push({
                      pathname: '/details',
                      params: {
                        name: item.name,
                        amount: item.amount,
                        icon: item.icon,
                      },
                    })
                  }
                  onChangeAmount={text =>
                    updateCategoryAmount(
                      item.key,
                      text
                    )
                  }
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
      
      <Footer />
      <StatusBar style="light" />
    
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#023702', // CSS darkgreen
    resizeMode: 'cover',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 60, 0, 0.85)',
  },

  root: {
    flex: 1,
  },

  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: Dimensions.get('window').height,
    backgroundColor: 'white',
    zIndex: 20,
  },

  main: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  sectionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },

  // List
  listWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
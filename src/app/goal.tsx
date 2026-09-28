import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  TextInput,
  Alert,
  FlatList,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import DateTimePicker from '@react-native-community/datetimepicker';

const backgroundImage = require('@/assets/images/budget.webp');

type Goal = {
  goalName: string;
  amountSaved: number;
  goalAmount: number;
  targetDate: string;
};

const GREEN = '#2d6a2d';
const GREEN_LIGHT = '#e8f5e2';
const GREEN_MID = '#3d8c3d';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function progressColor(pct: number) {
  if (pct >= 100) return '#15803d';
  if (pct >= 60) return GREEN_MID;
  if (pct >= 30) return '#f59e0b';
  return '#ef4444';
}

export default function Goal() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [amountSaved, setAmountSaved] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const sidebarAnimation = useRef(
    new Animated.Value(-Dimensions.get('window').width * 0.45)
  ).current;
  const fileUri = `${FileSystem.documentDirectory}goals.json`;

  useEffect(() => {
    (async () => {
      try {
        const fileExists = await FileSystem.getInfoAsync(fileUri);
        if (fileExists.exists) {
          const data = await FileSystem.readAsStringAsync(fileUri);
          setGoals(JSON.parse(data));
        }
      } catch (e) {
        console.error('Error fetching goals:', e);
      }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: isSidebarVisible ? 0 : -Dimensions.get('window').width * 0.45,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSidebarVisible]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!goalName.trim()) errs.goalName = 'Goal name is required.';
    if (!amountSaved || isNaN(Number(amountSaved))) errs.amountSaved = 'Enter a valid number.';
    if (!goalAmount || isNaN(Number(goalAmount))) errs.goalAmount = 'Enter a valid number.';
    if (Number(amountSaved) > Number(goalAmount)) errs.amountSaved = 'Cannot exceed goal amount.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveGoal = async () => {
    if (!validate()) return;
    setIsLoading(true);

    const newGoal: Goal = {
      goalName: goalName.trim(),
      amountSaved: parseFloat(amountSaved),
      goalAmount: parseFloat(goalAmount),
      targetDate: targetDate.toISOString().split('T')[0],
    };

    const updatedGoals = [...goals, newGoal];
    try {
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
      setGoalName('');
      setAmountSaved('');
      setGoalAmount('');
      setTargetDate(new Date());
      setFormErrors({});
    } catch (e) {
      console.error('Error saving goal:', e);
      Alert.alert('Error', 'Failed to save the goal.');
    }
    setIsLoading(false);
  };

  const updateAmountSaved = async (index: number, newAmount: string) => {
    const val = parseFloat(newAmount);
    if (isNaN(val)) return;
    const updatedGoals = [...goals];
    updatedGoals[index] = { ...updatedGoals[index], amountSaved: val };
    try {
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    } catch (e) {
      console.error('Error updating goal:', e);
    }
  };

  const deleteGoal = (index: number) => {
    Alert.alert('Delete goal?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedGoals = goals.filter((_, i) => i !== index);
          try {
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedGoals));
            setGoals(updatedGoals);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete the goal.');
          }
        },
      },
    ]);
  };

  const renderGoalCard = ({ item, index }: { item: Goal; index: number }) => {
    const pct = Math.min((item.amountSaved / item.goalAmount) * 100, 100);
    const remaining = item.goalAmount - item.amountSaved;
    const days = daysUntil(item.targetDate);
    const color = progressColor(pct);
    const done = pct >= 100;

    return (
      <View style={styles.goalCard}>
        {/* Card header */}
        <View style={styles.goalCardHeader}>
          <View style={styles.goalIconCircle}>
            <MaterialIcons name={done ? 'emoji-events' : 'flag'} size={20} color={done ? '#f59e0b' : GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalCardTitle} numberOfLines={1}>{item.goalName}</Text>
            <Text style={styles.goalCardDate}>
              {done ? '🎉 Goal reached!' : `${days > 0 ? days + ' days left' : 'Overdue'} · ${item.targetDate}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => deleteGoal(index)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Amounts row */}
        <View style={styles.amountsRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Saved</Text>
            <Text style={[styles.amountValue, { color: GREEN }]}>
              K{item.amountSaved.toLocaleString()}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={styles.amountValue}>K{item.goalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={[styles.amountValue, { color: remaining > 0 ? '#ef4444' : GREEN }]}>
              K{remaining > 0 ? remaining.toLocaleString() : '0'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressPct, { color }]}>{pct.toFixed(1)}% complete</Text>
        </View>

        {/* Update saved amount */}
        <View style={styles.updateRow}>
          <Text style={styles.updateLabel}>Update saved amount</Text>
          <View style={styles.updateInputWrapper}>
            <Text style={styles.currencyPrefix}>K</Text>
            <TextInput
              style={styles.updateInput}
              value={String(item.amountSaved)}
              keyboardType="numeric"
              onChangeText={(v) => updateAmountSaved(index, v)}
              selectTextOnFocus
            />
          </View>
        </View>
      </View>
    );
  };

  const totalSaved = goals.reduce((s, g) => s + g.amountSaved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.goalAmount, 0);

  return (
    <ImageBackground source={backgroundImage} style={styles.bg}>
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <Animated.View style={[styles.sidebarOverlay, { transform: [{ translateX: sidebarAnimation }] }]}>
        <Sidebar onClose={() => setIsSidebarVisible(false)} />
      </Animated.View>

      <View style={styles.container}>
        <HeaderWithSidebar onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Summary strip */}
            {goals.length > 0 && (
              <View style={styles.summaryStrip}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{goals.length}</Text>
                  <Text style={styles.summaryLbl}>Goals</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>K{totalSaved.toLocaleString()}</Text>
                  <Text style={styles.summaryLbl}>Total saved</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>
                    {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
                  </Text>
                  <Text style={styles.summaryLbl}>Overall</Text>
                </View>
              </View>
            )}

            {/* Form card */}
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <View style={styles.formIconCircle}>
                  <MaterialIcons name="add-chart" size={20} color="#fff" />
                </View>
                <Text style={styles.formTitle}>New Financial Goal</Text>
              </View>

              {/* Goal name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Goal Name</Text>
                <View style={[styles.inputWrapper, formErrors.goalName ? styles.inputError : null]}>
                  <MaterialIcons name="flag" size={17} color="#6b7c6b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Emergency fund"
                    placeholderTextColor="#9aad9a"
                    value={goalName}
                    onChangeText={(t) => { setGoalName(t); setFormErrors((e) => ({ ...e, goalName: undefined as any })); }}
                  />
                </View>
                {formErrors.goalName ? <Text style={styles.fieldErr}>{formErrors.goalName}</Text> : null}
              </View>

              {/* Amounts row */}
              <View style={styles.twoCol}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Saved so far</Text>
                  <View style={[styles.inputWrapper, formErrors.amountSaved ? styles.inputError : null]}>
                    <Text style={styles.currencyPfx}>K</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9aad9a"
                      value={amountSaved}
                      onChangeText={(t) => { setAmountSaved(t); setFormErrors((e) => ({ ...e, amountSaved: undefined as any })); }}
                      keyboardType="numeric"
                    />
                  </View>
                  {formErrors.amountSaved ? <Text style={styles.fieldErr}>{formErrors.amountSaved}</Text> : null}
                </View>

                <View style={{ width: 10 }} />

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Goal amount</Text>
                  <View style={[styles.inputWrapper, formErrors.goalAmount ? styles.inputError : null]}>
                    <Text style={styles.currencyPfx}>K</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9aad9a"
                      value={goalAmount}
                      onChangeText={(t) => { setGoalAmount(t); setFormErrors((e) => ({ ...e, goalAmount: undefined as any })); }}
                      keyboardType="numeric"
                    />
                  </View>
                  {formErrors.goalAmount ? <Text style={styles.fieldErr}>{formErrors.goalAmount}</Text> : null}
                </View>
              </View>

              {/* Date picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Target Date</Text>
                <TouchableOpacity
                  style={styles.datePicker}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="event" size={17} color={GREEN} style={styles.inputIcon} />
                  <Text style={styles.dateText}>
                    {targetDate.toDateString()}
                  </Text>
                  <MaterialIcons name="chevron-right" size={18} color="#9aad9a" />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setTargetDate(selectedDate);
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                onPress={handleSaveGoal}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <MaterialIcons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 7 }} />
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving…' : 'Add Goal'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Goals list */}
            {goals.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="savings" size={48} color="rgba(255,255,255,0.35)" />
                <Text style={styles.emptyTitle}>No goals yet</Text>
                <Text style={styles.emptySubtitle}>Add your first financial goal above to get started.</Text>
              </View>
            ) : (
              goals.map((item, index) => (
                <View key={index}>
                  {renderGoalCard({ item, index })}
                </View>
              ))
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <Footer />
      </View>
    </ImageBackground>
  );
}

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
    height: Dimensions.get('window').height,
    backgroundColor: 'white',
    zIndex: 20,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },

  /* Summary strip */
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 16, fontWeight: '700', color: '#fff' },
  summaryLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  /* Form card */
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  formIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a2e1a',
  },

  /* Fields */
  fieldGroup: { marginBottom: 13 },
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
    height: 48,
  },
  inputError: { borderColor: '#fca5a5' },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: '#1a2e1a', paddingRight: 14 },
  currencyPfx: {
    paddingLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: GREEN,
  },
  fieldErr: { fontSize: 12, color: '#b91c1c', marginTop: 4 },
  twoCol: { flexDirection: 'row' },

  /* Date picker */
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1ddd1',
    borderRadius: 12,
    backgroundColor: '#f9fdf9',
    height: 48,
    paddingRight: 12,
  },
  dateText: { flex: 1, fontSize: 15, color: '#1a2e1a' },

  /* Save button */
  saveButton: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    maxWidth: 240,
  },

  /* Goal card */
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  goalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e8f5e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2e1a',
  },
  goalCardDate: {
    fontSize: 12,
    color: '#9aaa9a',
    marginTop: 1,
  },
  deleteBtn: {
    padding: 4,
  },

  /* Amounts */
  amountsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fdf9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5ebe5',
    marginBottom: 14,
    overflow: 'hidden',
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#e5ebe5',
    marginVertical: 8,
  },
  amountLabel: {
    fontSize: 10,
    color: '#9aaa9a',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2e1a',
  },

  /* Progress */
  progressTrack: {
    height: 8,
    backgroundColor: '#e5ebe5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Update row */
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5ebe5',
    paddingTop: 12,
    gap: 10,
  },
  updateLabel: {
    fontSize: 12,
    color: '#6b7c6b',
    fontWeight: '500',
    flex: 1,
  },
  updateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1ddd1',
    borderRadius: 10,
    backgroundColor: '#f9fdf9',
    height: 38,
    paddingLeft: 10,
    minWidth: 110,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
    marginRight: 2,
  },
  updateInput: {
    fontSize: 14,
    color: '#1a2e1a',
    flex: 1,
    paddingRight: 10,
  },
});
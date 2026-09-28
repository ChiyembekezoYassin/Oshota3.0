/**
 * ScanReceipt.tsx  (now supports Scan OR Manual entry)
 *
 * Dependencies to install:
 *   npx expo install expo-camera
 *   npx expo install expo-image-picker
 *   npm install @react-native-ml-kit/text-recognition
 *
 * Add to app.json plugins:
 *   ["expo-camera", { "cameraPermission": "Allow $(PRODUCT_NAME) to access camera to scan receipts." }]
 *
 * Route: add  { label: 'Add Transaction', icon: 'scan-outline', href: '/ScanReceipt' }
 *         to NAV_ITEMS in sidebar.tsx
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Sidebar from '@/components/sidebar';
import Footer from '@/components/footer';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  name: string;
  amount: string;
}

interface Transaction {
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface ParsedReceipt {
  merchant: string;
  amount: string;
  date: string;
  rawText: string;
}

type Mode = 'scan' | 'manual';

// ─── Category keyword map ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Groceries': [
    'shoprite', 'spar', 'pick n pay', 'checkers', 'woolworths food',
    'grocery', 'groceries', 'supermarket', 'food store', 'market',
    'fresh', 'bakery', 'butcher', 'produce', 'fruits', 'vegetables',
  ],
  'Transport': [
    'total', 'engen', 'bp', 'caltex', 'shell', 'fuel', 'petrol', 'diesel',
    'uber', 'bolt', 'taxi', 'bus', 'train', 'fare', 'transport',
    'parking', 'toll', 'vehicle',
  ],
  'Entertainment': [
    'restaurant', 'cafe', 'coffee', 'bar', 'pub', 'cinema', 'movies',
    'netflix', 'spotify', 'hotel', 'airbnb', 'game', 'sport',
    'steers', 'nandos', 'kfc', 'mcdonalds', 'pizza', 'chicken',
  ],
  'Home & Utilities': [
    'escom', 'electricity', 'water', 'council', 'rates', 'rent',
    'hardware', 'builders', 'plumb', 'gas', 'airtime', 'data', 'wifi',
    'internet', 'zesco', 'lusaka water',
  ],
  'Insurance': [
    'insurance', 'assurance', 'premium', 'policy', 'life', 'cover',
    'medical aid', 'britam', 'sanlam', 'old mutual', 'nhima',
  ],
  'Personal & Medical': [
    'pharmacy', 'chemist', 'clinic', 'hospital', 'doctor', 'health',
    'medical', 'salon', 'barber', 'beauty', 'cosmetics', 'clothing',
    'shoes', 'fashion', 'gym',
  ],
  'Other Utils': [
    'stationery', 'printing', 'airtel', 'mtn', 'zamtel', 'mobile',
    'school', 'university', 'fees', 'book',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchCategory(text: string, availableCategories: Category[]): string {
  const lower = text.toLowerCase();
  const available = availableCategories.map((c) => c.name);

  let bestCategory = '';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!available.includes(cat)) continue;
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory || available[0] || '';
}

function parseReceiptText(raw: string): ParsedReceipt {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const amountCandidates: number[] = [];
  const amountRe = /(?:k|zmw|mwk|total|amount|due|pay)\s*[:\s]?\s*([\d,]+\.?\d{0,2})/gi;
  let m: RegExpExecArray | null;
  while ((m = amountRe.exec(raw)) !== null) {
    const val = parseFloat(m[1].replace(',', ''));
    if (!isNaN(val)) amountCandidates.push(val);
  }
  const priceRe = /\b(\d{1,6}[.,]\d{2})\b/g;
  while ((m = priceRe.exec(raw)) !== null) {
    const val = parseFloat(m[1].replace(',', ''));
    if (!isNaN(val)) amountCandidates.push(val);
  }
  const amount =
    amountCandidates.length > 0
      ? Math.max(...amountCandidates).toFixed(2)
      : '';

  const dateRe =
    /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{1,2},?\s*\d{4})\b/gi;
  const dateMatch = dateRe.exec(raw);
  let parsedDate = '';
  if (dateMatch) {
    const d = new Date(dateMatch[0]);
    if (!isNaN(d.getTime())) {
      parsedDate = d.toISOString().split('T')[0];
    } else {
      parsedDate = dateMatch[0];
    }
  }
  if (!parsedDate) parsedDate = new Date().toISOString().split('T')[0];

  const skipWords = /^(receipt|invoice|tax|vat|tel|phone|www|http|date|time|cash|change|thank)/i;
  const merchant =
    lines.find(
      (l) => l.length > 3 && l.length < 60 && !skipWords.test(l) && !/^\d/.test(l)
    ) || 'Unknown Merchant';

  return { merchant, amount, date: parsedDate, rawText: raw };
}

// ─── Step indicator (scan mode only) ──────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Capture', 'Review', 'Confirm'];
  return (
    <View style={stepStyles.row}>
      {steps.map((label, i) => {
        const active = i + 1 === step;
        const done = i + 1 < step;
        return (
          <React.Fragment key={label}>
            <View style={stepStyles.item}>
              <View
                style={[
                  stepStyles.circle,
                  done && stepStyles.circleDone,
                  active && stepStyles.circleActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[stepStyles.num, active && stepStyles.numActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[stepStyles.label, active && stepStyles.labelActive]}>
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[stepStyles.line, done && stepStyles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  item: { alignItems: 'center', gap: 4 },
  circle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  circleDone: { backgroundColor: '#16a34a' },
  circleActive: { backgroundColor: '#fff' },
  num: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  numActive: { color: '#16a34a' },
  line: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },
  lineDone: { backgroundColor: '#16a34a' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  labelActive: { color: '#fff' },
});

// ─── Mode switch ──────────────────────────────────────────────────────────────

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const options: { key: Mode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'scan', label: 'Scan receipt', icon: 'camera-outline' },
    { key: 'manual', label: 'Enter manually', icon: 'create-outline' },
  ];
  return (
    <View style={modeStyles.wrap}>
      {options.map((o) => {
        const active = o.key === mode;
        return (
          <TouchableOpacity
            key={o.key}
            style={[modeStyles.btn, active && modeStyles.btnActive]}
            onPress={() => onChange(o.key)}
            activeOpacity={0.85}
          >
            <Ionicons name={o.icon} size={16} color={active ? '#16a34a' : 'rgba(255,255,255,0.65)'} />
            <Text style={[modeStyles.text, active && modeStyles.textActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const modeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    margin: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnActive: { backgroundColor: '#fff' },
  text: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  textActive: { color: '#16a34a' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

export default function Transactions() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  // UI state
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [mode, setMode] = useState<Mode>('scan');
  const [step, setStep] = useState<Step>(1);
  const [scanning, setScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Receipt data
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Editable form fields (shared by scan-confirm and manual entry)
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem('categories').then((val) => {
      if (val) setCategories(JSON.parse(val));
    });
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Reset helpers ──
  const clearForm = () => {
    setParsed(null);
    setFormDescription('');
    setFormAmount('');
    setFormCategory('');
    setFormDate(new Date());
    setShowDatePicker(false);
  };

  const resetFlow = () => {
    setStep(1);
    clearForm();
    setScanning(false);
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    clearForm();
    setStep(1);
    setScanning(false);
    setMode(next);
  };

  // ── Process image ──
  const processImage = async (uri: string) => {
    setScanning(true);
    setStep(2);
    try {
      const result = await TextRecognition.recognize(uri);
      const raw = result.blocks.map((b) => b.text).join('\n');
      if (!raw.trim()) {
        Alert.alert(
          'No text found',
          'The image was too blurry or had no readable text. Try again, or enter the transaction manually.',
          [
            { text: 'Enter manually', onPress: () => handleModeChange('manual') },
            { text: 'Retry', onPress: () => { setStep(1); setScanning(false); } },
          ]
        );
        return;
      }
      const receipt = parseReceiptText(raw);
      const suggestedCat = matchCategory(raw, categories);
      setParsed(receipt);
      setFormDescription(receipt.merchant);
      setFormAmount(receipt.amount);
      setFormCategory(suggestedCat);
      const d = new Date(receipt.date);
      setFormDate(isNaN(d.getTime()) ? new Date() : d);
      setStep(3);
    } catch (err) {
      console.error('OCR error:', err);
      Alert.alert('Error', 'Failed to read receipt. Please try again.');
      setStep(1);
    } finally {
      setScanning(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      await processImage(photo.uri);
    } catch (err) {
      console.error('Capture error:', err);
      Alert.alert('Error', 'Could not capture photo.');
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  // ── Save transaction ──
  const handleSave = async () => {
    if (!formCategory || !formAmount.trim() || !formDescription.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields before saving.');
      return;
    }
    const amountNum = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const [txRaw, catRaw, totalRaw] = await Promise.all([
        AsyncStorage.getItem('transactions'),
        AsyncStorage.getItem('categories'),
        AsyncStorage.getItem('totalExpense'),
      ]);
      const transactions: Transaction[] = txRaw ? JSON.parse(txRaw) : [];
      const cats: Category[] = catRaw ? JSON.parse(catRaw) : categories;
      const currentTotal: number = totalRaw ? JSON.parse(totalRaw) : 0;

      const newTx: Transaction = {
        category: formCategory,
        description: formDescription.trim(),
        amount: amountNum,
        date: formDate.toISOString().split('T')[0],
      };

      const updatedTx = [...transactions, newTx];
      const updatedCats = cats.map((cat) => {
        if (cat.name === formCategory) {
          const prev = parseFloat(cat.amount.replace('K', '').replace(',', '').trim()) || 0;
          return { ...cat, amount: `K ${(prev + newTx.amount).toFixed(2)}` };
        }
        return cat;
      });
      const newTotal = currentTotal + newTx.amount;

      await Promise.all([
        AsyncStorage.setItem('transactions', JSON.stringify(updatedTx)),
        AsyncStorage.setItem('categories', JSON.stringify(updatedCats)),
        AsyncStorage.setItem('totalExpense', JSON.stringify(newTotal)),
      ]);

      Alert.alert('✅ Saved!', `"${newTx.description}" added to ${formCategory}.`, [
        { text: 'View Transactions', onPress: () => router.push('/Transactions') },
        {
          text: mode === 'manual' ? 'Add Another' : 'Scan Another',
          onPress: resetFlow,
        },
      ]);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────── Shared form ─────────────────────────────────

  const renderForm = (isManual: boolean) => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.confirmScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Scan-only extras */}
      {!isManual && parsed && (
        <>
          <TouchableOpacity
            style={s.rawPreview}
            onPress={() => Alert.alert('Raw OCR Text', parsed.rawText, [{ text: 'Close' }])}
            activeOpacity={0.8}
          >
            <View style={s.rawPreviewLeft}>
              <MaterialIcons name="receipt-long" size={18} color="#16a34a" />
              <Text style={s.rawPreviewText}>View extracted receipt text</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <View style={s.aiBanner}>
            <View style={s.aiBannerLeft}>
              <MaterialIcons name="auto-awesome" size={16} color="#fbbf24" />
              <Text style={s.aiBannerText}>
                ML Kit detected:{' '}
                <Text style={s.aiBannerBold}>{formCategory || 'Unknown'}</Text>
              </Text>
            </View>
            <Text style={s.aiBannerSub}>Review and adjust below</Text>
          </View>
        </>
      )}

      <View style={s.formCard}>
        <View style={s.formCardHeader}>
          <View style={s.formCardIcon}>
            <Ionicons name={isManual ? 'add' : 'create-outline'} size={18} color="#fff" />
          </View>
          <Text style={s.formCardTitle}>
            {isManual ? 'New Transaction' : 'Confirm Transaction'}
          </Text>
        </View>

        <Text style={s.fieldLabel}>{isManual ? 'Description' : 'Merchant / Description'}</Text>
        <View style={s.inputWrap}>
          <Ionicons name="storefront-outline" size={16} color="#9ca3af" style={s.inputIcon} />
          <TextInput
            style={s.input}
            value={formDescription}
            onChangeText={setFormDescription}
            placeholder={isManual ? 'e.g. Shoprite groceries' : 'Merchant name'}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Text style={s.fieldLabel}>Amount (K)</Text>
        <View style={s.inputWrap}>
          <Ionicons name="cash-outline" size={16} color="#9ca3af" style={s.inputIcon} />
          <TextInput
            style={s.input}
            value={formAmount}
            onChangeText={setFormAmount}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={s.fieldLabel}>Category</Text>
        {categories.length === 0 ? (
          <Text style={s.emptyCats}>
            No categories yet. Create a category first, then come back to add transactions.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipsScroll}
            contentContainerStyle={s.chipsContent}
          >
            {categories.map((cat, i) => {
              const active = cat.name === formCategory;
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setFormCategory(cat.name)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={s.fieldLabel}>Date</Text>
        <TouchableOpacity
          style={s.dateBtn}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={16} color="#16a34a" />
          <Text style={s.dateBtnText}>{formDate.toDateString()}</Text>
          <Ionicons name="chevron-down" size={14} color="#9ca3af" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) setFormDate(selected);
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[s.saveBtn, saving && s.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        )}
        <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Transaction'}</Text>
      </TouchableOpacity>

      {isManual ? (
        <TouchableOpacity style={s.retryBtn} onPress={() => handleModeChange('scan')} activeOpacity={0.8}>
          <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={s.retryText}>Scan a receipt instead</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.retryBtn} onPress={resetFlow} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={s.retryText}>Scan a different receipt</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ─────────────────────────── Scan content ────────────────────────────────

  const renderScan = () => {
    // Permission handling only applies to camera mode
    if (!permission) return <View style={{ flex: 1 }} />;
    if (!permission.granted) {
      return (
        <View style={[s.center, { flex: 1 }]}>
          <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.4)" />
          <Text style={s.permTitle}>Camera access needed</Text>
          <Text style={s.permSub}>
            Grant camera permission to scan receipts, or enter the transaction manually.
          </Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.permLink} onPress={() => handleModeChange('manual')}>
            <Text style={s.permLinkText}>Enter manually instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <StepBar step={step} />

        {step === 1 && (
          <View style={s.cameraContainer}>
            <CameraView ref={cameraRef} style={s.camera} facing="back" enableTorch={flashOn}>
              <View style={s.viewfinderOuter}>
                <View style={s.viewfinder}>
                  <View style={[s.corner, s.cornerTL]} />
                  <View style={[s.corner, s.cornerTR]} />
                  <View style={[s.corner, s.cornerBL]} />
                  <View style={[s.corner, s.cornerBR]} />
                  <Text style={s.viewfinderHint}>Position receipt inside the frame</Text>
                </View>
              </View>

              <View style={s.camControls}>
                <TouchableOpacity
                  style={s.camSideBtn}
                  onPress={() => setFlashOn(!flashOn)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={flashOn ? 'flash' : 'flash-off'}
                    size={22}
                    color={flashOn ? '#fbbf24' : '#fff'}
                  />
                  <Text style={s.camSideBtnText}>{flashOn ? 'Flash On' : 'Flash'}</Text>
                </TouchableOpacity>

                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity style={s.captureBtn} onPress={handleCapture} activeOpacity={0.85}>
                    <View style={s.captureBtnInner}>
                      <Ionicons name="scan" size={28} color="#16a34a" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity style={s.camSideBtn} onPress={handleGallery} activeOpacity={0.8}>
                  <Ionicons name="images-outline" size={22} color="#fff" />
                  <Text style={s.camSideBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </CameraView>

            <View style={s.tipCard}>
              <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
              <Text style={s.tipText}>
                Use good lighting and hold the camera steady for best results.
              </Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={[s.center, { flex: 1 }]}>
            <View style={s.processingCard}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={s.processingTitle}>Reading receipt…</Text>
              <Text style={s.processingSub}>
                ML Kit is extracting text and detecting the category.
              </Text>
              <View style={s.processingSteps}>
                {['Detecting text regions', 'Extracting amounts & dates', 'Matching category'].map(
                  (label, i) => (
                    <View key={i} style={s.processingStep}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                      <Text style={s.processingStepText}>{label}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
        )}

        {step === 3 && parsed && renderForm(false)}
      </>
    );
  };

  // ─────────────────────────────── RENDER ───────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {isSidebarVisible && (
        <View style={s.sidebarOverlay}>
          <Sidebar onClose={() => setIsSidebarVisible(false)} />
        </View>
      )}

      <HeaderWithSidebar onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} />

      {/* Hide the switch while OCR is running */}
      {!(mode === 'scan' && step === 2) && (
        <ModeSwitch mode={mode} onChange={handleModeChange} />
      )}

      {mode === 'scan' ? renderScan() : renderForm(true)}

      <Footer />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#052e16' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  sidebarOverlay: {
    position: 'absolute', top: 0, left: 0,
    width: '45%', height: '100%',
    backgroundColor: 'white', zIndex: 20,
  },

  // ── Permission ──
  permTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 16, marginBottom: 8,
  },
  permSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24,
  },
  permBtn: {
    backgroundColor: '#16a34a', paddingHorizontal: 28,
    paddingVertical: 14, borderRadius: 14,
  },
  permBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  permLink: { marginTop: 16, padding: 8 },
  permLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

  // ── Camera ──
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  viewfinderOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.82,
    height: width * 1.1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#16a34a',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 40, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 40, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  viewfinderHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  camControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  camSideBtn: { alignItems: 'center', gap: 5, minWidth: 60 },
  camSideBtnText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  captureBtn: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  captureBtnInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251,191,36,0.2)',
    padding: 14,
  },
  tipText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // ── Processing ──
  processingCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  processingTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 6 },
  processingSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 20,
  },
  processingSteps: { gap: 8, marginTop: 8, alignSelf: 'stretch' },
  processingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  processingStepText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  // ── Confirm / Manual form ──
  confirmScroll: { padding: 16, paddingTop: 4 },
  rawPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rawPreviewLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rawPreviewText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  aiBanner: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  aiBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBannerText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  aiBannerBold: { color: '#fbbf24', fontWeight: '800' },
  aiBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingLeft: 24 },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    padding: 16,
  },
  formCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  formCardIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center',
  },
  formCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 12, marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, backgroundColor: '#f9fafb',
    paddingHorizontal: 12, height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },

  emptyCats: { fontSize: 13, color: '#6b7280', lineHeight: 19 },
  chipsScroll: { marginBottom: 4 },
  chipsContent: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  chipActive: {
    backgroundColor: '#16a34a', borderColor: '#16a34a',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, backgroundColor: '#f0fdf4',
    paddingHorizontal: 14, height: 48, gap: 10,
  },
  dateBtnText: { flex: 1, fontSize: 14, color: '#16a34a', fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16a34a', borderRadius: 14,
    paddingVertical: 15, gap: 8, marginBottom: 12,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
  },
  retryText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
});
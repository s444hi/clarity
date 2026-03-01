javascript import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/Theme';
import { simplifyText } from '../api/gemini';

const FONT_MIN = 16;
const FONT_MAX = 40;
const SPACING_MIN = 0;
const SPACING_MAX = 5;
const LH_MIN = 1.2;
const LH_MAX = 2.5;

function StepperRow({ label, value, displayValue, onDecrement, onIncrement, fillPct }) {
  return (
    <View style={settingStyles.section}>
      <View style={settingStyles.labelRow}>
        <Text style={settingStyles.label}>{label}</Text>
        <Text style={settingStyles.value}>{displayValue}</Text>
      </View>
      <View style={settingStyles.stepRow}>
        <TouchableOpacity onPress={onDecrement} style={settingStyles.stepper} activeOpacity={0.7}>
          <Text style={settingStyles.stepperText}>−</Text>
        </TouchableOpacity>
        <View style={settingStyles.track}>
          <View style={[settingStyles.fill, { width: `${Math.round(fillPct * 100)}%` }]} />
        </View>
        <TouchableOpacity onPress={onIncrement} style={settingStyles.stepper} activeOpacity={0.7}>
          <Text style={settingStyles.stepperText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ScanToTextScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [view, setView] = useState('input');
  const [inputText, setInputText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [fontSize, setFontSize] = useState(Theme.typography.defaultFontSize);
  const [letterSpacing, setLetterSpacing] = useState(Theme.typography.defaultLetterSpacing);
  const [lineHeightMult, setLineHeightMult] = useState(Theme.typography.defaultLineHeightMultiplier);
  const [clarityMode, setClarityMode] = useState(true);

  const sheetAnim = useRef(new Animated.Value(0)).current;

  const openSettings = useCallback(() => {
    setSettingsVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [sheetAnim]);

  const closeSettings = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSettingsVisible(false));
  }, [sheetAnim]);

  function handleClarify() {
    if (!inputText.trim()) {
      Alert.alert('No Text', 'Please enter some text first.');
      return;
    }
    Keyboard.dismiss();
    setDisplayText(inputText.trim());
    setView('reader');
  }

  async function handleSimplify() {
    if (!displayText.trim()) return;
    setIsLoading(true);
    try {
      const lines = await simplifyText(displayText);
      const formatted = lines.map(l => '• ' + l).join('\n\n');
      setDisplayText(formatted);
    } catch (e) {
      Alert.alert('Simplify Failed', e.message || 'Could not reach Gemini. Check your API key.');
    }
    setIsLoading(false);
  }

  const textStyle = {
    fontSize,
    letterSpacing,
    lineHeight: fontSize * lineHeightMult,
    color: Theme.colors.text,
    textAlign: 'left',
    fontFamily: clarityMode
      ? (Platform.OS === 'ios' ? 'Georgia' : 'serif')
      : (Platform.OS === 'ios' ? '-apple-system' : 'Roboto'),
  };

  if (view === 'input') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navLeft} activeOpacity={0.7}>
              <Text style={styles.navBack}>‹  Back</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>Clarify Text</Text>
            <View style={styles.navRight} />
          </View>

          <ScrollView
            style={styles.inputScroll}
            contentContainerStyle={styles.inputContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerPillWrap}>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>How will you clarify today?</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <TextInput
                style={styles.textArea}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Paste or type your text here…"
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
                autoCorrect={false}
                scrollEnabled={false}
              />
            </View>

            <TouchableOpacity
              style={styles.clarifyBtn}
              onPress={handleClarify}
              activeOpacity={0.75}
            >
              <Text style={styles.clarifyBtnText}>Clarify Text  →</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Clarity will display your text with dyslexia-friendly formatting. You can also have AI simplify it.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setView('input')} style={styles.navLeft} activeOpacity={0.7}>
          <Text style={styles.navBack}>‹  Edit</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Clarity</Text>
        <TouchableOpacity onPress={openSettings} style={styles.navRight} activeOpacity={0.7}>
          <Text style={styles.navAction}>Aa</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.readerScroll}
        contentContainerStyle={[styles.readerContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readingCard}>
          <Text style={textStyle} selectable>
            {displayText}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.pill, { bottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.pillBtn}
          onPress={() => setFontSize(s => Math.max(FONT_MIN, s - 2))}
          activeOpacity={0.7}
        >
          <Text style={styles.pillIcon}>A−</Text>
          <Text style={styles.pillLabel}>Smaller</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pillBtn}
          onPress={() => setFontSize(s => Math.min(FONT_MAX, s + 2))}
          activeOpacity={0.7}
        >
          <Text style={styles.pillIcon}>A+</Text>
          <Text style={styles.pillLabel}>Larger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pillBtn}
          onPress={handleSimplify}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Theme.colors.pillActive} />
          ) : (
            <Text style={styles.pillIcon}>✦</Text>
          )}
          <Text style={styles.pillLabel}>{isLoading ? 'Working' : 'Simplify'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, clarityMode && styles.pillBtnActive]}
          onPress={() => setClarityMode(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillIcon, clarityMode && styles.pillIconActive]}>◈</Text>
          <Text style={[styles.pillLabel, clarityMode && styles.pillLabelActive]}>Clarity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pillBtn}
          onPress={openSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.pillIcon}>Aa</Text>
          <Text style={styles.pillLabel}>Text</Text>
        </TouchableOpacity>
      </View>

      {settingsVisible && (
        <Modal
          transparent
          animationType="none"
          onRequestClose={closeSettings}
          statusBarTranslucent
        >
          <TouchableOpacity
            style={styles.sheetOverlay}
            activeOpacity={1}
            onPress={closeSettings}
          >
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [350, 0],
                    }),
                  }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Text Appearance</Text>

                <StepperRow
                  label="Font Size"
                  displayValue={`${fontSize}px`}
                  fillPct={(fontSize - FONT_MIN) / (FONT_MAX - FONT_MIN)}
                  onDecrement={() => setFontSize(s => Math.max(FONT_MIN, s - 2))}
                  onIncrement={() => setFontSize(s => Math.min(FONT_MAX, s + 2))}
                />

                <StepperRow
                  label="Letter Spacing"
                  displayValue={`${letterSpacing.toFixed(1)}`}
                  fillPct={(letterSpacing - SPACING_MIN) / (SPACING_MAX - SPACING_MIN)}
                  onDecrement={() => setLetterSpacing(s => Math.max(SPACING_MIN, parseFloat((s - 0.5).toFixed(1))))}
                  onIncrement={() => setLetterSpacing(s => Math.min(SPACING_MAX, parseFloat((s + 0.5).toFixed(1))))}
                />

                <StepperRow
                  label="Line Height"
                  displayValue={`${lineHeightMult.toFixed(1)}×`}
                  fillPct={(lineHeightMult - LH_MIN) / (LH_MAX - LH_MIN)}
                  onDecrement={() => setLineHeightMult(s => Math.max(LH_MIN, parseFloat((s - 0.1).toFixed(1))))}
                  onIncrement={() => setLineHeightMult(s => Math.min(LH_MAX, parseFloat((s + 0.1).toFixed(1))))}
                />

                <View style={settingStyles.section}>
                  <Text style={settingStyles.label}>Reading Font</Text>
                  <View style={styles.fontToggleRow}>
                    <TouchableOpacity
                      style={[styles.fontBtn, clarityMode && styles.fontBtnActive]}
                      onPress={() => setClarityMode(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.fontBtnText, clarityMode && styles.fontBtnTextActive]}>
                        Clarity
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.fontBtn, !clarityMode && styles.fontBtnActive]}
                      onPress={() => setClarityMode(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.fontBtnText, !clarityMode && styles.fontBtnTextActive]}>
                        Standard
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={closeSettings} activeOpacity={0.75}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  flex: { flex: 1 },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.background,
  },
  navLeft: { width: 70 },
  navRight: { width: 70, alignItems: 'flex-end' },
  navBack: {
    fontSize: 17,
    color: Theme.colors.accentText,
    fontWeight: '400',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  navAction: {
    fontSize: 17,
    color: Theme.colors.accentText,
    fontWeight: '500',
  },
  inputScroll: { flex: 1 },
  inputContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerPillWrap: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerPill: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.card,
  },
  headerPillText: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    letterSpacing: -0.3,
  },
  inputCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
    minHeight: 180,
    ...Theme.shadow.card,
  },
  textArea: {
    fontSize: 16,
    color: Theme.colors.text,
    lineHeight: 24,
    minHeight: 150,
  },
  clarifyBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Theme.shadow.card,
  },
  clarifyBtnText: {
    color: Theme.colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  readerScroll: { flex: 1 },
  readerContent: {
    padding: 16,
  },
  readingCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    minHeight: 300,
    ...Theme.shadow.card,
  },
  pill: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Theme.colors.pillBg,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...Theme.shadow.pill,
  },
  pillBtn: {
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 3,
  },
  pillBtnActive: {},
  pillIcon: {
    fontSize: 18,
    color: Theme.colors.white,
    fontWeight: '500',
  },
  pillIconActive: {
    color: Theme.colors.pillActive,
  },
  pillLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  pillLabelActive: {
    color: Theme.colors.pillActive,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.accentText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 20,
    marginLeft: 2,
  },
  fontToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  fontBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
  },
  fontBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  fontBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: Theme.colors.text,
  },
  fontBtnTextActive: {
    color: Theme.colors.white,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  doneBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

const settingStyles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.text,
  },
  value: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 20,
    fontWeight: '400',
    color: Theme.colors.text,
    lineHeight: 22,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
});
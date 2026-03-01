import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
  Animated, Modal, Platform, PanResponder, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { Theme } from '../constants/Theme';
import { supabase } from '../api/supabase';
import { extractTextFromImage } from '../api/ocr';
import { simplifyText } from '../api/gemini';
import { textToSpeech, VOICE_OPTIONS } from '../api/elevenLabs';
import { saveConversation, getHistory, deleteConversation } from '../api/history';

const OD_FONT = 'OpenDyslexic';
const OD_BOLD = 'OpenDyslexic-Bold';
const FALLBACK_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const FONT_MIN = 18;
const FONT_MAX = 44;

function VoiceWaveform({ isPlaying }) {
  const bars = useRef([...Array(7)].map(() => new Animated.Value(0.25))).current;
  useEffect(() => {
    if (!isPlaying) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.25, duration: 200, useNativeDriver: true }).start());
      return;
    }
    const anims = bars.map((bar, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 70),
        Animated.timing(bar, { toValue: 1, duration: 370, useNativeDriver: true }),
        Animated.timing(bar, { toValue: 0.2, duration: 370, useNativeDriver: true }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [isPlaying, bars]);
  return (
    <View style={waveStyles.wrap}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[waveStyles.bar, { transform: [{ scaleY: bar }] }]} />
      ))}
    </View>
  );
}
const waveStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', height: 40, gap: 4 },
  bar: { width: 4, height: 26, borderRadius: 3, backgroundColor: '#1E3A6E' },
});

function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.2, duration: 550, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[liveStyles.dot, { opacity: anim }]} />;
}
const liveStyles = StyleSheet.create({
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF3B30', marginRight: 5 },
});

function StepperRow({ label, value, fillPct, onDec, onInc }) {
  return (
    <View style={stStyles.wrap}>
      <View style={stStyles.top}>
        <Text style={stStyles.label}>{label}</Text>
        <Text style={stStyles.val}>{value}</Text>
      </View>
      <View style={stStyles.row}>
        <TouchableOpacity onPress={onDec} style={stStyles.btn} activeOpacity={0.7}>
          <Text style={stStyles.btnTxt}>−</Text>
        </TouchableOpacity>
        <View style={stStyles.track}>
          <View style={[stStyles.fill, { width: `${Math.max(0, Math.min(100, Math.round(fillPct * 100)))}%` }]} />
        </View>
        <TouchableOpacity onPress={onInc} style={stStyles.btn} activeOpacity={0.7}>
          <Text style={stStyles.btnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const stStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 16, fontWeight: '500', color: '#000' },
  val: { fontSize: 14, color: 'rgba(60,60,67,0.6)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(118,118,128,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnTxt: { fontSize: 20, color: '#000', lineHeight: 22 },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(60,60,67,0.12)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
});

function ScaleCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 250, friction: 10 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 250, friction: 10 }).start();
  }
  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

const DELETE_BTN_W = 82;

function SwipeableHistoryCard({ item, onPress, onDelete, index = 0 }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 55),
      Animated.spring(entranceAnim, { toValue: 1, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onPanResponderMove: (_, gs) => {
      if (gs.dx < 0) {
        translateX.setValue(Math.max(gs.dx, -DELETE_BTN_W));
      } else if (isOpen.current) {
        translateX.setValue(Math.min(-DELETE_BTN_W + gs.dx, 0));
      }
    },
    onPanResponderRelease: (_, gs) => {
      const shouldOpen = gs.dx < -40 || (isOpen.current && gs.vx <= 0);
      if (shouldOpen) {
        Animated.spring(translateX, { toValue: -DELETE_BTN_W, useNativeDriver: true, tension: 120, friction: 12 }).start();
        isOpen.current = true;
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 12 }).start();
        isOpen.current = false;
      }
    },
  })).current;

  function close() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isOpen.current = false;
  }

  function handleCardPress() {
    if (isOpen.current) { close(); } else { onPress(); }
  }

  return (
    <Animated.View style={[swipeCard.wrap, {
      opacity: entranceAnim,
      transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }]}>
      <TouchableOpacity style={swipeCard.deleteZone} onPress={() => { close(); onDelete(); }} activeOpacity={0.85}>
        <Text style={swipeCard.deleteIcon}>🗑</Text>
        <Text style={swipeCard.deleteTxt}>Delete</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={swipeCard.card} onPress={handleCardPress} activeOpacity={0.75}>
          <View style={swipeCard.body}>
            <Text style={swipeCard.title} numberOfLines={1}>{item.title || 'Untitled'}</Text>
            <Text style={swipeCard.preview} numberOfLines={1}>{item.original_text}</Text>
            <View style={swipeCard.meta}>
              <Text style={swipeCard.date}>
                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              {item.is_simplified && (
                <View style={swipeCard.badge}>
                  <Text style={swipeCard.badgeTxt}>✦ Simplified</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={swipeCard.chevron}>›</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
const swipeCard = StyleSheet.create({
  wrap: {
    overflow: 'hidden', borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  deleteZone: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_BTN_W,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center',
  },
  deleteIcon: { fontSize: 18, marginBottom: 2 },
  deleteTxt: { color: 'white', fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: 16,
    borderWidth: 1, borderColor: '#E8DFC8',
  },
  body: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#3A3A3A', marginBottom: 2 },
  preview: { fontSize: 13, color: '#8E8E93', lineHeight: 18, marginBottom: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 12, color: '#8E8E93' },
  badge: { backgroundColor: '#D4E4F7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '600', color: '#2C5282' },
  chevron: { fontSize: 22, color: '#8E8E93' },
});

const VIEW = {
  MAIN: 'main',
  CAPTURE: 'capture',
  PROCESSING: 'processing',
  RESULT: 'result',
  LIVE: 'live',
};

const SPACE_MIN = 0, SPACE_MAX = 5;
const LH_MIN = 1.3, LH_MAX = 2.4;

export default function ScanToSpeechScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [userName, setUserName] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const displayName =
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        'there';
      setUserName(displayName);
    });
  }, []);
  const firstName = userName;

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  const [view, setView] = useState(VIEW.MAIN);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Reading text…');

  const [extractedText, setExtractedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isSimplified, setIsSimplified] = useState(false);

  const [liveText, setLiveText] = useState('');
  const [liveScanning, setLiveScanning] = useState(false);
  const liveIntervalRef = useRef(null);
  const isOCRBusyRef = useRef(false);
  const isLiveActiveRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const soundRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const isFromHistory = useRef(false);

  const mainFadeAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const logoBreathAnim = useRef(new Animated.Value(1)).current;

  const [fontSize, setFontSize] = useState(22);
  const [letterSpacing, setLetterSpacing] = useState(0.5);
  const [lineHeightMult, setLineHeightMult] = useState(1.7);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const libraryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (view !== VIEW.LIVE) {
      isLiveActiveRef.current = false;
      clearTimeout(liveIntervalRef.current);
      setLiveScanning(false);
      return;
    }

    isLiveActiveRef.current = true;

    async function runScan() {
      if (!isLiveActiveRef.current || isOCRBusyRef.current || !cameraRef.current) {
        if (isLiveActiveRef.current) {
          liveIntervalRef.current = setTimeout(runScan, 2000);
        }
        return;
      }

      isOCRBusyRef.current = true;
      setLiveScanning(true);

      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
        if (!isLiveActiveRef.current) return;

        const ctx = ImageManipulator.manipulate(photo.uri);
        ctx.resize({ width: 800 });
        const imgRef = await ctx.renderAsync();
        const resized = await imgRef.saveAsync({ compress: 0.65, format: SaveFormat.JPEG, base64: true });
        if (!isLiveActiveRef.current) return;

        if (resized?.base64) {
          const text = await extractTextFromImage(resized.base64);
          if (text && text.trim().length > 2 && isLiveActiveRef.current) {
            setLiveText(text.trim());
          }
        }
      } catch (_) {
      } finally {
        isOCRBusyRef.current = false;
        setLiveScanning(false);
        if (isLiveActiveRef.current) {
          liveIntervalRef.current = setTimeout(runScan, 4000);
        }
      }
    }

    liveIntervalRef.current = setTimeout(runScan, 1500);

    return () => {
      isLiveActiveRef.current = false;
      clearTimeout(liveIntervalRef.current);
      isOCRBusyRef.current = false;
      setLiveScanning(false);
    };
  }, [view]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      isLiveActiveRef.current = false;
      clearTimeout(liveIntervalRef.current);
    };
  }, []);

  async function processImageUri(uri) {
    setView(VIEW.PROCESSING);
    setProcessingLabel('Reading text…');
    try {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: 800 });
      const imgRef = await ctx.renderAsync();
      const resized = await imgRef.saveAsync({
        compress: 0.65,
        format: SaveFormat.JPEG,
        base64: true,
      });

      const text = await extractTextFromImage(resized.base64);
      setExtractedText(text);
      setOriginalText(text);
      setIsSimplified(false);
      setSelectedVoice(VOICE_OPTIONS[0].id);
      setView(VIEW.RESULT);
    } catch (e) {
      Alert.alert('Scan Failed', e.message);
      setView(VIEW.MAIN);
    }
  }

  async function handleShutter() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: false });
      if (photo?.uri) await processImageUri(photo.uri);
    } catch (e) {
      Alert.alert('Camera Error', e.message);
    }
  }

  function afterSheetClosed(callback) {
    Animated.timing(libraryAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => {
        setLibraryVisible(false);
        setTimeout(callback, 50);
      });
  }

  function handleGallery() {
    afterSheetClosed(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photos Access Required', 'Go to Settings → Privacy → Photos and allow Clarity access.');
        return;
      }
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          await processImageUri(result.assets[0].uri);
        }
      } catch (e) {
        Alert.alert('Gallery Error', e.message);
      }
    });
  }

  function handleTakePhoto() {
    afterSheetClosed(async () => {
      if (!camPermission?.granted) {
        const perm = await requestCamPermission();
        if (!perm.granted) { Alert.alert('Permission Denied', 'Camera access is required.'); return; }
      }
      setView(VIEW.CAPTURE);
    });
  }

  function handleFiles() {
    afterSheetClosed(async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'image/*',
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          await processImageUri(result.assets[0].uri);
        }
      } catch (e) {
        Alert.alert('File Error', e.message);
      }
    });
  }

  function handleCaptureLive() {
    if (!liveText) return;
    setExtractedText(liveText);
    setOriginalText(liveText);
    setIsSimplified(false);
    setView(VIEW.RESULT);
  }

  async function handleSimplify() {
    if (isSimplified) {
      setExtractedText(originalText);
      setIsSimplified(false);
      return;
    }
    setIsSimplifying(true);
    const lines = await simplifyText(extractedText);
    setExtractedText(lines.map(l => '• ' + l).join('\n\n'));
    setIsSimplified(true);
    setIsSimplifying(false);
  }

  async function handleReadAloud() {
    if (isPlaying) {
      await soundRef.current?.stopAsync().catch(() => {});
      setIsPlaying(false);
      return;
    }
    setProcessingLabel('Generating speech…');
    setView(VIEW.PROCESSING);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const uri = await textToSpeech(extractedText, selectedVoice);
      await soundRef.current?.unloadAsync().catch(() => {});
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setIsPlaying(true);
      setView(VIEW.RESULT);
      sound.setOnPlaybackStatusUpdate(s => { if (s.didJustFinish) setIsPlaying(false); });
    } catch (e) {
      Alert.alert('Playback Failed', e.message || 'Check your ElevenLabs API key.');
      setView(VIEW.RESULT);
    }
  }

  const openSettings = useCallback(() => {
    setSettingsVisible(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [sheetAnim]);

  const closeSettings = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, useNativeDriver: true })
      .start(() => setSettingsVisible(false));
  }, [sheetAnim]);

  function openLibrary() {
    setLibraryVisible(true);
    Animated.spring(libraryAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }
  function closeLibrary() {
    Animated.timing(libraryAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setLibraryVisible(false));
  }

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const data = await getHistory();
    setHistory(data);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (view === VIEW.MAIN) loadHistory();
  }, [view, loadHistory]);

  useEffect(() => {
    const channel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadHistory();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadHistory]);

  useEffect(() => {
    if (view === VIEW.MAIN) {
      mainFadeAnim.setValue(0);
      Animated.spring(mainFadeAnim, {
        toValue: 1, useNativeDriver: true, tension: 60, friction: 11,
      }).start();
    }
    if (view === VIEW.RESULT) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, {
        toValue: 1, useNativeDriver: true, tension: 65, friction: 12,
      }).start();
    }
  }, [view]);

  useEffect(() => {
    if (view === VIEW.PROCESSING) {
      logoBreathAnim.setValue(1);
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(logoBreathAnim, { toValue: 1.1, duration: 850, useNativeDriver: true }),
        Animated.timing(logoBreathAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [view]);

  function handleReset() {
    soundRef.current?.stopAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setIsPlaying(false);
    setLiveText('');
    setIsSimplified(false);
    isFromHistory.current = false;
    setView(VIEW.MAIN);
  }

  function promptSaveAndReset() {
    if (isFromHistory.current || !originalText) { handleReset(); return; }

    const autoTitle = `Untitled ${history.length + 1}`;

    Alert.prompt(
      'Save this scan?',
      `Give it a name, or leave blank for "${autoTitle}".`,
      [
        { text: "Don't Save", style: 'cancel', onPress: handleReset },
        {
          text: 'Save',
          onPress: async (inputTitle) => {
            const title = inputTitle?.trim() || autoTitle;
            try {
              await saveConversation({
                title,
                originalText,
                simplifiedText: extractedText,
                isSimplified,
              });
              await loadHistory();
            } catch (_) {}
            handleReset();
          },
        },
      ],
      'plain-text',
    );
  }

  function openHistoryItem(item) {
    isFromHistory.current = true;
    setOriginalText(item.original_text);
    setExtractedText(item.is_simplified && item.simplified_text
      ? item.simplified_text
      : item.original_text);
    setIsSimplified(item.is_simplified && !!item.simplified_text);
    setSelectedVoice(VOICE_OPTIONS[0].id);
    setView(VIEW.RESULT);
  }

  async function handleDeleteHistory(id) {
    try { await deleteConversation(id); } catch (_) {}
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  if (view === VIEW.PROCESSING) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Animated.Image
            source={require('../../assets/logo.png')}
            style={{ width: 140, height: 140, marginBottom: 20, transform: [{ scale: logoBreathAnim }] }}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#1E3A6E" style={{ marginBottom: 14 }} />
          <Text style={s.processingTxt}>{processingLabel}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (view === VIEW.RESULT) {
    const textStyle = {
      fontFamily: OD_FONT,
      fontSize,
      letterSpacing,
      lineHeight: fontSize * lineHeightMult,
      color: Theme.colors.text,
      textAlign: 'left',
    };

    return (
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <Animated.View style={[{ flex: 1 }, {
          opacity: resultAnim,
          transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
        <View style={s.navBar}>
          <TouchableOpacity onPress={promptSaveAndReset} style={s.navLeft} activeOpacity={0.7}>
            <Text style={s.navBack}>‹  Scan</Text>
          </TouchableOpacity>
          <Text style={s.navTitle}>Scanned Text</Text>
          <TouchableOpacity onPress={openSettings} style={s.navRight} activeOpacity={0.7}>
            <Text style={s.navAction}>Aa</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.resultScroll}
          contentContainerStyle={[s.resultContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.fontBadge}>
            <Text style={s.fontBadgeTxt}>OpenDyslexic font</Text>
          </View>

          <View style={s.textCard}>
            <Text style={textStyle} selectable>{extractedText}</Text>
          </View>

          <TouchableOpacity
            style={[s.simplifyBtn, isSimplified && s.simplifyBtnOn]}
            onPress={handleSimplify}
            disabled={isSimplifying}
            activeOpacity={0.75}
          >
            {isSimplifying
              ? <ActivityIndicator color={isSimplified ? Theme.colors.accentText : Theme.colors.white} />
              : <Text style={[s.simplifyBtnTxt, isSimplified && s.simplifyBtnTxtOn]}>
                  {isSimplified ? '↩  Show Original' : '✦  Simplify with Clarity'}
                </Text>
            }
          </TouchableOpacity>

          <Text style={s.toneLabel}>Select Voice</Text>
          <View style={s.toneRow}>
            {VOICE_OPTIONS.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[s.toneBubble, selectedVoice === v.id && s.toneBubbleActive]}
                onPress={() => { setSelectedVoice(v.id); if (isPlaying) { soundRef.current?.stopAsync().catch(() => {}); setIsPlaying(false); } }}
                activeOpacity={0.75}
              >
                <Text style={s.toneEmoji}>{v.emoji}</Text>
                <Text style={[s.toneTrait, selectedVoice === v.id && s.toneTraitActive]}>{v.trait}</Text>
                <Text style={[s.toneName, selectedVoice === v.id && s.toneNameActive]}>{v.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.readAloudBtn, isPlaying && s.readAloudBtnStop]}
            onPress={handleReadAloud}
            activeOpacity={0.75}
          >
            <VoiceWaveform isPlaying={isPlaying} />
            <Text style={s.readAloudTxt}>{isPlaying ? '⏹  Stop' : '▶  Read Aloud'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.scanAgainBtn} onPress={promptSaveAndReset} activeOpacity={0.7}>
            <Text style={s.scanAgainTxt}>← Scan Again</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[s.pill, { bottom: insets.bottom + 22 }]}>
          <TouchableOpacity style={s.pillBtn} onPress={() => setFontSize(f => Math.max(FONT_MIN, f - 2))} activeOpacity={0.7}>
            <Text style={s.pillIcon}>A−</Text>
            <Text style={s.pillLbl}>Smaller</Text>
          </TouchableOpacity>
          <View style={s.pillDivider} />
          <TouchableOpacity style={s.pillBtn} onPress={() => setFontSize(f => Math.min(FONT_MAX, f + 2))} activeOpacity={0.7}>
            <Text style={s.pillIcon}>A+</Text>
            <Text style={s.pillLbl}>Larger</Text>
          </TouchableOpacity>
          <View style={s.pillDivider} />
          <TouchableOpacity style={s.pillBtn} onPress={openSettings} activeOpacity={0.7}>
            <Text style={s.pillIcon}>⚙</Text>
            <Text style={s.pillLbl}>Spacing</Text>
          </TouchableOpacity>
        </View>

        {settingsVisible && (
          <Modal transparent animationType="none" onRequestClose={closeSettings} statusBarTranslucent>
            <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeSettings}>
              <Animated.View style={[s.sheet, {
                transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [380, 0] }) }],
              }]}>
                <TouchableOpacity activeOpacity={1}>
                  <View style={s.sheetHandle} />
                  <Text style={s.sheetTitle}>Text Appearance</Text>
                  <StepperRow
                    label="Font Size" value={`${fontSize}px`}
                    fillPct={(fontSize - FONT_MIN) / (FONT_MAX - FONT_MIN)}
                    onDec={() => setFontSize(f => Math.max(FONT_MIN, f - 2))}
                    onInc={() => setFontSize(f => Math.min(FONT_MAX, f + 2))}
                  />
                  <StepperRow
                    label="Letter Spacing" value={`${letterSpacing.toFixed(1)}`}
                    fillPct={(letterSpacing - SPACE_MIN) / (SPACE_MAX - SPACE_MIN)}
                    onDec={() => setLetterSpacing(v => Math.max(SPACE_MIN, parseFloat((v - 0.5).toFixed(1))))}
                    onInc={() => setLetterSpacing(v => Math.min(SPACE_MAX, parseFloat((v + 0.5).toFixed(1))))}
                  />
                  <StepperRow
                    label="Line Height" value={`${lineHeightMult.toFixed(1)}×`}
                    fillPct={(lineHeightMult - LH_MIN) / (LH_MAX - LH_MIN)}
                    onDec={() => setLineHeightMult(v => Math.max(LH_MIN, parseFloat((v - 0.1).toFixed(1))))}
                    onInc={() => setLineHeightMult(v => Math.min(LH_MAX, parseFloat((v + 0.1).toFixed(1))))}
                  />
                  <TouchableOpacity style={s.doneBtn} onPress={closeSettings} activeOpacity={0.75}>
                    <Text style={s.doneBtnTxt}>Done</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (view === VIEW.CAPTURE) {
    return (
      <View style={s.fullScreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        <SafeAreaView style={s.camTopBar} edges={['top']}>
          <View style={s.camTopRow}>
            <TouchableOpacity onPress={() => setView(VIEW.MAIN)} style={s.glassBtn} activeOpacity={0.8}>
              <Text style={s.glassBtnTxt}>‹  Back</Text>
            </TouchableOpacity>
            <Text style={s.camTitle}>Take a Photo</Text>
            <View style={{ width: 80 }} />
          </View>
        </SafeAreaView>

        <View style={s.scanFrameWrap} pointerEvents="none">
          <View style={s.scanFrame}>
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />
          </View>
          <Text style={s.scanHint}>Position text within the frame</Text>
        </View>

        <SafeAreaView style={s.camBottomBar} edges={['bottom']}>
          <View style={[s.camControls, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity style={s.shutter} onPress={handleShutter} activeOpacity={0.85}>
              <View style={s.shutterRing}>
                <View style={s.shutterCore} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (view === VIEW.LIVE) {
    if (!camPermission?.granted) {
      return (
        <SafeAreaView style={s.safe}>
          <View style={s.center}>
            <Text style={s.permTitle}>Camera Access Needed</Text>
            <Text style={s.permDesc}>Clarity needs your camera for Live Capture.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={requestCamPermission} activeOpacity={0.75}>
              <Text style={s.primaryBtnTxt}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={s.fullScreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        <View style={s.liveTopScrim} pointerEvents="none" />

        <SafeAreaView style={s.liveTopBar} edges={['top']}>
          <View style={s.liveTopRow}>
            <TouchableOpacity
              style={s.exitBtn}
              onPress={() => { setLiveText(''); setView(VIEW.MAIN); }}
              activeOpacity={0.8}
            >
              <Text style={s.exitBtnTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={s.liveTitleTxt}>Live Scan</Text>
            {liveScanning
              ? <ActivityIndicator size="small" color="white" style={{ width: 36 }} />
              : <View style={{ width: 36 }} />
            }
          </View>
        </SafeAreaView>

        {liveText ? (
          <View style={s.liveOverlay} pointerEvents="box-none">
            <View style={s.liveCard}>
              <Text style={s.liveText}>{liveText}</Text>
              <TouchableOpacity style={s.openReaderBtn} onPress={handleCaptureLive} activeOpacity={0.85}>
                <Text style={s.openReaderTxt}>Open in Reader  →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.liveOverlay} pointerEvents="none">
            <View style={s.livePlaceholder}>
              <Text style={s.livePlaceholderTxt}>Point at text to begin scanning…</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  const handleLiveTap = async () => {
    if (!camPermission?.granted) {
      const perm = await requestCamPermission();
      if (!perm.granted) { Alert.alert('Permission Needed', 'Camera access is required for Live Capture.'); return; }
    }
    setLiveText('');
    setView(VIEW.LIVE);
  };

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View style={[{ flex: 1 }, {
        opacity: mainFadeAnim,
        transform: [{ translateY: mainFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
      }]}>
      <ScrollView contentContainerStyle={s.mainContent} showsVerticalScrollIndicator={false}>
        <View style={s.homeHeader}>
          <View>
            <Text style={s.homeGreeting}>Hello, {firstName} 👋</Text>
            <Text style={s.homeSubtitle}>How will you scan today?</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn} activeOpacity={0.7}>
            <Text style={s.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <ScaleCard style={s.featureCard} onPress={handleLiveTap}>
          <View style={[s.featureIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
            <Text style={s.featureIconTxt}>◎</Text>
          </View>
          <View style={s.featureBody}>
            <Text style={s.featureTitle}>Live Capture</Text>
            <Text style={s.featureDesc}>
              Point your camera at text. Clarity overlays it in OpenDyslexic font instantly — no photo needed.
            </Text>
          </View>
          <View style={s.livePill}>
            <PulseDot />
            <Text style={s.livePillTxt}>Live</Text>
          </View>
        </ScaleCard>

        <ScaleCard style={[s.featureCard, s.featureCardBlue]} onPress={openLibrary}>
          <View style={[s.featureIcon, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
            <Text style={s.featureIconTxt}>📚</Text>
          </View>
          <View style={s.featureBody}>
            <Text style={[s.featureTitle, { color: '#2C5282' }]}>Library</Text>
            <Text style={s.featureDesc}>
              Take a photo, upload from your camera roll, or choose a file — then read with Clarity.
            </Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </ScaleCard>

        <View style={s.historySection}>
          <Text style={s.sectionLabel}>Recent Scans</Text>

          {historyLoading && (
            <ActivityIndicator color="#1E3A6E" style={{ marginVertical: 12 }} />
          )}

          {!historyLoading && history.length === 0 && (
            <Text style={s.historyEmpty}>No saved scans yet. Scan something and tap Save to see it here.</Text>
          )}

          {!historyLoading && history.length > 0 && (
            <ScrollView style={{ maxHeight: 285 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {history.map((item, index) => (
                <SwipeableHistoryCard
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() => openHistoryItem(item)}
                  onDelete={() => handleDeleteHistory(item.id)}
                />
              ))}
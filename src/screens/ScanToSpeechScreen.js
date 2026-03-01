import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
  Animated, Modal, Platform, PanResponder, Image,
} from 'react-native';

const OD_FONT = 'OpenDyslexic'
const OD_BOLD = 'OpenDyslexic-Bold'
const FALLBACK_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif'

const FONT_MIN = 18
const FONT_MAX = 44

const OD_FONT = 'OpenDyslexic'
const OD_BOLD = 'OpenDyslexic-Bold'
const FALLBACK_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif'

const FONT_MIN = 18
const FONT_MAX = 44

function VoiceWaveform({ isPlaying }) {
    const bars = useRef([...Array(7)].map(() => new Animated.Value(0.25))).current
    useEffect(()
    const anims = bars.map((bar, i) =>
        Animated.loop(Animated.sequence([
          Animated.delay(i * 70),
          Animated.timing(bar, { toValue: 1, duration: 370, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.2, duration: 370, useNativeDriver: true }),
        ]))
      )
      anims.forEach(a => a.start())
      return () => anims.forEach(a => a.stop())
    }, [isPlaying])
    return (
      <View style={waveStyles.wrap}>
        {bars.map((bar, i) => (
          <Animated.View key={i} style={[waveStyles.bar, { transform: [{ scaleY: bar }] }]} />
        ))}
      </View>
    )
  }
  
  const waveStyles = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', height: 40, gap: 4 },
    bar: { width: 4, height: 26, borderRadius: 3, backgroundColor: '#1E3A6E' },
  })


function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current
  useEffect(() => {


    const loop = Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 550, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]))
      loop.start()
      return () => loop.stop()
    }, [])

    // live mode styles
  liveTopScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 130, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  liveTopBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  liveTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12,
  },
  liveTitleTxt: { color: 'white', fontSize: 17, fontWeight: '700' },
  exitBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  exitBtnTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
  liveOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 40 },
  liveCard: {
    backgroundColor: 'rgba(12,12,18,0.87)',
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55, shadowRadius: 24, elevation: 16,
  },
  liveText: {
    fontFamily: OD_FONT, fontSize: 20, lineHeight: 34,
    letterSpacing: 0.6, color: 'white', textAlign: 'left', marginBottom: 16,
  },
  openReaderBtn: {
    backgroundColor: NAVY, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  openReaderTxt: { color: 'white', fontSize: 16, fontWeight: '700' },
  livePlaceholder: {
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignSelf: 'center',
  },
  livePlaceholderTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '500', textAlign: 'center' },

  // loading screen
  processingTitle: { fontSize: 28, fontWeight: '700', color: INK, marginBottom: 6 },
  processingTxt: { fontSize: 15, color: MUTED, textAlign: 'center' },

  // result screen
  resultScroll: { flex: 1 },
  resultContent: { padding: 20 },
  fontBadge: {
    alignSelf: 'flex-start', backgroundColor: LTBLUE,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 14,
  },
  fontBadgeTxt: { fontSize: 12, fontWeight: '600', color: DKBLUE },
  textCard: {
    backgroundColor: WHITE, borderRadius: 20,
    padding: 22, marginBottom: 16, borderWidth: 1, borderColor: BEIGE,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  simplifyBtn: {
    backgroundColor: NAVY, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginBottom: 14,
    minHeight: 52, justifyContent: 'center',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
  },
  simplifyBtnOn: { backgroundColor: LTBLUE, shadowColor: 'transparent', shadowOpacity: 0 },
  simplifyBtnTxt: { color: WHITE, fontSize: 16, fontWeight: '600' },
  simplifyBtnTxtOn: { color: DKBLUE },

  // voice picker
  toneLabel: {
    fontSize: 12, fontWeight: '700', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 2,
  },
  toneRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toneBubble: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: WHITE, borderRadius: 16,
    borderWidth: 1.5, borderColor: BEIGE,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  toneBubbleActive: { backgroundColor: NAVY, borderColor: NAVY },
  toneEmoji: { fontSize: 22, marginBottom: 4 },
  toneTrait: { fontSize: 13, fontWeight: '700', color: INK },
  toneTraitActive: { color: WHITE },
  toneName: { fontSize: 11, color: MUTED, marginTop: 2 },
  toneNameActive: { color: 'rgba(255,255,255,0.8)' },

  // read aloud button
  readAloudBtn: {
    backgroundColor: WHITE, borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 10, marginBottom: 16,
    borderWidth: 1, borderColor: BEIGE,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  readAloudBtnStop: { borderWidth: 1.5, borderColor: '#FF3B30' },
  readAloudTxt: { fontSize: 16, fontWeight: '600', color: INK },
  scanAgainBtn: { backgroundColor: BEIGE, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  scanAgainTxt: { color: DKBLUE, fontSize: 16, fontWeight: '600' },

  // floating pill
  pill: {
    position: 'absolute', left: 20, right: 20,
    backgroundColor: 'rgba(30,58,110,0.93)', borderRadius: 26,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 13, paddingHorizontal: 12,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 18, elevation: 10,
  },
  pillBtn: { alignItems: 'center', gap: 3, paddingHorizontal: 8 },
  pillIcon: { fontSize: 17, color: 'white', fontWeight: '500' },
  pillLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
  pillDivider: { width: 0.5, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  // bottom sheets
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  sheetHandle: {
    width: 36, height: 5, backgroundColor: 'rgba(58,58,58,0.18)',
    borderRadius: 3, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: '700', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20, marginLeft: 2,
  },
  doneBtn: { backgroundColor: NAVY, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  doneBtnTxt: { color: WHITE, fontSize: 16, fontWeight: '600' },

  // library sheet options
  libOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 15,
    borderBottomWidth: 0.5, borderBottomColor: BEIGE,
  },
  libIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: BEIGE, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  libIcon: { fontSize: 20 },
  libBody: { flex: 1 },
  libLabel: { fontSize: 16, fontWeight: '600', color: INK, marginBottom: 2 },

   navBar: {
    height: 54, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5,
    borderBottomColor: BEIGE,
    backgroundColor: 'rgba(250,248,243,0.97)',
  },
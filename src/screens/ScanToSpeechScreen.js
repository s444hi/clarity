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
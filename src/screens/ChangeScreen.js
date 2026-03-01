import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ChoiceScreen({ route, navigation }) {
  const { scannedText } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>What would you like to do?</Text>
      
      <View style={styles.previewBox}>
        <Text numberOfLines={3} style={styles.previewText}>"{scannedText}"</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.speechButton]} 
        onPress={() => navigation.navigate('ScanToSpeech', { scannedText })}
      >
        <Text style={styles.buttonText}>🎙️ Listen (Scan to Speech)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.textButton]} 
        onPress={() => navigation.navigate('ScanToText', { scannedText })}
      >
        <Text style={styles.buttonText}>📄 Read (Scan to Text)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f3', padding: 25, justifyContent: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'left', color: '#333' },
  previewBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 40, borderLeftWidth: 5, borderLeftColor: '#4A90E2' },
  previewText: { fontStyle: 'italic', color: '#666' },
  button: { padding: 25, borderRadius: 15, marginBottom: 20, alignItems: 'center', elevation: 3 },
  speechButton: { backgroundColor: '#4A90E2' },
  textButton: { backgroundColor: '#34A853' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});



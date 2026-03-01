import * as FileSystem from 'expo-file-system';

const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

const JESSICA_VOICE_ID = 'cgSgspJ2msm6clMCkdW9';

export async function textToSpeech(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${JESSICA_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
        },
      }),
    }
  );
import * as FileSystem from 'expo-file-system';

const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

const JESSICA_VOICE_ID = 'cgSgspJ2msm6clMCkdW9';

export async function textToSpeech(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${JESSICA_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => String(response.status));
    throw new Error(`ElevenLabs error: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);

  const fileUri = FileSystem.cacheDirectory + 'clarity_tts.mp3';
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}
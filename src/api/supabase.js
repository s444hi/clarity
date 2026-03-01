import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const saveConversation = async (userId, text, type) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      user_id: userId,
      content: text,
      mode: type,
      created_at: new Date().toISOString(),
    }]);
  if (error) console.error('Supabase save error:', error);
  return { data, error };
};

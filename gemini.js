// Gemini text simplification — uses @google/generative-ai SDK.
//
// Planning: 
//   1. Try gemini-2.5-flash to see if it works properly 
//   2. If Gemini is unavailable / quota hit, fall back to client-side
//      sentence splitting so the feature will always work. 

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Splits text into short, readable sentences
function localSimplify(text) {
 
  const result = [];
  for (const sentence of rawSentences) {
    const words = sentence.split(' ');
    if (words.length <= 14) {
      result.push(sentence);
      continue;
    }
    // Try splitting at ", and/or/but/so/because/when/while/if"
    const parts = sentence.split(
      /,\s*(?:and|or|but|so|because|when|while|if|after|before|then)\s*/i
    );
    
            if (commaParts.length > 1) {
        commaParts.forEach(p => { if (p.trim().length > 2) result.push(p.trim()); });
      } else {
        result.push(sentence);
      }
     
}
//
 * Simplify the text for dyslexic readers. 
 */
export async function simplifyText(text) {
  // ── Try Gemini 2.5 Flash (only model with free quota on this key) ────────
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Simplify this for a dyslexic reader.


}

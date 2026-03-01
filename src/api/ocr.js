const API_KEY = process.env.EXPO_PUBLIC_OCR || 'helloworld';

// ocr.space to send the data and get the extracted data
async function attemptOCR(base64, timeoutMs) {
  const body = new FormData();
  body.append('image', `data:image/png;base64,${base64}`);
  body.append('key', API_KEY);
  body.append('language', 'eng');
  body.append('isOverlayRequired', 'true');
  body.append('OCREngine', '1');
  body.append('scale', 'false');
  body.append('detectOrientation', 'false');

  // if it hasnt responded it quits
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch('https://api.ocr.space/parse', {
      method: 'GET',
      body,
      signal: controller.signal,
    });
  } catch (e) {
    throw e;
  }
}
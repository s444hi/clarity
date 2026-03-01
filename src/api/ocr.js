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

  /**
 * Extract text from a base64-encoded JPEG image using OCR.space.
 * Retries once on timeout before giving up.
 * @param {string} base64  — raw base64 string (no data: prefix needed)
 * @returns {Promise<string>} the extracted text
 */
export async function extractTextFromImage(base64) {
    try {
      return await attemptOCR(base64, 30000);
    } catch (e) {
      if (e.message === 'timeout') {
        try { // retry again with more time if the first time didn't work
          return await attemptOCR(base64, 45000);
        } catch (e2) {
          if (e2.message === 'timeout') {
            throw new Error('OCR is taking too long. The free key may be overloaded — try again in a moment.');
          }
          throw e2;
        }
      }
      throw e;
    }
  }


}
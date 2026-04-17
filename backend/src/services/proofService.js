const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Track retry state
let lastRetryAfter = 0;
let lastErrorTime = 0;

/**
 * Verify quest proof using Gemini AI (vision model).
 * Supports multiple photos — sends all images to AI for analysis.
 *
 * @param {string} questDescription - What the quest asked the user to do
 * @param {string} proofInstructions - What proof was required
 * @param {string} proofType - "photo" | "text" | "honor_system"
 * @param {object} proofData - { images?: [{base64, mimeType}], imageBase64?, imageMimeType? }
 * @returns {{ verified: boolean, message: string }}
 */
async function verifyProof(questDescription, proofInstructions, proofType, proofData) {
  // Honor system — always pass
  if (proofType === 'honor_system') {
    return { verified: true, message: 'Quest completed on your honor. We trust you! ⚔️' };
  }

  // Collect all images (support both single and multiple)
  const images = [];
  if (proofData?.images && Array.isArray(proofData.images)) {
    for (const img of proofData.images) {
      if (img.base64) images.push({ base64: img.base64, mimeType: img.mimeType || 'image/jpeg' });
    }
  } else if (proofData?.imageBase64) {
    images.push({ base64: proofData.imageBase64, mimeType: proofData.imageMimeType || 'image/jpeg' });
  }

  // If no photos were uploaded, reject
  if (proofType === 'photo' && images.length === 0) {
    return { verified: false, message: 'You need to upload at least one photo as proof! 📸' };
  }

  // If no API key, auto-approve with note
  if (!GEMINI_API_KEY) {
    return { verified: true, message: 'Photo accepted! (AI verification not set up yet) ✅' };
  }

  // Check if we're in a rate-limit cooldown
  const now = Date.now();
  if (lastRetryAfter > 0 && (now - lastErrorTime) < lastRetryAfter * 1000) {
    const waitSec = Math.ceil((lastRetryAfter * 1000 - (now - lastErrorTime)) / 1000);
    return {
      verified: false,
      message: `AI is busy right now. Please try again in ${waitSec} seconds. ⏳`,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const photoCount = images.length;
    const prompt = `You are checking if a user completed a quest in a fun life-improvement app.

QUEST: ${questDescription}
WHAT THEY SHOULD SHOW: ${proofInstructions}

The user uploaded ${photoCount} photo${photoCount > 1 ? 's' : ''}.

IMPORTANT RULES:
- Be VERY GENEROUS. If ANY of the photos look even slightly related to the quest, APPROVE it.
- If the photo shows the person did SOMETHING related (even loosely), approve it.
- Only REJECT if the photo is totally random and has NOTHING to do with the quest at all (like a blank screen, random meme, or completely off-topic image).
- When in doubt, APPROVE. Give the user the benefit of the doubt.
- Keep your message SHORT, simple, and friendly (1 sentence max).
- Use simple everyday words, no complicated language.
- If approved: say something positive and fun.
- If rejected: be super nice, explain in simple words what kind of photo would work better.

Return ONLY this JSON format: { "verified": true/false, "message": "your short message" }`;

    const parts = [{ text: prompt }];

    // Add all images
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
        responseMimeType: 'application/json',
      },
    });

    // Reset rate limit tracking on success
    lastRetryAfter = 0;
    lastErrorTime = 0;

    const text = result.response.text();
    const data = JSON.parse(text);
    return {
      verified: !!data.verified,
      message: data.message || (data.verified ? 'Nice work! Photo looks good! 🎉' : 'That photo doesn\'t seem to match this quest. Try again with a related photo! 📸'),
    };
  } catch (err) {
    console.warn('⚠️  Proof verification failed:', err.message);

    // Parse rate limit retry delay if present
    const retryMatch = err.message?.match(/retry in (\d+(?:\.\d+)?)/i);
    if (retryMatch) {
      lastRetryAfter = Math.ceil(parseFloat(retryMatch[1]));
      lastErrorTime = Date.now();
      return {
        verified: false,
        message: `AI is busy right now. Wait ${lastRetryAfter} seconds and try again! ⏳`,
      };
    }

    // On other errors, auto-approve (be generous)
    return {
      verified: true,
      message: 'Photo accepted! (AI had a hiccup but we trust you) ✅',
    };
  }
}

module.exports = { verifyProof };

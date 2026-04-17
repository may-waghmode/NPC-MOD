const axios = require('axios');

// Track retry state
let lastRetryAfter = 0;
let lastErrorTime = 0;

/**
 * Call Groq Vision API.
 */
async function callGroqVision(prompt, images, genConfig = {}) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set.');

  // Build the message content array
  const content = [{ type: 'text', text: prompt }];

  // Add each image
  for (const img of images) {
    // Determine mimeType if not provided (default to jpeg)
    let mimeType = img.mimeType || 'image/jpeg';
    
    // Ensure base64 string doesn't already have the data URI prefix before adding it
    let base64Data = img.base64;
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      base64Data = parts[1];
      mimeType = parts[0].split(':')[1].split(';')[0];
    }
    
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64Data}`
      }
    });
  }

  const body = {
    model: 'llama-3.2-11b-vision-preview',
    messages: [
      {
        role: 'user',
        content: content
      }
    ],
    temperature: 0.3,
    max_tokens: 150,
    response_format: { type: 'json_object' }
  };

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      timeout: 30000,
    });
    return response.data?.choices?.[0]?.message?.content || '';
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    const msg = data?.error?.message || err.message;
    console.error(`Groq Vision API Error (${status}): ${msg}`);
    throw new Error(msg);
  }
}

/**
 * Verify quest proof using Groq AI (Llama 3.2 Vision).
 */
async function verifyProof(questDescription, proofInstructions, proofType, proofData) {
  if (proofType === 'honor_system') {
    return { verified: true, message: 'Quest completed on your honor. We trust you! ⚔️' };
  }

  const images = [];
  if (proofData?.images && Array.isArray(proofData.images)) {
    for (const img of proofData.images) {
      if (img.base64) images.push({ base64: img.base64, mimeType: img.mimeType || 'image/jpeg' });
    }
  } else if (proofData?.imageBase64) {
    images.push({ base64: proofData.imageBase64, mimeType: proofData.imageMimeType || 'image/jpeg' });
  }

  if (proofType === 'photo' && images.length === 0) {
    return { verified: false, message: 'You need to upload at least one photo as proof! 📸' };
  }

  if (!process.env.GROQ_API_KEY) {
    return { verified: true, message: 'Photo accepted! (AI verification not set up yet) ✅' };
  }

  const now = Date.now();
  if (lastRetryAfter > 0 && (now - lastErrorTime) < lastRetryAfter * 1000) {
    const waitSec = Math.ceil((lastRetryAfter * 1000 - (now - lastErrorTime)) / 1000);
    return { verified: false, message: `AI is busy right now. Please try again in ${waitSec} seconds. ⏳` };
  }

  try {
    const photoCount = images.length;
    const promptText = `You are checking if a user completed a quest in a fun life-improvement app.

QUEST: ${questDescription}
WHAT THEY SHOULD SHOW: ${proofInstructions}

The user uploaded ${photoCount} photo${photoCount > 1 ? 's' : ''}.

IMPORTANT RULES:
- Be VERY GENEROUS. If ANY of the photos look even slightly related to the quest, APPROVE it.
- Only REJECT if the photo is totally random and has NOTHING to do with the quest at all.
- When in doubt, APPROVE.
- Keep your message SHORT and friendly (1 sentence max).
- If approved: say something positive. If rejected: be super nice.

Return ONLY this valid JSON format: { "verified": true/false, "message": "your short message" }`;

    lastRetryAfter = 0;
    lastErrorTime = 0;

    const text = await callGroqVision(promptText, images);

    const data = JSON.parse(text);
    return {
      verified: !!data.verified,
      message: data.message || (data.verified ? 'Nice work! 🎉' : 'Try again with a related photo! 📸'),
    };
  } catch (err) {
    console.warn('⚠️  Proof verification failed:', err.message);

    const retryMatch = err.message?.match(/retry in (\d+(?:\.\d+)?)/i);
    if (retryMatch) {
      lastRetryAfter = Math.ceil(parseFloat(retryMatch[1]));
      lastErrorTime = Date.now();
      return { verified: false, message: `AI is busy. Wait ${lastRetryAfter} seconds and try again! ⏳` };
    }

    return { verified: true, message: 'Photo accepted! (AI had a hiccup but we trust you) ✅' };
  }
}

module.exports = { verifyProof };

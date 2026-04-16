const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Verify quest proof using Gemini AI.
 *
 * @param {string} questDescription - What the quest asked the user to do
 * @param {string} proofInstructions - What proof was required
 * @param {string} proofType - "photo" | "text" | "honor_system"
 * @param {object} proofData - { text?: string, imageBase64?: string, imageMimeType?: string }
 * @returns {{ verified: boolean, message: string }}
 */
async function verifyProof(questDescription, proofInstructions, proofType, proofData) {
  // Honor system — always pass
  if (proofType === 'honor_system') {
    return { verified: true, message: 'Quest completed on your honor. We trust you, warrior. ⚔️' };
  }

  // If no API key, auto-approve
  if (!GEMINI_API_KEY) {
    return { verified: true, message: 'Proof accepted! (AI verification unavailable — approved automatically) ✅' };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are verifying quest completion proof for an RPG life gamification app.

QUEST: ${questDescription}
REQUIRED PROOF: ${proofInstructions}
PROOF TYPE: ${proofType}

${proofType === 'text' ? `USER SUBMITTED TEXT: "${proofData.text || ''}"` : 'USER SUBMITTED A PHOTO (see image below).'}

RULES:
- Be GENEROUS. If the user made a genuine attempt, approve it.
- If it's close enough, approve it.
- Only reject if it's clearly unrelated or empty.
- Your message should be encouraging, witty, and RPG-flavored (1-2 sentences).
- If approved: celebrate their effort.
- If rejected: be kind, explain what's missing, encourage retry.

Return ONLY valid JSON: { "verified": true/false, "message": "your message" }`;

    const parts = [{ text: prompt }];

    // Add image if it's a photo proof
    if (proofType === 'photo' && proofData.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: proofData.imageMimeType || 'image/jpeg',
          data: proofData.imageBase64,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);
    return {
      verified: !!data.verified,
      message: data.message || (data.verified ? 'Proof accepted!' : 'Hmm, try again.'),
    };
  } catch (err) {
    console.warn('⚠️  Proof verification failed:', err.message);
    // On error, give benefit of the doubt
    return { verified: true, message: 'Proof accepted! (verification hiccup — approved anyway) ✅' };
  }
}

module.exports = { verifyProof };

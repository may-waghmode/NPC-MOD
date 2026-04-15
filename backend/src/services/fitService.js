const axios = require('axios');

/**
 * Fetch step count and sleep data from Google Fit for the last 7 days.
 *
 * Uses the Google Fit REST API. Requires user's OAuth access token.
 *
 * @param {string} accessToken - Google OAuth2 access token
 * @returns {{ steps: number[], sleep: number[] }} Daily totals for last 7 days
 */
async function getActivityData(accessToken) {
  try {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // ── Step Count ──────────────────────────────────────────────
    const stepsResponse = await axios.post(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        aggregateBy: [
          {
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
          },
        ],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const steps = (stepsResponse.data.bucket || []).map((bucket) => {
      const point = bucket.dataset?.[0]?.point?.[0];
      return point?.value?.[0]?.intVal || 0;
    });

    // ── Sleep Data ──────────────────────────────────────────────
    let sleep = [];
    try {
      const sleepResponse = await axios.post(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          aggregateBy: [
            { dataTypeName: 'com.google.sleep.segment' },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: sevenDaysAgo,
          endTimeMillis: now,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      sleep = (sleepResponse.data.bucket || []).map((bucket) => {
        const points = bucket.dataset?.[0]?.point || [];
        // Sum up sleep duration in hours
        let totalMs = 0;
        for (const p of points) {
          const start = parseInt(p.startTimeNanos) / 1e6;
          const end = parseInt(p.endTimeNanos) / 1e6;
          totalMs += end - start;
        }
        return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10; // hours, 1 decimal
      });
    } catch {
      // Sleep data may not be available for all users
      sleep = new Array(7).fill(0);
    }

    return { steps, sleep };
  } catch (err) {
    console.error('Google Fit API error:', err.message);
    return { steps: [], sleep: [] };
  }
}

module.exports = { getActivityData };

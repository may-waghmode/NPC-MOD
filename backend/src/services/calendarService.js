const { google } = require('googleapis');

/**
 * Fetch user's Google Calendar events for the next 7 days.
 *
 * Requires the user's OAuth access token stored in their profile
 * or a service-level credential. For the hackathon demo we accept
 * the access token via the request.
 *
 * @param {string} accessToken - Google OAuth2 access token
 * @returns {object[]} Simplified event list
 */
async function getUpcomingEvents(accessToken) {
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });

    const events = (response.data.items || []).map((event) => ({
      title: event.summary || '(No title)',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      isAllDay: !event.start?.dateTime,
      location: event.location || null,
    }));

    return events;
  } catch (err) {
    console.error('Calendar API error:', err.message);
    return [];
  }
}

module.exports = { getUpcomingEvents };

const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getUpcomingEvents } = require('../services/calendarService');
const { getActivityData } = require('../services/fitService');
const { getMoodData } = require('../services/spotifyService');

const router = express.Router();

// All data routes require authentication
router.use(authMiddleware);

/**
 * GET /api/data/calendar
 *
 * Fetches user's Google Calendar events for next 7 days.
 * Expects ?accessToken=<google_oauth_token> query param
 * OR the token stored in user profile.
 */
router.get('/calendar', async (req, res, next) => {
  try {
    const accessToken = req.query.accessToken || req.headers['x-google-token'];

    if (!accessToken) {
      return res.status(400).json({
        error: true,
        message: 'Google OAuth access token required. Pass as ?accessToken= or X-Google-Token header.',
        code: 'MISSING_GOOGLE_TOKEN',
      });
    }

    const events = await getUpcomingEvents(accessToken);
    res.json({ events, count: events.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/data/activity
 *
 * Fetches Google Fit step count and sleep for last 7 days.
 * Expects ?accessToken=<google_oauth_token> query param.
 */
router.get('/activity', async (req, res, next) => {
  try {
    const accessToken = req.query.accessToken || req.headers['x-google-token'];

    if (!accessToken) {
      return res.status(400).json({
        error: true,
        message: 'Google OAuth access token required. Pass as ?accessToken= or X-Google-Token header.',
        code: 'MISSING_GOOGLE_TOKEN',
      });
    }

    const data = await getActivityData(accessToken);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/data/mood
 *
 * Fetches Spotify recently played tracks and derives mood score.
 * Expects ?accessToken=<spotify_oauth_token> query param.
 */
router.get('/mood', async (req, res, next) => {
  try {
    const accessToken = req.query.accessToken || req.headers['x-spotify-token'];

    if (!accessToken) {
      return res.status(400).json({
        error: true,
        message: 'Spotify OAuth access token required. Pass as ?accessToken= or X-Spotify-Token header.',
        code: 'MISSING_SPOTIFY_TOKEN',
      });
    }

    const moodData = await getMoodData(accessToken);
    res.json(moodData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const SpotifyWebApi = require('spotify-web-api-node');

/**
 * Mood mapping based on Spotify audio features.
 *
 * energy (0–1) and valence (0–1) from Spotify's audio features
 * are combined into a single mood score (0–100).
 *
 *   High valence + High energy  → Euphoric / Pumped up
 *   High valence + Low energy   → Calm / Content
 *   Low valence  + High energy  → Angry / Anxious
 *   Low valence  + Low energy   → Sad / Down
 */
function calculateMoodScore(energy, valence) {
  // Weighted formula: valence matters more for "mood"
  return Math.round((valence * 0.6 + energy * 0.4) * 100);
}

/**
 * Fetch recently played tracks and derive a mood score.
 *
 * @param {string} accessToken - Spotify OAuth access token
 * @returns {{ mood: number, recentGenres: string[], energy: number, recentTracks: string[] }}
 */
async function getMoodData(accessToken) {
  try {
    const spotify = new SpotifyWebApi();
    spotify.setAccessToken(accessToken);

    // Get recently played tracks (max 50)
    const recentResponse = await spotify.getMyRecentlyPlayedTracks({ limit: 20 });
    const tracks = recentResponse.body.items || [];

    if (tracks.length === 0) {
      return { mood: 50, recentGenres: [], energy: 0.5, recentTracks: [] };
    }

    const trackIds = tracks.map((t) => t.track.id);
    const artistIds = [...new Set(tracks.map((t) => t.track.artists[0]?.id).filter(Boolean))];

    // Get audio features for tracks
    let avgEnergy = 0.5;
    let avgValence = 0.5;
    try {
      const featuresResponse = await spotify.getAudioFeaturesForTracks(trackIds);
      const features = (featuresResponse.body.audio_features || []).filter(Boolean);

      if (features.length > 0) {
        avgEnergy = features.reduce((sum, f) => sum + (f.energy || 0), 0) / features.length;
        avgValence = features.reduce((sum, f) => sum + (f.valence || 0), 0) / features.length;
      }
    } catch {
      // Audio features may fail; proceed with defaults
    }

    // Get genres from artists
    let genres = [];
    try {
      if (artistIds.length > 0) {
        const artistResponse = await spotify.getArtists(artistIds.slice(0, 50));
        genres = artistResponse.body.artists
          .flatMap((a) => a.genres || [])
          .filter(Boolean);
      }
    } catch {
      // Genre lookup may fail; proceed with empty
    }

    // Deduplicate genres, take top 5
    const uniqueGenres = [...new Set(genres)].slice(0, 5);

    const recentTrackNames = tracks.slice(0, 5).map(
      (t) => `${t.track.name} — ${t.track.artists.map((a) => a.name).join(', ')}`
    );

    return {
      mood: calculateMoodScore(avgEnergy, avgValence),
      recentGenres: uniqueGenres,
      energy: Math.round(avgEnergy * 100) / 100,
      recentTracks: recentTrackNames,
    };
  } catch (err) {
    console.error('Spotify API error:', err.message);
    return { mood: 50, recentGenres: [], energy: 0.5, recentTracks: [] };
  }
}

module.exports = { getMoodData, calculateMoodScore };

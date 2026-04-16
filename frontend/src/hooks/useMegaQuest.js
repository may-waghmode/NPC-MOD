/**
 * useMegaQuest — global mega quest with live countdown.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useMegaQuest() {
  const [megaQuest, setMegaQuest] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMegaQuest = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/global/mega-quest');
      setMegaQuest(data);
      setTimeRemaining(data.timeRemaining || 0);
    } catch (err) {
      console.warn('Mega quest unavailable:', err.message || err);
      // Fallback mock
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 5);
      setMegaQuest({
        title: '🏆 The Comfort Zone Crusher',
        description_template: 'Do something this week that genuinely makes you uncomfortable but grows you.',
        xpReward: 400,
        participantCount: 847,
        endTime: endTime.toISOString(),
        timeRemaining: endTime.getTime() - Date.now(),
      });
      setTimeRemaining(endTime.getTime() - Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMegaQuest(); }, [fetchMegaQuest]);

  // Live countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining > 0]);

  const acceptMegaQuest = useCallback(async () => {
    try {
      const { data } = await api.post('/global/mega-quest/accept');
      setMegaQuest(prev => ({ ...prev, participantCount: data.participantCount, accepted: true }));
      return data;
    } catch (err) {
      console.warn('Accept mega quest failed:', err.message || err);
      setMegaQuest(prev => ({ ...prev, accepted: true }));
    }
  }, []);

  const formatTime = useCallback((ms) => {
    if (ms <= 0) return 'EXPIRED';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }, []);

  return {
    megaQuest,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    loading,
    acceptMegaQuest,
    refetch: fetchMegaQuest,
  };
}

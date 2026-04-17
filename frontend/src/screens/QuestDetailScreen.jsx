import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuests } from '../hooks/useQuests';
import LevelUpModal from '../components/LevelUpModal';
import { usePlayer } from '../hooks/usePlayer';
import './QuestDetailScreen.css';

const CAT_COLORS = { fitness: '#00E5A0', growth: '#6C63FF', social: '#FF6B9D', chaos: '#FF9F43', boss: '#FF4757' };

export default function QuestDetailScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const quest = location.state?.quest;
  const { completeQuest } = useQuests();
  const { refetch: refetchPlayer } = usePlayer();
  const fileInputRef = useRef(null);

  const [proofImages, setProofImages] = useState([]); // array of { base64, mimeType, preview, fileName }
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  if (!quest) {
    navigate('/');
    return null;
  }

  const catColor = CAT_COLORS[quest.category] || '#6C63FF';

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos total
    const maxPhotos = 5;
    const remaining = maxPhotos - proofImages.length;
    const toProcess = files.slice(0, remaining);

    if (files.length > remaining) {
      alert(`You can upload up to ${maxPhotos} photos. Adding first ${remaining}.`);
    }

    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is over 5MB, skipping.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProofImages(prev => [
          ...prev,
          {
            base64: reader.result.split(',')[1],
            mimeType: file.type,
            preview: reader.result,
            fileName: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (proofImages.length === 0) {
      alert('📸 Please upload at least one photo!');
      return;
    }

    setVerifying(true);

    // Send all images to backend
    const proofData = {
      images: proofImages.map(img => ({
        base64: img.base64,
        mimeType: img.mimeType,
      })),
      // Also send first image as legacy fields for backward compat
      imageBase64: proofImages[0].base64,
      imageMimeType: proofImages[0].mimeType,
    };

    try {
      const res = await completeQuest(quest.id, 'photo', proofData);
      setResult(res);
      if (res.leveledUp) {
        setTimeout(() => setLevelUp({ level: res.newLevel, title: res.title }), 800);
      }
      refetchPlayer();
    } catch (err) {
      setResult({ verified: true, message: 'Completed!', earnedXP: quest.xp_reward || 50 });
    }
    setVerifying(false);
  };

  const canSubmit = () => {
    if (verifying) return false;
    if (proofImages.length === 0) return false;
    return true;
  };

  return (
    <div className="quest-detail-screen">
      {/* Header */}
      <div className="qd-header" style={{ borderBottom: `2px solid ${catColor}` }}>
        <button className="qd-back" onClick={() => navigate(-1)}>← BACK</button>
        <span className="qd-cat-badge" style={{ color: catColor }}>
          {quest.category}
        </span>
      </div>

      <div className="qd-body">
        {/* Quest Title Block */}
        <div className="qd-title-block" style={{ borderLeftColor: catColor }}>
          <h1 className="qd-title">{quest.title}</h1>
          <p className="qd-desc">{quest.description}</p>
        </div>

        {/* From Friend Badge */}
        {quest.assignedByName && (
          <div className="qd-from-friend" style={{ borderLeftColor: '#FF6B9D' }}>
            <span>👤 Challenge from <strong>{quest.assignedByName}</strong></span>
            {quest.challengeXpReward && (
              <span className="font-game" style={{ color: 'var(--xp-gold)', fontSize: 12 }}>
                ⚡ {quest.challengeXpReward} XP wagered
              </span>
            )}
          </div>
        )}

        {/* Why It Helps */}
        {quest.why_it_helps && (
          <div className="qd-insight" style={{ borderLeftColor: catColor }}>
            <span className="qd-insight-icon">💡</span>
            <div>
              <span className="qd-insight-label">Why This Helps You</span>
              <p className="qd-insight-text">{quest.why_it_helps}</p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="qd-meta-row">
          <div className="qd-meta-chip">
            <span className="qd-meta-val font-game" style={{ color: 'var(--xp-gold)' }}>⚡ {quest.xp_reward || quest.xpReward || 50}</span>
            <span className="qd-meta-key">XP Reward</span>
          </div>
          <div className="qd-meta-chip">
            <span className="qd-meta-val">~{quest.estimated_minutes || 30}m</span>
            <span className="qd-meta-key">Estimated</span>
          </div>
          <div className="qd-meta-chip">
            <span className="qd-meta-val">📸</span>
            <span className="qd-meta-key">Photo Proof</span>
          </div>
        </div>

        {/* ── Photo Proof Submission ── */}
        {!result && (
          <div className="qd-proof">
            <h3 className="qd-proof-heading">📸 Upload Photo Proof</h3>
            {quest.proof_instructions && (
              <p className="qd-proof-hint">{quest.proof_instructions}</p>
            )}

            {/* Photo Grid (show uploaded photos) */}
            {proofImages.length > 0 && (
              <div className="qd-photo-grid">
                {proofImages.map((img, i) => (
                  <div key={i} className="qd-photo-thumb">
                    <img src={img.preview} alt={`Proof ${i + 1}`} />
                    <button className="qd-photo-remove" onClick={() => removeImage(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add More Photos Button */}
            {proofImages.length < 5 && (
              <label className="qd-photo-drop">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImageUpload}
                  hidden
                />
                <span style={{ fontSize: 32 }}>📸</span>
                <span style={{ fontWeight: 600 }}>
                  {proofImages.length === 0 ? 'Tap to take photo or upload' : 'Add more photos'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  JPG, PNG — max 5MB each • {proofImages.length}/5 photos
                </span>
              </label>
            )}

            <button
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: 16 }}
              onClick={handleSubmit}
              disabled={!canSubmit()}
            >
              {verifying ? (
                <span>🤖 AI is checking your photos...</span>
              ) : (
                <span>📸 Submit {proofImages.length > 0 ? `${proofImages.length} Photo${proofImages.length > 1 ? 's' : ''}` : ''} & Complete</span>
              )}
            </button>

            {proofImages.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                Upload at least 1 photo. AI will check if it matches the quest.
              </p>
            )}
          </div>
        )}

        {/* ── Result ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              className={`qd-result ${result.verified ? 'qd-result--ok' : 'qd-result--fail'}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <span className="qd-result-icon">{result.verified ? '🎉' : '🤔'}</span>
              <p className="qd-result-msg">{result.message}</p>
              {result.verified && (result.earnedXP || 0) > 0 && (
                <motion.p
                  className="font-game" style={{ fontSize: 18, color: 'var(--xp-gold)', textShadow: '0 0 16px rgba(255,215,0,0.5)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  +{result.earnedXP} XP
                </motion.p>
              )}
              {result.streakMultiplier > 1 && (
                <p style={{ fontSize: 12, color: 'var(--success)' }}>🔥 Streak bonus: {result.streakMultiplier}x</p>
              )}
              {!result.verified && (
                <button
                  className="btn btn--primary btn--full"
                  style={{ marginTop: 12 }}
                  onClick={() => { setResult(null); setProofImages([]); }}
                >
                  📸 Try Again with Different Photos
                </button>
              )}
              {result.hiddenQuestUnlocked && (
                <motion.div
                  className="qd-hidden-quest"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span>🔮 HIDDEN QUEST UNLOCKED!</span>
                  <p>{result.hiddenQuestUnlocked.title}</p>
                </motion.div>
              )}
              {result.verified && (
                <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
                  ← Back to Quests
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {levelUp && <LevelUpModal level={levelUp.level} title={levelUp.title} onClose={() => { setLevelUp(null); navigate('/'); }} />}
      </AnimatePresence>
    </div>
  );
}

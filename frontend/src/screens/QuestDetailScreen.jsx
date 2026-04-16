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

  const [proofText, setProofText] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  if (!quest) {
    navigate('/');
    return null;
  }

  const catColor = CAT_COLORS[quest.category] || '#6C63FF';
  const proofType = quest.proof_type || 'honor_system';

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofImage({
        base64: reader.result.split(',')[1],
        mimeType: file.type,
        preview: reader.result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setVerifying(true);
    const proofData = {};

    if (proofType === 'text') {
      proofData.text = proofText;
    }
    if (proofType === 'photo') {
      if (proofImage) {
        proofData.imageBase64 = proofImage.base64;
        proofData.imageMimeType = proofImage.mimeType;
      } else {
        // No photo? Submit as honor system
        proofData.text = 'Completed (no photo attached)';
      }
    }

    try {
      const res = await completeQuest(quest.id, proofType, proofData);
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
    if (proofType === 'text' && !proofText.trim()) return false;
    // Photo proof: allow submit even without photo (will auto-approve)
    return true;
  };

  return (
    <div className="quest-detail-screen">
      {/* Header */}
      <div className="qd-header" style={{ borderBottom: `2px solid ${catColor}33` }}>
        <button className="qd-back" onClick={() => navigate(-1)}>← Back</button>
        <span className="qd-cat-badge" style={{ background: `${catColor}20`, color: catColor }}>
          {quest.category}
        </span>
      </div>

      <div className="qd-body">
        {/* Quest Info */}
        <h1 className="qd-title">{quest.title}</h1>
        <p className="qd-desc">{quest.description}</p>

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
            <span className="qd-meta-val">{proofType === 'photo' ? '📸' : proofType === 'text' ? '✍️' : '✅'}</span>
            <span className="qd-meta-key">{proofType === 'photo' ? 'Photo' : proofType === 'text' ? 'Text' : 'Honor'}</span>
          </div>
        </div>

        {/* ── Proof Submission ── */}
        {!result && (
          <div className="qd-proof">
            <h3 className="qd-proof-heading">Submit Your Proof</h3>
            {quest.proof_instructions && (
              <p className="qd-proof-hint">{quest.proof_instructions}</p>
            )}

            {/* Photo Upload */}
            {proofType === 'photo' && (
              <div className="qd-photo-area">
                {proofImage ? (
                  <div className="qd-photo-preview-wrap">
                    <img src={proofImage.preview} alt="Proof" className="qd-photo-img" />
                    <div className="qd-photo-actions">
                      <span className="qd-photo-name">📎 {proofImage.fileName}</span>
                      <button className="btn btn--ghost btn--sm" onClick={() => { setProofImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="qd-photo-drop">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      hidden
                    />
                    <span style={{ fontSize: 36 }}>📸</span>
                    <span style={{ fontWeight: 600 }}>Tap to take photo or upload</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>JPG, PNG — max 5MB</span>
                  </label>
                )}
                <p className="qd-photo-optional">💡 Photo is optional. You can submit without one and it'll be auto-approved.</p>
              </div>
            )}

            {/* Text Input */}
            {proofType === 'text' && (
              <textarea
                className="input qd-text-input"
                placeholder="Describe what you did..."
                value={proofText}
                onChange={e => setProofText(e.target.value)}
                rows={4}
                autoFocus
              />
            )}

            {proofType === 'honor_system' && (
              <p className="qd-honor-msg">This quest uses the honor system. Just click submit when you're done! 🤝</p>
            )}

            <button
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: 16 }}
              onClick={handleSubmit}
              disabled={!canSubmit()}
            >
              {verifying ? (
                <span>🤖 AI is verifying your proof...</span>
              ) : (
                <span>✅ Submit & Complete</span>
              )}
            </button>
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
              <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
                ← Back to Quests
              </button>
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

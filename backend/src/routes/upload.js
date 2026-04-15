const express = require('express');
const multer = require('multer');
const { admin } = require('../firebase/config');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for in-memory file handling (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
  },
});

router.use(authMiddleware);

/**
 * POST /api/upload/proof
 *
 * Upload a photo as proof of quest completion.
 * Returns a public download URL to store in the quest's `proof` field.
 *
 * Form data:
 *   - image: file (JPEG/PNG/WebP/GIF, max 10MB)
 *   - questId: string (optional, for organizing files)
 *
 * Returns: { success: true, url: string }
 */
router.post('/proof', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No image file provided. Send as form-data with key "image".',
        code: 'MISSING_FILE',
      });
    }

    const { userId } = req;
    const questId = req.body.questId || 'general';
    const fileExtension = req.file.mimetype.split('/')[1];
    const fileName = `proofs/${userId}/${questId}/${uuidv4()}.${fileExtension}`;

    // Get Firebase Storage bucket
    const bucket = admin.storage().bucket();

    // Create a file reference and upload
    const file = bucket.file(fileName);
    const token = uuidv4(); // Public access token

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    // Build the public download URL
    const bucketName = bucket.name;
    const encodedFileName = encodeURIComponent(fileName);
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedFileName}?alt=media&token=${token}`;

    res.json({
      success: true,
      url: downloadURL,
      fileName,
    });
  } catch (err) {
    if (err.message?.includes('Only JPEG')) {
      return res.status(400).json({ error: true, message: err.message, code: 'INVALID_FILE_TYPE' });
    }
    next(err);
  }
});

module.exports = router;

const { db, admin } = require('./config');

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

// ── User Helpers ───────────────────────────────────────────────

/** Get a user document by userId */
async function getUser(userId) {
  const snap = await db.collection('users').doc(userId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/** Create or merge a user document */
async function setUser(userId, data, merge = true) {
  await db.collection('users').doc(userId).set(data, { merge });
}

/** Update specific fields on a user document */
async function updateUser(userId, data) {
  await db.collection('users').doc(userId).update(data);
}

// ── Subcollection Helpers ──────────────────────────────────────

/** Add a document to a subcollection under a user */
async function addSubDoc(userId, subcollection, data) {
  const ref = await db
    .collection('users')
    .doc(userId)
    .collection(subcollection)
    .add({ ...data, createdAt: Timestamp.now() });
  return ref.id;
}

/** Get a specific subdocument */
async function getSubDoc(userId, subcollection, docId) {
  const snap = await db
    .collection('users')
    .doc(userId)
    .collection(subcollection)
    .doc(docId)
    .get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/** Update a specific subdocument */
async function updateSubDoc(userId, subcollection, docId, data) {
  await db
    .collection('users')
    .doc(userId)
    .collection(subcollection)
    .doc(docId)
    .update(data);
}

/** Query a subcollection with optional ordering and limit */
async function querySubCollection(userId, subcollection, { orderBy, direction = 'desc', limit, where } = {}) {
  let query = db.collection('users').doc(userId).collection(subcollection);

  if (where) {
    query = query.where(where.field, where.op, where.value);
  }
  if (orderBy) {
    query = query.orderBy(orderBy, direction);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const snap = await query.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ── Friends Collection Helpers ─────────────────────────────────

/** Add a friend relationship */
async function addFriend(userId, friendId, data) {
  await db
    .collection('friends')
    .doc(userId)
    .collection('friends')
    .doc(friendId)
    .set({ ...data, addedAt: Timestamp.now() });
}

/** Get all friends for a user */
async function getFriends(userId) {
  const snap = await db.collection('friends').doc(userId).collection('friends').get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/** Update a friend relationship status */
async function updateFriend(userId, friendId, data) {
  await db.collection('friends').doc(userId).collection('friends').doc(friendId).update(data);
}

module.exports = {
  getUser,
  setUser,
  updateUser,
  addSubDoc,
  getSubDoc,
  updateSubDoc,
  querySubCollection,
  addFriend,
  getFriends,
  updateFriend,
  FieldValue,
  Timestamp,
};

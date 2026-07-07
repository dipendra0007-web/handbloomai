import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  transports: ['websocket', 'polling'],
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Online users & live streams tracking ──────────────────────────────────────
const onlineMap = new Map();          // uid → socketId
const activeStreams = new Map();       // uid → { title, startedAt, viewers: Set }

let db;
async function initDb() {
  db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      avatarEmoji TEXT DEFAULT '🌸',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      instagram TEXT DEFAULT '',
      twitter TEXT DEFAULT '',
      github TEXT DEFAULT '',
      youtube TEXT DEFAULT '',
      hobbies TEXT DEFAULT '',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      flowers INTEGER DEFAULT 0,
      shared INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      isBlocked INTEGER DEFAULT 0,
      isCreator INTEGER DEFAULT 0,
      joinedAt TEXT NOT NULL
    )
  `);

  // Migrations for existing DB
  const migrations = [
    `ALTER TABLE users ADD COLUMN instagram TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN twitter TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN github TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN youtube TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN hobbies TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN isBlocked INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN isCreator INTEGER DEFAULT 0`,
  ];
  for (const m of migrations) { try { await db.exec(m); } catch {} }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT,
      followed_id TEXT,
      PRIMARY KEY (follower_id, followed_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      blocker_id TEXT,
      blocked_id TEXT,
      PRIMARY KEY (blocker_id, blocked_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      senderName TEXT NOT NULL,
      receiver TEXT NOT NULL,
      receiverName TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatarEmoji TEXT DEFAULT '🌸',
      avatar TEXT,
      lastSeen TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS creator_requests (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT,
      avatarEmoji TEXT DEFAULT '🌸',
      reason TEXT NOT NULL,
      portfolio TEXT DEFAULT '',
      social TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      requestedAt TEXT NOT NULL,
      reviewedAt TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS live_streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      streamer_uid TEXT NOT NULL,
      streamer_name TEXT NOT NULL,
      streamer_avatar TEXT,
      title TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      peak_viewers INTEGER DEFAULT 0,
      total_comments INTEGER DEFAULT 0,
      total_gifts INTEGER DEFAULT 0
    )
  `);

  // Ensure admin exists
  const adminEmail = 'info.dipendraupadhayay.2005@gmail.com';
  const adminPassword = 'upadhayaydipendra621@@';
  const admin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!admin) {
    await db.run(`INSERT INTO users (uid,name,username,email,password,role,bio,joinedAt)
      VALUES (?,?,?,?,?,?,?,?)`,
      ['admin-001','Dipendra Upadhyay','@admin',adminEmail,adminPassword,'admin','HandBloom AI Administrator',new Date().toISOString()]
    );
  }
  console.log('✅ SQLite database initialized at', dbPath);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pushToUser(uid, event, data) { io.to(`user:${uid}`).emit(event, data); }
function pushToAll(event, data) { io.emit(event, data); }
function pushToAdmins(event, data) { io.to('admins').emit(event, data); }

async function getFullUser(uid) {
  const user = await db.get('SELECT * FROM users WHERE uid=?', [uid]);
  if (!user) return null;
  delete user.password;
  const follows = await db.all('SELECT followed_id FROM follows WHERE follower_id=?', [uid]);
  const followers = await db.all('SELECT follower_id FROM follows WHERE followed_id=?', [uid]);
  const blocks = await db.all('SELECT blocked_id FROM blocks WHERE blocker_id=?', [uid]);
  user.following = follows.map(f => f.followed_id);
  user.followers = followers.map(f => f.follower_id);
  user.blockedUsers = blocks.map(b => b.blocked_id);
  user.isOnline = onlineMap.has(uid);
  user.isLive = activeStreams.has(uid);
  return user;
}

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const uid = socket.handshake.auth?.uid;
  if (!uid) return;

  socket.join(`user:${uid}`);
  onlineMap.set(uid, socket.id);

  db.get('SELECT role FROM users WHERE uid=?', [uid]).then(u => {
    if (u?.role === 'admin') socket.join('admins');
  }).catch(() => {});

  io.emit('user:online', { uid });
  console.log(`🟢 Socket connected uid=${uid}`);

  // ── Typing indicators ──────────────────────────────────────────────────────
  socket.on('typing:start', ({ toUid }) => pushToUser(toUid, 'typing:start', { fromUid: uid }));
  socket.on('typing:stop', ({ toUid }) => pushToUser(toUid, 'typing:stop', { fromUid: uid }));
  socket.on('message:read', ({ toUid }) => pushToUser(toUid, 'message:read', { fromUid: uid }));

  // ── Live Stream Events ─────────────────────────────────────────────────────

  // Streamer starts a live stream
  socket.on('live:start', async ({ title, streamerName, streamerAvatar }) => {
    if (activeStreams.has(uid)) return; // already live
    const startedAt = new Date().toISOString();
    activeStreams.set(uid, { title, streamerName, streamerAvatar, startedAt, viewers: new Set(), comments: 0, gifts: 0 });
    socket.join(`live:${uid}`);

    // Save to DB
    const result = await db.run(
      'INSERT INTO live_streams (streamer_uid,streamer_name,streamer_avatar,title,started_at) VALUES (?,?,?,?,?)',
      [uid, streamerName, streamerAvatar || null, title, startedAt]
    ).catch(() => ({ lastID: null }));

    const streamData = { uid, title, streamerName, streamerAvatar, startedAt, viewers: 0, streamId: result.lastID };
    pushToAll('live:started', streamData);
    pushToAdmins('admin:liveStarted', streamData);
    socket.emit('live:startConfirmed', { streamId: result.lastID });
    console.log(`🎥 Live started: uid=${uid} title="${title}"`);
  });

  // Viewer joins a live stream
  socket.on('live:join', async ({ streamerUid }) => {
    const stream = activeStreams.get(streamerUid);
    if (!stream) { socket.emit('live:notFound'); return; }
    socket.join(`live:${streamerUid}`);
    stream.viewers.add(uid);
    const count = stream.viewers.size;
    if (count > (stream.peakViewers || 0)) stream.peakViewers = count;

    io.to(`live:${streamerUid}`).emit('live:viewerCount', { streamerUid, count });
    socket.emit('live:joined', { streamerUid, title: stream.title, streamerName: stream.streamerName, streamerAvatar: stream.streamerAvatar, startedAt: stream.startedAt });
    console.log(`👁 Viewer joined live uid=${streamerUid}, viewers=${count}`);
  });

  // Viewer leaves stream
  socket.on('live:leave', ({ streamerUid }) => {
    const stream = activeStreams.get(streamerUid);
    if (stream) {
      stream.viewers.delete(uid);
      io.to(`live:${streamerUid}`).emit('live:viewerCount', { streamerUid, count: stream.viewers.size });
    }
    socket.leave(`live:${streamerUid}`);
  });

  // ── WebRTC Signaling Events ───────────────────────────────────────────────
  socket.on('webrtc:join-relay', ({ streamerUid }) => {
    pushToUser(streamerUid, 'webrtc:viewer-joined', { viewerUid: uid });
  });

  socket.on('webrtc:offer', ({ toUid, offer }) => {
    pushToUser(toUid, 'webrtc:offer', { fromUid: uid, offer });
  });

  socket.on('webrtc:answer', ({ toUid, answer }) => {
    pushToUser(toUid, 'webrtc:answer', { fromUid: uid, answer });
  });

  socket.on('webrtc:candidate', ({ toUid, candidate }) => {
    pushToUser(toUid, 'webrtc:candidate', { fromUid: uid, candidate });
  });

  // Comment in live stream
  socket.on('live:comment', async ({ streamerUid, text, senderName, senderAvatar, senderEmoji }) => {
    const stream = activeStreams.get(streamerUid);
    if (!stream) return;
    stream.comments = (stream.comments || 0) + 1;
    const comment = { uid, senderName, senderAvatar, senderEmoji, text, ts: Date.now() };
    io.to(`live:${streamerUid}`).emit('live:comment', comment);
  });

  // Gift in live stream
  socket.on('live:gift', async ({ streamerUid, gift, senderName, senderEmoji }) => {
    const stream = activeStreams.get(streamerUid);
    if (!stream) return;
    stream.gifts = (stream.gifts || 0) + 1;
    const giftData = { uid, senderName, senderEmoji, gift, ts: Date.now() };
    io.to(`live:${streamerUid}`).emit('live:gift', giftData);
    pushToAdmins('admin:liveGift', { streamerUid, ...giftData });
  });

  // Streamer ends stream
  socket.on('live:stop', async () => {
    const stream = activeStreams.get(uid);
    if (!stream) return;
    activeStreams.delete(uid);
    const endedAt = new Date().toISOString();
    await db.run(
      'UPDATE live_streams SET ended_at=?,peak_viewers=?,total_comments=?,total_gifts=? WHERE streamer_uid=? AND ended_at IS NULL',
      [endedAt, stream.peakViewers || 0, stream.comments || 0, stream.gifts || 0, uid]
    ).catch(() => {});
    io.to(`live:${uid}`).emit('live:ended', { streamerUid: uid });
    pushToAll('live:stopped', { uid });
    pushToAdmins('admin:liveStopped', { uid, endedAt });
    console.log(`🛑 Live ended: uid=${uid}`);
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    onlineMap.delete(uid);
    io.emit('user:offline', { uid });
    // Auto-end stream if streamer disconnects
    if (activeStreams.has(uid)) {
      const stream = activeStreams.get(uid);
      activeStreams.delete(uid);
      const endedAt = new Date().toISOString();
      await db.run(
        'UPDATE live_streams SET ended_at=?,peak_viewers=?,total_comments=?,total_gifts=? WHERE streamer_uid=? AND ended_at IS NULL',
        [endedAt, stream.peakViewers || 0, stream.comments || 0, stream.gifts || 0, uid]
      ).catch(() => {});
      io.to(`live:${uid}`).emit('live:ended', { streamerUid: uid });
      pushToAll('live:stopped', { uid });
    }
    console.log(`🔴 Socket disconnected uid=${uid}`);
  });
});

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const cleanUsername = username.startsWith('@') ? username : `@${username}`;
    const existingEmail = await db.get('SELECT uid FROM users WHERE LOWER(email)=LOWER(?)', [email]);
    if (existingEmail) return res.status(400).json({ error: 'An account with this email already exists.' });
    const existingUser = await db.get('SELECT uid FROM users WHERE LOWER(username)=LOWER(?)', [cleanUsername]);
    if (existingUser) return res.status(400).json({ error: 'Username already taken. Try another.' });

    const uid = `user-${Date.now()}`;
    const joinedAt = new Date().toISOString();
    await db.run(`INSERT INTO users (uid,name,username,email,password,joinedAt) VALUES (?,?,?,?,?,?)`,
      [uid, name, cleanUsername, email, password, joinedAt]);
    await db.run(`INSERT OR REPLACE INTO active_sessions (uid,name,avatarEmoji,lastSeen) VALUES (?,?,?,?)`,
      [uid, name, '🌸', joinedAt]);

    const user = { uid, name, username: cleanUsername, email, role: 'user', joinedAt, avatarEmoji: '🌸', bio: '', location: '', website: '', instagram: '', twitter: '', github: '', youtube: '', level: 1, xp: 0, flowers: 0, shared: 0, likes: 0, isCreator: 0, following: [], followers: [], blockedUsers: [] };
    pushToAll('user:registered', user);
    pushToAdmins('admin:userRegistered', user);
    res.status(201).json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE LOWER(email)=LOWER(?) AND password=?', [email, password]);
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (user.isBlocked) return res.status(403).json({ error: 'Your account has been suspended by admin.' });
    await db.run(`INSERT OR REPLACE INTO active_sessions (uid,name,avatarEmoji,avatar,lastSeen) VALUES (?,?,?,?,?)`,
      [user.uid, user.name, user.avatarEmoji, user.avatar, new Date().toISOString()]);
    const sessionUser = await getFullUser(user.uid);
    res.json(sessionUser);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/heartbeat', async (req, res) => {
  const { uid, name, avatarEmoji, avatar } = req.body;
  try {
    await db.run(`INSERT OR REPLACE INTO active_sessions (uid,name,avatarEmoji,avatar,lastSeen) VALUES (?,?,?,?,?)`,
      [uid, name, avatarEmoji, avatar, new Date().toISOString()]);
    const user = await getFullUser(uid);
    if (!user) return res.json({ success: true });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/logout', async (req, res) => {
  const { uid } = req.body;
  try {
    await db.run('DELETE FROM active_sessions WHERE uid=?', [uid]);
    pushToAll('user:offline', { uid });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/profile', async (req, res) => {
  const { uid, name, username, email, bio, location, website, instagram, twitter, github, youtube, avatarEmoji, avatar, hobbies } = req.body;
  try {
    const cleanUsername = username.startsWith('@') ? username : `@${username}`;
    if (email) {
      const emailCheck = await db.get('SELECT uid FROM users WHERE LOWER(email)=LOWER(?) AND uid != ?', [email, uid]);
      if (emailCheck) return res.status(400).json({ error: 'Email is already registered by another account.' });
    }
    if (username) {
      const usernameCheck = await db.get('SELECT uid FROM users WHERE LOWER(username)=LOWER(?) AND uid != ?', [cleanUsername, uid]);
      if (usernameCheck) return res.status(400).json({ error: 'Username is already taken.' });
    }
    await db.run(`UPDATE users SET name=?,username=?,email=?,bio=?,location=?,website=?,instagram=?,twitter=?,github=?,youtube=?,avatarEmoji=?,avatar=?,hobbies=? WHERE uid=?`,
      [name, cleanUsername, email, bio, location, website, instagram || '', twitter || '', github || '', youtube || '', avatarEmoji, avatar, hobbies || '', uid]);
    const user = await getFullUser(uid);
    pushToAll('user:profileUpdated', user);
    pushToAdmins('admin:userUpdated', user);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USERS ─────────────────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT uid,name,username,email,role,bio,location,website,instagram,twitter,github,youtube,avatar,avatarEmoji,level,xp,flowers,shared,likes,isBlocked,isCreator,joinedAt,hobbies FROM users');
    const follows = await db.all('SELECT * FROM follows');
    const blocks = await db.all('SELECT * FROM blocks');
    const usersWithData = users.map(u => ({
      ...u,
      following: follows.filter(f => f.follower_id === u.uid).map(f => f.followed_id),
      followers: follows.filter(f => f.followed_id === u.uid).map(f => f.follower_id),
      blockedUsers: blocks.filter(b => b.blocker_id === u.uid).map(b => b.blocked_id),
      isOnline: onlineMap.has(u.uid),
      isLive: activeStreams.has(u.uid),
    }));
    res.json(usersWithData);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get followers for a specific user
app.get('/api/users/:uid/followers', async (req, res) => {
  try {
    const { uid } = req.params;
    const followerRows = await db.all('SELECT follower_id FROM follows WHERE followed_id=?', [uid]);
    const followerUids = followerRows.map(r => r.follower_id);
    if (!followerUids.length) return res.json([]);
    const placeholders = followerUids.map(() => '?').join(',');
    const users = await db.all(`SELECT uid,name,username,avatar,avatarEmoji,isCreator,isBlocked FROM users WHERE uid IN (${placeholders})`, followerUids);
    res.json(users.map(u => ({ ...u, isOnline: onlineMap.has(u.uid) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get active live streams
app.get('/api/live/active', async (req, res) => {
  try {
    const streams = [];
    for (const [uid, stream] of activeStreams.entries()) {
      const u = await db.get('SELECT name,avatar,avatarEmoji,isCreator FROM users WHERE uid=?', [uid]).catch(() => null);
      streams.push({ streamerUid: uid, ...stream, viewers: stream.viewers.size, streamerName: u?.name || stream.streamerName, streamerAvatar: u?.avatar, streamerEmoji: u?.avatarEmoji });
    }
    res.json(streams);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Follow / Unfollow
app.post('/api/users/follow', async (req, res) => {
  const { followerId, followedId } = req.body;
  try {
    const exists = await db.get('SELECT * FROM follows WHERE follower_id=? AND followed_id=?', [followerId, followedId]);
    if (exists) {
      await db.run('DELETE FROM follows WHERE follower_id=? AND followed_id=?', [followerId, followedId]);
      res.json({ followed: false });
    } else {
      await db.run('INSERT INTO follows (follower_id,followed_id) VALUES (?,?)', [followerId, followedId]);
      res.json({ followed: true });
    }
    const [follower, followed] = await Promise.all([getFullUser(followerId), getFullUser(followedId)]);
    if (follower) { pushToUser(followerId, 'user:profileUpdated', follower); pushToAll('user:profileUpdated', follower); }
    if (followed) { pushToUser(followedId, 'user:profileUpdated', followed); pushToAll('user:profileUpdated', followed); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Block / Unblock
app.post('/api/users/block', async (req, res) => {
  const { blockerId, blockedId } = req.body;
  try {
    const exists = await db.get('SELECT * FROM blocks WHERE blocker_id=? AND blocked_id=?', [blockerId, blockedId]);
    if (exists) {
      await db.run('DELETE FROM blocks WHERE blocker_id=? AND blocked_id=?', [blockerId, blockedId]);
      res.json({ blocked: false });
    } else {
      await db.run('INSERT INTO blocks (blocker_id,blocked_id) VALUES (?,?)', [blockerId, blockedId]);
      await db.run('DELETE FROM follows WHERE follower_id=? AND followed_id=?', [blockerId, blockedId]);
      await db.run('DELETE FROM follows WHERE follower_id=? AND followed_id=?', [blockedId, blockerId]);
      res.json({ blocked: true });
    }
    const blocker = await getFullUser(blockerId);
    if (blocker) { pushToUser(blockerId, 'user:profileUpdated', blocker); pushToAll('user:profileUpdated', blocker); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CREATOR HUB ───────────────────────────────────────────────────────────────

// Apply to be a creator
app.post('/api/creator/apply', async (req, res) => {
  const { uid, reason, portfolio, social } = req.body;
  try {
    const user = await db.get('SELECT uid,name,username,avatar,avatarEmoji,isCreator FROM users WHERE uid=?', [uid]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isCreator) return res.status(400).json({ error: 'You are already a verified creator.' });
    const existing = await db.get('SELECT status FROM creator_requests WHERE uid=?', [uid]);
    if (existing && existing.status === 'pending') return res.status(400).json({ error: 'You already have a pending application.' });

    await db.run(
      `INSERT OR REPLACE INTO creator_requests (uid,name,username,avatar,avatarEmoji,reason,portfolio,social,status,requestedAt,reviewedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uid, user.name, user.username, user.avatar, user.avatarEmoji, reason, portfolio || '', social || '', 'pending', new Date().toISOString(), null]
    );

    const request = await db.get('SELECT * FROM creator_requests WHERE uid=?', [uid]);
    pushToAdmins('admin:creatorRequest', request);
    res.json({ success: true, status: 'pending' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get creator application status for a user
app.get('/api/creator/status/:uid', async (req, res) => {
  try {
    const req2 = await db.get('SELECT status,requestedAt,reviewedAt FROM creator_requests WHERE uid=?', [req.params.uid]);
    res.json(req2 || { status: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Get all creator requests
app.get('/api/admin/creator/requests', async (req, res) => {
  try {
    const requests = await db.all('SELECT * FROM creator_requests ORDER BY requestedAt DESC');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Approve a creator
app.post('/api/admin/creator/:uid/approve', async (req, res) => {
  const { uid } = req.params;
  try {
    await db.run('UPDATE users SET isCreator=1 WHERE uid=?', [uid]);
    await db.run(`UPDATE creator_requests SET status='approved', reviewedAt=? WHERE uid=?`, [new Date().toISOString(), uid]);
    const user = await getFullUser(uid);
    pushToUser(uid, 'creator:approved', { uid });
    pushToUser(uid, 'user:profileUpdated', user);
    pushToAll('user:profileUpdated', user);
    pushToAdmins('admin:creatorApproved', { uid });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Reject a creator
app.post('/api/admin/creator/:uid/reject', async (req, res) => {
  const { uid } = req.params;
  const { reason } = req.body;
  try {
    await db.run(`UPDATE creator_requests SET status='rejected', reviewedAt=? WHERE uid=?`, [new Date().toISOString(), uid]);
    pushToUser(uid, 'creator:rejected', { uid, reason: reason || '' });
    pushToAdmins('admin:creatorRejected', { uid });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Revoke creator status
app.post('/api/admin/creator/:uid/revoke', async (req, res) => {
  const { uid } = req.params;
  try {
    await db.run('UPDATE users SET isCreator=0 WHERE uid=?', [uid]);
    await db.run('DELETE FROM creator_requests WHERE uid=?', [uid]);
    const user = await getFullUser(uid);
    pushToUser(uid, 'creator:revoked', { uid });
    pushToUser(uid, 'user:profileUpdated', user);
    pushToAll('user:profileUpdated', user);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

app.post('/api/admin/users/register', async (req, res) => {
  const { name, username, email, password, role } = req.body;
  try {
    const cleanUsername = username.startsWith('@') ? username : `@${username}`;
    const existingEmail = await db.get('SELECT uid FROM users WHERE LOWER(email)=LOWER(?)', [email]);
    if (existingEmail) return res.status(400).json({ error: 'Email already registered.' });
    const existingUser = await db.get('SELECT uid FROM users WHERE LOWER(username)=LOWER(?)', [cleanUsername]);
    if (existingUser) return res.status(400).json({ error: 'Username already taken.' });
    const uid = `user-${Date.now()}`;
    const joinedAt = new Date().toISOString();
    await db.run(`INSERT INTO users (uid,name,username,email,password,role,joinedAt) VALUES (?,?,?,?,?,?,?)`,
      [uid, name, cleanUsername, email, password, role || 'user', joinedAt]);
    const newUser = await getFullUser(uid);
    pushToAll('user:registered', newUser);
    pushToAdmins('admin:userRegistered', newUser);
    res.status(201).json({ success: true, uid, user: newUser });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await db.run('DELETE FROM users WHERE uid=?', [uid]);
    await db.run('DELETE FROM active_sessions WHERE uid=?', [uid]);
    await db.run('DELETE FROM follows WHERE follower_id=? OR followed_id=?', [uid, uid]);
    await db.run('DELETE FROM blocks WHERE blocker_id=? OR blocked_id=?', [uid, uid]);
    await db.run('DELETE FROM messages WHERE sender=? OR receiver=?', [uid, uid]);
    await db.run('DELETE FROM creator_requests WHERE uid=?', [uid]);
    pushToUser(uid, 'account:deleted', {});
    pushToAll('user:deleted', { uid });
    pushToAdmins('admin:userDeleted', { uid });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/users/:uid/block', async (req, res) => {
  const { uid } = req.params;
  try {
    const user = await db.get('SELECT isBlocked FROM users WHERE uid=?', [uid]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const newState = user.isBlocked ? 0 : 1;
    await db.run('UPDATE users SET isBlocked=? WHERE uid=?', [newState, uid]);
    if (newState === 1) {
      await db.run('DELETE FROM active_sessions WHERE uid=?', [uid]);
      pushToUser(uid, 'account:blocked', {});
    }
    const updatedUser = await getFullUser(uid);
    pushToAll('user:updated', updatedUser);
    pushToAdmins('admin:userUpdated', updatedUser);
    res.json({ blocked: !!newState, user: updatedUser });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/reset', async (req, res) => {
  try {
    await db.run(`DELETE FROM users WHERE role != 'admin'`);
    await db.run('DELETE FROM follows');
    await db.run('DELETE FROM blocks');
    await db.run('DELETE FROM messages');
    await db.run('DELETE FROM creator_requests');
    await db.run('DELETE FROM active_sessions WHERE uid != ?', ['admin-001']);
    pushToAll('platform:reset', {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/messages', async (req, res) => {
  try {
    const list = await db.all('SELECT * FROM messages ORDER BY id DESC');
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/messages/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM messages WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/users/active', async (req, res) => {
  try {
    const threshold = new Date(Date.now() - 30000).toISOString();
    await db.run('DELETE FROM active_sessions WHERE lastSeen < ?', [threshold]);
    const active = await db.all('SELECT * FROM active_sessions ORDER BY lastSeen DESC');
    const merged = active.map(s => ({ ...s, isOnline: onlineMap.has(s.uid) }));
    res.json(merged);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Live stream history
app.get('/api/admin/live/history', async (req, res) => {
  try {
    const list = await db.all('SELECT * FROM live_streams ORDER BY id DESC LIMIT 50');
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────

app.post('/api/messages', async (req, res) => {
  const { sender, senderName, receiver, receiverName, type, content } = req.body;
  try {
    const timestamp = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO messages (sender,senderName,receiver,receiverName,type,content,timestamp) VALUES (?,?,?,?,?,?,?)`,
      [sender, senderName, receiver, receiverName, type, content, timestamp]
    );
    const savedMsg = { id: result.lastID, sender, senderName, receiver, receiverName, type, content, timestamp };
    pushToUser(receiver, 'message:new', savedMsg);
    pushToUser(sender, 'message:sent', savedMsg);
    pushToAdmins('admin:messageNew', { sender, receiver, type, timestamp });
    res.status(201).json({ success: true, message: savedMsg });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages', async (req, res) => {
  const { userA, userB } = req.query;
  try {
    const list = await db.all(`SELECT * FROM messages WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?) ORDER BY id ASC`,
      [userA, userB, userB, userA]);
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages/poll', async (req, res) => {
  const { userId } = req.query;
  try {
    const threshold = new Date(Date.now() - 15000).toISOString();
    const list = await db.all(`SELECT * FROM messages WHERE receiver=? AND timestamp >= ? ORDER BY id DESC`, [userId, threshold]);
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/online', async (req, res) => {
  res.json({ onlineUids: Array.from(onlineMap.keys()) });
});

// ── START ─────────────────────────────────────────────────────────────────────
initDb().then(() => {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HandBloom API Server + Socket.IO → http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready`);
  });
});

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

// ── Online users tracking ─────────────────────────────────────────────────────
// uid → socketId for routing messages
const onlineMap = new Map();

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
      joinedAt TEXT NOT NULL
    )
  `);

  // Alter table to add social/profile columns if database already exists
  try { await db.exec(`ALTER TABLE users ADD COLUMN instagram TEXT DEFAULT ''`); } catch (e) {}
  try { await db.exec(`ALTER TABLE users ADD COLUMN twitter TEXT DEFAULT ''`); } catch (e) {}
  try { await db.exec(`ALTER TABLE users ADD COLUMN github TEXT DEFAULT ''`); } catch (e) {}
  try { await db.exec(`ALTER TABLE users ADD COLUMN youtube TEXT DEFAULT ''`); } catch (e) {}
  try { await db.exec(`ALTER TABLE users ADD COLUMN hobbies TEXT DEFAULT ''`); } catch (e) {}

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

// ── Helper: emit real-time event to specific user ────────────────────────────
function pushToUser(uid, event, data) {
  io.to(`user:${uid}`).emit(event, data);
}

// ── Helper: broadcast to all connected clients ────────────────────────────────
function pushToAll(event, data) {
  io.emit(event, data);
}

// ── Helper: push to admin room ────────────────────────────────────────────────
function pushToAdmins(event, data) {
  io.to('admins').emit(event, data);
}

// ── Helper: get full user object without password ────────────────────────────
async function getFullUser(uid) {
  const user = await db.get('SELECT * FROM users WHERE uid=?', [uid]);
  if (!user) return null;
  delete user.password;
  const follows = await db.all('SELECT followed_id FROM follows WHERE follower_id=?', [uid]);
  const blocks = await db.all('SELECT blocked_id FROM blocks WHERE blocker_id=?', [uid]);
  user.following = follows.map(f => f.followed_id);
  user.blockedUsers = blocks.map(b => b.blocked_id);
  return user;
}

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const uid = socket.handshake.auth?.uid;
  if (!uid) return;

  // Join private room
  socket.join(`user:${uid}`);
  onlineMap.set(uid, socket.id);

  // Check if admin and join admin room
  db.get('SELECT role FROM users WHERE uid=?', [uid]).then(u => {
    if (u?.role === 'admin') socket.join('admins');
  }).catch(() => {});

  // Notify everyone this user is now online
  io.emit('user:online', { uid });
  console.log(`🟢 Socket connected uid=${uid}`);

  // ── Typing indicators ──────────────────────────────────────────────────────
  socket.on('typing:start', ({ toUid }) => {
    pushToUser(toUid, 'typing:start', { fromUid: uid });
  });

  socket.on('typing:stop', ({ toUid }) => {
    pushToUser(toUid, 'typing:stop', { fromUid: uid });
  });

  // ── Read receipts ──────────────────────────────────────────────────────────
  socket.on('message:read', ({ toUid }) => {
    pushToUser(toUid, 'message:read', { fromUid: uid });
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    onlineMap.delete(uid);
    io.emit('user:offline', { uid });
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

    const user = { uid, name, username: cleanUsername, email, role: 'user', joinedAt, avatarEmoji: '🌸', bio: '', location: '', website: '', instagram: '', twitter: '', github: '', youtube: '', level: 1, xp: 0, flowers: 0, shared: 0, likes: 0, following: [], blockedUsers: [] };
    
    // Real-time: notify all clients about the new user
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

    const sessionUser = { ...user };
    delete sessionUser.password;
    res.json(sessionUser);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/heartbeat', async (req, res) => {
  const { uid, name, avatarEmoji, avatar } = req.body;
  try {
    await db.run(`INSERT OR REPLACE INTO active_sessions (uid,name,avatarEmoji,avatar,lastSeen) VALUES (?,?,?,?,?)`,
      [uid, name, avatarEmoji, avatar, new Date().toISOString()]);
    const user = await db.get('SELECT * FROM users WHERE uid=?', [uid]);
    if (!user) return res.json({ success: true });
    delete user.password;
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
    
    // Uniqueness validation
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
    
    // Real-time: push profile update to ALL connected clients
    pushToAll('user:profileUpdated', user);
    pushToAdmins('admin:userUpdated', user);
    
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USERS ─────────────────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT uid,name,username,email,role,bio,location,website,instagram,twitter,github,youtube,avatar,avatarEmoji,level,xp,flowers,shared,likes,isBlocked,joinedAt,hobbies FROM users');
    const follows = await db.all('SELECT * FROM follows');
    const blocks = await db.all('SELECT * FROM blocks');
    const usersWithData = users.map(u => ({
      ...u,
      following: follows.filter(f => f.follower_id === u.uid).map(f => f.followed_id),
      blockedUsers: blocks.filter(b => b.blocker_id === u.uid).map(b => b.blocked_id),
      isOnline: onlineMap.has(u.uid),
    }));
    res.json(usersWithData);
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
    // Notify both users in real time
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

// ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

// Admin: Register a new user directly
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
    
    // Real-time: notify all clients immediately
    pushToAll('user:registered', newUser);
    pushToAdmins('admin:userRegistered', newUser);
    
    res.status(201).json({ success: true, uid, user: newUser });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Delete a user
app.delete('/api/admin/users/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await db.run('DELETE FROM users WHERE uid=?', [uid]);
    await db.run('DELETE FROM active_sessions WHERE uid=?', [uid]);
    await db.run('DELETE FROM follows WHERE follower_id=? OR followed_id=?', [uid, uid]);
    await db.run('DELETE FROM blocks WHERE blocker_id=? OR blocked_id=?', [uid, uid]);
    await db.run('DELETE FROM messages WHERE sender=? OR receiver=?', [uid, uid]);
    
    // Real-time: force disconnection if online, notify all
    pushToUser(uid, 'account:deleted', {});
    pushToAll('user:deleted', { uid });
    pushToAdmins('admin:userDeleted', { uid });
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Block / Unblock user account
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

// Admin: Reset / delete all data (except admin)
app.post('/api/admin/reset', async (req, res) => {
  try {
    await db.run(`DELETE FROM users WHERE role != 'admin'`);
    await db.run('DELETE FROM follows');
    await db.run('DELETE FROM blocks');
    await db.run('DELETE FROM messages');
    await db.run('DELETE FROM active_sessions WHERE uid != ?', ['admin-001']);
    
    // Notify everyone to refresh
    pushToAll('platform:reset', {});
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Get all messages for audit
app.get('/api/admin/messages', async (req, res) => {
  try {
    const list = await db.all('SELECT * FROM messages ORDER BY id DESC');
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Delete a specific message
app.delete('/api/admin/messages/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM messages WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Active sessions (real-time online users)
app.get('/api/admin/users/active', async (req, res) => {
  try {
    const threshold = new Date(Date.now() - 30000).toISOString();
    await db.run('DELETE FROM active_sessions WHERE lastSeen < ?', [threshold]);
    const active = await db.all('SELECT * FROM active_sessions ORDER BY lastSeen DESC');
    // Merge with socket online map for accuracy
    const merged = active.map(s => ({ ...s, isOnline: onlineMap.has(s.uid) }));
    res.json(merged);
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
    
    const savedMsg = {
      id: result.lastID,
      sender, senderName, receiver, receiverName, type, content, timestamp
    };
    
    // Real-time: push message instantly to receiver's socket room
    pushToUser(receiver, 'message:new', savedMsg);
    // Echo back to sender (for multi-tab support)
    pushToUser(sender, 'message:sent', savedMsg);
    // Notify admins
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

// Fallback polling endpoint (for clients that can't use WebSocket)
app.get('/api/messages/poll', async (req, res) => {
  const { userId } = req.query;
  try {
    const threshold = new Date(Date.now() - 15000).toISOString();
    const list = await db.all(`SELECT * FROM messages WHERE receiver=? AND timestamp >= ? ORDER BY id DESC`, [userId, threshold]);
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Online status check
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

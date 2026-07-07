/**
 * useSocket.js — Global Socket.IO singleton for HandBloom AI
 *
 * Single socket instance shared across the entire React app.
 * Connect with connectSocket(uid) after login.
 * Disconnect with disconnectSocket() on logout.
 * Use getSocket() anywhere to access the socket instance.
 */
import { io } from 'socket.io-client';

// Singleton socket instance — one connection for the whole app
let socket = null;

// Backend URL — always connects directly to port 5000
// (Socket.IO websockets bypass Vite's HTTP proxy)
const SOCKET_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000';

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket.IO connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });
  }
  return socket;
}

/**
 * Connect the socket and authenticate with the user's uid.
 * Call this immediately after a successful login.
 */
export function connectSocket(uid) {
  const sock = getSocket();
  sock.auth = { uid };
  if (!sock.connected) {
    sock.connect();
  }
  return sock;
}

/**
 * Disconnect the socket.
 * Call this on logout.
 */
export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

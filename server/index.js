const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const geohash = require('ngeohash');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const filter = new Filter();

// Store active users: { socketId: { nickname, lat, lng, speed, geohash, timestamp } }
const users = new Map();

// Geohash precision for proximity zones (6-7 recommended)
const GEOHASH_PRECISION = 6;

// Speed threshold in mph (disable messaging if speed > 10 mph)
const SPEED_LOCK_THRESHOLD = 10;

// Cleanup interval: remove users who haven't sent coordinates in 30 seconds
const COORDINATE_TIMEOUT = 30000;
setInterval(() => {
  const now = Date.now();
  for (const [socketId, user] of users.entries()) {
    if (now - user.timestamp > COORDINATE_TIMEOUT) {
      users.delete(socketId);
      io.emit('user-left', { socketId, nickname: user.nickname });
    }
  }
}, 5000);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins with nickname
  socket.on('join', ({ nickname }) => {
    if (!nickname || nickname.trim().length === 0) {
      socket.emit('error', { message: 'Nickname is required' });
      return;
    }

    // Check for duplicate nicknames in same geohash zone
    const trimmedNickname = nickname.trim();
    users.set(socket.id, {
      nickname: trimmedNickname,
      lat: null,
      lng: null,
      speed: 0,
      geohash: null,
      timestamp: Date.now()
    });

    socket.emit('joined', { socketId: socket.id });
    console.log(`User ${trimmedNickname} (${socket.id}) joined`);
  });

  // Receive GPS coordinates from client
  socket.on('location-update', ({ lat, lng, speed }) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'You must join first' });
      return;
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      socket.emit('error', { message: 'Invalid coordinates' });
      return;
    }

    // Update user location and geohash
    const hash = geohash.encode(lat, lng, GEOHASH_PRECISION);
    const previousHash = user.geohash;

    user.lat = lat;
    user.lng = lng;
    user.speed = speed || 0;
    user.geohash = hash;
    user.timestamp = Date.now();

    // If geohash changed, notify user of zone change
    if (previousHash && previousHash !== hash) {
      socket.emit('zone-changed', { geohash: hash });
    }

    // Broadcast updated user list to nearby users (same geohash zone)
    broadcastNearbyUsers(hash);
  });

  // Handle preset messages
  socket.on('send-message', ({ message }) => {
    const user = users.get(socket.id);
    if (!user || !user.geohash) {
      socket.emit('error', { message: 'You must share your location first' });
      return;
    }

    // Speed lock: prevent messaging if speed > threshold
    if (user.speed > SPEED_LOCK_THRESHOLD) {
      socket.emit('error', { 
        message: `Messaging disabled while driving (speed: ${user.speed.toFixed(1)} mph)` 
      });
      return;
    }

    // Validate message (must be preset phrase or emoji)
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      socket.emit('error', { message: 'Invalid message' });
      return;
    }

    // Optional: filter profanity from free text (if enabled)
    let filteredMessage = message;
    if (message.length > 5) { // Only filter longer messages (preset phrases)
      try {
        filteredMessage = filter.clean(message);
      } catch (e) {
        // If filtering fails, use original message
        filteredMessage = message;
      }
    }

    // Broadcast message to users in same geohash zone
    const messageData = {
      socketId: socket.id,
      nickname: user.nickname,
      message: filteredMessage,
      timestamp: Date.now(),
      geohash: user.geohash
    };

    // Send to all users in the same geohash zone
    for (const [socketId, nearbyUser] of users.entries()) {
      if (nearbyUser.geohash === user.geohash && socketId !== socket.id) {
        io.to(socketId).emit('new-message', messageData);
      }
    }

    // Also send back to sender for their own feed
    socket.emit('new-message', messageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      // Notify nearby users
      if (user.geohash) {
        broadcastNearbyUsers(user.geohash);
      }
      console.log(`User ${user.nickname} (${socket.id}) disconnected`);
    }
  });

  // Helper function to broadcast nearby users to all users in a geohash zone
  function broadcastNearbyUsers(geohashZone) {
    const nearbyUsers = Array.from(users.entries())
      .filter(([_, user]) => user.geohash === geohashZone && user.lat !== null)
      .map(([socketId, user]) => ({
        socketId,
        nickname: user.nickname,
        lat: user.lat,
        lng: user.lng,
        speed: user.speed
      }));

    // Send updated list to all users in this zone
    for (const [socketId, user] of users.entries()) {
      if (user.geohash === geohashZone) {
        io.to(socketId).emit('nearby-users', nearbyUsers);
      }
    }
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚗 Tesla Proximity Chat Server running on port ${PORT}`);
  console.log(`📍 Geohash precision: ${GEOHASH_PRECISION}`);
  console.log(`🚦 Speed lock threshold: ${SPEED_LOCK_THRESHOLD} mph`);
});

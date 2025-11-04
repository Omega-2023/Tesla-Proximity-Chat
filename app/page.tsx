'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  socketId: string;
  nickname: string;
  lat: number;
  lng: number;
  speed: number;
}

interface Message {
  socketId: string;
  nickname: string;
  message: string;
  timestamp: number;
}

const PRESET_MESSAGES = [
  { text: '👋', label: 'Wave' },
  { text: '👍', label: 'Thumbs Up' },
  { text: '❤️', label: 'Love' },
  { text: 'nice Model 3', label: 'Nice Model 3' },
  { text: 'love the wrap', label: 'Love the Wrap' },
  { text: '🔥', label: 'Fire' },
  { text: '🚗💨', label: 'Speed' },
  { text: 'looking good!', label: 'Looking Good' },
];

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nickname, setNickname] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>('');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setError('');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setError('Disconnected from server. Reconnecting...');
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on('joined', () => {
      setHasJoined(true);
      setError('');
    });

    newSocket.on('nearby-users', (users: User[]) => {
      setNearbyUsers(users.filter(u => u.socketId !== newSocket.id));
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message].slice(-50)); // Keep last 50 messages
      scrollToBottom();
    });

    newSocket.on('user-left', () => {
      // Server will send updated nearby-users, so we just log it
      console.log('User left proximity zone');
    });

    setSocket(newSocket);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      newSocket.close();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    if (socket) {
      socket.emit('join', { nickname: nickname.trim() });
    }
  };

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsSharingLocation(true);
    setError('');

    // Request location updates every 3 seconds
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const speed = position.coords.speed 
          ? (position.coords.speed * 2.237) // Convert m/s to mph
          : 0;

        setCurrentSpeed(speed);

        if (socket) {
          socket.emit('location-update', {
            lat: latitude,
            lng: longitude,
            speed: speed
          });
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 5000
      }
    );
  };

  const stopLocationSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharingLocation(false);
  };

  const sendMessage = (messageText: string) => {
    if (!socket || !hasJoined) {
      setError('You must join first');
      return;
    }

    if (currentSpeed > 10) {
      setError(`Messaging disabled while driving (speed: ${currentSpeed.toFixed(1)} mph)`);
      return;
    }

    socket.emit('send-message', { message: messageText });
    setError('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '20px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px', fontWeight: 'bold' }}>
          🚗 Tesla Proximity Chat
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px' }}>
          Connect with nearby Tesla drivers safely
        </p>
      </header>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* Join Section */}
      {!hasJoined && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Join Chat</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={20}
            />
            <button className="button" onClick={handleJoin}>
              Join
            </button>
          </div>
        </div>
      )}

      {hasJoined && (
        <>
          {/* Status Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
                  Welcome, {nickname}!
                </h2>
                <div>
                  <span className="status online"></span>
                  <span>Connected</span>
                  {currentSpeed > 0 && (
                    <span className="badge">
                      Speed: {currentSpeed.toFixed(1)} mph
                    </span>
                  )}
                </div>
              </div>
              <div>
                {!isSharingLocation ? (
                  <button className="button" onClick={startLocationSharing}>
                    Share Location
                  </button>
                ) : (
                  <button className="button button-secondary" onClick={stopLocationSharing}>
                    Stop Sharing
                  </button>
                )}
              </div>
            </div>

            {currentSpeed > 10 && (
              <div className="warning">
                ⚠️ Messaging disabled while driving (speed lock active)
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Nearby Users */}
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
                Nearby Teslas ({nearbyUsers.length})
              </h3>
              {nearbyUsers.length === 0 ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  No nearby drivers yet. Share your location to find others!
                </p>
              ) : (
                <ul style={{ listStyle: 'none' }}>
                  {nearbyUsers.map((user) => (
                    <li
                      key={user.socketId}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span className="status online"></span>
                        <strong>{user.nickname}</strong>
                      </div>
                      {user.speed > 0 && (
                        <span className="badge">{user.speed.toFixed(1)} mph</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Messages */}
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Messages</h3>
              <div
                style={{
                  height: '300px',
                  overflowY: 'auto',
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px'
                }}
              >
                {messages.length === 0 ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginTop: '50px' }}>
                    No messages yet. Send a message to nearby drivers!
                  </p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: '12px',
                        padding: '8px',
                        background: msg.socketId === socket?.id 
                          ? 'rgba(62, 106, 225, 0.2)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>{msg.nickname}</strong>
                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div style={{ fontSize: '16px' }}>{msg.message}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Preset Message Buttons */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Send Message</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}
            >
              {PRESET_MESSAGES.map((preset) => (
                <button
                  key={preset.text}
                  className="button button-secondary"
                  onClick={() => sendMessage(preset.text)}
                  disabled={!isSharingLocation || currentSpeed > 10}
                  style={{ fontSize: '18px', padding: '16px' }}
                >
                  {preset.text}
                  <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
        <p>🚗 Tesla Proximity Chat v0.1.0</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Messages are ephemeral and only visible to nearby drivers. Always drive safely.
        </p>
      </footer>
    </div>
  );
}

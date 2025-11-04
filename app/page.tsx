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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('Connecting to:', socketUrl);
    setIsConnecting(true);
    setError('');
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setIsConnecting(false);
      setError('');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      if (reason === 'io server disconnect') {
        setError('Server disconnected. Please refresh the page.');
      } else if (reason === 'io client disconnect') {
        // User manually disconnected
      } else {
        setError('Disconnected from server. Trying to reconnect...');
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setIsConnected(false);
      setIsConnecting(false);
      setError(`Cannot connect to server. Please check if the backend is running at ${socketUrl}`);
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

    // Connection timeout
    const timeout = setTimeout(() => {
      if (!newSocket.connected) {
        setIsConnecting(false);
        setError(`Cannot connect to backend server. Make sure the backend is deployed and running. Expected URL: ${socketUrl}`);
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
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
    if (!socket || !isConnected) {
      setError('Not connected to server. Please wait for connection...');
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

        if (socket && isConnected) {
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
      <header className="header">
        <h1>🚗 Tesla Proximity Chat</h1>
        <p>Connect with nearby Tesla drivers safely</p>
      </header>

      {/* Connection Status */}
      {isConnecting && (
        <div className="warning">
          <span>⏳</span>
          <span>Connecting to server...</span>
        </div>
      )}

      {!isConnecting && !isConnected && (
        <div className="error">
          <span>⚠️</span>
          <div>
            <strong>Not Connected to Backend Server</strong>
            <p style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
              {error || 'The backend server is not running. Please deploy the backend to Render, Railway, or Heroku and update the NEXT_PUBLIC_SOCKET_URL environment variable in Vercel.'}
            </p>
            <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
              Expected URL: {process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}
            </p>
          </div>
        </div>
      )}

      {error && isConnected && (
        <div className="error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Join Section */}
      {!hasJoined && (
        <div className="card">
          <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Join Chat</h2>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
            <input
              type="text"
              className="input"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={20}
            />
            <button 
              className="button" 
              onClick={handleJoin}
              disabled={!isConnected || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Join'}
            </button>
          </div>
          {!isConnected && (
            <p style={{ marginTop: '16px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
              ⚠️ You need to deploy the backend server first
            </p>
          )}
        </div>
      )}

      {hasJoined && (
        <>
          {/* Status Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '600' }}>
                  Welcome, <span style={{ color: '#3e6ae1' }}>{nickname}</span>!
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
                  <span style={{ fontWeight: '500' }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  {currentSpeed > 0 && (
                    <span className="badge">
                      🚗 {currentSpeed.toFixed(1)} mph
                    </span>
                  )}
                  {isSharingLocation && (
                    <span className="badge" style={{ background: 'rgba(74, 222, 128, 0.15)', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
                      📍 Location Sharing
                    </span>
                  )}
                </div>
              </div>
              <div>
                {!isSharingLocation ? (
                  <button className="button" onClick={startLocationSharing}>
                    📍 Share Location
                  </button>
                ) : (
                  <button className="button button-secondary" onClick={stopLocationSharing}>
                    ⏸️ Stop Sharing
                  </button>
                )}
              </div>
            </div>

            {currentSpeed > 10 && (
              <div className="warning">
                <span>⚠️</span>
                <span>Messaging disabled while driving (speed lock active at {currentSpeed.toFixed(1)} mph)</span>
              </div>
            )}
          </div>

          <div className="content-grid">
            {/* Nearby Users */}
            <div className="card">
              <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👥</span>
                <span>Nearby Teslas</span>
                <span className="badge" style={{ marginLeft: 'auto' }}>{nearbyUsers.length}</span>
              </h3>
              {nearbyUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
                  <p style={{ fontSize: '16px' }}>No nearby drivers yet.</p>
                  <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Share your location to find others!</p>
                </div>
              ) : (
                <ul className="user-list">
                  {nearbyUsers.map((user) => (
                    <li key={user.socketId} className="user-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="status online"></span>
                        <strong style={{ fontSize: '16px', fontWeight: '600' }}>{user.nickname}</strong>
                      </div>
                      {user.speed > 0 && (
                        <span className="badge" style={{ fontSize: '11px' }}>
                          {user.speed.toFixed(1)} mph
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Messages */}
            <div className="card">
              <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>💬</span>
                <span>Messages</span>
              </h3>
              <div className="message-list">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💭</div>
                    <p style={{ fontSize: '16px' }}>No messages yet.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Send a message to nearby drivers!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message-item ${msg.socketId === socket?.id ? 'own' : 'other'}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: '600' }}>{msg.nickname}</strong>
                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '400' }}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div style={{ fontSize: '18px', lineHeight: '1.5' }}>{msg.message}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Preset Message Buttons */}
          <div className="card">
            <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📤</span>
              <span>Send Message</span>
            </h3>
            <div className="preset-grid">
              {PRESET_MESSAGES.map((preset) => (
                <button
                  key={preset.text}
                  className="button button-secondary preset-button"
                  onClick={() => sendMessage(preset.text)}
                  disabled={!isSharingLocation || currentSpeed > 10 || !isConnected}
                >
                  <span>{preset.text}</span>
                  <span className="preset-button-label">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <footer className="footer">
        <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>🚗 Tesla Proximity Chat v0.1.0</p>
        <p style={{ fontSize: '13px', opacity: 0.7 }}>
          Messages are ephemeral and only visible to nearby drivers. Always drive safely.
        </p>
      </footer>
    </div>
  );
}

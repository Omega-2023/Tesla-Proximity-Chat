# 🚗 Tesla Proximity Chat

A real-time proximity-based chat application for Tesla drivers to communicate safely when their vehicles are near each other.

## Concept

Tesla Proximity Chat enables drivers to send preset messages and emojis to other Tesla owners within a close geographic proximity. Built with safety as the primary concern, the app includes:

- **Speed Lock**: Messaging is automatically disabled when driving above 10 mph
- **Preset Messages Only**: Reduces distraction by limiting communication to quick phrases and emojis
- **Ephemeral Messages**: No message storage - everything is temporary and only visible in real-time
- **Geohash-Based Proximity**: Uses geohash (precision 6-7) to group users into proximity zones

## Features

### Core Functionality
- ✅ Real-time GPS coordinate sharing (updates every 3 seconds)
- ✅ Geohash-based proximity grouping (precision 6, ~0.6km zones)
- ✅ Preset messages and emojis only (no free-form typing)
- ✅ Speed lock (disables messaging when speed > 10 mph)
- ✅ Ephemeral messaging (no database storage)
- ✅ Optional profanity filtering for preset phrases
- ✅ Live list of nearby Tesla drivers
- ✅ Real-time message feed

### Safety Features
- **Speed Detection**: Automatic speed monitoring via GPS
- **No Typing While Driving**: Preset buttons only, no keyboard input
- **Proximity-Based**: Only connects with very nearby drivers
- **Temporary Connections**: No persistent data or user tracking

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Node.js, Express, Socket.io
- **Geolocation**: Browser Geolocation API + ngeohash
- **Profanity Filtering**: bad-words package
- **Real-time**: Socket.io for bidirectional communication

## Project Structure

```
tesla-proximity-chat/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main chat interface
│   └── globals.css        # Global styles
├── server/                # Socket.io backend
│   └── index.js           # Main server file
├── public/                # Static assets
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── next.config.js         # Next.js config
└── README.md              # This file
```

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Modern browser with Geolocation API support
- HTTPS (required for geolocation in production)

### Installation

1. **Clone or download the repository**

```bash
cd tesla-proximity-chat
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development servers**

You can run both servers simultaneously:

```bash
npm run dev:all
```

Or run them separately in two terminals:

**Terminal 1** (Next.js frontend):
```bash
npm run dev
```

**Terminal 2** (Socket.io backend):
```bash
npm run server
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

5. **Allow location permissions**

When prompted, allow the browser to access your location.

## Usage

### 🎭 Demo Mode (No Backend Required)

**Perfect for testing and demonstration!** The app includes a built-in demo mode that works entirely in the frontend without requiring a backend server.

To enable demo mode:
1. Click the **"🎭 Try Demo Mode (No Backend Required)"** button on the homepage
2. Or set the environment variable: `NEXT_PUBLIC_DEMO_MODE=true`
3. The app will simulate nearby users and messages automatically

**Demo mode features:**
- ✅ Works without any backend server
- ✅ Simulated nearby Tesla drivers
- ✅ Automatic message simulation from other users
- ✅ All UI features work (speed lock, preset messages, etc.)
- ✅ Perfect for demonstrations, testing, or development

To switch back to live mode, click **"Switch to Live Mode"** in the demo mode banner.

### Getting Started (Live Mode)

1. **Enter a nickname** - Choose a display name (max 20 characters)
2. **Click "Join"** - Connect to the chat server
3. **Click "Share Location"** - Enable GPS tracking (updates every 3 seconds)
4. **Wait for nearby drivers** - Users in the same geohash zone will appear
5. **Send messages** - Click preset buttons to send quick messages

### Preset Messages

Available preset messages:
- 👋 Wave
- 👍 Thumbs Up
- ❤️ Love
- nice Model 3
- love the wrap
- 🔥 Fire
- 🚗💨 Speed
- looking good!

### Speed Lock

When your speed exceeds 10 mph:
- All message buttons are disabled
- A warning message is displayed
- You'll see a notification: "Messaging disabled while driving"

## Privacy & Security Design

### Data Handling
- **No Database**: All messages are ephemeral and never stored
- **No User Profiles**: Only nickname and current location (not tracked over time)
- **No Message History**: Messages disappear when users leave the proximity zone
- **Automatic Cleanup**: Users are removed after 30 seconds of no location updates

### Geolocation
- Coordinates are only shared while the app is active
- Location updates stop when you click "Stop Sharing"
- Only coordinates are shared (not home/work addresses)
- Geohash precision limits exact location exposure (~0.6km zone)

### Network Security
- Uses WebSocket (Socket.io) for real-time communication
- In production, should use WSS (secure WebSocket) with HTTPS
- No authentication required (intentional for prototype)

## Configuration

### Environment Variables

Create a `.env.local` file for Next.js:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

For the server, set:

```env
PORT=3001
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
```

### Geohash Precision

Adjust proximity zone size in `server/index.js`:

```javascript
const GEOHASH_PRECISION = 6; // 6 = ~0.6km, 7 = ~0.15km
```

### Speed Lock Threshold

Modify speed limit in `server/index.js`:

```javascript
const SPEED_LOCK_THRESHOLD = 10; // mph
```

## Development Roadmap

### Phase 1: Core Prototype ✅
- [x] Next.js frontend with App Router
- [x] Socket.io real-time backend
- [x] GPS location sharing
- [x] Geohash proximity grouping
- [x] Preset messages
- [x] Speed lock

### Phase 2: Enhanced Features
- [ ] Map view showing nearby drivers
- [ ] Mute/block specific users
- [ ] Custom preset messages (limited set)
- [ ] Connection status indicators
- [ ] Sound notifications (optional)
- [ ] Dark/light theme toggle

### Phase 3: Scaling & Production
- [ ] Redis for horizontal scaling
- [ ] User authentication (optional)
- [ ] Rate limiting
- [ ] HTTPS/WSS in production
- [ ] Error logging and monitoring
- [ ] Docker containerization
- [ ] CI/CD pipeline

### Phase 4: Integration
- [ ] Tesla API integration (for vehicle data)
- [ ] In-vehicle display optimization
- [ ] Voice message support (hands-free)
- [ ] Tesla-specific presets (Supercharger locations, etc.)

## Known Limitations

1. **Development Only**: This is a prototype for demonstration purposes
2. **No Production Security**: Authentication, rate limiting, and HTTPS not configured
3. **Limited Scalability**: Single server instance (needs Redis for scaling)
4. **Browser Dependencies**: Requires modern browser with Geolocation API
5. **Network Dependency**: Requires active internet connection
6. **GPS Accuracy**: Location accuracy depends on device GPS quality

## Safety Reminders

⚠️ **Important Safety Notes:**

- This app is designed for passenger use only
- Never operate while driving
- Speed lock is a safety feature, not a guarantee
- Always prioritize safe driving over messaging
- Use at your own risk - this is a prototype

## Contributing

This is a prototype project. Contributions welcome for:
- Bug fixes
- Security improvements
- UI/UX enhancements
- Feature suggestions

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Start Options:**

### Option 1: Demo Mode (Easiest - No Backend!)
1. **Frontend Only**: Deploy to [Vercel](https://vercel.com) - auto-detects Next.js
2. **Enable Demo Mode**: Set environment variable `NEXT_PUBLIC_DEMO_MODE=true` in Vercel
3. **That's it!** The app works fully without any backend

### Option 2: Full Deployment
1. **Frontend**: Deploy to [Vercel](https://vercel.com) - auto-detects Next.js
2. **Backend**: Deploy to [Render](https://render.com) or [Railway](https://railway.app)
3. Set environment variables as described in the deployment guide

**Note**: For demonstrations or testing, Option 1 (Demo Mode) is recommended as it's much simpler and doesn't require backend deployment.

## License

Copyright (c) 2024 Omega Ndoh Nambo. All Rights Reserved.

This is a personal project. Unauthorized use, copying, or distribution is prohibited.

## Acknowledgments

- Built with Next.js and Socket.io
- Inspired by proximity chat concepts in gaming
- Designed with driver safety as the primary concern

---

**Status**: 🚧 Prototype - Not production ready

**Version**: 0.1.0

**Last Updated**: 2024

Socket.IO isn't ideal for audio streaming. **WebRTC** is the perfect complement here. Here's how to architect this:

---

**Status: COMPLETED** — WebRTC signaling implemented in `socket-server/src/index.ts` and wired into spin/trivia/draw live pages.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────────────┐        │
│  │  Next.js App │────────▶│  Socket.IO Server    │        │
│  │  (Frontend)  │         │  (Signaling/Messages)│        │
│  └──────────────┘         └──────────────────────┘        │
│         │                           │                       │
│         │                           │                       │
│         ▼                           ▼                       │
│  ┌──────────────────────────────────────────────────┐      │
│  │           WebRTC (P2P Audio/Video)              │      │
│  │   - Direct peer-to-peer connections              │      │
│  │   - Low latency audio streaming                  │      │
│  │   - Optional TURN/STUN servers                  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## How They Work Together

| Feature         | Socket.IO                     | WebRTC                  |
| --------------- | ----------------------------- | ----------------------- |
| **Role**        | Signaling & Control           | Audio/Video Streaming   |
| **Use Case**    | Room management, chat, events | Live audio streaming    |
| **Latency**     | Good for messages             | Very low (P2P)          |
| **Scalability** | Server handles all            | P2P reduces server load |

---

## Implementation Plan

### 1. WebRTC Signaling (Implemented in `socket-server/src/index.ts`)

**Status: COMPLETED**

The Socket.IO server now handles full WebRTC signaling for P2P audio streaming. Key additions:

```typescript
// Peer tracking
const peerRooms = new Map<string, Set<string>>();

// webrtc:join — server-side
socket.on("webrtc:join", ({ roomId, streamType }) => {
  socket.join(`webrtc:${roomId}`);
  socket.data.webrtcRoom = roomId;
  socket.data.webrtcStreamType = streamType;

  // Track peer in room
  if (!peerRooms.has(roomId)) peerRooms.set(roomId, new Set());
  const peers = peerRooms.get(roomId)!;

  // Send existing peers to new joiner (before adding)
  const existing = Array.from(peers).filter((id) => id !== socket.id);
  socket.emit("webrtc:existing-peers", { peers: existing });

  // Notify existing peers that a new peer joined
  socket.to(`webrtc:${roomId}`).emit("webrtc:peer-joined", {
    peerId: socket.id,
    streamType,
  });

  peers.add(socket.id);
});

// webrtc:offer / webrtc:answer / webrtc:ice-candidate — forward to target peer
socket.on("webrtc:offer", ({ targetId, offer }) => {
  io.to(targetId).emit("webrtc:offer", { from: socket.id, offer });
});

socket.on("webrtc:answer", ({ targetId, answer }) => {
  io.to(targetId).emit("webrtc:answer", { from: socket.id, answer });
});

socket.on("webrtc:ice-candidate", ({ targetId, candidate }) => {
  io.to(targetId).emit("webrtc:ice-candidate", { from: socket.id, candidate });
});

// webrtc:leave — cleanup and notify
socket.on("webrtc:leave", ({ roomId }) => {
  socket.leave(`webrtc:${roomId}`);
  const room = peerRooms.get(roomId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) peerRooms.delete(roomId);
  }
  socket.to(`webrtc:${roomId}`).emit("webrtc:peer-left", { peerId: socket.id });
});

// Disconnect cleanup — also removes from peerRooms and notifies remaining peers
// broadcastWebRTCEvent helper exported for server-side event broadcasting
```

**Event Summary:**

| Event | Direction | Payload |
|-------|-----------|---------|
| `webrtc:join` | client→server | `{ roomId, streamType: "audio\|video\|both" }` |
| `webrtc:existing-peers` | server→new peer | `{ peers: string[] }` |
| `webrtc:peer-joined` | server→existing peers | `{ peerId, streamType }` |
| `webrtc:peer-left` | server→remaining peers | `{ peerId }` |
| `webrtc:offer` | client→server→client | `{ targetId, offer }` → `{ from, offer }` |
| `webrtc:answer` | client→server→client | `{ targetId, answer }` → `{ from, answer }` |
| `webrtc:ice-candidate` | client→server→client | `{ targetId, candidate }` → `{ from, candidate }` |
| `webrtc:leave` | client→server | `{ roomId }` |

```typescript
// socket-server/src/index.ts (add WebRTC signaling)

import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track WebRTC peers
const peerRooms = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // ... existing authentication code ...

  // ========== NEW: WebRTC Signaling ==========

  // Join a WebRTC room for audio streaming
  socket.on(
    "webrtc:join",
    ({
      roomId,
      streamType,
    }: {
      roomId: string;
      streamType: "audio" | "video" | "both";
    }) => {
      socket.join(`webrtc:${roomId}`);
      socket.data.webrtcRoom = roomId;

      if (!peerRooms.has(roomId)) {
        peerRooms.set(roomId, new Set());
      }
      peerRooms.get(roomId)!.add(socket.id);

      // Notify others that a new peer joined
      socket.to(`webrtc:${roomId}`).emit("webrtc:peer-joined", {
        peerId: socket.id,
        streamType,
      });

      // Send current peers to the new joiner
      const peers = Array.from(peerRooms.get(roomId) || []).filter(
        (id) => id !== socket.id,
      );

      socket.emit("webrtc:existing-peers", { peers });
    },
  );

  // WebRTC signaling: Offer/Answer/ICE candidates
  socket.on(
    "webrtc:offer",
    ({
      targetId,
      offer,
    }: {
      targetId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      io.to(targetId).emit("webrtc:offer", {
        from: socket.id,
        offer,
      });
    },
  );

  socket.on(
    "webrtc:answer",
    ({
      targetId,
      answer,
    }: {
      targetId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      io.to(targetId).emit("webrtc:answer", {
        from: socket.id,
        answer,
      });
    },
  );

  socket.on(
    "webrtc:ice-candidate",
    ({
      targetId,
      candidate,
    }: {
      targetId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      io.to(targetId).emit("webrtc:ice-candidate", {
        from: socket.id,
        candidate,
      });
    },
  );

  // Leave WebRTC room
  socket.on("webrtc:leave", ({ roomId }: { roomId: string }) => {
    socket.leave(`webrtc:${roomId}`);
    const room = peerRooms.get(roomId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        peerRooms.delete(roomId);
      }
    }
    socket.to(`webrtc:${roomId}`).emit("webrtc:peer-left", {
      peerId: socket.id,
    });
  });

  // ========== MODIFIED: viewer heartbeat to also broadcast audio status ==========
  socket.on(
    "viewer:heartbeat",
    ({
      gameId,
      watchedSeconds,
      hasAudio = false,
    }: {
      gameId: string;
      watchedSeconds: number;
      hasAudio?: boolean;
    }) => {
      io.to(`viewer:${gameId}`).emit("viewer:progress", {
        watchedSeconds,
        viewerId: socket.id,
        hasAudio,
      });
    },
  );

  // ... rest of existing code ...

  socket.on("disconnect", () => {
    // Clean up WebRTC rooms
    const roomId = socket.data.webrtcRoom;
    if (roomId) {
      const room = peerRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          peerRooms.delete(roomId);
        }
      }
      socket.to(`webrtc:${roomId}`).emit("webrtc:peer-left", {
        peerId: socket.id,
      });
    }
    // ... existing disconnect logic ...
  });
});

export function broadcastWebRTCEvent(roomId: string, event: string, data: any) {
  io.to(`webrtc:${roomId}`).emit(event, data);
}
```

---

### 2. Frontend: Next.js WebRTC Client (Implemented)

**Status: COMPLETED** — Hook: `src/lib/socket/useWebRTC.ts`

The hook takes `socket` (from `useSocket()`) as a parameter rather than importing the socket directly, making it testable and decoupled from socket connection logic. It manages:

- **`localStream`**: MediaStream from `navigator.mediaDevices.getUserMedia()` (audio only)
- **`remoteStreams`**: Array of MediaStream objects from connected peers
- **`peerConnections`**: Ref map of RTCPeerConnection instances, keyed by peer ID
- **`peerIds`**: Set of currently connected peer socket IDs
- **`isMuted`**: Audio track mute state

**Key behavior:**
- Host (initiator) creates offers when new peers join
- Viewers accept offers and send answers
- ICE candidates forwarded via signaling server
- Proper cleanup on disconnect/unmount
- STUN servers from `NEXT_PUBLIC_STUN_SERVERS` env var (optional TURN)

Components:
- `src/components/webrtc/AudioBroadcastControls.tsx` — Host-side controls (start mic, mute toggle, viewer count)
- `src/components/webrtc/AudioPlayer.tsx` — Viewer-side playback (hidden audio elements, mute toggle)

```typescript
// src/hooks/useWebRTC.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebRTCOptions {
  roomId: string;
  socket: Socket | null;
  streamType?: "audio" | "video" | "both";
}

export function useWebRTC({
  roomId,
  socket,
  streamType = "audio",
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  // STUN/TURN configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Add TURN servers for production (required for NAT traversal)
      // {
      //   urls: "turn:your-turn-server.com:3478",
      //   username: "username",
      //   credential: "password"
      // }
    ],
  };

  // Initialize local media stream
  useEffect(() => {
    const getMedia = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: streamType === "audio" || streamType === "both",
          video: streamType === "video" || streamType === "both",
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    getMedia();
  }, [streamType]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket || !roomId || !localStream) return;

    // Join WebRTC room
    socket.emit("webrtc:join", { roomId, streamType });

    // Handle existing peers
    socket.on("webrtc:existing-peers", ({ peers }: { peers: string[] }) => {
      peers.forEach((peerId) => {
        createPeerConnection(peerId, true);
      });
    });

    // Handle new peer joining
    socket.on("webrtc:peer-joined", ({ peerId }: { peerId: string }) => {
      createPeerConnection(peerId, true);
    });

    // Handle peer leaving
    socket.on("webrtc:peer-left", ({ peerId }: { peerId: string }) => {
      const pc = peerConnections.current.get(peerId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(peerId);
        setRemoteStreams((prev) =>
          prev.filter((stream) => stream.id !== peerId),
        );
      }
    });

    // Handle offers
    socket.on(
      "webrtc:offer",
      async ({
        from,
        offer,
      }: {
        from: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        const pc = await createPeerConnection(from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { targetId: from, answer });
      },
    );

    // Handle answers
    socket.on(
      "webrtc:answer",
      async ({
        from,
        answer,
      }: {
        from: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      },
    );

    // Handle ICE candidates
    socket.on(
      "webrtc:ice-candidate",
      ({
        from,
        candidate,
      }: {
        from: string;
        candidate: RTCIceCandidateInit;
      }) => {
        const pc = peerConnections.current.get(from);
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      },
    );

    return () => {
      // Clean up
      socket.emit("webrtc:leave", { roomId });
      socket.off("webrtc:existing-peers");
      socket.off("webrtc:peer-joined");
      socket.off("webrtc:peer-left");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");

      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
    };
  }, [socket, roomId, localStream, streamType]);

  const createPeerConnection = useCallback(
    async (peerId: string, isInitiator: boolean) => {
      if (!localStream) return;

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current.set(peerId, pc);

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStreams((prev) => {
          const exists = prev.some((s) => s.id === stream.id);
          if (!exists) {
            return [...prev, stream];
          }
          return prev;
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("webrtc:ice-candidate", {
            targetId: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          pc.close();
          peerConnections.current.delete(peerId);
          setRemoteStreams((prev) =>
            prev.filter((stream) => stream.id !== peerId),
          );
        }
      };

      // If initiator, create and send offer
      if (isInitiator) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo:
              streamType === "video" || streamType === "both",
          });
          await pc.setLocalDescription(offer);
          socket?.emit("webrtc:offer", { targetId: peerId, offer });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }

      return pc;
    },
    [localStream, socket, streamType],
  );

  // Mute/unmute
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled: localStream?.getAudioTracks()[0]?.enabled ?? true,
    toggleAudio,
  };
}
```

---

### 3. Next.js Components (Implemented)

**Status: COMPLETED**

Components `AudioBroadcastControls.tsx` and `AudioPlayer.tsx` are located in `src/components/webrtc/`.

```tsx
// src/components/WebRTCAudioPlayer.tsx
"use client";

import { useEffect, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/hooks/useSocket"; // Your existing socket hook

interface WebRTCAudioPlayerProps {
  roomId: string;
  isBroadcaster?: boolean;
}

export function WebRTCAudioPlayer({
  roomId,
  isBroadcaster = false,
}: WebRTCAudioPlayerProps) {
  const { socket } = useSocket();
  const { localStream, remoteStreams, isAudioEnabled, toggleAudio } = useWebRTC(
    {
      roomId,
      socket,
      streamType: "audio",
    },
  );

  const [isMuted, setIsMuted] = useState(false);

  const handleToggleMute = () => {
    const enabled = toggleAudio();
    setIsMuted(!enabled);
  };

  return (
    <div className="web-rtc-audio-player">
      {/* Local audio (what you're sending) */}
      {localStream && isBroadcaster && (
        <div className="local-audio">
          <button onClick={handleToggleMute}>
            {isMuted ? "Unmute" : "Mute"} Microphone
          </button>
        </div>
      )}

      {/* Remote audio streams (what you're receiving) */}
      <div className="remote-audio">
        {remoteStreams.map((stream, index) => (
          <audio
            key={stream.id}
            ref={(el) => {
              if (el && !el.srcObject) {
                el.srcObject = stream;
                el.play().catch(console.error);
              }
            }}
            autoPlay
            playsInline
            controls={false}
            style={{ display: "none" }} // Hidden audio player
          />
        ))}
      </div>

      {/* Show connected peers count */}
      <div className="peer-info">
        <span>Connected peers: {remoteStreams.length}</span>
      </div>
    </div>
  );
}
```

---

### 4. Live Page Integration (Implemented)

**Status: COMPLETED** — Internal streams (stream_type = 'internal') now include WebRTC audio. External streams (YouTube, etc.) are unaffected.

**Spin live page** (`src/app/(public)/[businessSlug]/spin/live/[gameId]/page.tsx`):
- Shows `AudioPlayer` for all viewers
- Shows `AudioBroadcastControls` for host (when `streamType === "internal"`)
- Room ID: `audio:spin:{gameId}`

**Trivia live page** (`src/app/(public)/[businessSlug]/trivia/[challengeId]/live/page.tsx`):
- Shows `AudioPlayer` for viewers
- Host controls on `src/app/(admin)/admin/[businessSlug]/trivia/[triviaId]/live-controls/page.tsx`
- Room ID: `audio:trivia:{challengeId}`

**Draw live page** (`src/app/(public)/[businessSlug]/draw/[drawId]/live/page.tsx`):
- Shows `AudioPlayer` for viewers
- Host controls on `src/app/(admin)/admin/[businessSlug]/draws/[drawId]/control/page.tsx`
- Room ID: `audio:draw:{drawId}`

```tsx
// src/components/Viewer.tsx
"use client";

import { WebRTCAudioPlayer } from "./WebRTCAudioPlayer";
import { useSocket } from "@/hooks/useSocket";

interface ViewerProps {
  gameId: string;
  streamType: "internal" | "external";
}

export function Viewer({ gameId, streamType }: ViewerProps) {
  const { socket } = useSocket();

  // If internal stream, use WebRTC
  if (streamType === "internal") {
    return (
      <div className="viewer-container">
        <WebRTCAudioPlayer roomId={gameId} />

        {/* Your existing viewer UI */}
        <div className="viewer-content">
          <h2>Live Game</h2>
          <p>Audio is streaming via WebRTC</p>
        </div>
      </div>
    );
  }

  // External stream (YouTube, etc.)
  return (
    <div className="viewer-container">
      <div className="viewer-content">
        <h2>External Stream</h2>
        {/* YouTube embed or other external player */}
      </div>
    </div>
  );
}
```

---

### 5. Admin/Broadcaster Side (Implemented)

**Status: COMPLETED** — `AudioBroadcastControls` component integrated into:
- Spin live page (for internal streams)
- Trivia admin live-controls page
- Draw admin control page

```tsx
// src/components/AdminBroadcast.tsx
"use client";

import { WebRTCAudioPlayer } from "./WebRTCAudioPlayer";

export function AdminBroadcast({ gameId }: { gameId: string }) {
  return (
    <div className="admin-broadcast">
      <h3>Live Broadcast</h3>
      <WebRTCAudioPlayer roomId={gameId} isBroadcaster={true} />

      <div className="broadcast-controls">
        <p>You are broadcasting audio to viewers</p>
        {/* Add other admin controls */}
      </div>
    </div>
  );
}
```

---

## Flow Diagram

```
┌──────────────┐                ┌──────────────┐
│   Admin      │                │   Viewer     │
│ (Broadcaster)│                │              │
└──────┬───────┘                └──────┬───────┘
       │                                │
       │ 1. Join WebRTC Room            │ 1. Join WebRTC Room
       │ (emit: webrtc:join)           │ (emit: webrtc:join)
       │                                │
       │◄─────── Socket.IO ────────────►│
       │                                │
       │ 2. Existing peers list         │ 2. Existing peers list
       │ (webrtc:existing-peers)       │ (webrtc:existing-peers)
       │                                │
       │ 3. Create PeerConnection       │ 3. Create PeerConnection
       │ (isInitiator: true)           │ (isInitiator: false)
       │                                │
       │ 4. Send Offer ────────────────►│
       │ (webrtc:offer)                 │
       │                                │
       │ 5. Receive Answer ◄────────────│
       │ (webrtc:answer)               │
       │                                │
       │ 6. ICE Candidates exchange     │
       │◄────── WebRTC P2P ───────────►│
       │                                │
       │ 7. Audio Streaming ───────────►│
       │    (low latency, P2P)          │
       │                                │
       │ 8. Heartbeat (viewer:heartbeat)│
       │◄───────────────────────────────│
       │                                │
       │ 9. Admin emits events          │
       │ (admin:queue:called, etc.)    │
       │◄──────── Socket.IO ───────────►│
```

---

## Key Benefits

| Aspect            | Socket.IO Only           | Socket.IO + WebRTC |
| ----------------- | ------------------------ | ------------------ |
| **Audio Quality** | Poor/Unreliable          | Excellent          |
| **Latency**       | High (server relay)      | Very low (P2P)     |
| **Server Load**   | High (handles all audio) | Low (P2P)          |
| **Scalability**   | Limited                  | Excellent          |
| **Cost**          | High (bandwidth)         | Low                |

---

## Production Considerations

### 1. TURN Server (Required for NAT Traversal)

```bash
# Install Coturn
sudo apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=admin:password
realm=your-domain.com
```

### 2. Environment Variables

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=admin
NEXT_PUBLIC_TURN_CREDENTIAL=password
```

### 3. Security Considerations

- Authenticate WebRTC connections through Socket.IO first
- Use HTTPS (required for getUserMedia in modern browsers)
- Implement token-based authentication for room access
- Rate limit WebRTC connection attempts

---

## Summary

**Status: COMPLETED**

The Socket.IO server now serves as the signaling server while WebRTC handles the actual audio streaming. This is the industry-standard approach for audio/video streaming applications (like Clubhouse, Discord, Zoom).

### Implementation Notes

- **Server**: `socket-server/src/index.ts` — `peerRooms` map, `webrtc:join/leave/offer/answer/ice-candidate` handlers, disconnect cleanup, `broadcastWebRTCEvent` export
- **Hook**: `src/lib/socket/useWebRTC.ts` — takes `socket` as param, manages RTCPeerConnection lifecycle
- **Host UI**: `src/components/webrtc/AudioBroadcastControls.tsx` — mic start/stop, mute toggle, viewer count
- **Viewer UI**: `src/components/webrtc/AudioPlayer.tsx` — receives remote streams, auto-plays, mute toggle
- **Rooms**: `webrtc:{roomId}` signaling, `viewer:{gameId}` for heartbeat audio status
- **Integration**: Spin, trivia, and draw live pages (internal stream only)
- **Limitation**: Audio only — businesses encouraged to route video to YouTube/Twitch for organic reach

### Implementation Notes (Legacy)

**Socket.IO handles:**

- Room management
- User authentication
- Control messages (queue, trivia, etc.)
- WebRTC signaling (offer/answer/ICE)

**WebRTC handles:**

- Low-latency audio streaming
- P2P connections (reduces server costs)
- Automatic quality adaptation

This architecture will gives robust, low-latency audio streaming with minimal server load!

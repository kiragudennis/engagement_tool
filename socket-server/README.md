# Engage Socket.IO Server

Real-time communication server for the Engage platform. Runs separately from the Next.js application.

## What This Server Is For

This Socket.IO server serves two purposes:

1. **Real-time Control Plane** — Relays live broadcast events (queue calls, viewer heartbeats, stage transitions) from admin dashboards to viewer displays across spin wheels, trivia nights, and prize draws.

2. **WebRTC Signaling Server** — Exchanges SDP offers/answers and ICE candidates between peers for peer-to-peer WebRTC audio streaming. The actual audio flows directly P2P (low latency, zero server bandwidth cost for media). Socket.IO handles room management, peer discovery, and signal forwarding only.

### Event Summary

| Event | Direction | Purpose |
|-------|-----------|---------|
| `authenticate` | client→server | Join business + admin rooms |
| `join:spin` / `join:draw` / `join:trivia` | client→server | Join game-specific broadcast rooms |
| `join:viewer` | client→server | Join viewer room for internal streams |
| `viewer:heartbeat` | client→server | Report watched time + audio status |
| `admin:queue:called` | client→server | Call next participant |
| `admin:queue:skipped` | client→server | Skip current participant |
| `admin:queue:update` | client→server | Trigger queue refresh |
| `webrtc:join` | client→server | Join a WebRTC peer room |
| `webrtc:existing-peers` | server→client | List peers in room |
| `webrtc:peer-joined` | server→client | New peer joined room |
| `webrtc:peer-left` | server→client | Peer left room |
| `webrtc:offer` | client→server→client | SDP offer forwarding |
| `webrtc:answer` | client→server→client | SDP answer forwarding |
| `webrtc:ice-candidate` | client→server→client | ICE candidate forwarding |
| `webrtc:leave` | client→server | Leave WebRTC room |
| `queue:called` / `queue:skipped` / `queue:update` | server→client | Queue state to viewers |
| `trivia:queue:called` / etc. | server→client | Trivia queue state |
| `viewer:progress` | server→client | Viewer watch time |
| `viewer:audio-status` | server→client | Host audio availability |

## Deploy Socket Server Separately

Keep the socket server as a completely separate deployment on a platform like:

- **Railway** (easy, good for Node.js)
- **Fly.io** (great for real-time apps)
- **DigitalOcean App Platform**
- **AWS EC2 / ECS**

### Steps:

1. **Move socket-server to its own repo or keep it but deploy separately**

2. **Update the socket-server package.json** with deployment scripts:

```json
// socket-server/package.json
{
  "name": "engage-socket-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "deploy": "npm run build && npm run start"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

3. **Add environment variables** in the socket server's hosting platform:

```env
SOCKET_PORT=4000
NEXT_PUBLIC_URL=https://your-app.vercel.app
```

4. **Update your Next.js app** to connect to the deployed socket URL:

```tsx
// lib/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

class SocketService {
  private socket: Socket | null = null;

  connect(businessId: string, role: "admin" | "viewer" = "viewer") {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        this.socket?.emit("authenticate", { businessId, role });
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
```

5. **Update your .env.local**:

```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.fly.dev
```

## Recommendation

1. **Deploy socket-server to Railway or Fly.io** - They have free tiers and handle Node.js apps well
2. **Keep the socket-server folder** in your repo but deploy it separately
3. **Update your Next.js app** to connect to the deployed socket URL
4. **Use environment variables** to switch between local and production URLs

This approach:

- ✅ Scales independently
- ✅ No build issues with Vercel
- ✅ Works locally with `npm run dev` in two terminals
- ✅ Production-ready with proper scaling

### Quick Deployment Commands:

**Railway:**

```bash
cd socket-server
railway up
```

**Fly.io:**

```bash
cd socket-server
fly launch
fly deploy
```

**Manual (DigitalOcean/Docker):**

```dockerfile
# socket-server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

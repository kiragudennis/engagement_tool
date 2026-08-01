// socket-server/src/index.ts
import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

type BusinessRoom = { businessId: string; role: "admin" | "viewer" };

const rooms = new Map<string, Set<string>>();

const peerRooms = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("authenticate", ({ businessId, role }: BusinessRoom) => {
    socket.join(`business:${businessId}`);
    socket.join(`admin:${businessId}`);

    if (!rooms.has(businessId)) {
      rooms.set(businessId, new Set());
    }
    rooms.get(businessId)!.add(socket.id);

    socket.data.businessId = businessId;
    socket.data.role = role;
  });

  socket.on("join:spin", (gameId: string) => {
    socket.join(`spin:${gameId}`);
  });

  socket.on("join:draw", (drawId: string) => {
    socket.join(`draw:${drawId}`);
  });

  socket.on("join:trivia", (challengeId: string) => {
    socket.join(`trivia:${challengeId}`);
  });

  socket.on("join:trivia-queue", (challengeId: string) => {
    socket.join(`trivia-queue:${challengeId}`);
  });

  socket.on("join:queue", (gameId: string) => {
    socket.join(`queue:${gameId}`);
  });

  socket.on(
    "join:viewer",
    ({
      gameId,
      gameType,
      streamType,
    }: {
      gameId: string;
      gameType: string;
      streamType: string;
    }) => {
      if (streamType === "internal") {
        socket.join(`viewer:${gameId}`);
        socket.data.viewerGameId = gameId;
        socket.data.viewerGameType = gameType;
        socket.data.viewerStreamType = streamType;
      }
    },
  );

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
      io.to(`viewer:${gameId}`).emit("viewer:progress", { watchedSeconds });
      if (hasAudio) {
        io.to(`viewer:${gameId}`).emit("viewer:audio-status", { hasAudio });
      }
    },
  );

  socket.on(
    "admin:queue:called",
    ({ gameId, user_id }: { gameId: string; user_id: string }) => {
      io.to(`queue:${gameId}`).emit("queue:called", { user_id });
    },
  );

  socket.on(
    "admin:queue:skipped",
    ({ gameId, user_id }: { gameId: string; user_id?: string }) => {
      io.to(`queue:${gameId}`).emit("queue:skipped", { user_id });
    },
  );

  socket.on("admin:queue:update", ({ gameId }: { gameId: string }) => {
    io.to(`queue:${gameId}`).emit("queue:update", {});
  });

  socket.on(
    "admin:trivia:queue:called",
    ({
      challengeId,
      user_id,
      user_name,
      ticket_number,
    }: {
      challengeId: string;
      user_id: string;
      user_name: string;
      ticket_number: number;
    }) => {
      io.to(`trivia-queue:${challengeId}`).emit("trivia:queue:called", {
        user_id,
        user_name,
        ticket_number,
      });
    },
  );

  socket.on(
    "admin:trivia:queue:skipped",
    ({ challengeId, user_id }: { challengeId: string; user_id?: string }) => {
      io.to(`trivia-queue:${challengeId}`).emit("trivia:queue:skipped", {
        user_id,
      });
    },
  );

  socket.on(
    "admin:trivia:queue:update",
    ({ challengeId }: { challengeId: string }) => {
      io.to(`trivia-queue:${challengeId}`).emit("trivia:queue:update", {});
    },
  );

  // ========== WebRTC Signaling ==========

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
      socket.data.webrtcStreamType = streamType;

      if (!peerRooms.has(roomId)) {
        peerRooms.set(roomId, new Set());
      }
      const roomPeers = peerRooms.get(roomId)!;

      const existingPeers = Array.from(roomPeers).filter(
        (id) => id !== socket.id,
      );

      socket.emit("webrtc:existing-peers", { peers: existingPeers });

      socket.to(`webrtc:${roomId}`).emit("webrtc:peer-joined", {
        peerId: socket.id,
        streamType,
      });

      roomPeers.add(socket.id);
    },
  );

  // WebRTC offer forwarding
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

  // WebRTC answer forwarding
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

  // WebRTC ICE candidate forwarding
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

  socket.on("leave:room", (room: string) => {
    socket.leave(room);
  });

  socket.on("disconnect", () => {
    const businessId = socket.data.businessId;
    if (businessId) {
      const businessRooms = rooms.get(businessId);
      if (businessRooms) {
        businessRooms.delete(socket.id);
        if (businessRooms.size === 0) {
          rooms.delete(businessId);
        }
      }
    }

    // Clean up WebRTC rooms
    const webrtcRoom = socket.data.webrtcRoom;
    if (webrtcRoom) {
      const peerRoom = peerRooms.get(webrtcRoom);
      if (peerRoom) {
        peerRoom.delete(socket.id);
        if (peerRoom.size === 0) {
          peerRooms.delete(webrtcRoom);
        }
      }
      socket.to(`webrtc:${webrtcRoom}`).emit("webrtc:peer-left", {
        peerId: socket.id,
      });
    }

    console.log(`Client disconnected: ${socket.id}`);
  });
});

export function broadcastToBusiness(
  businessId: string,
  event: string,
  data: any,
) {
  io.to(`business:${businessId}`).emit(event, data);
}

export function broadcastToAdmins(
  businessId: string,
  event: string,
  data: any,
) {
  io.to(`admin:${businessId}`).emit(event, data);
}

export function broadcastToSpin(gameId: string, event: string, data: any) {
  io.to(`spin:${gameId}`).emit(event, data);
}

export function broadcastToDraw(drawId: string, event: string, data: any) {
  io.to(`draw:${drawId}`).emit(event, data);
}

export function broadcastToTrivia(
  challengeId: string,
  event: string,
  data: any,
) {
  io.to(`trivia:${challengeId}`).emit(event, data);
}

export function broadcastToQueue(gameId: string, event: string, data: any) {
  io.to(`queue:${gameId}`).emit(event, data);
}

export function broadcastToTriviaQueue(
  challengeId: string,
  event: string,
  data: any,
) {
  io.to(`trivia-queue:${challengeId}`).emit(event, data);
}

export function broadcastToViewers(gameId: string, event: string, data: any) {
  io.to(`viewer:${gameId}`).emit(event, data);
}

export function broadcastWebRTCEvent(
  roomId: string,
  event: string,
  data: any,
) {
  io.to(`webrtc:${roomId}`).emit(event, data);
}

const PORT = Number(process.env.SOCKET_PORT || 4000);

const server = io.listen(PORT);

server.on("listening", () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});

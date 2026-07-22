import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

type BusinessRoom = { businessId: string; role: "admin" | "viewer" };

const rooms = new Map<string, Set<string>>();

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

  socket.on("admin:queue:called", ({ gameId, user_id }: { gameId: string; user_id: string }) => {
    io.to(`queue:${gameId}`).emit("queue:called", { user_id });
  });

  socket.on("admin:queue:skipped", ({ gameId, user_id }: { gameId: string; user_id?: string }) => {
    io.to(`queue:${gameId}`).emit("queue:skipped", { user_id });
  });

  socket.on("admin:queue:update", ({ gameId }: { gameId: string }) => {
    io.to(`queue:${gameId}`).emit("queue:update", {});
  });

  socket.on("admin:trivia:queue:called", ({ challengeId, user_id, user_name, ticket_number }: { challengeId: string; user_id: string; user_name: string; ticket_number: number }) => {
    io.to(`trivia-queue:${challengeId}`).emit("trivia:queue:called", { user_id, user_name, ticket_number });
  });

  socket.on("admin:trivia:queue:skipped", ({ challengeId, user_id }: { challengeId: string; user_id?: string }) => {
    io.to(`trivia-queue:${challengeId}`).emit("trivia:queue:skipped", { user_id });
  });

  socket.on("admin:trivia:queue:update", ({ challengeId }: { challengeId: string }) => {
    io.to(`trivia-queue:${challengeId}`).emit("trivia:queue:update", {});
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
    console.log(`Client disconnected: ${socket.id}`);
  });
});

export function broadcastToBusiness(businessId: string, event: string, data: any) {
  io.to(`business:${businessId}`).emit(event, data);
}

export function broadcastToAdmins(businessId: string, event: string, data: any) {
  io.to(`admin:${businessId}`).emit(event, data);
}

export function broadcastToSpin(gameId: string, event: string, data: any) {
  io.to(`spin:${gameId}`).emit(event, data);
}

export function broadcastToDraw(drawId: string, event: string, data: any) {
  io.to(`draw:${drawId}`).emit(event, data);
}

export function broadcastToTrivia(challengeId: string, event: string, data: any) {
  io.to(`trivia:${challengeId}`).emit(event, data);
}

export function broadcastToQueue(gameId: string, event: string, data: any) {
  io.to(`queue:${gameId}`).emit(event, data);
}

export function broadcastToTriviaQueue(challengeId: string, event: string, data: any) {
  io.to(`trivia-queue:${challengeId}`).emit(event, data);
}

const PORT = Number(process.env.SOCKET_PORT || 4000);

const server = io.listen(PORT);

server.on("listening", () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});

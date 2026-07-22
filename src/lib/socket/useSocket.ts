"use client";

import { useEffect, useRef, useCallback } from "react";

type SocketEvent = {
  [key: string]: (...args: any[]) => void;
};

export function useSocket(url?: string) {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let socket: any;
    try {
      const { io } = require("socket.io-client");
      socket = io(url || process.env.NEXT_PUBLIC_SOCKET_URL || "", {
        transports: ["websocket"],
      });
      socketRef.current = socket;
    } catch (err) {
      console.error("Socket.IO client not available:", err);
      return;
    }

    return () => {
      socket.disconnect();
    };
  }, [url]);

  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, handler);
        return () => socketRef.current.off(event, handler);
      }
    },
    [],
  );

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socket: socketRef.current, on, emit };
}

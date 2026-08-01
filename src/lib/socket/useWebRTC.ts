"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Socket } from "socket.io-client";

interface UseWebRTCOptions {
  roomId: string;
  socket: Socket | null;
  streamType?: "audio" | "video" | "both";
  isBroadcaster?: boolean;
}

export function useWebRTC({
  roomId,
  socket,
  streamType = "audio",
  isBroadcaster = false,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const rtcConfig: RTCConfiguration = useMemo(
    () => ({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    }),
    [],
  );

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

    if (isBroadcaster) {
      getMedia();
    }
  }, [streamType, isBroadcaster]);

  const createPeerConnection = useCallback(
    async (peerId: string, isInitiator: boolean) => {
      if (!localStream || !socket) return null;

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current.set(peerId, pc);

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStreams((prev) => {
          const exists = prev.some((s) => s.id === remoteStream.id);
          if (!exists) {
            return [...prev, remoteStream];
          }
          return prev;
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            targetId: peerId,
            candidate: event.candidate,
          });
        }
      };

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

      if (isInitiator) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo:
              streamType === "video" || streamType === "both",
          });
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", { targetId: peerId, offer });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }

      return pc;
    },
    [localStream, socket, streamType, rtcConfig],
  );

  useEffect(() => {
    if (!socket || !roomId || !localStream) return;

    socket.emit("webrtc:join", { roomId, streamType });

    socket.on("webrtc:existing-peers", ({ peers }: { peers: string[] }) => {
      peers.forEach((peerId) => {
        createPeerConnection(peerId, isBroadcaster);
      });
    });

    socket.on(
      "webrtc:peer-joined",
      ({ peerId }: { peerId: string }) => {
        if (isBroadcaster) {
          createPeerConnection(peerId, true);
        }
      },
    );

    socket.on(
      "webrtc:peer-left",
      ({ peerId }: { peerId: string }) => {
        const pc = peerConnections.current.get(peerId);
        if (pc) {
          pc.close();
          peerConnections.current.delete(peerId);
          setRemoteStreams((prev) =>
            prev.filter((stream) => stream.id !== peerId),
          );
        }
      },
    );

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
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:answer", { targetId: from, answer });
        }
      },
    );

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

    // Capture refs for cleanup
    const pcs = peerConnections.current;

    return () => {
      socket.emit("webrtc:leave", { roomId });
      socket.off("webrtc:existing-peers");
      socket.off("webrtc:peer-joined");
      socket.off("webrtc:peer-left");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");

      pcs.forEach((pc) => pc.close());
      pcs.clear();
    };
  }, [
    socket,
    roomId,
    localStream,
    streamType,
    isBroadcaster,
    createPeerConnection,
  ]);

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

  const stopBroadcast = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setRemoteStreams([]);
  }, [localStream]);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled: localStream?.getAudioTracks()[0]?.enabled ?? true,
    toggleAudio,
    stopBroadcast,
  };
}

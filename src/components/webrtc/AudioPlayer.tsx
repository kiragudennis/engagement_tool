"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { useWebRTC } from "@/lib/socket/useWebRTC";
import { useSocket } from "@/lib/socket/useSocket";

interface AudioPlayerProps {
  gameId: string;
  gameType: "spin" | "trivia" | "draw";
  businessSlug: string;
}

export function AudioPlayer({ gameId, gameType, businessSlug }: AudioPlayerProps) {
  const roomId = `${businessSlug}:${gameType}:${gameId}`;
  const { socket } = useSocket();
  const [isMuted, setIsMuted] = useState(false);

  const { remoteStreams, isAudioEnabled } = useWebRTC({
    roomId,
    socket,
    streamType: "audio",
    isBroadcaster: false,
  });

  const toggleMute = () => {
    const wasMuted = !isAudioEnabled;
    setIsMuted(wasMuted);
  };

  return (
    <div className="flex items-center gap-2">
      {remoteStreams.length > 0 ? (
        <>
          <Badge
            variant="outline"
            className="text-xs bg-green-500/10 text-green-400 border-green-500/20"
          >
            <Wifi className="h-3 w-3 mr-1" />
            Audio Live
          </Badge>
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white/40" />
            ) : (
              <Volume2 className="h-4 w-4 text-green-400" />
            )}
          </Button>
          {remoteStreams.map((stream) => (
            <audio
              key={stream.id}
              autoPlay
              playsInline
              muted={isMuted}
              style={{ display: "none" }}
            />
          ))}
        </>
      ) : (
        <Badge
          variant="outline"
          className="text-xs bg-gray-500/10 text-gray-400 border-gray-500/20"
        >
          <WifiOff className="h-3 w-3 mr-1" />
          No audio
        </Badge>
      )}
    </div>
  );
}

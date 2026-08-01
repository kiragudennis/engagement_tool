"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Radio } from "lucide-react";
import { useWebRTC } from "@/lib/socket/useWebRTC";
import { useSocket } from "@/lib/socket/useSocket";
import { toast } from "sonner";

interface AudioBroadcastControlsProps {
  gameId: string;
  gameType: "spin" | "trivia" | "draw";
  businessSlug: string;
}

export function AudioBroadcastControls({
  gameId,
  gameType,
  businessSlug,
}: AudioBroadcastControlsProps) {
  const roomId = `${businessSlug}:${gameType}:${gameId}`;
  const { socket } = useSocket();
  const [isMuted, setIsMuted] = useState(false);

  const { toggleAudio } = useWebRTC({
    roomId,
    socket,
    streamType: "audio",
    isBroadcaster: true,
  });

  const handleToggleMute = () => {
    const enabled = toggleAudio();
    setIsMuted(!enabled);
  };

  const handleStopBroadcast = () => {
    // The peer connections will be cleaned up on unmount
    toast.info("Audio broadcast stopped");
  };

  return (
    <Card className="bg-black/30 backdrop-blur border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className="h-5 w-5 text-green-400" />
          Audio Broadcast (WebRTC)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-white/70">LIVE (Audio)</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Mic className="h-3 w-3 mr-1" />
            Broadcasting
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleToggleMute}
            variant={isMuted ? "destructive" : "default"}
            size="sm"
            className="flex-1"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 mr-2" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {isMuted ? "Unmute" : "Mute"} Microphone
          </Button>
          <Button
            onClick={handleStopBroadcast}
            variant="outline"
            size="sm"
          >
            <Radio className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-white/40">
          <p>Room: <code className="text-purple-400">{roomId}</code></p>
          <p>Audio streams P2P via WebRTC signaling through Socket.IO</p>
        </div>
      </CardContent>
    </Card>
  );
}

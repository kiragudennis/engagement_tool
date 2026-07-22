"use client";

import { useSocket } from "./useSocket";

export function useQueueBroadcast() {
  const { emit } = useSocket();

  const broadcastQueueUpdate = (gameId: string) => {
    emit(`admin:queue:update`, { gameId });
  };

  const broadcastQueueCalled = (gameId: string, data: any) => {
    emit(`admin:queue:called`, { gameId, ...data });
  };

  const broadcastQueueSkipped = (gameId: string, data: any) => {
    emit(`admin:queue:skipped`, { gameId, ...data });
  };

  return {
    broadcastQueueUpdate,
    broadcastQueueCalled,
    broadcastQueueSkipped,
  };
}

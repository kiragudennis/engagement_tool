// hooks/useStreakTracker.ts
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";

const SESSION_START_KEY = "session_start_time";
const LAST_HEARTBEAT_KEY = "last_heartbeat_time";
const TOTAL_SITE_SECONDS_KEY = "total_site_seconds";

function getStorageNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(key) || "0", 10) || 0;
}

function setStorageNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value.toString());
}

export function useStreakTracker() {
  const { supabase, profile } = useAuth();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionStart = useRef<number>(Date.now());
  const lastHeartbeat = useRef<number>(Date.now());
  const isMounted = useRef(true);

  // Send heartbeat to record site activity
  const sendHeartbeat = useCallback(async () => {
    if (!profile?.id || !supabase || !isMounted.current) return;

    const now = Date.now();
    const durationSinceLastHeartbeat = Math.floor(
      (now - lastHeartbeat.current) / 1000,
    );
    if (durationSinceLastHeartbeat < 30) return;

    try {
      const sessionSeconds = Math.floor((now - sessionStart.current) / 1000);

      await supabase.rpc("update_user_activity", {
        p_user_id: profile.id,
        p_duration_seconds: durationSinceLastHeartbeat,
        p_session_seconds: sessionSeconds,
      });

      lastHeartbeat.current = now;

      // Also track locally
      const currentTotal = getStorageNumber(TOTAL_SITE_SECONDS_KEY);
      setStorageNumber(
        TOTAL_SITE_SECONDS_KEY,
        currentTotal + durationSinceLastHeartbeat,
      );
      localStorage.setItem(LAST_HEARTBEAT_KEY, now.toString());
    } catch (error) {
      // Silently fail - activity tracking is non-critical
      console.debug("Heartbeat skipped:", error);
    }
  }, [profile?.id, supabase]);

  // Initialize tracking
  useEffect(() => {
    if (!profile?.id) return;

    isMounted.current = true;

    // Restore or set session start
    const savedStart = localStorage.getItem(SESSION_START_KEY);
    if (savedStart) {
      sessionStart.current = parseInt(savedStart, 10);
    } else {
      sessionStart.current = Date.now();
      localStorage.setItem(SESSION_START_KEY, sessionStart.current.toString());
    }

    lastHeartbeat.current = Date.now();

    // Send heartbeat every 60 seconds
    heartbeatInterval.current = setInterval(sendHeartbeat, 60000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Send final heartbeat before hiding
        sendHeartbeat();
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
      } else {
        // Resume tracking when visible
        lastHeartbeat.current = Date.now();
        if (!heartbeatInterval.current) {
          heartbeatInterval.current = setInterval(sendHeartbeat, 60000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      isMounted.current = false;

      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Final heartbeat on unmount
      if (profile?.id && supabase) {
        const sessionDuration = Math.floor(
          (Date.now() - sessionStart.current) / 1000,
        );
        supabase
          .rpc("update_user_activity", {
            p_user_id: profile.id,
            p_duration_seconds: 0,
            p_session_seconds: sessionDuration,
          })
          .then(() => {
            const currentTotal = getStorageNumber(TOTAL_SITE_SECONDS_KEY);
            setStorageNumber(
              TOTAL_SITE_SECONDS_KEY,
              currentTotal + sessionDuration,
            );
          });
      }
    };
  }, [profile?.id, sendHeartbeat, supabase]);

  return { sendHeartbeat };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

interface ConnectionManagerResult {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
}

// Require 3 consecutive failures before marking offline
const FAILURE_THRESHOLD = 3;
// Delay first health check so the app fully initializes before probing
const INITIAL_DELAY_MS = 8000;
// Poll every 30s when healthy, 10s when recovering
const HEALTHY_INTERVAL_MS = 30000;
const RECOVERY_INTERVAL_MS = 10000;

export function useConnectionManager(
  actor: backendInterface | null,
  onReconnect: () => void,
): ConnectionManagerResult {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("online");

  const stateRef = useRef({ isOnline: true, failureCount: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actorRef = useRef(actor);
  const onReconnectRef = useRef(onReconnect);
  // Guard against concurrent health checks
  const isCheckingRef = useRef(false);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  const scheduleNext = useCallback((delay: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (!actorRef.current) return;
      // Skip if a previous check is still in-flight
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      try {
        // Lightweight public query — never requires auth, never traps
        await actorRef.current.hasAdminBeenClaimed();
        stateRef.current.failureCount = 0;
        if (!stateRef.current.isOnline) {
          stateRef.current.isOnline = true;
          setIsOnline(true);
          setConnectionStatus("online");
          onReconnectRef.current();
          scheduleNext(HEALTHY_INTERVAL_MS);
        }
      } catch {
        stateRef.current.failureCount++;
        if (
          stateRef.current.isOnline &&
          stateRef.current.failureCount >= FAILURE_THRESHOLD
        ) {
          stateRef.current.isOnline = false;
          setIsOnline(false);
          setConnectionStatus("reconnecting");
          scheduleNext(RECOVERY_INTERVAL_MS);
        }
      } finally {
        isCheckingRef.current = false;
      }
    }, delay);
  }, []);

  useEffect(() => {
    // Delay first probe — avoids false alarms during app startup
    initTimerRef.current = setTimeout(() => {
      scheduleNext(HEALTHY_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scheduleNext]);

  useEffect(() => {
    const handleOffline = () => {
      stateRef.current.isOnline = false;
      stateRef.current.failureCount = 0;
      setIsOnline(false);
      setConnectionStatus("offline");
      scheduleNext(RECOVERY_INTERVAL_MS);
    };
    const handleOnline = () => {
      if (!stateRef.current.isOnline) setConnectionStatus("reconnecting");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [scheduleNext]);

  return { isOnline, connectionStatus };
}

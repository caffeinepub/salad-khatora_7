import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

interface ConnectionManagerResult {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
}

// Require 3 consecutive failures before marking offline
const FAILURE_THRESHOLD = 3;
// Delay first health check — gives ICP canister time to fully initialize
// Increased to 15s to handle slow canister startups reliably
const INITIAL_DELAY_MS = 15000;
// Poll every 60s when healthy (reduced frequency = fewer false alarms)
const HEALTHY_INTERVAL_MS = 60000;
// Poll every 15s when recovering
const RECOVERY_INTERVAL_MS = 15000;

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
  // Track whether initial delay has passed — don't respond to window events before that
  const initializedRef = useRef(false);

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
      initializedRef.current = true;
      scheduleNext(HEALTHY_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scheduleNext]);

  useEffect(() => {
    const handleOffline = () => {
      // Only react to offline events after initialization
      if (!initializedRef.current) return;
      stateRef.current.isOnline = false;
      stateRef.current.failureCount = 0;
      setIsOnline(false);
      setConnectionStatus("offline");
      scheduleNext(RECOVERY_INTERVAL_MS);
    };
    const handleOnline = () => {
      // Don't show "reconnecting" from the window.online event alone —
      // this fires on any network change (wifi switch, etc.) and is unreliable.
      // We only update status based on actual canister health check results.
      // So we deliberately do nothing here.
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

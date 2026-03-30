import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

interface ConnectionManagerResult {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
}

// Require 3 consecutive failures before marking the app as offline
const FAILURE_THRESHOLD = 3;

export function useConnectionManager(
  actor: backendInterface | null,
  onReconnect: () => void,
): ConnectionManagerResult {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("online");

  const stateRef = useRef({ isOnline: true, failureCount: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actorRef = useRef(actor);
  const onReconnectRef = useRef(onReconnect);

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
      try {
        await actorRef.current.hasAdminBeenClaimed();
        stateRef.current.failureCount = 0;
        if (!stateRef.current.isOnline) {
          stateRef.current.isOnline = true;
          setIsOnline(true);
          setConnectionStatus("online");
          onReconnectRef.current();
          scheduleNext(30000);
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
          scheduleNext(10000);
        }
      }
    }, delay);
  }, []);

  useEffect(() => {
    scheduleNext(30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scheduleNext]);

  useEffect(() => {
    const handleOnline = () => {
      if (!stateRef.current.isOnline) setConnectionStatus("reconnecting");
    };
    const handleOffline = () => {
      stateRef.current.isOnline = false;
      stateRef.current.failureCount = 0;
      setIsOnline(false);
      setConnectionStatus("offline");
      scheduleNext(10000);
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

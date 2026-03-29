import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

interface ConnectionManagerResult {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
}

export function useConnectionManager(
  actor: backendInterface | null,
  onReconnect: () => void,
): ConnectionManagerResult {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("online");

  const stateRef = useRef({ isOnline: true });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actorRef = useRef(actor);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  const scheduleNext = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const delay = stateRef.current.isOnline ? 15000 : 5000;
    intervalRef.current = setInterval(async () => {
      if (!actorRef.current) return;
      try {
        await actorRef.current.isCallerAdmin();
        if (!stateRef.current.isOnline) {
          stateRef.current.isOnline = true;
          setIsOnline(true);
          setConnectionStatus("online");
          onReconnectRef.current();
          // Reschedule at slow interval now that we're back online
          scheduleNext();
        }
      } catch {
        if (stateRef.current.isOnline) {
          stateRef.current.isOnline = false;
          setIsOnline(false);
          setConnectionStatus("reconnecting");
          // Reschedule at fast retry interval
          scheduleNext();
        }
      }
    }, delay);
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scheduleNext]);

  useEffect(() => {
    const handleOnline = () => {
      if (!stateRef.current.isOnline) {
        setConnectionStatus("reconnecting");
      }
    };

    const handleOffline = () => {
      stateRef.current.isOnline = false;
      setIsOnline(false);
      setConnectionStatus("offline");
      scheduleNext();
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

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth-context";

export function ConnectionStatusBanner() {
  const { connectionStatus } = useAuth();
  const [showReconnected, setShowReconnected] = useState(false);
  const prevStatusRef = useRef<string>("online");

  useEffect(() => {
    if (prevStatusRef.current !== "online" && connectionStatus === "online") {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 2000);
      prevStatusRef.current = connectionStatus;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  if (connectionStatus === "online" && !showReconnected) return null;

  if (showReconnected) {
    return (
      <output
        style={{ zIndex: 9999 }}
        className="fixed top-0 left-0 w-full bg-green-500 text-white text-center text-sm py-1.5 font-medium"
        aria-live="polite"
      >
        ✓ Reconnected!
      </output>
    );
  }

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed top-0 left-0 w-full bg-amber-500 text-white text-center text-sm py-1.5 font-medium"
      role="alert"
      aria-live="assertive"
    >
      {connectionStatus === "offline"
        ? "⚠ No internet connection."
        : "⟳ Connection lost. Reconnecting..."}
    </div>
  );
}

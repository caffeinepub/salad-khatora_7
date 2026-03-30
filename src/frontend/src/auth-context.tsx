import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext } from "react";
import type { UserProfile } from "./backend";
import { useActor } from "./hooks/useActor";
import type { ConnectionStatus } from "./hooks/useConnectionManager";
import { useConnectionManager } from "./hooks/useConnectionManager";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

interface AuthContextValue {
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  currentUser: UserProfile | null;
  isProfileLoading: boolean;
  refetchProfile: () => void;
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { identity, login, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // On reconnect, only invalidate data queries — never the actor itself.
  // Invalidating the actor causes it to recreate which floods all queries.
  const handleReconnect = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== "actor",
    });
  }, [queryClient]);

  const { isOnline, connectionStatus } = useConnectionManager(
    actor,
    handleReconnect,
  );

  const profileQuery = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: isAuthenticated && !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
  });

  return (
    <AuthContext.Provider
      value={{
        login,
        logout: clear,
        isAuthenticated,
        isInitializing,
        currentUser: profileQuery.data ?? null,
        isProfileLoading:
          isAuthenticated &&
          (actorFetching || profileQuery.isLoading || profileQuery.isFetching),
        refetchProfile: profileQuery.refetch,
        isOnline,
        connectionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  // Track the last actor instance we invalidated for, to avoid duplicate invalidations
  const lastInvalidatedActorRef = useRef<backendInterface | null>(null);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor instance actually changes (not just re-renders),
  // invalidate dependent queries — but NEVER refetch them (that floods API).
  useEffect(() => {
    if (
      actorQuery.data &&
      actorQuery.data !== lastInvalidatedActorRef.current
    ) {
      lastInvalidatedActorRef.current = actorQuery.data;
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      // DO NOT call refetchQueries here — that force-fires ALL queries simultaneously
      // causing API flooding. Queries will refetch lazily when they are next accessed.
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}

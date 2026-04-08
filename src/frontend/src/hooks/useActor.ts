import { useActor as useActorLib } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

/**
 * Project-level useActor shim.
 * Passes the generated createActor to the library hook so all components
 * can call `useActor()` without needing to import createActor directly.
 */
export function useActor() {
  return useActorLib(createActor);
}

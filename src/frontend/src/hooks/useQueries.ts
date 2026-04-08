import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DeliveryType,
  OrderItem,
  Result_2,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 30000);

// Local type — backend.ts is stale; canister has SubscriptionPlan since v42
export interface SubscriptionPlan {
  id: bigint;
  name: string;
  totalMeals: bigint;
  price: bigint;
  validityDays: bigint;
  description: string;
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay,
  });
}

export function useUserOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserOrders();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay,
  });
}

export function useUserSubscription() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerSubscription();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay,
  });
}

// Fetches plans created by admin — uses canister method added in v42
export function useSubscriptionPlans() {
  const { actor, isFetching } = useActor();
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllSubscriptionPlans();
      console.log("[useSubscriptionPlans] fetched plans:", result);
      return result;
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    retry: 2,
    retryDelay,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.registerUser(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    retry: 2,
    retryDelay,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    Result_2,
    Error,
    { items: Array<OrderItem>; totalAmount: bigint; deliveryType: DeliveryType }
  >({
    mutationFn: async ({ items, totalAmount, deliveryType }) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.placeOrder(items, totalAmount, deliveryType);
      // Surface backend errors as JS errors so React Query's onError fires
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
    },
    retry: 0, // Never retry order placement — avoid duplicate deductions
  });
}

// Creates a subscription with the given planId
export function useCreateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createSubscription(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
    },
    retry: 2,
    retryDelay,
  });
}

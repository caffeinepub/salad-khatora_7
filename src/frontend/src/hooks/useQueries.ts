import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeliveryType, OrderItem, UserProfile } from "../backend";
import type { Variant_monthly_weekly } from "../backend";
import { useActor } from "./useActor";

const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 30000);

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
  return useMutation({
    mutationFn: async ({
      items,
      totalAmount,
      deliveryType,
    }: {
      items: Array<OrderItem>;
      totalAmount: bigint;
      deliveryType: DeliveryType;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.placeOrder(items, totalAmount, deliveryType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
    },
    retry: 2,
    retryDelay,
  });
}

export function useCreateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planType: Variant_monthly_weekly) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createSubscription(planType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
    },
    retry: 2,
    retryDelay,
  });
}

# Salad Khatora

## Current State
- `placeOrder` (backend) deducts 1 meal silently if subscription is active and `saladsRemaining > 0`. If `saladsRemaining = 0`, it simply skips deduction but still allows the order to proceed.
- Cart.tsx has no subscription awareness. `canOrder` only checks delivery option and cart contents.
- `usePlaceOrder` does not invalidate `userSubscription` on success, so remaining meals shown in Dashboard/Subscription page are stale until manual refresh.

## Requested Changes (Diff)

### Add
- Backend: Guard at the top of `placeOrder` — if user has a subscription with `saladsRemaining = 0` OR `status = #expired`, trap with a clear error message.
- Frontend: Fetch `useUserSubscription` in `Cart.tsx`. If subscription exists and `saladsRemaining <= 0`, show a visible warning banner: "Your subscription has ended, please renew" and disable the Place Order button.

### Modify
- `useQueries.ts` → `usePlaceOrder.onSuccess`: also invalidate `["userSubscription"]` so remaining meals update immediately after a successful order.
- `canOrder` in `Cart.tsx` extended to account for subscription ended state.

### Remove
- Nothing removed.

## Implementation Plan
1. `src/backend/main.mo` — Add subscription meals check at the very start of `placeOrder`, before order creation, trapping if `saladsRemaining = 0`.
2. `src/frontend/src/hooks/useQueries.ts` — Add `userSubscription` invalidation to `usePlaceOrder.onSuccess`.
3. `src/frontend/src/pages/Cart.tsx` — Import `useUserSubscription`, derive `subscriptionEnded` boolean, show warning banner and disable Place Order button when true.

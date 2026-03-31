# Salad Khatora

## Current State
The Subscription page uses two hardcoded static plan objects (`weekly`, `monthly`) with fixed prices and benefits. The `useCreateSubscription` hook incorrectly passes `PlanType` enum to `createSubscription`, but the backend expects `planId: bigint`. No backend plans are fetched.

## Requested Changes (Diff)

### Add
- `useSubscriptionPlans` hook in `useQueries.ts` that calls `getAllSubscriptionPlans()`
- Dynamic plan cards on the Subscription page built from backend data

### Modify
- `useCreateSubscription` mutation: change parameter from `PlanType` to `bigint` (planId)
- `Subscription.tsx`: replace hardcoded plans array with live backend data; display plan name, price (₹), total meals, validity (days), description; add "Buy Plan" button per card; show loading skeleton and empty state

### Remove
- Hardcoded `plans` array and static benefit lists from Subscription page
- `PlanType` import from Subscription page (no longer needed for plan selection)

## Implementation Plan
1. Add `useSubscriptionPlans` query to `useQueries.ts`; fix `useCreateSubscription` to use `bigint` planId
2. Rewrite `Subscription.tsx` to fetch plans from backend, render as mobile-friendly cards with: plan name, price, total meals, validity, description, and "Buy Plan" button
3. Show loading skeleton while fetching; show empty state if no plans exist
4. Highlight "Best Value" badge for monthly-type plans (most meals or longest validity)
5. Keep existing current-subscription status card at top

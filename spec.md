# Salad Khatora

## Current State

The Subscription page (`Subscription.tsx`) calls `useSubscriptionPlans()` which calls `actor.getAllSubscriptionPlans()`. The backend has `getAllSubscriptionPlans()` returning `[SubscriptionPlan]`. However:

1. **`backend.did.js`** — `SubscriptionPlan` record and `getAllSubscriptionPlans` function are MISSING from both the top-level exports section and the `idlFactory`. This causes the canister call to fail at the Candid layer, returning nothing.
2. **`backend.did.d.ts`** — `SubscriptionPlan` interface and `getAllSubscriptionPlans` method are MISSING from `_SERVICE`.
3. **`backend.ts`** — `getAllSubscriptionPlans()` uses `(this.actor as any)` and returns raw result WITHOUT decoding bigints (id, totalMeals, price, validityDays are `Nat` = bigint in Motoko but need proper mapping).
4. **AdminPanel `SubscriptionsTab`** — Stores plans in **localStorage only**, never calls the backend. Plans created in admin panel are NOT saved to the canister, so `getAllSubscriptionPlans()` returns only the 2 seeded default plans (Weekly/Monthly) from the backend — but those can't be fetched either due to bug #1.

## Requested Changes (Diff)

### Add
- `SubscriptionPlan` record to `backend.did.js` exports section
- `getAllSubscriptionPlans` function to `backend.did.js` exports section
- `SubscriptionPlan` record to `idlFactory` in `backend.did.js`
- `getAllSubscriptionPlans` function to `idlFactory` service in `backend.did.js`
- `SubscriptionPlan` interface to `backend.did.d.ts`
- `getAllSubscriptionPlans` to `_SERVICE` interface in `backend.did.d.ts`
- `createSubscriptionPlan`, `updateSubscriptionPlan`, `deleteSubscriptionPlan` to `backend.did.js` and `backend.did.d.ts`
- Proper SubscriptionPlan decoder in `backend.ts`
- `createSubscriptionPlan`, `updateSubscriptionPlan`, `deleteSubscriptionPlan` typed methods in `backend.ts`
- Backend-wired plan CRUD in AdminPanel `SubscriptionsTab` (replace localStorage with canister calls)
- Console log in `useSubscriptionPlans` to debug plan data
- Fallback message on Subscription page if no plans (already exists, confirm it shows)

### Modify
- `getAllSubscriptionPlans()` in `backend.ts` to use proper decoder instead of returning raw result
- AdminPanel `SubscriptionsTab`: `savePlan` → call `actor.createSubscriptionPlan` or `actor.updateSubscriptionPlan` instead of localStorage
- AdminPanel `SubscriptionsTab`: `confirmDelete` → call `actor.deleteSubscriptionPlan` instead of localStorage
- AdminPanel `SubscriptionsTab`: `useEffect` → also fetch `getAllSubscriptionPlans` from backend on load

### Remove
- `loadLocalPlans()`, `saveLocalPlans()`, `PLANS_KEY`, `DEFAULT_PLANS` from AdminPanel (localStorage plan storage)

## Implementation Plan

1. **Fix `backend.did.js`**: Add `SubscriptionPlan` IDL record (`{ id: Nat, name: Text, totalMeals: Nat, price: Nat, validityDays: Nat, description: Text }`) to both the top-level exports and the `idlFactory`. Add `getAllSubscriptionPlans: IDL.Func([], [IDL.Vec(SubscriptionPlan)], ['query'])` and `createSubscriptionPlan`, `updateSubscriptionPlan`, `deleteSubscriptionPlan` to both sections.

2. **Fix `backend.did.d.ts`**: Add `SubscriptionPlan` interface and all 4 plan methods to `_SERVICE`.

3. **Fix `backend.ts`**: 
   - Add `from_candid_SubscriptionPlan` decoder that properly maps bigints
   - Fix `getAllSubscriptionPlans()` to use the decoder
   - Add typed `createSubscriptionPlan`, `updateSubscriptionPlan`, `deleteSubscriptionPlan` methods

4. **Fix AdminPanel `SubscriptionsTab`**:
   - Remove localStorage functions and DEFAULT_PLANS
   - Load plans from `actor.getAllSubscriptionPlans()` in the existing useEffect
   - Store plans as `SubscriptionPlan[]` type (bigint fields)
   - `savePlan`: call `actor.createSubscriptionPlan(name, BigInt(totalMeals), BigInt(price), BigInt(validityDays), description)` or `actor.updateSubscriptionPlan(id, ...)` 
   - `confirmDelete`: call `actor.deleteSubscriptionPlan(BigInt(planId))`
   - Refresh plans list after create/update/delete

5. **Fix `useQueries.ts`**: Add `console.log` debug in `useSubscriptionPlans` queryFn to log fetched data.

6. Validate: typecheck + build must pass.

# Salad Khatora

## Current State
The app has a fully functional subscription system. Users can buy plans, view their active subscription on the Dashboard and Subscription page, and meals are deducted on order. The subscription card on Dashboard shows plan name, dates, and a simple "Meals remaining: X" line. The Subscription page shows a card with plan name, start/expiry date, status badge, and remaining meals as a text line. No visual progress bar exists anywhere.

## Requested Changes (Diff)

### Add
- Subscription progress bar component (inline) on **Dashboard** and **Subscription** page
  - Displays meals used vs total: e.g. "5 / 24 meals used"
  - Visual filled bar showing remaining meals (green → orange when ≤ 3 meals left)
  - Sub-label: "X meals remaining"

### Modify
- **Dashboard.tsx**: Import `useSubscriptionPlans`, find matching plan by `subscription.planId` to get `totalMeals`, replace the plain "Meals remaining" accent box with the new progress bar UI
- **Subscription.tsx**: Plans are already fetched via `useSubscriptionPlans()`. Find matching plan by `subscription.planId` to get `totalMeals`. Replace the plain "X meals remaining" text with the new progress bar UI.

### Remove
- Simple text line "Meals remaining: X" (replaced by the richer progress bar)

## Implementation Plan
1. **Dashboard.tsx**: add `useSubscriptionPlans` import; find `planTotalMeals` from matching plan; compute `mealsUsed` and `progressPct`; render progress bar using shadcn `Progress` component with color-coded fill (green / orange when ≤ 3 remaining); keep expiry date and status badge.
2. **Subscription.tsx**: plans already fetched; find `planTotalMeals` from matching plan; compute same values; replace the plain remaining-meals `<p>` with the same progress bar; keep warning banner intact.
3. Progress bar behavior: green fill when remaining > 3, orange when ≤ 3 and > 0, red/empty when 0. Show "X / Y meals used" on left, "Z remaining" on right.

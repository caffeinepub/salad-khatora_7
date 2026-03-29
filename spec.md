# Salad Khatora

## Current State
The Users tab in AdminPanel.tsx already has UserStats (totalOrders, totalSpent, lastOrderDate, hasSubscription) computed via computeUserStats. It shows inline Inactive 7d/15d badges on user cards. Filters: all, active, inactive7, inactive15, subscribers.

## Requested Changes (Diff)

### Add
- `getSegment(stats)` helper that returns one of four segments: `new` | `active` | `high_value` | `inactive` using:
  - **New**: 0 orders
  - **High Value**: totalOrders >= 5 OR totalSpent >= 1000 (and not inactive)
  - **Active**: lastOrderDate within 30 days (and not high value)
  - **Inactive**: lastOrderDate > 30 days ago OR (has orders but no recent activity)
- Segment badge displayed on each user card in the list (colored pill: New=blue, Active=green, High Value=amber/gold, Inactive=red)
- New filter pills: "New", "Active", "High Value", "Inactive" (in addition to existing ones)
- "Send Offer" button on user cards where segment === 'inactive' — opens WhatsApp with pre-filled message: "Hi, we miss you at Salad Khatora! Get 10% off on your next order." using mobile number from profile

### Modify
- Replace existing Inactive 7d/15d inline badge logic with the new segment badge
- Keep existing inactive7 / inactive15 filter pills OR merge them (keep for now, just add new segment-based filters alongside)
- User card shows: segment badge, totalOrders, totalSpent (₹), subscription status, lastOrderDate

### Remove
- Standalone Inactive 7d/15d badges replaced by segment badge system

## Implementation Plan
1. Add `getSegment(stats: UserStats): 'new' | 'active' | 'high_value' | 'inactive'` function
2. Add `SegmentBadge` component rendering colored badge per segment
3. Add segment filter buttons: new, active, high_value, inactive
4. Update filter logic in `filtered` useMemo to handle new segment filters
5. In user card list item: replace old inactive badges with SegmentBadge; add totalSpent display
6. Add "Send Offer" WhatsApp button on cards where segment === 'inactive' and mobile is available
   - WhatsApp URL: `https://wa.me/91${mobile}?text=Hi%2C%20we%20miss%20you%20at%20Salad%20Khatora%21%20Get%2010%25%20off%20on%20your%20next%20order.`

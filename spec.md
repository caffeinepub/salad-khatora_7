# Salad Khatora – Delivery Management Improvements

## Current State
The `DeliveryTab` in `AdminPanel.tsx` has:
- Filters: All, Active, Out for Delivery, Delivered
- Per-order rider assignment via Select dropdown
- Per-order status change via Select dropdown
- Per-order delivery notes (inline text input)
- Rider CRUD management (Add/Edit/Delete with name, mobile, area)
- Stat cards: Total, Active, Out for Delivery, Delivered

## Requested Changes (Diff)

### Add
- **Filter: Unassigned orders** — orders where `assignedRiderId` is undefined/null
- **Filter: Assigned orders** — orders where `assignedRiderId` is set
- **Bulk assign**: checkboxes on each order row + "Select All" checkbox in header; bulk assign button opens a rider picker to assign one rider to all selected orders at once
- **Group by location/area**: toggle to switch between flat list and grouped-by-area view (groups orders by the rider's area, or "Unassigned" group if no rider)
- **Rider workload**: in Rider Management section, show count of active deliveries (non-delivered orders) per rider

### Modify
- Filter bar: add "Unassigned" and "Assigned" to existing filter options (All, Active, Out for Delivery, Delivered, Unassigned, Assigned)
- Orders table: add a leading checkbox column for bulk selection
- Rider list cards: add a badge showing number of active deliveries

### Remove
Nothing removed.

## Implementation Plan
1. Add filter state values `"unassigned"` and `"assigned"` with corresponding filter logic
2. Add `selectedOrders: Set<bigint>` state, checkbox column in table header and each row, Select All logic
3. Add `bulkRiderId` state + "Assign Rider" button that appears when selection is non-empty; clicking triggers `handleAssignOrderRider` for each selected order sequentially
4. Add `groupByLocation: boolean` toggle; when enabled, render orders grouped by rider area (compute per-rider area from riders list)
5. Compute rider workload map: `riderId -> count` of orders where `assignedRiderId === riderId` and `deliveryStatus !== delivered`; render badge next to rider name in Rider Management section

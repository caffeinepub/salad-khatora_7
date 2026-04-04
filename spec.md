# Salad Khatora — Rider Assignment Fix

## Current State

- Riders are stored in a `riders` Map in backend with `addRider`, `getAllRiders`, `updateRider`, `deleteRider` functions.
- Orders use `assignedRiderId: ?Nat` to store the assigned rider's ID.
- Backend has `assignOrderRider(orderId, riderId)` and `updateOrder(orderId, deliveryStatus?, assignedRiderId?, deliveryNotes?)` functions.
- Frontend `DeliveryTab` fetches riders and orders on mount, shows a rider dropdown per order row, and saves via `updateOrder` on button click.
- `backend.d.ts` declares a phantom `updateOrderRider` method that does not exist in `main.mo` — this would crash at runtime.
- `getAllRiders()` in `backend.ts` returns raw Candid results without decoding.
- Neither `assignOrderRider` nor `updateOrder` validates that the rider ID exists in the riders map.
- No crash guard for null rider in frontend save handler — handled by null check but could be cleaner.

## Requested Changes (Diff)

### Add
- Rider existence validation in `updateOrder` and `assignOrderRider` backend functions: if `assignedRiderId` is provided, verify it exists in `riders` map before updating.
- Proper Rider decoder in `backend.ts` so `getAllRiders()` returns correctly typed objects.

### Modify
- `updateOrder` in `main.mo`: when `assignedRiderId` is provided (Some), validate the rider exists and return `#err("Rider not found")` if it doesn't.
- `assignOrderRider` in `main.mo`: same validation.
- `backend.d.ts`: remove phantom `updateOrderRider` declaration; ensure `getAllRiders` return type is correct.
- `backend.ts` `getAllRiders()`: decode result through a proper Rider decoder.
- Frontend `DeliveryTab`: ensure no crash when rider not selected (empty string / null guard), show rider name next to ID in assignment dropdown and in order row.

### Remove
- Phantom `updateOrderRider` from `backend.d.ts` interface.

## Implementation Plan

1. Update `main.mo`: add rider existence check in `updateOrder` (when assignedRiderId is Some(?r), check `riders.get(r)`) and in `assignOrderRider`.
2. Update `backend.d.ts`: remove `updateOrderRider`, keep rest.
3. Update `backend.ts`: add `from_candid_Rider` decoder and use it in `getAllRiders()`.
4. Update `AdminPanel.tsx` `DeliveryTab`: guard null/empty rider in save handlers, ensure comparisons use `String()` for bigint equality.

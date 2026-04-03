# Salad Khatora

## Current State

The Orders & Delivery system uses a unified `ordersV2` database where each order contains delivery fields (`deliveryStatus`, `assignedRiderId`, `deliveryNotes`). However:

1. The backend Candid IDL declarations were missing the delivery update functions (`updateOrderDeliveryStatus`, `assignOrderRider`, `updateOrderDeliveryNotes`), so the frontend used unsafe `(actor as any)` casts for all delivery mutations.
2. The `Order` IDL record definition omitted delivery fields, causing the canister response to silently drop `deliveryStatus`, `assignedRiderId`, and `deliveryNotes` during decoding.
3. The DeliveryTab triggered status and rider updates immediately on `<Select>` change with no Save button, causing unintended API calls.
4. Error handling used a generic fallback (`"Failed to update status"`) instead of showing the actual backend error.

## Requested Changes (Diff)

### Add
- `updateOrder(orderId, deliveryStatus?, assignedRiderId?, deliveryNotes?)` Motoko function returning `Result<Order, Text>` — unified update that checks order exists, admin permission, and returns the updated order
- `Result_Order` type in all declaration files
- New `updateOrderDeliveryStatus`, `assignOrderRider`, `updateOrderDeliveryNotes`, `updateOrder` typed methods in `backend.ts`
- Per-row pending state (`pendingStatus`, `pendingRider`, `savingOrder`) in `DeliveryTab`
- Save button per order row that appears when there are pending unsaved changes
- `handleSaveOrderUpdate` unified save handler using `actor.updateOrder()`

### Modify
- `Order` IDL record in `backend.did.js` (both exports and `idlFactory`) to include `deliveryStatus`, `assignedRiderId`, `deliveryTime`, `deliveryNotes` fields
- `from_candid_record_n28` in `backend.ts` to decode the new delivery fields from canister responses
- `handleDeliveryStatusChange` → `handleSelectStatus` (local pending state only, no API call)
- `handleAssignOrderRider` → `handleSelectRider` (local pending state only, no API call)
- `handleBulkAssign` and `handleSaveDeliveryNote` to use typed `actor.updateOrder()` with real error messages
- `OrdersTable` inner component to accept and use pending state props

### Remove
- All `(actor as any)` casts for delivery mutations
- Immediate API triggers on Select onChange for status and rider
- Generic error messages suppressing actual backend errors

## Implementation Plan

1. Add `updateOrder` function to `src/backend/main.mo` after existing delivery functions
2. Add `updateOrderDeliveryStatus`, `assignOrderRider`, `updateOrderDeliveryNotes`, `updateOrder` to `backend.did.d.ts` (_SERVICE interface) and add `Result_Order` type
3. Update `Order` IDL and add `Result_Order` + 4 new functions to `backend.did.js` (both `idlService` and `idlFactory`)
4. Update `backend.ts`: fix `from_candid_record_n28` to decode delivery fields, add 4 new typed methods, add `Result_Order` type and decoder
5. Add `Result_Order` and `updateOrder` signature to `backend.d.ts`
6. Fix `DeliveryTab` in `AdminPanel.tsx`: pending state, Save button per row, typed calls, real error messages

# Salad Khatora - Advanced Customer Management

## Current State
The Users tab in `/admin` shows a basic table with Name, Mobile, Email, Address, Principal. No search, no filters, no user details page, no insights, no notes, no admin actions beyond viewing.

Backend has:
- `getAllUsers()` returning principal + profile
- `getAllOrders()` (admin)
- `getAllSubscriptions()` (admin)
- `UserProfile` with name, mobile, email, address, heightCm, weightKg, age, dietaryPreferences, dietaryRestrictions

## Requested Changes (Diff)

### Add
- Backend: `UserNote` type with id, principal, text, createdAt
- Backend: `UserMeta` type with isVip flag, notes array
- Backend: `addUserNote(principal, text)` - admin only
- Backend: `deleteUserNote(principal, noteId)` - admin only
- Backend: `setUserVip(principal, isVip)` - admin only
- Backend: `deleteUser(principal)` - admin removes user profile and meta
- Backend: `updateUserProfileByAdmin(principal, profile)` - admin edits any user
- Backend: `getUserMeta(principal)` - returns isVip + notes for a user
- Frontend: Full Users tab replacement with search, filters, user list with rich fields
- Frontend: User details slide-out/page with profile, order history, subscription, insights, notes, quick actions
- Frontend: Admin actions (edit, delete, VIP toggle, WhatsApp, Offer Discount)

### Modify
- `UsersTab` component in AdminPanel.tsx: replace simple table with advanced customer management UI

### Remove
- Simple address/principal columns from Users table

## Implementation Plan
1. Add new backend functions: addUserNote, deleteUserNote, setUserVip, deleteUser, updateUserProfileByAdmin, getUserMeta
2. Update IDL bindings (backend.did.js, backend.did.d.ts, backend.ts)
3. Replace UsersTab with advanced CustomerManagement component:
   - Users list with search (name/mobile), filter chips (All/Active/Inactive/Subscribers), columns: Name, Mobile, Email, Total Orders, Subscription, Last Order
   - Clicking a user opens a detail panel/drawer showing profile, BMI, order history, subscription, insights, notes, admin actions
   - Notes section with add/delete
   - VIP badge and toggle
   - WhatsApp button (opens wa.me link), Offer Discount button (placeholder)
   - Delete user with confirmation
   - Edit user profile modal

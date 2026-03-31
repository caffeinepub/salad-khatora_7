# Salad Khatora

## Current State
Menu items are stored with: id, name, price, calories, protein, ingredients, tags, enabled, sizes (BowlSize[]), linkedIngredients (LinkedIngredient[]). No image field exists anywhere in the stack. The Menu page shows a Leaf icon placeholder where images should go. The Home page has no featured items section pulled from the backend.

## Requested Changes (Diff)

### Add
- `imageUrl: Text` field to the `MenuItem` Motoko type (V4 migration)
- Stable variable `menuItemsV4` for the new type, with V3→V4 migration in postupgrade
- `imageUrl_: Text` parameter to `addMenuItem` and `updateMenuItem` backend functions
- Image URL input field in AdminPanel Menu Management form
- Real `<img>` tag with lazy loading on Menu page salad cards (fallback placeholder if no image)
- "Featured Salads" section on Home page (fetches first 3 enabled menu items from backend, shows image + name + price)

### Modify
- `getAllMenuItems`, `toggleMenuItem`, `deleteMenuItem`, `placeOrder` — switch from `menuItemsV3` to `menuItemsV4`
- Menu card placeholder area — replace static `<Leaf>` icon with actual image if `imageUrl` is set
- Candid declarations (`backend.did.d.ts`, `backend.did.js`, `backend.d.ts`) — add `imageUrl` to MenuItem type and update function signatures

### Remove
- Nothing removed

## Implementation Plan
1. Rename current `public type MenuItem` to private `type MenuItemV3` in main.mo; create new `public type MenuItem` with `imageUrl: Text`
2. Update `menuItemsV3` stable var type annotation to `MenuItemV3`; add `menuItemsV4 = Map.empty<Nat, MenuItem>()` and `menuItemsV4Migrated` flag
3. Add V3→V4 migration in `postupgrade` (imageUrl defaults to "")
4. Update all menu functions (getAllMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItem) and placeOrder to use `menuItemsV4`
5. Update `addMenuItem`/`updateMenuItem` to accept `imageUrl_: Text` and store it
6. Update all three declaration files to reflect the new MenuItem shape and function signatures
7. Add imageUrl input field in AdminPanel MenuManagement form; pass it in add/update calls
8. Update Menu.tsx card to render `<img>` when imageUrl is present, fallback to emoji placeholder
9. Add Featured Salads section to Home.tsx between Benefits and ReviewsCarousel

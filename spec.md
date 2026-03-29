# Salad Khatora — Customer Management System

## Current State
The admin panel at `/admin` has a Users tab (`UsersTab` component in `AdminPanel.tsx`) implemented in Version 22. It includes: user list with search/filter, `UserDetailSheet` slide-over with profile, insights, subscription, order history, notes, quick actions (WhatsApp, Offer Discount), and admin actions (edit, delete, VIP toggle). Backend has all required functions: `getAllUsers`, `getAllOrders`, `getAllSubscriptions`, `getUserMeta`, `setUserVip`, `addUserNote`, `deleteUserNote`, `deleteUser`, `updateUserProfileByAdmin`.

## Requested Changes (Diff)

### Add
- Engagement tracking: show "Inactive 7d" / "Inactive 15d" badges in the user list
- Filter for inactive users (no orders in last 7/15 days) in the Users List
- Last order date column visible in user list cards
- Active subscription (Yes/No) clearly shown in user list
- Total orders count in user list cards
- Average order value in User Insights section
- Favorite salads (most ordered) in User Insights

### Modify
- Ensure the Users List shows: Name, Mobile, Email, Total Orders, Active Subscription (Yes/No badge), Last Order Date
- Ensure filters work: All, Active Users, Inactive Users, Subscribers
- Search by name OR mobile
- User Detail Sheet must show full profile (Name, Mobile, Email, Address, Age, Height, Weight, BMI)
- Ensure all sections in detail sheet are present: Profile, Order History, Subscription Details, User Insights, Notes, Admin Actions, Quick Actions

### Remove
- Nothing to remove

## Implementation Plan
1. Review existing `UsersTab` in AdminPanel.tsx and verify all list fields are displayed correctly
2. Ensure filter logic handles `inactive7` and `inactive15` cases (no orders in last 7/15 days)
3. Verify UserDetailSheet has all required sections
4. Fix any TypeScript errors or missing data
5. Validate and build

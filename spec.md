# Salad Khatora

## Current State
The app has a fully functional backend with leads, menu, orders, users, subscriptions, delivery, coupons, and analytics systems. No reviews system exists yet.

## Requested Changes (Diff)

### Add
- `Review` type with fields: id, userName, rating (1–5), comment, date, status (pending/approved/rejected)
- `ReviewStatus` variant: `#pending`, `#approved`, `#rejected`
- Stable `reviews` HashMap for persistent storage
- `createReview(userName, rating, comment)` — creates review with auto-generated id, current timestamp, default status = pending
- `getApprovedReviews()` — public query returning all reviews with status = approved
- `getAllReviews()` — admin-only query returning all reviews
- `updateReviewStatus(id, status)` — admin update to change review status
- `deleteReview(id)` — admin delete a review by id

### Modify
- `main.mo` — add reviews collection and all five functions
- `backend.d.ts` — add Review type and all five function signatures

### Remove
- Nothing

## Implementation Plan
1. Generate updated Motoko backend including reviews system
2. Update backend.d.ts with Review type and new function signatures

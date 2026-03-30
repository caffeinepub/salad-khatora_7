# Salad Khatora

## Current State
Reviews backend is deployed with `createReview(userName, rating, comment)`, `getApprovedReviews()`, etc. No review UI exists yet.

## Requested Changes (Diff)

### Add
- `ReviewForm` component: form with Name (optional), star rating (1-5, required), and comment (required)
- On submit: call `createReview()`, show success message "Thank you! Your review will be published after approval."
- Validation: rating required, comment required
- Error handling: catch backend failure, show error message without crashing
- Add a "Leave a Review" section to the Home page, below the Benefits section and above the CTA Banner

### Modify
- `Home.tsx`: import and render `ReviewForm` section

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/components/ReviewForm.tsx` with star rating UI, name/comment inputs, validation, backend call, and success/error states
2. Add ReviewForm section to `Home.tsx` between Benefits and CTA Banner sections

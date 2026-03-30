# Salad Khatora

## Current State
Home page has a Benefits section, a review submission form, and various other sections. The reviews backend has `getApprovedReviews()` available. No public display of approved reviews exists yet.

## Requested Changes (Diff)

### Add
- Reviews carousel section on the Home page, placed below the Benefits section
- Fetches approved reviews using `getApprovedReviews()`
- Sliding carousel with auto-slide (every 3-4 seconds) and smooth CSS transitions
- Each card shows: user name, star rating (1-5), and comment
- Hide section entirely if no approved reviews are returned

### Modify
- Home page layout: insert the reviews carousel between the Benefits section and whatever follows

### Remove
- Nothing removed

## Implementation Plan
1. In HomePage (or equivalent), call `getApprovedReviews()` on mount
2. Build a ReviewsCarousel component with auto-slide interval and smooth slide/fade animation
3. Each slide card shows user name, filled star icons for rating, and comment text
4. If the returned array is empty, render nothing (hide entire section)
5. Place the section below Benefits

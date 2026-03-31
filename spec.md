# Salad Khatora

## Current State
Menu page and Home page both display salad cards with images. Currently:
- Image containers use fixed pixel heights (`h-36 md:h-48`, `h-40`) causing inconsistent sizing across different viewports
- No consistent aspect ratio enforced — tall images stretch, wide images crop unpredictably
- Card hover states are minimal
- Image placeholders (emoji) are unpolished
- No `decoding="async"` attribute on images
- Cards lack strong visual hierarchy

## Requested Changes (Diff)

### Add
- Uniform `aspect-[4/3]` ratio on all image containers (Menu page + Home featured items)
- `decoding="async"` to all `<img>` tags for faster rendering
- Subtle gradient overlay at the bottom of images for better text contrast
- Polished placeholder state when no image: soft green background with a styled 🥗 emoji
- Hover scale effect on card images (`group-hover:scale-105 transition-transform`)
- Slightly elevated card shadow on hover with smooth transition
- Better tag badge positioning on image

### Modify
- Replace fixed height classes with aspect-ratio classes on image wrapper divs in both Menu.tsx and Home.tsx
- Improve card padding and spacing (from `p-4` to `p-4 md:p-5`)
- Make image `object-cover` with `rounded-t-2xl` on the image wrapper (overflow-hidden already on card)
- Improve skeleton loading placeholder to match new aspect ratio
- Increase card border radius subtly via consistent `rounded-2xl` (already exists, keep)

### Remove
- None — no features removed

## Implementation Plan
1. In `Menu.tsx`: Change image container div from `h-36 md:h-48` to `aspect-[4/3]`, add `group` class to card, add `overflow-hidden` to image wrapper, add hover scale on img, add `decoding="async"`, polish placeholder
2. In `Home.tsx` (Featured Salads section): Change `h-40` container to `aspect-[4/3]`, same improvements
3. Update skeleton in Menu.tsx loading state to use `aspect-[4/3]` instead of `h-36 md:h-48`
4. Ensure all images use `loading="lazy" decoding="async"`
5. Validate and build

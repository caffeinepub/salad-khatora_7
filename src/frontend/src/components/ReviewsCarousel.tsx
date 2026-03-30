import type { Review } from "@/backend.d";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const STAR_POSITIONS = [0, 1, 2, 3, 4];
const MAX_REVIEWS = 5;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {STAR_POSITIONS.map((pos) => (
        <span
          key={pos}
          className={`text-lg leading-none ${
            pos < rating ? "text-amber-400" : "text-gray-200"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AverageRating({ reviews }: { reviews: Review[] }) {
  const avg =
    reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
  const display = avg.toFixed(1);
  const filled = Math.round(avg);

  return (
    <motion.div
      className="flex justify-center mb-10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white border border-border rounded-2xl px-8 py-5 shadow-card flex flex-col items-center gap-1">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
          Average Rating
        </p>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold text-primary leading-none">
            {display}
          </span>
          <span className="text-lg font-medium text-muted-foreground mb-1">
            /5
          </span>
        </div>
        <div className="flex gap-0.5 mt-1">
          {STAR_POSITIONS.map((pos) => (
            <span
              key={pos}
              className={`text-xl leading-none ${
                pos < filled ? "text-amber-400" : "text-gray-200"
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>
    </motion.div>
  );
}

export default function ReviewsCarousel() {
  const { actor, isFetching } = useActor();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["approvedReviews"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const all = await actor.getApprovedReviews();
        // Sort by latest first, then put top reviews (rating >= 4) first
        const sorted = [...all].sort((a, b) => Number(b.date) - Number(a.date));
        const top = sorted.filter((r) => Number(r.rating) >= 4);
        const rest = sorted.filter((r) => Number(r.rating) < 4);
        return [...top, ...rest].slice(0, MAX_REVIEWS);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [reviews.length, goNext]);

  // Hide section if no approved reviews
  if (reviews.length === 0) return null;

  const review = reviews[current];
  const isTopReview = Number(review.rating) >= 4;

  return (
    <section className="py-16 md:py-20 bg-white" data-ocid="reviews.section">
      <div className="max-w-4xl mx-auto px-4">
        {/* Heading */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase bg-accent px-3 py-1.5 rounded-full mb-4">
            ⭐ Customer Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Real reviews from real customers who love their healthy journey
          </p>
        </motion.div>

        {/* Average Rating */}
        <AverageRating reviews={reviews} />

        {/* Carousel */}
        <div className="relative flex items-center gap-3 md:gap-6">
          {/* Prev Button */}
          {reviews.length > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="shrink-0 w-10 h-10 rounded-full bg-accent hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-colors shadow-sm"
              aria-label="Previous review"
              data-ocid="reviews.pagination_prev"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Card */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="bg-card rounded-3xl p-8 shadow-card border border-border relative"
                data-ocid="reviews.card"
              >
                {/* Top Review badge */}
                {isTopReview && (
                  <div className="absolute top-5 left-8">
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                      🏆 Top Review
                    </span>
                  </div>
                )}

                {/* Quote decoration */}
                <div className="absolute top-6 right-8 opacity-10">
                  <Quote className="w-16 h-16 text-primary fill-primary" />
                </div>

                <div
                  className={`flex flex-col gap-4 ${isTopReview ? "pt-8" : ""}`}
                >
                  {/* Stars */}
                  <StarRating rating={Number(review.rating)} />

                  {/* Comment */}
                  <p className="text-foreground text-base md:text-lg leading-relaxed font-medium relative z-10">
                    &ldquo;{review.comment}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {review.userName
                        ? review.userName.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {review.userName || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Verified Customer
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {reviews.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              className="shrink-0 w-10 h-10 rounded-full bg-accent hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-colors shadow-sm"
              aria-label="Next review"
              data-ocid="reviews.pagination_next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((r, i) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  setDirection(i > current ? 1 : -1);
                  setCurrent(i);
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-primary w-6 h-2"
                    : "bg-border w-2 h-2 hover:bg-primary/40"
                }`}
                aria-label={`Go to review ${i + 1}`}
                data-ocid="reviews.toggle"
              />
            ))}
          </div>
        )}

        {/* Trust badge */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 bg-accent rounded-full px-5 py-2.5 text-sm text-primary font-medium">
            <span className="text-amber-400">★★★★★</span>
            <span>Loved by {reviews.length}+ happy customers</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { CheckCircle, Loader2, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export default function ReviewForm() {
  const { actor: backend } = useActor();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [commentError, setCommentError] = useState("");

  const validate = () => {
    let valid = true;
    if (!rating) {
      setRatingError("Please select a rating");
      valid = false;
    } else {
      setRatingError("");
    }
    if (!comment.trim()) {
      setCommentError("Comment is required");
      valid = false;
    } else {
      setCommentError("");
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (!backend) throw new Error("Backend not available");
      const result = await backend.createReview(
        name.trim() || "Anonymous",
        BigInt(rating),
        comment.trim(),
      );
      if (result.__kind__ === "ok") {
        setSuccess(true);
        setName("");
        setRating(0);
        setComment("");
      } else {
        setErrorMsg(result.err);
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-accent rounded-2xl p-8 text-center shadow-card"
        data-ocid="review.success_state"
      >
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-muted-foreground">
          Your review will be published after approval.
        </p>
        <Button
          className="mt-6 rounded-full"
          variant="outline"
          onClick={() => setSuccess(false)}
          data-ocid="review.secondary_button"
        >
          Write Another Review
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card border border-border p-6 md:p-8 flex flex-col gap-5"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      data-ocid="review.panel"
    >
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="review-name"
          className="text-sm font-medium text-foreground"
        >
          Your Name
        </Label>
        <Input
          id="review-name"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
          data-ocid="review.input"
        />
      </div>

      {/* Star Rating */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">
          Rating <span className="text-destructive">*</span>
        </Label>
        <div
          className="flex gap-1"
          onMouseLeave={() => setHoverRating(0)}
          data-ocid="review.toggle"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRating(star);
                setRatingError("");
              }}
              onMouseEnter={() => setHoverRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        <AnimatePresence>
          {ratingError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-destructive text-xs"
              data-ocid="review.error_state"
            >
              {ratingError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="review-comment"
          className="text-sm font-medium text-foreground"
        >
          Comment <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="review-comment"
          placeholder="Share your experience with us..."
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            if (e.target.value.trim()) setCommentError("");
          }}
          rows={4}
          className="rounded-xl resize-none"
          data-ocid="review.textarea"
        />
        <AnimatePresence>
          {commentError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-destructive text-xs"
              data-ocid="review.error_state"
            >
              {commentError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Backend Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3"
            data-ocid="review.error_state"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <Button
        type="submit"
        disabled={submitting}
        className="rounded-full font-semibold w-full"
        data-ocid="review.submit_button"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </motion.form>
  );
}

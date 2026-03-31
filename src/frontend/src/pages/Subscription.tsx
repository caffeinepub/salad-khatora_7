import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Leaf, Loader2, Sparkles, Utensils } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { PlanType, Variant_active_expired } from "../backend";
import type { SubscriptionPlan } from "../hooks/useQueries";
import {
  useCreateSubscription,
  useSubscriptionPlans,
  useUserSubscription,
} from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getBestValueId(plans: SubscriptionPlan[]): bigint | null {
  if (plans.length === 0) return null;
  let best = plans[0];
  for (const plan of plans) {
    if (plan.totalMeals > best.totalMeals) best = plan;
  }
  return best.id;
}

// Resolve a display name from either the new planName field or the legacy planType enum
function resolveSubscriptionLabel(sub: {
  planType?: PlanType;
  planName?: string;
}): string {
  if (sub.planName) return sub.planName;
  if (sub.planType === PlanType.monthly) return "Monthly Plan";
  if (sub.planType === PlanType.weekly) return "Weekly Plan";
  return "Active Plan";
}

export default function Subscription() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: subscription, isLoading: subLoading } = useUserSubscription();
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const createSub = useCreateSubscription();

  const bestValueId = getBestValueId(plans);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe");
      navigate({ to: "/login" });
      return;
    }
    try {
      await createSub.mutateAsync(plan.id);
      toast.success(
        `${plan.name} activated! Enjoy your fresh salads \uD83E\uDD57`,
      );
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    }
  };

  // Sub may have new (planName) or legacy (planType) shape depending on canister version
  const subAny = subscription as
    | (typeof subscription & { planName?: string })
    | null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="green-gradient py-14 px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Leaf className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              Salad Subscription
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Eat Healthy, Every Day
          </h1>
          <p className="text-white/80 text-base max-w-md mx-auto">
            Choose a plan that fits your lifestyle. Fresh salads delivered to
            your door.
          </p>
        </section>

        {/* Current Subscription Status */}
        {subLoading ? (
          <div className="max-w-2xl mx-auto px-4 pt-8">
            <Skeleton
              className="h-24 w-full rounded-2xl"
              data-ocid="subscription.loading_state"
            />
          </div>
        ) : subscription ? (
          <div className="max-w-2xl mx-auto px-4 pt-8">
            <div
              className="bg-accent rounded-2xl p-5 border border-primary/20"
              data-ocid="subscription.card"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">
                    {resolveSubscriptionLabel(subAny ?? {})}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Started {formatDate(subscription.startDate)}
                  </p>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {Number(subscription.saladsRemaining)} meals remaining
                  </p>
                </div>
                <Badge
                  className={`rounded-full shrink-0 ${
                    subscription.status === Variant_active_expired.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {subscription.status === Variant_active_expired.active
                    ? "Active"
                    : "Expired"}
                </Badge>
              </div>
            </div>
          </div>
        ) : null}

        {/* Plans Grid */}
        <section
          className="py-12 px-4 max-w-2xl mx-auto"
          data-ocid="subscription.section"
        >
          <div className="flex flex-col gap-6">
            {plansLoading ? (
              <>
                <Skeleton
                  className="h-64 w-full rounded-2xl"
                  data-ocid="subscription.plans.loading_state"
                />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </>
            ) : plans.length === 0 ? (
              <div
                className="text-center py-16 px-4"
                data-ocid="subscription.plans.empty_state"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-4">
                  <Leaf className="w-7 h-7 text-primary" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1">
                  No plans available
                </p>
                <p className="text-sm text-muted-foreground">
                  Check back soon &mdash; new plans are coming your way!
                </p>
              </div>
            ) : (
              plans.map((plan, idx) => {
                const isBestValue = plan.id === bestValueId;
                return (
                  <Card
                    key={String(plan.id)}
                    data-ocid={`subscription.item.${idx + 1}`}
                    className={`relative overflow-hidden transition-all ${
                      isBestValue
                        ? "border-2 border-primary shadow-lg shadow-primary/10"
                        : "border border-border"
                    }`}
                  >
                    {isBestValue && (
                      <div className="absolute inset-x-0 top-0 h-1 green-gradient" />
                    )}

                    <CardHeader className="pb-2 pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isBestValue && (
                            <Badge className="mb-2 bg-primary text-white text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Best Value
                            </Badge>
                          )}
                          <h2 className="text-xl font-bold text-foreground">
                            {plan.name}
                          </h2>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {plan.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-3xl font-extrabold ${
                              isBestValue ? "text-primary" : "text-foreground"
                            }`}
                          >
                            &#8377;{Number(plan.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Info pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                            isBestValue
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          {Number(plan.totalMeals)} Meals
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                            isBestValue
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          {Number(plan.validityDays)} Days
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-3 pb-6">
                      <Button
                        onClick={() => handleSubscribe(plan)}
                        disabled={createSub.isPending}
                        data-ocid={`subscription.item.${idx + 1}.primary_button`}
                        className={`w-full h-12 rounded-xl font-semibold text-base transition-all ${
                          isBestValue
                            ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25"
                            : "bg-secondary text-primary border border-primary/30 hover:bg-accent"
                        }`}
                      >
                        {createSub.isPending ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Subscribing...
                          </span>
                        ) : subscription ? (
                          "Switch to This Plan"
                        ) : (
                          "Buy Plan"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {!plansLoading && plans.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              No contracts. Cancel or pause anytime. Questions?{" "}
              <a
                href="https://wa.me/917660005766"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium underline underline-offset-2"
              >
                Chat with us on WhatsApp
              </a>
            </p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

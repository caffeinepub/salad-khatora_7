import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Check, Leaf, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { PlanType, Variant_active_expired } from "../backend";
import {
  useCreateSubscription,
  useUserSubscription,
} from "../hooks/useQueries";

const plans = [
  {
    id: "weekly" as const,
    planType: PlanType.weekly,
    name: "Weekly Plan",
    tagline: "Taste the freshness",
    price: "₹599",
    period: "/ week",
    salads: "6 salads per week",
    highlight: false,
    badge: null,
    benefits: [
      "Fresh salads 6 days a week",
      "Customizable toppings",
      "Free delivery",
      "Pause anytime",
    ],
  },
  {
    id: "monthly" as const,
    planType: PlanType.monthly,
    name: "Monthly Plan",
    tagline: "Maximum value, maximum health",
    price: "₹1,999",
    period: "/ month",
    salads: "24 salads per month",
    highlight: true,
    badge: "Best Value",
    benefits: [
      "Fresh salads 6 days a week",
      "Customizable toppings",
      "Free delivery",
      "Priority support",
      "Save ₹400 vs weekly",
    ],
  },
];

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Subscription() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: subscription, isLoading: subLoading } = useUserSubscription();
  const createSub = useCreateSubscription();

  const handleSubscribe = async (planType: PlanType, planName: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe");
      navigate({ to: "/login" });
      return;
    }
    try {
      await createSub.mutateAsync(planType);
      toast.success(`${planName} activated! Enjoy your fresh salads 🥗`);
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    }
  };

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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">
                    {subscription.planType === PlanType.monthly
                      ? "Monthly Plan"
                      : "Weekly Plan"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Started {formatDate(subscription.startDate)}
                  </p>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {Number(subscription.saladsRemaining)} salads remaining
                  </p>
                </div>
                <Badge
                  className={`rounded-full ${
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

        {/* Plans */}
        <section
          className="py-12 px-4 max-w-2xl mx-auto"
          data-ocid="subscription.section"
        >
          <div className="flex flex-col gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                data-ocid={`subscription.${plan.id}.card`}
                className={`relative overflow-hidden transition-all ${
                  plan.highlight
                    ? "border-2 border-primary shadow-lg shadow-primary/10"
                    : "border border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute inset-x-0 top-0 h-1 green-gradient" />
                )}

                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {plan.badge && (
                        <Badge className="mb-2 bg-primary text-white text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {plan.badge}
                        </Badge>
                      )}
                      <h2 className="text-xl font-bold text-foreground">
                        {plan.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {plan.tagline}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-3xl font-extrabold ${
                          plan.highlight ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground block">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                      plan.highlight
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    {plan.salads}
                  </div>
                </CardHeader>

                <CardContent className="pt-2 pb-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2.5">
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            plan.highlight ? "bg-primary/15" : "bg-accent"
                          }`}
                        >
                          <Check className="w-3 h-3 text-primary" />
                        </span>
                        <span className="text-sm text-foreground">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.planType, plan.name)}
                    disabled={createSub.isPending}
                    data-ocid={`subscription.${plan.id}.primary_button`}
                    className={`w-full h-12 rounded-xl font-semibold text-base transition-all ${
                      plan.highlight
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
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </section>
      </main>

      <Footer />
    </div>
  );
}

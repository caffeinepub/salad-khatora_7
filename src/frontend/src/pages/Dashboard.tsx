import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Package, Star } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAuth } from "../auth-context";
import {
  OrderStatus,
  Variant_active_expired,
  Variant_monthly_weekly,
} from "../backend";
import { useUserOrders, useUserSubscription } from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.pending]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  [OrderStatus.confirmed]: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, currentUser } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useUserOrders();
  const { data: subscription, isLoading: subLoading } = useUserSubscription();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = currentUser?.name || "there";

  return (
    <div className="min-h-screen flex flex-col font-poppins bg-background">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's an overview of your account.
          </p>
        </motion.div>

        {/* Subscription Section */}
        <motion.div
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground">My Subscription</h2>
          </div>

          {subLoading ? (
            <div className="p-5 space-y-2" data-ocid="dashboard.loading_state">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : subscription ? (
            <div className="p-5" data-ocid="dashboard.card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-base">
                    {subscription.planType === Variant_monthly_weekly.monthly
                      ? "Monthly Plan"
                      : "Weekly Plan"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Started {formatDate(subscription.startDate)}
                  </p>
                </div>
                <Badge
                  className={`rounded-full text-xs px-3 py-1 ${
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
              <div className="bg-accent rounded-xl px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Salads remaining:{" "}
                  <span className="font-bold text-primary text-lg">
                    {Number(subscription.saladsRemaining)}
                  </span>
                </p>
              </div>
              <Link to="/subscription" className="block mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-full border-primary text-primary hover:bg-accent"
                  data-ocid="dashboard.button"
                >
                  Manage Plan
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 px-6 text-center"
              data-ocid="dashboard.empty_state"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                No active subscription
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Subscribe to a meal plan and get fresh salads delivered daily.
              </p>
              <Link to="/subscription">
                <Button
                  size="sm"
                  className="rounded-full bg-primary text-white hover:bg-primary/90"
                  data-ocid="dashboard.primary_button"
                >
                  View Plans
                </Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Orders Section */}
        <motion.div
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-bold text-foreground">My Orders</h2>
            {orders && orders.length > 0 && (
              <span className="ml-auto bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </div>

          {ordersLoading ? (
            <div className="p-5 space-y-3" data-ocid="dashboard.loading_state">
              {[1, 2].map((n) => (
                <div key={n} className="space-y-1.5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="divide-y divide-border">
              {orders.map((order, i) => (
                <div
                  key={Number(order.id)}
                  className="px-5 py-4"
                  data-ocid={`dashboard.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Order #{Number(order.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className={`rounded-full text-xs px-2.5 py-0.5 shrink-0 ${
                        statusConfig[order.status]?.color ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <p
                        key={item.saladName}
                        className="text-xs text-muted-foreground"
                      >
                        {item.saladName} ×{Number(item.quantity)} —{" "}
                        <span className="text-primary font-medium">
                          ₹{Number(item.price)}
                        </span>
                      </p>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-foreground mt-2">
                    Total: ₹{Number(order.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-14 px-6 text-center"
              data-ocid="dashboard.empty_state"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                No orders yet
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Your order history will appear here once you place your first
                order.
              </p>
              <Link to="/menu">
                <Button
                  size="sm"
                  className="rounded-full bg-primary text-white hover:bg-primary/90"
                  data-ocid="dashboard.primary_button"
                >
                  Browse Menu
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

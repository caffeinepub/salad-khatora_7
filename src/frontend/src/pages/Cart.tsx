import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useActor } from "@/hooks/useActor";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { DiscountType, Variant_active_expired } from "../backend";
import type { Coupon } from "../backend";
import { usePlaceOrder, useUserSubscription } from "../hooks/useQueries";

type DeliveryOption = "instant" | "scheduled" | "";

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const placeOrder = usePlaceOrder();
  const { actor } = useActor();
  const { data: userSubscription } = useUserSubscription();

  const [delivery, setDelivery] = useState<DeliveryOption>("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const isScheduleValid =
    delivery !== "scheduled" || (schedDate !== "" && schedTime !== "");

  const subscriptionEnded =
    userSubscription != null &&
    (Number(userSubscription.saladsRemaining) <= 0 ||
      userSubscription.status === Variant_active_expired.expired);

  const canOrder =
    delivery !== "" &&
    isScheduleValid &&
    items.length > 0 &&
    !subscriptionEnded;

  const discount = appliedCoupon
    ? appliedCoupon.discountType === DiscountType.percentage
      ? Math.round((cartTotal * Number(appliedCoupon.discountValue)) / 100)
      : Math.min(Number(appliedCoupon.discountValue), cartTotal)
    : 0;
  const finalTotal = Math.max(0, cartTotal - discount);

  const applyCoupon = async () => {
    if (!actor || !couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const coupon = await actor.validateCoupon(
        couponCode.trim().toUpperCase(),
      );
      setAppliedCoupon(coupon);
      toast.success("Discount applied! 🎉");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Invalid or expired coupon";
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to place an order");
      navigate({ to: "/login" });
      return;
    }

    setOrderError(null);

    const orderItems = items.map((item) => ({
      saladName: item.name,
      quantity: BigInt(item.quantity),
      price: BigInt(item.price),
    }));

    const deliveryType =
      delivery === "instant"
        ? { __kind__: "instant" as const, instant: null }
        : {
            __kind__: "scheduled" as const,
            scheduled: BigInt(Date.parse(`${schedDate}T${schedTime}`)),
          };

    try {
      await placeOrder.mutateAsync({
        items: orderItems,
        totalAmount: BigInt(finalTotal),
        deliveryType,
      });
      clearCart();
      toast.success("Order placed! Check your dashboard for updates. 🥗");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.";
      setOrderError(msg);
      toast.error(msg);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Subscription meal status for display
  const mealsRemaining = userSubscription
    ? Number(userSubscription.saladsRemaining)
    : null;
  const isActiveSubscription =
    userSubscription?.status === Variant_active_expired.active &&
    mealsRemaining !== null &&
    mealsRemaining > 0;
  const isLowMeals = isActiveSubscription && mealsRemaining! <= 3;

  return (
    <div className="min-h-screen flex flex-col font-poppins">
      <Navbar />

      <main className="flex-1 bg-accent/30">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Your Cart
          </motion.h1>

          {items.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="cart.empty_state"
            >
              <ShoppingBag className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added anything yet.
              </p>
              <Link to="/menu">
                <Button
                  className="rounded-full bg-primary text-white px-8"
                  data-ocid="cart.primary_button"
                >
                  Browse Menu
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
                data-ocid="cart.list"
              >
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      data-ocid={`cart.item.${i + 1}`}
                    >
                      {i > 0 && <Separator />}
                      <div className="flex items-center gap-3 p-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-primary font-bold text-sm">
                            ₹{item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item.id, item.quantity - 1)
                            }
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            data-ocid={`cart.secondary_button.${i + 1}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item.id, item.quantity + 1)
                            }
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            data-ocid={`cart.button.${i + 1}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                          data-ocid={`cart.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Delivery Options */}
              <div
                className="bg-white rounded-2xl shadow-sm p-5"
                data-ocid="cart.panel"
              >
                <h2 className="font-bold text-foreground mb-4">
                  Delivery Option
                </h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      delivery === "instant"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-ocid="cart.radio"
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="instant"
                      checked={delivery === "instant"}
                      onChange={() => setDelivery("instant")}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        ⚡ Instant Delivery
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Delivered ASAP · Free delivery
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      delivery === "scheduled"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-ocid="cart.radio"
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="scheduled"
                      checked={delivery === "scheduled"}
                      onChange={() => setDelivery("scheduled")}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">
                        📅 Schedule Delivery
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Choose your preferred date & time
                      </p>
                      {delivery === "scheduled" && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Date
                            </Label>
                            <Input
                              type="date"
                              min={today}
                              value={schedDate}
                              onChange={(e) => setSchedDate(e.target.value)}
                              className="h-8 text-sm rounded-lg"
                              data-ocid="cart.input"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Time
                            </Label>
                            <Input
                              type="time"
                              value={schedTime}
                              onChange={(e) => setSchedTime(e.target.value)}
                              className="h-8 text-sm rounded-lg"
                              data-ocid="cart.input"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div
                className="bg-white rounded-2xl shadow-sm p-5"
                data-ocid="cart.card"
              >
                <h2 className="font-bold text-foreground mb-4">
                  Order Summary
                </h2>
                {/* Coupon Code */}
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Have a coupon?
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className="h-9 text-sm uppercase flex-1"
                      disabled={!!appliedCoupon}
                      data-ocid="cart.input"
                    />
                    {appliedCoupon ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-red-500 border-red-200"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        data-ocid="cart.secondary_button"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-sm"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        data-ocid="cart.secondary_button"
                      >
                        {couponLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {appliedCoupon.code} applied
                    </p>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{cartTotal}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">₹{finalTotal}</span>
                  </div>
                </div>

                {/* ── Subscription Meals Status ── */}
                <div className="mt-5 mb-3" data-ocid="cart.subscription_status">
                  {!userSubscription ? (
                    // No active subscription
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-base">🍽️</span>
                        <span className="text-sm text-gray-600 font-medium">
                          No active subscription
                        </span>
                      </div>
                      <Link to="/subscription">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs rounded-full border-primary text-primary hover:bg-accent shrink-0"
                          data-ocid="cart.subscription_status.view_plans_button"
                        >
                          View Plans
                        </Button>
                      </Link>
                    </div>
                  ) : subscriptionEnded ? // Subscription expired / 0 meals — already shown below as error, skip here
                  null : isLowMeals ? (
                    // Low meals warning
                    <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
                      <span className="text-orange-500 text-base shrink-0">
                        ⚠️
                      </span>
                      <span className="text-sm text-orange-700 font-medium">
                        Only {mealsRemaining} meal
                        {mealsRemaining === 1 ? "" : "s"} left – renew soon
                      </span>
                      <Link to="/subscription" className="ml-auto shrink-0">
                        <span className="text-xs text-orange-600 underline underline-offset-2 font-medium hover:text-orange-800">
                          Renew
                        </span>
                      </Link>
                    </div>
                  ) : (
                    // Normal — meals available
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                      <span className="text-green-600 text-base shrink-0">
                        🥗
                      </span>
                      <span className="text-sm text-green-700 font-medium">
                        You have {mealsRemaining} meal
                        {mealsRemaining === 1 ? "" : "s"} remaining
                      </span>
                    </div>
                  )}
                </div>

                {subscriptionEnded && (
                  <div
                    className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium mb-3"
                    data-ocid="cart.error_state"
                  >
                    <span>
                      ⚠️ Your subscription has ended, please renew to continue
                      ordering.
                    </span>
                    <a
                      href="/subscription"
                      className="ml-auto underline whitespace-nowrap text-red-600 hover:text-red-800"
                    >
                      Renew
                    </a>
                  </div>
                )}

                {orderError && !subscriptionEnded && (
                  <div
                    className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium mb-3"
                    data-ocid="cart.stock_error"
                  >
                    <span className="shrink-0 text-base">🚫</span>
                    <span className="flex-1">{orderError}</span>
                    <button
                      type="button"
                      onClick={() => setOrderError(null)}
                      className="ml-2 shrink-0 text-red-400 hover:text-red-700 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <Button
                  className="w-full mt-2 rounded-full bg-primary text-white hover:bg-primary/90 h-12 text-base font-semibold disabled:opacity-50"
                  disabled={!canOrder || placeOrder.isPending}
                  onClick={handleOrder}
                  data-ocid="cart.submit_button"
                >
                  {placeOrder.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                {!subscriptionEnded && !delivery && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Select a delivery option to continue
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

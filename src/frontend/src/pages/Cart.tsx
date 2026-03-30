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
import { DiscountType } from "../backend";
import type { Coupon } from "../backend";
import { usePlaceOrder } from "../hooks/useQueries";

type DeliveryOption = "instant" | "scheduled" | "";

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const placeOrder = usePlaceOrder();
  const { actor } = useActor();

  const [delivery, setDelivery] = useState<DeliveryOption>("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const isScheduleValid =
    delivery !== "scheduled" || (schedDate !== "" && schedTime !== "");
  const canOrder = delivery !== "" && isScheduleValid && items.length > 0;

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
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  const today = new Date().toISOString().split("T")[0];

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

                <Button
                  className="w-full mt-5 rounded-full bg-primary text-white hover:bg-primary/90 h-12 text-base font-semibold disabled:opacity-50"
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
                {!delivery && (
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

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  IndianRupee,
  Leaf,
  Loader2,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Pencil,
  PhoneCall,
  Plus,
  Search,
  ShieldAlert,
  ShoppingCart,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import {
  type Coupon,
  DeliveryStatus,
  DiscountType,
  type Ingredient,
  type LeadStatus,
  type MenuItem,
  type Order,
  OrderStatus,
  type Review,
  ReviewStatus,
  type Rider,
  type Subscription,
  Variant_active_expired,
} from "../backend";

// Extended Order type with delivery fields from the new backend API
type ExtendedOrder = Order & {
  deliveryStatus?: DeliveryStatus;
  assignedRiderId?: bigint;
  deliveryNotes?: string;
};

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncatePrincipal(p: { toString(): string }) {
  const s = p.toString();
  return s.length > 12 ? `${s.slice(0, 10)}...` : s;
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    Promise.all([actor.getAllOrders(), actor.getAllSubscriptions()])
      .then(([o, s]) => {
        setOrders(o);
        setSubscriptions(s);
      })
      .catch(() => toast.error("Failed to load analytics data"))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  // Compute stats
  const now = new Date();

  function isToday(ts: bigint) {
    const d = new Date(Number(ts) / 1_000_000);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  function isThisWeek(ts: bigint) {
    const d = new Date(Number(ts) / 1_000_000);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return d >= monday && d <= sunday;
  }

  function isThisMonth(ts: bigint) {
    const d = new Date(Number(ts) / 1_000_000);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }

  const ordersToday = orders.filter((o) => isToday(o.createdAt)).length;
  const ordersWeek = orders.filter((o) => isThisWeek(o.createdAt)).length;
  const ordersMonth = orders.filter((o) => isThisMonth(o.createdAt)).length;
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0,
  );
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === Variant_active_expired.active,
  ).length;

  // Most ordered salads
  const saladCounts: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      saladCounts[item.saladName] =
        (saladCounts[item.saladName] ?? 0) + Number(item.quantity);
    }
  }
  const topSalads = Object.entries(saladCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = topSalads[0]?.[1] ?? 1;

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const statCards = [
    {
      label: "Orders Today",
      value: ordersToday,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Orders This Week",
      value: ordersWeek,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Orders This Month",
      value: ordersMonth,
      icon: Package,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6" data-ocid="admin.analytics.loading_state">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-ocid="admin.analytics.section">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Overview</h2>
        <span className="text-xs text-muted-foreground ml-1">
          All time stats
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            data-ocid="admin.analytics.card"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}
                >
                  <card.icon
                    className={`w-4.5 h-4.5 ${card.color}`}
                    size={18}
                  />
                </div>
              </div>
              <div className={`text-2xl font-bold ${card.color} leading-none`}>
                {card.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5 font-medium">
                {card.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Most ordered salads */}
      <Card className="border border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            Most Ordered Salads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSalads.length === 0 ? (
            <div
              className="py-10 text-center text-muted-foreground"
              data-ocid="admin.analytics.empty_state"
            >
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                No orders yet — salad rankings will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topSalads.map(([name, count], idx) => (
                <div
                  key={name}
                  className="flex items-center gap-3"
                  data-ocid={`admin.analytics.item.${idx + 1}`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700"
                        : idx === 1
                          ? "bg-slate-100 text-slate-600"
                          : idx === 2
                            ? "bg-orange-100 text-orange-600"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium w-36 shrink-0 truncate">
                    {name}
                  </span>
                  <div className="flex-1 relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-primary/30"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-12 text-right shrink-0">
                    {count} orders
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────
function OrdersTab() {
  const { actor, isFetching } = useActor();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<bigint | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    actor
      .getAllOrders()
      .then(setOrders)
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const handleStatusChange = async (orderId: bigint, status: OrderStatus) => {
    if (!actor) return;
    setUpdating(orderId);
    try {
      await actor.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" data-ocid="admin.orders.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="admin.orders.empty_state"
      >
        <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No orders yet</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border"
      data-ocid="admin.orders.table"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Order ID</TableHead>
            <TableHead className="font-semibold">User</TableHead>
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Items</TableHead>
            <TableHead className="font-semibold">Total</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, i) => (
            <TableRow
              key={Number(order.id)}
              data-ocid={`admin.orders.item.${i + 1}`}
            >
              <TableCell className="font-mono text-xs font-semibold text-primary">
                #{Number(order.id)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {truncatePrincipal(order.user)}
              </TableCell>
              <TableCell className="text-xs">
                {formatDate(order.createdAt)}
              </TableCell>
              <TableCell className="text-xs max-w-[160px]">
                {order.items
                  .map((item) => `${item.saladName} ×${Number(item.quantity)}`)
                  .join(", ")}
              </TableCell>
              <TableCell className="font-semibold text-sm">
                ₹{Number(order.totalAmount)}
              </TableCell>
              <TableCell>
                <Select
                  value={order.status}
                  onValueChange={(v) =>
                    handleStatusChange(order.id, v as OrderStatus)
                  }
                  disabled={updating === order.id}
                >
                  <SelectTrigger
                    className="h-8 w-[130px] text-xs"
                    data-ocid={`admin.orders.select.${i + 1}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrderStatus.pending}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        Pending
                      </span>
                    </SelectItem>
                    <SelectItem value={OrderStatus.confirmed}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Confirmed
                      </span>
                    </SelectItem>
                    <SelectItem value={OrderStatus.delivered}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Delivered
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

type UserRecord = {
  principal: { toString(): string };
  profile: {
    name: string;
    mobile: string;
    email: string;
    address: string;
    age: [] | [number];
    heightCm: [] | [number];
    weightKg: [] | [number];
    dietaryPreferences: string[];
    dietaryRestrictions: string[];
  };
};

type UserMeta = {
  isVip: boolean;
  notes: Array<{ id: bigint; text: string; createdAt: bigint }>;
};

type UserStats = {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: bigint | null;
  hasSubscription: boolean;
  favoriteSalad: string | null;
};

function computeUserStats(
  principalStr: string,
  orders: Order[],
  subscriptions: Subscription[],
): UserStats {
  const userOrders = orders.filter((o) => o.user.toString() === principalStr);
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0,
  );
  const lastOrderDate =
    userOrders.length > 0
      ? userOrders.reduce(
          (max, o) => (o.createdAt > max ? o.createdAt : max),
          userOrders[0].createdAt,
        )
      : null;
  const hasSub = subscriptions.some(
    (s) =>
      s.user.toString() === principalStr &&
      s.status === Variant_active_expired.active,
  );

  // Favorite salad
  const saladCount: Record<string, number> = {};
  for (const o of userOrders) {
    for (const item of o.items) {
      saladCount[item.saladName] =
        (saladCount[item.saladName] || 0) + Number(item.quantity);
    }
  }
  const favoriteSalad =
    Object.keys(saladCount).length > 0
      ? Object.entries(saladCount).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return {
    totalOrders,
    totalSpent,
    lastOrderDate,
    hasSubscription: hasSub,
    favoriteSalad,
  };
}

function formatDateReadable(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysSince(ts: bigint) {
  return Math.floor(
    (Date.now() - Number(ts) / 1_000_000) / (1000 * 60 * 60 * 24),
  );
}

function getSegment(
  stats: UserStats,
): "new" | "active" | "high_value" | "inactive" {
  if (stats.totalOrders === 0) return "new";
  const days =
    stats.lastOrderDate !== null ? daysSince(stats.lastOrderDate) : null;
  if (days === null || days > 30) return "inactive";
  if (stats.totalOrders >= 5 || stats.totalSpent >= 1000) return "high_value";
  return "active";
}

function SegmentBadge({ segment }: { segment: ReturnType<typeof getSegment> }) {
  const config = {
    new: {
      label: "New",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    active: {
      label: "Active",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    high_value: {
      label: "⭐ High Value",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    inactive: {
      label: "Inactive",
      className: "bg-red-100 text-red-600 border-red-200",
    },
  };
  const c = config[segment];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-semibold border ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function calcBmi(weightKg: number, heightCm: number) {
  if (heightCm === 0) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "text-green-600" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-600" };
  return { label: "Obese", color: "text-red-500" };
}

// ─── User Detail Sheet ───────────────────────────────────────────────────────
function UserDetailSheet({
  user,
  stats,
  orders,
  subscriptions,
  onClose,
  onDeleted,
  onUpdated,
}: {
  user: UserRecord;
  stats: UserStats;
  orders: Order[];
  subscriptions: Subscription[];
  onClose: () => void;
  onDeleted: (p: string) => void;
  onUpdated: (p: string, profile: UserRecord["profile"]) => void;
}) {
  const { actor } = useActor();
  const [meta, setMeta] = useState<UserMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState<bigint | null>(null);
  const [vipLoading, setVipLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    ...user.profile,
    age: user.profile.age[0] ?? "",
    heightCm: user.profile.heightCm[0] ?? "",
    weightKg: user.profile.weightKg[0] ?? "",
  });
  const [saving, setSaving] = useState(false);

  const principalStr = user.principal.toString();
  const userOrders = orders.filter((o) => o.user.toString() === principalStr);
  const userSub = subscriptions.find(
    (s) =>
      s.user.toString() === principalStr &&
      s.status === Variant_active_expired.active,
  );

  useEffect(() => {
    if (!actor) return;
    actor
      .getUserMeta(user.principal as any)
      .then((m: any) => setMeta(m as UserMeta))
      .catch(() => setMeta({ isVip: false, notes: [] }))
      .finally(() => setMetaLoading(false));
  }, [actor, user.principal]);

  const toggleVip = async () => {
    if (!actor || !meta) return;
    setVipLoading(true);
    try {
      await actor.setUserVip(user.principal as any, !meta.isVip);
      setMeta({ ...meta, isVip: !meta.isVip });
      toast.success(meta.isVip ? "VIP status removed" : "Marked as VIP ⭐");
    } catch {
      toast.error("Failed to update VIP status");
    } finally {
      setVipLoading(false);
    }
  };

  const addNote = async () => {
    if (!actor || !noteText.trim()) return;
    setAddingNote(true);
    try {
      const id = await actor.addUserNote(
        user.principal as any,
        noteText.trim(),
      );
      const newNote = {
        id: id as bigint,
        text: noteText.trim(),
        createdAt: BigInt(Date.now() * 1_000_000),
      };
      setMeta((prev) =>
        prev ? { ...prev, notes: [...prev.notes, newNote] } : prev,
      );
      setNoteText("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const deleteNote = async (noteId: bigint) => {
    if (!actor) return;
    setDeletingNote(noteId);
    try {
      await actor.deleteUserNote(user.principal as any, noteId);
      setMeta((prev) =>
        prev
          ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }
          : prev,
      );
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeletingNote(null);
    }
  };

  const handleDelete = async () => {
    if (!actor) return;
    setDeleting(true);
    try {
      await actor.deleteUser(user.principal as any);
      toast.success("User deleted");
      onDeleted(principalStr);
      onClose();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      const profile = {
        name: editForm.name,
        mobile: editForm.mobile,
        email: editForm.email,
        address: editForm.address,
        age: editForm.age !== "" ? [Number(editForm.age)] : [],
        heightCm: editForm.heightCm !== "" ? [Number(editForm.heightCm)] : [],
        weightKg: editForm.weightKg !== "" ? [Number(editForm.weightKg)] : [],
        dietaryPreferences: user.profile.dietaryPreferences,
        dietaryRestrictions: user.profile.dietaryRestrictions,
      };
      await actor.updateUserProfileByAdmin(
        user.principal as any,
        profile as any,
      );
      onUpdated(principalStr, profile as UserRecord["profile"]);
      toast.success("Profile updated");
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const weight =
    editForm.weightKg !== ""
      ? Number(editForm.weightKg)
      : (user.profile.weightKg[0] ?? 0);
  const height =
    editForm.heightCm !== ""
      ? Number(editForm.heightCm)
      : (user.profile.heightCm[0] ?? 0);
  const bmi = weight && height ? calcBmi(weight, height) : null;
  const bmiCat = bmi ? bmiCategory(bmi) : null;

  const avgOrder =
    stats.totalOrders > 0
      ? Math.round(stats.totalSpent / stats.totalOrders)
      : 0;

  const getSubExpiry = () => {
    if (!userSub) return null;
    return new Date(Number(userSub.expiryDate) / 1_000_000).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  return (
    <>
      <SheetHeader className="pb-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {(user.profile.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">
                  {user.profile.name || "Unknown"}
                </SheetTitle>
                {meta?.isVip && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                    ⭐ VIP
                  </Badge>
                )}
                {stats.lastOrderDate && daysSince(stats.lastOrderDate) >= 7 && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-300 text-xs"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {user.profile.mobile}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={meta?.isVip ? "default" : "outline"}
            className={
              meta?.isVip
                ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                : ""
            }
            onClick={toggleVip}
            disabled={vipLoading || metaLoading}
            data-ocid="user.detail.toggle"
          >
            <Star
              className={`w-4 h-4 ${meta?.isVip ? "fill-yellow-900" : ""}`}
            />
          </Button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="space-y-5 py-4">
          {/* Profile */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium truncate">
                  {user.profile.email || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Address</span>
                <p className="font-medium">{user.profile.address || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Age</span>
                <p className="font-medium">{user.profile.age[0] ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Height</span>
                <p className="font-medium">
                  {user.profile.heightCm[0]
                    ? `${user.profile.heightCm[0]} cm`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Weight</span>
                <p className="font-medium">
                  {user.profile.weightKg[0]
                    ? `${user.profile.weightKg[0]} kg`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">BMI</span>
                {bmi ? (
                  <p className={`font-medium ${bmiCat?.color}`}>
                    {bmi.toFixed(1)} — {bmiCat?.label}
                  </p>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
              {stats.lastOrderDate && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Last Active</span>
                  <p className="font-medium">
                    {formatDateReadable(stats.lastOrderDate)} (
                    {daysSince(stats.lastOrderDate)} days ago)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Total Orders</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Total Spent</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{stats.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Avg Order</p>
                <p className="text-xl font-semibold">₹{avgOrder}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Favorite Salad</p>
                <p className="text-sm font-semibold truncate">
                  {stats.favoriteSalad || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm">
              {userSub ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                      {userSub.planName}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Remaining Meals
                    </span>
                    <span className="font-medium">
                      {String(userSub.saladsRemaining)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry</span>
                    <span className="font-medium">{getSubExpiry()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No active subscription</p>
              )}
            </CardContent>
          </Card>

          {/* Order History */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Order History ({userOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {userOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {userOrders
                    .slice()
                    .sort((a, b) => Number(b.createdAt - a.createdAt))
                    .map((order) => {
                      const statusColors: Record<string, string> = {
                        pending: "bg-yellow-100 text-yellow-700",
                        confirmed: "bg-blue-100 text-blue-700",
                        preparing: "bg-orange-100 text-orange-700",
                        ready: "bg-purple-100 text-purple-700",
                        delivered: "bg-green-100 text-green-700",
                        cancelled: "bg-red-100 text-red-700",
                      };
                      const statusStr =
                        typeof order.status === "string"
                          ? order.status
                          : Object.keys(order.status)[0];
                      return (
                        <div
                          key={String(order.id)}
                          className="border border-border/60 rounded-lg p-3 text-sm"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-xs text-muted-foreground">
                              #{String(order.id)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[statusStr] || "bg-muted text-muted-foreground"}`}
                            >
                              {statusStr}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatDateReadable(order.createdAt)}
                          </p>
                          <p className="text-xs">
                            {order.items
                              .map((i) => `${i.saladName} ×${i.quantity}`)
                              .join(", ")}
                          </p>
                          <p className="font-semibold text-primary mt-1">
                            ₹{Number(order.totalAmount).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {metaLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  {meta?.notes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No notes yet
                    </p>
                  )}
                  <div className="space-y-2">
                    {meta?.notes.map((note) => (
                      <div
                        key={String(note.id)}
                        className="flex items-start justify-between gap-2 bg-muted/40 rounded-lg px-3 py-2 text-sm"
                      >
                        <span>{note.text}</span>
                        <button
                          type="button"
                          onClick={() => deleteNote(note.id)}
                          disabled={deletingNote === note.id}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          data-ocid="user.notes.delete_button"
                        >
                          {deletingNote === note.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="e.g. Prefers high protein, Gym regular"
                      className="text-sm"
                      onKeyDown={(e) => e.key === "Enter" && addNote()}
                      data-ocid="user.notes.input"
                    />
                    <Button
                      size="sm"
                      onClick={addNote}
                      disabled={addingNote || !noteText.trim()}
                      data-ocid="user.notes.submit_button"
                    >
                      {addingNote ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() =>
                window.open(
                  `https://wa.me/91${user.profile.mobile}?text=Hi%20${encodeURIComponent(user.profile.name)}%2C%20this%20is%20Salad%20Khatora%20team!`,
                  "_blank",
                )
              }
              data-ocid="user.whatsapp.button"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-green-600"
                role="img"
                aria-label="WhatsApp"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => toast.info("Discount feature coming soon")}
              data-ocid="user.discount.button"
            >
              <Tag className="w-4 h-4" />
              Offer Discount
            </Button>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setEditOpen(true)}
              data-ocid="user.edit.button"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              data-ocid="user.delete.button"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm" data-ocid="user.edit.dialog">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(["name", "mobile", "email", "address"] as const).map((field) => (
              <div key={field}>
                <Label className="capitalize text-xs">{field}</Label>
                <Input
                  value={editForm[field] as string}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                  data-ocid={`user.edit.${field}.input` as any}
                />
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              {(["age", "heightCm", "weightKg"] as const).map((field) => (
                <div key={field}>
                  <Label className="text-xs capitalize">
                    {field === "heightCm"
                      ? "Height (cm)"
                      : field === "weightKg"
                        ? "Weight (kg)"
                        : "Age"}
                  </Label>
                  <Input
                    type="number"
                    value={editForm[field] as string | number}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    data-ocid={`user.edit.${field}.input` as any}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="user.edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              data-ocid="user.edit.save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="user.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {user.profile.name || "this user"}{" "}
              and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="user.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
              data-ocid="user.delete.confirm_button"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Users Tab ───────────────────────────────────────────────────────────
function UsersTab() {
  const { actor, isFetching } = useActor();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    | "all"
    | "active"
    | "inactive7"
    | "inactive15"
    | "subscribers"
    | "segment_new"
    | "segment_active"
    | "segment_high_value"
    | "segment_inactive"
  >("all");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    Promise.all([
      actor.getAllUsers() as unknown as Promise<UserRecord[]>,
      actor.getAllOrders() as Promise<Order[]>,
      actor.getAllSubscriptions() as Promise<Subscription[]>,
    ])
      .then(([u, o, s]) => {
        setUsers(u);
        setOrders(o);
        setSubscriptions(s);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const statsMap = useMemo(() => {
    const map: Record<string, UserStats> = {};
    for (const u of users) {
      map[u.principal.toString()] = computeUserStats(
        u.principal.toString(),
        orders,
        subscriptions,
      );
    }
    return map;
  }, [users, orders, subscriptions]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        u.profile.name.toLowerCase().includes(s) ||
        u.profile.mobile.toLowerCase().includes(s);

      const stats = statsMap[u.principal.toString()];
      const days =
        stats.lastOrderDate !== null ? daysSince(stats.lastOrderDate) : null;
      const segment = getSegment(stats);
      const matchFilter =
        filter === "all" ||
        (filter === "active" && days !== null && days < 7) ||
        (filter === "inactive7" && (days === null || days >= 7)) ||
        (filter === "inactive15" && (days === null || days >= 15)) ||
        (filter === "subscribers" && stats.hasSubscription) ||
        (filter === "segment_new" && segment === "new") ||
        (filter === "segment_active" && segment === "active") ||
        (filter === "segment_high_value" && segment === "high_value") ||
        (filter === "segment_inactive" && segment === "inactive");

      return matchSearch && matchFilter;
    });
  }, [users, search, filter, statsMap]);

  const handleDeleted = (p: string) =>
    setUsers((prev) => prev.filter((u) => u.principal.toString() !== p));
  const handleUpdated = (p: string, profile: UserRecord["profile"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.principal.toString() === p ? { ...u, profile } : u)),
    );
  };

  if (loading) {
    return (
      <div className="space-y-3" data-ocid="admin.users.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="admin.users.search_input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { key: "all", label: `All (${users.length})` },
              { key: "active", label: "Active" },
              { key: "inactive7", label: "Inactive 7d" },
              { key: "inactive15", label: "Inactive 15d" },
              { key: "subscribers", label: "Subscribers" },
              { key: "segment_new", label: "🆕 New" },
              { key: "segment_active", label: "✅ Active" },
              { key: "segment_high_value", label: "⭐ High Value" },
              { key: "segment_inactive", label: "💤 Inactive" },
            ] as const
          ).map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              data-ocid={`admin.users.${key}.tab`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="admin.users.empty_state"
        >
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-2" data-ocid="admin.users.list">
          {filtered.map((u, i) => {
            const stats = statsMap[u.principal.toString()];
            return (
              <button
                type="button"
                key={u.principal.toString()}
                onClick={() => setSelectedUser(u)}
                className="w-full text-left border border-border/60 rounded-xl p-4 hover:bg-muted/30 transition-colors"
                data-ocid={`admin.users.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 mt-0.5">
                      {(u.profile.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm truncate">
                          {u.profile.name || "—"}
                        </p>
                        <SegmentBadge segment={getSegment(stats)} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {u.profile.mobile || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.profile.email || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-primary">
                      {stats.totalOrders} orders
                    </p>
                    {stats.totalSpent > 0 && (
                      <p className="text-xs font-semibold text-amber-600">
                        ₹{stats.totalSpent.toLocaleString("en-IN")}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Sub:{" "}
                      <span
                        className={
                          stats.hasSubscription
                            ? "text-green-600 font-medium"
                            : ""
                        }
                      >
                        {stats.hasSubscription ? "Yes" : "No"}
                      </span>
                    </p>
                    {stats.lastOrderDate ? (
                      <p className="text-[10px] text-muted-foreground">
                        Last: {formatDateReadable(stats.lastOrderDate)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        No orders
                      </p>
                    )}
                  </div>
                </div>
                {getSegment(stats) === "inactive" && u.profile.mobile && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const mobile = u.profile.mobile.replace(/\D/g, "");
                        const num = mobile.startsWith("91")
                          ? mobile
                          : `91${mobile}`;
                        const msg = encodeURIComponent(
                          "Hi, we miss you at Salad Khatora! Get 10% off on your next order.",
                        );
                        window.open(
                          `https://wa.me/${num}?text=${msg}`,
                          "_blank",
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
                      data-ocid={`admin.users.send_offer.button.${i + 1}`}
                    >
                      <MessageCircle className="w-3 h-3" />
                      Send Offer
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* User Detail Sheet */}
      <Sheet
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <SheetContent
          className="w-full sm:max-w-md flex flex-col p-4 gap-0"
          data-ocid="user.detail.panel"
        >
          {selectedUser && (
            <UserDetailSheet
              user={selectedUser}
              stats={statsMap[selectedUser.principal.toString()]}
              orders={orders}
              subscriptions={subscriptions}
              onClose={() => setSelectedUser(null)}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Subscriptions Tab ───────────────────────────────────────────────────────
// Local SubscriptionPlan type mapped from backend (id as string for display)
interface SubscriptionPlanLocal {
  id: string;
  name: string;
  totalMeals: number;
  price: number;
  validityDays: number;
  description: string;
}

function SubscriptionsTab() {
  const { actor, isFetching } = useActor();
  const [plans, setPlans] = useState<SubscriptionPlanLocal[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Add/Edit Plan dialog
  const [planDialog, setPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanLocal | null>(
    null,
  );
  const [planForm, setPlanForm] = useState({
    name: "",
    totalMeals: "",
    price: "",
    validityDays: "",
    description: "",
  });
  const [planSaving, setPlanSaving] = useState(false);

  // Delete confirmation
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadPlansFromBackend = useCallback(async () => {
    if (!actor) return;
    try {
      const backendPlans = await actor.getAllSubscriptionPlans();
      setPlans(
        backendPlans.map((p) => ({
          id: String(p.id),
          name: p.name,
          totalMeals: Number(p.totalMeals),
          price: Number(p.price),
          validityDays: Number(p.validityDays),
          description: p.description,
        })),
      );
    } catch {
      toast.error("Failed to load plans");
    }
  }, [actor]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hasLoadedRef is stable, loadPlansFromBackend captured in separate callback
  useEffect(() => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void (async () => {
      try {
        const [s, u] = await Promise.all([
          actor.getAllSubscriptions(),
          actor.getAllUsers() as unknown as Promise<UserRecord[]>,
          loadPlansFromBackend(),
        ]);
        const sorted = [...s].sort((a, b) => {
          const aActive = a.status === Variant_active_expired.active;
          const bActive = b.status === Variant_active_expired.active;
          return aActive === bActive ? 0 : aActive ? -1 : 1;
        });
        setSubs(sorted as Subscription[]);
        setUsers(u as unknown as UserRecord[]);
      } catch {
        toast.error("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, isFetching, loadPlansFromBackend]);

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      totalMeals: "",
      price: "",
      validityDays: "",
      description: "",
    });
    setPlanDialog(true);
  };

  const openEditPlan = (plan: SubscriptionPlanLocal) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      totalMeals: String(plan.totalMeals),
      price: String(plan.price),
      validityDays: String(plan.validityDays),
      description: plan.description,
    });
    setPlanDialog(true);
  };

  const savePlan = async () => {
    if (!actor) return;
    const { name, totalMeals, price, validityDays, description } = planForm;
    if (!name || !totalMeals || !price || !validityDays || !description) {
      toast.error("All fields are required");
      return;
    }
    setPlanSaving(true);
    try {
      if (editingPlan) {
        await actor.updateSubscriptionPlan(
          BigInt(editingPlan.id),
          name,
          BigInt(totalMeals),
          BigInt(price),
          BigInt(validityDays),
          description,
        );
      } else {
        await actor.createSubscriptionPlan(
          name,
          BigInt(totalMeals),
          BigInt(price),
          BigInt(validityDays),
          description,
        );
      }
      await loadPlansFromBackend();
      setPlanDialog(false);
      toast.success(editingPlan ? "Plan updated" : "Plan created");
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setPlanSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!actor || !deletePlanId) return;
    try {
      await actor.deleteSubscriptionPlan(BigInt(deletePlanId));
      await loadPlansFromBackend();
      setDeletePlanId(null);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const toggleStatus = async (sub: Subscription) => {
    if (!actor) return;
    const key = sub.user.toString();
    setUpdating(key);
    const newStatus =
      sub.status === Variant_active_expired.active
        ? Variant_active_expired.expired
        : Variant_active_expired.active;
    try {
      await actor.updateSubscriptionStatus(sub.user, newStatus);
      setSubs((prev) =>
        prev.map((s) =>
          s.user.toString() === key ? { ...s, status: newStatus } : s,
        ),
      );
      toast.success("Subscription status updated");
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      setUpdating(null);
    }
  };

  const getUserName = (principal: { toString(): string }) => {
    const match = users.find(
      (u) => u.principal.toString() === principal.toString(),
    );
    return match?.profile?.name || truncatePrincipal(principal);
  };

  const getPlanName = (sub: Subscription) => {
    return sub.planName;
  };

  const getLowMeals = (sub: Subscription) => {
    return (
      sub.status === Variant_active_expired.active &&
      Number(sub.saladsRemaining) <= 2
    );
  };

  if (loading) {
    return (
      <div className="space-y-4" data-ocid="admin.subs.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Section 1: Plans ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Subscription Plans
          </h2>
          <Button
            size="sm"
            className="gap-1 rounded-full"
            onClick={openAddPlan}
            data-ocid="admin.plans.open_modal_button"
          >
            <Plus className="h-4 w-4" /> Add Plan
          </Button>
        </div>

        {plans.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground rounded-xl border border-dashed border-border"
            data-ocid="admin.plans.empty_state"
          >
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No plans yet. Add your first plan.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <Card
                key={plan.id}
                className="border border-border rounded-xl"
                data-ocid={`admin.plans.item.${i + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold">
                      {plan.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEditPlan(plan)}
                        data-ocid={`admin.plans.edit_button.${i + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletePlanId(plan.id)}
                        data-ocid={`admin.plans.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1">
                      <Utensils className="h-3.5 w-3.5" />
                      {plan.totalMeals} meals
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      ₹{plan.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {plan.validityDays} days
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-xs line-clamp-2 mt-1 text-muted-foreground/80">
                      {plan.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: User Subscriptions ── */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          Active Subscriptions
        </h2>

        {subs.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground rounded-xl border border-dashed border-border"
            data-ocid="admin.subs.empty_state"
          >
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No user subscriptions found.</p>
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-xl border border-border"
            data-ocid="admin.subs.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Meals Left</TableHead>
                  <TableHead className="font-semibold">Started</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((sub, i) => {
                  const low = getLowMeals(sub);
                  const isExpired =
                    sub.status === Variant_active_expired.expired;
                  return (
                    <TableRow
                      key={sub.user.toString()}
                      data-ocid={`admin.subs.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {getUserName(sub.user)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-primary/30 text-primary"
                        >
                          {getPlanName(sub)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            {Number(sub.saladsRemaining)}
                          </span>
                          {low && (
                            <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 px-1.5 py-0">
                              <AlertTriangle className="h-3 w-3 mr-0.5 inline" />
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.startDate)}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                            Expired
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 rounded-full"
                          onClick={() => toggleStatus(sub)}
                          disabled={updating === sub.user.toString()}
                          data-ocid={`admin.subs.toggle.${i + 1}`}
                        >
                          {updating === sub.user.toString() ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : sub.status === Variant_active_expired.active ? (
                            "Expire"
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* ── Add/Edit Plan Dialog ── */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-md" data-ocid="admin.plans.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Plan" : "Add Subscription Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g. Weekly, Monthly, Custom"
                value={planForm.name}
                onChange={(e) =>
                  setPlanForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="admin.plans.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-meals">Total Meals</Label>
                <Input
                  id="plan-meals"
                  type="number"
                  min="1"
                  placeholder="6"
                  value={planForm.totalMeals}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, totalMeals: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-price">Price (₹)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min="0"
                  placeholder="599"
                  value={planForm.price}
                  onChange={(e) =>
                    setPlanForm((p) => ({ ...p, price: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-days">Validity (Days)</Label>
              <Input
                id="plan-days"
                type="number"
                min="1"
                placeholder="7"
                value={planForm.validityDays}
                onChange={(e) =>
                  setPlanForm((p) => ({ ...p, validityDays: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-desc">Description</Label>
              <Textarea
                id="plan-desc"
                placeholder="Brief description of this plan..."
                rows={2}
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm((p) => ({ ...p, description: e.target.value }))
                }
                data-ocid="admin.plans.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanDialog(false)}
              data-ocid="admin.plans.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={savePlan}
              disabled={planSaving}
              data-ocid="admin.plans.submit_button"
            >
              {planSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={deletePlanId !== null}
        onOpenChange={(o) => !o && setDeletePlanId(null)}
      >
        <AlertDialogContent data-ocid="admin.plans.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The plan will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.plans.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              data-ocid="admin.plans.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────────────────────
function InventoryTab() {
  const { actor, isFetching } = useActor();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStock, setLowStock] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Add ingredient form
  const [addName, setAddName] = useState("");
  const [addUnit, setAddUnit] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addThreshold, setAddThreshold] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Update stock form
  const [updateId, setUpdateId] = useState("");
  const [updateQty, setUpdateQty] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const refreshInventory = async () => {
    if (!actor) return;
    const [all, low] = await Promise.all([
      actor.getAllIngredients(),
      actor.getLowStockIngredients(),
    ]);
    setIngredients(all);
    setLowStock(low);
  };

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    (async () => {
      try {
        const [all, low] = await Promise.all([
          actor.getAllIngredients(),
          actor.getLowStockIngredients(),
        ]);
        setIngredients(all);
        setLowStock(low);
      } catch {
        toast.error("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, isFetching]);

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !addName || !addUnit || !addQty || !addThreshold) return;
    setAddLoading(true);
    try {
      await actor.addIngredient(
        addName,
        addUnit,
        BigInt(Number(addQty)),
        BigInt(Number(addThreshold)),
      );
      setAddName("");
      setAddUnit("");
      setAddQty("");
      setAddThreshold("");
      await refreshInventory();
      toast.success("Ingredient added");
    } catch {
      toast.error("Failed to add ingredient");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !updateId || !updateQty) return;
    setUpdateLoading(true);
    try {
      await actor.updateIngredientStock(
        BigInt(Number(updateId)),
        BigInt(Number(updateQty)),
      );
      setUpdateId("");
      setUpdateQty("");
      await refreshInventory();
      toast.success("Stock updated");
    } catch {
      toast.error("Failed to update stock");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" data-ocid="admin.inventory.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
          data-ocid="admin.inventory.error_state"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">
              Low Stock Alert
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {lowStock.map((i) => i.name).join(", ")} — running low!
            </p>
          </div>
        </div>
      )}

      {/* Ingredients table */}
      <div
        className="rounded-xl border border-border overflow-x-auto"
        data-ocid="admin.inventory.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold">Stock</TableHead>
              <TableHead className="font-semibold">Threshold</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="admin.inventory.empty_state"
                >
                  No ingredients added yet
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ing, i) => (
                <TableRow
                  key={Number(ing.id)}
                  data-ocid={`admin.inventory.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {Number(ing.id)}
                  </TableCell>
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell className="text-xs capitalize">
                    {ing.unit}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {Number(ing.quantityInStock)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {Number(ing.lowStockThreshold)}
                  </TableCell>
                  <TableCell>
                    {Number(ing.quantityInStock) <=
                      Number(ing.lowStockThreshold) && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action forms */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Add ingredient */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Add Ingredient</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddIngredient} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g. Lettuce"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="h-8 text-sm"
                  data-ocid="admin.inventory.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Input
                  placeholder="e.g. grams"
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value)}
                  className="h-8 text-sm"
                  data-ocid="admin.inventory.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Stock Qty</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    className="h-8 text-sm"
                    min="0"
                    data-ocid="admin.inventory.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Low Threshold</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={addThreshold}
                    onChange={(e) => setAddThreshold(e.target.value)}
                    className="h-8 text-sm"
                    min="0"
                    data-ocid="admin.inventory.input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full rounded-lg bg-primary text-white hover:bg-primary/90"
                disabled={addLoading}
                data-ocid="admin.inventory.submit_button"
              >
                {addLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Add Ingredient
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update stock */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Update Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateStock} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Select Ingredient</Label>
                <Select value={updateId} onValueChange={setUpdateId}>
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="admin.inventory.select"
                  >
                    <SelectValue placeholder="Choose ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem
                        key={Number(ing.id)}
                        value={String(Number(ing.id))}
                      >
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Quantity</Label>
                <Input
                  type="number"
                  placeholder="Enter new quantity"
                  value={updateQty}
                  onChange={(e) => setUpdateQty(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                  data-ocid="admin.inventory.input"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="w-full rounded-lg border-primary text-primary hover:bg-accent"
                disabled={updateLoading}
                data-ocid="admin.inventory.submit_button"
              >
                {updateLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Update Stock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Menu Management Tab ─────────────────────────────────────────────────────
const DEFAULT_SIZES = [
  { size: "small", price: "", calories: "", protein: "" },
  { size: "medium", price: "", calories: "", protein: "" },
  { size: "large", price: "", calories: "", protein: "" },
];

const EMPTY_FORM = {
  name: "",
  imageUrl: "",
  tags: [] as string[],
  sizes: DEFAULT_SIZES.map((s) => ({ ...s })),
  linkedIngredients: [
    { key: Date.now(), ingredientId: "", quantityGrams: "" },
  ] as {
    key: number;
    ingredientId: string;
    quantityGrams: string;
  }[],
};

function MenuManagementTab() {
  const { actor, isFetching } = useActor();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({
    ...EMPTY_FORM,
    sizes: DEFAULT_SIZES.map((s) => ({ ...s })),
    linkedIngredients: [{ key: 0, ingredientId: "", quantityGrams: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [ingredientError, setIngredientError] = useState("");

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    Promise.all([actor.getAllMenuItems(), actor.getAllIngredients()])
      .then(([menuData, invData]) => {
        setItems(menuData);
        setInventory(invData);
      })
      .catch(() => toast.error("Failed to load menu data"))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  function freshForm() {
    return {
      name: "",
      imageUrl: "",
      tags: [] as string[],
      sizes: DEFAULT_SIZES.map((s) => ({ ...s })),
      linkedIngredients: [
        { key: Date.now(), ingredientId: "", quantityGrams: "" },
      ] as {
        key: number;
        ingredientId: string;
        quantityGrams: string;
      }[],
    };
  }

  function openAdd() {
    setEditingItem(null);
    setForm(freshForm());
    setIngredientError("");
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    const sizes =
      (item as any).sizes && (item as any).sizes.length === 3
        ? (item as any).sizes.map((s: any) => ({
            size: s.size,
            price: s.price.toString(),
            calories: s.calories.toString(),
            protein: s.protein.toString(),
          }))
        : DEFAULT_SIZES.map((s) => ({ ...s }));
    const linkedIngredients =
      (item as any).linkedIngredients &&
      (item as any).linkedIngredients.length > 0
        ? (item as any).linkedIngredients.map((li: any) => ({
            ingredientId: li.ingredientId.toString(),
            quantityGrams: li.quantityGrams.toString(),
          }))
        : [{ key: 0, ingredientId: "", quantityGrams: "" }];
    setForm({
      name: item.name,
      imageUrl: (item as any).imageUrl ?? "",
      tags: item.tags ?? [],
      sizes,
      linkedIngredients,
    });
    setIngredientError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingItem(null);
    setForm(freshForm());
    setIngredientError("");
  }

  function addIngredientRow() {
    setForm((p) => ({
      ...p,
      linkedIngredients: [
        ...p.linkedIngredients,
        { key: Date.now(), ingredientId: "", quantityGrams: "" },
      ],
    }));
  }

  function removeIngredientRow(idx: number) {
    setForm((p) => ({
      ...p,
      linkedIngredients: p.linkedIngredients.filter((_, i) => i !== idx),
    }));
  }

  function updateIngredientRow(
    idx: number,
    field: "ingredientId" | "quantityGrams",
    value: string,
  ) {
    setForm((p) => {
      const updated = [...p.linkedIngredients];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...p, linkedIngredients: updated };
    });
  }

  function updateSize(
    idx: number,
    field: "price" | "calories" | "protein",
    value: string,
  ) {
    setForm((p) => {
      const updated = [...p.sizes];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...p, sizes: updated };
    });
  }

  async function handleSave() {
    if (!actor) return;
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }

    // Validate ingredients
    const filledIngredients = form.linkedIngredients.filter(
      (li) => li.ingredientId !== "" || li.quantityGrams !== "",
    );
    for (const li of filledIngredients) {
      if (!li.ingredientId) {
        setIngredientError("Please select an ingredient for all rows");
        return;
      }
      if (!li.quantityGrams || Number(li.quantityGrams) <= 0) {
        setIngredientError("Please enter quantity (grams) for all ingredients");
        return;
      }
    }
    setIngredientError("");

    // Build sizes array (skip rows with all empty)
    const sizes = form.sizes
      .filter((s) => s.price !== "" || s.calories !== "" || s.protein !== "")
      .map((s) => ({
        size: s.size,
        price: BigInt(Math.max(0, Number.parseInt(s.price) || 0)),
        calories: BigInt(Math.max(0, Number.parseInt(s.calories) || 0)),
        protein: BigInt(Math.max(0, Number.parseInt(s.protein) || 0)),
      }));

    // Compute base price/calories/protein from medium size
    const mediumSize = form.sizes[1];
    const price = BigInt(Math.max(0, Number.parseInt(mediumSize?.price) || 0));
    const calories = BigInt(
      Math.max(0, Number.parseInt(mediumSize?.calories) || 0),
    );
    const protein = BigInt(
      Math.max(0, Number.parseInt(mediumSize?.protein) || 0),
    );

    // Build linkedIngredients
    const linkedIngredients = filledIngredients.map((li) => ({
      ingredientId: BigInt(li.ingredientId),
      quantityGrams: BigInt(
        Math.max(0, Number.parseInt(li.quantityGrams) || 0),
      ),
    }));

    // Build ingredients display names from selected inventory items
    const ingredients = filledIngredients
      .map((li) => {
        const inv = inventory.find((i) => i.id.toString() === li.ingredientId);
        return inv ? inv.name : "";
      })
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingItem) {
        await (actor as any).updateMenuItem(
          editingItem.id,
          name,
          price,
          calories,
          protein,
          ingredients,
          form.tags,
          sizes,
          linkedIngredients,
          form.imageUrl,
        );
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? {
                  ...i,
                  name,
                  price,
                  calories,
                  protein,
                  ingredients,
                  tags: form.tags,
                  sizes,
                  linkedIngredients,
                  imageUrl: form.imageUrl,
                }
              : i,
          ),
        );
        toast.success("Salad updated");
      } else {
        const newId = await (actor as any).addMenuItem(
          name,
          price,
          calories,
          protein,
          ingredients,
          form.tags,
          sizes,
          linkedIngredients,
          form.imageUrl,
        );
        setItems((prev) => [
          ...prev,
          {
            id: newId,
            name,
            price,
            calories,
            protein,
            ingredients,
            tags: form.tags,
            enabled: true,
            sizes,
            linkedIngredients,
            imageUrl: form.imageUrl,
          },
        ]);
        toast.success("Salad added");
      }
      closeForm();
    } catch (e) {
      toast.error(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    try {
      await actor.deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Salad deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleToggle(item: MenuItem) {
    if (!actor) return;
    const newEnabled = !item.enabled;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, enabled: newEnabled } : i)),
    );
    try {
      await actor.toggleMenuItem(item.id, newEnabled);
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, enabled: item.enabled } : i,
        ),
      );
      toast.error("Toggle failed");
    }
  }

  const SIZE_LABELS: Record<string, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Menu Items</h2>
        <Button
          onClick={openAdd}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
          data-ocid="menu.open_modal_button"
        >
          <Utensils className="w-4 h-4" />
          Add New Salad
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingItem ? "Edit Salad" : "Add New Salad"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="menu-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="menu-name"
                placeholder="e.g. Caesar Salad"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1"
                data-ocid="menu.input"
              />
            </div>

            {/* Image URL */}
            <div>
              <Label htmlFor="menu-image" className="text-sm font-medium">
                Image URL (optional)
              </Label>
              <Input
                id="menu-image"
                placeholder="https://example.com/salad.jpg"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, imageUrl: e.target.value }))
                }
                className="mt-1"
                data-ocid="menu.image_input"
              />
              {form.imageUrl && (
                <div className="mt-2">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-24 w-full object-cover rounded-lg border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bowl Sizes */}
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Bowl Sizes
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Set price, calories, and protein for each size
              </p>
              <div className="space-y-2">
                {form.sizes.map((s, idx) => (
                  <div
                    key={s.size}
                    className="grid grid-cols-4 gap-2 items-center p-3 rounded-lg bg-muted/40 border border-border/50"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-primary w-16">
                        {SIZE_LABELS[s.size] ?? s.size}
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Price (₹)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="149"
                        value={s.price}
                        onChange={(e) =>
                          updateSize(idx, "price", e.target.value)
                        }
                        className="h-8 text-sm mt-0.5"
                        data-ocid={`menu.size_price.${idx + 1}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Calories
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="320"
                        value={s.calories}
                        onChange={(e) =>
                          updateSize(idx, "calories", e.target.value)
                        }
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Protein (g)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="12"
                        value={s.protein}
                        onChange={(e) =>
                          updateSize(idx, "protein", e.target.value)
                        }
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Ingredients
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select ingredients from inventory and specify quantity
              </p>
              <div className="space-y-2">
                {form.linkedIngredients.map((li, idx) => (
                  <div key={li.key} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <select
                        value={li.ingredientId}
                        onChange={(e) =>
                          updateIngredientRow(
                            idx,
                            "ingredientId",
                            e.target.value,
                          )
                        }
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        data-ocid={`menu.ingredient_select.${idx + 1}`}
                      >
                        <option value="">Select ingredient...</option>
                        {inventory.map((inv) => (
                          <option
                            key={inv.id.toString()}
                            value={inv.id.toString()}
                          >
                            {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Qty (g)"
                        value={li.quantityGrams}
                        onChange={(e) =>
                          updateIngredientRow(
                            idx,
                            "quantityGrams",
                            e.target.value,
                          )
                        }
                        className="h-9 text-sm"
                        data-ocid={`menu.ingredient_qty.${idx + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeIngredientRow(idx)}
                      disabled={form.linkedIngredients.length === 1}
                      data-ocid={`menu.ingredient_delete.${idx + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {ingredientError && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="menu.ingredient_error_state"
                >
                  {ingredientError}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5 text-primary border-primary/40 hover:bg-primary/5"
                onClick={addIngredientRow}
                data-ocid="menu.add_ingredient_button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ingredient
              </Button>
            </div>

            {/* Goal Tags */}
            <div>
              <Label className="text-sm font-semibold">Goal Tags</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {(
                  [
                    { value: "weight-loss", label: "Weight Loss" },
                    { value: "high-protein", label: "High Protein" },
                    { value: "detox", label: "Detox" },
                  ] as { value: string; label: string }[]
                ).map((tag) => (
                  <div key={tag.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${tag.value}`}
                      checked={form.tags.includes(tag.value)}
                      onCheckedChange={(checked) =>
                        setForm((p) => ({
                          ...p,
                          tags: checked
                            ? [...p.tags, tag.value]
                            : p.tags.filter((t) => t !== tag.value),
                        }))
                      }
                      data-ocid="menu.checkbox"
                    />
                    <Label
                      htmlFor={`tag-${tag.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {tag.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white"
                data-ocid="menu.submit_button"
              >
                {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editingItem ? "Update Salad" : "Add Salad"}
              </Button>
              <Button
                variant="outline"
                onClick={closeForm}
                data-ocid="menu.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {loading ? (
        <div className="space-y-2" data-ocid="menu.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card data-ocid="menu.empty_state">
          <CardContent className="py-12 text-center">
            <Utensils className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No menu items yet. Add your first salad!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const sizeSummary =
              (item as any).sizes && (item as any).sizes.length > 0
                ? (item as any).sizes
                    .map(
                      (s) =>
                        `${SIZE_LABELS[s.size]?.[0] ?? s.size[0].toUpperCase()}: ₹${s.price.toString()}`,
                    )
                    .join(" | ")
                : null;
            const linkedCount = (item as any).linkedIngredients?.length ?? 0;
            return (
              <Card
                key={item.id.toString()}
                className={`transition-opacity ${item.enabled ? "" : "opacity-60"}`}
                data-ocid={`menu.item.${idx + 1}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {item.name}
                        </span>
                        <Badge
                          className={
                            item.enabled
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }
                        >
                          {item.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      {sizeSummary ? (
                        <p className="text-xs text-primary font-medium mt-1">
                          {sizeSummary}
                        </p>
                      ) : (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span className="font-medium text-primary">
                            ₹{item.price.toString()}
                          </span>
                          <span>{item.calories.toString()} kcal</span>
                          <span>{item.protein.toString()}g protein</span>
                        </div>
                      )}
                      {linkedCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {linkedCount} ingredient{linkedCount !== 1 ? "s" : ""}{" "}
                          linked
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => handleToggle(item)}
                        data-ocid={`menu.toggle.${idx + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                        className="h-8 w-8 p-0"
                        data-ocid={`menu.edit_button.${idx + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {confirmDelete === item.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 px-2 text-xs"
                            data-ocid={`menu.confirm_button.${idx + 1}`}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(null)}
                            className="h-8 px-2 text-xs"
                            data-ocid={`menu.cancel_button.${idx + 1}`}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDelete(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          data-ocid={`menu.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ─── Offers / Coupons Tab ─────────────────────────────────────────────────────
function OffersTab() {
  const { actor, isFetching } = useActor();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const list = await actor.getAllCoupons();
      setCoupons(list);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const hasLoadedRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadCoupons is stable within actor/isFetching scope
  useEffect(() => {
    if (!isFetching && actor && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadCoupons();
    }
  }, [actor, isFetching]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !code || !discountValue || !expiryDate) return;
    setSaving(true);
    try {
      const dt: DiscountType =
        discountType === "percentage"
          ? DiscountType.percentage
          : DiscountType.flat;
      const expiry = BigInt(Date.parse(`${expiryDate}T23:59:59`) * 1_000_000);
      await actor.createCoupon(
        code.toUpperCase(),
        dt,
        BigInt(Number(discountValue)),
        expiry,
      );
      toast.success("Coupon created!");
      setCode("");
      setDiscountValue("");
      setExpiryDate("");
      await loadCoupons();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create coupon";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    if (!actor) return;
    try {
      await actor.toggleCoupon(coupon.id, !coupon.isActive);
      toast.success(`Coupon ${coupon.isActive ? "disabled" : "enabled"}`);
      await loadCoupons();
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteCoupon(id);
      toast.success("Coupon deleted");
      await loadCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6" data-ocid="offers.section">
      {/* Create Coupon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Create Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Coupon Code
              </Label>
              <Input
                placeholder="e.g. SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="uppercase"
                data-ocid="offers.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Discount Type
              </Label>
              <Select
                value={discountType}
                onValueChange={(v) =>
                  setDiscountType(v as "percentage" | "flat")
                }
              >
                <SelectTrigger data-ocid="offers.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {discountType === "percentage" ? "Discount %" : "Discount ₹"}
              </Label>
              <Input
                type="number"
                min="1"
                max={discountType === "percentage" ? "100" : undefined}
                placeholder={
                  discountType === "percentage" ? "e.g. 20" : "e.g. 50"
                }
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                data-ocid="offers.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Expiry Date
              </Label>
              <Input
                type="date"
                min={today}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                data-ocid="offers.input"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full"
                data-ocid="offers.submit_button"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Coupon"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2" data-ocid="offers.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-8"
              data-ocid="offers.empty_state"
            >
              No coupons yet. Create one above.
            </p>
          ) : (
            <Table data-ocid="offers.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c, idx) => (
                  <TableRow
                    key={String(c.id)}
                    data-ocid={`offers.item.${idx + 1}`}
                  >
                    <TableCell className="font-mono font-semibold">
                      {c.code}
                    </TableCell>
                    <TableCell className="capitalize">
                      {c.discountType === DiscountType.percentage ? "%" : "₹"}
                    </TableCell>
                    <TableCell>
                      {c.discountType === DiscountType.percentage
                        ? `${c.discountValue}%`
                        : `₹${c.discountValue}`}
                    </TableCell>
                    <TableCell>{formatDate(c.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => handleToggle(c)}
                        data-ocid={`offers.toggle.${idx + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 h-8 w-8"
                        onClick={() => handleDelete(c.id)}
                        data-ocid={`offers.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Delivery Tab ─────────────────────────────────────────────────────────────
function DeliveryTab() {
  const { actor } = useActor();
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    | "all"
    | "active"
    | "outForDelivery"
    | "delivered"
    | "unassigned"
    | "assigned"
  >("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<bigint>>(new Set());
  const [bulkRiderId, setBulkRiderId] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [groupByLocation, setGroupByLocation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    Map<string, DeliveryStatus>
  >(new Map());
  const [pendingRider, setPendingRider] = useState<Map<string, string>>(
    new Map(),
  );
  const [savingOrder, setSavingOrder] = useState<Set<string>>(new Set());

  // Add rider form
  const [newRider, setNewRider] = useState({ name: "", mobile: "", area: "" });
  const [addingRider, setAddingRider] = useState(false);

  // Edit rider
  const [editRiderId, setEditRiderId] = useState<bigint | null>(null);
  const [editRider, setEditRider] = useState({
    name: "",
    mobile: "",
    area: "",
  });

  const hasLoadedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hasLoadedRef is a stable ref, intentionally excluded
  useEffect(() => {
    // Fetch ONLY ONCE on mount — no auto-refresh, no background syncing
    if (!actor || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setLoading(true);
    Promise.all([
      actor.getAllOrders() as unknown as Promise<ExtendedOrder[]>,
      actor.getAllRiders(),
      actor.getAllUsers() as unknown as Promise<UserRecord[]>,
    ])
      .then(([ords, rids, usrs]) => {
        setOrders(ords);
        setRiders(rids);
        setUsers(usrs);
      })
      .catch(() => toast.error("Failed to load delivery data"))
      .finally(() => setLoading(false));
  }, [actor]);

  const getUserName = (userPrincipal: { toString(): string }): string => {
    const match = users.find(
      (u) => u.principal.toString() === userPrincipal.toString(),
    );
    return match?.profile?.name || truncatePrincipal(userPrincipal);
  };

  const filteredOrders = orders.filter((o) => {
    const status = o.deliveryStatus ?? DeliveryStatus.preparing;
    if (filter === "active")
      return (
        status === DeliveryStatus.preparing || status === DeliveryStatus.ready
      );
    if (filter === "outForDelivery")
      return status === DeliveryStatus.outForDelivery;
    if (filter === "delivered") return status === DeliveryStatus.delivered;
    if (filter === "unassigned") return !o.assignedRiderId;
    if (filter === "assigned") return !!o.assignedRiderId;
    return true;
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    setSelectedOrders(new Set());
  }, [filter]);

  const totalCount = orders.length;
  const activeCount = orders.filter((o) => {
    const s = o.deliveryStatus ?? DeliveryStatus.preparing;
    return s === DeliveryStatus.preparing || s === DeliveryStatus.ready;
  }).length;
  const outForDeliveryCount = orders.filter(
    (o) =>
      (o.deliveryStatus ?? DeliveryStatus.preparing) ===
      DeliveryStatus.outForDelivery,
  ).length;
  const deliveredCount = orders.filter(
    (o) =>
      (o.deliveryStatus ?? DeliveryStatus.preparing) ===
      DeliveryStatus.delivered,
  ).length;
  const unassignedCount = orders.filter((o) => !o.assignedRiderId).length;
  const assignedCount = orders.filter((o) => !!o.assignedRiderId).length;

  // Rider workload map
  const riderWorkload = new Map<string, number>();
  for (const r of riders) {
    const count = orders.filter(
      (o) =>
        String(o.assignedRiderId) === String(r.id) &&
        (o.deliveryStatus ?? DeliveryStatus.preparing) !==
          DeliveryStatus.delivered,
    ).length;
    riderWorkload.set(String(r.id), count);
  }

  const groupedOrders = (): { area: string; orders: ExtendedOrder[] }[] => {
    const map = new Map<string, ExtendedOrder[]>();
    for (const o of filteredOrders) {
      const rider = o.assignedRiderId
        ? riders.find((r) => String(r.id) === String(o.assignedRiderId))
        : undefined;
      const area = rider?.area || "Unassigned";
      if (!map.has(area)) map.set(area, []);
      map.get(area)!.push(o);
    }
    return Array.from(map.entries()).map(([area, aOrders]) => ({
      area,
      orders: aOrders,
    }));
  };

  const handleSelectStatus = (
    orderId: bigint,
    deliveryStatus: DeliveryStatus,
  ) => {
    setPendingStatus((prev) =>
      new Map(prev).set(String(orderId), deliveryStatus),
    );
  };

  const handleSelectRider = (orderId: bigint, riderId: string) => {
    setPendingRider((prev) => new Map(prev).set(String(orderId), riderId));
  };

  const handleSaveOrderUpdate = async (orderId: bigint) => {
    if (!actor) return;
    const idStr = String(orderId);
    const newStatus = pendingStatus.get(idStr) ?? null;
    const newRider = pendingRider.get(idStr);
    // Guard: only set riderId if a valid rider was selected (non-empty string)
    const newRiderId = newRider && newRider !== "" ? BigInt(newRider) : null;

    setSavingOrder((prev) => new Set(prev).add(idStr));
    try {
      const result = await actor.updateOrder(
        orderId,
        newStatus,
        newRiderId,
        null,
      );
      if (result.__kind__ === "err") {
        toast.error(`Update failed: ${result.err}`);
        return;
      }
      const updatedOrder = result.ok;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updatedOrder } : o)),
      );
      setPendingStatus((prev) => {
        const m = new Map(prev);
        m.delete(idStr);
        return m;
      });
      setPendingRider((prev) => {
        const m = new Map(prev);
        m.delete(idStr);
        return m;
      });
      toast.success("Order updated successfully");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Update failed: ${msg}`);
    } finally {
      setSavingOrder((prev) => {
        const s = new Set(prev);
        s.delete(idStr);
        return s;
      });
    }
  };

  const handleBulkAssign = async () => {
    if (!actor || !bulkRiderId || selectedOrders.size === 0) return;
    setBulkAssigning(true);
    const ids = Array.from(selectedOrders);
    let successCount = 0;
    let errorMsg = "";
    for (const id of ids) {
      try {
        const result = await actor.updateOrder(
          id,
          null,
          BigInt(bulkRiderId),
          null,
        );
        if (result.__kind__ === "err") {
          errorMsg = result.err;
        } else {
          const updatedOrder = result.ok;
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o)),
          );
          successCount++;
        }
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : String(e);
      }
    }
    if (successCount > 0) toast.success(`${successCount} order(s) assigned`);
    if (errorMsg) toast.error(`Some assignments failed: ${errorMsg}`);
    setSelectedOrders(new Set());
    setBulkRiderId("");
    setBulkAssigning(false);
  };

  const handleSaveDeliveryNote = async (orderId: bigint, notes: string) => {
    if (!actor) return;
    try {
      const result = await actor.updateOrder(orderId, null, null, notes);
      if (result.__kind__ === "err") {
        toast.error(`Save failed: ${result.err}`);
        return;
      }
      toast.success("Note saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Save failed: ${msg}`);
    }
  };

  const handleAddRider = async () => {
    if (!actor || !newRider.name || !newRider.mobile) return;
    setAddingRider(true);
    try {
      const id = await actor.addRider(
        newRider.name,
        newRider.mobile,
        newRider.area,
      );
      setRiders((prev) => [...prev, { id, ...newRider }]);
      setNewRider({ name: "", mobile: "", area: "" });
      toast.success("Rider added");
    } catch (_e) {
      toast.error("Failed to add rider");
    } finally {
      setAddingRider(false);
    }
  };

  const handleDeleteRider = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteRider(id);
      setRiders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rider deleted");
    } catch (_e) {
      toast.error("Failed to delete rider");
    }
  };

  const startEditRider = (r: Rider) => {
    setEditRiderId(r.id);
    setEditRider({ name: r.name, mobile: r.mobile, area: r.area });
  };

  const handleSaveRider = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.updateRider(
        id,
        editRider.name,
        editRider.mobile,
        editRider.area,
      );
      setRiders((prev) =>
        prev.map((r) => (r.id === id ? { id, ...editRider } : r)),
      );
      setEditRiderId(null);
      toast.success("Rider updated");
    } catch (_e) {
      toast.error("Failed to update rider");
    }
  };

  const statusBadge = (status: DeliveryStatus) => {
    const colorMap: Record<DeliveryStatus, string> = {
      [DeliveryStatus.preparing]: "bg-amber-100 text-amber-700",
      [DeliveryStatus.ready]: "bg-blue-100 text-blue-700",
      [DeliveryStatus.outForDelivery]: "bg-purple-100 text-purple-700",
      [DeliveryStatus.delivered]: "bg-green-100 text-green-700",
    };
    const labelMap: Record<DeliveryStatus, string> = {
      [DeliveryStatus.preparing]: "Preparing",
      [DeliveryStatus.ready]: "Ready",
      [DeliveryStatus.outForDelivery]: "Out for Delivery",
      [DeliveryStatus.delivered]: "Delivered",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorMap[status]}`}
      >
        {labelMap[status]}
      </span>
    );
  };

  const toggleSelectOrder = (id: bigint) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const OrdersTable = ({
    orderList,
    pendingStatusMap,
    pendingRiderMap,
    savingOrderSet,
    onSelectStatus,
    onSelectRider,
    onSaveOrder,
  }: {
    orderList: ExtendedOrder[];
    pendingStatusMap: Map<string, DeliveryStatus>;
    pendingRiderMap: Map<string, string>;
    savingOrderSet: Set<string>;
    onSelectStatus: (orderId: bigint, status: DeliveryStatus) => void;
    onSelectRider: (orderId: bigint, riderId: string) => void;
    onSaveOrder: (orderId: bigint) => void;
  }) => (
    <div className="overflow-x-auto">
      <Table data-ocid="delivery.table">
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-8">
              <Checkbox
                checked={
                  orderList.length > 0 &&
                  orderList.every((o) => selectedOrders.has(o.id))
                }
                onCheckedChange={() => {
                  const allSelected = orderList.every((o) =>
                    selectedOrders.has(o.id),
                  );
                  setSelectedOrders((prev) => {
                    const next = new Set(prev);
                    if (allSelected) {
                      for (const o of orderList) next.delete(o.id);
                    } else {
                      for (const o of orderList) next.add(o.id);
                    }
                    return next;
                  });
                }}
                data-ocid="delivery.checkbox"
              />
            </TableHead>
            <TableHead className="text-xs">Order ID</TableHead>
            <TableHead className="text-xs">Customer</TableHead>
            <TableHead className="text-xs hidden md:table-cell">
              Items
            </TableHead>
            <TableHead className="text-xs">Amount</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Rider</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">
              Notes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderList.map((order, idx) => {
            const idStr = String(order.id);
            const pendingStatusValue = pendingStatusMap.get(idStr);
            const currentStatus =
              pendingStatusValue ??
              order.deliveryStatus ??
              DeliveryStatus.preparing;
            const isSaving = savingOrderSet.has(idStr);
            const hasPendingChanges =
              pendingStatusMap.has(idStr) || pendingRiderMap.has(idStr);
            return (
              <TableRow
                key={String(order.id)}
                data-ocid={`delivery.item.${idx + 1}`}
                className={selectedOrders.has(order.id) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => toggleSelectOrder(order.id)}
                    data-ocid="delivery.checkbox"
                  />
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  #{Number(order.id)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {getUserName(order.user)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-40 truncate">
                  {order.items.map((it) => it.saladName).join(", ")}
                </TableCell>
                <TableCell className="text-sm font-semibold">
                  ₹{Number(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    {statusBadge(currentStatus)}
                    <Select
                      value={currentStatus}
                      onValueChange={(v) =>
                        onSelectStatus(order.id, v as DeliveryStatus)
                      }
                    >
                      <SelectTrigger
                        className="w-36 h-7 text-xs"
                        data-ocid="delivery.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DeliveryStatus.preparing}>
                          Preparing
                        </SelectItem>
                        <SelectItem value={DeliveryStatus.ready}>
                          Ready
                        </SelectItem>
                        <SelectItem value={DeliveryStatus.outForDelivery}>
                          Out for Delivery
                        </SelectItem>
                        <SelectItem value={DeliveryStatus.delivered}>
                          Delivered
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {hasPendingChanges && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isSaving}
                        onClick={() => onSaveOrder(order.id)}
                        data-ocid="delivery.save_button"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={
                      pendingRiderMap.get(idStr) ??
                      (order.assignedRiderId
                        ? String(order.assignedRiderId)
                        : "")
                    }
                    onValueChange={(v) => onSelectRider(order.id, v)}
                  >
                    <SelectTrigger
                      className="w-28 h-7 text-xs"
                      data-ocid="delivery.select"
                    >
                      <SelectValue placeholder="Assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {riders.map((r) => (
                        <SelectItem key={String(r.id)} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <DeliveryNoteCell
                    key={String(order.id)}
                    defaultValue={order.deliveryNotes ?? ""}
                    onSave={(notes) => handleSaveDeliveryNote(order.id, notes)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4" data-ocid="delivery.loading_state">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="delivery.section">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Deliveries</h2>
        </div>
        <button
          type="button"
          onClick={() => setGroupByLocation((v) => !v)}
          data-ocid="delivery.toggle"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            groupByLocation
              ? "bg-primary text-white border-primary"
              : "bg-white text-muted-foreground border-border hover:bg-muted/50"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Group by Area
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-slate-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-gray-700">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-amber-700">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out for Delivery</p>
              <p className="text-2xl font-bold text-purple-700">
                {outForDeliveryCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold text-green-700">
                {deliveredCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${totalCount})`],
            ["active", `Active (${activeCount})`],
            ["outForDelivery", `Out for Delivery (${outForDeliveryCount})`],
            ["delivered", `Delivered (${deliveredCount})`],
            ["unassigned", `Unassigned (${unassignedCount})`],
            ["assigned", `Assigned (${assignedCount})`],
          ] as const
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-ocid="delivery.tab"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedOrders.size > 0 && (
        <div
          className="sticky top-2 z-10 flex flex-wrap items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl shadow-sm"
          data-ocid="delivery.panel"
        >
          <span className="text-sm font-semibold text-primary">
            {selectedOrders.size} order{selectedOrders.size > 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
            <Select value={bulkRiderId} onValueChange={setBulkRiderId}>
              <SelectTrigger
                className="w-40 h-8 text-sm"
                data-ocid="delivery.select"
              >
                <SelectValue placeholder="Select rider" />
              </SelectTrigger>
              <SelectContent>
                {riders.map((r) => (
                  <SelectItem key={String(r.id)} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="bg-primary text-white"
              onClick={handleBulkAssign}
              disabled={!bulkRiderId || bulkAssigning}
              data-ocid="delivery.primary_button"
            >
              {bulkAssigning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Assign Rider
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedOrders(new Set())}
              data-ocid="delivery.cancel_button"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Orders
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {filteredOrders.length} records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="delivery.empty_state"
            >
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders found</p>
            </div>
          ) : groupByLocation ? (
            <div className="divide-y">
              {groupedOrders().map(({ area, orders: areaOrders }) => (
                <GroupSection key={area} title={area} count={areaOrders.length}>
                  <OrdersTable
                    orderList={areaOrders}
                    pendingStatusMap={pendingStatus}
                    pendingRiderMap={pendingRider}
                    savingOrderSet={savingOrder}
                    onSelectStatus={handleSelectStatus}
                    onSelectRider={handleSelectRider}
                    onSaveOrder={handleSaveOrderUpdate}
                  />
                </GroupSection>
              ))}
            </div>
          ) : (
            <OrdersTable
              orderList={filteredOrders}
              pendingStatusMap={pendingStatus}
              pendingRiderMap={pendingRider}
              savingOrderSet={savingOrder}
              onSelectStatus={handleSelectStatus}
              onSelectRider={handleSelectRider}
              onSaveOrder={handleSaveOrderUpdate}
            />
          )}
        </CardContent>
      </Card>

      {/* Rider Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Riders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Rider Form */}
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="Rider name"
                value={newRider.name}
                onChange={(e) =>
                  setNewRider((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="rider.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile</Label>
              <Input
                placeholder="Mobile"
                value={newRider.mobile}
                onChange={(e) =>
                  setNewRider((p) => ({ ...p, mobile: e.target.value }))
                }
                data-ocid="rider.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Area / Gym</Label>
              <Input
                placeholder="Assigned area"
                value={newRider.area}
                onChange={(e) =>
                  setNewRider((p) => ({ ...p, area: e.target.value }))
                }
                data-ocid="rider.input"
              />
            </div>
            <Button
              size="sm"
              className="bg-primary text-white"
              onClick={handleAddRider}
              disabled={addingRider || !newRider.name}
              data-ocid="rider.primary_button"
            >
              {addingRider ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Rider"
              )}
            </Button>
          </div>

          {/* Riders Table */}
          {riders.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="rider.empty_state"
            >
              <p className="text-sm">No riders added yet</p>
            </div>
          ) : (
            <Table data-ocid="rider.table">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Mobile</TableHead>
                  <TableHead className="text-xs">Area</TableHead>
                  <TableHead className="text-xs">Workload</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riders.map((r, idx) => (
                  <TableRow
                    key={String(r.id)}
                    data-ocid={`rider.row.${idx + 1}`}
                  >
                    {editRiderId === r.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editRider.name}
                            onChange={(e) =>
                              setEditRider((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="h-7 text-sm"
                            data-ocid="rider.input"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editRider.mobile}
                            onChange={(e) =>
                              setEditRider((p) => ({
                                ...p,
                                mobile: e.target.value,
                              }))
                            }
                            className="h-7 text-sm"
                            data-ocid="rider.input"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editRider.area}
                            onChange={(e) =>
                              setEditRider((p) => ({
                                ...p,
                                area: e.target.value,
                              }))
                            }
                            className="h-7 text-sm"
                            data-ocid="rider.input"
                          />
                        </TableCell>
                        <TableCell />
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-primary text-white text-xs"
                              onClick={() => handleSaveRider(r.id)}
                              data-ocid="rider.save_button"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditRiderId(null)}
                              data-ocid="rider.cancel_button"
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-sm font-medium">
                          {r.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.mobile}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.area}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const wl = riderWorkload.get(String(r.id)) ?? 0;
                            return (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  wl > 0
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {wl > 0 ? `${wl} active` : "idle"}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                              onClick={() => startEditRider(r)}
                              data-ocid={`rider.edit_button.${idx + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => handleDeleteRider(r.id)}
                              data-ocid={`rider.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GroupSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
        data-ocid="delivery.toggle"
      >
        <MapPin className="w-3.5 h-3.5 text-primary" />
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {count} order{count !== 1 ? "s" : ""}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && children}
    </div>
  );
}

function DeliveryNoteCell({
  defaultValue,
  onSave,
}: {
  defaultValue: string;
  onSave: (notes: string) => void;
}) {
  const [note, setNote] = useState(defaultValue);
  return (
    <div className="flex gap-1 items-start">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notes..."
        className="text-xs h-8 min-h-0 resize-none py-1"
        data-ocid="delivery.textarea"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs shrink-0"
        onClick={() => onSave(note)}
        data-ocid="delivery.save_note_button"
      >
        Save
      </Button>
    </div>
  );
}

// ─── Reviews Tab ─────────────────────────────────────────────────────────────
function ReviewsTab() {
  const { actor } = useActor();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  async function loadReviews() {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getAllReviews();
      const sorted = [...data].sort((a, b) => Number(b.date) - Number(a.date));
      setReviews(sorted);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadReviews is intentionally excluded
  useEffect(() => {
    loadReviews();
  }, [actor]);

  async function handleUpdateStatus(id: string, status: ReviewStatus) {
    if (!actor) return;
    try {
      await actor.updateReviewStatus(id, status);
      toast.success("Review updated");
      loadReviews();
    } catch {
      toast.error("Failed to update review");
    }
  }

  async function handleDelete(id: string) {
    if (!actor) return;
    try {
      await actor.deleteReview(id);
      toast.success("Review deleted");
      loadReviews();
    } catch {
      toast.error("Failed to delete review");
    }
  }

  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    if (filter === "pending")
      return reviews.filter((r) => r.status === ReviewStatus.pending);
    if (filter === "approved")
      return reviews.filter((r) => r.status === ReviewStatus.approved);
    if (filter === "rejected")
      return reviews.filter((r) => r.status === ReviewStatus.rejected);
    return reviews;
  }, [reviews, filter]);

  function getStatusLabel(status: ReviewStatus) {
    if (status === ReviewStatus.pending) return "Pending";
    if (status === ReviewStatus.approved) return "Approved";
    if (status === ReviewStatus.rejected) return "Rejected";
    return "Unknown";
  }

  function getStatusBadgeClass(status: ReviewStatus) {
    if (status === ReviewStatus.pending) return "bg-yellow-100 text-yellow-800";
    if (status === ReviewStatus.approved) return "bg-green-100 text-green-800";
    if (status === ReviewStatus.rejected) return "bg-red-100 text-red-800";
    return "";
  }

  function renderStars(rating: bigint) {
    const n = Number(rating);
    return (
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i <= n ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </span>
    );
  }

  const counts = useMemo(
    () => ({
      pending: reviews.filter((r) => r.status === ReviewStatus.pending).length,
      approved: reviews.filter((r) => r.status === ReviewStatus.approved)
        .length,
      rejected: reviews.filter((r) => r.status === ReviewStatus.rejected)
        .length,
    }),
    [reviews],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadReviews}
          disabled={loading}
          data-ocid="reviews.secondary_button"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            data-ocid={`reviews.${f}.tab`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1 text-xs opacity-75">
                ({counts[f as keyof typeof counts]})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3" data-ocid="reviews.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          className="text-center py-12 text-gray-500"
          data-ocid="reviews.empty_state"
        >
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review, idx) => (
            <Card
              key={review.id}
              className="rounded-xl shadow-sm"
              data-ocid={`reviews.item.${idx + 1}`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {review.userName || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">
                        {new Date(
                          Number(review.date) / 1_000_000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClass(review.status)}`}
                  >
                    {getStatusLabel(review.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{review.comment}</p>
                <div className="flex gap-2 pt-1">
                  {review.status !== ReviewStatus.approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-200 hover:bg-green-50 text-xs h-7"
                      onClick={() =>
                        handleUpdateStatus(review.id, ReviewStatus.approved)
                      }
                      data-ocid="reviews.confirm_button"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  )}
                  {review.status !== ReviewStatus.rejected && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-700 border-orange-200 hover:bg-orange-50 text-xs h-7"
                      onClick={() =>
                        handleUpdateStatus(review.id, ReviewStatus.rejected)
                      }
                      data-ocid="reviews.cancel_button"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-200 hover:bg-red-50 text-xs h-7"
                    onClick={() => handleDelete(review.id)}
                    data-ocid="reviews.delete_button"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────
function LeadsTab() {
  const { actor } = useActor();
  const [leads, setLeads] = useState<
    Array<{
      id: bigint;
      name: string;
      mobile: string;
      date: bigint;
      status: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [mobileSearch, setMobileSearch] = useState("");
  const [updating, setUpdating] = useState<bigint | null>(null);

  async function loadLeads() {
    if (!actor) return;
    try {
      const data = await actor.getLeads();
      setLeads(
        data as Array<{
          id: bigint;
          name: string;
          mobile: string;
          date: bigint;
          status: string;
        }>,
      );
    } catch (_e) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadLeads is intentionally excluded
  useEffect(() => {
    loadLeads();
  }, [actor]);

  const filteredLeads = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return leads.filter((lead) => {
      const dateMs = Number(lead.date) / 1_000_000;
      if (filter === "today" && dateMs < todayStart.getTime()) return false;
      if (filter === "week" && dateMs < weekStart.getTime()) return false;
      if (mobileSearch && !lead.mobile.includes(mobileSearch)) return false;
      return true;
    });
  }, [leads, filter, mobileSearch]);

  async function handleStatusUpdate(id: bigint, newStatus: string) {
    if (!actor) return;
    setUpdating(id);
    try {
      await actor.updateLeadStatus(id, newStatus as LeadStatus);
      await loadLeads();
      toast.success("Lead status updated");
    } catch (_e) {
      toast.error("Failed to update lead");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" />
            Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by mobile..."
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                className="pl-9"
                data-ocid="leads.search_input"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "today", "week"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  data-ocid="leads.filter.toggle"
                >
                  {f === "all" ? "All" : f === "today" ? "Today" : "This Week"}
                </Button>
              ))}
            </div>
          </div>

          {/* Leads list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-24 w-full rounded-xl"
                  data-ocid="leads.loading_state"
                />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="leads.empty_state"
            >
              <PhoneCall className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No leads found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead, idx) => {
                const dateMs = Number(lead.date) / 1_000_000;
                const statusLabel =
                  lead.status === "new_"
                    ? "New"
                    : lead.status === "contacted"
                      ? "Contacted"
                      : "Converted";
                const statusColor =
                  lead.status === "new_"
                    ? "bg-blue-100 text-blue-700"
                    : lead.status === "contacted"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700";

                return (
                  <div
                    key={String(lead.id)}
                    className="border rounded-xl p-4 bg-white space-y-3"
                    data-ocid={String(idx + 1)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.mobile}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(dateMs).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={[
                          "text-xs font-medium px-2 py-1 rounded-full",
                          statusColor,
                        ].join(" ")}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`https://wa.me/91${lead.mobile}?text=Hi%2C%20thanks%20for%20trying%20Salad%20Khatora%21%20Get%2010%25%20off%20on%20your%20subscription.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-ocid="leads.whatsapp.button"
                      >
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          📱 Contact on WhatsApp
                        </Button>
                      </a>
                      {lead.status === "new_" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                          disabled={updating === lead.id}
                          onClick={() =>
                            handleStatusUpdate(lead.id, "contacted")
                          }
                          data-ocid="leads.contacted.button"
                        >
                          {updating === lead.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Mark as Contacted"
                          )}
                        </Button>
                      )}
                      {lead.status !== "converted" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={updating === lead.id}
                          onClick={() =>
                            handleStatusUpdate(lead.id, "converted")
                          }
                          data-ocid="leads.converted.button"
                        >
                          {updating === lead.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Mark as Converted"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { actor, isFetching } = useActor();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .isCallerAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, [actor, isFetching]);

  if (isInitializing || isFetching || isAdmin === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main
          className="flex-1 flex flex-col items-center justify-center gap-4 px-4"
          data-ocid="admin.error_state"
        >
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground text-center max-w-sm">
            You don't have admin privileges to view this page.
          </p>
          <Button
            variant="outline"
            className="rounded-full border-primary text-primary"
            onClick={() => navigate({ to: "/" })}
            data-ocid="admin.button"
          >
            Go Back Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage orders, users, subscriptions and inventory
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          data-ocid="admin.tab"
        >
          <TabsList className="w-full justify-start mb-6 bg-muted/60 rounded-xl p-1 h-auto flex-wrap gap-1">
            <TabsTrigger
              value="analytics"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.analytics.tab"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.orders.tab"
            >
              <Package className="w-4 h-4 mr-1.5" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.users.tab"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.subs.tab"
            >
              Subscriptions
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.inventory.tab"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.menu.tab"
            >
              <Utensils className="w-4 h-4 mr-1.5" />
              Menu
            </TabsTrigger>
            <TabsTrigger
              value="offers"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.offers.tab"
            >
              <Tag className="w-4 h-4 mr-1.5" />
              Offers
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.delivery.tab"
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Delivery
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.leads.tab"
            >
              <PhoneCall className="w-4 h-4 mr-1.5" />
              Leads
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
              data-ocid="admin.reviews.tab"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            {activeTab === "analytics" && <AnalyticsTab />}
          </TabsContent>
          <TabsContent value="orders">
            {activeTab === "orders" && <OrdersTab />}
          </TabsContent>
          <TabsContent value="users">
            {activeTab === "users" && <UsersTab />}
          </TabsContent>
          <TabsContent value="subscriptions">
            {activeTab === "subscriptions" && <SubscriptionsTab />}
          </TabsContent>
          <TabsContent value="inventory">
            {activeTab === "inventory" && <InventoryTab />}
          </TabsContent>
          <TabsContent value="menu">
            {activeTab === "menu" && <MenuManagementTab />}
          </TabsContent>
          <TabsContent value="offers">
            {activeTab === "offers" && <OffersTab />}
          </TabsContent>
          <TabsContent value="delivery">
            {activeTab === "delivery" && <DeliveryTab />}
          </TabsContent>
          <TabsContent value="leads">
            {activeTab === "leads" && <LeadsTab />}
          </TabsContent>
          <TabsContent value="reviews">
            {activeTab === "reviews" && <ReviewsTab />}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

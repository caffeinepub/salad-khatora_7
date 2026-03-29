import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { useActor } from "../hooks/useActor";
import { useSaveProfile, useUserProfile } from "../hooks/useQueries";

type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese" | null;

function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

const categoryConfig: Record<
  NonNullable<BmiCategory>,
  { color: string; bg: string; bar: string; emoji: string }
> = {
  Underweight: {
    color: "text-blue-700",
    bg: "bg-blue-100",
    bar: "bg-blue-400",
    emoji: "💙",
  },
  Normal: {
    color: "text-green-700",
    bg: "bg-green-100",
    bar: "bg-green-500",
    emoji: "💚",
  },
  Overweight: {
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    bar: "bg-yellow-400",
    emoji: "💛",
  },
  Obese: {
    color: "text-red-700",
    bg: "bg-red-100",
    bar: "bg-red-500",
    emoji: "❤️",
  },
};

function bmiToPercent(bmi: number): number {
  return Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));
}

interface LocalForm {
  name: string;
  mobile: string;
  email: string;
  address: string;
  height: string;
  weight: string;
  age: string;
  dietaryPreferences: string;
  dietaryRestrictions: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const saveProfile = useSaveProfile();
  const { actor } = useActor();

  const [form, setForm] = useState<LocalForm>({
    name: "",
    mobile: "",
    email: "",
    address: "",
    height: "",
    weight: "",
    age: "",
    dietaryPreferences: "Vegetarian",
    dietaryRestrictions: "",
  });

  // Admin claim state: null=loading, true=claimed, false=not claimed
  const [adminClaimed, setAdminClaimed] = useState<boolean | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Populate form from backend data
  useEffect(() => {
    if (profileData) {
      setForm({
        name: profileData.name,
        mobile: profileData.mobile,
        email: profileData.email,
        address: profileData.address,
        height: String(Number(profileData.heightCm)),
        weight: String(Number(profileData.weightKg)),
        age: String(Number(profileData.age)),
        dietaryPreferences:
          profileData.dietaryPreferences.join(", ") || "Vegetarian",
        dietaryRestrictions: profileData.dietaryRestrictions.join(", "),
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  // Check if admin has been claimed
  useEffect(() => {
    if (!actor) return;
    actor
      .hasAdminBeenClaimed()
      .then((claimed: boolean) => {
        setAdminClaimed(claimed);
      })
      .catch(() => {
        setAdminClaimed(true); // safe fallback
      });
  }, [actor]);

  const handleClaimAdmin = async () => {
    if (!actor) return;
    setIsClaiming(true);
    try {
      await actor.claimFirstAdminRole();
      setAdminClaimed(true);
      toast.success("You are now admin! Redirecting to admin panel...");
      setTimeout(() => {
        navigate({ to: "/admin" });
      }, 1500);
    } catch {
      toast.error("Admin role has already been claimed by another user.");
      setAdminClaimed(true);
    } finally {
      setIsClaiming(false);
    }
  };

  const height = Number.parseFloat(form.height);
  const weight = Number.parseFloat(form.weight);
  const bmi =
    height > 0 && weight > 0
      ? Number.parseFloat((weight / (height / 100) ** 2).toFixed(1))
      : null;
  const category = bmi !== null ? getBmiCategory(bmi) : null;
  const catConfig = category ? categoryConfig[category] : null;
  const barPercent = bmi !== null ? bmiToPercent(bmi) : 0;

  const set =
    (field: keyof LocalForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Auto-save on blur
  const handleBlurSave = async () => {
    if (!isAuthenticated) return;
    try {
      await saveProfile.mutateAsync({
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        address: form.address,
        heightCm: BigInt(Math.round(Number(form.height) || 0)),
        weightKg: BigInt(Math.round(Number(form.weight) || 0)),
        age: BigInt(Math.round(Number(form.age) || 0)),
        dietaryPreferences: form.dietaryPreferences
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        dietaryRestrictions: form.dietaryRestrictions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("Profile saved ✓", { duration: 1500 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Strip ICP canister boilerplate to show the meaningful part
      const clean = msg
        .replace(/.*trapped explicitly:\s*/i, "")
        .replace(/.*Error:\s*/i, "")
        .trim();
      toast.error(clean || "Failed to save profile");
    }
  };

  const handleManualSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      return;
    }
    await handleBlurSave();
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-8 w-full space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto px-4 py-8 w-full">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
            {form.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {form.name || "Your Profile"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Changes auto-save on field blur
            </p>
          </div>
        </motion.div>

        {/* BMI Card */}
        {bmi !== null && catConfig && category && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6"
            data-ocid="profile.card"
          >
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="green-gradient px-5 pt-5 pb-4">
                <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">
                  BMI Calculator
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-white text-5xl font-bold">{bmi}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${catConfig.bg} ${catConfig.color}`}
                    data-ocid="profile.panel"
                  >
                    {catConfig.emoji} {category}
                  </span>
                </div>
              </div>
              <CardContent className="px-5 pt-4 pb-5">
                <div className="relative mb-1">
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${catConfig.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPercent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>10</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-4">
                  {(
                    ["Underweight", "Normal", "Overweight", "Obese"] as const
                  ).map((cat) => (
                    <div
                      key={cat}
                      className={`rounded-lg py-1.5 text-center text-[10px] font-semibold transition-all ${
                        category === cat
                          ? `${categoryConfig[cat].bg} ${categoryConfig[cat].color} ring-2 ring-offset-1 ring-current`
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={set("name")}
                  onBlur={handleBlurSave}
                  placeholder="Enter your name"
                  className="rounded-xl"
                  data-ocid="profile.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={set("mobile")}
                  onBlur={handleBlurSave}
                  placeholder="10-digit mobile number"
                  className="rounded-xl"
                  data-ocid="profile.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  onBlur={handleBlurSave}
                  placeholder="your@email.com"
                  className="rounded-xl"
                  data-ocid="profile.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={set("address")}
                  onBlur={handleBlurSave}
                  placeholder="Your delivery address"
                  className="rounded-xl resize-none"
                  rows={3}
                  data-ocid="profile.textarea"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={set("age")}
                  onBlur={handleBlurSave}
                  placeholder="Your age"
                  className="rounded-xl"
                  data-ocid="profile.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={50}
                    max={250}
                    value={form.height}
                    onChange={set("height")}
                    onBlur={handleBlurSave}
                    placeholder="e.g. 170"
                    className="rounded-xl"
                    data-ocid="profile.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min={10}
                    max={300}
                    value={form.weight}
                    onChange={set("weight")}
                    onBlur={handleBlurSave}
                    placeholder="e.g. 65"
                    className="rounded-xl"
                    data-ocid="profile.input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dietary Section */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Dietary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Dietary Preference</Label>
                <Select
                  value={form.dietaryPreferences}
                  onValueChange={(val) => {
                    setForm((prev) => ({ ...prev, dietaryPreferences: val }));
                  }}
                >
                  <SelectTrigger
                    className="rounded-xl"
                    data-ocid="profile.select"
                  >
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegetarian">🥦 Vegetarian</SelectItem>
                    <SelectItem value="Vegan">🌱 Vegan</SelectItem>
                    <SelectItem value="Non-Vegetarian">
                      🍗 Non-Vegetarian
                    </SelectItem>
                    <SelectItem value="Eggetarian">🥚 Eggetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restrictions">Dietary Restrictions</Label>
                <Textarea
                  id="restrictions"
                  value={form.dietaryRestrictions}
                  onChange={set("dietaryRestrictions")}
                  onBlur={handleBlurSave}
                  placeholder="e.g. No nuts, No gluten, No dairy"
                  className="rounded-xl resize-none"
                  rows={3}
                  data-ocid="profile.textarea"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          className="mt-6 mb-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            onClick={handleManualSave}
            className="w-full rounded-full bg-primary text-white hover:bg-primary/90 h-12 text-base font-semibold shadow-md"
            disabled={saveProfile.isPending}
            data-ocid="profile.save_button"
          >
            {saveProfile.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Profile"
            )}
          </Button>
        </motion.div>

        {/* First-Time Admin Setup */}
        {isAuthenticated && adminClaimed === false && (
          <motion.div
            className="mt-4 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            data-ocid="admin.panel"
          >
            <Card className="border border-amber-200 bg-amber-50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  First-Time Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-amber-700">
                  No admin has been set up yet. You can claim admin access for
                  this app. <strong>This can only be done once.</strong>
                </p>
                <Button
                  onClick={handleClaimAdmin}
                  disabled={isClaiming}
                  className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white h-11 text-sm font-semibold shadow-md"
                  data-ocid="admin.primary_button"
                >
                  {isClaiming ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Claiming...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Make Me Admin
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { useRegisterUser } from "../hooks/useQueries";

interface RegForm {
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

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const registerUser = useRegisterUser();

  const [form, setForm] = useState<RegForm>({
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

  const set =
    (field: keyof RegForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate({ to: "/login" });
      return;
    }

    try {
      await registerUser.mutateAsync({
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        address: form.address,
        heightCm: BigInt(form.height || 0),
        weightKg: BigInt(form.weight || 0),
        age: BigInt(form.age || 0),
        dietaryPreferences: form.dietaryPreferences
          ? form.dietaryPreferences
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        dietaryRestrictions: form.dietaryRestrictions
          ? form.dietaryRestrictions
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      });
      toast.success("Profile created! Welcome to Salad Khatora 🥗");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const clean = msg
        .replace(/.*trapped explicitly:\s*/i, "")
        .replace(/.*Error:\s*/i, "")
        .trim();
      toast.error(clean || "Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4 py-12 font-poppins">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="font-bold text-xl text-foreground">
              Salad <span className="text-primary">Khatora</span>
            </span>
          </Link>
          <p className="text-muted-foreground text-sm mt-1">
            Complete your profile to get started
          </p>
        </div>

        <div
          className="bg-white rounded-2xl shadow-card p-6"
          data-ocid="register.panel"
        >
          <h1 className="text-xl font-bold text-foreground mb-4">
            Create Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full Name *</Label>
                <Input
                  id="reg-name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your full name"
                  required
                  className="rounded-xl"
                  data-ocid="register.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-mobile">Mobile Number *</Label>
                <Input
                  id="reg-mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={set("mobile")}
                  placeholder="+91 99999 99999"
                  required
                  className="rounded-xl"
                  data-ocid="register.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className="rounded-xl"
                data-ocid="register.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-address">Delivery Address</Label>
              <Textarea
                id="reg-address"
                value={form.address}
                onChange={set("address")}
                placeholder="Your full delivery address"
                className="rounded-xl resize-none"
                rows={2}
                data-ocid="register.textarea"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-age">Age</Label>
                <Input
                  id="reg-age"
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={set("age")}
                  placeholder="25"
                  className="rounded-xl"
                  data-ocid="register.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-height">Height (cm)</Label>
                <Input
                  id="reg-height"
                  type="number"
                  min={50}
                  max={250}
                  value={form.height}
                  onChange={set("height")}
                  placeholder="170"
                  className="rounded-xl"
                  data-ocid="register.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-weight">Weight (kg)</Label>
                <Input
                  id="reg-weight"
                  type="number"
                  min={10}
                  max={300}
                  value={form.weight}
                  onChange={set("weight")}
                  placeholder="65"
                  className="rounded-xl"
                  data-ocid="register.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dietary Preference</Label>
              <Select
                value={form.dietaryPreferences}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, dietaryPreferences: val }))
                }
              >
                <SelectTrigger
                  className="rounded-xl"
                  data-ocid="register.select"
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
              <Label htmlFor="reg-restrictions">Dietary Restrictions</Label>
              <Input
                id="reg-restrictions"
                value={form.dietaryRestrictions}
                onChange={set("dietaryRestrictions")}
                placeholder="e.g. No nuts, No gluten (comma separated)"
                className="rounded-xl"
                data-ocid="register.input"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-primary text-white hover:bg-primary/90 h-12 font-semibold text-base"
              disabled={registerUser.isPending}
              data-ocid="register.submit_button"
            >
              {registerUser.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating profile...
                </span>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

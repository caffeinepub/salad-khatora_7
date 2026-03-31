import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { useActor } from "@/hooks/useActor";
import { Flame, Leaf, ShoppingCart, Sprout, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Ingredient, MenuItem } from "../backend";

type FilterGoal = "all" | "weight-loss" | "high-protein" | "detox";
type SortOption = "default" | "calories-asc" | "protein-desc" | "price-asc";

const FILTER_OPTIONS: {
  value: FilterGoal;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "all",
    label: "All",
    icon: <Leaf className="w-3.5 h-3.5" />,
    color: "",
  },
  {
    value: "weight-loss",
    label: "Weight Loss",
    icon: <Flame className="w-3.5 h-3.5" />,
    color: "",
  },
  {
    value: "high-protein",
    label: "High Protein",
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "",
  },
  {
    value: "detox",
    label: "Detox",
    icon: <Sprout className="w-3.5 h-3.5" />,
    color: "",
  },
];

const TAG_LABELS: Record<string, string> = {
  "weight-loss": "Weight Loss",
  "high-protein": "High Protein",
  detox: "Detox",
};

const TAG_COLORS: Record<string, string> = {
  "weight-loss": "bg-orange-100 text-orange-700 border-orange-200",
  "high-protein": "bg-blue-100 text-blue-700 border-blue-200",
  detox: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface LinkedIngredient {
  ingredientId: bigint;
  quantityGrams: bigint;
}

function checkIsOutOfStock(item: MenuItem, ingredients: Ingredient[]): boolean {
  const linked: LinkedIngredient[] = (item as any).linkedIngredients ?? [];
  if (linked.length === 0) return false;
  return linked.some((link) => {
    const ingredient = ingredients.find((ing) => ing.id === link.ingredientId);
    if (!ingredient) return false;
    return ingredient.quantityInStock <= ingredient.lowStockThreshold;
  });
}

export default function Menu() {
  const { addToCart } = useCart();
  const { actor, isFetching } = useActor();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterGoal>("all");
  const [sortOption, setSortOption] = useState<SortOption>("default");

  useEffect(() => {
    if (!actor || isFetching) return;

    const fetchMenu = actor
      .getAllMenuItems()
      .then((items) => setMenuItems(items.filter((item) => item.enabled)))
      .catch(() => toast.error("Failed to load menu"));

    const fetchIngredients = actor
      .getAllIngredients()
      .then((ings) => setAllIngredients(ings))
      .catch(() => setAllIngredients([]));

    Promise.all([fetchMenu, fetchIngredients]).finally(() => setLoading(false));
  }, [actor, isFetching]);

  const filteredAndSorted = useMemo(() => {
    let result = [...menuItems];
    if (activeFilter !== "all") {
      result = result.filter((item) =>
        (item.tags ?? []).includes(activeFilter),
      );
    }
    switch (sortOption) {
      case "calories-asc":
        result.sort((a, b) => Number(a.calories) - Number(b.calories));
        break;
      case "protein-desc":
        result.sort((a, b) => Number(b.protein) - Number(a.protein));
        break;
      case "price-asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
    }
    return result;
  }, [menuItems, activeFilter, sortOption]);

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: Number(item.id),
      name: item.name,
      price: Number(item.price),
      image: "",
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div className="min-h-screen flex flex-col font-poppins">
      <Navbar />
      <main className="flex-1">
        <section className="bg-accent py-12 md:py-16" data-ocid="menu.section">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
                Our Signature Salads
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
                Crafted fresh daily with locally sourced ingredients
              </p>
            </motion.div>
          </div>
        </section>

        <section
          className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm"
          data-ocid="menu.section"
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap" data-ocid="menu.tab">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setActiveFilter(opt.value)}
                    data-ocid={`menu.${opt.value === "all" ? "tab" : `${opt.value}.tab`}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      activeFilter === opt.value
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
              <Select
                value={sortOption}
                onValueChange={(v) => setSortOption(v as SortOption)}
              >
                <SelectTrigger
                  className="w-full sm:w-48 text-sm"
                  data-ocid="menu.select"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="calories-asc">
                    Low Calories First
                  </SelectItem>
                  <SelectItem value="protein-desc">
                    High Protein First
                  </SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-white" data-ocid="menu.section">
          <div className="max-w-6xl mx-auto px-4">
            {loading ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
                data-ocid="menu.loading_state"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <Skeleton className="w-full h-36 md:h-48" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-8 w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-24 text-center"
                data-ocid="menu.empty_state"
              >
                <Leaf className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">
                  {activeFilter === "all"
                    ? "No items available"
                    : "No salads match this filter"}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {activeFilter === "all"
                    ? "Check back soon — fresh salads are on the way!"
                    : "Try a different goal or check back later!"}
                </p>
                {activeFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="mt-4 text-sm text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Show all salads
                  </button>
                )}
              </div>
            ) : (
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
                data-ocid="menu.list"
              >
                {filteredAndSorted.map((item, i) => {
                  const outOfStock = checkIsOutOfStock(item, allIngredients);
                  return (
                    <motion.div
                      key={item.id.toString()}
                      className={`bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow group${outOfStock ? " opacity-60" : ""}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: outOfStock ? 0.6 : 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      data-ocid={`menu.item.${i + 1}`}
                    >
                      <div className="bg-accent/50 flex items-center justify-center h-36 md:h-48 relative">
                        {(item as any).imageUrl ? (
                          <img
                            src={(item as any).imageUrl}
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <span className="text-4xl select-none">🥗</span>
                        )}
                        {(item.tags ?? []).length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {(item.tags ?? []).map((tag) => (
                              <span
                                key={tag}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                  TAG_COLORS[tag] ??
                                  "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {TAG_LABELS[tag] ?? tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {outOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Badge
                              variant="destructive"
                              className="text-xs font-bold px-3 py-1 shadow-lg"
                            >
                              Out of Stock
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-foreground text-sm md:text-base mb-1">
                          {item.name}
                        </h3>
                        {item.ingredients.length > 0 && (
                          <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                            {item.ingredients.join(", ")}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                          {Number(item.calories) > 0 && (
                            <span>{item.calories.toString()} kcal</span>
                          )}
                          {Number(item.protein) > 0 && (
                            <span>{item.protein.toString()}g protein</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary text-base md:text-lg">
                            ₹{item.price.toString()}
                          </span>
                          <Button
                            size="sm"
                            className="rounded-full bg-primary text-white text-xs hover:bg-primary/90 gap-1"
                            onClick={() => !outOfStock && handleAddToCart(item)}
                            disabled={outOfStock}
                            data-ocid={`menu.button.${i + 1}`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {outOfStock ? (
                              <span>Unavailable</span>
                            ) : (
                              <>
                                <span className="hidden sm:inline">
                                  Add to Cart
                                </span>
                                <span className="sm:hidden">Add</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

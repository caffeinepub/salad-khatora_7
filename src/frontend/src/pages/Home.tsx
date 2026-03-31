import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ReviewForm from "@/components/ReviewForm";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const PLACEHOLDER = "/assets/generated/menu-placeholder.dim_400x300.jpg";

function getImageSrc(imageUrl: unknown): string {
  if (typeof imageUrl === "string" && imageUrl.trim() !== "") return imageUrl;
  return PLACEHOLDER;
}

const steps = [
  {
    emoji: "🥗",
    number: "01",
    title: "Try",
    description:
      "Pick from our curated menu of fresh, chef-crafted salads. No commitment needed.",
  },
  {
    emoji: "📋",
    number: "02",
    title: "Subscribe",
    description:
      "Choose a weekly or monthly plan that fits your fitness goals and budget.",
  },
  {
    emoji: "💪",
    number: "03",
    title: "Transform",
    description:
      "Track your progress, feel the difference, and achieve real fitness results.",
  },
];

const benefits = [
  {
    icon: "🥗",
    title: "Supports Weight Loss",
    description:
      "Low-calorie, high-fiber bowls that keep you full and help you shed those extra kilos naturally.",
  },
  {
    icon: "💪",
    title: "High Protein",
    description:
      "Every bowl is loaded with plant and lean animal proteins to fuel your workouts and recovery.",
  },
  {
    icon: "🌿",
    title: "100% Fresh Ingredients",
    description:
      "We source locally grown, seasonal produce daily — no preservatives, no shortcuts.",
  },
];

export default function Home() {
  const { actor, isFetching } = useActor();
  const [heroError, setHeroError] = useState(false);

  const { data: featuredItems = [] } = useQuery({
    queryKey: ["featuredMenuItems"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const items = await actor.getAllMenuItems();
        return items.filter((i) => i.enabled).slice(0, 3);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen flex flex-col font-poppins">
      <Navbar />

      {/* Hero Section */}
      <section
        className="hero-gradient relative overflow-hidden"
        data-ocid="home.section"
      >
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-white/20">
                🌿 Healthy Eating, Simplified
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                Fresh Salads.
                <br />
                <span className="text-green-300">Real Results.</span>
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                Healthy meals for weight loss and fitness — crafted fresh,
                delivered fast.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/menu">
                  <Button
                    size="lg"
                    className="rounded-full bg-primary text-white hover:bg-primary/90 px-8 font-semibold shadow-lg"
                    data-ocid="home.primary_button"
                  >
                    Order Now <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white text-white bg-white/10 hover:bg-white/20 px-8 font-semibold"
                  data-ocid="home.secondary_button"
                >
                  View Plans
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            className="flex-1 flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                {!heroError ? (
                  <img
                    src="/assets/generated/hero-salad-bowl.dim_600x600.png"
                    alt="Fresh salad bowl"
                    className="w-full h-full object-cover object-center"
                    onError={() => setHeroError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                    <span className="text-8xl">🥗</span>
                  </div>
                )}
              </div>
              {/* Floating stats */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-card">
                <p className="text-xs text-muted-foreground font-medium">
                  Calories
                </p>
                <p className="text-lg font-bold text-primary">~350 kcal</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-card">
                <p className="text-xs text-muted-foreground font-medium">
                  Protein
                </p>
                <p className="text-lg font-bold text-primary">25g+</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white" data-ocid="home.section">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three simple steps to a healthier you
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-card-hover transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                data-ocid={`home.item.${i + 1}`}
              >
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-2xl mb-4">
                  {step.emoji}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary bg-accent px-2 py-0.5 rounded-full">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-accent" data-ocid="home.section">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Why Salad Khatora?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We&apos;re not just food — we&apos;re your health partner
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                className="bg-white rounded-2xl p-6 shadow-card flex flex-col gap-3"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                data-ocid={`home.item.${i + 1}`}
              >
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-2xl">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-1">
                    {b.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {b.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-primary text-sm font-medium mt-auto">
                  <CheckCircle className="w-4 h-4" />
                  Verified by nutritionists
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Salads */}
      {featuredItems.length > 0 && (
        <section className="py-16 md:py-20 bg-white" data-ocid="home.section">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Our Bestsellers
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Fresh, flavour-packed bowls loved by our customers
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((item, i) => (
                <motion.div
                  key={item.id.toString()}
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  data-ocid={`home.featured.item.${i + 1}`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-gray-100">
                    <img
                      src={getImageSrc((item as any).imageUrl)}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src !== window.location.origin + PLACEHOLDER) {
                          img.src = PLACEHOLDER;
                        }
                      }}
                    />
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-bold text-foreground text-base mb-1">
                      {item.name}
                    </h3>
                    <p className="text-primary font-semibold text-sm mb-3">
                      from ₹
                      {(item as any).sizes.length > 0
                        ? Math.min(
                            ...(item as any).sizes.map((s) => Number(s.price)),
                          ).toString()
                        : item.price.toString()}
                    </p>
                    <Link to="/menu">
                      <Button
                        size="sm"
                        className="w-full rounded-full bg-primary text-white text-xs hover:bg-primary/90 gap-1"
                        data-ocid={`home.featured.button.${i + 1}`}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Order Now
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/menu">
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-accent px-8"
                  data-ocid="home.menu.link"
                >
                  View Full Menu <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews Carousel */}
      <ReviewsCarousel />

      {/* Share Your Experience / Reviews */}
      <section className="py-16 md:py-20 bg-white" data-ocid="home.section">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Share Your Experience
            </h2>
            <p className="text-muted-foreground">
              We&apos;d love to hear from you
            </p>
          </motion.div>
          <ReviewForm />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 green-gradient" data-ocid="home.section">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-white/80 mb-8">
              Join 10,000+ fitness enthusiasts eating smarter every day.
            </p>
            <Link to="/menu">
              <Button
                size="lg"
                className="rounded-full bg-white text-primary hover:bg-white/90 px-10 font-semibold shadow-lg"
                data-ocid="home.primary_button"
              >
                Explore Our Menu
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

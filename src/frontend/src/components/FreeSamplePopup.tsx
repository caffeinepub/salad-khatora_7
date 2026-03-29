import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "salad_khatora_sample_dismissed";
const WHATSAPP_NUMBER = "917660005766";

export function FreeSamplePopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { actor } = useActor();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    // Save lead to backend (best effort — don't block UX if it fails)
    if (actor) {
      actor.saveLead(name.trim(), mobile.trim()).catch(() => {
        // silently ignore
      });
    }

    const msg = encodeURIComponent(
      `Hi! I'm ${name} (${mobile}). I'd like to claim my FREE sample salad from Salad Khatora!`,
    );
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSubmitted(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setOpen(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
        onKeyDown={(e) => e.key === "Escape" && handleDismiss()}
        role="button"
        tabIndex={-1}
        aria-label="Close popup"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 pt-6 pb-8 text-white text-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-3xl mb-2">🥗</div>
          <h2 className="text-xl font-bold">Get a FREE Sample Salad!</h2>
          <p className="text-green-100 text-sm mt-1">
            Try Salad Khatora before you commit — on us.
          </p>
        </div>

        {/* Curved cut */}
        <div className="h-4 bg-gradient-to-r from-green-600 to-green-500">
          <div className="h-full bg-white rounded-t-3xl" />
        </div>

        {submitted ? (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-green-700 font-semibold text-lg">
              You're all set!
            </p>
            <p className="text-gray-500 text-sm mt-1">
              We'll send your free sample details on WhatsApp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="sample-name"
                className="text-sm font-medium text-gray-700"
              >
                Your Name
              </Label>
              <Input
                id="sample-name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="sample-mobile"
                className="text-sm font-medium text-gray-700"
              >
                Mobile Number
              </Label>
              <Input
                id="sample-mobile"
                placeholder="Enter your mobile number"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl"
            >
              Claim Free Sample via WhatsApp
            </Button>
            <p className="text-center text-xs text-gray-400">
              We'll contact you on WhatsApp with details.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

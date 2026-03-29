import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAuth } from "../auth-context";

export default function Login() {
  const {
    login,
    isAuthenticated,
    currentUser,
    isProfileLoading,
    isInitializing,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isProfileLoading) {
      if (currentUser) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/register" });
      }
    }
  }, [isAuthenticated, isProfileLoading, currentUser, navigate]);

  const isLoading = isInitializing || isProfileLoading;

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4 py-12 font-poppins">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="font-bold text-xl text-foreground">
              Salad <span className="text-primary">Khatora</span>
            </span>
          </Link>
        </div>

        <div
          className="bg-white rounded-2xl shadow-card p-8"
          data-ocid="login.panel"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground text-sm">
              Securely sign in with Internet Identity — no passwords needed.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-accent rounded-xl p-4 text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>No username or password required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Your data stays private and secure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Powered by Internet Computer blockchain</span>
              </div>
            </div>

            <Button
              className="w-full rounded-xl bg-primary text-white hover:bg-primary/90 h-12 font-semibold text-base"
              onClick={login}
              disabled={isLoading}
              data-ocid="login.submit_button"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Login with Internet Identity
                </span>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            First time here? After login you'll be guided to complete your
            profile.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

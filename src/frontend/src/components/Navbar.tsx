import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useActor } from "@/hooks/useActor";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Leaf,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { isAuthenticated, logout, currentUser } = useAuth();
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!actor || isFetching || !isAuthenticated) return;
    actor
      .isCallerAdmin()
      .then(setIsAdmin)
      .catch(() => {});
  }, [actor, isFetching, isAuthenticated]);

  const navLinks = [
    { href: "/" as const, label: "Home" },
    { href: "/menu" as const, label: "Menu" },
    { href: "/subscription" as const, label: "Subscribe" },
    ...(isAuthenticated
      ? [{ href: "/dashboard" as const, label: "Dashboard" }]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    setIsAdmin(false);
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl"
          data-ocid="nav.link"
        >
          <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </span>
          <span className="text-foreground">
            Salad <span className="text-primary">Khatora</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              data-ocid="nav.link"
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin"
              data-ocid="nav.link"
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                isActive("/admin")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/cart" className="relative" data-ocid="nav.link">
            <button
              type="button"
              className="relative p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" data-ocid="nav.link">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  aria-label="Profile"
                >
                  {initials}
                </button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border text-muted-foreground hover:text-destructive hover:border-destructive gap-1"
                onClick={handleLogout}
                data-ocid="nav.button"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary text-primary hover:bg-accent"
                  data-ocid="nav.link"
                >
                  Login
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="sm"
                  className="rounded-full bg-primary text-white hover:bg-primary/90"
                  data-ocid="nav.primary_button"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/cart" className="relative" data-ocid="nav.link">
            <button
              type="button"
              className="relative p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </Link>
          <button
            type="button"
            className="p-2 rounded-lg text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            data-ocid="nav.toggle"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)}
              data-ocid="nav.link"
              className={`py-2 text-sm font-medium transition-colors ${
                isActive(link.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              data-ocid="nav.link"
              className={`flex items-center gap-2 py-2 text-sm font-medium transition-colors ${
                isActive("/admin") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
          <Link
            to="/cart"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground"
            data-ocid="nav.link"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart{" "}
            {cartCount > 0 && (
              <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground"
                data-ocid="nav.link"
              >
                <User className="w-4 h-4" />
                {currentUser?.name || "Profile"}
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full border-destructive text-destructive gap-1"
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                data-ocid="nav.button"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full border-primary text-primary"
                  data-ocid="nav.link"
                >
                  Login
                </Button>
              </Link>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                <Button
                  size="sm"
                  className="w-full rounded-full bg-primary text-white"
                  data-ocid="nav.primary_button"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

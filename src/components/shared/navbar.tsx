"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search,
  Store,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ShieldCheck,
  Clock,
  ArrowRightLeft,
} from "lucide-react";
import type { Profile } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<"customer" | "seller">("customer");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) {
          setProfile(data);
          // Set mode according to seller_status & current route / localStorage
          if (data.seller_status === "seller_verified") {
            if (pathname.startsWith("/seller")) {
              setMode("seller");
            } else if (pathname.startsWith("/customer")) {
              setMode("customer");
            } else {
              const saved = localStorage.getItem(`mode_${data.id}`) || localStorage.getItem("mode");
              setMode(saved === "customer" ? "customer" : "seller");
            }
          } else {
            setMode("customer");
          }
        }
      }
    };
    getUser();
  }, [pathname]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${profile.id}`,
      }, () => {
        setUnreadCount((c) => c + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSwitchMode = (targetMode: "customer" | "seller") => {
    if (profile) {
      localStorage.setItem(`mode_${profile.id}`, targetMode);
    }
    localStorage.setItem("mode", targetMode);
    setMode(targetMode);
    if (targetMode === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/customer/search");
    }
  };

  // Determine nav links based on role & mode
  const isSellerVerified = profile?.seller_status === "seller_verified";
  const isSellerPending = profile?.seller_status === "seller_pending";
  const isCustomer = profile?.seller_status === "customer";

  const navLinks = profile
    ? profile.role === "admin"
      ? [
          { href: "/admin", label: "Dashboard", icon: ShieldCheck },
          { href: "/admin/users", label: "Users", icon: User },
          { href: "/admin/sellers", label: "Sellers", icon: Store },
          { href: "/admin/analytics", label: "Analytics", icon: LayoutDashboard },
        ]
      : mode === "seller" && isSellerVerified
      ? [
          { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/seller/products", label: "Products", icon: Store },
          { href: "/seller/inventory", label: "Inventory", icon: Store },
          { href: "/seller/orders", label: "Orders", icon: Store },
          { href: "/seller/demand", label: "Demand", icon: Search },
        ]
      : [
          { href: "/customer/search", label: "Search", icon: Search },
          { href: "/customer/orders", label: "Orders", icon: Store },
          { href: "/customer/requests", label: "My Requests", icon: Bell },
        ]
    : [];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">StockSpot</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {profile && profile.role !== "admin" && (
              <div className="hidden md:flex items-center gap-2">
                {isSellerVerified && mode === "customer" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchMode("seller")}
                    className="text-xs font-medium flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Switch to Seller Mode
                  </Button>
                )}
                {isSellerVerified && mode === "seller" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchMode("customer")}
                    className="text-xs font-medium flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Switch to Customer Mode
                  </Button>
                )}
                {isSellerPending && (
                  <Link href="/seller/pending">
                    <Badge variant="warning" size="sm">
                      <Clock className="w-3 h-3 mr-1 inline-block" />
                      Seller Application Pending
                    </Badge>
                  </Link>
                )}
                {isCustomer && (
                  <Link href="/seller/apply">
                    <Button size="sm" variant="outline" className="text-xs font-medium">
                      Become a Seller
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {profile ? (
              <>
                <div className="relative hidden md:block">
                  <Bell className="w-5 h-5 text-gray-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-gray-700">{profile.full_name || profile.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {profile && profile.role !== "admin" && (
              <div className="pb-2 mb-2 border-b border-gray-100">
                {isSellerVerified && mode === "customer" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setMobileOpen(false); handleSwitchMode("seller"); }}
                    className="w-full text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Switch to Seller Mode
                  </Button>
                )}
                {isSellerVerified && mode === "seller" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setMobileOpen(false); handleSwitchMode("customer"); }}
                    className="w-full text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Switch to Customer Mode
                  </Button>
                )}
                {isSellerPending && (
                  <Link href="/seller/pending" onClick={() => setMobileOpen(false)}>
                    <div className="p-2 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Seller Application Pending
                    </div>
                  </Link>
                )}
                {isCustomer && (
                  <Link href="/seller/apply" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full text-xs font-medium">
                      Become a Seller
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {profile ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

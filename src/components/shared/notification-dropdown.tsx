"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTimeAgo } from "@/lib/helpers";
import {
  Bell,
  AlertTriangle,
  TrendingUp,
  Package,
  ExternalLink,
  Flame,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { Profile } from "@/types";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface ShortageItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  avgPrice: number;
  minPrice?: number;
  maxPrice?: number;
  shortageLevel: "critical" | "high" | "moderate";
  consumerAdvice: string;
  sellerAdvice: string;
  suggestedAction: string;
}

interface NotificationDropdownProps {
  profile: Profile | null;
  mode: "customer" | "seller";
}

export function NotificationDropdown({ profile, mode }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "shortages">("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchNotifications = async () => {
    if (!profile) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // ignore
    }
  };

  const fetchShortages = async () => {
    try {
      const res = await fetch("/api/notifications/critical-shortage");
      if (res.ok) {
        const data = await res.json();
        setShortages(data.shortages || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!profile) return;
    fetchNotifications();
    fetchShortages();

    // Realtime subscription for instant new notifications
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const markAllAsRead = async () => {
    if (!profile) return;
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [] }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_ids: [notif.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const syncShortageAlerts = async () => {
    if (!profile) return;
    setSyncing(true);
    try {
      await fetch("/api/notifications/critical-shortage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: mode === "seller" ? "seller" : "customer",
          itemName: shortages[0]?.name || "Essential Produce & Fuel",
          shortageLevel: shortages[0]?.shortageLevel || "critical",
        }),
      });
      await fetchNotifications();
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "shortage":
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "demand":
        return <TrendingUp className="w-4 h-4 text-teal-600" />;
      case "order":
      case "success":
        return <Package className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium px-2 py-1 hover:bg-teal-50 rounded"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-100 text-xs font-semibold bg-gray-50/50">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === "all"
                  ? "border-teal-600 text-teal-700 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Activity ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("shortages")}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "shortages"
                  ? "border-orange-500 text-orange-700 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Nepal Shortages ({shortages.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {activeTab === "all" ? (
              notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium text-gray-600">No notifications yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Role alerts & essential shortage updates will appear here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncShortageAlerts}
                    disabled={syncing}
                    className="mt-3 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                    Check Shortage Updates
                  </Button>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors flex items-start gap-3 text-xs ${
                      !notif.is_read ? "bg-teal-50/30" : ""
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-gray-100 flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`font-semibold ${!notif.is_read ? "text-gray-900 font-bold" : "text-gray-700"}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-gray-600 leading-relaxed text-[11px]">{notif.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span>{getTimeAgo(notif.created_at)}</span>
                        {notif.link && (
                          <span className="text-teal-700 font-medium flex items-center gap-0.5">
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* Nepal Shortages Tab */
              <div className="p-2 space-y-2">
                <div className="p-2.5 bg-orange-50 border border-orange-200/60 rounded-xl text-[11px] text-orange-900 flex items-start gap-2">
                  <Flame className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Live Nepal Essential Index:</span> Filtered for daily critical produce, staples & fuel across Nepali markets.
                  </div>
                </div>

                {shortages.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-gray-200/80 rounded-xl hover:border-teal-300 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-xs">{item.name}</span>
                      <Badge
                        variant={item.shortageLevel === "critical" ? "danger" : "warning"}
                        size="sm"
                        className="text-[10px] uppercase font-bold"
                      >
                        {item.shortageLevel}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                      <span>Market Avg: <strong>Rs. {item.avgPrice}/{item.unit}</strong></span>
                      {item.minPrice != null && item.maxPrice != null && (
                        <span className="text-gray-400">Rs. {item.minPrice} - {item.maxPrice}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 leading-tight">
                      {mode === "seller" ? item.sellerAdvice : item.consumerAdvice}
                    </p>
                    <div className="pt-1.5 flex justify-end">
                      {mode === "seller" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setOpen(false); router.push("/seller/inventory"); }}
                          className="text-[11px] h-7 px-2.5 text-teal-700 border-teal-200 hover:bg-teal-50"
                        >
                          Stock Inventory
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/customer/search?q=${encodeURIComponent(item.name.split(" ")[0])}`);
                          }}
                          className="text-[11px] h-7 px-2.5 bg-teal-600 hover:bg-teal-700"
                        >
                          Find Local Stock
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Role: <strong className="text-gray-700 capitalize">{mode}</strong>
            </span>
            <button
              onClick={syncShortageAlerts}
              disabled={syncing}
              className="text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Shortage Alerts"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

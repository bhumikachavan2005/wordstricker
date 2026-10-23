"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  Flame,
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  PlusCircle,
  Bookmark,
  Archive,
  Trophy,
  LogOut,
  Menu,
  X,
  Bell,
  Check,
} from "lucide-react";

interface NavbarProps {
  currentStreak?: number;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function Navbar({ currentStreak = 0 }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  const username = session?.user?.username || "";
  const isVinuu = username === "vinuu";
  const userColor = isVinuu ? "text-violet-400" : "text-amber-400";
  const userGlow = isVinuu ? "hover-glow-vinuu" : "hover-glow-bhuu";
  const avatarBg = isVinuu
    ? "bg-linear-to-tr from-violet-600 to-purple-800"
    : "bg-linear-to-tr from-amber-500 to-orange-600";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/quiz", label: "Quiz", icon: HelpCircle },
    { href: "/submit", label: "Submit 10", icon: PlusCircle },
    { href: "/vault", label: "Vault", icon: Bookmark },
    { href: "/history", label: "Archive", icon: Archive },
    { href: "/achievements", label: "Badges", icon: Trophy },
  ];

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data.notifications || []);
          setUnreadCount(json.data.unreadCount || 0);
        }
      } catch {
        // quiet catch
      }
    }

    fetchNotifications();
  }, [session?.user?.id]);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-gray-800/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-600 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <span className="text-xl animate-flicker">🔥</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold font-outfit tracking-tight gradient-text-streak">
                  WordStreak
                </span>
                <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium -mt-1">
                  Vinuu &amp; Bhuu
                </span>
              </div>
            </Link>

            {/* Streak indicator badge */}
            <Link
              href="/dashboard#streak"
              className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 hover:border-orange-500/50 transition-all text-xs font-semibold text-amber-300"
              title="Daily Mutual Streak"
            >
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
              <span>{currentStreak} Day{currentStreak === 1 ? "" : "s"}</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? isVinuu
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 rounded-xl transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-card border border-gray-800 bg-gray-950/95 shadow-2xl p-4 z-50 animate-fade-in-up">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      Notifications {unreadCount > 0 && `(${unreadCount} new)`}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-violet-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-500">
                        No notifications yet. You&apos;re all caught up! ✨
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-colors ${
                            n.read
                              ? "bg-gray-900/40 border-gray-800/60 text-gray-400"
                              : "bg-gray-900/90 border-violet-500/30 text-gray-200"
                          }`}
                        >
                          <div className="font-semibold text-gray-200 mb-0.5">{n.title}</div>
                          <div className="text-[11px] text-gray-400 leading-snug">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Badge */}
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 ${userGlow}`}>
              <div className={`w-7 h-7 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white shadow-inner`}>
                {isVinuu ? "V" : "B"}
              </div>
              <span className={`text-xs font-semibold ${userColor}`}>
                {session?.user?.name || (isVinuu ? "Vinuu" : "Bhuu")}
              </span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sign Out"
              id="navbar-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950/95 px-4 pt-3 pb-6 space-y-2 animate-fade-in-up">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold text-white`}>
                {isVinuu ? "V" : "B"}
              </div>
              <div>
                <p className={`text-xs font-semibold ${userColor}`}>
                  {session?.user?.name || (isVinuu ? "Vinuu" : "Bhuu")}
                </p>
                <p className="text-[10px] text-gray-400">Logged in</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? isVinuu
                        ? "bg-violet-600/25 text-violet-300 border border-violet-500/40"
                        : "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                      : "text-gray-300 hover:bg-gray-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

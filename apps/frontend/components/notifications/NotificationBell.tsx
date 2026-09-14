"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Package,
  Bike,
  CreditCard,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from "../../lib/api/notifications";

export function NotificationBell() {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications & unread count
  const fetchInbox = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ limit: 10 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);

      // Trigger transient toast
      setToastNotification(notification);
      setTimeout(() => {
        setToastNotification(null);
      }, 5000);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getIconForType = (type: string) => {
    if (type.startsWith("order")) return <Package className="w-4 h-4 text-blue-600" />;
    if (type.startsWith("delivery")) return <Bike className="w-4 h-4 text-emerald-600" />;
    if (type.startsWith("payment")) return <CreditCard className="w-4 h-4 text-purple-600" />;
    return <Sparkles className="w-4 h-4 text-amber-500" />;
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return "Just now";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchInbox();
        }}
        className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-xs hover:shadow-sm transition-all focus:outline-none"
        title="Notifications"
        id="notification-bell-btn"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Micro-Toast for incoming real-time notifications */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 backdrop-blur-xl border border-blue-200 shadow-xl shadow-blue-500/10 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
            {getIconForType(toastNotification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {toastNotification.title}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
              {toastNotification.body}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl shadow-blue-500/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100/80">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Bell className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Order and delivery alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n._id)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    !n.is_read ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/50 shrink-0 mt-0.5">
                    {getIconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{n.body}</p>

                    {n.reference_id && (
                      <div className="mt-1.5">
                        <Link
                          href={
                            n.reference_type === "delivery"
                              ? `/delivery/track/${n.reference_id}`
                              : `/orders/${n.reference_id}`
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

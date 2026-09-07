"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Inbox as InboxIcon,
  Mail,
  Star,
  Check,
  X,
  Trash2,
  Info,
  ArrowLeft,
  Search,
  RefreshCw,
  UserPlus,
  Building2,
  CheckCheck,
  MailOpen,
  Menu,
  ChevronRight,
  Settings,
  User,
  LogOut
} from "lucide-react";
import { markNotificationAsRead, deleteNotification, respondToInvitation } from "@/app/actions";
import { signOut } from "@/lib/auth-client";

interface Invitation {
  id: string;
  tenantId: string;
  businessName: string;
  role: "admin" | "manager" | "viewer";
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

interface InboxClientProps {
  initialInvitations: Invitation[];
  initialNotifications: Notification[];
  user: {
    name: string;
    email: string;
  };
}

type TabCategory = "all" | "inbox" | "invitations" | "unread" | "starred";

export default function InboxClient({ initialInvitations, initialNotifications, user }: InboxClientProps) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "notification" | "invitation";
    data: Notification | Invitation;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Combine items into unified list format
  const allItems = useMemo(() => {
    const notifItems = notifications.map((n) => ({
      id: `notif_${n.id}`,
      originalId: n.id,
      type: "notification" as const,
      sender: "Jozelio System",
      title: n.title,
      preview: n.message,
      date: new Date(n.createdAt),
      isRead: n.isRead,
      raw: n,
    }));

    const invItems = invitations.map((i) => ({
      id: `inv_${i.id}`,
      originalId: i.id,
      type: "invitation" as const,
      sender: i.businessName,
      title: `Workspace Invitation: ${i.businessName}`,
      preview: `You have been invited to join ${i.businessName} as ${i.role.toUpperCase()}`,
      date: new Date(),
      isRead: false,
      raw: i,
    }));

    return [...invItems, ...notifItems].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [notifications, invitations]);

  // Filter items based on active tab & search query
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Tab filter
      if (activeTab === "inbox" && item.type !== "notification") return false;
      if (activeTab === "invitations" && item.type !== "invitation") return false;
      if (activeTab === "unread" && item.isRead) return false;
      if (activeTab === "starred" && !starredIds.includes(item.id)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSender = item.sender.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPreview = item.preview.toLowerCase().includes(q);
        return matchSender || matchTitle || matchPreview;
      }

      return true;
    });
  }, [allItems, activeTab, searchQuery, starredIds]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const pendingInvitesCount = invitations.length;

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStarredIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const handleRespond = async (id: string, action: "accept" | "decline") => {
    setMessage(null);
    startTransition(async () => {
      const res = await respondToInvitation(id, action);
      if (res?.error) {
        setMessage({ type: "error", text: `Failed to respond: ${res.error}` });
      } else {
        setMessage({
          type: "success",
          text: action === "accept" ? "Invitation accepted!" : "Invitation declined",
        });
        setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        if (selectedItem?.data.id === id) {
          setSelectedItem(null);
        }
        if (action === "accept") {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    });
  };

  const handleDismissNotification = async (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await markNotificationAsRead(id);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Marked as read." });
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      }
    });
  };

  const handleDeleteNotification = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;

    setMessage(null);
    startTransition(async () => {
      const res = await deleteNotification(id);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Message permanently deleted." });
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedItem?.data.id === id) {
          setSelectedItem(null);
        }
      }
    });
  };

  const handleMarkSelectedRead = () => {
    selectedIds.forEach((itemId) => {
      if (itemId.startsWith("notif_")) {
        const notifId = itemId.replace("notif_", "");
        handleDismissNotification(notifId);
      }
    });
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected item(s)?`)) return;
    selectedIds.forEach((itemId) => {
      if (itemId.startsWith("notif_")) {
        const notifId = itemId.replace("notif_", "");
        handleDeleteNotification(notifId);
      }
    });
    setSelectedIds([]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 600);
  };

  const openItem = (item: (typeof allItems)[0]) => {
    if (item.type === "notification" && !item.isRead) {
      handleDismissNotification(item.originalId);
    }
    setSelectedItem({
      type: item.type,
      data: item.raw,
    });
  };

  return (
    <div className="w-full flex-grow flex flex-col bg-[#f6f8fc] font-sans">
      {/* ─── Responsive Top Gmail App Header ──────────────────────────────────── */}
      <header className="shrink-0 h-20 border-b-2 border-brand-blue flex items-center px-4 md:px-6 justify-between gap-2 sm:gap-4 sticky top-0 z-30 bg-brand-white/40 backdrop-blur-md">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="font-display font-black text-lg md:text-xl text-brand-blue uppercase tracking-tight flex items-center gap-2" style={{ textShadow: "0.5px 0.5px 0px #f58a2d" }}>
            <Mail className="w-5 h-5 md:w-6 md:h-6 text-brand-orange" />
            Jozelio Mail
          </h1>
        </div>

        {/* Middle: Gmail Search Bar */}
        <div className="flex-1 max-w-xl mx-2 relative hidden sm:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-brand-blue/50 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mail..."
              className="w-full h-10 pl-10 pr-9 bg-brand-white/80 hover:bg-brand-white focus:bg-brand-white border-2 border-brand-blue/30 focus:border-brand-blue font-mono font-bold uppercase tracking-wider text-[10px] sm:text-xs text-brand-blue placeholder:text-brand-blue/40 focus:outline-none transition-all shadow-[2px_2px_0px_rgba(17,54,105,0.15)] focus:shadow-[4px_4px_0px_rgba(17,54,105,1)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-brand-blue/60 hover:text-brand-orange p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Dashboard Button */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <a
            href="/dashboard"
            className="h-10 px-3 md:px-4 bg-brand-white hover:bg-brand-blue text-brand-blue hover:text-brand-white border-2 border-brand-blue font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub Home</span>
          </a>
        </div>
      </header>

      {/* Toast Notification Bar */}
      {message && (
        <div className="px-3 sm:px-4 py-2 bg-brand-blue text-brand-white border-b-2 border-brand-orange flex items-center justify-between text-[11px] sm:text-xs font-mono font-bold uppercase">
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:text-brand-orange cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Main Content Split Container ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Slide-over Drawer Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          />
        )}

        {/* Left Navigation Sidebar */}
        <aside
          className={`bg-brand-white border-r-2 border-brand-blue flex flex-col shrink-0 transition-all duration-200 z-50 ${
            mobileMenuOpen
              ? "fixed inset-y-0 left-0 w-64 shadow-[8px_0_0_rgba(17,54,105,1)]"
              : "hidden md:flex w-56 lg:w-64"
          }`}
        >
          <div className="flex items-center justify-between md:hidden p-4 border-b-2 border-brand-blue bg-brand-grey/40 shrink-0">
            <span className="font-display font-black text-lg text-brand-blue uppercase">Mail Folders</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[1.5px_1.5px_0px_#113669] transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 shrink-0 border-b border-brand-blue/10">
            <button
              onClick={() => {
                handleRefresh();
                setMobileMenuOpen(false);
              }}
              className="w-full h-11 bg-brand-orange hover:bg-brand-blue text-brand-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-brand-blue shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh Inbox</span>
            </button>
          </div>

          <nav className="flex-1 flex flex-col p-2 gap-0.5">
            <button
              onClick={() => {
                setActiveTab("all");
                setSelectedItem(null);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 flex-1 max-h-[40px] min-h-[40px] border-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === "all"
                  ? "border-brand-blue text-brand-orange bg-brand-grey/25"
                  : "border-transparent hover:border-brand-blue hover:bg-brand-orange text-brand-blue hover:text-brand-white group"
              } cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <InboxIcon className="w-4 h-4 shrink-0" />
                <span>All Mail</span>
              </div>
              <span className={`text-[10px] font-black ${activeTab !== "all" && "text-brand-blue/50 group-hover:text-brand-white/80"}`}>{allItems.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("inbox");
                setSelectedItem(null);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 flex-1 max-h-[40px] min-h-[40px] border-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === "inbox"
                  ? "border-brand-blue text-brand-orange bg-brand-grey/25"
                  : "border-transparent hover:border-brand-blue hover:bg-brand-orange text-brand-blue hover:text-brand-white group"
              } cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" />
                <span>System Msgs</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-brand-orange text-brand-white text-[9px] font-black border border-brand-blue shadow-[1px_1px_0_#113669]">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("invitations");
                setSelectedItem(null);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 flex-1 max-h-[40px] min-h-[40px] border-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === "invitations"
                  ? "border-brand-blue text-brand-orange bg-brand-grey/25"
                  : "border-transparent hover:border-brand-blue hover:bg-brand-orange text-brand-blue hover:text-brand-white group"
              } cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Invitations</span>
              </div>
              {pendingInvitesCount > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-500 text-brand-white text-[9px] font-black border border-brand-blue shadow-[1px_1px_0_#113669]">
                  {pendingInvitesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("starred");
                setSelectedItem(null);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 flex-1 max-h-[40px] min-h-[40px] border-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === "starred"
                  ? "border-brand-blue text-brand-orange bg-brand-grey/25"
                  : "border-transparent hover:border-brand-blue hover:bg-brand-orange text-brand-blue hover:text-brand-white group"
              } cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <Star className={`w-4 h-4 shrink-0 ${activeTab === 'starred' ? 'text-brand-orange fill-brand-orange' : 'text-amber-400 fill-amber-400 group-hover:text-brand-white group-hover:fill-brand-white'}`} />
                <span>Starred</span>
              </div>
              <span className={`text-[10px] font-black ${activeTab !== "starred" && "text-brand-blue/50 group-hover:text-brand-white/80"}`}>{starredIds.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("unread");
                setSelectedItem(null);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 flex-1 max-h-[40px] min-h-[40px] border-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === "unread"
                  ? "border-brand-blue text-brand-orange bg-brand-grey/25"
                  : "border-transparent hover:border-brand-blue hover:bg-brand-orange text-brand-blue hover:text-brand-white group"
              } cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <MailOpen className="w-4 h-4 shrink-0" />
                <span>Unread</span>
              </div>
              <span className={`text-[10px] font-black ${activeTab !== "unread" && "text-brand-blue/50 group-hover:text-brand-white/80"}`}>{unreadCount}</span>
            </button>
          </nav>

          <div className="mt-auto shrink-0 p-4 border-t-2 border-brand-blue bg-brand-bg/40 flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-brand-blue truncate">
                {user.name}
              </span>
              <span className="font-mono text-[9px] text-brand-blue/50 truncate mt-0.5">
                {user.email}
              </span>
            </div>
            <div className="relative shrink-0">
              {isSettingsOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-44 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_0px_rgba(245,138,45,1)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue hover:text-brand-white transition-colors group border-b border-brand-blue/10"
                  >
                    <User className="w-3.5 h-3.5 text-brand-orange group-hover:text-brand-white transition-colors" />
                    <span>Profile</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-40 group-hover:opacity-100" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-brand-blue hover:bg-rose-500 hover:text-brand-white transition-colors group cursor-pointer focus:outline-none"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:text-brand-white transition-colors" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="block p-2 border border-transparent hover:border-brand-blue hover:bg-brand-blue/5 text-brand-blue/60 hover:text-brand-blue transition-all font-mono text-xs cursor-pointer focus:outline-none z-10 rounded"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ─── Main Viewing Area ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col bg-brand-white overflow-hidden min-w-0">
          {selectedItem ? (
            /* ─── Responsive Reading Pane View ───────────────────────────── */
            <div className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-6 md:p-8 animate-in fade-in duration-150">
              {/* Top Reading Header Controls */}
              <div className="flex items-center justify-between gap-4 pb-3 mb-4 sm:mb-6 border-b-2 border-slate-200">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-brand-blue hover:text-white border-2 border-brand-blue font-mono text-[11px] sm:text-xs font-bold uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#113669] transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedItem.type === "notification" && (
                    <button
                      onClick={() => {
                        const n = selectedItem.data as Notification;
                        handleDeleteNotification(n.id);
                      }}
                      className="p-1.5 sm:p-2 text-rose-600 hover:bg-rose-50 border border-rose-300 transition-colors cursor-pointer"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Message Details Box */}
              {selectedItem.type === "notification" ? (
                (() => {
                  const notif = selectedItem.data as Notification;
                  return (
                    <div className="max-w-4xl mx-auto w-full bg-brand-white border-2 sm:border-4 border-brand-blue shadow-[4px_4px_0px_#113669] sm:shadow-[8px_8px_0px_#113669] p-4 sm:p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 pb-4 border-b-2 border-brand-blue/15 mb-4 sm:mb-6">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-orange text-brand-white font-mono text-[9px] font-black uppercase mb-2">
                            <Info className="w-3 h-3" /> System Notification
                          </span>
                          <h2 className="font-display font-black text-lg sm:text-xl md:text-2xl text-brand-blue uppercase tracking-tight leading-snug">
                            {notif.title}
                          </h2>
                        </div>
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-500 shrink-0">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Sender Info Banner */}
                      <div className="flex items-center gap-3 p-3 bg-brand-bg/30 border-2 border-brand-blue/20 mb-6">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-blue text-brand-white border-2 border-brand-blue flex items-center justify-center shadow-[2px_2px_0px_#f58a2d] shrink-0 overflow-hidden">
                          <img src="/branding/logo1.svg" alt="Jozelio" className="w-full h-full object-cover p-1.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-brand-blue truncate">
                            Jozelio Automated System
                          </span>
                          <span className="font-mono text-[9px] sm:text-[10px] text-slate-500 truncate">
                            to me &lt;user@jozelio.com&gt;
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-brand-blue leading-relaxed font-semibold whitespace-pre-wrap p-3 sm:p-5 bg-slate-50/50 border border-slate-200">
                        {notif.message}
                      </div>

                      {/* Bottom Controls */}
                      <div className="mt-6 pt-4 border-t-2 border-brand-blue/15 flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">
                          ID: {notif.id}
                        </span>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-rose-500 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#113669] transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const inv = selectedItem.data as Invitation;
                  return (
                    <div className="max-w-4xl mx-auto w-full bg-brand-white border-2 sm:border-4 border-brand-orange shadow-[4px_4px_0px_#113669] sm:shadow-[8px_8px_0px_#113669] p-4 sm:p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 pb-4 border-b-2 border-brand-orange/20 mb-4 sm:mb-6">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-600 text-white font-mono text-[9px] font-black uppercase mb-2">
                            <UserPlus className="w-3 h-3" /> Workspace Invite
                          </span>
                          <h2 className="font-display font-black text-lg sm:text-xl md:text-2xl text-brand-blue uppercase tracking-tight leading-snug">
                            You&apos;re Invited to Manage {inv.businessName}
                          </h2>
                        </div>
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-500 shrink-0">
                          Pending Response
                        </span>
                      </div>

                      {/* Business Card */}
                      <div className="flex items-center gap-3 p-3.5 bg-brand-orange/10 border-2 border-brand-orange mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-orange text-brand-white border-2 border-brand-blue flex items-center justify-center font-display font-black text-lg shadow-[2px_2px_0px_#113669] shrink-0">
                          <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm sm:text-base text-brand-blue truncate">
                            {inv.businessName}
                          </span>
                          <span className="font-mono text-[10px] sm:text-xs text-brand-orange font-bold uppercase">
                            Role Offered: {inv.role.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-brand-blue font-medium leading-relaxed mb-6">
                        The owner of <strong>{inv.businessName}</strong> has invited you to join their team as a{" "}
                        <strong className="text-brand-orange uppercase">{inv.role}</strong>. Accept this invitation to gain access to their menu management dashboard.
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 border-t-2 border-brand-orange/20">
                        <button
                          onClick={() => handleRespond(inv.id, "accept")}
                          disabled={isPending}
                          className="px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-orange hover:bg-brand-blue text-brand-white font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider border-2 border-brand-blue flex items-center gap-2 shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept Invitation</span>
                        </button>
                        <button
                          onClick={() => handleRespond(inv.id, "decline")}
                          disabled={isPending}
                          className="px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider border-2 border-slate-300 flex items-center gap-2 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ) : (
            /* ─── Responsive Gmail List View ─────────────────────────────── */
            <>
              {/* Mail Toolbar Header */}
              <div className="h-10 sm:h-12 px-3 sm:px-4 bg-brand-bg/40 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-brand-orange cursor-pointer"
                    title="Select All"
                  />

                  {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={handleMarkSelectedRead}
                        className="p-1 sm:p-1.5 text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
                        title="Mark selected as read"
                      >
                        <CheckCheck className="w-4 h-4 text-brand-blue" />
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="p-1 sm:p-1.5 text-slate-700 hover:bg-rose-100 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete selected"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-500 ml-1">
                        {selectedIds.length} sel
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold text-slate-500 uppercase">
                      <span>{filteredItems.length} msg(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleRefresh}
                    className="p-1 sm:p-1.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Mobile Category Quick Tabs Bar */}
              <div className="md:hidden p-1.5 bg-slate-100 border-b border-slate-200 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-2.5 py-1 font-mono text-[9px] font-black uppercase rounded shrink-0 ${
                    activeTab === "all" ? "bg-brand-blue text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  All ({allItems.length})
                </button>
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`px-2.5 py-1 font-mono text-[9px] font-black uppercase rounded shrink-0 ${
                    activeTab === "inbox" ? "bg-brand-blue text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  System ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveTab("invitations")}
                  className={`px-2.5 py-1 font-mono text-[9px] font-black uppercase rounded shrink-0 ${
                    activeTab === "invitations" ? "bg-brand-blue text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  Invites ({pendingInvitesCount})
                </button>
              </div>

              {/* Gmail Rows List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <div className="h-full py-12 sm:py-16 flex flex-col items-center justify-center text-slate-400 px-4 text-center">
                    <Mail className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-20" />
                    <p className="font-mono text-xs font-bold uppercase tracking-widest">
                      No Messages Found
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-3 text-xs font-bold text-brand-orange hover:underline cursor-pointer"
                      >
                        Clear Search Query
                      </button>
                    )}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isStarred = starredIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => openItem(item)}
                        className={`group px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-brand-blue/10"
                            : item.isRead
                            ? "bg-white hover:bg-slate-50 text-slate-600"
                            : "bg-[#f2f6fc] hover:bg-[#e8f0fe] font-bold text-slate-900 shadow-xs"
                        }`}
                      >
                        {/* Left Controls & Avatar */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => toggleSelect(e, item.id)}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-brand-orange cursor-pointer"
                          />
                          <button
                            onClick={(e) => toggleStar(e, item.id)}
                            className="p-0.5 sm:p-1 hover:text-amber-500 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                isStarred
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-slate-300 hover:text-slate-400"
                              }`}
                            />
                          </button>
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-display font-black text-[11px] sm:text-xs shrink-0 overflow-hidden ${
                              item.type === "invitation"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-brand-blue border-brand-blue"
                            }`}
                          >
                            {item.type === "notification" ? (
                              <img src="/branding/logo1.svg" alt="Jozelio" className="w-full h-full object-cover p-1" />
                            ) : (
                              item.sender.charAt(0).toUpperCase()
                            )}
                          </div>
                        </div>

                        {/* Sender & Subject Preview */}
                        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3">
                          <span
                            className={`w-28 sm:w-36 md:w-44 truncate text-[11px] sm:text-xs font-black uppercase ${
                              item.type === "invitation" ? "text-emerald-700" : "text-brand-blue"
                            }`}
                          >
                            {item.sender}
                          </span>

                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <span
                              className={`text-[11px] sm:text-xs truncate ${
                                !item.isRead ? "font-black text-slate-900" : "font-medium text-slate-700"
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="text-[11px] sm:text-xs text-slate-400 font-normal truncate hidden lg:inline">
                              - {item.preview}
                            </span>
                          </div>
                        </div>

                        {/* Date / Hover Quick Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          {item.type === "invitation" && (
                            <span className="hidden sm:inline px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[8px] sm:text-[9px] font-black uppercase">
                              Invite
                            </span>
                          )}

                          <span className="font-mono text-[9px] sm:text-[10px] font-bold text-slate-400 group-hover:hidden">
                            {item.date.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>

                          {/* Hover Action Bar */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            {item.type === "notification" ? (
                              <>
                                {!item.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDismissNotification(item.originalId);
                                    }}
                                    className="p-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                                    title="Mark Read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(item.originalId);
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleRespond(item.originalId, "accept")}
                                  className="px-2 py-0.5 bg-brand-orange text-white font-mono text-[8px] sm:text-[9px] font-black uppercase border border-brand-blue shadow-[1px_1px_0px_#113669] cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRespond(item.originalId, "decline")}
                                  className="px-2 py-0.5 bg-white text-slate-700 font-mono text-[8px] sm:text-[9px] font-black uppercase border border-slate-300 cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

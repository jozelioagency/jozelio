"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Mail, Check, X, Bell, Info } from "lucide-react";
import { getPendingInvitations, respondToInvitation, getSystemNotifications, markNotificationAsRead } from "@/app/actions";

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
}

const notifyTranslations = {
  English: {
    empty: "Inbox is empty",
    invited: "Invited to manage",
    as: "as",
    accept: "Accept",
    decline: "Decline",
    markRead: "Mark Read",
    successAccept: "Invitation accepted!",
    successDecline: "Invitation declined",
    successDismiss: "Message dismissed",
    errorMsg: "Failed to respond",
    title: "Inbox",
    roleAdmin: "Admin",
    roleManager: "Manager",
    roleViewer: "Viewer",
  },
  Arabic: {
    empty: "صندوق الوارد فارغ",
    invited: "تمت دعوتك لإدارة",
    as: "بصفة",
    accept: "قبول",
    decline: "رفض",
    markRead: "مقروء",
    successAccept: "تم قبول الدعوة بنجاح!",
    successDecline: "تم رفض الدعوة",
    successDismiss: "تم إخفاء الرسالة",
    errorMsg: "فشل في الإجراء",
    title: "صندوق الوارد",
    roleAdmin: "مسؤول",
    roleManager: "مدير",
    roleViewer: "مشاهد",
  },
};

export default function NotificationCenter() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<"English" | "Arabic">("English");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const t = notifyTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";

  const fetchInbox = async () => {
    const [invList, notifList] = await Promise.all([
      getPendingInvitations(),
      getSystemNotifications()
    ]);
    setInvitations(invList as Invitation[]);
    setNotifications(notifList as Notification[]);
  };

  useEffect(() => {
    // Read lang
    const savedLang = localStorage.getItem("jozelio_language");
    if (savedLang === "Arabic" || savedLang === "English") {
      setLang(savedLang);
    }

    fetchInbox();
    
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (id: string, action: "accept" | "decline") => {
    setMessage(null);
    startTransition(async () => {
      const res = await respondToInvitation(id, action);
      if (res?.error) {
        setMessage({ type: "error", text: `${t.errorMsg}: ${res.error}` });
      } else {
        setMessage({
          type: "success",
          text: action === "accept" ? t.successAccept : t.successDecline,
        });
        
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== id));
        
        // If accepted, trigger full page reload to reflect new projects
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
        setMessage({ type: "success", text: t.successDismiss });
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return t.roleAdmin;
      case "manager":
        return t.roleManager;
      case "viewer":
        return t.roleViewer;
      default:
        return role;
    }
  };

  const totalItems = invitations.length + notifications.length;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setMessage(null);
        }}
        className="relative p-2.5 border border-brand-blue/30 bg-brand-white hover:border-brand-blue hover:bg-brand-blue/5 text-brand-blue transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#113669] focus:outline-none flex items-center justify-center"
        title="View Inbox"
      >
        <Mail className="w-4 h-4 text-brand-orange" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border border-brand-white text-white font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
            {totalItems}
          </span>
        )}
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div
          className={`absolute mt-3 w-72 sm:w-80 bg-brand-white border-2 border-brand-blue p-4 shadow-[4px_4px_0px_#113669] z-50 text-start animate-in fade-in slide-in-from-top-2 duration-200 ${
            isRtl ? "left-[-10px] sm:left-0" : "right-[-10px] sm:right-0"
          }`}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="flex justify-between items-center border-b border-brand-blue/15 pb-2 mb-3">
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-orange" />
              {t.title}
            </h4>
            <span className="font-mono text-[9px] font-bold text-brand-blue/40 uppercase">
              {totalItems} unread
            </span>
          </div>

          {message && (
            <div
              className={`p-2 mb-3 text-[10px] font-bold border ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                  : "bg-rose-50 border-rose-400 text-rose-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {totalItems === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 text-brand-blue/50">
              <Check className="w-8 h-8 text-brand-blue/20" />
              <span className="text-xs font-semibold">{t.empty}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              
              {/* Invitations */}
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 border border-brand-orange/30 bg-brand-orange/5 flex flex-col gap-2 justify-between"
                >
                  <p className="text-[11px] text-brand-blue font-medium leading-relaxed">
                    {t.invited} <strong className="text-brand-orange uppercase">{inv.businessName}</strong> {t.as}{" "}
                    <span className="font-mono text-[10px] font-bold bg-brand-orange/10 px-1.5 py-0.5 border border-brand-orange/20 text-brand-orange">
                      {getRoleLabel(inv.role)}
                    </span>
                  </p>
                  
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleRespond(inv.id, "accept")}
                      disabled={isPending}
                      className="px-3 py-1 border border-brand-blue bg-brand-orange text-brand-white hover:bg-brand-blue hover:text-brand-white font-mono text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-[1.5px_1.5px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <Check className="w-2.5 h-2.5" />
                      <span>{t.accept}</span>
                    </button>
                    <button
                      onClick={() => handleRespond(inv.id, "decline")}
                      disabled={isPending}
                      className="px-3 py-1 border border-brand-blue bg-brand-white text-brand-blue hover:bg-rose-50 hover:text-rose-600 font-mono text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-[1.5px_1.5px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>{t.decline}</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* System Notifications */}
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 border border-brand-blue/20 bg-brand-grey/10 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-[11px] font-black text-brand-blue uppercase tracking-wide leading-snug">
                        {notif.title}
                      </h5>
                      <p className="text-[10px] text-brand-blue/80 mt-1 leading-relaxed whitespace-pre-wrap">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDismissNotification(notif.id)}
                      disabled={isPending}
                      className="px-3 py-1 border border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-blue hover:text-brand-white font-mono text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-[1px_1px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <Check className="w-2.5 h-2.5" />
                      <span>{t.markRead}</span>
                    </button>
                  </div>
                </div>
              ))}

            </div>
          )}

          <div className="mt-3 pt-3 border-t border-brand-blue/15 text-center">
            <a 
              href="/inbox" 
              className="inline-block font-mono text-[9px] font-black uppercase text-brand-orange hover:text-brand-blue tracking-widest transition-colors cursor-pointer"
            >
              View Full Inbox →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

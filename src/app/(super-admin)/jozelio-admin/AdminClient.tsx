"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { 
  updateTenantTier, 
  deleteTenantByAdmin, 
  updateUserRoleByAdmin,
  sendMessageByAdmin,
  sendGlobalMessageByAdmin, 
  deleteUserByAdmin,
  getSystemSettings,
  updateSystemSettings,
  clearExpiredSessions,
  vacuumDatabase,
  toggleTenantBan,
  toggleUserBan,
  updateUserMaxProjects,
  updateTenantLimits,
  updateTenantBanAndWarning,
  updateUserBanAndWarning,
  exportFullPlatformData
} from "@/app/actions";
import { 
  Trash2,
  Mail, 
  ExternalLink, 
  Search, 
  Filter, 
  Globe, 
  Users, 
  Layers, 
  Menu,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Settings,
  Sliders,
  Database,
  Check,
  X,
  Download
} from "lucide-react";
import { BrutalistSelect } from "@/components/BrutalistSelect";
import AccountingSection from "./AccountingSection";
import type { AccountingTransaction } from "@/db/schema";

interface TenantAdminView {
  id: string;
  subdomain: string;
  businessName: string;
  tier: "free" | "pro" | "enterprise";
  isBanned: boolean;
  createdAt: Date;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
  ownerMaxProjects: number;
  customMenuLimit: number | null;
  customLocationLimit: number | null;
  customRateLimit: number | null;
  customSubdomainCooldown: number | null;
  banReason: string | null;
  banExpiresAt: Date | null;
  isWarned: boolean;
  warningReason: string | null;
  subdomainLastChangedAt: Date | null;
}

interface UserAdminView {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  isBanned: boolean;
  maxProjects?: number;
  createdAt: Date;
  banReason: string | null;
  banExpiresAt: Date | null;
  isWarned: boolean;
  warningReason: string | null;
  customUsernameCooldown?: number | null;
  usernameLastChangedAt?: Date | null;
}

const CustomFilterDropdown = ({ 
  value, 
  onChange, 
  options, 
  icon: Icon,
  placeholder = "Select Filters"
}: { 
  value: string[]; 
  onChange: (val: string[]) => void; 
  options: { label: string; value: string }[];
  icon: any;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: string) => {
    if (optionValue === "all") {
      onChange(["all"]);
      return;
    }
    
    let newValue = value.filter(v => v !== "all");
    
    if (newValue.includes(optionValue)) {
      newValue = newValue.filter(v => v !== optionValue);
      if (newValue.length === 0) {
        newValue = ["all"];
      }
    } else {
      newValue = [...newValue, optionValue];
    }
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (value.includes("all") || value.length === 0) {
      return options.find(o => o.value === "all")?.label || placeholder;
    }
    if (value.length === 1) {
      return options.find(o => o.value === value[0])?.label || placeholder;
    }
    return `${value.length} FILTERS ACTIVE`;
  };

  return (
    <div className="relative w-full sm:w-auto shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 h-9 px-3 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-black uppercase cursor-pointer hover:bg-brand-grey/20 transition-all shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-w-[240px] w-full"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Icon className="w-4 h-4 text-brand-orange shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <svg className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-full min-w-[240px] border-2 border-brand-blue bg-brand-white shadow-[4px_4px_0px_#113669] z-50 animate-in slide-in-from-top-2 duration-150">
          <ul className="py-1 max-h-60 overflow-y-auto relative">
            <li className="px-2 pb-2 mb-1 border-b-2 border-brand-blue/10 sticky top-0 bg-brand-white z-10 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!(value.includes("all") || value.length === 0)) onChange(["all"]);
                }}
                disabled={value.includes("all") || value.length === 0}
                className={`w-full flex items-center justify-center gap-2 h-8 border-2 font-mono text-xs font-black uppercase transition-colors ${
                  value.includes("all") || value.length === 0
                    ? "border-brand-grey bg-brand-grey/50 text-brand-blue/50 cursor-not-allowed shadow-none"
                    : "border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white shadow-[2px_2px_0px_#f43f5e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                }`}
              >
                <X className={`w-3.5 h-3.5 shrink-0 ${value.includes("all") || value.length === 0 ? 'opacity-50' : ''}`} />
                Clear Filters
              </button>
            </li>
            
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 font-mono text-xs font-black uppercase transition-colors hover:bg-brand-grey/30 text-brand-blue"
                  >
                    <div className={`flex items-center justify-center w-4 h-4 border-2 border-brand-blue shrink-0 ${isSelected ? "bg-brand-blue" : "bg-brand-white"}`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-brand-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function AdminClient({
  initialTenants,
  initialUsers,
  totalMenuItems,
  initialTransactions = [],
  currentOperatorId,
  isOwner = false,
}: {
  initialTenants: TenantAdminView[];
  initialUsers: UserAdminView[];
  totalMenuItems: number;
  initialTransactions?: AccountingTransaction[];
  currentOperatorId: string;
  isOwner?: boolean;
}) {
  const [tenants, setTenants] = useState<TenantAdminView[]>(initialTenants);
  const [users, setUsers] = useState<UserAdminView[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"tenants" | "users" | "owner_tools" | "accounting">("tenants");
  const [storefrontFilter, setStorefrontFilter] = useState("bocado");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Owner settings state variables
  const [ownerSettings, setOwnerSettings] = useState<Record<string, string>>({});
  const [ownerLoading, setOwnerLoading] = useState(false);

  const [disableRegistrations, setDisableRegistrations] = useState(false);
  const [limitFree, setLimitFree] = useState(5);
  const [limitPro, setLimitPro] = useState(30);
  const [limitEnt, setLimitEnt] = useState(100);
  const [subdomainCooldownDays, setSubdomainCooldownDays] = useState(14);
  const [usernameCooldownDays, setUsernameCooldownDays] = useState(14);
  const [locationLimit, setLocationLimit] = useState(30);

  // Full Platform Data Backup state
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [backupStats, setBackupStats] = useState<{
    totalRecords: number;
    totalTables: number;
    tableCounts: Record<string, number>;
    exportedAt: string;
  } | null>(null);


  // Message Modal State
  const [messageTargetUser, setMessageTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sendToInbox, setSendToInbox] = useState(true);
  const [sendAsEmail, setSendAsEmail] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTargetUser) return;
    setIsSendingMessage(true);
    setMessage(null);
    try {
      const res = await sendMessageByAdmin(messageTargetUser.id, msgSubject, msgBody, sendToInbox, sendAsEmail);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Message sent successfully!" });
        setMessageTargetUser(null);
        setMsgSubject("");
        setMsgBody("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send message" });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Load configuration

  // Global Message State
  const [globalSubject, setGlobalSubject] = useState("");
  const [globalBody, setGlobalBody] = useState("");
  const [globalSendToInbox, setGlobalSendToInbox] = useState(true);
  const [globalSendAsEmail, setGlobalSendAsEmail] = useState(false);
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);

  const handleSendGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingGlobal(true);
    setMessage(null);
    try {
      const res = await sendGlobalMessageByAdmin(globalSubject, globalBody, globalSendToInbox, globalSendAsEmail);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: `Global message sent to ${res.count} users successfully!` });
        setGlobalSubject("");
        setGlobalBody("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send global message" });
    } finally {
      setIsSendingGlobal(false);
    }
  };

  useEffect(() => {
    if (ownerSettings) {
      setDisableRegistrations(ownerSettings.disable_registrations === "true");
      setLimitFree(parseInt(ownerSettings.limit_free_menu_items) || 5);
      setLimitPro(parseInt(ownerSettings.limit_pro_menu_items) || 30);
      setLimitEnt(parseInt(ownerSettings.limit_enterprise_menu_items) || 100);
      
      const parsedCooldown = parseInt(ownerSettings.subdomain_cooldown_days);
      setSubdomainCooldownDays(isNaN(parsedCooldown) ? 14 : parsedCooldown);

      const parsedUsernameCooldown = parseInt(ownerSettings.username_cooldown_days);
      setUsernameCooldownDays(isNaN(parsedUsernameCooldown) ? 14 : parsedUsernameCooldown);

      const parsedLocationLimit = parseInt(ownerSettings.location_limit);
      setLocationLimit(isNaN(parsedLocationLimit) ? 30 : parsedLocationLimit);
    }
  }, [ownerSettings]);

  // Load configuration details on activeTab toggle
  useEffect(() => {
    if (activeTab === "owner_tools" && isOwner) {
      setOwnerLoading(true);
      getSystemSettings().then((res) => {
        setOwnerLoading(false);
        if (res.success && res.settings) {
          setOwnerSettings(res.settings);
        } else if (res.error) {
          setMessage({ type: "error", text: res.error });
        }
      });
    }
  }, [activeTab, isOwner]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await updateSystemSettings({
        disable_registrations: disableRegistrations ? "true" : "false",
        limit_free_menu_items: String(limitFree),
        limit_pro_menu_items: String(limitPro),
        limit_enterprise_menu_items: String(limitEnt),
        subdomain_cooldown_days: String(subdomainCooldownDays),
        username_cooldown_days: String(usernameCooldownDays),
        location_limit: String(locationLimit),
      });
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Global system settings updated successfully!" });
        const fresh = await getSystemSettings();
        if (fresh.success && fresh.settings) {
          setOwnerSettings(fresh.settings);
        }
      }
    });
  };

  const handleClearSessions = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await clearExpiredSessions();
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Expired session tokens cleared successfully." });
      }
    });
  };

  const handleVacuumDatabase = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await vacuumDatabase();
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "D1 Database optimized successfully via VACUUM operation." });
      }
    });
  };

  const handleDownloadPlatformBackup = async () => {
    setIsExportingBackup(true);
    setMessage(null);
    try {
      const res = await exportFullPlatformData();
      if (res.error || !res.backupData) {
        setMessage({ type: "error", text: res.error || "Failed to export platform data backup." });
        return;
      }

      // Generate downloadable unredacted JSON file
      const jsonString = JSON.stringify(res.backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `jozelio-complete-platform-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (res.summary) {
        setBackupStats(res.summary);
        setMessage({
          type: "success",
          text: `Master Platform Snapshot downloaded successfully! ${res.summary.totalRecords} total records exported across ${res.summary.totalTables} database tables.`,
        });
      }
    } catch (err: any) {
      console.error("Backup download error:", err);
      setMessage({ type: "error", text: err?.message || "Failed to download backup." });
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleTenantBanToggle = (tenantId: string, isBanned: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const res = await toggleTenantBan(tenantId, isBanned);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `Storefront project has been successfully ${isBanned ? "suspended/banned" : "reactivated"}.`
        });
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, isBanned } : t));
      }
    });
  };

  const handleUserBanToggle = (userId: string, isBanned: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const res = await toggleUserBan(userId, isBanned);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `User account has been successfully ${isBanned ? "suspended/banned" : "reactivated"}.`
        });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned } : u));
      }
    });
  };

  // Search and Filter States
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantTierFilter, setTenantTierFilter] = useState<string[]>(["all"]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string[]>(["all"]);

  // Deletion Modal Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    type: "delete_tenant" | "delete_user";
    id: string;
    name: string;
  } | null>(null);

  // Format Date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDateForInput = (d: Date | null | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Tenant limits management modal state
  const [managingTenant, setManagingTenant] = useState<TenantAdminView | null>(null);
  const [modalTier, setModalTier] = useState<"free" | "pro" | "enterprise">("free");
  const [modalBanned, setModalBanned] = useState(false);
  const [modalMenuLimit, setModalMenuLimit] = useState<string>("");
  const [modalLocationLimit, setModalLocationLimit] = useState<string>("");
  const [modalRateLimit, setModalRateLimit] = useState<string>("");
  const [modalSubdomainCooldown, setModalSubdomainCooldown] = useState<string>("");
  const [modalSubdomainActiveCooldown, setModalSubdomainActiveCooldown] = useState<boolean>(false);
  const [modalOwnerMaxProjects, setModalOwnerMaxProjects] = useState<string>("");
  const [modalBanReason, setModalBanReason] = useState("");
  const [modalBanDuration, setModalBanDuration] = useState("permanent");
  const [modalCustomBanDate, setModalCustomBanDate] = useState("");
  const [modalWarned, setModalWarned] = useState(false);
  const [modalWarningReason, setModalWarningReason] = useState("");
  const [modalSendMethod, setModalSendMethod] = useState<"inbox" | "email" | "both">("both");

  useEffect(() => {
    if (managingTenant) {
      setModalTier(managingTenant.tier);
      setModalBanned(managingTenant.isBanned);
      setModalMenuLimit(managingTenant.customMenuLimit !== null && managingTenant.customMenuLimit !== undefined ? String(managingTenant.customMenuLimit) : String(managingTenant.tier === "free" ? limitFree : managingTenant.tier === "pro" ? limitPro : limitEnt));
      setModalLocationLimit(managingTenant.customLocationLimit !== null && managingTenant.customLocationLimit !== undefined ? String(managingTenant.customLocationLimit) : String(locationLimit));
      setModalRateLimit(managingTenant.customRateLimit !== null && managingTenant.customRateLimit !== undefined ? String(managingTenant.customRateLimit) : "45");
      setModalSubdomainCooldown(managingTenant.customSubdomainCooldown !== null && managingTenant.customSubdomainCooldown !== undefined ? String(managingTenant.customSubdomainCooldown) : String(subdomainCooldownDays));
      setModalSubdomainActiveCooldown(!!managingTenant.subdomainLastChangedAt);
      setModalOwnerMaxProjects(managingTenant.ownerMaxProjects !== null && managingTenant.ownerMaxProjects !== undefined ? String(managingTenant.ownerMaxProjects) : "20");
      setModalBanReason(managingTenant.banReason || "");
      setModalWarned(managingTenant.isWarned || false);
      setModalWarningReason(managingTenant.warningReason || "");
      if (managingTenant.banExpiresAt) {
        setModalBanDuration("custom");
        setModalCustomBanDate(formatDateForInput(managingTenant.banExpiresAt));
      } else {
        setModalBanDuration("permanent");
        setModalCustomBanDate("");
      }
    }
  }, [managingTenant]);

  const prevTierRef = useRef(modalTier);
  useEffect(() => {
    const prevTier = prevTierRef.current;
    if (prevTier !== modalTier && managingTenant) {
      const prevDefault = prevTier === "free" ? limitFree : prevTier === "pro" ? limitPro : limitEnt;
      if (modalMenuLimit === String(prevDefault) || modalMenuLimit === "") {
        const newDefault = modalTier === "free" ? limitFree : modalTier === "pro" ? limitPro : limitEnt;
        setModalMenuLimit(String(newDefault));
      }
    }
    prevTierRef.current = modalTier;
  }, [modalTier, limitFree, limitPro, limitEnt, managingTenant, modalMenuLimit]);

  // User warning/limits modal state
  const [managingUser, setManagingUser] = useState<UserAdminView | null>(null);
  const [userModalBanned, setUserModalBanned] = useState(false);
  const [userModalBanReason, setUserModalBanReason] = useState("");
  const [userModalBanDuration, setUserModalBanDuration] = useState("permanent");
  const [userModalCustomBanDate, setUserModalCustomBanDate] = useState("");
  const [userModalWarned, setUserModalWarned] = useState(false);
  const [userModalWarningReason, setUserModalWarningReason] = useState("");
  const [userModalSendMethod, setUserModalSendMethod] = useState<"inbox" | "email" | "both">("both");
  const [modalUsernameCooldown, setModalUsernameCooldown] = useState<string>("");
  const [modalUsernameActiveCooldown, setModalUsernameActiveCooldown] = useState<boolean>(false);

  useEffect(() => {
    if (managingUser) {
      setUserModalBanned(managingUser.isBanned);
      setUserModalBanReason(managingUser.banReason || "");
      setUserModalWarned(managingUser.isWarned || false);
      setUserModalWarningReason(managingUser.warningReason || "");
      if (managingUser.banExpiresAt) {
        setUserModalBanDuration("custom");
        setUserModalCustomBanDate(formatDateForInput(managingUser.banExpiresAt));
      } else {
        setUserModalBanDuration("permanent");
        setUserModalCustomBanDate("");
      }
      setModalUsernameCooldown(managingUser.customUsernameCooldown !== null && managingUser.customUsernameCooldown !== undefined ? String(managingUser.customUsernameCooldown) : String(usernameCooldownDays));
      setModalUsernameActiveCooldown(!!managingUser.usernameLastChangedAt);
    }
  }, [managingUser, usernameCooldownDays]);

  // Platform Statistics
  const totalTenants = tenants.length;
  const freeCount = tenants.filter(t => t.tier === "free").length;
  const proCount = tenants.filter(t => t.tier === "pro").length;
  const entCount = tenants.filter(t => t.tier === "enterprise").length;

  const totalUsers = users.length;
  const superAdminCount = users.filter(u => u.role === "admin" || u.role === "owner").length;

  // Actions
  const handleTierChange = async (tenantId: string, newTier: "free" | "pro" | "enterprise") => {
    setMessage(null);
    const originalTenants = [...tenants];
    setTenants(tenants.map((t) => (t.id === tenantId ? { ...t, tier: newTier } : t)));

    startTransition(async () => {
      const res = await updateTenantTier(tenantId, newTier);
      if (res?.error) {
        setTenants(originalTenants);
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: `Project subscription tier updated successfully to ${newTier.toUpperCase()}!` });
      }
    });
  };

  const handleSaveTenantLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTenant) return;
    setMessage(null);

    const mLimit = modalMenuLimit.trim() === "" ? null : parseInt(modalMenuLimit);
    const lLimit = modalLocationLimit.trim() === "" ? null : parseInt(modalLocationLimit);
    const rLimit = modalRateLimit.trim() === "" ? null : parseInt(modalRateLimit);
    const sLimit = modalSubdomainCooldown.trim() === "" ? null : parseInt(modalSubdomainCooldown);
    const oLimit = modalOwnerMaxProjects.trim() === "" ? undefined : parseInt(modalOwnerMaxProjects);

    if (mLimit !== null && isNaN(mLimit)) {
      setMessage({ type: "error", text: "Menu limit must be a valid number" });
      return;
    }
    if (lLimit !== null && isNaN(lLimit)) {
      setMessage({ type: "error", text: "Location limit must be a valid number" });
      return;
    }
    if (rLimit !== null && isNaN(rLimit)) {
      setMessage({ type: "error", text: "Rate limit must be a valid number" });
      return;
    }
    if (sLimit !== null && isNaN(sLimit)) {
      setMessage({ type: "error", text: "Subdomain cooldown must be a valid number" });
      return;
    }
    if (oLimit !== undefined && isNaN(oLimit)) {
      setMessage({ type: "error", text: "Owner max projects must be a valid number" });
      return;
    }

    let banExpiresAt: Date | null = null;
    if (modalBanned) {
      if (modalBanDuration === "1h") {
        banExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      } else if (modalBanDuration === "1d") {
        banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (modalBanDuration === "3d") {
        banExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      } else if (modalBanDuration === "7d") {
        banExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (modalBanDuration === "30d") {
        banExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (modalBanDuration === "custom") {
        if (!modalCustomBanDate) {
          setMessage({ type: "error", text: "Please specify a custom ban lift date & time" });
          return;
        }
        banExpiresAt = new Date(modalCustomBanDate);
        if (isNaN(banExpiresAt.getTime())) {
          setMessage({ type: "error", text: "Invalid custom date specified" });
          return;
        }
      }
    }

    let cooldownAction: "enforce" | "clear" | "unchanged" = "unchanged";
    if (modalSubdomainActiveCooldown && !managingTenant.subdomainLastChangedAt) {
      cooldownAction = "enforce";
    } else if (!modalSubdomainActiveCooldown && managingTenant.subdomainLastChangedAt) {
      cooldownAction = "clear";
    }

    startTransition(async () => {
      // 1. Update subscription tier and limits
      const resLimits = await updateTenantLimits(managingTenant.id, {
        tier: modalTier,
        isBanned: modalBanned,
        customMenuLimit: mLimit,
        customLocationLimit: lLimit,
        customRateLimit: rLimit,
        customSubdomainCooldown: sLimit,
        subdomainCooldownAction: cooldownAction,
        ownerId: managingTenant.ownerId,
        ownerMaxProjects: oLimit
      });

      if (resLimits?.error) {
        setMessage({ type: "error", text: resLimits.error });
        return;
      }

      // 2. Update warnings and ban details
      const resBan = await updateTenantBanAndWarning(managingTenant.id, {
        isBanned: modalBanned,
        banReason: modalBanReason.trim() === "" ? null : modalBanReason,
        banExpiresAt,
        isWarned: modalWarned,
        warningReason: modalWarningReason.trim() === "" ? null : modalWarningReason,
        sendMethod: modalSendMethod
      });

      if (resBan?.error) {
        setMessage({ type: "error", text: resBan.error });
      } else {
        setTenants(tenants.map((t) => (t.id === managingTenant.id ? { 
          ...t, 
          tier: modalTier, 
          isBanned: modalBanned,
          customMenuLimit: mLimit,
          customLocationLimit: lLimit,
          customRateLimit: rLimit,
          customSubdomainCooldown: sLimit,
          subdomainLastChangedAt: cooldownAction === "enforce" ? new Date() : cooldownAction === "clear" ? null : t.subdomainLastChangedAt,
          ownerMaxProjects: oLimit !== undefined ? oLimit : t.ownerMaxProjects,
          banReason: modalBanReason.trim() === "" ? null : modalBanReason,
          banExpiresAt,
          isWarned: modalWarned,
          warningReason: modalWarningReason.trim() === "" ? null : modalWarningReason
        } : t)));
        setMessage({ type: "success", text: `Project settings updated successfully for ${managingTenant.businessName}!` });
        setManagingTenant(null);
      }
    });
  };

  const handleSaveUserLimitsAndWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingUser) return;
    setMessage(null);

    let banExpiresAt: Date | null = null;
    if (userModalBanned) {
      if (userModalBanDuration === "1h") {
        banExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      } else if (userModalBanDuration === "1d") {
        banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (userModalBanDuration === "3d") {
        banExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      } else if (userModalBanDuration === "7d") {
        banExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (userModalBanDuration === "30d") {
        banExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (userModalBanDuration === "custom") {
        if (!userModalCustomBanDate) {
          setMessage({ type: "error", text: "Please specify a custom ban lift date & time" });
          return;
        }
        banExpiresAt = new Date(userModalCustomBanDate);
        if (isNaN(banExpiresAt.getTime())) {
          setMessage({ type: "error", text: "Invalid custom date specified" });
          return;
        }
      }
    }

    const uLimit = modalUsernameCooldown.trim() === "" ? null : parseInt(modalUsernameCooldown);
    if (modalUsernameCooldown.trim() !== "" && isNaN(uLimit!)) {
      setMessage({ type: "error", text: "Username cooldown must be a valid number" });
      return;
    }

    let usernameCooldownAction: "enforce" | "clear" | "unchanged" = "unchanged";
    if (modalUsernameActiveCooldown && !managingUser.usernameLastChangedAt) {
      usernameCooldownAction = "enforce";
    } else if (!modalUsernameActiveCooldown && managingUser.usernameLastChangedAt) {
      usernameCooldownAction = "clear";
    }

    startTransition(async () => {
      const res = await updateUserBanAndWarning(managingUser.id, {
        isBanned: userModalBanned,
        banReason: userModalBanReason.trim() === "" ? null : userModalBanReason,
        banExpiresAt,
        isWarned: userModalWarned,
        warningReason: userModalWarningReason.trim() === "" ? null : userModalWarningReason,
        sendMethod: userModalSendMethod,
        customUsernameCooldown: uLimit,
        usernameCooldownAction
      });

      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setUsers(users.map((u) => (u.id === managingUser.id ? {
          ...u,
          isBanned: userModalBanned,
          banReason: userModalBanReason.trim() === "" ? null : userModalBanReason,
          banExpiresAt,
          isWarned: userModalWarned,
          warningReason: userModalWarningReason.trim() === "" ? null : userModalWarningReason,
          customUsernameCooldown: uLimit,
          usernameLastChangedAt: usernameCooldownAction === "enforce" ? new Date() : usernameCooldownAction === "clear" ? null : u.usernameLastChangedAt,
        } : u)));
        setMessage({ type: "success", text: `Account settings updated successfully for ${managingUser.name}!` });
        setManagingUser(null);
      }
    });
  };

  const handleRoleChange = async (targetUserId: string, newRole: "user" | "admin" | "owner") => {
    setMessage(null);
    if (targetUserId === currentOperatorId) {
      setMessage({ type: "error", text: "Security protection: You cannot modify your own administrative role." });
      return;
    }

    const originalUsers = [...users];
    setUsers(users.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u)));

    startTransition(async () => {
      const res = await updateUserRoleByAdmin(targetUserId, newRole);
      if (res?.error) {
        setUsers(originalUsers);
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: `User role updated successfully to ${newRole.toUpperCase()}!` });
      }
    });
  };

  const handleMaxProjectsChange = async (targetUserId: string, newMax: number) => {
    setMessage(null);
    const originalUsers = [...users];
    setUsers(users.map((u) => (u.id === targetUserId ? { ...u, maxProjects: newMax } : u)));

    startTransition(async () => {
      const res = await updateUserMaxProjects(targetUserId, newMax);
      if (res?.error) {
        setUsers(originalUsers);
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: `User project limit updated successfully to ${newMax}!` });
      }
    });
  };

  const handleDeleteTrigger = (type: "delete_tenant" | "delete_user", id: string, name: string) => {
    setConfirmModal({ type, id, name });
  };

  const handleConfirmDelete = () => {
    if (!confirmModal) return;
    const { type, id } = confirmModal;
    setConfirmModal(null);
    setMessage(null);

    startTransition(async () => {
      if (type === "delete_tenant") {
        const res = await deleteTenantByAdmin(id);
        if (res?.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setTenants(tenants.filter(t => t.id !== id));
          setMessage({ type: "success", text: "Storefront project and all associated items deleted successfully." });
        }
      } else if (type === "delete_user") {
        const res = await deleteUserByAdmin(id);
        if (res?.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setUsers(users.filter(u => u.id !== id));
          setMessage({ type: "success", text: "User account deleted successfully." });
        }
      }
    });
  };

  // Filter lists
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.businessName.toLowerCase().includes(tenantSearch.toLowerCase()) || 
                          t.subdomain.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                          t.id.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                          t.ownerEmail.toLowerCase().includes(tenantSearch.toLowerCase());
    let matchesTier = tenantTierFilter.includes("all");
    if (!matchesTier) {
      matchesTier = tenantTierFilter.some(filter => {
        if (filter === "free" || filter === "pro" || filter === "enterprise") {
          return t.tier === filter;
        }
        if (filter === "banned") return t.isBanned;
        if (filter === "warned") return t.isWarned;
        if (filter === "clean") return !t.isBanned && !t.isWarned;
        return false;
      });
    }
    return matchesSearch && matchesTier;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase()));
    let matchesRole = userRoleFilter.includes("all");
    if (!matchesRole) {
      matchesRole = userRoleFilter.some(filter => {
        if (filter === "admin" || filter === "owner" || filter === "user") {
          return u.role === filter;
        }
        if (filter === "banned") return u.isBanned;
        if (filter === "warned") return u.isWarned;
        if (filter === "clean") return !u.isBanned && !u.isWarned;
        return false;
      });
    }
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col gap-8 text-brand-blue font-sans">
      
      {/* Infrastructure Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tenants Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-brand-blue/60">Total Storefront Projects</h3>
            <Globe className="w-5 h-5 text-brand-orange shrink-0" />
          </div>
          <div>
            <div className="font-display font-black text-4xl text-brand-blue">{totalTenants}</div>
            <div className="flex gap-2 mt-2 font-mono text-[9px] font-bold">
              <span className="px-1.5 py-0.5 border border-brand-blue bg-brand-grey/25 text-brand-blue">FREE: {freeCount}</span>
              <span className="px-1.5 py-0.5 border border-brand-orange bg-brand-orange/10 text-brand-orange">PRO: {proCount}</span>
              <span className="px-1.5 py-0.5 border border-purple-500 bg-purple-500/10 text-purple-700">ENT: {entCount}</span>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-brand-blue/60">Total Registered Users</h3>
            <Users className="w-5 h-5 text-brand-orange shrink-0" />
          </div>
          <div>
            <div className="font-display font-black text-4xl text-brand-blue">{totalUsers}</div>
            <div className="flex gap-2 mt-2 font-mono text-[9px] font-bold">
              <span className="px-1.5 py-0.5 border border-brand-blue bg-brand-grey/25 text-brand-blue">STANDARD: {totalUsers - superAdminCount}</span>
              <span className="px-1.5 py-0.5 border border-brand-orange bg-brand-orange/10 text-brand-orange">OPERATORS: {superAdminCount}</span>
            </div>
          </div>
        </div>

        {/* Storefront Type Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-brand-blue/60">Storefront Type</h3>
            <Layers className="w-5 h-5 text-brand-orange shrink-0" />
          </div>
          <div className="relative">
            <BrutalistSelect
              value={storefrontFilter}
              onChange={setStorefrontFilter}
              options={[
                { value: "bocado", label: "Bocado (Restaurant/Menu)" }
              ]}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b-2 border-brand-blue gap-2">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-6 py-3 font-display font-black text-sm uppercase tracking-wider border-t-2 border-x-2 border-brand-blue transition-all cursor-pointer ${
            activeTab === "tenants"
              ? "bg-brand-white text-brand-blue border-b-2 border-b-brand-white -mb-[2px]"
              : "bg-brand-grey/20 text-brand-blue/50 border-b-2 border-b-brand-blue hover:text-brand-blue"
          }`}
        >
          Storefront Projects ({totalTenants})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 font-display font-black text-sm uppercase tracking-wider border-t-2 border-x-2 border-brand-blue transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-brand-white text-brand-blue border-b-2 border-b-brand-white -mb-[2px]"
              : "bg-brand-grey/20 text-brand-blue/50 border-b-2 border-b-brand-blue hover:text-brand-blue"
          }`}
        >
          User Accounts ({totalUsers})
        </button>
        <button
          onClick={() => setActiveTab("accounting")}
          className={`px-6 py-3 font-display font-black text-sm uppercase tracking-wider border-t-2 border-x-2 border-brand-blue transition-all cursor-pointer ${
            activeTab === "accounting"
              ? "bg-brand-white text-brand-blue border-b-2 border-b-brand-white -mb-[2px]"
              : "bg-brand-grey/20 text-brand-blue/50 border-b-2 border-b-brand-blue hover:text-brand-blue"
          }`}
        >
          Accounting & Finances
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab("owner_tools")}
            className={`px-6 py-3 font-display font-black text-sm uppercase tracking-wider border-t-2 border-x-2 border-brand-blue transition-all cursor-pointer ${
              activeTab === "owner_tools"
                ? "bg-brand-white text-brand-blue border-b-2 border-b-brand-white -mb-[2px]"
                : "bg-brand-grey/20 text-brand-blue/50 border-b-2 border-b-brand-blue hover:text-brand-blue"
            }`}
          >
            Owner Settings
          </button>
        )}
      </div>

      {/* Message Notifications Banner */}
      {message && (
        <div
          className={`p-4 text-xs font-bold flex items-start gap-2 border-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
              : "bg-rose-50 border-rose-500 text-rose-800"
          }`}
        >
          <span>
            {message.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </span>
          <p>{message.text}</p>
        </div>
      )}

      {/* TAB CONTENT: TENANTS */}
      {activeTab === "tenants" && (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-brand-white border-2 border-brand-blue p-4 shadow-[2px_2px_0px_#113669]">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-blue/50" />
              <input
                type="text"
                placeholder="SEARCH..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs"
              />
            </div>
            {/* Tier Filter */}
            <CustomFilterDropdown
              value={tenantTierFilter}
              onChange={setTenantTierFilter}
              icon={Filter}
              options={[
                { value: "all", label: "ALL PROJECTS" },
                { value: "free", label: "FREE ONLY" },
                { value: "pro", label: "PRO ONLY" },
                { value: "enterprise", label: "ENTERPRISE ONLY" },
                { value: "banned", label: "BANNED ONLY" },
                { value: "warned", label: "WARNED ONLY" },
                { value: "clean", label: "CLEAN (NO BANS/WARNINGS)" },
              ]}
            />
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto border-2 border-brand-blue bg-brand-white shadow-[4px_4px_0px_#113669]">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-blue bg-brand-grey/40 text-brand-blue font-mono text-xs font-black uppercase tracking-wider text-start">
                  <th className="p-4 text-start">Business Name & Subdomain</th>
                  <th className="p-4 text-start">Owner Account</th>
                  <th className="p-4 text-start">Subscription Tier</th>
                  <th className="p-4 text-start">Date Registered</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-blue/10 text-sm">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-brand-blue/50 font-mono font-bold">
                      No storefront projects match active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-brand-grey/15 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-display font-black text-brand-blue text-sm uppercase">{t.businessName}</div>
                          {t.isBanned && (
                            <span className="bg-rose-600 text-brand-white text-[8px] px-1.5 py-0.5 font-mono font-black uppercase rounded-sm border border-brand-blue shadow-[1px_1px_0px_#113669]" title={t.banReason ? `Reason: ${t.banReason}` : undefined}>
                              BANNED {t.banExpiresAt && `(UNTIL ${new Date(t.banExpiresAt).toLocaleDateString()})`}
                            </span>
                          )}
                          {t.isWarned && (
                            <span className="bg-amber-500 text-brand-blue text-[8px] px-1.5 py-0.5 font-mono font-black uppercase rounded-sm border border-brand-blue shadow-[1px_1px_0px_#113669]" title={t.warningReason ? `Reason: ${t.warningReason}` : undefined}>
                              WARNED
                            </span>
                          )}
                        </div>
                        <a 
                          href={`http://${t.subdomain}.jozelio.dev:3000`} 
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] text-brand-orange font-bold mt-0.5 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>{t.subdomain}.jozelio.dev</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </td>
                      <td className="p-4">
                        <div className="text-brand-blue font-bold">{t.ownerName}</div>
                        <div className="font-mono text-[10px] text-brand-blue/60 mt-0.5">{t.ownerEmail}</div>
                      </td>
                      <td className="p-4">
                        <BrutalistSelect
                          value={t.tier}
                          onChange={(val) => handleTierChange(t.id, val as any)}
                          disabled={isPending}
                          options={[
                            { value: "free", label: "FREE" },
                            { value: "pro", label: "PRO" },
                            { value: "enterprise", label: "ENTERPRISE" }
                          ]}
                          className="w-[120px]"
                          buttonClassName="!h-8 !px-3 !py-1.5 !shadow-none border-brand-blue"
                        />
                      </td>
                      <td className="p-4 font-mono text-xs text-brand-blue/60 font-bold">
                        {new Date(t.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-center">
                          <div className="flex flex-col gap-1 items-center">

                        {isOwner ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setManagingTenant(t)}
                              className="px-2.5 py-1.5 border-2 border-brand-blue bg-brand-grey text-brand-blue font-mono text-[10px] uppercase font-black tracking-wider hover:bg-brand-orange transition-colors cursor-pointer shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTrigger("delete_tenant", t.id, t.businessName)}
                              className="p-1.5 border-2 border-brand-blue text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTenantBanToggle(t.id, !t.isBanned)}
                              disabled={isPending}
                              className={`px-3 py-1.5 border-2 font-mono text-[10px] font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 ${
                                t.isBanned
                                  ? "border-emerald-600 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                  : "border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white"
                              }`}
                            >
                              {t.isBanned ? "Unban Store" : "Ban Store"}
                            </button>
                            {t.isBanned && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTrigger("delete_tenant", t.id, t.businessName)}
                                className="p-1.5 border-2 border-brand-blue text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      
                          </div>
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-brand-white border-2 border-brand-blue p-4 shadow-[2px_2px_0px_#113669]">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-blue/50" />
              <input
                type="text"
                placeholder="ENTER USERNAME OR EMAIL HERE"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue font-semibold focus:outline-none focus:bg-brand-grey/25 transition-all text-xs"
              />
            </div>
            {/* Role Filter */}
            <CustomFilterDropdown
              value={userRoleFilter}
              onChange={setUserRoleFilter}
              icon={Filter}
              options={[
                { value: "all", label: "ALL USERS" },
                { value: "admin", label: "ADMINS" },
                { value: "owner", label: "OWNERS" },
                { value: "user", label: "STANDARD USERS" },
                { value: "banned", label: "BANNED ONLY" },
                { value: "warned", label: "WARNED ONLY" },
                { value: "clean", label: "CLEAN (NO BANS/WARNINGS)" },
              ]}
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border-2 border-brand-blue bg-brand-white shadow-[4px_4px_0px_#113669]">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-blue bg-brand-grey/40 text-brand-blue font-mono text-xs font-black uppercase tracking-wider text-start">
                  <th className="p-4 text-start">User Name & Email</th>
                  <th className="p-4 text-start">Access Role</th>
                  <th className="p-4 text-start">Registration Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-blue/10 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-brand-blue/50 font-mono font-bold">
                      No user accounts match active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentOperatorId;
                    return (
                      <tr key={u.id} className="hover:bg-brand-grey/15 transition-colors">
                        <td className="p-4">
                          <div className="font-display font-black text-brand-blue text-sm uppercase flex flex-wrap items-center gap-2">
                            <span>{u.name}</span>
                            {u.isBanned && (
                              <span className="bg-rose-600 text-brand-white text-[8px] px-1.5 py-0.5 font-mono font-black uppercase rounded-sm border border-brand-blue shadow-[1px_1px_0px_#113669]" title={u.banReason ? `Reason: ${u.banReason}` : undefined}>
                                BANNED {u.banExpiresAt && `(UNTIL ${new Date(u.banExpiresAt).toLocaleDateString()})`}
                              </span>
                            )}
                            {u.isWarned && (
                              <span className="bg-amber-500 text-brand-blue text-[8px] px-1.5 py-0.5 font-mono font-black uppercase rounded-sm border border-brand-blue shadow-[1px_1px_0px_#113669]" title={u.warningReason ? `Reason: ${u.warningReason}` : undefined}>
                                WARNED
                              </span>
                            )}
                            {u.username && (
                              <span className="font-mono text-[9px] text-brand-orange font-black">
                                @{u.username}
                              </span>
                            )}
                            {isSelf && (
                              <span className="bg-brand-orange text-brand-white font-mono text-[7px] font-black uppercase px-1 rounded-sm border border-brand-blue shadow-[0.5px_0.5px_0px_#113669]">
                                You
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-brand-blue/60 mt-0.5">{u.email}</div>
                          
                          {/* Owned Projects Plan Management */}
                          {(() => {
                            const rawUserTenants = tenants.filter(t => t.ownerEmail.toLowerCase() === u.email.toLowerCase());
                            const userTenants = Array.from(new Map(rawUserTenants.map(t => [t.id, t])).values());
                            
                            if (userTenants.length === 0) return null;
                            return (
                              <div className="mt-3 pt-2 border-t border-brand-blue/10">
                                <div className="font-mono text-[8px] font-bold text-brand-blue/40 uppercase tracking-wider mb-2">
                                  Owned Storefronts & Subscriptions:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {userTenants.map((ut) => (
                                    <div 
                                      key={ut.id} 
                                      className={`flex items-center gap-2 px-2 py-1 border-2 text-brand-blue font-mono text-[10px] font-bold uppercase shadow-[1px_1px_0px_#113669] transition-transform hover:-translate-y-[0.5px] ${
                                        ut.isBanned 
                                          ? "border-rose-500 bg-rose-50/50" 
                                          : "border-brand-blue bg-brand-white"
                                      }`}
                                    >
                                      <span className={`truncate max-w-[120px] ${ut.isBanned ? "line-through text-rose-500" : "text-brand-blue/90"}`} title={ut.subdomain}>
                                        {ut.businessName}
                                      </span>
                                      <BrutalistSelect
                                        value={ut.tier}
                                        onChange={(val) => handleTierChange(ut.id, val as any)}
                                        disabled={isPending}
                                        options={[
                                          { value: "free", label: "FREE" },
                                          { value: "pro", label: "PRO" },
                                          { value: "enterprise", label: "ENTERPRISE" }
                                        ]}
                                        className="w-[110px]"
                                        buttonClassName="!h-6 !px-1.5 !py-0.5 !text-[9px] !shadow-none border-brand-blue"
                                      />
                                      {ut.isBanned && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" title="Suspended" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-2">
                            <BrutalistSelect
                              value={u.role}
                              onChange={(val) => handleRoleChange(u.id, val as any)}
                              disabled={isPending || isSelf || (u.role === "owner" && !isOwner)}
                              options={[
                                { value: "user", label: "Standard User" },
                                { value: "admin", label: "Admin" },
                                ...(isOwner ? [{ value: "owner", label: "Owner" }] : [])
                              ]}
                              className="w-[160px]"
                              buttonClassName={`!h-8 !px-3 !py-1.5 !shadow-none ${(u.role === "admin" || u.role === "owner") ? "bg-brand-orange/10 border-brand-orange" : ""}`}
                            />
                            
                            <div className="flex items-center mt-1.5 border-2 border-brand-blue shadow-[1.5px_1.5px_0px_#113669] w-fit bg-brand-white transition-transform hover:-translate-y-[0.5px]">
                              <span className="px-2 py-1 bg-brand-grey/20 border-r-2 border-brand-blue font-mono text-[9px] font-black text-brand-blue uppercase tracking-wider">
                                Max Limit:
                              </span>
                              <input
                                type="number"
                                min="1"
                                defaultValue={u.maxProjects || 20}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val > 0 && val !== (u.maxProjects || 20)) {
                                    handleMaxProjectsChange(u.id, val);
                                  }
                                }}
                                disabled={isPending}
                                className="w-12 px-1 py-1 bg-transparent text-brand-blue text-center font-mono text-[10px] font-black focus:outline-none focus:bg-brand-orange/10 transition-colors disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-brand-blue/60 font-bold">
                          {new Date(u.createdAt).toLocaleDateString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            {isOwner && !isSelf && (
                              <button
                                type="button"
                                onClick={() => setMessageTargetUser({ id: u.id, name: u.name || u.email })}
                                disabled={isPending}
                                className="px-3 py-1 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white font-mono text-[9px] font-black uppercase tracking-wider transition-colors shadow-[1px_1px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-1 w-full"
                              >
                                <Mail className="w-3 h-3" /> Msg
                              </button>
                            )}
                            <div className="flex flex-col gap-2 items-center w-full">
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => setManagingUser(u)}
                                  disabled={isPending}
                                  className="px-3 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white font-mono text-[10px] font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 w-full"
                                >
                                  Safety & Status
                                </button>
                              )}
                              {u.isBanned && isOwner && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrigger("delete_user", u.id, u.name)}
                                  disabled={isPending}
                                  className="px-3 py-1.5 border-2 border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700 transition-colors cursor-pointer shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none font-mono text-[10px] font-black uppercase tracking-wider w-full flex items-center justify-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete Account
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OWNER TOOLS */}
      {activeTab === "owner_tools" && isOwner && (
        <div className="flex flex-col gap-8">
          {/* Header Dashboard Banner */}
          <div className="bg-brand-white border-4 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-brand-orange/10 border-2 border-brand-orange flex items-center justify-center font-bold text-sm text-brand-orange">
                  👑
                </span>
                <h3 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">Platform Owner Console</h3>
              </div>
              <p className="text-xs text-brand-blue/70 font-semibold mt-1.5 font-sans">
                Global variables, platform parameters, system maintenance, and broadcast systems.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-brand-orange/10 border-2 border-brand-orange/30 px-3 py-1 font-mono text-[9px] font-black text-brand-orange uppercase tracking-wider">
              System Owner Mode Active
            </div>
          </div>

          {ownerLoading ? (
            <div className="bg-brand-white border-4 border-brand-blue p-12 shadow-[6px_6px_0px_0px_#113669] flex flex-col items-center justify-center font-mono text-xs font-black text-brand-blue/60 uppercase">
              <span className="animate-spin mb-3 text-lg">⏳</span> Loading Configuration...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Card 1: Configuration Form */}
              <div className="lg:col-span-2 bg-brand-white border-4 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-brand-blue/15 pb-4">
                  <Sliders className="w-4 h-4 text-brand-orange" />
                  <h4 className="font-display font-black text-sm uppercase text-brand-blue tracking-wide">
                    Global Settings
                  </h4>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {/* Disable registrations toggle */}
                  <div className="flex items-center justify-between p-4 border-2 border-brand-blue bg-brand-bg/10 shadow-[2px_2px_0px_#113669] hover:-translate-y-0.5 transition-transform duration-200">
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="font-display font-black text-xs uppercase text-brand-blue flex items-center gap-1.5">
                        🚫 Lock Registration Engine
                      </span>
                      <span className="text-[9px] text-brand-blue/60 font-semibold leading-relaxed">
                        Suspend all new user signups immediately. Existing accounts remain unaffected.
                      </span>
                    </div>
                    <label className="relative flex items-center justify-center w-6 h-6 border-2 border-brand-blue bg-brand-white hover:border-brand-orange cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={disableRegistrations}
                        onChange={(e) => setDisableRegistrations(e.target.checked)}
                        className="absolute opacity-0 cursor-pointer w-full h-full"
                      />
                      {disableRegistrations && <Check className="w-4 h-4 text-brand-orange" />}
                    </label>
                  </div>

                  {/* Menu items limit configuration */}
                  <div className="border-2 border-brand-blue p-4 space-y-4">
                    <div className="font-mono text-[10px] font-black uppercase text-brand-blue/80 tracking-widest border-b border-brand-blue/15 pb-2 flex items-center gap-1.5">
                      📊 Plan Limits (Menu Listings Allowed)
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5 bg-brand-bg/10 p-2.5 border border-brand-blue/30">
                        <span className="font-mono text-[8px] font-black text-brand-blue/60 uppercase text-center">FREE PLAN</span>
                        <input
                          type="number"
                          min="1"
                          value={limitFree}
                          onChange={(e) => setLimitFree(parseInt(e.target.value) || 0)}
                          className="w-full h-9 px-2 border-2 border-brand-blue bg-brand-white font-mono text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 bg-brand-bg/10 p-2.5 border border-brand-blue/30">
                        <span className="font-mono text-[8px] font-black text-brand-blue/60 uppercase text-center">PRO PLAN</span>
                        <input
                          type="number"
                          min="1"
                          value={limitPro}
                          onChange={(e) => setLimitPro(parseInt(e.target.value) || 0)}
                          className="w-full h-9 px-2 border-2 border-brand-blue bg-brand-white font-mono text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 bg-brand-bg/10 p-2.5 border border-brand-blue/30">
                        <span className="font-mono text-[8px] font-black text-brand-blue/60 uppercase text-center">ENTERPRISE</span>
                        <input
                          type="number"
                          min="1"
                          value={limitEnt}
                          onChange={(e) => setLimitEnt(parseInt(e.target.value) || 0)}
                          className="w-full h-9 px-2 border-2 border-brand-blue bg-brand-white font-mono text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subdomain Cooldown configuration */}
                  <div className="border-2 border-brand-blue p-4 space-y-4">
                    <div className="font-mono text-[10px] font-black uppercase text-brand-blue/80 tracking-widest border-b border-brand-blue/15 pb-2 flex items-center gap-1.5">
                      ⏳ Subdomain Cooldown Rate Limit
                    </div>
                    <div className="flex flex-col gap-1.5 bg-brand-bg/10 p-3 border border-brand-blue/30">
                      <span className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">
                        Cooldown Period (Days)
                      </span>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="0"
                          value={subdomainCooldownDays}
                          onChange={(e) => setSubdomainCooldownDays(parseInt(e.target.value) || 0)}
                          className="w-24 h-9 px-2 border-2 border-brand-blue bg-brand-white font-mono text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                        />
                        <span className="text-[9px] text-brand-blue/50 font-semibold leading-relaxed">
                          Enforce a lock duration before users can change their subdomain prefix again. 
                          Set to <strong>0</strong> to disable the rate limit entirely.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Username Cooldown configuration */}
                  <div className="border-2 border-brand-blue p-4 space-y-4">
                    <div className="font-mono text-[10px] font-black uppercase text-brand-blue/80 tracking-widest border-b border-brand-blue/15 pb-2 flex items-center gap-1.5">
                      ⏳ Username Cooldown Rate Limit
                    </div>
                    <div className="flex flex-col gap-1.5 bg-brand-bg/10 p-3 border border-brand-blue/30">
                      <span className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">
                        Cooldown Period (Days)
                      </span>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="0"
                          value={usernameCooldownDays}
                          onChange={(e) => setUsernameCooldownDays(parseInt(e.target.value) || 0)}
                          className="w-24 h-9 px-2 border-2 border-brand-blue bg-brand-white font-mono text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                        />
                        <span className="text-[9px] text-brand-blue/50 font-semibold leading-relaxed">
                          Enforce a lock duration before users can change their username prefix again. 
                          Set to <strong>0</strong> to disable the rate limit entirely.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location limit configuration */}
                  <div className="border-2 border-brand-blue p-4 space-y-4">
                    <div className="font-mono text-[10px] font-black uppercase text-brand-blue/80 tracking-widest border-b border-brand-blue/15 pb-2 flex items-center gap-1.5">
                      📍 Storefront Location & Branch Limit
                    </div>
                    <div className="flex flex-col gap-1.5 bg-brand-bg/10 p-3 border border-brand-blue/30">
                      <span className="font-mono text-[8px] font-black text-brand-blue/60 uppercase">
                        Max Allowed Branches
                      </span>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={locationLimit}
                          onChange={(e) => setLocationLimit(parseInt(e.target.value) || 1)}
                          className="w-24 h-9 px-2 border-2 border-brand-blue bg-brand-white font-mono text-xs font-black text-brand-blue text-center focus:outline-none focus:border-brand-orange"
                        />
                        <span className="text-[9px] text-brand-blue/50 font-semibold leading-relaxed">
                          Define the maximum number of additional branches a tenant business can configure.
                          The default value is <strong>30</strong>.
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-11 px-6 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-xs uppercase font-black tracking-widest shadow-[3px_3px_0px_#113669] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none hover:bg-brand-blue hover:text-brand-orange hover:border-brand-orange transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Applying Configuration..." : "Save Settings Configuration"}
                  </button>
                </form>
              </div>

              {/* Column 2: Stats & Maintenance */}
              <div className="flex flex-col gap-8">
                {/* Statistics Cards */}
                <div className="bg-brand-white border-4 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] flex flex-col gap-6">
                  <div className="flex items-center gap-2 border-b border-brand-blue/15 pb-4">
                    <Database className="w-4 h-4 text-brand-orange" />
                    <h4 className="font-display font-black text-sm uppercase text-brand-blue tracking-wide">
                      Telemetry
                    </h4>
                  </div>

                  {/* Brutalist Stats Widgets */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border-2 border-brand-blue bg-brand-bg/10 shadow-[2px_2px_0px_#113669]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👤</span>
                        <span className="font-mono text-[9px] font-black text-brand-blue/80 uppercase">Total Accounts</span>
                      </div>
                      <span className="font-mono text-lg font-black text-brand-orange">{totalUsers}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border-2 border-brand-blue bg-brand-bg/10 shadow-[2px_2px_0px_#113669]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📁</span>
                        <span className="font-mono text-[9px] font-black text-brand-blue/80 uppercase">Active Projects</span>
                      </div>
                      <span className="font-mono text-lg font-black text-brand-orange">{totalTenants}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border-2 border-brand-blue bg-brand-bg/10 shadow-[2px_2px_0px_#113669]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🍳</span>
                        <span className="font-mono text-[9px] font-black text-brand-blue/80 uppercase">Menu Catalog Items</span>
                      </div>
                      <span className="font-mono text-lg font-black text-brand-orange">{totalMenuItems}</span>
                    </div>
                  </div>
                </div>

                {/* Database Maintenance Tools */}
                <div className="bg-brand-white border-4 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] flex flex-col gap-6">
                  <div className="flex items-center gap-2 border-b border-brand-blue/15 pb-4">
                    <Settings className="w-4 h-4 text-brand-orange" />
                    <h4 className="font-display font-black text-sm uppercase text-brand-blue tracking-wide">
                      Maintenance
                    </h4>
                  </div>

                  <p className="text-[10px] text-brand-blue/60 font-semibold leading-relaxed">
                    Clear dead database rows and optimize disk performance.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleClearSessions}
                      disabled={isPending}
                      className="w-full h-11 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-[9px] uppercase font-black tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-600 transition-colors shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      🧹 Purge Expired Sessions
                    </button>
                    <button
                      type="button"
                      onClick={handleVacuumDatabase}
                      disabled={isPending}
                      className="w-full h-11 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-[9px] uppercase font-black tracking-widest hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-600 transition-colors shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      ⚡ Vacuum D1 Optimize
                    </button>
                  </div>
                </div>

                {/* Platform Master Data Backup & Disaster Recovery */}
                <div className="bg-brand-white border-4 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-brand-blue/15 pb-4">
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-brand-orange" />
                      <div>
                        <h4 className="font-display font-black text-sm uppercase text-brand-blue tracking-wide">
                          Full Platform Backup
                        </h4>
                        <span className="font-mono text-[9px] text-brand-blue/50 font-bold uppercase block">
                          Cold Storage • 100% Unredacted JSON
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 border border-brand-blue bg-brand-orange/10 font-mono text-[9px] font-black text-brand-orange uppercase">
                      Owner Only
                    </span>
                  </div>

                  <p className="text-[10px] text-brand-blue/70 font-semibold leading-relaxed">
                    Export an exhaustive snapshot of the entire Jozelio platform database — including all user accounts, active sessions, OAuth links, storefronts, team memberships, complete menu catalogs, analytics events, system variables, notifications, and accounting ledger records.
                  </p>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                    <div className="p-2 border border-brand-blue/30 bg-brand-bg/10 text-center">
                      <span className="text-brand-blue/50 block text-[8px] uppercase">Engine</span>
                      <strong className="text-brand-blue font-bold">Cloudflare D1</strong>
                    </div>
                    <div className="p-2 border border-brand-blue/30 bg-brand-bg/10 text-center">
                      <span className="text-brand-blue/50 block text-[8px] uppercase">Scope</span>
                      <strong className="text-brand-blue font-bold">11+ Tables</strong>
                    </div>
                    <div className="p-2 border border-brand-blue/30 bg-brand-bg/10 text-center">
                      <span className="text-brand-blue/50 block text-[8px] uppercase">Format</span>
                      <strong className="text-brand-orange font-bold">Structured JSON</strong>
                    </div>
                    <div className="p-2 border border-brand-blue/30 bg-brand-bg/10 text-center">
                      <span className="text-brand-blue/50 block text-[8px] uppercase">Integrity</span>
                      <strong className="text-emerald-700 font-bold">100% Complete</strong>
                    </div>
                  </div>

                  {backupStats && (
                    <div className="p-3 bg-emerald-50 border-2 border-emerald-600 font-mono text-[10px] space-y-1">
                      <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Last Export Successful</span>
                      </div>
                      <div className="text-emerald-900/80 text-[9px]">
                        <strong>{backupStats.totalRecords} records</strong> exported across <strong>{backupStats.totalTables} tables</strong> at {new Date(backupStats.exportedAt).toLocaleTimeString()}.
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadPlatformBackup}
                    disabled={isExportingBackup}
                    className="w-full h-12 border-2 border-brand-blue bg-brand-orange hover:bg-brand-blue text-brand-white hover:text-brand-orange font-mono text-[10px] uppercase font-black tracking-wider shadow-[3px_3px_0px_#113669] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className={`w-4 h-4 ${isExportingBackup ? "animate-bounce" : ""}`} />
                    <span>
                      {isExportingBackup ? "Exporting Full Platform Snapshot..." : "Download Entire Platform Data (.JSON)"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Full Width Broadcast Card */}
              <div className="lg:col-span-3 bg-brand-white border-4 border-brand-blue p-6 shadow-[6px_6px_0px_0px_#113669] flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-brand-blue/15 pb-4">
                  <Mail className="w-4 h-4 text-brand-orange" />
                  <h4 className="font-display font-black text-sm uppercase text-brand-blue tracking-wide">
                    Global Broadcast Console
                  </h4>
                </div>

                <form onSubmit={handleSendGlobalMessage} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-black uppercase tracking-widest text-brand-blue/80 flex items-center gap-1">
                        ✍️ Broadcast Message Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={globalSubject}
                        onChange={(e) => setGlobalSubject(e.target.value)}
                        placeholder="ENTER NOTIFICATION SUBJECT HERE"
                        className="w-full h-10 px-3 border-2 border-brand-blue font-semibold text-sm focus:outline-none focus:border-brand-orange bg-brand-white text-brand-blue placeholder:text-brand-blue/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] font-black uppercase tracking-widest text-brand-blue/80 flex items-center gap-1">
                        📝 Announcement Content
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={globalBody}
                        onChange={(e) => setGlobalBody(e.target.value)}
                        placeholder="ENTER ANNOUNCEMENT DETAILS HERE"
                        className="w-full border-2 border-brand-blue p-3 font-semibold text-sm focus:outline-none focus:border-brand-orange bg-brand-white text-brand-blue resize-none placeholder:text-brand-blue/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center pt-3 border-t border-brand-blue/10">
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border-2 border-brand-blue bg-brand-white group-hover:border-brand-orange transition-colors">
                          <input
                            type="checkbox"
                            checked={globalSendToInbox}
                            onChange={(e) => setGlobalSendToInbox(e.target.checked)}
                            className="absolute opacity-0 cursor-pointer w-full h-full"
                          />
                          {globalSendToInbox && <Check className="w-3.5 h-3.5 text-brand-orange" />}
                        </div>
                        <span className="font-mono text-[9px] font-black text-brand-blue uppercase tracking-widest">
                          Platform Inbox
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border-2 border-brand-blue bg-brand-white group-hover:border-brand-orange transition-colors">
                          <input
                            type="checkbox"
                            checked={globalSendAsEmail}
                            onChange={(e) => setGlobalSendAsEmail(e.target.checked)}
                            className="absolute opacity-0 cursor-pointer w-full h-full"
                          />
                          {globalSendAsEmail && <Check className="w-3.5 h-3.5 text-brand-orange" />}
                        </div>
                        <span className="font-mono text-[9px] font-black text-brand-blue uppercase tracking-widest">
                          Email Delivery
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingGlobal || (!globalSendToInbox && !globalSendAsEmail)}
                      className="px-6 h-11 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-xs uppercase font-black tracking-widest shadow-[3px_3px_0px_#113669] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none hover:bg-brand-blue hover:text-brand-orange hover:border-brand-orange transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {isSendingGlobal ? "Broadcasting message..." : "Broadcast Global Message"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ACCOUNTING & FINANCES */}
      {activeTab === "accounting" && (
        <AccountingSection
          initialTransactions={initialTransactions || []}
          tenants={tenants.map((t) => ({ id: t.id, businessName: t.businessName, tier: t.tier }))}
          isOwner={isOwner}
          currentOperatorId={currentOperatorId}
        />
      )}

      {/* Message User Modal */}
      {messageTargetUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-blue/80 backdrop-blur-sm">
          <div className="bg-brand-bg w-full max-w-lg border-4 border-brand-blue shadow-[8px_8px_0px_#113669] p-6 relative">

            <h2 className="font-display font-black text-2xl uppercase text-brand-blue tracking-tighter mb-1">
              Send Message
            </h2>
            <p className="text-xs font-semibold text-brand-blue/70 mb-6 font-mono">
              To: {messageTargetUser.name}
            </p>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-black text-brand-blue uppercase tracking-widest">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full h-10 border-2 border-brand-blue px-3 font-semibold text-sm focus:outline-none focus:border-brand-orange bg-brand-white text-brand-blue"
                  placeholder="ENTER MESSAGE SUBJECT HERE"
                />
              </div>
              
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-black text-brand-blue uppercase tracking-widest">
                  Message Body
                </label>
                <textarea
                  required
                  rows={5}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full border-2 border-brand-blue p-3 font-semibold text-sm focus:outline-none focus:border-brand-orange bg-brand-white text-brand-blue resize-none"
                  placeholder="ENTER MESSAGE CONTENT HERE"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border-2 border-brand-blue bg-brand-white group-hover:border-brand-orange transition-colors">
                    <input
                      type="checkbox"
                      checked={sendToInbox}
                      onChange={(e) => setSendToInbox(e.target.checked)}
                      className="absolute opacity-0 cursor-pointer w-full h-full"
                    />
                    {sendToInbox && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                  </div>
                  <span className="font-mono text-[10px] font-black text-brand-blue uppercase tracking-widest">
                    Platform Inbox
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border-2 border-brand-blue bg-brand-white group-hover:border-brand-orange transition-colors">
                    <input
                      type="checkbox"
                      checked={sendAsEmail}
                      onChange={(e) => setSendAsEmail(e.target.checked)}
                      className="absolute opacity-0 cursor-pointer w-full h-full"
                    />
                    {sendAsEmail && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                  </div>
                  <span className="font-mono text-[10px] font-black text-brand-blue uppercase tracking-widest">
                    Email Delivery
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t-2 border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => setMessageTargetUser(null)}
                  disabled={isSendingMessage}
                  className="px-6 h-10 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage || (!sendToInbox && !sendAsEmail)}
                  className="px-6 h-10 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_#113669] hover:bg-brand-blue hover:text-brand-orange hover:border-brand-orange transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-md w-full shadow-[8px_8px_0px_#f58a2d] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-brand-orange mb-4">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="font-display font-black text-base uppercase tracking-wider">
                Platform Safety Warning
              </h3>
            </div>
            
            <p className="text-sm font-semibold text-brand-blue leading-relaxed mb-6">
              Are you absolutely sure you want to delete{" "}
              <strong className="underline text-brand-orange font-bold">
                {confirmModal.name}
              </strong>
              ? This action is highly destructive, permanent, and cannot be undone.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 h-10 border-2 border-brand-blue bg-brand-grey text-brand-blue font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-bg transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-10 border-2 border-brand-blue bg-rose-600 text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-rose-700 transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {managingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-lg w-full shadow-[8px_8px_0px_#f58a2d] animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-brand-blue pb-3 mb-4 shrink-0">
              <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider">
                Manage Project Limits: {managingTenant.businessName}
              </h3>
              <button 
                type="button" 
                onClick={() => setManagingTenant(null)}
                className="text-brand-blue hover:text-brand-orange transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenantLimits} className="flex-grow flex flex-col min-h-0">
              <div className="flex-grow overflow-y-auto space-y-4 pr-2 py-1 text-start min-h-0">
              <div>
                <label className="block font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest mb-1.5">
                  Subscription Tier
                </label>
                <BrutalistSelect
                  value={modalTier}
                  onChange={(val) => setModalTier(val as any)}
                  options={[
                    { value: "free", label: "FREE" },
                    { value: "pro", label: "PRO" },
                    { value: "enterprise", label: "ENTERPRISE" }
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest mb-1.5">
                  Access Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-mono text-xs text-brand-blue font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="isBanned"
                      checked={!modalBanned}
                      onChange={() => setModalBanned(false)}
                      className="accent-brand-orange cursor-pointer"
                    />
                    Active / Allowed
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs text-rose-600 font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="isBanned"
                      checked={modalBanned}
                      onChange={() => setModalBanned(true)}
                      className="accent-rose-600 cursor-pointer"
                    />
                    Banned / Suspended
                  </label>
                </div>
              </div>

              {modalBanned && (
                <div className="space-y-3 bg-rose-50 border-2 border-rose-500 p-3.5 animate-in slide-in-from-top-2 duration-150">
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">
                      Reason for Ban / Suspension
                    </label>
                    <textarea
                      value={modalBanReason}
                      onChange={(e) => setModalBanReason(e.target.value)}
                      placeholder="ENTER BAN REASON HERE"
                      className="w-full px-2 py-1.5 border border-rose-500 bg-white text-brand-blue font-sans text-xs focus:outline-none focus:border-rose-700 min-h-[50px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">
                      Ban Duration / Expiration
                    </label>
                    <BrutalistSelect
                      value={modalBanDuration}
                      onChange={setModalBanDuration}
                      options={[
                        { value: "permanent", label: "Permanent suspension" },
                        { value: "1h", label: "Temporary: 1 Hour" },
                        { value: "1d", label: "Temporary: 1 Day" },
                        { value: "3d", label: "Temporary: 3 Days" },
                        { value: "7d", label: "Temporary: 7 Days" },
                        { value: "30d", label: "Temporary: 30 Days" },
                        { value: "custom", label: "Custom Date & Time" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  {modalBanDuration === "custom" && (
                    <div className="animate-in slide-in-from-top-1 duration-100">
                      <label className="block font-mono text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">
                        Select Custom Lift Date / Time
                      </label>
                      <input
                        type="datetime-local"
                        value={modalCustomBanDate}
                        onChange={(e) => setModalCustomBanDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-rose-500 bg-white text-brand-blue font-mono text-xs focus:outline-none focus:border-rose-700 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-brand-blue/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="modalWarned"
                    checked={modalWarned}
                    onChange={(e) => setModalWarned(e.target.checked)}
                    className="accent-brand-orange cursor-pointer"
                  />
                  <label htmlFor="modalWarned" className="font-mono text-xs text-brand-blue font-bold cursor-pointer">
                    Warn Storefront Owner (Warning Flag)
                  </label>
                </div>

                {modalWarned && (
                  <div className="bg-amber-50 border-2 border-brand-orange p-3.5 mb-2 animate-in slide-in-from-top-2 duration-150">
                    <label className="block font-mono text-[9px] font-bold text-brand-orange uppercase tracking-widest mb-1">
                      Reason for Warning
                    </label>
                    <textarea
                      value={modalWarningReason}
                      onChange={(e) => setModalWarningReason(e.target.value)}
                      placeholder="ENTER WARNING REASON HERE"
                      className="w-full px-2 py-1.5 border border-brand-orange bg-white text-brand-blue font-sans text-xs focus:outline-none focus:border-brand-orange min-h-[50px] resize-none"
                    />
                  </div>
                )}
              </div>

              {(modalBanned || modalWarned) && (
                <div className="bg-brand-white border-2 border-brand-blue/10 p-3 mb-4 animate-in slide-in-from-top-2 duration-150">
                  <label className="block font-mono text-[9px] font-bold text-brand-blue uppercase tracking-widest mb-2">
                    Notification Delivery Method
                  </label>
                  <BrutalistSelect
                    value={modalSendMethod}
                    onChange={(val) => setModalSendMethod(val as any)}
                    options={[
                      { value: "both", label: "Both (Inbox & Email)" },
                      { value: "inbox", label: "Inbox Only" },
                      { value: "email", label: "Email via Resend Only" }
                    ]}
                    className="w-full"
                  />
                </div>
              )}

              <div className="border-t border-brand-blue/10 pt-4">
                <h4 className="font-mono text-[10px] font-black text-brand-blue uppercase tracking-widest mb-3 text-brand-orange">
                  Custom Limits Overrides (Leave blank for plan defaults)
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs text-brand-blue font-bold block">
                        Custom Menu Items Limit
                      </span>
                      <span className="text-[9px] text-brand-blue/50 font-mono block">
                        Default: {modalTier === "free" ? limitFree : modalTier === "pro" ? limitPro : limitEnt} items
                      </span>
                    </div>
                    <input
                      type="number"
                      value={modalMenuLimit}
                      onChange={(e) => setModalMenuLimit(e.target.value)}
                      placeholder="ENTER CUSTOM LIMIT HERE"
                      className="w-24 px-2 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-bold text-center focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs text-brand-blue font-bold block">
                        Custom Locations Limit
                      </span>
                      <span className="text-[9px] text-brand-blue/50 font-mono block">
                        Default: {locationLimit} locations
                      </span>
                    </div>
                    <input
                      type="number"
                      value={modalLocationLimit}
                      onChange={(e) => setModalLocationLimit(e.target.value)}
                      placeholder="ENTER CUSTOM LIMIT HERE"
                      className="w-24 px-2 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-bold text-center focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs text-brand-blue font-bold block">
                        Custom Rate Limiting
                      </span>
                      <span className="text-[9px] text-brand-blue/50 font-mono block">
                        Requests per 15s (0 to disable rate limiting)
                      </span>
                    </div>
                    <input
                      type="number"
                      value={modalRateLimit}
                      onChange={(e) => setModalRateLimit(e.target.value)}
                      placeholder="ENTER CUSTOM LIMIT HERE"
                      className="w-24 px-2 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-bold text-center focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-brand-blue font-bold block flex items-center gap-1.5">
                        <span className="text-base">⏳</span> Subdomain Cooldown Rate Limit
                      </span>
                      <span className="text-[9px] text-brand-blue/50 font-mono block mb-2">
                        Cooldown Period (Days). Default: global limit
                      </span>
                      <label 
                        className="flex items-center gap-2 cursor-pointer group w-fit"
                        onClick={() => setModalSubdomainActiveCooldown(!modalSubdomainActiveCooldown)}
                      >
                        <div className={`w-4 h-4 border-2 border-brand-blue flex items-center justify-center shrink-0 transition-colors ${modalSubdomainActiveCooldown ? 'bg-brand-blue' : 'bg-brand-white group-hover:bg-brand-blue/10'}`}>
                          {modalSubdomainActiveCooldown && <Check className="w-3 h-3 text-brand-white" />}
                        </div>
                        <span className="font-mono text-[10px] font-black uppercase text-brand-blue">Active Cooldown Lock</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={modalSubdomainCooldown}
                      onChange={(e) => setModalSubdomainCooldown(e.target.value)}
                      placeholder="ENTER COOLDOWN DAYS HERE"
                      className="w-24 px-2 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-bold text-center focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs text-brand-blue font-bold block">
                        Owner Max Projects Limit
                      </span>
                      <span className="text-[9px] text-brand-blue/50 font-mono block">
                        Default: 20 projects (applies to owner account)
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={modalOwnerMaxProjects}
                      onChange={(e) => setModalOwnerMaxProjects(e.target.value)}
                      placeholder="ENTER MAX PROJECTS HERE"
                      className="w-24 px-2 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-bold text-center focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>

              </div>

              <div className="flex gap-4 border-t border-brand-blue/10 pt-4 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setManagingTenant(null)}
                  disabled={isPending}
                  className="flex-1 h-10 border-2 border-brand-blue bg-brand-grey text-brand-blue font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-bg transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-blue hover:text-brand-orange hover:border-brand-orange transition-all shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {managingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-white border-4 border-brand-blue p-6 max-w-lg w-full shadow-[8px_8px_0px_#f58a2d] animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-brand-blue pb-3 mb-4 shrink-0">
              <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider">
                Manage User: {managingUser.name} ({managingUser.email})
              </h3>
              <button 
                type="button" 
                onClick={() => setManagingUser(null)}
                className="text-brand-blue hover:text-brand-orange transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserLimitsAndWarning} className="flex-grow flex flex-col min-h-0">
              <div className="flex-grow overflow-y-auto space-y-4 pr-2 py-1 text-start min-h-0">
              <div>
                <label className="block font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest mb-1.5">
                  User Role
                </label>
                <div className="w-full px-3 py-2 border-2 border-brand-blue bg-brand-grey/10 text-brand-blue font-mono text-xs font-black uppercase tracking-wide">
                  {managingUser.role.toUpperCase()}
                </div>
                <p className="text-[9px] text-brand-blue/50 font-mono mt-1">
                  Change role via the Users Table dropdown.
                </p>
              </div>

              <div>
                <label className="block font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest mb-1.5">
                  Account Access Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-mono text-xs text-brand-blue font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="userIsBanned"
                      checked={!userModalBanned}
                      onChange={() => setUserModalBanned(false)}
                      className="accent-brand-orange cursor-pointer"
                    />
                    Active / Allowed
                  </label>
                  <label className="flex items-center gap-2 font-mono text-xs text-rose-600 font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="userIsBanned"
                      checked={userModalBanned}
                      onChange={() => setUserModalBanned(true)}
                      className="accent-rose-600 cursor-pointer"
                    />
                    Banned / Suspended
                  </label>
                </div>
              </div>

              {userModalBanned && (
                <div className="space-y-3 bg-rose-50 border-2 border-rose-500 p-3.5 animate-in slide-in-from-top-2 duration-150">
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">
                      Reason for Ban / Suspension
                    </label>
                    <textarea
                      value={userModalBanReason}
                      onChange={(e) => setUserModalBanReason(e.target.value)}
                      placeholder="ENTER BAN REASON HERE"
                      className="w-full px-2 py-1.5 border border-rose-500 bg-white text-brand-blue font-sans text-xs focus:outline-none focus:border-rose-700 min-h-[50px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">
                      Ban Duration
                    </label>
                    <BrutalistSelect
                      value={userModalBanDuration}
                      onChange={setUserModalBanDuration}
                      options={[
                        { value: "permanent", label: "Permanent suspension" },
                        { value: "1h", label: "Temporary: 1 Hour" },
                        { value: "1d", label: "Temporary: 1 Day" },
                        { value: "3d", label: "Temporary: 3 Days" },
                        { value: "7d", label: "Temporary: 7 Days" },
                        { value: "30d", label: "Temporary: 30 Days" },
                        { value: "custom", label: "Custom Date & Time" }
                      ]}
                      className="w-full"
                    />
                  </div>
                  {userModalBanDuration === "custom" && (
                    <div className="animate-in slide-in-from-top-1 duration-100">
                      <label className="block font-mono text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">
                        Select Custom Lift Date / Time
                      </label>
                      <input
                        type="datetime-local"
                        value={userModalCustomBanDate}
                        onChange={(e) => setUserModalCustomBanDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-rose-500 bg-white text-brand-blue font-mono text-xs focus:outline-none focus:border-rose-700 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-brand-blue/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="userModalWarned"
                    checked={userModalWarned}
                    onChange={(e) => setUserModalWarned(e.target.checked)}
                    className="accent-brand-orange cursor-pointer"
                  />
                  <label htmlFor="userModalWarned" className="font-mono text-xs text-brand-blue font-bold cursor-pointer">
                    Warn User Account (Warning Flag)
                  </label>
                </div>

                {userModalWarned && (
                  <div className="bg-amber-50 border-2 border-brand-orange p-3.5 animate-in slide-in-from-top-2 duration-150">
                    <label className="block font-mono text-[9px] font-bold text-brand-orange uppercase tracking-widest mb-1">
                      Reason for Warning
                    </label>
                    <textarea
                      value={userModalWarningReason}
                      onChange={(e) => setUserModalWarningReason(e.target.value)}
                      placeholder="ENTER WARNING REASON HERE"
                      className="w-full px-2 py-1.5 border border-brand-orange bg-white text-brand-blue font-sans text-xs focus:outline-none focus:border-brand-orange min-h-[50px] resize-none"
                    />
                      </div>
                )}
              </div>

              <div className="border-t-2 border-brand-blue/15 pt-4 space-y-4">
                <h4 className="font-display font-black text-xs text-brand-blue uppercase tracking-wider mb-2">
                  Custom Limits Overrides
                </h4>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-brand-blue font-bold block flex items-center gap-1.5">
                      <span className="text-base">⏳</span> Username Cooldown Rate Limit
                    </span>
                    <span className="text-[9px] text-brand-blue/50 font-mono block mb-2">
                      Cooldown Period (Days). Default: global limit
                    </span>
                    <label 
                      className="flex items-center gap-2 cursor-pointer group w-fit"
                      onClick={() => setModalUsernameActiveCooldown(!modalUsernameActiveCooldown)}
                    >
                      <div className={`w-4 h-4 border-2 border-brand-blue flex items-center justify-center shrink-0 transition-colors ${modalUsernameActiveCooldown ? 'bg-brand-blue' : 'bg-brand-white group-hover:bg-brand-blue/10'}`}>
                        {modalUsernameActiveCooldown && <Check className="w-3 h-3 text-brand-white" />}
                      </div>
                      <span className="font-mono text-[10px] font-black uppercase text-brand-blue">Active Cooldown Lock</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={modalUsernameCooldown}
                    onChange={(e) => setModalUsernameCooldown(e.target.value)}
                    placeholder="ENTER COOLDOWN DAYS HERE"
                    className="w-24 px-2 py-1.5 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-bold text-center focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {(userModalBanned || userModalWarned) && (
                <div className="bg-brand-white border-2 border-brand-blue/10 p-3 mb-4 animate-in slide-in-from-top-2 duration-150">
                  <label className="block font-mono text-[9px] font-bold text-brand-blue uppercase tracking-widest mb-2">
                    Notification Delivery Method
                  </label>
                  <BrutalistSelect
                    value={userModalSendMethod}
                    onChange={(val) => setUserModalSendMethod(val as any)}
                    options={[
                      { value: "both", label: "Both (Inbox & Email)" },
                      { value: "inbox", label: "Inbox Only" },
                      { value: "email", label: "Email via Resend Only" }
                    ]}
                    className="w-full"
                  />
                </div>
              )}
              </div>

              <div className="flex gap-4 border-t border-brand-blue/10 pt-4 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setManagingUser(null)}
                  disabled={isPending}
                  className="flex-1 h-10 border-2 border-brand-blue bg-brand-grey text-brand-blue font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-bg transition-colors shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 border-2 border-brand-blue bg-brand-orange text-brand-white font-mono text-xs uppercase font-black tracking-widest hover:bg-brand-blue hover:text-brand-orange hover:border-brand-orange transition-all shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

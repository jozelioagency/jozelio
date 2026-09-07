"use client";

import React, { useState, useTransition } from "react";
import { inviteTeamMember, removeTeamMember, transferProject, deleteProject } from "@/app/actions";
import { Mail, Shield, AlertTriangle, Trash2, ArrowRightLeft } from "lucide-react";
import { BrutalistSelect } from "@/components/BrutalistSelect";

interface Tenant {
  id: string;
  businessName: string;
  subdomain: string;
  userId: string;
}

interface Member {
  id: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  status: "pending" | "accepted";
  userId: string | null;
}

interface SettingsClientProps {
  tenant: Tenant;
  userRole: string;
  members: Member[];
  lang?: string;
}

const settingsTranslations = {
  English: {
    title: "Workspace Settings",
    subtitle: "Manage team workspace invitations and access roles.",
    teamSec: "Team Management",
    teamSub: "Invite and manage account roles for this project workspace.",
    inviteFormTitle: "Invite Team Member",
    emailLabel: "Email Address or Username",
    emailPlace: "Please enter the email address or username here...",
    roleLabel: "Select Role",
    adminRole: "Admin (Full access + manage team)",
    managerRole: "Manager (Edit brand & menu items)",
    viewerRole: "Viewer (Read-only kitchen/menu)",
    inviteBtn: "Send Invitation",
    inviting: "Inviting...",
    membersListTitle: "Project Team Members",
    thEmail: "Email",
    thRole: "Role",
    thStatus: "Status",
    thActions: "Actions",
    statusPending: "Pending",
    statusAccepted: "Active Member",
    revokeBtn: "Revoke Access",
    cancelInviteBtn: "Cancel Invite",
    ownerLabel: "Project Owner",
    successInvite: "Invitation sent successfully!",
    successRemove: "Member removed successfully!",
    confirmTitleRevoke: "Revoke Access Warning",
    confirmMsgRevoke: "Are you sure you want to revoke workspace access for this account? They will lose all permissions immediately.",
    confirmTitleCancel: "Cancel Invitation Warning",
    confirmMsgCancel: "Are you sure you want to cancel the pending team invitation for this account?",
    confirmYes: "Yes, Proceed",
    confirmNo: "No, Go Back",
    dangerZone: "Danger Zone",
    transferTitle: "Transfer Project Ownership",
    transferDesc: "Transfer ownership to another user via their registered username or email. Warning: You will be demoted to an administrator.",
    transferInputLabel: "Recipient Email or Username",
    transferInputPlace: "Please enter the recipient username or email here...",
    transferConfirmTitle: "Transfer Ownership Confirmation",
    transferConfirmMsg: "Are you sure you want to transfer this project to {recipient}? This action cannot be undone.",
    deleteTitle: "Delete Project Workspace",
    deleteDesc: "Permanently delete this project and all associated configurations, branding styles, and menu items. This action is irreversible.",
    deleteConfirmTitle: "Delete Project Confirmation",
    deleteConfirmMsg: "Are you sure you want to delete this project? Enter the project subdomain \"{subdomain}\" below to confirm permanent deletion.",
    deleteInputPlace: "Please enter the subdomain here to confirm...",
    deleteBtn: "Delete Project",
    deleting: "Deleting...",
    successTransfer: "Project ownership transferred successfully!",
    successDelete: "Project deleted successfully!",
  },
  Arabic: {
    title: "إعدادات مساحة العمل",
    subtitle: "إدارة دعوات فريق العمل وصلاحيات الوصول.",
    teamSec: "إدارة فريق العمل",
    teamSub: "دعوة وإدارة صلاحيات الحسابات المساهمة في هذا المشروع.",
    inviteFormTitle: "دعوة عضو جديد",
    emailLabel: "البريد الإلكتروني أو اسم المستخدم",
    emailPlace: "الرجاء إدخال البريد الإلكتروني أو اسم المستخدم هنا...",
    roleLabel: "اختر الصلاحية",
    adminRole: "مسؤول (وصول كامل + إدارة الفريق)",
    managerRole: "مدير (تعديل الهوية وقائمة الطعام)",
    viewerRole: "مشاهد (عرض المطبخ والقائمة فقط)",
    inviteBtn: "إرسال الدعوة",
    inviting: "جاري الإرسال...",
    membersListTitle: "أعضاء المشروع الحاليين",
    thEmail: "البريد الإلكتروني",
    thRole: "الصلاحية",
    thStatus: "الحالة",
    thActions: "الإجراءات",
    statusPending: "قيد الانتظار",
    statusAccepted: "عضو نشط",
    revokeBtn: "إلغاء الوصول",
    cancelInviteBtn: "إلغاء الدعوة",
    ownerLabel: "مالك المشروع",
    successInvite: "تم إرسال دعوة الانضمام بنجاح!",
    successRemove: "تم إزالة العضو بنجاح!",
    confirmTitleRevoke: "تحذير إلغاء الوصول",
    confirmMsgRevoke: "هل أنت متأكد من رغبتك في إلغاء صلاحية الوصول لهذه المساحة؟ سيفقد هذا الحساب جميع الصلاحيات فوراً.",
    confirmTitleCancel: "تحذير إلغاء الدعوة",
    confirmMsgCancel: "هل أنت متأكد من رغبتك في إلغاء دعوة الانضمام المعلقة لهذا الحساب؟",
    confirmYes: "نعم، استمر",
    confirmNo: "لا، تراجع",
    dangerZone: "منطقة الخطر",
    transferTitle: "نقل ملكية المشروع",
    transferDesc: "نقل ملكية هذا المشروع إلى مستخدم آخر بواسطة اسم المستخدم أو البريد الإلكتروني. تحذير: سيتم خفض صلاحياتك إلى مسؤول.",
    transferInputLabel: "البريد الإلكتروني أو اسم المستخدم للمستلم",
    transferInputPlace: "الرجاء إدخال اسم المستخدم أو البريد الإلكتروني للمستلم هنا...",
    transferConfirmTitle: "تأكيد نقل الملكية",
    transferConfirmMsg: "هل أنت متأكد من رغبتك في نقل ملكية هذا المشروع إلى {recipient}؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteTitle: "حذف مشروع مساحة العمل",
    deleteDesc: "حذف هذا المشروع وجميع الإعدادات والبيانات وقائمة الطعام المرتبطة به نهائياً. هذا الإجراء لا يمكن التراجع عنه.",
    deleteConfirmTitle: "تأكيد حذف المشروع",
    deleteConfirmMsg: "هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟ يرجى كتابة النطاق الفرعي للمشروع \"{subdomain}\" أدناه للتأكيد.",
    deleteInputPlace: "الرجاء إدخال النطاق الفرعي هنا للتأكيد...",
    deleteBtn: "حذف المشروع نهائياً",
    deleting: "جاري الحذف...",
    successTransfer: "تم نقل ملكية المشروع بنجاح!",
    successDelete: "تم حذف المشروع بنجاح!",
  },
};

export default function SettingsClient({
  tenant,
  userRole,
  members: initialMembers,
  lang = "English",
}: SettingsClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingRemoveMember, setPendingRemoveMember] = useState<Member | null>(null);

  const [transferRecipient, setTransferRecipient] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");

  const [isInvitePending, startInviteTransition] = useTransition();
  const [isTransferPending, startTransferTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const t = settingsTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";

  const handleSendInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailOrUsername = (formData.get("emailOrUsername") as string | null)?.trim() ?? "";
    const role = formData.get("role") as "admin" | "manager" | "viewer";

    if (!emailOrUsername) {
      setInviteMessage({ type: "error", text: "Please enter an email address or username." });
      return;
    }

    startInviteTransition(async () => {
      const res = await inviteTeamMember({
        tenantId: tenant.id,
        emailOrUsername: emailOrUsername,
        role,
      });

      if (res?.error) {
        setInviteMessage({ type: "error", text: res.error });
      } else {
        setInviteMessage({ type: "success", text: t.successInvite });
        form.reset();
        
        // Optimistic list update
        const newInvite: Member = {
          id: Math.random().toString(),
          email: res.resolvedEmail || emailOrUsername.trim().toLowerCase(),
          role,
          status: "pending",
          userId: null,
        };
        setMembers(prev => [...prev, newInvite]);
      }
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    setInviteMessage(null);
    const originalMembers = [...members];
    
    // Optimistically filter out
    setMembers(prev => prev.filter(m => m.id !== memberId));

    const res = await removeTeamMember(tenant.id, memberId);
    if (res?.error) {
      setMembers(originalMembers);
      setInviteMessage({ type: "error", text: res.error });
    } else {
      setInviteMessage({ type: "success", text: t.successRemove });
    }
  };

  const handleTransferProject = () => {
    if (!transferRecipient.trim()) return;
    setInviteMessage(null);

    startTransferTransition(async () => {
      const res = await transferProject(tenant.id, transferRecipient);
      if (res?.error) {
        setInviteMessage({ type: "error", text: res.error });
      } else {
        setInviteMessage({ type: "success", text: t.successTransfer });
        setTransferRecipient("");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    });
  };

  const handleDeleteProject = () => {
    if (deleteConfirmText !== tenant.subdomain) return;
    setInviteMessage(null);

    startDeleteTransition(async () => {
      const res = await deleteProject(tenant.id);
      if (res?.error) {
        setInviteMessage({ type: "error", text: res.error });
      } else {
        setInviteMessage({ type: "success", text: t.successDelete });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 text-start" dir={isRtl ? "rtl" : "ltr"}>
      {/* Page Title */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669]">
        <h2 className="font-display font-black text-xl text-brand-blue uppercase tracking-tight">
          {t.title}
        </h2>
        <p className="text-brand-blue/70 text-xs mt-1 font-medium">
          {t.subtitle}
        </p>
      </div>

      {/* Invitation Form */}
      <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
        <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>{t.teamSec}</span>
        </h3>
        <p className="text-brand-blue/50 text-[11px] font-medium mb-6">
          {t.teamSub}
        </p>

        {inviteMessage && (
          <div
            className={`p-3 text-xs font-bold border-2 mb-5 flex gap-2 items-start ${
              inviteMessage.type === "success"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                : "bg-rose-50 border-rose-500 text-rose-800"
            }`}
          >
            <span>
              {inviteMessage.type === "success" ? (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </span>
            <p>{inviteMessage.text}</p>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
              {t.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-orange">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                name="emailOrUsername"
                type="text"
                required
                placeholder={t.emailPlace}
                className="h-10 w-full pl-10 pr-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
              {t.roleLabel}
            </label>
            <div className="relative">
              <BrutalistSelect
                name="role"
                value={inviteRole}
                onChange={setInviteRole}
                icon={Shield}
                options={[
                  { value: "manager", label: t.managerRole },
                  { value: "admin", label: t.adminRole },
                  { value: "viewer", label: t.viewerRole }
                ]}
                className="w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isInvitePending}
            className="w-full h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[2px_2px_0px_#f58a2d] active:translate-x-[1px] active:translate-y-[1px] active:shadow-0 disabled:opacity-50 cursor-pointer"
          >
            {isInvitePending ? t.inviting : t.inviteBtn}
          </button>
        </form>
      </div>

      {/* Members/Invites List */}
      <div className="p-6 bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
        <h3 className="font-display font-black text-sm text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>{t.membersListTitle}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-brand-blue bg-brand-grey/40 text-brand-blue font-mono text-[10px] uppercase font-bold text-start">
                <th className="p-2.5 text-start">{t.thEmail}</th>
                <th className="p-2.5 text-start">{t.thRole}</th>
                <th className="p-2.5 text-start">{t.thStatus}</th>
                <th className="p-2.5 text-end">{t.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {/* Owner row */}
              <tr className="border-b border-brand-blue/10">
                <td className="p-2.5 font-semibold text-brand-blue truncate max-w-[150px]">
                  Primary Owner
                </td>
                <td className="p-2.5">
                  <span className="font-mono text-[9px] font-black bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-1.5 py-0.5">
                    OWNER
                  </span>
                </td>
                <td className="p-2.5">
                  <span className="font-mono text-[9px] font-bold text-emerald-600">
                    {t.statusAccepted}
                  </span>
                </td>
                <td className="p-2.5 text-end text-[9px] text-brand-blue/40 font-mono">
                  {t.ownerLabel}
                </td>
              </tr>

              {/* Members list */}
              {members.map((m) => (
                <tr key={m.id} className="border-b border-brand-blue/10 last:border-0 hover:bg-brand-grey/10">
                  <td className="p-2.5 text-brand-blue font-semibold truncate max-w-[150px]" title={m.email}>
                    {m.email}
                  </td>
                  <td className="p-2.5">
                    <span className="font-mono text-[9px] font-black bg-brand-blue/10 border border-brand-blue/20 text-brand-blue px-1.5 py-0.5">
                      {m.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className={`font-mono text-[9px] font-bold ${m.status === "pending" ? "text-amber-500" : "text-emerald-600"}`}>
                      {m.status === "pending" ? t.statusPending : t.statusAccepted}
                    </span>
                  </td>
                  <td className="p-2.5 text-end">
                    <button
                      onClick={() => setPendingRemoveMember(m)}
                      className="font-mono text-[9px] font-bold uppercase text-rose-600 hover:underline cursor-pointer"
                    >
                      {m.status === "pending" ? t.cancelInviteBtn : t.revokeBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brutalist Warning Confirmation Modal */}
      {pendingRemoveMember && (
        <div className="fixed inset-0 bg-brand-blue/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-white border-4 border-brand-blue max-w-md w-full p-6 shadow-[8px_8px_0px_#113669] animate-in zoom-in-95 duration-200" dir={isRtl ? "rtl" : "ltr"}>
            <h4 className="font-display font-black text-base text-rose-600 uppercase tracking-wide mb-2">
              {pendingRemoveMember.status === "pending"
                ? t.confirmTitleCancel
                : t.confirmTitleRevoke}
            </h4>
            <p className="text-xs text-brand-blue font-semibold mb-6">
              {pendingRemoveMember.status === "pending"
                ? t.confirmMsgCancel
                : t.confirmMsgRevoke}
            </p>
            <div className="border-t border-brand-blue/10 pt-4 flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => setPendingRemoveMember(null)}
                className="h-9 px-4 bg-brand-white hover:bg-brand-grey text-brand-blue border-2 border-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {t.confirmNo}
              </button>
              <button
                type="button"
                onClick={() => {
                  const mId = pendingRemoveMember.id;
                  setPendingRemoveMember(null);
                  handleRemoveMember(mId);
                }}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-brand-white border-2 border-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone: Only visible to Owner */}
      {userRole === "owner" && (
        <div className="p-6 bg-brand-white border-2 border-rose-600 shadow-[4px_4px_0px_#dc2626] space-y-6">
          <h3 className="font-display font-black text-sm text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{t.dangerZone}</span>
          </h3>

          {/* Transfer Ownership */}
          <div className="border-t border-rose-600/10 pt-4 space-y-3 text-start">
            <h4 className="font-display font-black text-xs text-brand-blue uppercase">
              {t.transferTitle}
            </h4>
            <p className="text-brand-blue/70 text-[10px] font-semibold leading-relaxed">
              {t.transferDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder={t.transferInputPlace}
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  className="h-9 w-full pl-9 pr-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-white transition-all text-xs font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => transferRecipient.trim() && setShowTransferConfirm(true)}
                disabled={isTransferPending || !transferRecipient.trim()}
                className="h-9 px-4 bg-brand-orange hover:bg-brand-blue text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
              >
                {t.transferTitle.split(" ")[0]}
              </button>
            </div>
          </div>

          {/* Delete Project */}
          <div className="border-t border-rose-600/10 pt-4 space-y-3 text-start">
            <h4 className="font-display font-black text-xs text-rose-600 uppercase">
              {t.deleteTitle}
            </h4>
            <p className="text-brand-blue/70 text-[10px] font-semibold leading-relaxed">
              {t.deleteDesc}
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeletePending}
              className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-brand-white font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
            >
              {t.deleteBtn}
            </button>
          </div>
        </div>
      )}

      {/* Transfer Confirmation Modal */}
      {showTransferConfirm && (
        <div className="fixed inset-0 bg-brand-blue/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-white border-4 border-brand-blue max-w-md w-full p-6 shadow-[8px_8px_0px_#113669] animate-in zoom-in-95 duration-200" dir={isRtl ? "rtl" : "ltr"}>
            <h4 className="font-display font-black text-base text-rose-600 uppercase tracking-wide mb-2">
              {t.transferConfirmTitle}
            </h4>
            <p className="text-xs text-brand-blue font-semibold mb-6">
              {t.transferConfirmMsg.replace("{recipient}", `"${transferRecipient}"`)}
            </p>
            <div className="border-t border-brand-blue/10 pt-4 flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => setShowTransferConfirm(false)}
                className="h-9 px-4 bg-brand-white hover:bg-brand-grey text-brand-blue border-2 border-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {t.confirmNo}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTransferConfirm(false);
                  handleTransferProject();
                }}
                className="h-9 px-4 bg-brand-orange hover:bg-brand-blue text-brand-white border-2 border-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {isTransferPending ? t.inviting : t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-brand-blue/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-white border-4 border-brand-blue max-w-md w-full p-6 shadow-[8px_8px_0px_#113669] animate-in zoom-in-95 duration-200" dir={isRtl ? "rtl" : "ltr"}>
            <h4 className="font-display font-black text-base text-rose-600 uppercase tracking-wide mb-2">
              {t.deleteConfirmTitle}
            </h4>
            <p className="text-xs text-brand-blue font-semibold mb-4">
              {t.deleteConfirmMsg.replace("{subdomain}", tenant.subdomain)}
            </p>
            <div className="space-y-1.5 mb-6 text-start">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest block">
                {isRtl ? "اكتب اسم النطاق الفرعي للتأكيد:" : "Type the project subdomain to confirm:"}
              </label>
              <input
                type="text"
                placeholder={t.deleteInputPlace}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="h-9 w-full px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-white transition-all text-xs font-semibold"
              />
            </div>
            <div className="border-t border-brand-blue/10 pt-4 flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="h-9 px-4 bg-brand-white hover:bg-brand-grey text-brand-blue border-2 border-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {t.confirmNo}
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== tenant.subdomain || isDeletePending}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteProject();
                }}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-brand-white border-2 border-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[2px_2px_0px_#113669] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeletePending ? t.deleting : t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

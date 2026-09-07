"use client";

import React, { useState, useTransition, useRef } from "react";
import { updateUserProfile, deleteOwnAccount } from "@/app/actions";
import Link from "next/link";
import { User, Upload, ArrowLeft, Mail, Shield, Check, AlertCircle, Phone, Trash2, Camera, X } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import LogoutButton from "@/components/LogoutButton";
import PhoneInput from "@/components/PhoneInput";

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    username: string | null;
    nickname: string | null;
    phoneNumber: string | null;
  };
  lang?: string;
}

const profileTranslations = {
  English: {
    title: "My Profile",
    subtitle: "Manage your personal credentials and profile picture.",
    nameLabel: "Full Name",
    emailLabel: "Email Address",
    roleLabel: "Account Role",
    pfpTitle: "Choose Profile Picture",
    pfpSubtitle: "Select a custom preset icon or upload an image from your device.",
    presets: "Preset Icons",
    uploadTitle: "Upload Custom Image",
    uploadBtn: "Choose File",
    uploading: "Uploading...",
    saveBtn: "Save Profile",
    saving: "Saving...",
    backBtn: "Back to Dashboard",
    successMsg: "Profile updated successfully! Syncing...",
    nameRequired: "Name is required",
    userRole: "Standard User",
    adminRole: "Super Admin",
    infoTitle: "Account Information",
    infoSubtitle: "Update your name and review your credentials.",
    avatarTitle: "Avatar Settings",
    avatarSubtitle: "Choose a preset emoji or upload a custom image.",
    usernameLabel: "Username",
    nicknameLabel: "Nickname",
    nicknamePlace: "Please enter your nickname here...",
    phoneLabel: "Phone Number",
    phonePlace: "Please enter your phone number here...",
    editBtn: "Edit Profile",
    cancelBtn: "Cancel",
    deleteTitle: "Danger Zone",
    deleteSubtitle: "Permanently delete your user account and erase all associated data.",
    deleteWarning: "WARNING: This action is irreversible. All of your personal profile data and sessions will be permanently wiped.",
    deleteConfirmText: "To confirm, please type your email address",
    deleteBtn: "Delete My Account",
    deleteConfirmBtn: "Yes, Delete Account Permanently",
    deleteCancelBtn: "Cancel",
    avatarModalTitle: "Update Profile Picture",
    presetTab: "Choose Preset",
    uploadTab: "Upload Custom",
    zoomLabel: "Zoom Scale",
    cropBtn: "Crop & Save Avatar",
    dragInstruct: "Drag the image inside the box to reposition it.",
    selectFileBtn: "Choose Image",
  },
  Arabic: {
    title: "ملفي الشخصي",
    subtitle: "إدارة بياناتك الشخصية وصورة الحساب.",
    nameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    roleLabel: "صلاحية الحساب",
    pfpTitle: "اختر صورة الملف الشخصي",
    pfpSubtitle: "اختر أيقونة جاهزة أو قم برفع صورة مخصصة من جهازك.",
    presets: "أيقونات جاهزة",
    uploadTitle: "رفع صورة مخصصة",
    uploadBtn: "اختر ملف",
    uploading: "جاري الرفع...",
    saveBtn: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    backBtn: "العودة إلى لوحة التحكم",
    successMsg: "تم تحديث الملف الشخصي بنجاح! جاري التحديث...",
    nameRequired: "الاسم مطلوب",
    userRole: "مستخدم قياسي",
    adminRole: "مسؤول النظام",
    infoTitle: "معلومات الحساب",
    infoSubtitle: "تحديث اسمك ومراجعة بيانات صلاحياتك.",
    avatarTitle: "إعدادات الصورة الشخصية",
    avatarSubtitle: "اختر أيقونة تعبيرية أو ارفع صورة مخصصة.",
    usernameLabel: "اسم المستخدم",
    nicknameLabel: "اللقب (الاسم المستعار)",
    nicknamePlace: "الرجاء إدخال اللقب هنا...",
    phoneLabel: "رقم الهاتف",
    phonePlace: "الرجاء إدخال رقم الهاتف هنا...",
    editBtn: "تعديل الملف الشخصي",
    cancelBtn: "إلغاء",
    deleteTitle: "منطقة الخطر",
    deleteSubtitle: "حذف حساب المستخدم الخاص بك بشكل دائم ومسح جميع البيانات المرتبطة به.",
    deleteWarning: "تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم مسح جميع بيانات ملفك الشخصي وجلساتك بشكل دائم.",
    deleteConfirmText: "لتأكيد الحذف، يرجى كتابة عنوان بريدك الإلكتروني",
    deleteBtn: "حذف حسابي",
    deleteConfirmBtn: "نعم، احذف الحساب نهائياً",
    deleteCancelBtn: "إلغاء",
    avatarModalTitle: "تحديث الصورة الشخصية",
    presetTab: "الأيقونات الجاهزة",
    uploadTab: "رفع صورة مخصصة",
    zoomLabel: "مستوى التكبير",
    cropBtn: "قص وحفظ الصورة",
    dragInstruct: "اسحب الصورة داخل المربع لضبط الموضع.",
    selectFileBtn: "اختر صورة",
  }
};

const PRESET_ICONS = [
  "/characters/bocado/symbol.png",
  "/characters/bocado/mascot.png",
  "/characters/corza/symbol.png",
  "/characters/corza/mascot.png",
  "/characters/julia/symbol.png",
  "/characters/julia/mascot.png"
];

export default function ProfileClient({ user, lang = "English" }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [nickname, setNickname] = useState(user.nickname || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [imageUrl, setImageUrl] = useState<string | null>(user.image);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Avatar Modal & Cropper States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"preset" | "upload">("preset");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropping, setCropping] = useState(false);
  const [initialScale, setInitialScale] = useState(1);

  const imgRef = useRef<HTMLImageElement>(null);

  // Handlers for image panning
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !imageSrc) return;
    
    // Bounds calculations
    const imgEl = imgRef.current;
    if (!imgEl) return;
    
    const renderedWidth = imgEl.naturalWidth * initialScale * zoom;
    const renderedHeight = imgEl.naturalHeight * initialScale * zoom;
    
    const maxX = Math.max(0, (renderedWidth - 256) / 2);
    const maxY = Math.max(0, (renderedHeight - 256) / 2);
    
    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;
    
    // Restrict within bounding box
    newX = Math.max(-maxX, Math.min(maxX, newX));
    newY = Math.max(-maxY, Math.min(maxY, newY));
    
    setOffset({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const scale = Math.max(256 / img.naturalWidth, 256 / img.naturalHeight);
    setInitialScale(scale);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropAndSave = async () => {
    if (!imageSrc) return;
    setCropping(true);
    setError(null);

    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 256, 256);

          ctx.translate(128 + offset.x, 128 + offset.y);
          ctx.scale(zoom * initialScale, zoom * initialScale);
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        }

        const croppedDataUrl = canvas.toDataURL("image/webp", 0.9);
        const response = await fetch(croppedDataUrl);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append("file", blob, "avatar.webp");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = (await uploadRes.json()) as any;
        if (uploadRes.ok && uploadData.url) {
          setImageUrl(uploadData.url);
          setShowAvatarModal(false);
          setImageSrc(null);
          setSelectedFile(null);
        } else {
          setError(uploadData.error || "Failed to upload cropped image.");
        }
      } catch (err) {
        console.error(err);
        setError("Error cropping image.");
      } finally {
        setCropping(false);
      }
    };
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setDeleteError(lang === "Arabic" ? "البريد الإلكتروني المدخل غير مطابق لتأكيد الحذف." : "The entered email address does not match your account email.");
      return;
    }

    setDeleteError(null);
    setIsDeletingAccount(true);

    try {
      const res = await deleteOwnAccount();
      if (res?.error) {
        setDeleteError(res.error);
        setIsDeletingAccount(false);
      } else {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/";
            },
          },
        });
      }
    } catch (err: any) {
      console.error(err);
      setDeleteError(lang === "Arabic" ? "حدث خطأ أثناء حذف الحساب." : "An error occurred while deleting your account.");
      setIsDeletingAccount(false);
    }
  };

  const t = profileTranslations[lang === "Arabic" ? "Arabic" : "English"];
  const isRtl = lang === "Arabic";



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    let formElement: HTMLFormElement | null = null;
    const targetEl = e.target as HTMLElement | null;
    const currentEl = e.currentTarget as HTMLElement | null;

    if (targetEl && targetEl.tagName === "FORM") {
      formElement = targetEl as HTMLFormElement;
    } else if (currentEl && currentEl.tagName === "FORM") {
      formElement = currentEl as HTMLFormElement;
    } else if (targetEl && targetEl.closest) {
      formElement = targetEl.closest("form");
    }

    if (!formElement) {
      formElement = document.getElementById("profile-form") as HTMLFormElement || document.querySelector("form");
    }

    const formData = formElement ? new FormData(formElement) : new FormData();
    const phoneToSubmit = formData.get("phoneNumber") !== null ? (formData.get("phoneNumber") as string) : phoneNumber;

    if (!name.trim()) {
      setError(t.nameRequired);
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfile(name, imageUrl || "", nickname, phoneToSubmit, username, email);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Full reload or redirect to sync auth session cookies
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 text-start" dir={isRtl ? "rtl" : "ltr"}>
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard"
          className="px-4 py-2 border-2 border-brand-blue bg-brand-white text-brand-blue hover:bg-brand-blue hover:text-brand-white font-mono text-xs uppercase font-black tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none w-fit"
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          <span className="hidden sm:inline">{t.backBtn}</span>
        </Link>
        <LogoutButton variant="header" lang={lang} />
      </div>

      {/* Modern Profile Header Card with Cover */}
      <div className="bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#113669] relative overflow-visible">
        {/* Abstract Brutalist Cover Pattern */}
        <div className="h-32 md:h-44 bg-brand-orange/15 border-b-4 border-brand-blue relative overflow-hidden bg-[radial-gradient(#113669_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/20 to-transparent mix-blend-multiply" />
          <div className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} bg-brand-white border-2 border-brand-blue font-mono text-[9px] font-black uppercase tracking-wider px-2 py-1 shadow-[2px_2px_0px_#113669]`}>
            {user.role === "admin" || user.role === "owner" ? t.adminRole : t.userRole}
          </div>
        </div>

        {/* Floating Avatar & Basic Details Container */}
        <div className="pt-6 pb-6 px-6 md:px-8 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Overlapping Avatar with Camera Hover Edit Trigger */}
          <div 
            onClick={() => isEditing && setShowAvatarModal(true)}
            className={`relative -mt-12 md:-mt-16 w-24 h-24 md:w-28 md:h-28 rounded-none border-4 border-brand-blue bg-brand-white flex items-center justify-center text-brand-blue overflow-hidden shadow-[4px_4px_0px_#113669] transition-transform duration-200 group/avatar shrink-0 ${
              isEditing ? "cursor-pointer hover:scale-105" : ""
            }`}
          >
            {imageUrl ? (
              imageUrl.startsWith("http") || imageUrl.startsWith("/api/media") || imageUrl.startsWith("data:") || imageUrl.startsWith("/") ? (
                <img src={imageUrl} alt="Pfp Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl md:text-5xl font-black leading-none">{imageUrl}</span>
              )
            ) : (
              <User className="w-12 h-12 md:w-16 md:h-16" />
            )}

            {isEditing && (
              <div className="absolute inset-0 bg-brand-blue/60 backdrop-blur-[0.5px] flex flex-col items-center justify-center gap-1 text-brand-white select-none">
                <Camera className="w-6 h-6 animate-pulse" />
                <span className="font-mono text-[8px] font-black uppercase tracking-wider">
                  {isRtl ? "تغيير" : "CHANGE"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 mt-2 md:mt-0">
            <h2 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight flex items-center gap-2">
              <span>{nickname || user.nickname || name || user.name}</span>
            </h2>
            <p className="text-brand-blue/60 text-xs font-mono font-medium mt-1">
              {username || user.username ? `@${username || user.username}` : email}
            </p>
          </div>

          <div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full md:w-auto px-6 h-10 bg-brand-orange hover:bg-brand-blue text-brand-white font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              >
                {t.editBtn}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="submit"
                  form="profile-form"
                  disabled={isPending || uploading || cropping}
                  className="px-6 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? t.saving : t.saveBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setUsername(user.username || "");
                    setEmail(user.email || "");
                    setNickname(user.nickname || "");
                    setPhoneNumber(user.phoneNumber || "");
                    setImageUrl(user.image);
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="px-6 h-10 bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-xs uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#113669] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border-4 border-rose-500 text-rose-800 text-xs font-bold flex gap-3 items-center shadow-[4px_4px_0px_#113669] animate-in slide-in-from-top duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border-4 border-emerald-500 text-emerald-800 text-xs font-bold flex gap-3 items-center shadow-[4px_4px_0px_#113669] animate-in slide-in-from-top duration-200">
          <Check className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{t.successMsg}</span>
        </div>
      )}

      {/* Form Content */}
      <form id="profile-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Card 1: Profile Information */}
        <div className="bg-brand-white border-4 border-brand-blue p-6 md:p-8 shadow-[8px_8px_0px_#113669] space-y-6">
          <div>
            <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-brand-orange border border-brand-blue" />
              {t.infoTitle}
            </h3>
            <p className="text-[10px] text-brand-blue/50 font-medium mt-1">
              {t.infoSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.nameLabel}
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isEditing ? "text-brand-orange" : "text-brand-blue/40"}`}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  required
                  className={`h-11 w-full pl-10 pr-4 rounded-none border-2 transition-all text-xs font-semibold ${
                    isEditing
                      ? "bg-brand-bg/10 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange shadow-[2px_2px_0px_rgba(17,54,105,0.15)]"
                      : "bg-brand-bg/5 border-brand-blue/20 text-brand-blue/55 cursor-not-allowed opacity-80"
                  }`}
                />
              </div>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.usernameLabel}
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isEditing ? "text-brand-orange" : "text-brand-blue/40"}`}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  disabled={!isEditing}
                  required
                  pattern="^[a-z0-9_-]{3,20}$"
                  title="Username must be 3-20 characters and contain only lowercase letters, numbers, hyphens, and underscores."
                  className={`h-11 w-full pl-10 pr-4 rounded-none border-2 transition-all text-xs font-semibold ${
                    isEditing
                      ? "bg-brand-bg/10 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange shadow-[2px_2px_0px_rgba(17,54,105,0.15)]"
                      : "bg-brand-bg/5 border-brand-blue/20 text-brand-blue/55 cursor-not-allowed opacity-80"
                  }`}
                />
              </div>
            </div>

            {/* Nickname */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.nicknameLabel}
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isEditing ? "text-brand-orange" : "text-brand-blue/40"}`}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={!isEditing}
                  placeholder={t.nicknamePlace}
                  className={`h-11 w-full pl-10 pr-4 rounded-none border-2 transition-all text-xs font-semibold ${
                    isEditing
                      ? "bg-brand-bg/10 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange shadow-[2px_2px_0px_rgba(17,54,105,0.15)]"
                      : "bg-brand-bg/5 border-brand-blue/20 text-brand-blue/55 cursor-not-allowed opacity-80"
                  }`}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.phoneLabel}
              </label>
              <PhoneInput
                name="phoneNumber"
                defaultValue={phoneNumber}
                disabled={!isEditing}
                placeholder={t.phonePlace}
                isRtl={isRtl}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Security & Credentials */}
        <div className="bg-brand-white border-4 border-brand-blue p-6 md:p-8 shadow-[8px_8px_0px_#113669] space-y-6">
          <div>
            <h3 className="font-display font-black text-base text-brand-blue uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-brand-blue border border-brand-orange" />
              {isRtl ? "بيانات الاعتماد والأمان" : "Credentials & Security"}
            </h3>
            <p className="text-[10px] text-brand-blue/50 font-medium mt-1">
              {isRtl ? "مراجعة وتعديل بيانات بريدك الإلكتروني وصلاحيات حسابك." : "Review and manage your security settings and login email."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.emailLabel}
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isEditing ? "text-brand-orange" : "text-brand-blue/40"}`}>
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  required
                  className={`h-11 w-full pl-10 pr-4 rounded-none border-2 transition-all text-xs font-semibold ${
                    isEditing
                      ? "bg-brand-bg/10 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange shadow-[2px_2px_0px_rgba(17,54,105,0.15)]"
                      : "bg-brand-bg/5 border-brand-blue/20 text-brand-blue/55 cursor-not-allowed opacity-80"
                  }`}
                />
              </div>
            </div>

            {/* Account Role */}
            <div className="flex flex-col gap-1.5 opacity-80">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest">
                {t.roleLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-blue/40">
                  <Shield className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  disabled
                  value={(user.role === "admin" || user.role === "owner") ? t.adminRole : t.userRole}
                  className="h-11 w-full pl-10 pr-4 bg-brand-bg/5 border-2 border-brand-blue/20 text-brand-blue/55 font-semibold text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Quick Admin Console access banner inside credentials card */}
          {(user.role === "admin" || user.role === "owner") && (
            <div className="mt-6 p-5 border-2 border-brand-blue bg-brand-blue text-brand-white shadow-[4px_4px_0px_#f58a2d] relative overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0px_#f58a2d] group/admin-banner">
              {/* Retro Pixel Grid overlay */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:8px_8px]" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                    </span>
                    <h4 className="text-xs font-mono font-black uppercase tracking-widest text-brand-orange">
                      {isRtl ? "لوحة التحكم للمسؤولين" : "Super Admin Mode"}
                    </h4>
                  </div>
                  <p className="text-[10px] text-brand-white/80 font-medium leading-relaxed max-w-md">
                    {isRtl ? "يمكنك الدخول إلى لوحة إدارة المنصة لتخصيص الخيارات العالمية وتعديل حدود المواقع." : "Authorized developer credentials detected. Proceed to the console to configure global settings."}
                  </p>
                </div>
                <Link
                  href="/jozelio-admin"
                  className="px-5 h-10 flex items-center justify-center gap-2 bg-brand-orange border-2 border-brand-white text-brand-blue hover:bg-brand-white hover:text-brand-blue font-mono text-[10px] uppercase font-black tracking-widest transition-all shadow-[3px_3px_0px_rgba(255,255,255,0.2)] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] shrink-0 group-hover/admin-banner:scale-105 duration-200"
                >
                  <span>{isRtl ? "دخول لوحة المسؤول" : "Admin Console"}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Danger Zone: Delete Account */}
      <div className="bg-brand-white border-4 border-brand-blue p-6 md:p-8 shadow-[8px_8px_0px_#113669] space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 border-2 border-rose-600 flex items-center justify-center text-rose-600 shadow-[2px_2px_0px_rgba(220,38,38,0.2)] shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-base text-rose-600 uppercase tracking-wider">
              {t.deleteTitle}
            </h3>
            <p className="text-[10px] text-brand-blue/50 font-medium mt-0.5">
              {t.deleteSubtitle}
            </p>
          </div>
        </div>

        {deleteError && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-500 text-rose-800 text-xs font-bold flex gap-2 items-start shadow-[2px_2px_0px_rgba(220,38,38,0.1)] animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{deleteError}</span>
          </div>
        )}

        {!showDeleteConfirm ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
                setConfirmEmail("");
                setDeleteError(null);
              }}
              className="px-5 h-10 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-mono text-[10px] uppercase tracking-widest font-black border-2 border-rose-600 transition-all duration-300 shadow-[2px_2px_0px_#dc2626] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              {t.deleteBtn}
            </button>
          </div>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-lg border-t border-brand-blue/15 pt-5 animate-in fade-in duration-200">
            <div className="p-3.5 bg-rose-50/50 border-2 border-rose-500/20 text-rose-900 text-xs font-medium leading-relaxed">
              <p className="font-bold text-rose-700">{t.deleteWarning}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-brand-blue/80 uppercase tracking-widest leading-relaxed">
                {t.deleteConfirmText} (<span className="select-all font-semibold font-mono text-brand-orange">{user.email}</span>):
              </label>
              <input
                type="email"
                required
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={lang === "Arabic" ? "الرجاء إدخال البريد الإلكتروني هنا..." : "Please enter your email here..."}
                className="h-11 w-full px-4 rounded-none border-2 border-brand-blue bg-brand-bg/10 text-brand-blue focus:outline-none focus:bg-brand-white focus:border-brand-orange text-xs font-semibold shadow-[2px_2px_0px_rgba(17,54,105,0.1)]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isDeletingAccount}
                className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-brand-white font-mono text-[10px] uppercase tracking-widest font-black border-2 border-rose-600 transition-all duration-300 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount ? (lang === "Arabic" ? "جاري الحذف..." : "Deleting...") : t.deleteConfirmBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="h-10 px-5 bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {t.deleteCancelBtn}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── Avatar Selector & Cropper Modal ─── */}
      {showAvatarModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!cropping) {
              setShowAvatarModal(false);
              setImageSrc(null);
              setSelectedFile(null);
            }
          }}
        >
          <div 
            className="w-full max-w-md bg-brand-white border-4 border-brand-blue shadow-[8px_8px_0px_#113669] overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b-4 border-brand-blue p-4 flex items-center justify-between bg-brand-orange/5">
              <h3 className="font-display font-black text-sm text-brand-blue uppercase tracking-tight flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-orange" />
                {t.avatarModalTitle}
              </h3>
              <button
                type="button"
                disabled={cropping}
                onClick={() => {
                  setShowAvatarModal(false);
                  setImageSrc(null);
                  setSelectedFile(null);
                }}
                className="w-8 h-8 border-2 border-brand-blue flex items-center justify-center bg-brand-white text-brand-blue hover:bg-brand-orange hover:text-brand-white shadow-[2px_2px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tab Bar */}
            <div className="flex border-b-2 border-brand-blue bg-brand-grey/20">
              <button
                type="button"
                disabled={cropping}
                onClick={() => {
                  setActiveModalTab("preset");
                  setImageSrc(null);
                  setSelectedFile(null);
                }}
                className={`flex-1 py-2 font-mono text-[10px] font-black uppercase tracking-widest border-r-2 border-brand-blue transition-all ${
                  activeModalTab === "preset"
                    ? "bg-brand-white text-brand-blue"
                    : "text-brand-blue/60 hover:text-brand-blue hover:bg-brand-grey/40 cursor-pointer"
                }`}
              >
                {t.presetTab}
              </button>
              <button
                type="button"
                disabled={cropping}
                onClick={() => setActiveModalTab("upload")}
                className={`flex-1 py-2 font-mono text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeModalTab === "upload"
                    ? "bg-brand-white text-brand-blue"
                    : "text-brand-blue/60 hover:text-brand-blue hover:bg-brand-grey/40 cursor-pointer"
                }`}
              >
                {t.uploadTab}
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Presets List */}
              {activeModalTab === "preset" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {PRESET_ICONS.map((icon) => {
                      const isSelected = imageUrl === icon;
                      return (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            setImageUrl(icon);
                            setShowAvatarModal(false);
                          }}
                          className={`aspect-square border-2 flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer relative ${
                            isSelected
                              ? "border-brand-orange bg-brand-orange/15 shadow-[3px_3px_0px_#113669] scale-105 z-10"
                              : "border-brand-blue bg-brand-grey/25 hover:border-brand-orange shadow-[2px_2px_0px_#113669]"
                          }`}
                        >
                          <img src={icon} alt="Avatar Preset" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-0 right-0 bg-brand-orange border-b-2 border-l-2 border-brand-blue p-0.5 flex items-center justify-center">
                              <Check className="w-2 h-2 text-brand-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Upload & Crop */}
              {activeModalTab === "upload" && (
                <div className="flex flex-col items-center">
                  {!imageSrc ? (
                    <div className="w-full text-center py-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        id="modal-profile-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="modal-profile-upload"
                        className="h-28 w-full flex flex-col items-center justify-center gap-2 border-2 border-brand-blue border-dashed bg-brand-bg/5 text-brand-blue hover:text-brand-orange hover:bg-brand-white hover:border-brand-orange transition-all cursor-pointer p-4"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="font-mono text-[10px] font-black uppercase tracking-widest">
                          {t.selectFileBtn}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      {/* Image Crop Frame Viewport */}
                      <div 
                        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          handleDragStart(touch.clientX, touch.clientY);
                        }}
                        onTouchMove={(e) => {
                          const touch = e.touches[0];
                          handleDragMove(touch.clientX, touch.clientY);
                        }}
                        onTouchEnd={handleDragEnd}
                        className="w-[256px] h-[256px] overflow-hidden border-4 border-brand-blue relative bg-brand-grey cursor-grab active:cursor-grabbing mx-auto mb-3 select-none flex items-center justify-center"
                      >
                        <img
                          ref={imgRef}
                          src={imageSrc}
                          alt="To Crop"
                          draggable={false}
                          onLoad={handleImageLoad}
                          style={{
                            width: `${imgRef.current ? imgRef.current.naturalWidth * initialScale : 256}px`,
                            height: `${imgRef.current ? imgRef.current.naturalHeight * initialScale : 256}px`,
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transition: isDragging ? "none" : "transform 0.1s ease-out",
                          }}
                          className="pointer-events-none select-none max-w-none object-cover"
                        />
                        {/* Circular/Square mask overlay preview */}
                        <div className="absolute inset-0 border-2 border-brand-blue/30 pointer-events-none" />
                        <div className="absolute top-2 left-2 bg-brand-blue/80 border border-brand-white px-2 py-0.5 text-[8px] font-mono font-black text-brand-white uppercase pointer-events-none rounded-none shadow-[1px_1px_0px_#113669]">
                          {t.dragInstruct}
                        </div>
                      </div>

                      {/* Zoom Controls */}
                      <div className="w-full flex flex-col gap-1 mb-5">
                        <div className="flex justify-between font-mono text-[9px] font-black text-brand-blue/70 uppercase">
                          <span>{t.zoomLabel}</span>
                          <span>{zoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.02"
                          value={zoom}
                          disabled={cropping}
                          onChange={(e) => {
                            const newZoom = parseFloat(e.target.value);
                            setZoom(newZoom);
                            
                            // Recalculate offsets on zoom to prevent visual gap borders
                            const imgEl = imgRef.current;
                            if (imgEl) {
                              const renderedWidth = imgEl.naturalWidth * initialScale * newZoom;
                              const renderedHeight = imgEl.naturalHeight * initialScale * newZoom;
                              const maxX = Math.max(0, (renderedWidth - 256) / 2);
                              const maxY = Math.max(0, (renderedHeight - 256) / 2);
                              
                              setOffset(prev => ({
                                x: Math.max(-maxX, Math.min(maxX, prev.x)),
                                y: Math.max(-maxY, Math.min(maxY, prev.y)),
                              }));
                            }
                          }}
                          className="w-full h-2 bg-brand-grey border-2 border-brand-blue appearance-none outline-none cursor-pointer focus:border-brand-orange"
                        />
                      </div>

                      {/* Modal Crop Actions */}
                      <div className="w-full flex gap-3">
                        <button
                          type="button"
                          onClick={handleCropAndSave}
                          disabled={cropping}
                          className="flex-1 h-10 bg-brand-blue hover:bg-brand-orange text-brand-white hover:text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#f58a2d] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 cursor-pointer"
                        >
                          {cropping ? t.uploading : t.cropBtn}
                        </button>
                        <button
                          type="button"
                          disabled={cropping}
                          onClick={() => {
                            setImageSrc(null);
                            setSelectedFile(null);
                          }}
                          className="h-10 px-4 bg-brand-white hover:bg-brand-grey text-brand-blue font-mono text-[10px] uppercase tracking-widest font-black border-2 border-brand-blue transition-all duration-300 shadow-[3px_3px_0px_#113669] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                        >
                          {t.cancelBtn}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

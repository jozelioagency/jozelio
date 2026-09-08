"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Search,
  FileText,
  PieChart as PieChartIcon,
  BarChart3,
  Calculator,
  Printer,
  Receipt,
  Clock,
  Trash2,
  RefreshCw,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  createAccountingTransaction,
  updateAccountingTransaction,
  deleteAccountingTransaction,
  seedInitialAccountingData,
} from "@/app/actions";
import type { AccountingTransaction } from "@/db/schema";
import { BrutalistSelect } from "@/components/BrutalistSelect";

interface AccountingSectionProps {
  initialTransactions: AccountingTransaction[];
  tenants: Array<{ id: string; businessName: string; tier: string }>;
  isOwner: boolean;
  currentOperatorId: string;
}

// Exchange rates relative to 1 EGP
const EXCHANGE_RATES: Record<string, number> = {
  EGP: 1,
  USD: 1 / 50.5,
  EUR: 1 / 54.2,
  SAR: 1 / 13.4,
  AED: 1 / 13.7,
};

const CATEGORIES = {
  revenue: [
    { value: "subscription", label: "Subscription Plan" },
    { value: "setup_fee", label: "Onboarding & Setup" },
    { value: "custom_domain", label: "Custom Domain Mapping" },
    { value: "custom_feature", label: "Custom Development / Add-on" },
    { value: "other_revenue", label: "Other Revenue" },
  ],
  expense: [
    { value: "cloudflare", label: "Cloudflare (Workers, D1, R2)" },
    { value: "upstash", label: "Upstash Redis Quota" },
    { value: "resend", label: "Resend Email Deliverability" },
    { value: "ai", label: "Workers AI Neural Compute" },
    { value: "marketing", label: "Digital Ads & Promotion" },
    { value: "salary", label: "Payroll & Team Compensation" },
    { value: "domain_registration", label: "Domain Registrations" },
    { value: "legal_accounting", label: "Legal & Professional Services" },
    { value: "office_hardware", label: "Equipment & Overhead" },
    { value: "other_expense", label: "Other Operating Expense" },
  ],
};

const PAYMENT_METHODS = [
  { value: "instapay", label: "Instapay (Egypt)" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "card", label: "Debit / Credit Card" },
  { value: "bank_transfer", label: "Bank Wire Transfer" },
  { value: "stripe", label: "Stripe Online" },
  { value: "cash", label: "Cash / Direct Deposit" },
  { value: "other", label: "Other Method" },
];

export default function AccountingSection({
  initialTransactions,
  tenants,
  isOwner,
  currentOperatorId: _currentOperatorId,
}: AccountingSectionProps) {
  const [transactions, setTransactions] = useState<AccountingTransaction[]>(initialTransactions);
  const [currency, setCurrency] = useState<"EGP" | "USD" | "EUR" | "SAR" | "AED">("EGP");
  const [isPending, startTransition] = useTransition();

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "revenue" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "30d" | "90d" | "year">("all");

  // Modals & Tools
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRunwayTool, setShowRunwayTool] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<AccountingTransaction | null>(null);

  // Form State for new transaction
  const [formData, setFormData] = useState({
    type: "revenue" as "revenue" | "expense",
    category: "subscription",
    description: "",
    amount: "",
    currency: "EGP",
    tenantId: "",
    entityName: "",
    status: "paid" as "paid" | "pending" | "refunded" | "cancelled",
    paymentMethod: "instapay",
    invoiceNumber: "",
    notes: "",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  // Runway tool inputs
  const [cashReservesInput, setCashReservesInput] = useState<string>("150000");

  // VAT tool inputs
  const [vatRateInput, setVatRateInput] = useState<number>(14);

  // Notification Message
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // ─── Currency Formatter ──────────────────────────────────────────────────
  const formatMoney = (amountInEgp: number, targetCurrency = currency) => {
    const rate = EXCHANGE_RATES[targetCurrency] || 1;
    const converted = amountInEgp * rate;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: targetCurrency,
      maximumFractionDigits: targetCurrency === "EGP" ? 0 : 2,
    }).format(converted);
  };

  // ─── Filtered Transactions ───────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    return transactions.filter((tx) => {
      // Type
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      // Status
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      // Category
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesEntity = (tx.entityName || "").toLowerCase().includes(q);
        const matchesInv = (tx.invoiceNumber || "").toLowerCase().includes(q);
        const matchesNotes = (tx.notes || "").toLowerCase().includes(q);
        if (!matchesDesc && !matchesEntity && !matchesInv && !matchesNotes) return false;
      }
      // Date range
      if (dateRange !== "all") {
        const txTime = new Date(tx.transactionDate).getTime();
        const days = dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
        if (now - txTime > days * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, statusFilter, categoryFilter, searchQuery, dateRange]);

  // ─── Financial Aggregations ──────────────────────────────────────────────
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let pendingReceivables = 0;
    let refundedTotal = 0;

    const categoryExpMap: Record<string, number> = {};
    const categoryRevMap: Record<string, number> = {};
    const statusMap = { paid: 0, pending: 0, refunded: 0, cancelled: 0 };

    transactions.forEach((tx) => {
      statusMap[tx.status as keyof typeof statusMap] =
        (statusMap[tx.status as keyof typeof statusMap] || 0) + 1;

      if (tx.status === "paid") {
        if (tx.type === "revenue") {
          totalRevenue += tx.amount;
          categoryRevMap[tx.category] = (categoryRevMap[tx.category] || 0) + tx.amount;
        } else if (tx.type === "expense") {
          totalExpenses += tx.amount;
          categoryExpMap[tx.category] = (categoryExpMap[tx.category] || 0) + tx.amount;
        }
      } else if (tx.status === "pending" && tx.type === "revenue") {
        pendingReceivables += tx.amount;
      } else if (tx.status === "refunded") {
        refundedTotal += tx.amount;
      }
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Tenant counts
    const tierCounts = {
      free: tenants.filter((t) => t.tier === "free").length,
      pro: tenants.filter((t) => t.tier === "pro").length,
      enterprise: tenants.filter((t) => t.tier === "enterprise").length,
    };

    // Baseline MRR from active projects
    const mrrFromTenants = tierCounts.pro * 499 + tierCounts.enterprise * 2499;
    const effectiveMRR = Math.max(mrrFromTenants, Math.round(totalRevenue / 3) || mrrFromTenants);
    const arr = effectiveMRR * 12;
    const paidTenants = tierCounts.pro + tierCounts.enterprise;
    const arpu = paidTenants > 0 ? Math.round(effectiveMRR / paidTenants) : 0;

    // Last 6 months cashflow trend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlyTrend: Array<{
      label: string;
      revenue: number;
      expenses: number;
      net: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const label = `${monthNames[mIdx]} ${yr.toString().slice(-2)}`;

      const mTx = transactions.filter((tx) => {
        if (tx.status !== "paid") return false;
        const txD = new Date(tx.transactionDate);
        return txD.getFullYear() === yr && txD.getMonth() === mIdx;
      });

      const rev = mTx.filter((t) => t.type === "revenue").reduce((s, t) => s + t.amount, 0);
      const exp = mTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      monthlyTrend.push({
        label,
        revenue: rev,
        expenses: exp,
        net: rev - exp,
      });
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      pendingReceivables,
      refundedTotal,
      mrr: effectiveMRR,
      arr,
      arpu,
      tierCounts,
      categoryExpMap,
      categoryRevMap,
      statusMap,
      monthlyTrend,
    };
  }, [transactions, tenants]);

  // ─── Runway Calculations ─────────────────────────────────────────────────
  const runwayCalculation = useMemo(() => {
    const reserves = parseFloat(cashReservesInput) || 0;
    const avgMonthlyExpense = metrics.totalExpenses > 0 ? metrics.totalExpenses / 3 : 2500;
    const avgMonthlyRevenue = metrics.totalRevenue > 0 ? metrics.totalRevenue / 3 : metrics.mrr;
    const netBurn = Math.max(0, avgMonthlyExpense - avgMonthlyRevenue);
    const runwayMonths = netBurn > 0 ? (reserves / netBurn).toFixed(1) : "Profitable (∞)";

    return {
      reserves,
      avgMonthlyExpense,
      avgMonthlyRevenue,
      netBurn,
      runwayMonths,
    };
  }, [cashReservesInput, metrics]);

  // ─── VAT Calculations ────────────────────────────────────────────────────
  const vatCalculation = useMemo(() => {
    const rate = vatRateInput / 100;
    const taxableSales = metrics.totalRevenue;
    const outputVat = taxableSales * rate;
    const deductibleExpenses = metrics.totalExpenses;
    const inputVat = deductibleExpenses * rate;
    const netVatPayable = Math.max(0, outputVat - inputVat);

    return {
      taxableSales,
      outputVat,
      deductibleExpenses,
      inputVat,
      netVatPayable,
    };
  }, [metrics, vatRateInput]);

  // ─── Action Handlers ─────────────────────────────────────────────────────
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount) {
      showToast("Please enter a valid description and amount", "error");
      return;
    }

    startTransition(async () => {
      const res = await createAccountingTransaction({
        type: formData.type,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        tenantId: formData.tenantId || null,
        entityName: formData.entityName || null,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        invoiceNumber: formData.invoiceNumber || null,
        notes: formData.notes || null,
        transactionDate: formData.transactionDate,
      });

      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction as any, ...prev]);
        setShowAddModal(false);
        showToast("Transaction successfully recorded!");
        // Reset form
        setFormData({
          type: "revenue",
          category: "subscription",
          description: "",
          amount: "",
          currency: "EGP",
          tenantId: "",
          entityName: "",
          status: "paid",
          paymentMethod: "instapay",
          invoiceNumber: "",
          notes: "",
          transactionDate: new Date().toISOString().split("T")[0],
        });
      } else {
        showToast(res.error || "Failed to create transaction", "error");
      }
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this transaction record?")) return;
    startTransition(async () => {
      const res = await deleteAccountingTransaction(id);
      if (res.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        showToast("Transaction deleted");
      } else {
        showToast(res.error || "Failed to delete transaction", "error");
      }
    });
  };

  const handleUpdateStatus = (id: string, newStatus: "paid" | "pending" | "refunded" | "cancelled") => {
    startTransition(async () => {
      const res = await updateAccountingTransaction(id, { status: newStatus });
      if (res.success) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
        showToast(`Status updated to ${newStatus}`);
      } else {
        showToast(res.error || "Failed to update status", "error");
      }
    });
  };

  const handleSeedData = () => {
    if (!confirm("Seed initial financial transactions based on current active tenants & cloud infrastructure?")) return;
    startTransition(async () => {
      const res = await seedInitialAccountingData();
      if (res.success) {
        showToast(`Seeded ${res.count} realistic transactions! Please refresh.`);
        window.location.reload();
      } else {
        showToast(res.error || "Failed to seed data", "error");
      }
    });
  };

  // ─── Report Export Handlers ──────────────────────────────────────────────
  const handleDownloadLedgerCsv = () => {
    const headers = [
      "ID",
      "Date",
      "Type",
      "Category",
      "Description",
      "Entity / Client",
      "Amount (EGP)",
      "Currency",
      "Status",
      "Payment Method",
      "Invoice Number",
      "Notes",
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${new Date(tx.transactionDate).toISOString().split("T")[0]}"`,
      `"${tx.type.toUpperCase()}"`,
      `"${tx.category}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.entityName || "").replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.currency}"`,
      `"${tx.status.toUpperCase()}"`,
      `"${tx.paymentMethod}"`,
      `"${tx.invoiceNumber || ""}"`,
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jozelio-ledger-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMonthlyCsv = () => {
    const headers = ["Month", "Gross Revenue (EGP)", "Operating Expenses (EGP)", "Net Profit (EGP)", "Margin %"];
    const rows = metrics.monthlyTrend.map((m) => [
      `"${m.label}"`,
      m.revenue,
      m.expenses,
      m.net,
      `"${m.revenue > 0 ? ((m.net / m.revenue) * 100).toFixed(1) + "%" : "0%"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jozelio-monthly-pnl-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          metrics,
          transactions: filteredTransactions,
        },
        null,
        2
      )
    );
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `jozelio-accounting-backup-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Donut Chart SVG Helpers ─────────────────────────────────────────────
  const renderDonutSlices = (data: Array<{ label: string; value: number; color: string }>) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return (
        <circle cx="64" cy="64" r="46" fill="transparent" stroke="#e5e7eb" strokeWidth="20" />
      );
    }

    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return data.map((item, index) => {
      const strokeDash = (item.value / total) * circumference;
      const strokeOffset = circumference - accumulatedAngle;
      accumulatedAngle += strokeDash;

      return (
        <circle
          key={index}
          cx="64"
          cy="64"
          r={radius}
          fill="transparent"
          stroke={item.color}
          strokeWidth="20"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={strokeOffset}
          className="transition-all duration-300 hover:opacity-85 cursor-pointer"
        >
          <title>{`${item.label}: ${formatMoney(item.value)} (${((item.value / total) * 100).toFixed(1)}%)`}</title>
        </circle>
      );
    });
  };

  // Expense Donut Data
  const expenseChartData = useMemo(() => {
    const colors = ["#113669", "#f58a2d", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#64748b"];
    const entries = Object.entries(metrics.categoryExpMap).map(([cat, val], idx) => ({
      label: cat.toUpperCase(),
      value: val,
      color: colors[idx % colors.length],
    }));
    return entries.length > 0
      ? entries
      : [{ label: "No Expenses", value: 1, color: "#e5e7eb" }];
  }, [metrics.categoryExpMap]);

  // Max value for bar charts scaling
  const maxMonthlyBar = useMemo(() => {
    const maxVal = Math.max(...metrics.monthlyTrend.map((m) => Math.max(m.revenue, m.expenses)), 1000);
    return maxVal * 1.15;
  }, [metrics.monthlyTrend]);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Toast Alert Banner */}
      {actionMessage && (
        <div
          className={`p-4 text-xs font-bold flex items-center justify-between border-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
              : "bg-rose-50 border-rose-500 text-rose-800"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-mono text-sm">✕</button>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-2xl text-brand-blue uppercase tracking-tight">
            Accounting & Revenue Operations
          </h2>
          <p className="text-xs text-brand-blue/70 mt-0.5">
            Real-time cashflow tracking, P&L generation, tax forecasting, and audit reports.
          </p>
        </div>

        {/* Currency & Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Switcher */}
          <div className="flex items-center border-2 border-brand-blue bg-brand-grey/20 p-1 font-mono text-xs font-bold">
            {(["EGP", "USD", "EUR", "SAR", "AED"] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-2 py-1 transition-all cursor-pointer ${
                  currency === curr
                    ? "bg-brand-blue text-brand-white shadow-[1px_1px_0px_#000]"
                    : "text-brand-blue/70 hover:text-brand-blue"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-brand-white hover:text-brand-blue text-brand-white border-2 border-brand-blue font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#113669] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>

          <button
            onClick={() => setShowStatementModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-white hover:bg-brand-grey/20 text-brand-blue border-2 border-brand-blue font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#113669] transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>P&L Statement</span>
          </button>

          {isOwner && transactions.length === 0 && (
            <button
              onClick={handleSeedData}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-900 border-2 border-amber-600 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#b45309] hover:bg-amber-200 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>Seed Initial Data</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Financial KPI Overview Cards Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-5 shadow-[4px_4px_0px_#113669]">
          <div className="flex items-center justify-between text-brand-blue/70">
            <span className="font-mono text-xs uppercase font-bold tracking-wider">Monthly Recurring (MRR)</span>
            <DollarSign className="w-4 h-4 text-brand-orange" />
          </div>
          <div className="font-display font-black text-2xl text-brand-blue mt-2">
            {formatMoney(metrics.mrr)}
          </div>
          <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-brand-blue/70">
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-400 px-1 font-bold">
              ARR: {formatMoney(metrics.arr)}
            </span>
            <span>• {metrics.tierCounts.pro + metrics.tierCounts.enterprise} active subscribers</span>
          </div>
        </div>

        {/* Gross Revenue Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-5 shadow-[4px_4px_0px_#113669]">
          <div className="flex items-center justify-between text-brand-blue/70">
            <span className="font-mono text-xs uppercase font-bold tracking-wider">Total Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-700 mt-2">
            {formatMoney(metrics.totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-brand-blue/70">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending receivables: <strong>{formatMoney(metrics.pendingReceivables)}</strong></span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-5 shadow-[4px_4px_0px_#113669]">
          <div className="flex items-center justify-between text-brand-blue/70">
            <span className="font-mono text-xs uppercase font-bold tracking-wider">Operating Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-display font-black text-2xl text-rose-700 mt-2">
            {formatMoney(metrics.totalExpenses)}
          </div>
          <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-brand-blue/70">
            <span>Cloud infra, AI tokens, email & operations</span>
          </div>
        </div>

        {/* Net Profit & Margin Card */}
        <div className="bg-brand-white border-2 border-brand-blue p-5 shadow-[4px_4px_0px_#113669]">
          <div className="flex items-center justify-between text-brand-blue/70">
            <span className="font-mono text-xs uppercase font-bold tracking-wider">Net Profit & Margin</span>
            <Sliders className="w-4 h-4 text-brand-blue" />
          </div>
          <div
            className={`font-display font-black text-2xl mt-2 ${
              metrics.netProfit >= 0 ? "text-brand-blue" : "text-rose-700"
            }`}
          >
            {formatMoney(metrics.netProfit)}
          </div>
          <div className="flex items-center gap-2 mt-2 font-mono text-[10px]">
            <span
              className={`px-1.5 py-0.5 border font-bold ${
                metrics.profitMargin >= 0
                  ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                  : "bg-rose-100 text-rose-800 border-rose-400"
              }`}
            >
              {metrics.profitMargin.toFixed(1)}% Net Margin
            </span>
            <span className="text-brand-blue/70">ARPU: {formatMoney(metrics.arpu)}</span>
          </div>
        </div>
      </div>

      {/* ─── Visual Graphs Section ("circle graphs & normal graphs") ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Normal Graph: Monthly Cashflow Trend Bar Chart (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-brand-blue/20 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-orange" />
                <h3 className="font-display font-black text-sm uppercase tracking-tight text-brand-blue">
                  Monthly Cashflow & Trend (Last 6 Months)
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-brand-blue"></div>
                  <span className="text-brand-blue/80">Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-rose-500"></div>
                  <span className="text-brand-blue/80">Expenses</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-emerald-500"></div>
                  <span className="text-brand-blue/80">Net</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Canvas */}
            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
              {metrics.monthlyTrend.map((m, idx) => {
                const revHeight = maxMonthlyBar > 0 ? (m.revenue / maxMonthlyBar) * 100 : 0;
                const expHeight = maxMonthlyBar > 0 ? (m.expenses / maxMonthlyBar) * 100 : 0;
                const netHeight = maxMonthlyBar > 0 ? (Math.abs(m.net) / maxMonthlyBar) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 bg-brand-blue text-brand-white p-2 text-[10px] font-mono whitespace-nowrap z-20 shadow-[2px_2px_0px_#f58a2d] pointer-events-none">
                      <div>Rev: {formatMoney(m.revenue)}</div>
                      <div>Exp: {formatMoney(m.expenses)}</div>
                      <div className={m.net >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        Net: {formatMoney(m.net)}
                      </div>
                    </div>

                    {/* Bars group */}
                    <div className="w-full flex items-end justify-center gap-1 h-48 border-b-2 border-brand-blue/30 pb-0.5">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${Math.max(4, revHeight)}%` }}
                        className="w-1/3 bg-brand-blue border border-brand-blue transition-all group-hover:brightness-125"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(4, expHeight)}%` }}
                        className="w-1/3 bg-rose-500 border border-rose-700 transition-all group-hover:brightness-125"
                      />
                      {/* Net Bar */}
                      <div
                        style={{ height: `${Math.max(4, netHeight)}%` }}
                        className={`w-1/3 border transition-all ${
                          m.net >= 0
                            ? "bg-emerald-500 border-emerald-700"
                            : "bg-rose-700 border-rose-900"
                        }`}
                      />
                    </div>

                    <span className="font-mono text-[10px] text-brand-blue/80 font-bold mt-2">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-blue/20 flex items-center justify-between text-[11px] font-mono text-brand-blue/70">
            <span>
              Cumulative Profit:{" "}
              <strong className={metrics.netProfit >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                {formatMoney(metrics.netProfit)}
              </strong>
            </span>
            <button
              onClick={handleDownloadMonthlyCsv}
              className="text-brand-orange hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export Monthly P&L (CSV)</span>
            </button>
          </div>
        </div>

        {/* Circle Graphs (Donut Charts): Tier Revenue & Expense Breakdown */}
        <div className="bg-brand-white border-2 border-brand-blue p-6 shadow-[4px_4px_0px_#113669] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-brand-blue/20 pb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-brand-orange" />
                <h3 className="font-display font-black text-sm uppercase tracking-tight text-brand-blue">
                  Expense Distribution
                </h3>
              </div>
              <span className="font-mono text-[10px] text-brand-blue/60">ByCategory</span>
            </div>

            {/* SVG Donut */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  {renderDonutSlices(expenseChartData)}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-[10px] text-brand-blue/60 uppercase">Total</span>
                  <span className="font-display font-black text-xs text-brand-blue">
                    {formatMoney(metrics.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {expenseChartData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="truncate text-brand-blue/80">{item.label}</span>
                  </div>
                  <span className="font-bold text-brand-blue shrink-0">{formatMoney(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-blue/20">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-brand-blue/70">Subscribers:</span>
              <div className="flex gap-2 font-bold">
                <span className="text-brand-orange">Pro: {metrics.tierCounts.pro}</span>
                <span className="text-brand-blue">Ent: {metrics.tierCounts.enterprise}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Financial Tools Row (Runway Calculator & VAT Estimator) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Runway & Burn Rate Calculator */}
        <div className="bg-brand-white border-2 border-brand-blue p-5 shadow-[4px_4px_0px_#113669]">
          <div className="flex items-center justify-between border-b border-brand-blue/20 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-orange" />
              <h4 className="font-display font-black text-sm uppercase text-brand-blue">
                Runway & Burn Rate Forecast
              </h4>
            </div>
            <button
              onClick={() => setShowRunwayTool(!showRunwayTool)}
              className="text-xs font-mono font-bold text-brand-orange hover:underline cursor-pointer"
            >
              {showRunwayTool ? "Collapse" : "Configure"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center font-mono">
            <div className="bg-brand-grey/20 border border-brand-blue/40 p-2">
              <span className="text-[10px] text-brand-blue/60 uppercase block">Est. Monthly Burn</span>
              <strong className="text-sm text-rose-700 font-bold block mt-1">
                {formatMoney(runwayCalculation.netBurn)}
              </strong>
            </div>
            <div className="bg-brand-grey/20 border border-brand-blue/40 p-2">
              <span className="text-[10px] text-brand-blue/60 uppercase block">Cash in Bank</span>
              <strong className="text-sm text-brand-blue font-bold block mt-1">
                {formatMoney(runwayCalculation.reserves)}
              </strong>
            </div>
            <div className="bg-brand-orange/10 border border-brand-orange p-2">
              <span className="text-[10px] text-brand-orange uppercase block">Runway Left</span>
              <strong className="text-sm text-brand-orange font-black block mt-1">
                {runwayCalculation.runwayMonths} {typeof runwayCalculation.runwayMonths === "string" && runwayCalculation.runwayMonths.includes("∞") ? "" : "Mos"}
              </strong>
            </div>
          </div>

          {showRunwayTool && (
            <div className="mt-4 pt-3 border-t border-brand-blue/20 flex items-center gap-3">
              <label className="text-xs font-mono font-bold text-brand-blue whitespace-nowrap">
                Update Cash Reserves ({currency}):
              </label>
              <input
                type="number"
                value={cashReservesInput}
                onChange={(e) => setCashReservesInput(e.target.value)}
                className="flex-1 px-3 py-1 bg-brand-white border-2 border-brand-blue text-xs font-mono font-bold"
                placeholder="e.g. 200000"
              />
            </div>
          )}
        </div>

        {/* Tool 2: VAT & Tax Estimator */}
        <div className="bg-brand-white border-2 border-brand-blue p-5 shadow-[4px_4px_0px_#113669]">
          <div className="flex items-center justify-between border-b border-brand-blue/20 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h4 className="font-display font-black text-sm uppercase text-brand-blue">
                VAT & Corporate Tax Liability
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-brand-blue/60 font-bold">Rate:</span>
              <input
                type="number"
                value={vatRateInput}
                onChange={(e) => setVatRateInput(parseFloat(e.target.value) || 0)}
                className="w-12 px-1 py-0.5 border border-brand-blue text-center font-bold bg-brand-grey/20 text-xs"
              />
              <span className="font-bold">%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center font-mono">
            <div className="bg-brand-grey/20 border border-brand-blue/40 p-2">
              <span className="text-[10px] text-brand-blue/60 uppercase block">Output VAT (Sales)</span>
              <strong className="text-sm text-brand-blue font-bold block mt-1">
                {formatMoney(vatCalculation.outputVat)}
              </strong>
            </div>
            <div className="bg-brand-grey/20 border border-brand-blue/40 p-2">
              <span className="text-[10px] text-brand-blue/60 uppercase block">Input VAT (Credit)</span>
              <strong className="text-sm text-emerald-700 font-bold block mt-1">
                {formatMoney(vatCalculation.inputVat)}
              </strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-500 p-2">
              <span className="text-[10px] text-emerald-800 uppercase block">Net VAT Payable</span>
              <strong className="text-sm text-emerald-800 font-black block mt-1">
                {formatMoney(vatCalculation.netVatPayable)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Transaction Ledger & Table Management ───────────────────────── */}
      <div className="bg-brand-white border-2 border-brand-blue shadow-[4px_4px_0px_#113669]">
        {/* Table Controls & Filter Header */}
        <div className="p-5 border-b-2 border-brand-blue flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-black text-lg text-brand-blue uppercase tracking-tight">
              Financial Transaction Ledger ({filteredTransactions.length})
            </h3>
            <p className="text-xs text-brand-blue/70">
              Verified income receipts, operational bills, platform subscriptions, and invoices.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadLedgerCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-white hover:bg-brand-grey/20 text-brand-blue border-2 border-brand-blue font-mono text-xs font-bold shadow-[2px_2px_0px_#113669] transition-all cursor-pointer"
              title="Export filtered records to spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-white hover:bg-brand-grey/20 text-brand-blue border-2 border-brand-blue font-mono text-xs font-bold shadow-[2px_2px_0px_#113669] transition-all cursor-pointer"
              title="Backup raw JSON data"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-brand-grey/10 border-b-2 border-brand-blue flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-blue/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, description, client, vendor..."
              className="w-full pl-8 pr-3 py-1.5 bg-brand-white border-2 border-brand-blue text-xs font-mono font-medium focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex border-2 border-brand-blue bg-brand-white font-mono text-xs font-bold">
            {(["all", "revenue", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 capitalize transition-all cursor-pointer ${
                  typeFilter === t
                    ? "bg-brand-blue text-brand-white"
                    : "text-brand-blue hover:bg-brand-grey/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter Dropdown */}
          <BrutalistSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Status: All" },
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "refunded", label: "Refunded" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            className="w-40"
            buttonClassName="!h-9 !text-xs !shadow-[2px_2px_0px_#113669]"
          />

          {/* Date Filter Dropdown */}
          <BrutalistSelect
            value={dateRange}
            onChange={(val) => setDateRange(val as any)}
            options={[
              { value: "all", label: "Date: All Time" },
              { value: "30d", label: "Last 30 Days" },
              { value: "90d", label: "Last 90 Days" },
              { value: "year", label: "Last 365 Days" },
            ]}
            className="w-44"
            buttonClassName="!h-9 !text-xs !shadow-[2px_2px_0px_#113669]"
          />
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-brand-blue bg-brand-blue text-brand-white font-mono uppercase tracking-wider text-[10px]">
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description & Invoice</th>
                <th className="p-3">Client / Vendor</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-brand-blue/20 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-brand-blue/50 font-mono">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No financial records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-brand-grey/15 transition-colors">
                    {/* Date */}
                    <td className="p-3 text-brand-blue/80 whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Type Badge */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border font-bold text-[10px] uppercase ${
                          tx.type === "revenue"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                            : "bg-rose-100 text-rose-800 border-rose-500"
                        }`}
                      >
                        {tx.type === "revenue" ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-rose-600" />
                        )}
                        {tx.type}
                      </span>
                    </td>

                    {/* Description & Invoice */}
                    <td className="p-3">
                      <div className="font-bold text-brand-blue max-w-xs truncate">{tx.description}</div>
                      {tx.invoiceNumber && (
                        <div className="text-[10px] text-brand-blue/60 flex items-center gap-1 mt-0.5">
                          <span>{tx.invoiceNumber}</span>
                          <span className="text-brand-orange font-bold uppercase">({tx.paymentMethod})</span>
                        </div>
                      )}
                    </td>

                    {/* Entity */}
                    <td className="p-3 text-brand-blue/80 whitespace-nowrap">
                      {tx.entityName || "—"}
                    </td>

                    {/* Category */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-brand-grey/25 border border-brand-blue/30 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue uppercase">
                        {tx.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="p-3 whitespace-nowrap font-black">
                      <span className={tx.type === "revenue" ? "text-emerald-700" : "text-rose-700"}>
                        {tx.type === "revenue" ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </span>
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="p-3 whitespace-nowrap">
                      <BrutalistSelect
                        value={tx.status}
                        onChange={(val) => handleUpdateStatus(tx.id, val as any)}
                        options={[
                          { value: "paid", label: "PAID" },
                          { value: "pending", label: "PENDING" },
                          { value: "refunded", label: "REFUNDED" },
                          { value: "cancelled", label: "CANCELLED" },
                        ]}
                        className="w-32"
                        buttonClassName={`!h-7 !px-2 !py-0.5 !text-[10px] !shadow-none ${
                          tx.status === "paid"
                            ? "!bg-emerald-50 !text-emerald-800 !border-emerald-600"
                            : tx.status === "pending"
                            ? "!bg-amber-50 !text-amber-800 !border-amber-600"
                            : "!bg-rose-50 !text-rose-800 !border-rose-600"
                        }`}
                      />
                    </td>

                    {/* Actions */}
                    <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="p-1 hover:bg-brand-blue/10 border border-brand-blue text-brand-blue transition-colors cursor-pointer"
                        title="View Official Receipt / Invoice"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1 hover:bg-rose-50 border border-rose-400 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Transaction Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-blue/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-brand-white border-2 border-brand-blue max-w-lg w-full p-6 shadow-[8px_8px_0px_#113669] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-brand-blue hover:text-brand-orange font-mono text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-black text-lg text-brand-blue uppercase mb-1">
              Record Financial Transaction
            </h3>
            <p className="text-xs text-brand-blue/70 mb-4 font-mono">
              Add verified revenue receipt or platform operational expense.
            </p>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: "revenue",
                      category: "subscription",
                    }))
                  }
                  className={`py-2 border-2 border-brand-blue uppercase cursor-pointer ${
                    formData.type === "revenue"
                      ? "bg-emerald-500 text-white font-black shadow-[2px_2px_0px_#113669]"
                      : "bg-brand-grey/20 text-brand-blue"
                  }`}
                >
                  + Revenue (Income)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: "expense",
                      category: "cloudflare",
                    }))
                  }
                  className={`py-2 border-2 border-brand-blue uppercase cursor-pointer ${
                    formData.type === "expense"
                      ? "bg-rose-500 text-white font-black shadow-[2px_2px_0px_#113669]"
                      : "bg-brand-grey/20 text-brand-blue"
                  }`}
                >
                  - Expense (Outflow)
                </button>
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Category:
                  </label>
                  <BrutalistSelect
                    value={formData.category}
                    onChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                    options={CATEGORIES[formData.type]}
                    className="w-full"
                    buttonClassName="!h-10 !text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Amount ({currency}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-brand-white border-2 border-brand-blue text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                  Description:
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="e.g. Pro Plan Annual Subscription or Upstash Redis Invoice"
                  className="w-full px-3 py-2 bg-brand-white border-2 border-brand-blue text-xs font-mono"
                />
              </div>

              {/* Client / Vendor & Tenant Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Client / Vendor Name:
                  </label>
                  <input
                    type="text"
                    value={formData.entityName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, entityName: e.target.value }))}
                    placeholder="e.g. Gusto Pizza or Cloudflare Inc."
                    className="w-full px-3 py-2 bg-brand-white border-2 border-brand-blue text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Associated Project:
                  </label>
                  <BrutalistSelect
                    value={formData.tenantId}
                    onChange={(val) => setFormData((prev) => ({ ...prev, tenantId: val }))}
                    options={[
                      { value: "", label: "None / General Platform" },
                      ...tenants.map((t) => ({
                        value: t.id,
                        label: `${t.businessName} (${t.tier.toUpperCase()})`,
                      })),
                    ]}
                    className="w-full"
                    buttonClassName="!h-10 !text-xs font-normal"
                  />
                </div>
              </div>

              {/* Payment Method, Status & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Method:
                  </label>
                  <BrutalistSelect
                    value={formData.paymentMethod}
                    onChange={(val) => setFormData((prev) => ({ ...prev, paymentMethod: val }))}
                    options={PAYMENT_METHODS}
                    className="w-full"
                    buttonClassName="!h-10 !text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Status:
                  </label>
                  <BrutalistSelect
                    value={formData.status}
                    onChange={(val) => setFormData((prev) => ({ ...prev, status: val as any }))}
                    options={[
                      { value: "paid", label: "Paid" },
                      { value: "pending", label: "Pending" },
                      { value: "refunded", label: "Refunded" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    className="w-full"
                    buttonClassName="!h-10 !text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                    Date:
                  </label>
                  <input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))}
                    className="w-full px-2 py-2 bg-brand-white border-2 border-brand-blue text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-brand-blue uppercase mb-1">
                  Internal Notes:
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional reference, receipt link, or approval notes"
                  className="w-full px-3 py-2 bg-brand-white border-2 border-brand-blue text-xs font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-brand-blue/20">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border-2 border-brand-blue font-mono text-xs font-bold uppercase hover:bg-brand-grey/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-brand-orange text-brand-white border-2 border-brand-blue font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#113669] hover:bg-brand-blue cursor-pointer"
                >
                  {isPending ? "Recording..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Official Receipt / Invoice Modal ─────────────────────────────── */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 bg-brand-blue/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
          <div className="bg-brand-white border-2 border-brand-blue max-w-lg w-full p-8 shadow-[8px_8px_0px_#113669] relative font-mono text-brand-blue print:shadow-none print:border-none">
            <button
              onClick={() => setSelectedReceiptTx(null)}
              className="absolute top-4 right-4 text-brand-blue hover:text-brand-orange font-mono text-xl font-bold cursor-pointer print:hidden"
            >
              ✕
            </button>

            {/* Receipt Header */}
            <div className="border-b-2 border-brand-blue pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-display font-black text-xl uppercase text-brand-blue tracking-tight">
                    JOZELIO TECHNOLOGIES
                  </h2>
                  <p className="text-[10px] text-brand-blue/70">
                    Official Financial Transaction Receipt & Voucher
                  </p>
                </div>
                <span className="text-[10px] bg-brand-blue text-brand-white px-2 py-0.5 font-bold uppercase">
                  {selectedReceiptTx.status}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-brand-blue/60">Invoice / Voucher #:</span>
                <strong>{selectedReceiptTx.invoiceNumber || selectedReceiptTx.id.slice(0, 8)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-blue/60">Date of Record:</span>
                <span>{new Date(selectedReceiptTx.transactionDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-blue/60">Transaction Type:</span>
                <span className="uppercase font-bold">{selectedReceiptTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-blue/60">Category:</span>
                <span className="capitalize">{selectedReceiptTx.category.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-blue/60">Entity (Customer/Vendor):</span>
                <span>{selectedReceiptTx.entityName || "Platform Account"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-blue/60">Payment Method:</span>
                <span className="capitalize">{selectedReceiptTx.paymentMethod}</span>
              </div>
              {selectedReceiptTx.notes && (
                <div className="flex justify-between">
                  <span className="text-brand-blue/60">Notes:</span>
                  <span className="text-[11px] italic">{selectedReceiptTx.notes}</span>
                </div>
              )}
            </div>

            {/* Total Block */}
            <div className="bg-brand-grey/25 border-2 border-brand-blue p-4 flex justify-between items-center mb-6">
              <span className="font-bold uppercase text-xs">Total Settled Amount:</span>
              <span className="font-display font-black text-xl text-brand-orange">
                {formatMoney(selectedReceiptTx.amount)}
              </span>
            </div>

            {/* Print & Close Buttons */}
            <div className="flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="px-4 py-2 border-2 border-brand-blue text-xs font-bold uppercase hover:bg-brand-grey/20 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-brand-blue text-brand-white border-2 border-brand-blue text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#f58a2d] hover:bg-brand-orange cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Printable P&L Statement Modal ───────────────────────────────── */}
      {showStatementModal && (
        <div className="fixed inset-0 bg-brand-blue/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:p-0 print:bg-white overflow-y-auto">
          <div className="bg-brand-white border-2 border-brand-blue max-w-2xl w-full p-8 shadow-[8px_8px_0px_#113669] font-mono text-brand-blue relative my-8 print:shadow-none print:border-none">
            <button
              onClick={() => setShowStatementModal(false)}
              className="absolute top-4 right-4 text-brand-blue hover:text-brand-orange font-mono text-xl font-bold cursor-pointer print:hidden"
            >
              ✕
            </button>

            {/* Statement Header */}
            <div className="text-center border-b-2 border-brand-blue pb-4 mb-6">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight text-brand-blue">
                JOZELIO TECHNOLOGIES
              </h2>
              <h3 className="font-mono text-sm font-bold text-brand-orange uppercase mt-0.5">
                Official Statement of Profit & Loss (P&L)
              </h3>
              <p className="text-[10px] text-brand-blue/60 mt-1">
                Generated: {new Date().toLocaleDateString()} • Base Currency: {currency} • All Storefront Projects Included
              </p>
            </div>

            {/* Revenue Breakdown */}
            <div className="mb-6">
              <h4 className="font-black text-xs uppercase bg-brand-blue text-brand-white px-3 py-1 mb-2">
                1. Gross Revenue
              </h4>
              <div className="space-y-1.5 text-xs px-2">
                {Object.entries(metrics.categoryRevMap).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between border-b border-brand-blue/10 py-1">
                    <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                    <span className="font-bold">{formatMoney(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-sm pt-2 text-emerald-800">
                  <span>Total Gross Revenue:</span>
                  <span>{formatMoney(metrics.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="mb-6">
              <h4 className="font-black text-xs uppercase bg-brand-blue text-brand-white px-3 py-1 mb-2">
                2. Operating Expenses
              </h4>
              <div className="space-y-1.5 text-xs px-2">
                {Object.entries(metrics.categoryExpMap).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between border-b border-brand-blue/10 py-1">
                    <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                    <span className="font-bold">{formatMoney(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-sm pt-2 text-rose-800">
                  <span>Total Operating Expenses:</span>
                  <span>{formatMoney(metrics.totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Tax & Net Summary */}
            <div className="bg-brand-grey/25 border-2 border-brand-blue p-4 space-y-2 mb-8 text-xs">
              <div className="flex justify-between">
                <span>Net Operating Income (EBITDA):</span>
                <strong className={metrics.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {formatMoney(metrics.netProfit)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated Net VAT Liability ({vatRateInput}%):</span>
                <span>{formatMoney(vatCalculation.netVatPayable)}</span>
              </div>
              <div className="border-t-2 border-brand-blue pt-2 flex justify-between font-black text-base text-brand-blue">
                <span>Net Retained Earnings:</span>
                <span>{formatMoney(metrics.netProfit - vatCalculation.netVatPayable)}</span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-brand-blue/30 text-center text-xs">
              <div>
                <div className="border-b border-brand-blue pb-6 mb-1 text-brand-blue/40 italic">Signature</div>
                <span className="font-bold">Prepared by Platform Operator</span>
              </div>
              <div>
                <div className="border-b border-brand-blue pb-6 mb-1 text-brand-blue/40 italic">Seal / Approval</div>
                <span className="font-bold">Super Admin Authority</span>
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="flex justify-end gap-2 mt-8 print:hidden border-t border-brand-blue/20 pt-4">
              <button
                onClick={() => setShowStatementModal(false)}
                className="px-4 py-2 border-2 border-brand-blue text-xs font-bold uppercase hover:bg-brand-grey/20 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-brand-orange text-brand-white border-2 border-brand-blue text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#113669] hover:bg-brand-blue cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

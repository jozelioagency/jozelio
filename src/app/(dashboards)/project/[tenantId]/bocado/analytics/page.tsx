import { notFound, redirect } from "next/navigation";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { cookies } from "next/headers";
import AnalyticsClient from "./AnalyticsClient";


/** Parse and validate the date range from searchParams */
function getDateRange(searchParams: Record<string, string | undefined>): {
  startDate: Date;
  endDate: Date;
  rangeKey: string;
  customStart: string;
  customEnd: string;
} {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Custom date range
  if (searchParams.start && searchParams.end) {
    const start = new Date(searchParams.start + "T00:00:00Z");
    const end = new Date(searchParams.end + "T23:59:59Z");
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      return { startDate: start, endDate: end, rangeKey: "custom", customStart: searchParams.start, customEnd: searchParams.end };
    }
  }

  // Preset ranges
  const range = searchParams.range || "7d";
  const daysMap: Record<string, number> = { "7d": 7, "28d": 28, "90d": 90, "1y": 365 };
  const days = daysMap[range] ?? 7;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate, rangeKey: range, customStart: "", customEnd: "" };
}

/** Build evenly-spaced date labels for the timeline chart */
function buildTimeline(
  startDate: Date,
  endDate: Date,
  timelineRaw: Array<{ day: string; type: string; count: number }>
): Array<{ date: string; views: number; scans: number }> {
  const days: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    days.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return days.map((dateStr) => {
    const viewsMatch = timelineRaw.find((t) => t.day === dateStr && t.type === "view");
    const scansMatch = timelineRaw.find((t) => t.day === dateStr && t.type === "qr_scan");
    return { date: dateStr, views: viewsMatch?.count || 0, scans: scansMatch?.count || 0 };
  });
}

export default async function AnalyticsPage(
  props: {
    params: Promise<{ tenantId: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
  }
) {
  const { tenantId } = await props.params;
  const resolvedSearchParams = await props.searchParams;

  // 1. Authenticate user
  const session = await getSession();
  if (!session) redirect("/");

  // 2. DB context
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB, { schema });

  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .get();

  if (!tenant) notFound();

  // 3. Authorization check
  const isOwner = tenant.userId === session.user.id;
  if (!isOwner) {
    const member = await db
      .select()
      .from(schema.tenantMembers)
      .where(
        and(
          eq(schema.tenantMembers.tenantId, tenantId),
          eq(schema.tenantMembers.userId, session.user.id),
          eq(schema.tenantMembers.status, "accepted")
        )
      )
      .get();
    if (!member) redirect("/dashboard");
  }

  // 4. Resolve date range
  const { startDate, endDate, rangeKey, customStart, customEnd } = getDateRange(resolvedSearchParams);

  const dateFilter = and(
    eq(schema.analyticsEvents.tenantId, tenantId),
    gte(schema.analyticsEvents.createdAt, startDate),
    lte(schema.analyticsEvents.createdAt, endDate)
  );

  // 5. Fetch all metrics within the selected date range
  const [viewsRes, scansRes, uniqueRes, devicesRaw, referrersRaw, timelineRaw] = await Promise.all([
    // Total Views
    db.select({ count: sql<number>`count(*)` })
      .from(schema.analyticsEvents)
      .where(and(dateFilter, eq(schema.analyticsEvents.eventType, "view")))
      .get(),

    // Total QR Scans
    db.select({ count: sql<number>`count(*)` })
      .from(schema.analyticsEvents)
      .where(and(dateFilter, eq(schema.analyticsEvents.eventType, "qr_scan")))
      .get(),

    // Unique Visitors
    db.select({ count: sql<number>`count(distinct visitor_hash)` })
      .from(schema.analyticsEvents)
      .where(dateFilter)
      .get(),

    // Device breakdown
    db.select({ device: schema.analyticsEvents.deviceType, count: sql<number>`count(*)` })
      .from(schema.analyticsEvents)
      .where(dateFilter)
      .groupBy(schema.analyticsEvents.deviceType)
      .all(),

    // Top referrers
    db.select({ referrer: schema.analyticsEvents.referrer, count: sql<number>`count(*)` })
      .from(schema.analyticsEvents)
      .where(and(dateFilter, sql`${schema.analyticsEvents.referrer} is not null`))
      .groupBy(schema.analyticsEvents.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(5)
      .all(),

    // Timeline raw data
    db.select({
      day: sql<string>`date(created_at / 1000, 'unixepoch')`,
      type: schema.analyticsEvents.eventType,
      count: sql<number>`count(*)`,
    })
      .from(schema.analyticsEvents)
      .where(dateFilter)
      .groupBy(sql`date(created_at / 1000, 'unixepoch')`, schema.analyticsEvents.eventType)
      .all(),
  ]);

  const totalViews = viewsRes?.count || 0;
  const totalQrScans = scansRes?.count || 0;
  const uniqueVisitors = uniqueRes?.count || 0;
  const deviceBreakdown = {
    mobile: devicesRaw.find((d) => d.device === "mobile")?.count || 0,
    desktop: devicesRaw.find((d) => d.device === "desktop")?.count || 0,
  };
  const referrers = referrersRaw.map((r) => ({ name: r.referrer || "Direct / Unknown", count: r.count }));
  const timelineData = buildTimeline(startDate, endDate, timelineRaw);

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";

  return (
    <AnalyticsClient
      tenant={tenant}
      totalViews={totalViews}
      totalQrScans={totalQrScans}
      uniqueVisitors={uniqueVisitors}
      deviceBreakdown={deviceBreakdown}
      referrers={referrers}
      timelineData={timelineData}
      rangeKey={rangeKey}
      customStart={customStart}
      customEnd={customEnd}
      lang={savedLang}
    />
  );
}

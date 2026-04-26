"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { getUser } from "./auth";
import { db } from "./db";
import { heartbeats, monitors, statusPages } from "./db/schema";

export async function createStatusPage(data: { name: string; slug: string }) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  await db.insert(statusPages).values(data).execute();
}

export async function getStatusPages() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  return db.select().from(statusPages).all();
}

export async function getStatusPage(slug: string) {
  let page = db
    .select()
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .get();

  if (!page) throw new Error("Status page not found");

  const monitorIds = page.monitors.split(",").filter(Boolean).map(Number);
  let monitorsData = db
    .select()
    .from(monitors)
    .where(inArray(monitors.id, monitorIds))
    .all();

  const uptimeData = db
    .select({
      monitorId: monitors.id,
      total: sql<number>`count(*)`,
      up: sql<number>`sum(case when ${heartbeats.status} = 'up' then 1 else 0 end)`,
    })
    .from(monitors)
    .leftJoin(heartbeats, eq(heartbeats.monitorId, monitors.id))
    .where(inArray(monitors.id, monitorIds))
    .groupBy(monitors.id)
    .all();

  const heartbeatsData = await Promise.all(
    monitorIds.map((id) =>
      db
        .select()
        .from(heartbeats)
        .where(eq(heartbeats.monitorId, id))
        .orderBy(sql`${heartbeats.timestamp} desc`)
        .limit(20)
        .all(),
    ),
  );

  return {
    ...page,
    monitorsData: monitorsData.map((m) => ({
      id: m.id,
      name: m.name,
      uptimePercentage:
        (uptimeData.find((u) => u.monitorId === m.id)?.up /
          uptimeData.find((u) => u.monitorId === m.id)?.total) *
          100 || 0,
      heartbeats: heartbeatsData.find((h) => h[0]?.monitorId === m.id) || [],
    })),
  };
}

export async function updateStatusPage(
  slug: string,
  data: Partial<typeof statusPages.$inferInsert>,
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const page = db
    .select()
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .get();

  if (!page) throw new Error("Status page not found");

  await db
    .update(statusPages)
    .set(data)
    .where(eq(statusPages.slug, slug))
    .execute();
}

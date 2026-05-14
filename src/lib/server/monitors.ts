"use server";

import { count, eq, sql } from "drizzle-orm";
import { getUser } from "./auth";
import { addMonitor, updateMonitor as updateMonitorChecker } from "./checker";
import { db } from "./db";
import { heartbeats, messages, monitors, statusPages } from "./db/schema";

export type MonitorData = {
  monitor: typeof monitors.$inferSelect;
  uptimePercentage: number;
  heartbeats: (typeof heartbeats.$inferSelect)[];
};

export async function createMonitor(data: {
  name: string;
  type: "http" | "ping";
  target: string;
  interval: number;
}) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = db.insert(monitors).values(data).returning().get();
  addMonitor(monitor);
}

export async function getMonitors(): Promise<MonitorData[]> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const allMonitors = db.select().from(monitors).all();

  return allMonitors.map((monitor) => {
    const stats = db
      .select({
        total: sql<number>`count(*)`,
        up: sql<number>`sum(case when ${heartbeats.status} = 'up' then 1 else 0 end)`,
      })
      .from(heartbeats)
      .where(eq(heartbeats.monitorId, monitor.id))
      .get() as { total: number; up: number };

    const latestHeartbeats = db
      .select()
      .from(heartbeats)
      .where(eq(heartbeats.monitorId, monitor.id))
      .orderBy(sql`${heartbeats.timestamp} desc`)
      .limit(20)
      .all()
      .toReversed();

    return {
      monitor,
      uptimePercentage: (stats.up / stats.total) * 100 || 0,
      heartbeats: latestHeartbeats,
    };
  });
}

export async function getMonitor(id: number): Promise<MonitorData> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!monitor) throw new Error("Monitor not found");

  const stats = db
    .select({
      total: sql<number>`count(*)`,
      up: sql<number>`sum(case when ${heartbeats.status} = 'up' then 1 else 0 end)`,
    })
    .from(heartbeats)
    .where(eq(heartbeats.monitorId, monitor.id))
    .get() as { total: number; up: number };

  const latestHeartbeats = db
    .select()
    .from(heartbeats)
    .where(eq(heartbeats.monitorId, monitor.id))
    .orderBy(sql`${heartbeats.timestamp} desc`)
    .limit(100)
    .all()
    .toReversed();

  return {
    monitor,
    uptimePercentage: (stats.up / stats.total) * 100 || 0,
    heartbeats: latestHeartbeats,
  };
}

export async function deleteMonitor(id: number) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!monitor) throw new Error("Monitor not found");

  await db.delete(monitors).where(eq(monitors.id, id)).execute();
  await db.delete(heartbeats).where(eq(heartbeats.monitorId, id)).execute();
  await db.delete(messages).where(eq(messages.monitorId, id)).execute();

  await db
    .update(statusPages)
    .set({
      monitors: sql`(
        SELECT COALESCE(json_group_array(value), '[]')
        FROM json_each(${statusPages.monitors})
        WHERE value != ${id}
      )`,
    })
    .where(
      sql`EXISTS (
        SELECT 1 FROM json_each(${statusPages.monitors}) WHERE value = ${id}
      )`,
    )
    .execute();
}

export async function updateMonitor(
  id: number,
  data: Partial<typeof monitors.$inferInsert>,
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!monitor) throw new Error("Monitor not found");

  await db.update(monitors).set(data).where(eq(monitors.id, id)).execute();

  let updatedMonitor = { ...monitor, ...data };
  updateMonitorChecker(updatedMonitor);
}

export async function getOverview(): Promise<{
  up: number;
  down: number;
  total: number;
  latestMessages: (typeof messages.$inferSelect & { monitorName: string })[];
}> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const [up, down, total, latestMessages] = await Promise.all([
    db
      .select({ count: count() })
      .from(monitors)
      .where(eq(monitors.status, "up"))
      .execute(),
    db
      .select({ count: count() })
      .from(monitors)
      .where(eq(monitors.status, "down"))
      .execute(),

    db.select({ count: count() }).from(monitors).execute(),

    db
      .select({
        ...messages,
        monitorName: monitors.name,
      })
      .from(messages)
      .innerJoin(monitors, eq(messages.monitorId, monitors.id))
      .orderBy(sql`${messages.timestamp} desc`)
      .limit(10)
      .all() as (typeof messages.$inferSelect & { monitorName: string })[],
  ]);

  return {
    up: up[0].count,
    down: down[0].count,
    total: total[0].count,
    latestMessages,
  };
}

"use server";

import { eq, sql } from "drizzle-orm";
import { getUser } from "./auth";
import { addMonitor } from "./checker";
import { db } from "./db";
import { heartbeats, monitors } from "./db/schema";

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
      .all();

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
    .all();

  return {
    monitor,
    uptimePercentage: (stats.up / stats.total) * 100 || 0,
    heartbeats: latestHeartbeats,
  };
}

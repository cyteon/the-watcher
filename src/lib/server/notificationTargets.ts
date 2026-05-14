"use server";

import { monitors, notificationTargets } from "./db/schema";
import { db } from "./db";
import { getUser } from "./auth";
import { eq, sql } from "drizzle-orm";

export async function getNotificationTargets(): Promise<
  (typeof notificationTargets.$inferSelect)[]
> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  return db.select().from(notificationTargets).all();
}

export async function createNotificationTarget(
  data: typeof notificationTargets.$inferInsert,
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  return db.insert(notificationTargets).values(data).returning().get();
}

export async function deleteNotificationTarget(id: number) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  db.delete(notificationTargets).where(eq(notificationTargets.id, id)).run();

  await db
    .update(monitors)
    .set({
      notify: sql`(
        SELECT COALESCE(json_group_array(value), '[]')
        FROM json_each(${monitors.notify})
        WHERE value != ${id}
      )`,
    })
    .where(
      sql`EXISTS (
        SELECT 1 FROM json_each(${monitors.notify}) WHERE value = ${id}
      )`,
    )
    .execute();
}

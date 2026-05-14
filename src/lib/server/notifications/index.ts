import { eq } from "drizzle-orm";
import { db } from "../db";
import { monitors, notificationTargets } from "../db/schema";
import sendSlackNotification from "./types/slack";

async function getNotifier(type: string) {
  switch (type) {
    case "slack":
      return sendSlackNotification;
    default:
      return undefined;
  }
}

export async function sendNotification(
  monitor: typeof monitors.$inferSelect,
  result: { status: string; ping: number; message: string },
) {
  for (const id of monitor.notify) {
    const target = db
      .select()
      .from(notificationTargets)
      .where(eq(notificationTargets.id, id))
      .get();

    if (!target) continue;

    const notifier = await getNotifier(target.type);
    if (!notifier) continue;

    await notifier(monitor, result, target.value);
  }
}

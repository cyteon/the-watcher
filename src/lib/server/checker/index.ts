import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { heartbeats, messages, monitors } from "../db/schema";
import { checkHttp } from "./types/http";

const timers: Map<number, Timer> = new Map();

async function getChecker(type: string) {
  switch (type) {
    case "http":
      return checkHttp;
    default:
      return undefined;
  }
}

export function initChecker() {
  const allMonitors = db.select().from(monitors).all();

  for (const monitor of allMonitors) {
    addMonitor(monitor);
  }
}

export function addMonitor(monitor: typeof monitors.$inferSelect) {
  if (timers.has(monitor.id)) return;
  checkMonitor(monitor);

  const timer = setInterval(() => {
    checkMonitor(monitor);
  }, monitor.interval * 1000);

  timers.set(monitor.id, timer);
}

export function removeMonitor(monitor: typeof monitors.$inferSelect) {
  if (!timers.has(monitor.id)) return;

  const timer = timers.get(monitor.id);
  clearInterval(timer);

  timers.delete(monitor.id);
}

export function updateMonitor(monitor: typeof monitors.$inferSelect) {
  if (timers.has(monitor.id)) {
    const timer = timers.get(monitor.id);
    clearInterval(timer);
  }

  checkMonitor(monitor);

  const timer = setInterval(() => {
    checkMonitor(monitor);
  }, monitor.interval * 1000);

  timers.set(monitor.id, timer);
}

async function checkMonitor(monitor: typeof monitors.$inferSelect) {
  if (monitor.paused) {
    db.insert(heartbeats)
      .values({
        monitorId: monitor.id,
        timestamp: Date.now(),
        status: "paused",
      })
      .run();

    return;
  }

  console.log(`Checking monitor ${monitor.name} (${monitor.type})`);

  var check = await getChecker(monitor.type);
  if (!check) return;

  let result: any;

  try {
    result = await check(monitor);
  } catch (e: any) {
    result = { status: "down", ping: 0, message: e.message };
  }

  db.insert(heartbeats)
    .values({
      monitorId: monitor.id,
      timestamp: Date.now(),
      status: result.status,
    })
    .run();

  const lastMessage = db
    .select()
    .from(messages)
    .where(eq(messages.monitorId, monitor.id))
    .orderBy(desc(messages.timestamp))
    .limit(1)
    .all();

  if (lastMessage.length === 0 || lastMessage[0].status !== result.status) {
    db.insert(messages)
      .values({
        monitorId: monitor.id,
        timestamp: Date.now(),
        message: result.message,
        status: result.status,
      })
      .run();
  }

  // todo: notify
}

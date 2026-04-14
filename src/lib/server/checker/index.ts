import { db } from "../db";
import { monitors } from "../db/schema";

const timers: Map<number, Timer> = new Map();

export function initChecker() {
  const allMonitors = db.select().from(monitors).all();

  for (const monitor of allMonitors) {
    addMonitor(monitor);
  }
}

export function addMonitor(monitor: typeof monitors.$inferInsert) {
  if (timers.has(monitor.id!)) return;
  checkMonitor(monitor);

  const timer = setInterval(() => {
    checkMonitor(monitor);
  }, monitor.interval * 1000);

  timers.set(monitor.id!, timer);
}

export function removeMonitor(monitor: typeof monitors.$inferInsert) {
  if (!timers.has(monitor.id!)) return;

  const timer = timers.get(monitor.id!);
  if (timer) clearInterval(timer);

  timers.delete(monitor.id!);
}

async function checkMonitor(monitor: typeof monitors.$inferInsert) {
  console.log(`Checking monitor ${monitor.name} (${monitor.type})`);
}

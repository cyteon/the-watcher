"use server";

import { getUser } from "./auth";
import { addMonitor } from "./checker";
import { db } from "./db";
import { monitors } from "./db/schema";

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

export async function getMonitors() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const allMonitors = db.select().from(monitors).all();

  return allMonitors.map((monitor) => ({
    monitor: monitor,
  }));
}

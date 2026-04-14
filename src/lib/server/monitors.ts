"use server";

import { addMonitor } from "./checker";
import { db } from "./db";
import { monitors } from "./db/schema";

export async function createMonitor(data: {
  name: string;
  type: "http" | "ping";
  target: string;
  interval: number;
}) {
  const monitor = db.insert(monitors).values(data).returning().get();
  addMonitor(monitor);
}

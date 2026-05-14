import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
});

export const monitors = sqliteTable("monitors", {
  id: integer("id").primaryKey(),
  status: text("status", {
    enum: ["up", "down", "pending", "paused"],
  }).default("pending"),

  name: text("name").notNull(),
  type: text("type", { enum: ["http", "ping"] }).notNull(),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),

  target: text("target").notNull(),
  interval: integer("interval").notNull(),

  // targets to notify
  notify: text("notify", { mode: "json" })
    .$type<number[]>()
    .notNull()
    .default([]),
});

export const heartbeats = sqliteTable("heartbeats", {
  id: integer("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  timestamp: integer("timestamp").notNull(),
  status: text("status", {
    enum: ["up", "down", "pending", "paused"],
  }).notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  timestamp: integer("timestamp").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["up", "down"] }).notNull(),
});

export const statusPages = sqliteTable("status_pages", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  monitors: text("monitors", { mode: "json" })
    .$type<number[]>()
    .notNull()
    .default([]),
});

export const notificationTargets = sqliteTable("notification_targets", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["slack"] }).notNull(),
  value: text("value").notNull(),
});

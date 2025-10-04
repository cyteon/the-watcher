import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    username: text("username").notNull().primaryKey(),
    password: text("password").notNull(),
});

export const tokens = pgTable("tokens", {
    token: text("token").notNull().primaryKey(),
    username: text("username").notNull().references(() => users.username, { onDelete: "cascade" }),
});

export const monitors = pgTable("monitors", {
    id: serial("id").primaryKey(),

    name: text("name").notNull(),
    url: text("url"),

    heartbeat_interval: integer("interval").notNull(),
    retries: integer("retries").notNull(),
    paused: boolean("paused").notNull().default(false),
});

export const heartbeats = pgTable("heartbeats", {
    id: serial("id").primaryKey(),
    monitor_id: integer("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
    timestamp: integer("timestamp").notNull(),
    status: text("status").notNull(),
    response_time: integer("response_time").notNull(),
});

export const statusUpdates = pgTable("status_updates", {
    id: serial("id").primaryKey(),
    monitor_id: integer("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
    timestamp: integer("timestamp").notNull(),
    status: text("status").notNull(),
    message: text("message").notNull(),
});

export const statusPages = pgTable("status_pages", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull().unique(),
});

export const statusPageMonitors = pgTable("status_page_monitors", {
    id: serial("id").primaryKey(),
    status_page_id: integer("status_page_id").notNull().references(() => statusPages.id, { onDelete: "cascade" }),
    monitor_id: integer("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
});
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

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
    retries : integer("retries").notNull(),
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
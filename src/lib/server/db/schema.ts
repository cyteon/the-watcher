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
  name: text("name").notNull(),
  type: text("type", { enum: ["http", "ping"] }).notNull(),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),

  target: text("target").notNull(),
  interval: integer("interval").notNull(),
});

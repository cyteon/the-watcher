import { pgTable, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    username: text("username").notNull().primaryKey(),
    password: text("password").notNull(),
});

export const tokens = pgTable("tokens", {
    token: text("token").notNull().primaryKey(),
    username: text("username").notNull(),
});
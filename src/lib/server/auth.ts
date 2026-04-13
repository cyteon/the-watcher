"use server";

import { getCookie, setCookie } from "@solidjs/start/http";
import bcrypt from "bcrypt";

import { db } from "./db";
import { sessions, users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const token = getCookie("token");

  if (!token) {
    return null;
  }

  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, token))
    .get();

  if (!session) {
    return null;
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) {
    return null;
  }

  return user;
}

export async function createUser(username: string, password: string) {
  const existingUser = db.select().from(users).get();

  if (existingUser) {
    // we only support 1 user
    throw new Error("A user already exists");
  }

  const hashed = await bcrypt.hash(password, 12);

  db.insert(users).values({ username, password: hashed }).run();
}

export async function loginUser(username: string, password: string) {
  const user = db.select().from(users).get();

  if (!user) {
    throw new Error("Wrong password or username");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error("Wrong password or username");
  }

  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes));

  setCookie("token", token);

  db.insert(sessions).values({ id: token, userId: user.id }).run();
}

"use server";

import { getCookie } from "@solidjs/start/http";
import bcrypt from "bcrypt";

import { db } from "./db";
import { users } from "./db/schema";

export async function getUser() {
  const token = getCookie("token");

  if (!token) {
    return null;
  }
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

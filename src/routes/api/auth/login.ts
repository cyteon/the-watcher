import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST({ request }) {
  const { username, password } = await request.json();

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const user = await db.get("SELECT * FROM Users WHERE username = ?", [
    username,
  ]);

  if (!user) {
    return new Response("Invalid username or password", { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return new Response("Invalid username or password", { status: 401 });
  }

  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes));

  await db.run("INSERT INTO Sessions (token, user_id) VALUES (?, ?)", [
    token,
    user.id,
  ]);

  return new Response(JSON.stringify({ token }), { status: 200 });
}

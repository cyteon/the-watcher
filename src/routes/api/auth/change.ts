import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

export async function POST({ request, params }) {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = auth.split(" ")[1];

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const session = await db.get("SELECT * FROM Sessions WHERE token = ?", [
    token,
  ]);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.get("SELECT * FROM Users WHERE id = ?", [
    session.user_id,
  ]);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { username, newPassword, oldPassword } = await request.json();

  if (username) {
    await db.run("UPDATE Users SET username = ? WHERE id = ?", [
      username,
      user.id,
    ]);
  }

  if (newPassword) {
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return new Response("Unauthorized", { status: 401 });
    }

    const password = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE Users SET password = ? WHERE id = ?", [
      password,
      user.id,
    ]);

    await db.run("DELETE FROM Sessions WHERE user_id = ?", [user.id]);
  }

  return new Response("User Updated", { status: 200 });
}

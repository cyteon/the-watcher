import sqlite3 from "sqlite3";
import { open } from "sqlite";

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

  const slug = params.slug;

  const { name, url, interval, webhook } = await request.json();

  if (name) {
    await db.run("UPDATE Monitors SET name = ? WHERE id = ?", [
      name,
      parseInt(slug),
    ]);
  }

  if (url) {
    await db.run("UPDATE Monitors SET url = ? WHERE id = ?", [
      url,
      parseInt(slug),
    ]);
  }

  if (interval) {
    await db.run("UPDATE Monitors SET interval = ? WHERE id = ?", [
      interval,
      parseInt(slug),
    ]);
  }

  if (webhook) {
    await db.run("UPDATE Monitors SET webhook = ? WHERE id = ?", [
      webhook,
      parseInt(slug),
    ]);
  }

  return new Response("Monitor Updated", { status: 200 });
}

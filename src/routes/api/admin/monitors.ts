import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function POST({ request }) {
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

  const { name, url, interval, webhook, _public, type } = await request.json();

  const res = await db.run(
    "INSERT INTO Monitors (name, url, interval, webhook, public, type) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
    [name, url, interval, webhook, _public, type],
  );

  if (type == "Server-Side Agent") {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes)).replace("/", "_");

    await db.run("INSERT INTO Agents (id, token) VALUES (?, ?)", [
      res.lastID,
      token,
    ]);
  }

  return new Response("Monitor added", { status: 200 });
}

export async function DELETE({ request }) {
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

  const { id } = await request.json();

  await db.run("DELETE FROM Monitors WHERE id = ?", [id]);
  await db.run("DELETE FROM Pings WHERE id = ?", [id]);
  await db.run("DELETE FROM Agents WHERE id = ?", [id]);

  return new Response("Monitor deleted", { status: 200 });
}

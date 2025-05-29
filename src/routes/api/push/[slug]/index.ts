import { open } from "sqlite";
import sqlite3 from "sqlite3";
import sendEmbed from "~/monitor/sendEmbed";

export async function GET({ params, request }) {
  const { slug } = params;

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const monitor = await db.get("SELECT * FROM Monitors WHERE url = ?", [slug]);

  if (!monitor) {
    return new Response("Not found", { status: 404 });
  }

  const status = searchParams.get("status");

  if (
    !status ||
    (status !== "up" && status !== "down" && status !== "degraded")
  ) {
    return new Response("Invalid status", { status: 400 });
  }

  await db.run(
    "INSERT INTO Pings (id, status, ping, code) VALUES (?, ?, ?, ?)",
    [monitor.id, status, searchParams.get("ping") || 0, 1],
  );

  sendEmbed(monitor, status, 0);

  return new Response("OK");
}

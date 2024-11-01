import { open } from "sqlite";
import sqlite3 from "sqlite3";

export async function GET({ params }) {
  const slug = params.slug;

  if (!slug) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const agent = await db.get("SELECT * FROM Agents WHERE token = ?", [slug]);

  if (!agent) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(null, { status: 200 });
}

export async function POST({ request, params }) {
  const slug = params.slug;

  if (!slug) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    ram_usage,
    ram_max,
    cpu_cores,
    cpu_usage,
    disk_capacity,
    disk_usage,
    load_avg,
    rx_bytes,
    tx_bytes,
  } = await request.json();

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const agent = await db.get("SELECT * FROM Agents WHERE token = ?", [slug]);

  if (!agent) {
    return new Response("Unauthorized", { status: 401 });
  }

  const monitor = await db.get("SELECT * FROM Monitors WHERE id = ?", [
    agent.id,
  ]);

  if (!monitor) {
    return new Response("Unauthorized", { status: 401 });
  }

  await db.run(
    "INSERT INTO Pings (id, code, status, ping, ram_usage, ram_max, cpu_cores, cpu_usage, disk_capacity, disk_usage, load_avg, rx_bytes, tx_bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      monitor.id,
      1,
      "up",
      0,
      ram_usage,
      ram_max,
      cpu_cores,
      cpu_usage,
      disk_capacity,
      disk_usage,
      load_avg,
      rx_bytes,
      tx_bytes,
    ],
  );

  console.log("Ping received from agent", agent.id);

  return new Response(null, { status: 200 });
}

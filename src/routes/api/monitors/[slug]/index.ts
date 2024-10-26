import { open } from "sqlite";
import sqlite3 from "sqlite3";
import YAML from "yaml";
import fs from "fs";

export async function GET({ params }) {
  const raw = fs.readFileSync("config.yaml").toString();
  const data = YAML.parse(raw);

  const slug = params.slug;

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const monitor = await db.get("SELECT * FROM Monitors WHERE id = ?", [
    parseInt(slug),
  ]);

  if (!monitor) {
    return new Response("Not found", { status: 404 });
  }

  if (!monitor.public) {
    return new Response("Unauthorized", { status: 401 });
  }

  var pings = await db.all(
    "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC limit 600",
    [monitor.id],
  );

  const avgPing = await db.get(
    "SELECT AVG(ping) as avg FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
    [monitor.id],
  );

  const uptime = await db.get(
    "SELECT COUNT(*) as up, (SELECT COUNT(*) FROM Pings WHERE id = ? AND status != 'paused' ) as total FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
    [monitor.id, monitor.id],
  );

  const percentage = (uptime.up / uptime.total) * 100;

  return new Response(
    JSON.stringify({
      name: monitor.name,
      interval: monitor.interval,
      paused: monitor.paused,
      id: monitor.id,
      avg_ping: avgPing.avg,
      uptime: percentage,
      heartbeats: pings,
      other: {
        title: data.title,
        description: data.description,
        footer: data.footer,
      },
    }),
    { status: 200 },
  );
}

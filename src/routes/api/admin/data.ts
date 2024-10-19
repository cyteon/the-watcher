import YAML from "yaml";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function GET({ request }) {
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

  const raw = fs.readFileSync("config.yaml").toString();
  const data = YAML.parse(raw);

  var monitors = [];

  for (var i = 0; i < data.monitors.length; i++) {
    var pings = await db.all(
      "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC limit 200",
      data.monitors[i].unique_id,
    );

    const avgPing = await db.get(
      "SELECT AVG(ping) as avg FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
      [data.monitors[i].unique_id],
    );

    const uptime = await db.get(
      "SELECT COUNT(*) as up, (SELECT COUNT(*) FROM Pings WHERE id = ? AND status != 'paused' ) as total FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
      [data.monitors[i].unique_id, data.monitors[i].unique_id],
    );

    const percentage = (uptime.up / uptime.total) * 100;

    monitors.push({
      ...data.monitors[i],
      avg_ping: avgPing.avg,
      uptime: percentage,
      heartbeats: pings,
    });
  }

  return {
    data: data,
    monitors: monitors,
  };
}

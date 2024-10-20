import YAML from "yaml";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function GET() {
  const raw = fs.readFileSync("config.yaml").toString();
  const data = YAML.parse(raw);

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  const monitors = await db.all("SELECT * FROM Monitors");
  var monitors_data = [];

  for (var i = 0; i < monitors.length; i++) {
    if (!monitors[i].public) {
      continue;
    }

    var pings = await db.all(
      "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC limit 100",
      monitors[i].id,
    );

    const avgPing = await db.get(
      "SELECT AVG(ping) as avg FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
      [monitors[i].id],
    );

    const uptime = await db.get(
      "SELECT COUNT(*) as up, (SELECT COUNT(*) FROM Pings WHERE id = ? AND status != 'paused' ) as total FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
      [monitors[i].id, monitors[i].id],
    );

    const percentage = (uptime.up / uptime.total) * 100;

    monitors_data.push({
      name: monitors[i].name,
      interval: monitors[i].interval,
      paused: monitors[i].paused,
      id: monitors[i].id,
      avg_ping: avgPing.avg,
      uptime: percentage,
      heartbeats: pings,
    });
  }

  return {
    title: data.title,
    description: data.description,
    footer: data.footer,
    alert: data.alert,
    online_statuses: data.onlineStatuses,
    monitors: monitors_data,
  };
}

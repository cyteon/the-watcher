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

  var monitors_data = [];
  const monitors = await db.all("SELECT * FROM Monitors");

  for (var i = 0; i < monitors.length; i++) {
    var pings = await db.all(
      "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC limit 200",
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

    const agent = await db.get("SELECT * FROM Agents WHERE id = ?", [
      monitors[i].id,
    ]);

    const logs = await db.all(
      "SELECT * FROM Logs WHERE id = ? ORDER BY time DESC",
      monitors[i].id,
    );

    const percentage = (uptime.up / uptime.total) * 100;

    monitors_data.push({
      ...monitors[i],
      avg_ping: avgPing.avg,
      uptime: percentage,
      heartbeats: pings,
      agent,
      logs,
    });
  }

  return {
    data: data,
    user: {
      username: user.username,
    },
    monitors: monitors_data,
  };
}

import YAML from "yaml";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function GET() {
  const raw = fs.readFileSync("config.yaml").toString();
  const data = YAML.parse(raw);

  var monitors = [];

  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  for (var i = 0; i < data.monitors.length; i++) {
    var pings = await db.all(
      "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC limit 100",
      data.monitors[i].unique_id,
    );

    monitors.push({
      name: data.monitors[i].name,
      interval: data.monitors[i].interval,
      paused: data.monitors[i].paused,
      heartbeats: pings,
    });
  }

  return {
    title: data.title,
    description: data.description,
    footer: data.footer,
    online_statuses: data.onlineStatuses,
    monitors: monitors,
  };
}

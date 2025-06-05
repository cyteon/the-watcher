import fs from "fs";
import YAML from "yaml";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

var db;
var data;

export default async function log(monitor, status, ping = 0, message = "") {
  if (!db) {
    db = await open({
      filename: "database.db",
      driver: sqlite3.Database,
    });

    await db.migrate({
      migrationsPath: "./migrations",
    });
  }

  if (!data) {
    const raw = fs.readFileSync("config.yaml").toString();
    data = YAML.parse(raw);
  }

  const lastStatus = await db.get(
    "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC LIMIT 1, 1",
    [monitor.id],
  );

  if (lastStatus == null) {
    return;
  }

  if (lastStatus.status == "degraded") {
    lastStatus.status = "up";
  }

  if (lastStatus.status == status) {
    return;
  }

  let genericMessage = status === "up" || status === "degraded"
    ? `Service is responding`
    : `Service is not responding`;

  await db.run(
    "INSERT INTO Logs (id, status, message) VALUES (?, ?, ?)",
    [monitor.id, status, message || genericMessage],
  );

  await sendEmbed(monitor, status, ping);
}

async function sendEmbed(monitor, status, ping = 0) {
  var payload = {
    username: data.title,
  };

  if (status === "up") {
    payload.embeds = [
      {
        title: `:white_check_mark: Service ${monitor.name} is online! :white_check_mark:`,
        timestamp: new Date().toISOString(),
        color: 0x4ade80,
        fields: [
          {
            name: "Monitor Type",
            value: `\`\`\`${monitor.type}\`\`\``,
            inline: true,
          },
          {
            name: "Ping",
            value: `\`\`\`${ping}ms\`\`\``,
            inline: false,
          },
        ],
      },
    ];
  } else {
    payload.embeds = [
      {
        title: `:x: Service ${monitor.name} is offline :x:`,
        timestamp: new Date().toISOString(),
        color: 0xf87171,
        fields: [
          {
            name: "Monitor Type",
            value: `\`\`\`${monitor.type}\`\`\``,
            inline: false,
          },
        ],
      },
    ];
  }

  if (monitor.webhook != null && monitor.webhook != "") {
    try {
      await fetch(monitor.webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(
        `Failed to send embed to webhook for ${monitor.name} | ${err}`,
      );
    }

    console.log(`Sent embed to webhook for ${monitor.name}`);
  }
}

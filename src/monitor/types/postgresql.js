import { Client } from "pg";
import sendEmbed from "../sendEmbed.js";

export default async function pingPostgreSQL(monitor, db, data) {
  const client = new Client({
    connectionString: monitor.url,
  });

  const start = Date.now();

  try {
    await client.connect();
    await client.query("SELECT 1");

    const ping = Date.now() - start;

    const avgPing = await db.get(
      "SELECT AVG(ping) as avg FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
      [monitor.id],
    );

    if (avgPing.avg != null) {
      if (ping > avgPing.avg * data.degradedMultipiler) {
        await db.run(
          "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
          [monitor.id, 0, "degraded", ping],
        );
      } else {
        await db.run(
          "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
          [monitor.id, 0, "up", ping],
        );
      }
    } else {
      await db.run(
        "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
        [monitor.id, 0, "up", ping],
      );
    }

    await sendEmbed(monitor, "up", ping);
    console.log(`Successfully pinged ${monitor.name}`);
  } catch (err) {
    console.error(`Failed to ping ${monitor.name}: ${err}`);

    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    await sendEmbed(monitor, "down");
  } finally {
    await client.end();
  }
}

import { MongoClient } from "mongodb";
import sendEmbed from "../sendEmbed.js";

export default async function pingMongoDB(monitor, db, data) {
  const client = new MongoClient(monitor.url);

  const start = Date.now();

  try {
    await client.connect();

    await client.db().command({ ping: 1 });

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
    console.log(`Successfully pinged ${monitor.url}`);
  } catch (err) {
    console.error(`Failed to ping ${monitor.url}: ${err}`);

    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    await sendEmbed(monitor, "down");
  }
}

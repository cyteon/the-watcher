import ping from "ping";
import log from "../log.js";

export default async function sendPing(monitor, db, data) {
  ping.promise.probe(monitor.url).then(async (res) => {
    if (res.alive) {
      console.log(`Successfully pinged ${monitor.name}`);
      const ping = res.time;

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

      await log(monitor, "up", ping);
    } else {
      console.error(`Failed to ping ${monitor.name}`);

      await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
        monitor.id,
        0,
        "down",
      ]);

      await log(monitor, "down", 0, "Ping failed: Host is unreachable");
    }
  });
}

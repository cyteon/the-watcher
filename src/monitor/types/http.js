import log from "../log.js";

export default async function pingHttp(monitor, db, data) {
  const start = Date.now();

  var okStatues = [];

  for (const range of data.okRanges) {
    for (let i = range.start; i <= range.end; i++) {
      okStatues.push(i);
    }
  }

  await fetch(monitor.url)
    .then(async (res) => {
      if (okStatues.includes(res.status)) {
        console.log(`Successfully pinged ${monitor.name}`);
        const ping = Date.now() - start;

        const avgPing = await db.get(
          "SELECT AVG(ping) as avg FROM Pings WHERE id = ? AND (status = 'up' OR status = 'degraded')",
          [monitor.id],
        );

        if (avgPing.avg != null) {
          if (ping > avgPing.avg * data.degradedMultipiler) {
            await db.run(
              "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
              [monitor.id, res.status, "degraded", ping],
            );
          } else {
            await db.run(
              "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
              [monitor.id, res.status, "up", ping],
            );
          }
        } else {
          await db.run(
            "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
            [monitor.id, res.status, "up", ping],
          );
        }

        await log(monitor, "up", ping, `Online with status code ${res.status} | ping: ${ping}ms`);
      } else {
        console.error(`Failed to ping ${monitor.name}`);

        await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
          monitor.id,
          res.status,
          "down",
        ]);

        await log(monitor, "down", 0, `Unexpected status code: ${res.status}`);
      }
    })
    .catch(async (err) => {
      console.error(`Failed to ping ${monitor.name}: ${err}`);

      await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
        monitor.id,
        0,
        "down",
      ]);

      await log(monitor, "down", 0, err.message || "Unknown error");
    });
}

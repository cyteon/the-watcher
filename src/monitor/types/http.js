import sendEmbed from "../sendEmbed.js";

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
        console.log(`Successfully pinged ${monitor.url}`);
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

        await sendEmbed(monitor, "up", ping);
      } else {
        console.error(`Failed to ping ${monitor.url}`);

        await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
          monitor.id,
          res.status,
          "down",
        ]);

        await sendEmbed(monitor, "down");
      }
    })
    .catch(async (err) => {
      console.error(`Failed to ping ${monitor.url}: ${err}`);

      await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
        monitor.id,
        0,
        "down",
      ]);

      await sendEmbed(monitor, "down");
    });
}

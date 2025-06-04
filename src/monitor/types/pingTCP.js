import net from "net";
import log from "../log.js";

export default async function pingTCP(monitor, db, data) {
  const socket = new net.Socket();
  const start = Date.now();

  socket.setTimeout(5000);

  socket.on("connect", async () => {
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

    socket.destroy();
  });

  socket.on("timeout", async () => {
    console.error(`Failed to ping ${monitor.name} (tcp timeout)`);

    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    await log(monitor, "down");

    socket.destroy();
  });

  socket.on("error", async (err) => {
    console.error(`Failed to ping ${monitor.name} (tcp error)`);

    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    await log(monitor, "down");

    socket.destroy();
  });

  const url = monitor.url.split(":")[0];
  const port = monitor.url.split(":")[1];

  try {
    socket.connect(port, url);
  } catch (err) {
    console.error(`Failed to ping ${monitor.name} (tcp connect error): ${err}`);

    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    await log(monitor, "down");
  }
}

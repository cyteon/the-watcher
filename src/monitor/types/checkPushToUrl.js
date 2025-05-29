import sendEmbed from "../sendEmbed.js";

export default async function checkPushToUrl(monitor, db) {
  const last_ping = await db.get(
    "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC LIMIT 1",
    [monitor.id],
  );

  if (last_ping == undefined) {
    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    await sendEmbed(monitor, "down");
    return;
  }

  if (
    new Date(
      new Date(last_ping.time).getTime() -
        new Date(last_ping.time).getTimezoneOffset() * 60000,
    ).getTime() +
      monitor.interval * 60000 +
      60000 <
    Date.now()
  ) {
    await db.run("INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)", [
      monitor.id,
      0,
      "down",
    ]);

    console.error(
      `Monitor with push url, ${monitor.name} (${monitor.id}) is not responding`,
    );

    await sendEmbed(monitor, "down");
  }
}

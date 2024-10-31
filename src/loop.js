import fs from "fs";
import YAML from "yaml";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import ping from "ping";
import { MongoClient } from "mongodb";
import net from "net";

export default async function start() {
  const db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  await db.migrate({
    migrationsPath: "./migrations",
  });

  const raw = fs.readFileSync("config.yaml").toString();
  const data = YAML.parse(raw);

  const coolDowns = [];

  function getCooldown(id) {
    coolDowns[id - 1] = coolDowns[id - 1] - 1;

    return coolDowns[id - 1];
  }

  var okStatues = [];

  for (const range of data.okRanges) {
    for (let i = range.start; i <= range.end; i++) {
      okStatues.push(i);
    }
  }

  async function sendEmbed(monitor, status, ping = 0) {
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
      await fetch(monitor.webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`Sent embed to webhook for ${monitor.name}`);
    }
  }

  setInterval(async () => {
    const monitors = await db.all("SELECT * FROM Monitors");

    for (const monitor of monitors) {
      console.log(`Checking monitor ${monitor.name}`);

      if (monitor.paused) {
        console.log(`Monitor ${monitor.name} is paused`);

        await db.run(
          "INSERT INTO Pings (id, code, status, ping) VALUES (?, ?, ?, ?)",
          [monitor.id, -1, "paused", 0],
        );

        continue;
      }

      if (coolDowns[monitor.id - 1] == null) {
        coolDowns[monitor.id - 1] = 0;
      }

      if (getCooldown(monitor.id) <= 0) {
        console.log(`Pinging ${monitor.url}`);

        coolDowns[monitor.id - 1] = monitor.interval;

        const start = Date.now();

        if (monitor.type == "HTTP(s)") {
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

                await db.run(
                  "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
                  [monitor.id, res.status, "down"],
                );

                await sendEmbed(monitor, "down");
              }
            })
            .catch(async (err) => {
              console.error(`Failed to ping ${monitor.url}: ${err}`);

              await db.run(
                "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
                [monitor.id, 0, "down"],
              );

              await sendEmbed(monitor, "down");
            });
        } else if (monitor.type == "Ping") {
          ping.promise.probe(monitor.url).then(async (res) => {
            if (res.alive) {
              console.log(`Successfully pinged ${monitor.url}`);
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

              await sendEmbed(monitor, "up", ping);
            } else {
              console.error(`Failed to ping ${monitor.url}`);

              await db.run(
                "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
                [monitor.id, 0, "down"],
              );

              await sendEmbed(monitor, "down");
            }
          });
        } else if (monitor.type == "TCP") {
          const socket = new net.Socket();

          socket.setTimeout(5000);

          socket.on("connect", async () => {
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

            socket.destroy();
          });

          socket.on("timeout", async () => {
            console.error(`Failed to ping ${monitor.url} (tcp timeout)`);

            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

            await sendEmbed(monitor, "down");

            socket.destroy();
          });

          socket.on("error", async (err) => {
            console.error(`Failed to ping ${monitor.url} (tcp error)`);

            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

            await sendEmbed(monitor, "down");

            socket.destroy();
          });

          const url = monitor.url.split(":")[0];
          const port = monitor.url.split(":")[1];

          socket.connect(port, url);
        } else if (monitor.type == "MongoDB") {
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

            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

            await sendEmbed(monitor, "down");
          }
        } else if (monitor.type == "Server-Side Agent") {
          const last_ping = await db.get(
            "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC LIMIT 1",
            [monitor.id],
          );

          if (last_ping == undefined) {
            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

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
            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

            console.error(`Agent for ${monitor.id} is not responding`);

            await sendEmbed(monitor, "down");
          }
        } else if (monitor.type == "Push to URL") {
          const last_ping = await db.get(
            "SELECT * FROM Pings WHERE id = ? ORDER BY time DESC LIMIT 1",
            [monitor.id],
          );

          if (last_ping == undefined) {
            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

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
            await db.run(
              "INSERT INTO Pings (id, code, status) VALUES (?, ?, ?)",
              [monitor.id, 0, "down"],
            );

            console.error(`Agent for ${monitor.id} is not responding`);

            await sendEmbed(monitor, "down");
          }
        }
      }
    }
  }, 60000);
}

import fs from "fs";
import YAML from "yaml";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import pingHttp from "./types/http.js";
import sendPing from "./types/ping.js";
import pingTCP from "./types/pingTCP.js";
import pingMongoDB from "./types/mongoDB.js";
import checkServerSideAgent from "./types/serverSideAgent.js";
import checkPushToUrl from "./types/checkPushToUrl.js";
import pingPostgreSQL from "./types/postgresql.js";

var db;
var data;

export default async function start() {
  db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });

  await db.migrate({
    migrationsPath: "./migrations",
  });

  const raw = fs.readFileSync("config.yaml").toString();
  data = YAML.parse(raw);

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

        if (monitor.type == "HTTP(s)") {
          pingHttp(monitor, db, data);
        } else if (monitor.type == "Ping") {
          sendPing(monitor, db, data);
        } else if (monitor.type == "TCP") {
          pingTCP(monitor, db, data);
        } else if (monitor.type == "MongoDB") {
          pingMongoDB(monitor, db, data);
        } else if (monitor.type == "Server-Side Agent") {
          checkServerSideAgent(monitor, db);
        } else if (monitor.type == "Push to URL") {
          checkPushToUrl(monitor, db);
        } else if (monitor.type == "PostgreSQL") {
          pingPostgreSQL(monitor, db, data);
        } else {
          console.error(`Unknown monitor type: ${monitor.type}`);
        }
      }
    }
  }, 60000);
}

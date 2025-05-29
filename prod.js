import { spawn, spawnSync } from "child_process";

spawnSync("npm", ["run", "build"], { stdio: "inherit" });
const prodProcess = spawn("npm", ["run", "start"], { stdio: "inherit" });

import start from "./src/monitor/loop.js";
await start();

prodProcess.on("close", (code) => {
  console.log(`Prod process exited with code ${code}`);
});

prodProcess.on("error", (error) => {
  console.error("Error running npm command:", error.message);
});

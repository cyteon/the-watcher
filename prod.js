import { spawn, spawnSync } from "child_process";

spawnSync("npm", ["run", "build"], { stdio: "inherit" });
const devProcess = spawn("npm", ["run", "start"], { stdio: "inherit" });

import start from "./src/loop.js";
await start();

devProcess.on("close", (code) => {
  console.log(`Dev process exited with code ${code}`);
});

devProcess.on("error", (error) => {
  console.error("Error running npm command:", error.message);
});

import { spawn } from "child_process";

const devProcess = spawn("npm", ["run", "dev"], { stdio: "inherit" });

import start from "./src/loop.js";
await start();

devProcess.on("close", (code) => {
  console.log(`Dev process exited with code ${code}`);
});

devProcess.on("error", (error) => {
  console.error("Error running npm command:", error.message);
});

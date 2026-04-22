import ping from "ping";
import { monitors } from "../../db/schema";

export async function checkPing(monitor: typeof monitors.$inferSelect) {
  const start = Date.now();

  try {
    console.log(monitor);

    const response = await ping.promise.probe(monitor.target);

    console.log(response);

    if (response.alive) {
      return {
        status: "up",
        ping: Date.now() - start,
        message: "host is alive",
      };
    } else {
      return {
        status: "down",
        ping: Date.now() - start,
        message: "host is not alive",
      };
    }
  } catch (error) {
    return {
      status: "down",
      ping: Date.now() - start,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

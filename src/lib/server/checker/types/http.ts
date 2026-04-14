import { monitors } from "../../db/schema";

export async function checkHttp(monitor: typeof monitors.$inferSelect) {
  const start = Date.now();

  try {
    const response = await fetch(monitor.target);

    if (!response.ok) {
      return {
        status: "down",
        ping: Date.now() - start,
        message: `DOWN - ${response.status} ${response.statusText}`,
      };
    }

    return {
      status: "up",
      ping: Date.now() - start,
      message: `UP - ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      status: "down",
      ping: Date.now() - start,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

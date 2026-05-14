import { monitors } from "../../db/schema";

export default async function sendSlackNotification(
  monitor: typeof monitors.$inferSelect,
  result: { status: string; ping: number; message: string },
  target: string, // webhook url
) {
  const status_emoji = result.status === "up" ? "✅" : "❌";

  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Monitor: *${monitor.name}*\nStatus: *${status_emoji} ${result.status.toUpperCase()}*\nMessage: *${result.message}*`,
        },
      },
    ],
  };

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Failed to send Slack notification: ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`Error sending Slack notification: ${error}`);
  }
}
